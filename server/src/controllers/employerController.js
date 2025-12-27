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
                social_twitter
            FROM users 
            WHERE id = $1 AND role = 'employer'`,
            [employerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        res.json(result.rows[0]);
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
                id, 
                title, 
                description, 
                location, 
                salary_range, 
                employment_type, 
                created_at,
                deadline
            FROM jobs 
            WHERE employer_id = $1 
                AND status = 'active' 
                AND (is_hidden = FALSE OR is_hidden IS NULL)
                AND (deadline IS NULL OR deadline > NOW())
            ORDER BY created_at DESC`,
            [employerId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching employer jobs:', error);
        res.status(500).json({ error: 'Failed to fetch employer jobs' });
    }
};

module.exports = {
    getEmployerStats,
    getAllApplications,
    getEmployerProfile,
    getEmployerJobs
};