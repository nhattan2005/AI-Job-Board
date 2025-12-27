const express = require('express');
const { verifyToken, verifyEmployer } = require('../middleware/authMiddleware');
const { getEmployerStats, getAllApplications, getEmployerProfile, getEmployerJobs } = require('../controllers/employerController');

const router = express.Router();

// Public routes (không cần auth)
router.get('/profile/:employerId', getEmployerProfile);
router.get('/profile/:employerId/jobs', getEmployerJobs);

// Protected routes (cần auth)
router.get('/stats', verifyToken, verifyEmployer, getEmployerStats);
router.get('/all-applications', verifyToken, verifyEmployer, getAllApplications);

module.exports = router;