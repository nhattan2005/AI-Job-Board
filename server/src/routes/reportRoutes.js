const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { createReport, getAllReports, updateReportStatus } = require('../controllers/reportController');

const router = express.Router();

router.post('/', verifyToken, createReport);
router.get('/', verifyToken, verifyAdmin, getAllReports);
router.patch('/:id/status', verifyToken, verifyAdmin, updateReportStatus);

module.exports = router;