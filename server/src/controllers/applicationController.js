const db = require('../config/database');
const { extractTextFromFile } = require('../utils/pdfExtractor');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const multer = require('multer');
const { createNotification } = require('./notificationController');
const { cloudinary } = require('../config/cloudinary'); // 👈 SỬA: Import đúng cách

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

// Apply for a job
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
        const filePath = cloudResult.secure_url;

        // 👇 THÊM: Sanitize URL (loại bỏ ký tự xuống dòng, space thừa)
        const cleanFilePath = filePath.trim().replace(/\s+/g, '');

        console.log('✅ CV file uploaded to Cloudinary:', cleanFilePath);

        // 3. Lấy thông tin job (để kiểm tra)
        const jobResult = await db.query('SELECT id, title, description FROM jobs WHERE id = $1', [job_id]);
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const job = jobResult.rows[0];
        console.log('✅ Job found:', job.title);

        // 👇 4. KIỂM TRA CV ĐÃ TỒN TẠI CHƯA
        let cv_id;
        const existingCVResult = await db.query(
            'SELECT id FROM cvs WHERE candidate_id = $1 LIMIT 1',
            [candidate_id]
        );

        if (existingCVResult.rows.length > 0) {
            cv_id = existingCVResult.rows[0].id;
            console.log('📝 CV already exists, updating ID:', cv_id);

            await db.query(
                `UPDATE cvs 
                 SET filename = $1, cv_text = $2, file_path = $3, created_at = CURRENT_TIMESTAMP 
                 WHERE id = $4`,
                [req.file.originalname, cvText, cleanFilePath, cv_id] // 👈 DÙNG cleanFilePath
            );
            console.log('✅ CV updated successfully');
        } else {
            // 👇 CV CHƯA TỒN TẠI → TẠO MỚI
            const cvResult = await db.query(
                `INSERT INTO cvs (candidate_id, filename, cv_text, file_path) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id`,
                [candidate_id, req.file.originalname, cvText, cleanFilePath] // 👈 DÙNG cleanFilePath
            );
            cv_id = cvResult.rows[0].id;
            console.log('✅ CV created, ID:', cv_id);
        }

        // 5. Tạo application
        const appResult = await db.query(
            `INSERT INTO applications (job_id, candidate_id, cv_id, cover_letter, status) 
             VALUES ($1, $2, $3, $4, 'pending') 
             RETURNING id, applied_at`,
            [job_id, candidate_id, cv_id, cover_letter || '']
        );

        console.log('✅ Application created, ID:', appResult.rows[0].id);

        // 👇 THÊM: Lấy thông tin candidate và employer để tạo notification
        const candidateResult = await db.query(
            'SELECT full_name FROM users WHERE id = $1',
            [candidate_id]
        );
        const candidateName = candidateResult.rows[0]?.full_name || 'A candidate';

        const employerResult = await db.query(
            'SELECT employer_id FROM jobs WHERE id = $1',
            [job_id]
        );
        const employerId = employerResult.rows[0]?.employer_id;

        // 👇 THÊM: Tạo notification cho employer
        if (employerId) {
            await createNotification(
                employerId,
                'new_application',
                '📝 New Job Application',
                `${candidateName} has applied for your job: ${job.title}`,
                `/employer/jobs/${job_id}/applications`
            );
            console.log(`✅ Notification sent to employer ${employerId}`);
        }

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
              AND COALESCE(u.is_banned, false) = false
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
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        // Verify the application belongs to employer's job
        const checkResult = await db.query(`
            SELECT a.id, j.title, a.candidate_id 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = $1 AND j.employer_id = $2
        `, [id, req.user.id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found or access denied' });
        }

        const application = checkResult.rows[0];

        // Update status
        await db.query(
            'UPDATE applications SET status = $1 WHERE id = $2',
            [status, id]
        );

        // 👇 THÊM: Tạo notification dựa trên status
        const statusMessages = {
            reviewed: {
                title: '✅ Application Reviewed',
                message: `Your application for ${job.title} has been reviewed`,
                icon: '✅'
            },
            accepted: {
                title: '🎉 Application Accepted',
                message: `Congratulations! Your application for ${job.title} has been accepted`,
                icon: '🎉'
            },
            rejected: {
                title: '❌ Application Update',
                message: `Your application for ${job.title} has been updated`,
                icon: '❌'
            }
        };

        const notificationData = statusMessages[status];
        if (notificationData) {
            await createNotification(
                application.candidate_id,
                'application_status',
                notificationData.title,
                notificationData.message,
                `/jobs/${job.id}`
            );
        }

        res.json({ message: 'Application status updated' });
    } catch (error) {
        console.error('Update status error:', error);
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
    try {
        const { applicationId } = req.params;
        const employerId = req.user.id;

        console.log(`📥 Download CV request: applicationId=${applicationId}, employerId=${employerId}`);

        // Get application with CV details
        const result = await db.query(
            `SELECT c.file_path, c.filename, a.job_id, j.employer_id
             FROM applications a
             JOIN cvs c ON a.cv_id = c.id
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = $1 AND j.employer_id = $2`,
            [applicationId, employerId]
        );

        if (result.rows.length === 0) {
            console.warn(`⚠️ Application ${applicationId} not found or access denied`);
            return res.status(404).json({ error: 'Application not found or access denied' });
        }

        const { file_path, filename } = result.rows[0];

        if (!file_path) {
            console.warn(`⚠️ CV file path is null for application ${applicationId}`);
            return res.status(404).json({ error: 'CV file not found' });
        }

        // 👇 GIẢI PHÁP ĐƠN GIẢN & ỔN ĐỊNH NHẤT:
        // Không tạo lại signed URL. Dùng URL gốc và chèn 'fl_attachment'.
        
        let downloadUrl = file_path;

        // 1. Chèn fl_attachment vào sau /upload/ để ép trình duyệt tải về
        // (Tránh lỗi "Customer is marked as untrusted" khi xem trực tiếp)
        if (downloadUrl.includes('/upload/') && !downloadUrl.includes('fl_attachment')) {
            downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }

        // 2. Đảm bảo URL được encode đúng (xử lý khoảng trắng trong tên file)
        // encodeURI sẽ chuyển "CV - Phan Nhat Tan.pdf" thành "CV%20-%20Phan%20Nhat%20Tan.pdf"
        // nhưng giữ nguyên các ký tự của URL (/, :, etc.)
        downloadUrl = encodeURI(downloadUrl);

        console.log(`✅ Generated direct download URL: ${downloadUrl}`);
        
        res.json({
            url: downloadUrl,
            filename: filename
        });

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
    downloadCV
};