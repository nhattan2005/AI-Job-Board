const db = require('../config/database');
const { createNotification } = require('./notificationController');

// Send Interview Invitation
const sendInterviewInvitation = async (req, res) => {
    try {
        const employerId = req.user.id;
        // 👇 LẤY THÊM CÁC TRƯỜNG location, meetingLink, notes, duration TỪ BODY
        const { applicationId, timeSlots, location, meetingLink, notes, duration } = req.body;

        // Validate
        if (!applicationId || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
            return res.status(400).json({ error: 'Application ID and time slots are required' });
        }

        // 1. Get application details & Verify ownership
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

        // 2. Create interview OR Update if exists (Upsert)
        // 👇 CẬP NHẬT: Thêm location, meeting_link, notes, duration_minutes vào câu lệnh INSERT và UPDATE
        const interviewResult = await db.query(
            `INSERT INTO interviews (
                application_id, job_id, employer_id, candidate_id, status, 
                location, meeting_link, notes, duration_minutes
            )
             VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
             ON CONFLICT (application_id) 
             DO UPDATE SET 
                status = 'pending',
                location = $5,
                meeting_link = $6,
                notes = $7,
                duration_minutes = $8,
                updated_at = CURRENT_TIMESTAMP
             RETURNING id`,
            [
                applicationId, 
                application.job_id, 
                employerId, 
                application.candidate_id,
                location,       // $5
                meetingLink,    // $6
                notes,          // $7
                duration        // $8
            ]
        );

        const interviewId = interviewResult.rows[0].id;

        // 3. Xóa các slot cũ
        await db.query('DELETE FROM interview_time_slots WHERE interview_id = $1', [interviewId]);

        // 4. Insert time slots mới
        for (const slot of timeSlots) {
            await db.query(
                `INSERT INTO interview_time_slots (interview_id, slot_date) 
                 VALUES ($1, $2)`,
                [interviewId, slot] 
            );
        }

        // 5. Update application status
        await db.query(
            `UPDATE applications SET status = 'interviewing' WHERE id = $1`,
            [applicationId]
        );

        // 6. Send notification
        try {
            await createNotification(
                application.candidate_id,
                'interview_invite',
                '📅 Interview Invitation',
                `You have been invited to interview for ${application.title}`,
                `/interview/schedule/${applicationId}`
            );
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

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

        // 👇 LẤY NGÀY CỦA SLOT ĐƯỢC CHỌN
        const slotResult = await db.query(
            'SELECT slot_date FROM interview_time_slots WHERE id = $1 AND interview_id = $2',
            [slotId, interview.id]
        );

        if (slotResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid time slot' });
        }
        const selectedDate = slotResult.rows[0].slot_date;

        // Update slot selection
        await db.query(
            `UPDATE interview_time_slots 
             SET is_selected = true 
             WHERE id = $1`,
            [slotId]
        );

        // 👇 CẬP NHẬT interview_date VÀO BẢNG interviews
        await db.query(
            `UPDATE interviews 
             SET status = 'scheduled', 
                 interview_date = $2, 
                 confirmed_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [interview.id, selectedDate]
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
                -- 👇 TỰ ĐỘNG LẤY NGÀY TỪ SLOT NẾU interview_date NULL
                COALESCE(i.interview_date, (SELECT slot_date FROM interview_time_slots WHERE interview_id = i.id AND is_selected = true LIMIT 1)) as interview_date,
                i.duration_minutes,
                i.location,
                i.meeting_link,
                i.notes,
                j.id as job_id,
                j.title as job_title,
                u.company_name,
                u.email as employer_email,
                u.avatar_url as employer_avatar
             FROM interviews i
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.employer_id = u.id
             WHERE i.candidate_id = $1
               AND COALESCE(u.is_banned, false) = false
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
                -- 👇 TỰ ĐỘNG LẤY NGÀY TỪ SLOT NẾU interview_date NULL
                COALESCE(i.interview_date, (SELECT slot_date FROM interview_time_slots WHERE interview_id = i.id AND is_selected = true LIMIT 1)) as interview_date,
                i.duration_minutes,
                i.location,
                i.meeting_link,
                j.id as job_id,
                j.title as job_title,
                u.full_name as candidate_name,
                u.email as candidate_email,
                u.avatar_url as candidate_avatar
             FROM interviews i
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.candidate_id = u.id
             WHERE i.employer_id = $1
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

        const query = `
            SELECT 
                i.id, 
                i.application_id, 
                i.status, 
                i.location, 
                i.meeting_link, 
                i.notes, 
                i.duration_minutes,
                j.title as job_title, 
                COALESCE(u.company_name, u.full_name) as company_name,
                u.email as employer_email,
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', s.id,
                            'slot_date', s.slot_date,
                            'is_selected', s.is_selected
                        ) ORDER BY s.slot_date ASC
                    )
                    FROM interview_time_slots s
                    WHERE s.interview_id = i.id
                ) as time_slots
            FROM interviews i
            JOIN jobs j ON i.job_id = j.id
            JOIN users u ON i.employer_id = u.id
            WHERE i.application_id = $1
        `;

        const result = await db.query(query, [applicationId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get interview by application error:', error);
        res.status(500).json({ error: 'Failed to fetch interview details' });
    }
};

module.exports = {
    sendInterviewInvitation,
    confirmInterviewSlot,
    getCandidateInterviews,
    getEmployerInterviews,
    getInterviewByApplication
};