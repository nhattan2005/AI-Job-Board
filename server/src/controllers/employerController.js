const db = require('../config/database');

const getEmployerStats = async (req, res) => {
    const employer_id = req.user.id;
    
    try {
        // Total jobs
        const jobsResult = await db.query(
            'SELECT COUNT(*) as count FROM jobs WHERE employer_id = $1 AND status = $2',
            [employer_id, 'active']
        );
        
        // Total applications
        const appsResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.employer_id = $1
        `, [employer_id]);
        
        // Pending applications
        const pendingResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.employer_id = $1 AND a.status = 'pending'
        `, [employer_id]);
        
        // Today's applications
        const todayResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.employer_id = $1 
            AND DATE(a.applied_at) = CURRENT_DATE
        `, [employer_id]);
        
        res.json({
            totalJobs: parseInt(jobsResult.rows[0].count),
            totalApplications: parseInt(appsResult.rows[0].count),
            pendingApplications: parseInt(pendingResult.rows[0].count),
            todayApplications: parseInt(todayResult.rows[0].count)
        });
    } catch (error) {
        console.error('Error fetching employer stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

// Get all applications for all employer's jobs
const getAllApplications = async (req, res) => {
    const employer_id = req.user.id;
    
    try {
        const result = await db.query(`
            SELECT 
                a.id, a.status, a.applied_at, a.match_score, a.ai_advice, a.cover_letter,
                a.job_id,
                j.title as job_title, j.location as job_location,
                u.id as candidate_id, u.email as candidate_email, 
                u.full_name as candidate_name, u.skills as candidate_skills,
                c.cv_text, c.filename as cv_filename
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.candidate_id = u.id
            JOIN cvs c ON a.cv_id = c.id
            WHERE j.employer_id = $1
              AND COALESCE(a.is_hidden, false) = false
              AND COALESCE(u.is_banned, false) = false
            ORDER BY a.applied_at DESC
        `, [employer_id]);
        
        res.json({ applications: result.rows });
    } catch (error) {
        console.error('Error fetching all applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

// Get public employer profile
const getEmployerProfile = async (req, res) => {
    try {
        const { employerId } = req.params;

        const result = await db.query(
            `SELECT 
                id, 
                company_name, 
                company_description, 
                email, 
                website, 
                company_email,
                company_phone,
                avatar_url,
                created_at,
                company_address,
                company_size,
                company_industry,
                company_founded_year,
                company_benefits,
                social_linkedin,
                social_facebook,
                social_twitter,
                follower_count,
                COALESCE(is_banned, false) AS is_banned,
                ban_reason
            FROM users 
            WHERE id = $1 AND role = 'employer'`,
            [employerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        const employer = result.rows[0];

        // 👇 ẨN THÔNG TIN NẾU EMPLOYER BỊ BAN
        if (employer.is_banned) {
            return res.status(403).json({ 
                error: 'This employer account has been suspended',
                reason: employer.ban_reason 
            });
        }

        res.json(employer);
    } catch (error) {
        console.error('Error fetching employer profile:', error);
        res.status(500).json({ error: 'Failed to fetch employer profile' });
    }
};

// Get employer's active jobs
const getEmployerJobs = async (req, res) => {
    try {
        const { employerId } = req.params;

        const result = await db.query(
            `SELECT 
                j.id, 
                j.title, 
                j.description, 
                j.location, 
                j.salary_range, 
                j.employment_type, 
                j.created_at,
                j.deadline
            FROM jobs j
            JOIN users u ON j.employer_id = u.id
            WHERE j.employer_id = $1 
              AND j.status = 'active' 
              AND (j.is_hidden = FALSE OR j.is_hidden IS NULL)
              AND COALESCE(u.is_banned, false) = false
              AND (j.deadline IS NULL OR j.deadline > NOW())
            ORDER BY j.created_at DESC`,
            [employerId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching employer jobs:', error);
        res.status(500).json({ error: 'Failed to fetch employer jobs' });
    }
};

// 👇 HÀM MỚI: Follow Employer
const followEmployer = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { employerId } = req.params;

        // Check if employer exists
        const employerCheck = await db.query(
            'SELECT id FROM users WHERE id = $1 AND role = $2',
            [employerId, 'employer']
        );

        if (employerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        // Insert follow
        await db.query(
            'INSERT INTO employer_followers (employer_id, candidate_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [employerId, candidateId]
        );

        // Update follower_count
        await db.query(
            `UPDATE users 
             SET follower_count = (SELECT COUNT(*) FROM employer_followers WHERE employer_id = $1) 
             WHERE id = $1`,
            [employerId]
        );

        res.json({ message: 'Followed successfully' });
    } catch (error) {
        console.error('Error following employer:', error);
        res.status(500).json({ error: 'Failed to follow employer' });
    }
};

// 👇 HÀM MỚI: Unfollow Employer
const unfollowEmployer = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { employerId } = req.params;

        // Delete follow
        await db.query(
            'DELETE FROM employer_followers WHERE employer_id = $1 AND candidate_id = $2',
            [employerId, candidateId]
        );

        // Update follower_count
        await db.query(
            `UPDATE users 
             SET follower_count = (SELECT COUNT(*) FROM employer_followers WHERE employer_id = $1) 
             WHERE id = $1`,
            [employerId]
        );

        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Error unfollowing employer:', error);
        res.status(500).json({ error: 'Failed to unfollow employer' });
    }
};

// 👇 HÀM MỚI: Check Follow Status
const checkFollowStatus = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { employerId } = req.params;

        const result = await db.query(
            'SELECT id FROM employer_followers WHERE employer_id = $1 AND candidate_id = $2',
            [employerId, candidateId]
        );

        res.json({ isFollowing: result.rows.length > 0 });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ error: 'Failed to check follow status' });
    }
};

// 👇 HÀM MỚI: Get list of employers that user is following
const getFollowedEmployers = async (req, res) => {
    try {
        const candidateId = req.user.id;

        const result = await db.query(
            `SELECT 
                u.id, 
                u.company_name, 
                u.company_description, 
                u.avatar_url,
                u.company_industry,
                u.follower_count,
                ef.created_at as followed_at,
                (SELECT COUNT(*)::int FROM jobs WHERE employer_id = u.id AND status = 'active' AND (is_hidden = FALSE OR is_hidden IS NULL)) as active_jobs
             FROM employer_followers ef
             JOIN users u ON ef.employer_id = u.id
             WHERE ef.candidate_id = $1
               AND COALESCE(u.is_banned, false) = false
             ORDER BY ef.created_at DESC`,
            [candidateId]
        );

        res.json({ employers: result.rows });
    } catch (error) {
        console.error('Error fetching followed employers:', error);
        res.status(500).json({ error: 'Failed to fetch followed employers' });
    }
};

module.exports = {
    getEmployerStats,
    getAllApplications,
    getEmployerProfile,
    getEmployerJobs,
    followEmployer,
    unfollowEmployer,
    checkFollowStatus,
    getFollowedEmployers  // 👈 EXPORT MỚI
};