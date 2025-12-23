const express = require('express');
const { createJob, getJobs, getJobById, getMyJobs, getJobApplications, updateJob } = require('../controllers/jobController');
const { verifyToken, verifyEmployer } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getJobs);

// 👇 MOVE THIS UP (Specific routes must come before dynamic routes like /:id)
router.get('/my-jobs', verifyToken, verifyEmployer, getMyJobs);

// Dynamic routes (Generic /:id must be last)
router.get('/:id', getJobById);

// Employer routes
router.post('/', verifyToken, verifyEmployer, createJob);
// router.get('/my-jobs', ...) <-- REMOVE FROM HERE
router.get('/:id/applications', verifyToken, verifyEmployer, getJobApplications);
router.put('/:id', verifyToken, verifyEmployer, updateJob);

module.exports = router;