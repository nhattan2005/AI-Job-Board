const express = require('express');
const { verifyToken, verifyEmployer, verifyCandidate } = require('../middleware/authMiddleware');
const {
    sendInterviewInvitation,
    confirmInterviewSlot,
    getCandidateInterviews,
    getEmployerInterviews
} = require('../controllers/interviewController');

const router = express.Router();

// Employer routes
router.post('/invite', verifyToken, verifyEmployer, sendInterviewInvitation);
router.get('/employer', verifyToken, verifyEmployer, getEmployerInterviews);

// Candidate routes
router.get('/candidate', verifyToken, verifyCandidate, getCandidateInterviews);
router.post('/:applicationId/confirm', verifyToken, verifyCandidate, confirmInterviewSlot);

module.exports = router;