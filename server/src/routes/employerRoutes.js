const express = require('express');
const { verifyToken, verifyEmployer } = require('../middleware/authMiddleware');
const { getEmployerStats, getAllApplications } = require('../controllers/employerController');

const router = express.Router();

router.get('/stats', verifyToken, verifyEmployer, getEmployerStats);
router.get('/all-applications', verifyToken, verifyEmployer, getAllApplications);

module.exports = router;