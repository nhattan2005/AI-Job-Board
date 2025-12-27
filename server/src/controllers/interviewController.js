const db = require('../config/database');
const { createNotification } = require('./notificationController');

// Send Interview Invitation
const sendInterviewInvitation = async (req, res) => {
    try {
        const employerId = req.user.id;
        const { applicationId, timeSlots, location, meetingLink, notes, duration } = req.body;

        console.log('📩 Sending interview invitation:', { applicationId, timeSlots, location, duration });

        if (!applicationId || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
            return res.status(400).json({ error: 'applicationId and timeSlots are required' });
        }

        // Check if application exists
        const applicationCheck = await db.query(
            `SELECT a.id, a.candidate_id, a.job_id, j.title, j.employer_id, u.company_name
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN users u ON j.employer_id = u.id
             WHERE a.id = $1 AND j.employer_id = $2`,
            [applicationId, employerId]
        );

        if (applicationCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found or unauthorized' });
        }

        const { candidate_id: candidateId, job_id: jobId, title: jobTitle, company_name: companyName } = applicationCheck.rows[0];

        // Check if already sent
        const existingInterview = await db.query(
            'SELECT id FROM interviews WHERE application_id = $1',
            [applicationId]
        );

        if (existingInterview.rows.length > 0) {
            return res.status(400).json({ error: 'Interview invitation already sent' });
        }

        // Đảm bảo các giá trị không bị undefined
        const safeTimeSlots = JSON.stringify(timeSlots);
        const safeDuration = duration || 60;
        const safeLocation = location || 'Online';
        const safeMeetingLink = meetingLink || null;
        const safeNotes = notes || null;

        console.log('💾 Inserting interview with data:', {
            applicationId,
            jobId,
            employerId,
            candidateId,
            timeSlots: safeTimeSlots,
            duration: safeDuration,
            location: safeLocation
        });

        // Insert interview
        const result = await db.query(
            `INSERT INTO interviews (
                application_id, 
                job_id, 
                employer_id, 
                candidate_id, 
                status, 
                proposed_slots,
                duration_minutes,
                location,
                meeting_link,
                notes
             )
             VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9)
             RETURNING id`,
            [
                applicationId, 
                jobId, 
                employerId, 
                candidateId, 
                safeTimeSlots,
                safeDuration,
                safeLocation,
                safeMeetingLink,
                safeNotes
            ]
        );

        const interviewId = result.rows[0].id;
        console.log('✅ Interview created with ID:', interviewId);

        // Update application status
        await db.query(
            'UPDATE applications SET status = $1 WHERE id = $2',
            ['interview_scheduled', applicationId]
        );

        // Create notification (non-critical)
        try {
            await createNotification(
                candidateId,
                'interview_invite',
                '📅 Interview Invitation',
                `You have been invited for an interview for ${jobTitle} at ${companyName}`,
                `/interview/schedule/${applicationId}`
            );
            console.log('✅ Notification sent');
        } catch (notifError) {
            console.error('⚠️ Failed to send notification (non-critical):', notifError.message);
            // Không throw error vì notification không quan trọng bằng việc tạo interview
        }

        res.json({ 
            message: 'Interview invitation sent',
            interviewId 
        });
    } catch (error) {
        console.error('❌ Send invitation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to send interview invitation',
            details: error.message
        });
    }
};

// Confirm Interview Slot
const confirmInterviewSlot = async (req, res) => {
    try {
        // 👇 SỬA: Lấy từ body thay vì params
        const { interviewId, slotId } = req.body;
        const candidateId = req.user.id;

        if (!interviewId || slotId === undefined) {
            return res.status(400).json({ error: 'interviewId and slotId are required' });
        }

        // Get interview
        const interviewCheck = await db.query(
            `SELECT i.id, i.proposed_slots, i.employer_id, i.job_id, j.title, u.company_name, u2.full_name as candidate_name
             FROM interviews i
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.employer_id = u.id
             JOIN users u2 ON i.candidate_id = u2.id
             WHERE i.id = $1 AND i.candidate_id = $2`,
            [interviewId, candidateId]
        );

        if (interviewCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found or unauthorized' });
        }

        const interview = interviewCheck.rows[0];
        let slots;
        try {
            slots = JSON.parse(interview.proposed_slots);
        } catch (err) {
            return res.status(500).json({ error: 'Invalid slots data' });
        }

        if (!slots[slotId]) {
            return res.status(400).json({ error: 'Invalid slot ID' });
        }

        const selectedSlot = {
            id: slotId,
            datetime: slots[slotId]
        };

        // Update interview
        await db.query(
            `UPDATE interviews 
             SET confirmed_slot = $1, status = 'confirmed', updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [JSON.stringify(selectedSlot), interviewId]
        );

        // Update application status
        const appResult = await db.query(
            'SELECT id FROM applications WHERE id = (SELECT application_id FROM interviews WHERE id = $1)',
            [interviewId]
        );
        
        if (appResult.rows.length > 0) {
            await db.query(
                'UPDATE applications SET status = $1 WHERE id = $2',
                ['interview_confirmed', appResult.rows[0].id]
            );
        }

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

        res.json({ message: 'Interview time confirmed' });
    } catch (error) {
        console.error('Confirm interview error:', error);
        res.status(500).json({ error: 'Failed to confirm interview' });
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
                i.proposed_slots,
                i.confirmed_slot,
                i.created_at,
                j.id as job_id,
                j.title as job_title,
                j.location,
                u.company_name,
                u.avatar_url
             FROM interviews i
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.employer_id = u.id
             WHERE i.candidate_id = $1
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
                i.proposed_slots,
                i.confirmed_slot,
                i.created_at,
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
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.employer_id = u.id
             WHERE i.application_id = $1 AND i.candidate_id = $2`,
            [applicationId, candidateId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const interview = result.rows[0];
        
        // Parse proposed_slots và format thành array of objects
        let timeSlots = [];
        try {
            const slots = JSON.parse(interview.proposed_slots);
            timeSlots = slots.map((slot, index) => ({
                id: index,
                datetime: slot,
                is_selected: interview.confirmed_slot && JSON.parse(interview.confirmed_slot).id === index
            }));
        } catch (err) {
            console.error('Error parsing slots:', err);
        }

        res.json({
            interview: {
                ...interview,
                timeSlots
            }
        });
    } catch (error) {
        console.error('Get interview by application error:', error);
        res.status(500).json({ error: 'Failed to get interview details' });
    }
};

module.exports = {
    sendInterviewInvitation,
    confirmInterviewSlot,
    getCandidateInterviews,
    getEmployerInterviews,
    getInterviewByApplication
};