const express = require('express');
const { verifyToken, verifyCandidate, verifyEmployer } = require('../middleware/authMiddleware');
const { 
    upload, 
    applyForJob, 
    getMyApplications, 
    analyzeApplication, 
    updateApplicationStatus,
    checkApplicationStatus 
} = require('../controllers/applicationController');

const router = express.Router();

// Candidate routes
router.post('/apply', verifyToken, verifyCandidate, upload.single('cv'), applyForJob);
router.get('/my-applications', verifyToken, verifyCandidate, getMyApplications);
router.post('/:id/analyze', verifyToken, verifyCandidate, analyzeApplication);
router.get('/check/:jobId', verifyToken, verifyCandidate, checkApplicationStatus);

// Employer routes
router.patch('/:id/status', verifyToken, verifyEmployer, updateApplicationStatus);

module.exports = router;