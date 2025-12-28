const db = require('../config/database');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'candidate') as total_candidates,
                (SELECT COUNT(*) FROM users WHERE role = 'employer') as total_employers,
                (SELECT COUNT(*) FROM users WHERE COALESCE(is_banned, false) = true) as banned_users,
                (SELECT COUNT(*) FROM jobs WHERE status = 'active') as active_jobs,
                (SELECT COUNT(*) FROM jobs WHERE COALESCE(is_hidden, false) = true) as hidden_jobs,
                (SELECT COUNT(*) FROM applications) as total_applications,
                (SELECT COUNT(*) FROM applications WHERE applied_at >= CURRENT_DATE - INTERVAL '7 days') as applications_this_week
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

// Get all users with pagination and filters
const getAllUsers = async (req, res) => {
    try {
        const { role, status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];
        let paramCounter = 1;

        if (role && role !== 'all') {
            whereConditions.push(`role = $${paramCounter}`);
            params.push(role);
            paramCounter++;
        }

        if (status === 'banned') {
            whereConditions.push('is_banned = true');
        } else if (status === 'active') {
            whereConditions.push('is_banned = false');
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // 👇 SỬA: Thêm COALESCE để đảm bảo không null
        const result = await db.query(`
            SELECT 
                id, email, role, 
                full_name, company_name, phone,
                COALESCE(is_banned, false) as is_banned, 
                ban_reason, banned_at, 
                email_verified, created_at
            FROM users
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `, [...params, limit, offset]);

        const countResult = await db.query(`
            SELECT COUNT(*) as total FROM users ${whereClause}
        `, params);

        console.log(`📊 Found ${result.rows.length} users`); // Debug log

        res.json({
            users: result.rows,
            total: parseInt(countResult.rows[0].total),
            page: parseInt(page),
            totalPages: Math.ceil(countResult.rows[0].total / limit)
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Ban/Unban user
const toggleBanUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;

        // Check user
        const userResult = await db.query('SELECT id, role, full_name, company_name, is_banned FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const target = userResult.rows[0];

        if (!target.is_banned) {
            // Ban user
            await db.query(
                `UPDATE users 
                 SET is_banned = true, ban_reason = $1, banned_at = NOW(), banned_by = $2
                 WHERE id = $3`,
                [reason || 'Violates community guidelines', adminId, userId]
            );

            // 👇 THÊM: Invalidate tất cả tokens của user bị ban
            await db.query(
                `UPDATE users SET token_version = COALESCE(token_version, 0) + 1 WHERE id = $1`,
                [userId]
            );

            await db.query(
                `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
                 VALUES ($1, 'ban_user', 'user', $2, $3)`,
                [adminId, userId, reason || 'Violates community guidelines']
            );

            // Nếu là employer, ẩn toàn bộ job và gửi notifications
            if (target.role === 'employer') {
                const { createNotification } = require('./notificationController');

                await db.query(
                    `UPDATE jobs 
                     SET is_hidden = true, hidden_reason = $1, hidden_at = NOW(), hidden_by = $2
                     WHERE employer_id = $3`,
                    ['Employer account banned', adminId, userId]
                );

                const companyName = target.company_name || 'An employer';

                const followers = await db.query(
                    'SELECT candidate_id FROM employer_followers WHERE employer_id = $1',
                    [userId]
                );
                
                const applicants = await db.query(`
                    SELECT DISTINCT a.candidate_id
                    FROM applications a
                    JOIN jobs j ON a.job_id = j.id
                    WHERE j.employer_id = $1
                `, [userId]);

                let interviewees = { rows: [] };
                try {
                    interviewees = await db.query(`
                        SELECT DISTINCT candidate_id 
                        FROM interviews 
                        WHERE employer_id = $1
                    `, [userId]);
                } catch (e) {
                    console.warn('Interviews table query failed:', e.message);
                }

                const candidateIds = new Set([
                    ...followers.rows.map(r => r.candidate_id),
                    ...applicants.rows.map(r => r.candidate_id),
                    ...interviewees.rows.map(r => r.candidate_id),
                ]);

                for (const candidateId of candidateIds) {
                    await createNotification(
                        candidateId,
                        'employer_banned',
                        '⚠️ Employer Account Suspended',
                        `${companyName} has been suspended. You may have followed, applied to jobs, or had interviews with this company.`,
                        `/`
                    );
                }

                console.log(`📣 Sent ban notifications to ${candidateIds.size} job seekers`);
            }

            console.log(`🚫 User ${userId} has been banned and all sessions invalidated`);
            res.json({ message: 'User banned successfully and logged out from all devices' });

        } else {
            // Unban user
            await db.query(
                `UPDATE users 
                 SET is_banned = false, ban_reason = NULL, banned_at = NULL, banned_by = NULL
                 WHERE id = $1`,
                [userId]
            );

            await db.query(
                `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
                 VALUES ($1, 'unban_user', 'user', $2, $3)`,
                [adminId, userId, 'User unbanned']
            );

            if (target.role === 'employer') {
                await db.query(
                    `UPDATE jobs 
                     SET is_hidden = false, hidden_reason = NULL, hidden_at = NULL, hidden_by = NULL
                     WHERE employer_id = $1 AND hidden_reason = 'Employer account banned'`,
                    [userId]
                );
            }

            res.json({ message: 'User unbanned successfully' });
        }
    } catch (error) {
        console.error('Error toggling ban status:', error);
        res.status(500).json({ error: 'Failed to update ban status' });
    }
};

// Get all jobs with filters
const getAllJobsAdmin = async (req, res) => {
    try {
        const { status, hidden, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];
        let paramCounter = 1;

        if (status && status !== 'all') {
            whereConditions.push(`j.status = $${paramCounter}`);
            params.push(status);
            paramCounter++;
        }

        if (hidden === 'true') {
            whereConditions.push('j.is_hidden = true');
        } else if (hidden === 'false') {
            whereConditions.push('(j.is_hidden = false OR j.is_hidden IS NULL)'); // 👈 SỬA
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // 👇 SỬA: Thêm COALESCE
        const result = await db.query(`
            SELECT 
                j.id, j.title, j.description, j.location, j.salary_range, 
                j.status, 
                COALESCE(j.is_hidden, false) as is_hidden, 
                j.hidden_reason, j.created_at,
                u.company_name, u.email as employer_email
            FROM jobs j
            JOIN users u ON j.employer_id = u.id
            ${whereClause}
            ORDER BY j.created_at DESC
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `, [...params, limit, offset]);

        const countResult = await db.query(`
            SELECT COUNT(*) as total 
            FROM jobs j
            JOIN users u ON j.employer_id = u.id
            ${whereClause}
        `, params);

        console.log(`📊 Found ${result.rows.length} jobs`); // Debug log

        res.json({
            jobs: result.rows,
            total: parseInt(countResult.rows[0].total),
            page: parseInt(page),
            totalPages: Math.ceil(countResult.rows[0].total / limit)
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

// Hide/Unhide job
const toggleHideJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;

        const jobCheck = await db.query(
            'SELECT id, is_hidden FROM jobs WHERE id = $1',
            [jobId]
        );

        if (jobCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const currentlyHidden = jobCheck.rows[0].is_hidden;

        if (!currentlyHidden) {
            // Hide job
            await db.query(
                `UPDATE jobs 
                 SET is_hidden = true, hidden_reason = $1, hidden_at = NOW(), hidden_by = $2
                 WHERE id = $3`,
                [reason || 'Violates community guidelines', adminId, jobId]
            );

            await db.query(
                `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
                 VALUES ($1, 'hide_job', 'job', $2, $3)`,
                [adminId, jobId, reason]
            );

            res.json({ message: 'Job hidden successfully' });
        } else {
            // Unhide job
            await db.query(
                `UPDATE jobs 
                 SET is_hidden = false, hidden_reason = NULL, hidden_at = NULL, hidden_by = NULL
                 WHERE id = $1`,
                [jobId]
            );

            await db.query(
                `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
                 VALUES ($1, 'activate_job', 'job', $2, $3)`,
                [adminId, jobId, 'Job reactivated']
            );

            res.json({ message: 'Job unhidden successfully' });
        }
    } catch (error) {
        console.error('Error toggling hide status:', error);
        res.status(500).json({ error: 'Failed to update hide status' });
    }
};

// Get recent admin actions
const getAdminActions = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const result = await db.query(`
            SELECT 
                aa.*,
                u.email as admin_email,
                u.full_name as admin_name
            FROM admin_actions aa
            JOIN users u ON aa.admin_id = u.id
            ORDER BY aa.created_at DESC
            LIMIT $1
        `, [limit]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching admin actions:', error);
        res.status(500).json({ error: 'Failed to fetch admin actions' });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    toggleBanUser,
    getAllJobsAdmin,
    toggleHideJob,
    getAdminActions
};