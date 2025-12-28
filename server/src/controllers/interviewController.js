const db = require('../config/database');
const { createNotification } = require('./notificationController');

// Send Interview Invitation
const sendInterviewInvitation = async (req, res) => {
    try {
        const employerId = req.user.id;
        const { applicationId, timeSlots } = req.body;

        // Validate
        if (!applicationId || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
            return res.status(400).json({ error: 'Application ID and time slots are required' });
        }

        // Get application details
        const appResult = await db.query(
            `SELECT a.id, a.job_id, a.candidate_id, j.title, u.full_name as candidate_name
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN users u ON a.candidate_id = u.id
             WHERE a.id = $1 AND j.employer_id = $2`,
            [applicationId, employerId]
        );

        if (appResult.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found or unauthorized' });
        }

        const application = appResult.rows[0];

        // Create interview
        const interviewResult = await db.query(
            `INSERT INTO interviews (application_id, job_id, employer_id, candidate_id, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING id`,
            [applicationId, application.job_id, employerId, application.candidate_id]
        );

        const interviewId = interviewResult.rows[0].id;

        // Insert time slots
        for (const slot of timeSlots) {
            await db.query(
                `INSERT INTO interview_time_slots (interview_id, slot_date) 
                 VALUES ($1, $2)`,
                [interviewId, slot.datetime] // 👈 slot.datetime chứa timestamp
            );
        }

        // Create notification
        await createNotification(
            application.candidate_id,
            'interview_invite',
            '📅 Interview Invitation',
            `You have been invited to interview for ${application.title}`,
            `/interview/schedule/${interviewId}`
        );

        // Update application status
        await db.query(
            `UPDATE applications SET status = 'interviewing' WHERE id = $1`,
            [applicationId]
        );

        res.status(201).json({
            message: 'Interview invitation sent successfully',
            interviewId
        });

    } catch (error) {
        console.error('Send interview invitation error:', error);
        res.status(500).json({ error: 'Failed to send interview invitation' });
    }
};

// Confirm Interview Slot
const confirmInterviewSlot = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { slotId } = req.body;
        const { applicationId } = req.params;

        if (!slotId) {
            return res.status(400).json({ error: 'Slot ID is required' });
        }

        // Get interview details
        const interviewResult = await db.query(
            `SELECT i.id, i.employer_id, j.id as job_id, j.title, u.full_name as candidate_name
             FROM interviews i
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.candidate_id = u.id
             WHERE i.application_id = $1 AND i.candidate_id = $2`,
            [applicationId, candidateId]
        );

        if (interviewResult.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const interview = interviewResult.rows[0];

        // 👇 SỬA: is_confirmed = true → is_selected = true
        await db.query(
            `UPDATE interview_time_slots 
             SET is_selected = true 
             WHERE id = $1 AND interview_id = $2`,
            [slotId, interview.id]
        );

        // Update interview status
        await db.query(
            `UPDATE interviews SET status = 'scheduled' WHERE id = $1`,
            [interview.id]
        );

        // Notification for employer
        await createNotification(
            interview.employer_id,
            'interview_confirmed',
            '✅ Interview Confirmed',
            `${interview.candidate_name} has confirmed interview for ${interview.title}`,
            `/employer/jobs/${interview.job_id}/applications`
        );

        // Notification for candidate
        await createNotification(
            candidateId,
            'interview_confirmed',
            '✅ Interview Confirmed',
            `Your interview for ${interview.title} has been confirmed`,
            `/my-interviews`
        );

        res.json({ message: 'Interview slot confirmed successfully' });

    } catch (error) {
        console.error('Confirm interview slot error:', error);
        res.status(500).json({ error: 'Failed to confirm interview slot' });
    }
};

// Get candidate's interviews
const getCandidateInterviews = async (req, res) => {
    try {
        const candidateId = req.user.id;

        const result = await db.query(
            `SELECT 
                i.id,
                i.application_id,
                i.status,
                i.created_at,
                j.id as job_id,
                j.title as job_title,
                u.company_name,
                u.email as employer_email,
                u.avatar_url as employer_avatar,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', its.id,
                            'slot_date', its.slot_date,
                            'is_selected', its.is_selected
                        ) ORDER BY its.slot_date
                    ) FILTER (WHERE its.id IS NOT NULL),
                    '[]'::json
                ) as time_slots
             FROM interviews i
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.employer_id = u.id
             LEFT JOIN interview_time_slots its ON its.interview_id = i.id
             WHERE i.candidate_id = $1
               AND COALESCE(u.is_banned, false) = false
             GROUP BY i.id, j.id, u.company_name, u.email, u.avatar_url
             ORDER BY i.created_at DESC`,
            [candidateId]
        );

        res.json({ interviews: result.rows });
    } catch (error) {
        console.error('Get candidate interviews error:', error);
        res.status(500).json({ error: 'Failed to get interviews' });
    }
};

// Get employer's interviews
const getEmployerInterviews = async (req, res) => {
    try {
        const employerId = req.user.id;

        const result = await db.query(
            `SELECT 
                i.id,
                i.application_id,
                i.status,
                i.created_at,
                j.id as job_id,
                j.title as job_title,
                u.full_name as candidate_name,
                u.email as candidate_email,
                u.avatar_url as candidate_avatar,
                -- 👇 SỬA: is_confirmed → is_selected
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', its.id,
                            'slot_date', its.slot_date,
                            'is_selected', its.is_selected
                        ) ORDER BY its.slot_date
                    ) FILTER (WHERE its.id IS NOT NULL),
                    '[]'::json
                ) as time_slots
             FROM interviews i
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.candidate_id = u.id
             LEFT JOIN interview_time_slots its ON its.interview_id = i.id
             WHERE i.employer_id = $1
             GROUP BY i.id, j.id, u.full_name, u.email, u.avatar_url
             ORDER BY i.created_at DESC`,
            [employerId]
        );

        res.json({ interviews: result.rows });
    } catch (error) {
        console.error('Get employer interviews error:', error);
        res.status(500).json({ error: 'Failed to get interviews' });
    }
};

// Get interview details by application ID
const getInterviewByApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const candidateId = req.user.id;

        const result = await db.query(
            `SELECT 
                i.id,
                i.application_id,
                i.status,
                i.proposed_slots,
                i.confirmed_slot,
                i.duration_minutes,
                i.location,
                i.meeting_link,
                i.notes,
                i.created_at,
                j.id as job_id,
                j.title as job_title,
                u.company_name,
                u.email as employer_email
             FROM interviews i
             JOIN applications a ON i.application_id = a.id
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.employer_id = u.id
             WHERE i.application_id = $1 
               AND a.candidate_id = $2
               AND COALESCE(u.is_banned, false) = false`,
            [applicationId, candidateId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get interview by application error:', error);
        res.status(500).json({ error: 'Failed to get interview' });
    }
};

module.exports = {
    sendInterviewInvitation,
    confirmInterviewSlot,
    getCandidateInterviews,
    getEmployerInterviews,
    getInterviewByApplication
};