const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const db = require('../config/database');
const { embedCV } = require('../services/embeddingService');
const { cloudinary } = require('../config/cloudinary');
const streamifier = require('streamifier');

// 👇 DÙNG MEMORY STORAGE (Lưu vào RAM trước)
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// 👇 HELPER: Upload Buffer lên Cloudinary
const uploadToCloudinary = (buffer, filename, userId) => {
    return new Promise((resolve, reject) => {
        // 👇 THÊM: Lấy extension từ filename
        const extension = filename.split('.').pop().toLowerCase();
        const filenameWithoutExt = filename.split('.').slice(0, -1).join('.').replace(/[^a-zA-Z0-9]/g, '_');
        
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
                folder: 'ai-job-board/cvs',
                resource_type: 'raw',
                public_id: `cv_${userId}_${filenameWithoutExt}_${Date.now()}`,
                // 👇 THÊM: Format để Cloudinary biết đây là file gì
                format: extension,
                use_filename: false // Để public_id tự động thêm extension
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    reject(error);
                } else {
                    console.log('✅ CV uploaded to Cloudinary:', result.secure_url);
                    resolve(result);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// 👇 HELPER: Extract text từ Buffer
const extractTextFromFile = async (file) => {
    const buffer = file.buffer;
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

// 👇 HÀM APPLY JOB (CẬP NHẬT)
const applyForJob = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'CV file is required' });
        }

        const candidate_id = req.user.id;
        const { job_id, cover_letter } = req.body;

        console.log('📤 Processing CV upload for user:', candidate_id);

        // 1. Extract text từ RAM
        const cvText = await extractTextFromFile(req.file);
        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ error: 'Could not extract text from CV file' });
        }
        console.log('✅ CV text extracted, length:', cvText.length);

        // 2. Upload file lên Cloudinary
        const cloudResult = await uploadToCloudinary(req.file.buffer, req.file.originalname, candidate_id);
        const filePath = cloudResult.secure_url; // 👈 URL từ Cloudinary
        console.log('✅ CV file uploaded to Cloudinary:', filePath);

        // 3. Generate embedding
        console.log('🔄 Generating embedding...');
        const cvVector = await embedCV(cvText);
        console.log('✅ Embedding generated');

        // 4. Lưu vào database (UPSERT)
        const cvResult = await db.query(
            `INSERT INTO cvs (candidate_id, filename, cv_text, vector, file_path) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (candidate_id) 
             DO UPDATE SET 
                filename = $2, 
                cv_text = $3, 
                vector = $4, 
                file_path = $5, 
                created_at = CURRENT_TIMESTAMP
             RETURNING id`,
            [
                candidate_id, 
                req.file.originalname, // 👈 ĐẢM BẢO GIỮ NGUYÊN FILENAME GỐC (có .pdf, .docx)
                cvText, 
                JSON.stringify(cvVector), 
                filePath
            ]
        );

        const cv_id = cvResult.rows[0].id;
        console.log('✅ CV saved to database, ID:', cv_id);

        // 5. Tạo application
        const appResult = await db.query(
            `INSERT INTO applications (job_id, candidate_id, cv_id, cover_letter, status) 
             VALUES ($1, $2, $3, $4, 'pending') 
             RETURNING id, applied_at`,
            [job_id, candidate_id, cv_id, cover_letter || '']
        );

        console.log('✅ Application created, ID:', appResult.rows[0].id);

        res.status(201).json({
            message: 'Application submitted successfully',
            application: {
                id: appResult.rows[0].id,
                applied_at: appResult.rows[0].applied_at
            }
        });

    } catch (error) {
        console.error('❌ Error applying for job:', error);
        res.status(500).json({ 
            error: 'Failed to submit application', 
            details: error.message 
        });
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

// 👇 HÀM MỚI: Download CV với signed URL
const downloadCV = async (req, res) => {
    const { applicationId } = req.params;
    const employer_id = req.user.id;

    try {
        // Verify employer has access to this application
        const appResult = await db.query(`
            SELECT a.id, c.file_path, c.filename, j.employer_id
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            LEFT JOIN cvs c ON a.cv_id = c.id
            WHERE a.id = $1
        `, [applicationId]);

        if (appResult.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const app = appResult.rows[0];

        // Check permission
        if (app.employer_id !== employer_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const file_path = app.file_path;

        if (!file_path || !file_path.includes('cloudinary.com')) {
            return res.status(404).json({ error: 'CV file not found' });
        }

        // Extract public_id từ Cloudinary URL
        const urlParts = file_path.split('/upload/');
        if (urlParts.length !== 2) {
            return res.status(400).json({ error: 'Invalid Cloudinary URL' });
        }

        const afterUpload = urlParts[1];
        const versionMatch = afterUpload.match(/^v\d+\//);
        const publicIdWithExtension = versionMatch 
            ? afterUpload.substring(versionMatch[0].length)
            : afterUpload;

        // Generate signed URL (valid for 5 minutes)
        const signedUrl = cloudinary.url(publicIdWithExtension, {
            resource_type: 'raw',
            type: 'upload',
            sign_url: true,
            secure: true,
            expires_at: Math.floor(Date.now() / 1000) + 300 // 5 phút
        });

        console.log('✅ Generated signed URL for CV:', signedUrl);

        // Redirect đến signed URL
        res.redirect(signedUrl);

    } catch (error) {
        console.error('❌ Download CV error:', error);
        res.status(500).json({ error: 'Failed to download CV' });
    }
};

module.exports = {
    upload,
    applyForJob,
    getMyApplications,
    analyzeApplication,
    updateApplicationStatus,
    checkApplicationStatus,
    downloadCV // 👈 EXPORT HÀM MỚI
};