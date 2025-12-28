// server/src/controllers/jobController.js

const db = require('../config/database');
const { embedJobDescription, saveJobEmbedding } = require('../services/embeddingService');

// Create a new job (Employer only)
const createJob = async (req, res) => {
    const { title, description, location, salary_range, employment_type, deadline } = req.body;
    const employer_id = req.user.id;

    try {
        const result = await db.query(
            `INSERT INTO jobs (title, description, location, salary_range, employment_type, employer_id, status, deadline)
             VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
             RETURNING id, created_at`,
            [title, description, location, salary_range, employment_type, employer_id, deadline || null]
        );

        const jobId = result.rows[0].id;
        console.log('✅ Job created, ID:', jobId);

        // 👇 THÊM: Gửi notification cho tất cả followers
        const { createNotification } = require('./notificationController');
        
        // Lấy company_name
        const employerResult = await db.query('SELECT company_name FROM users WHERE id = $1', [employer_id]);
        const companyName = employerResult.rows[0]?.company_name || 'A company';

        // Lấy danh sách followers
        const followersResult = await db.query(
            'SELECT candidate_id FROM employer_followers WHERE employer_id = $1',
            [employer_id]
        );

        // Gửi notification cho từng follower
        for (const follower of followersResult.rows) {
            await createNotification(
                follower.candidate_id,
                'new_job',
                '💼 New Job Posted',
                `${companyName} has posted a new job: ${title}`,
                `/jobs/${jobId}`
            );
        }

        console.log(`✅ Sent notifications to ${followersResult.rows.length} followers`);

        res.status(201).json({
            message: 'Job created successfully',
            job: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Failed to create job' });
    }
};

// Create a new job
const updateJob = async (req, res) => {
    const { id } = req.params;
    const { title, description, location, salary_range, employment_type, deadline, status } = req.body;
    const employer_id = req.user.id;

    try {
        // Kiểm tra quyền sở hữu
        const checkOwner = await db.query('SELECT id FROM jobs WHERE id = $1 AND employer_id = $2', [id, employer_id]);
        if (checkOwner.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to edit this job' });
        }

        const result = await db.query(
            `UPDATE jobs 
             SET title = $1, description = $2, location = $3, salary_range = $4, employment_type = $5, deadline = $6, status = $7, updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [title, description, location, salary_range, employment_type, deadline, status, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
};

// Get all active jobs (Public)
const getJobs = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                j.*, 
                u.company_name,
                u.avatar_url
            FROM jobs j
            LEFT JOIN users u ON j.employer_id = u.id
            WHERE j.status = 'active' 
              AND (j.is_hidden = FALSE OR j.is_hidden IS NULL)
              AND COALESCE(u.is_banned, false) = false
            ORDER BY j.created_at DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

// Get all jobs (Admin or Employer)
const getAllJobs = async (req, res) => {
    try {
        // FIX: Join với bảng users để lấy company_name
        const result = await db.query(`
            SELECT j.*, u.company_name 
            FROM jobs j 
            JOIN users u ON j.employer_id = u.id 
            ORDER BY j.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get a job by ID (Public)
const getJobById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT 
                j.*, 
                u.company_name, 
                u.avatar_url,
                COALESCE(u.is_banned, false) AS employer_banned,
                (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) as application_count
            FROM jobs j 
            JOIN users u ON j.employer_id = u.id 
            WHERE j.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const job = result.rows[0];

        // 👇 ẨN JOB NẾU EMPLOYER BỊ BAN
        if (job.employer_banned) {
            return res.status(403).json({ error: 'This job is no longer available' });
        }

        res.json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get jobs created by the logged-in employer
const getMyJobs = async (req, res) => {
    const employer_id = req.user.id;
    
    try {
        // 👇 THÊM avatar_url, company_name
        const result = await db.query(`
            SELECT 
                j.id, j.title, j.description, j.location, j.salary_range, 
                j.employment_type, j.status, j.created_at,
                u.company_name,
                u.avatar_url,
                (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) as application_count
            FROM jobs j
            LEFT JOIN users u ON j.employer_id = u.id
            WHERE j.employer_id = $1
            ORDER BY j.created_at DESC
        `, [employer_id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching employer jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

// Get job applications for a specific job
const getJobApplications = async (req, res) => {
    const { id } = req.params;
    const employer_id = req.user.id;

    const { status, minScore, skills, sortBy = 'applied_at' } = req.query;

    try {
        // Verify job belongs to employer
        const jobCheck = await db.query('SELECT id FROM jobs WHERE id = $1 AND employer_id = $2', [id, employer_id]);
        if (jobCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found or access denied' });
        }

        let query = `
            SELECT 
                a.id, a.status, a.applied_at, a.match_score, a.cover_letter, a.ai_advice, a.job_id,
                u.id as candidate_id, u.email as candidate_email, 
                u.full_name as candidate_name, u.skills as candidate_skills,
                c.cv_text, c.filename as cv_filename, c.file_path as cv_file_path
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            JOIN cvs c ON a.cv_id = c.id
            WHERE a.job_id = $1
              AND COALESCE(a.is_hidden, false) = false
              AND COALESCE(u.is_banned, false) = false
        `;
        
        let queryParams = [id];
        let paramCounter = 2;

        if (status && status !== 'all') {
            query += ` AND a.status = $${paramCounter}`;
            queryParams.push(status);
            paramCounter++;
        }

        if (minScore) {
            query += ` AND a.match_score >= $${paramCounter}`;
            queryParams.push(parseFloat(minScore));
            paramCounter++;
        }

        if (skills) {
            const skillsArray = skills.split(',').map(s => s.trim());
            query += ` AND (`;
            const skillConditions = skillsArray.map((skill, idx) => {
                const currentParam = paramCounter + idx;
                return `u.skills::text ILIKE $${currentParam}`;
            });
            query += skillConditions.join(' OR ');
            query += `)`;
            queryParams.push(...skillsArray.map(skill => `%${skill}%`));
        }

        if (sortBy === 'match_score') {
            query += ` ORDER BY a.match_score DESC NULLS LAST, a.applied_at DESC`;
        } else {
            query += ` ORDER BY a.applied_at DESC`;
        }

        const result = await db.query(query, queryParams);

        res.json({ applications: result.rows });
    } catch (error) {
        console.error('Error fetching job applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

module.exports = {
    createJob,
    updateJob, // 👈 Nhớ export hàm mới
    getJobs,
    getAllJobs,
    getJobById,
    getMyJobs,
    getJobApplications
};