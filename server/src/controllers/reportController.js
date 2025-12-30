const db = require('../config/database');
const { createNotification } = require('./notificationController'); // 👈 Import notification controller

// Create a new report
const createReport = async (req, res) => {
    const { target_type, target_id, reason, description } = req.body;
    const reporter_id = req.user.id;

    try {
        // 1. Insert Report
        await db.query(
            `INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [reporter_id, target_type, target_id, reason, description]
        );

        // 2. Notify ALL Admins
        // Lấy danh sách tất cả admin
        const adminResult = await db.query("SELECT id FROM users WHERE role = 'admin'");
        const admins = adminResult.rows;

        // Lấy tên người report để hiển thị rõ ràng hơn
        const reporterRes = await db.query("SELECT full_name, email FROM users WHERE id = $1", [reporter_id]);
        const reporterName = reporterRes.rows[0]?.full_name || reporterRes.rows[0]?.email || 'A user';

        // Gửi thông báo cho từng admin
        for (const admin of admins) {
            await createNotification(
                admin.id,
                'system_alert', 
                '⚠️ New Report Received',
                `${reporterName} reported a ${target_type}. Reason: ${reason}`,
                '/admin/reports' // Link trỏ về trang quản lý report
            );
        }

        res.status(201).json({ message: 'Report submitted successfully' });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
};

// Get all reports (Admin only)
const getAllReports = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, 
                   u.full_name as reporter_name, u.email as reporter_email,
                   CASE 
                       WHEN r.target_type = 'job' THEN j.title
                       WHEN r.target_type = 'user' THEN t.full_name
                   END as target_name
            FROM reports r
            JOIN users u ON r.reporter_id = u.id
            LEFT JOIN jobs j ON r.target_type = 'job' AND r.target_id = j.id
            LEFT JOIN users t ON r.target_type = 'user' AND r.target_id = t.id
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

// Resolve/Dismiss report (Admin only)
const updateReportStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await db.query('UPDATE reports SET status = $1 WHERE id = $2', [status, id]);
        res.json({ message: 'Report status updated' });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
};

module.exports = { createReport, getAllReports, updateReportStatus };