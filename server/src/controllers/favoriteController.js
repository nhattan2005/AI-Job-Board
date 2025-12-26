const db = require('../config/database');

// Get favorite jobs for logged-in candidate
const getFavoriteJobs = async (req, res) => {
    try {
        const candidateId = req.user.id;

        const result = await db.query(
            `SELECT 
                f.id as favorite_id,
                f.created_at as favorited_at,
                j.id,
                j.title,
                j.description,
                j.location, -- 👈 THÊM DÒNG NÀY
                j.salary_range,
                j.employment_type,
                j.status,
                j.created_at,
                j.deadline,
                u.company_name,
                u.avatar_url,
                (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) as application_count
            FROM favorite_jobs f
            JOIN jobs j ON f.job_id = j.id
            JOIN users u ON j.employer_id = u.id
            WHERE f.candidate_id = $1
            ORDER BY f.created_at DESC`,
            [candidateId]
        );

        res.json({ favorites: result.rows });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Failed to get favorite jobs' });
    }
};

// Add job to favorites
const addFavoriteJob = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { job_id } = req.body;

        if (!job_id) {
            return res.status(400).json({ error: 'job_id is required' });
        }

        // Check if already favorited
        const checkResult = await db.query(
            'SELECT id FROM favorite_jobs WHERE candidate_id = $1 AND job_id = $2',
            [candidateId, job_id]
        );

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: 'Job already in favorites' });
        }

        // Add to favorites
        await db.query(
            'INSERT INTO favorite_jobs (candidate_id, job_id) VALUES ($1, $2)',
            [candidateId, job_id]
        );

        res.status(201).json({ message: 'Job added to favorites' });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
};

// Remove job from favorites
const removeFavoriteJob = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { jobId } = req.params;

        await db.query(
            'DELETE FROM favorite_jobs WHERE candidate_id = $1 AND job_id = $2',
            [candidateId, jobId]
        );

        res.json({ message: 'Job removed from favorites' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
};

// Check if job is favorited
const checkIsFavorite = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { jobId } = req.params;

        const result = await db.query(
            'SELECT id FROM favorite_jobs WHERE candidate_id = $1 AND job_id = $2',
            [candidateId, jobId]
        );

        res.json({ isFavorite: result.rows.length > 0 });
    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({ error: 'Failed to check favorite status' });
    }
};

module.exports = {
    getFavoriteJobs,
    addFavoriteJob,
    removeFavoriteJob,
    checkIsFavorite
};