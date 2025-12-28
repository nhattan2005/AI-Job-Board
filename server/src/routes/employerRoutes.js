const express = require('express');
const { verifyToken, verifyEmployer, verifyCandidate } = require('../middleware/authMiddleware');
const { 
    getEmployerStats, 
    getAllApplications, 
    getEmployerProfile, 
    getEmployerJobs,
    followEmployer,      // 👈 THÊM
    unfollowEmployer,    // 👈 THÊM
    checkFollowStatus    // 👈 THÊM
} = require('../controllers/employerController');

const router = express.Router();

// Public routes (không cần auth)
router.get('/profile/:employerId', getEmployerProfile);
router.get('/profile/:employerId/jobs', getEmployerJobs);

// 👇 THÊM: Follow/Unfollow routes (candidate only)
router.post('/follow/:employerId', verifyToken, verifyCandidate, followEmployer);
router.delete('/unfollow/:employerId', verifyToken, verifyCandidate, unfollowEmployer);
router.get('/follow-status/:employerId', verifyToken, verifyCandidate, checkFollowStatus);

// Protected routes (cần auth)
router.get('/stats', verifyToken, verifyEmployer, getEmployerStats);
router.get('/all-applications', verifyToken, verifyEmployer, getAllApplications);

module.exports = router;