const express = require('express');
const { verifyToken, verifyEmployer, verifyCandidate } = require('../middleware/authMiddleware');
const {
    sendInterviewInvitation,
    sendBulkInterviewInvitations,
    confirmInterviewSlot,
    getCandidateInterviews,
    getEmployerInterviews,
    getInterviewByApplication
} = require('../controllers/interviewController');

const router = express.Router();

// --- Employer Routes ---
// Gửi lời mời phỏng vấn (1 người)
router.post('/send-invitation', verifyToken, verifyEmployer, sendInterviewInvitation);

// Gửi lời mời phỏng vấn (Nhiều người - Bulk)
router.post('/send-bulk-invitation', verifyToken, verifyEmployer, sendBulkInterviewInvitations);

// Lấy danh sách phỏng vấn của Employer
router.get('/employer', verifyToken, verifyEmployer, getEmployerInterviews);


// --- Candidate Routes ---
// Xác nhận lịch phỏng vấn
router.post('/:applicationId/confirm', verifyToken, verifyCandidate, confirmInterviewSlot);

// Lấy danh sách phỏng vấn của Candidate
router.get('/candidate', verifyToken, verifyCandidate, getCandidateInterviews);


// --- Shared/Common Routes ---
// Lấy chi tiết phỏng vấn theo Application ID (dùng cho trang xác nhận của Candidate)
router.get('/application/:applicationId', verifyToken, getInterviewByApplication);

module.exports = router;