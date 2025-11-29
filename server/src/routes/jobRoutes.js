const express = require('express');
const { createJob, getJobs, getJobById, getMyJobs, getJobApplications } = require('../controllers/jobController');
const { verifyToken, verifyEmployer } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getJobs);

// Protected routes (Employer only)
router.post('/', verifyToken, verifyEmployer, createJob);
router.get('/my-jobs', verifyToken, verifyEmployer, getMyJobs);
router.get('/:id/applications', verifyToken, verifyEmployer, getJobApplications);

// Dynamic route - must be LAST
router.get('/:id', getJobById);

module.exports = router;