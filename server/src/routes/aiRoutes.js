const express = require('express');
const multer = require('multer');
const { getJobMatchingScore, tailorCV } = require('../controllers/aiController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Route to calculate job matching score
router.post('/match', upload.single('cv'), getJobMatchingScore);

// Route to tailor CV
router.post('/tailor-cv', upload.single('cv'), tailorCV);

module.exports = router;