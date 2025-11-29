// server/src/controllers/jobController.js

const db = require('../config/database');
const { embedJobDescription, saveJobEmbedding } = require('../services/embeddingService');

// Create a new job (Employer only)
const createJob = async (req, res) => {
    const { title, description, location, salary_range, employment_type } = req.body;
    const employer_id = req.user.id; // From auth middleware
    
    try {
        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        const result = await db.query(
            `INSERT INTO jobs (employer_id, title, description, location, salary_range, employment_type, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'active') 
             RETURNING *`, 
            [employer_id, title, description, location || '', salary_range || '', employment_type || 'full-time']
        );
        
        const job = result.rows[0];
        
        // Generate and save embedding for the job
        try {
            const embedding = await embedJobDescription(description);
            await saveJobEmbedding(job.id, embedding);
        } catch (embeddingError) {
            console.warn('Failed to generate embedding for job:', embeddingError);
        }
        
        res.status(201).json({
            message: 'Job created successfully',
            job: job
        });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Failed to create job', details: error.message });
    }
};

// Get all active jobs (Public)
const getJobs = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                j.id, j.title, j.description, j.location, j.salary_range, 
                j.employment_type, j.status, j.created_at,
                u.company_name as company
            FROM jobs j
            LEFT JOIN users u ON j.employer_id = u.id
            WHERE j.status = 'active'
            ORDER BY j.created_at DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

// Get a job by ID (Public)
const getJobById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT 
                j.id, j.title, j.description, j.location, j.salary_range, 
                j.employment_type, j.status, j.created_at,
                u.company_name as company, u.company_description, u.website
            FROM jobs j
            LEFT JOIN users u ON j.employer_id = u.id
            WHERE j.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Failed to fetch job' });
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
                c.cv_text, c.filename as cv_filename
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
    getJobs,
    getJobById,
    getMyJobs,
    getJobApplications  // Add this export
};