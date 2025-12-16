const express = require('express');
const { verifyToken, verifyEmployer, verifyCandidate } = require('../middleware/authMiddleware');
const {
    sendInterviewInvitation,
    getInterviewDetails,
    confirmInterviewSlot,
    getEmployerInterviews,
    getCandidateInterviews
} = require('../controllers/interviewController');

const router = express.Router();

// Employer routes
router.post('/send-invitation', verifyToken, verifyEmployer, sendInterviewInvitation);
router.get('/employer/list', verifyToken, verifyEmployer, getEmployerInterviews);

// Candidate routes
router.get('/application/:applicationId', verifyToken, verifyCandidate, getInterviewDetails);
router.post('/confirm', verifyToken, verifyCandidate, confirmInterviewSlot);
router.get('/candidate/list', verifyToken, verifyCandidate, getCandidateInterviews);

module.exports = router;