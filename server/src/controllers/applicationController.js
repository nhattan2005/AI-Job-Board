const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const db = require('../config/database');
const { embedCV } = require('../services/embeddingService');
const path = require('path');
const fs = require('fs'); // 👇 Import fs

// 👇 1. CẤU HÌNH LƯU FILE VÀO Ổ CỨNG
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Đảm bảo thư mục này tồn tại
        const uploadDir = 'uploads/cvs/';
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Tên file: timestamp-tên-gốc
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage, // 👈 Sử dụng storage mới
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/plain', 
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only TXT, PDF, and DOCX are allowed.'));
        }
    }
});

// Helper to extract text from file
const extractTextFromFile = async (file) => {
    // 👇 VÌ DÙNG DISK STORAGE, CẦN ĐỌC FILE TỪ ĐƯỜNG DẪN
    const buffer = fs.readFileSync(file.path);
    const { mimetype } = file;
    
    if (mimetype === 'text/plain') {
        return buffer.toString('utf-8');
    } else if (mimetype === 'application/pdf') {
        const pdfData = await pdfParse(buffer);
        return pdfData.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }
    throw new Error('Unsupported file type');
};

// Apply for a job (Candidate only)
const applyForJob = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'CV file is required' });
        }

        const candidate_id = req.user.id;
        const { job_id, cover_letter } = req.body;
        
        // 👇 LẤY ĐƯỜNG DẪN FILE ĐỂ LƯU DB
        // Lưu ý: path.posix.join để đảm bảo dùng dấu / trên Windows
        const filePath = `/uploads/cvs/${req.file.filename}`;

        if (!job_id) {
            return res.status(400).json({ error: 'Job ID is required' });
        }

        // Check if job exists
        const jobCheck = await db.query('SELECT id FROM jobs WHERE id = $1 AND status = $2', [job_id, 'active']);
        if (jobCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found or no longer active' });
        }

        // Check if already applied
        const existingApp = await db.query(
            'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
            [job_id, candidate_id]
        );
        if (existingApp.rows.length > 0) {
            return res.status(400).json({ error: 'You have already applied for this job' });
        }

        // Extract CV text
        const cvText = await extractTextFromFile(req.file);
        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ error: 'Could not extract text from CV file' });
        }

        // Generate embedding
        const cvVector = await embedCV(cvText);

        // 👇 CẬP NHẬT QUERY: LƯU THÊM file_path
        const cvResult = await db.query(
            `INSERT INTO cvs (candidate_id, filename, cv_text, vector, file_path) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (candidate_id) 
             DO UPDATE SET filename = $2, cv_text = $3, vector = $4, file_path = $5, created_at = CURRENT_TIMESTAMP
             RETURNING id`,
            [candidate_id, req.file.originalname, cvText, JSON.stringify(cvVector), filePath]
        );

        const cv_id = cvResult.rows[0].id;

        // Create application
        const appResult = await db.query(
            `INSERT INTO applications (job_id, candidate_id, cv_id, cover_letter, status) 
             VALUES ($1, $2, $3, $4, 'pending') 
             RETURNING id, applied_at`,
            [job_id, candidate_id, cv_id, cover_letter || '']
        );

        res.status(201).json({
            message: 'Application submitted successfully',
            application: {
                id: appResult.rows[0].id,
                applied_at: appResult.rows[0].applied_at
            }
        });
    } catch (error) {
        console.error('Error applying for job:', error);
        res.status(500).json({ error: 'Failed to submit application', details: error.message });
    }
};

// Get user's applications (Candidate)
const getMyApplications = async (req, res) => {
    try {
        const candidate_id = req.user.id;

        const result = await db.query(`
            SELECT 
                a.id, a.status, a.applied_at, a.match_score, a.job_id,
                j.id as job_id, j.title as job_title, j.location,
                u.company_name
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON j.employer_id = u.id
            WHERE a.candidate_id = $1
            ORDER BY a.applied_at DESC
        `, [candidate_id]);

        res.json({ applications: result.rows });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

// Analyze application with AI
const analyzeApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const candidate_id = req.user.id;

        // Get application details
        const appResult = await db.query(`
            SELECT a.id, a.cv_id, a.job_id, j.description as job_description, c.cv_text
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN cvs c ON a.cv_id = c.id
            WHERE a.id = $1 AND a.candidate_id = $2
        `, [id, candidate_id]);

        if (appResult.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const app = appResult.rows[0];

        // Calculate matching score using existing service
        const { embedJobDescription, embedCV } = require('../services/embeddingService');
        const { cosineSimilarity } = require('../utils/vectorMath');
        
        const jobVector = await embedJobDescription(app.job_description);
        const cvVector = await embedCV(app.cv_text);
        const matchScore = cosineSimilarity(jobVector, cvVector);

        // Get AI advice using existing service
        const tailoringService = require('../services/tailoringService');
        const aiAdvice = await tailoringService.tailorCV(app.cv_text, app.job_description);

        // Update application with results
        await db.query(`
            UPDATE applications 
            SET match_score = $1, ai_advice = $2, analyzed_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [matchScore, JSON.stringify(aiAdvice.suggestions || []), id]);

        res.json({
            match_score: Math.round(matchScore * 100) / 100,
            ai_advice: aiAdvice
        });
    } catch (error) {
        console.error('Error analyzing application:', error);
        res.status(500).json({ error: 'Failed to analyze application', details: error.message });
    }
};

// Update application status (Employer only)
const updateApplicationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const employer_id = req.user.id;
    
    // Validate status
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    try {
        // Verify the application belongs to employer's job
        const checkResult = await db.query(`
            SELECT a.id 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = $1 AND j.employer_id = $2
        `, [id, employer_id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found or access denied' });
        }
        
        // Update status
        await db.query(
            'UPDATE applications SET status = $1 WHERE id = $2',
            [status, id]
        );
        
        res.json({ message: 'Application status updated successfully' });
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ error: 'Failed to update application status' });
    }
};

// Check if user has applied for a job
const checkApplicationStatus = async (req, res) => {
    const { jobId } = req.params;
    const candidate_id = req.user.id;

    try {
        const result = await db.query(
            'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
            [jobId, candidate_id]
        );

        res.json({ hasApplied: result.rows.length > 0 });
    } catch (error) {
        console.error('Error checking application status:', error);
        res.status(500).json({ error: 'Failed to check application status' });
    }
};

module.exports = {
    upload,
    applyForJob,
    getMyApplications,
    analyzeApplication,
    updateApplicationStatus,
    checkApplicationStatus
};