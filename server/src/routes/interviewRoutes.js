const express = require('express');
const { verifyToken, verifyEmployer, verifyCandidate } = require('../middleware/authMiddleware');
const {
    sendInterviewInvitation,
    confirmInterviewSlot,
    getCandidateInterviews,
    getEmployerInterviews,
    getInterviewByApplication
} = require('../controllers/interviewController');

const router = express.Router();

// Employer routes
router.post('/send-invitation', verifyToken, verifyEmployer, sendInterviewInvitation);
router.get('/employer', verifyToken, verifyEmployer, getEmployerInterviews);

// Candidate routes
router.get('/candidate', verifyToken, verifyCandidate, getCandidateInterviews);
router.post('/:applicationId/confirm', verifyToken, verifyCandidate, confirmInterviewSlot);
router.get('/application/:applicationId', verifyToken, verifyCandidate, getInterviewByApplication);

module.exports = router;