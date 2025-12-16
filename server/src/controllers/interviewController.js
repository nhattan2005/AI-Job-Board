const db = require('../config/database');

// Employer gửi lời mời phỏng vấn
const sendInterviewInvitation = async (req, res) => {
    const { applicationId, timeSlots, location, meetingLink, notes, duration } = req.body;
    const employer_id = req.user.id;

    try {
        // Kiểm tra application có thuộc về employer không
        const appCheck = await db.query(`
            SELECT a.id, a.job_id, a.candidate_id, a.status,
                   j.title as job_title,
                   u.email as candidate_email, u.full_name as candidate_name
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.candidate_id = u.id
            WHERE a.id = $1 AND j.employer_id = $2
        `, [applicationId, employer_id]);

        if (appCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const application = appCheck.rows[0];

        // Kiểm tra đã có interview chưa
        const existingInterview = await db.query(
            'SELECT id FROM interviews WHERE application_id = $1',
            [applicationId]
        );

        let interviewId;

        if (existingInterview.rows.length > 0) {
            // Update interview cũ
            interviewId = existingInterview.rows[0].id;
            await db.query(`
                UPDATE interviews 
                SET location = $1, meeting_link = $2, notes = $3, 
                    duration_minutes = $4, status = 'pending', updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
            `, [location, meetingLink, notes, duration || 60, interviewId]);

            // Xóa time slots cũ
            await db.query('DELETE FROM interview_time_slots WHERE interview_id = $1', [interviewId]);
        } else {
            // Tạo interview mới
            const interviewResult = await db.query(`
                INSERT INTO interviews 
                (application_id, job_id, employer_id, candidate_id, location, meeting_link, notes, duration_minutes, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
                RETURNING id
            `, [
                applicationId,
                application.job_id,
                employer_id,
                application.candidate_id,
                location,
                meetingLink,
                notes,
                duration || 60
            ]);

            interviewId = interviewResult.rows[0].id;
        }

        // Thêm time slots mới
        if (timeSlots && timeSlots.length > 0) {
            for (const slot of timeSlots) {
                await db.query(
                    'INSERT INTO interview_time_slots (interview_id, slot_date) VALUES ($1, $2)',
                    [interviewId, slot]
                );
            }
        }

        // Update application status
        await db.query(
            "UPDATE applications SET status = 'interview_scheduled' WHERE id = $1",
            [applicationId]
        );

        res.json({
            success: true,
            message: 'Interview invitation sent',
            interviewId,
            candidateEmail: application.candidate_email,
            candidateName: application.candidate_name
        });

    } catch (error) {
        console.error('Error sending interview invitation:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
};

// Candidate xem chi tiết interview
const getInterviewDetails = async (req, res) => {
    const { applicationId } = req.params;
    const candidate_id = req.user.id;

    try {
        const result = await db.query(`
            SELECT 
                i.id, i.interview_date, i.duration_minutes, i.location, 
                i.meeting_link, i.notes, i.status, i.created_at,
                j.title as job_title,
                e.company_name, e.email as employer_email
            FROM interviews i
            JOIN jobs j ON i.job_id = j.id
            JOIN users e ON i.employer_id = e.id
            WHERE i.application_id = $1 AND i.candidate_id = $2
        `, [applicationId, candidate_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const interview = result.rows[0];

        // Lấy time slots
        const slotsResult = await db.query(`
            SELECT id, slot_date, is_selected
            FROM interview_time_slots
            WHERE interview_id = $1
            ORDER BY slot_date ASC
        `, [interview.id]);

        interview.timeSlots = slotsResult.rows;

        res.json({ interview });

    } catch (error) {
        console.error('Error fetching interview:', error);
        res.status(500).json({ error: 'Failed to fetch interview' });
    }
};

// Candidate xác nhận thời gian phỏng vấn
const confirmInterviewSlot = async (req, res) => {
    const { interviewId, slotId } = req.body;
    const candidate_id = req.user.id;

    try {
        // Verify interview thuộc về candidate
        const interviewCheck = await db.query(
            'SELECT id, application_id FROM interviews WHERE id = $1 AND candidate_id = $2',
            [interviewId, candidate_id]
        );

        if (interviewCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Lấy thời gian của slot được chọn
        const slotResult = await db.query(
            'SELECT slot_date FROM interview_time_slots WHERE id = $1 AND interview_id = $2',
            [slotId, interviewId]
        );

        if (slotResult.rows.length === 0) {
            return res.status(404).json({ error: 'Time slot not found' });
        }

        const selectedDate = slotResult.rows[0].slot_date;

        // Update interview
        await db.query(`
            UPDATE interviews 
            SET interview_date = $1, status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [selectedDate, interviewId]);

        // Đánh dấu slot được chọn
        await db.query(
            'UPDATE interview_time_slots SET is_selected = TRUE WHERE id = $1',
            [slotId]
        );

        // Update application status
        const applicationId = interviewCheck.rows[0].application_id;
        await db.query(
            "UPDATE applications SET status = 'interview_confirmed' WHERE id = $1",
            [applicationId]
        );

        res.json({
            success: true,
            message: 'Interview confirmed',
            interviewDate: selectedDate
        });

    } catch (error) {
        console.error('Error confirming interview:', error);
        res.status(500).json({ error: 'Failed to confirm interview' });
    }
};

// Lấy danh sách interviews của employer
const getEmployerInterviews = async (req, res) => {
    const employer_id = req.user.id;

    try {
        const result = await db.query(`
            SELECT 
                i.id, i.interview_date, i.status, i.location, i.duration_minutes,
                j.title as job_title,
                u.full_name as candidate_name, u.email as candidate_email,
                a.id as application_id
            FROM interviews i
            JOIN jobs j ON i.job_id = j.id
            JOIN users u ON i.candidate_id = u.id
            JOIN applications a ON i.application_id = a.id
            WHERE i.employer_id = $1
            ORDER BY i.interview_date DESC NULLS LAST, i.created_at DESC
        `, [employer_id]);

        res.json({ interviews: result.rows });

    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
};

// Lấy danh sách interviews của candidate
const getCandidateInterviews = async (req, res) => {
    const candidate_id = req.user.id;

    try {
        const result = await db.query(`
            SELECT 
                i.id, i.interview_date, i.status, i.location, i.duration_minutes,
                i.meeting_link, i.notes,
                j.title as job_title,
                e.company_name, e.email as employer_email,
                a.id as application_id
            FROM interviews i
            JOIN jobs j ON i.job_id = j.id
            JOIN users e ON i.employer_id = e.id
            JOIN applications a ON i.application_id = a.id
            WHERE i.candidate_id = $1
            ORDER BY i.interview_date ASC NULLS LAST, i.created_at DESC
        `, [candidate_id]);

        res.json({ interviews: result.rows });

    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
};

module.exports = {
    sendInterviewInvitation,
    getInterviewDetails,
    confirmInterviewSlot,
    getEmployerInterviews,
    getCandidateInterviews
};