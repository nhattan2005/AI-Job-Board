const db = require('../config/database');
const { createNotification } = require('./notificationController');

// Send Interview Invitation
const sendInterviewInvitation = async (req, res) => {
    try {
        const employerId = req.user.id;
        const { applicationId, slots } = req.body;

        if (!applicationId || !slots || !Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ error: 'applicationId and slots are required' });
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

        // Insert interview
        const result = await db.query(
            `INSERT INTO interviews (application_id, job_id, employer_id, candidate_id, status, proposed_slots)
             VALUES ($1, $2, $3, $4, 'pending', $5)
             RETURNING id`,
            [applicationId, jobId, employerId, candidateId, JSON.stringify(slots)]
        );

        const interviewId = result.rows[0].id;

        // Update application status
        await db.query(
            'UPDATE applications SET status = $1 WHERE id = $2',
            ['interview_scheduled', applicationId]
        );

        // Create notification
        await createNotification(
            candidateId,
            'interview_invite',
            '📅 Interview Invitation',
            `You have been invited for an interview for ${jobTitle} at ${companyName}`,
            `/interview/schedule/${applicationId}`
        );

        res.json({ 
            message: 'Interview invitation sent',
            interviewId 
        });
    } catch (error) {
        console.error('Send invitation error:', error);
        res.status(500).json({ error: 'Failed to send interview invitation' });
    }
};

// Confirm Interview Slot
const confirmInterviewSlot = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { slotId } = req.body;
        const candidateId = req.user.id;

        if (!slotId) {
            return res.status(400).json({ error: 'slotId is required' });
        }

        // Get interview
        const interviewCheck = await db.query(
            `SELECT i.id, i.proposed_slots, i.employer_id, i.job_id, j.title, u.company_name, u2.full_name as candidate_name
             FROM interviews i
             JOIN jobs j ON i.job_id = j.id
             JOIN users u ON i.employer_id = u.id
             JOIN users u2 ON i.candidate_id = u2.id
             WHERE i.application_id = $1 AND i.candidate_id = $2`,
            [applicationId, candidateId]
        );

        if (interviewCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found or unauthorized' });
        }

        const interview = interviewCheck.rows[0];
        const slots = interview.proposed_slots;
        const selectedSlot = slots.find(s => s.id === slotId);

        if (!selectedSlot) {
            return res.status(400).json({ error: 'Invalid slot ID' });
        }

        // Update interview
        await db.query(
            `UPDATE interviews 
             SET confirmed_slot = $1, status = 'confirmed', updated_at = CURRENT_TIMESTAMP
             WHERE application_id = $2`,
            [JSON.stringify(selectedSlot), applicationId]
        );

        // Update application status
        await db.query(
            'UPDATE applications SET status = $1 WHERE id = $2',
            ['interview_confirmed', applicationId]
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

module.exports = {
    sendInterviewInvitation,
    confirmInterviewSlot,
    getCandidateInterviews,
    getEmployerInterviews
};