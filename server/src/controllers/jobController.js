// server/src/controllers/jobController.js

const db = require('../config/database');
const { embedJobDescription, saveJobEmbedding } = require('../services/embeddingService');

// Create a new job (Employer only)
const createJob = async (req, res) => {
    // 👇 THÊM deadline vào destructuring
    const { title, description, location, salary_range, employment_type, deadline } = req.body;
    const employer_id = req.user.id; // From auth middleware
    
    try {
        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        // 👇 CẬP NHẬT QUERY INSERT
        const result = await db.query(
            `INSERT INTO jobs (employer_id, title, description, location, salary_range, employment_type, deadline, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') 
             RETURNING *`, 
            [employer_id, title, description, location || '', salary_range || '', employment_type || 'full-time', deadline || null]
        );
        
        const job = result.rows[0];
        
        // Generate and save embedding for the job
        try {
            const embedding = await embedJobDescription(description);
            await saveJobEmbedding(job.id, embedding);
        } catch (embeddingError) {
            console.warn('Failed to generate embedding for job:', embeddingError);
        }
        
        res.status(201).json(job);
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
        // 👇 THÊM ĐIỀU KIỆN: Không hiển thị job bị hidden
        const result = await db.query(`
            SELECT 
                j.*, 
                u.company_name,
                u.avatar_url
            FROM jobs j
            LEFT JOIN users u ON j.employer_id = u.id
            WHERE j.status = 'active' AND j.is_hidden = FALSE
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
        // 👇 CẬP NHẬT QUERY: Thêm deadline và subquery đếm số lượng application
        const result = await db.query(`
            SELECT 
                j.*, 
                u.company_name, 
                u.avatar_url,
                (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) as application_count
            FROM jobs j 
            JOIN users u ON j.employer_id = u.id 
            WHERE j.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get jobs created by the logged-in employer
const getMyJobs = async (req, res) => {
    const employer_id = req.user.id;
    
    try {
        const result = await db.query(`
            SELECT 
                id, title, description, location, salary_range, 
                employment_type, status, created_at
            FROM jobs
            WHERE employer_id = $1
            ORDER BY created_at DESC
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
    
    try {
        // Verify job belongs to this employer
        const jobCheck = await db.query(
            'SELECT id FROM jobs WHERE id = $1 AND employer_id = $2',
            [id, employer_id]
        );
        
        if (jobCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found or access denied' });
        }
        
        // Get applications with candidate details
        const result = await db.query(`
            SELECT 
                a.id, a.status, a.applied_at, a.match_score, a.ai_advice, a.cover_letter,
                u.id as candidate_id, u.email as candidate_email, 
                u.full_name as candidate_name, u.skills as candidate_skills,
                c.cv_text, c.filename as cv_filename, c.file_path
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            JOIN cvs c ON a.cv_id = c.id
            WHERE a.job_id = $1
            ORDER BY a.applied_at DESC
        `, [id]);
        
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