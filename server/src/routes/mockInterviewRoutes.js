const express = require('express');
const router = express.Router();
const { startSession, processResponse, endSession } = require('../controllers/mockInterviewController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/start', verifyToken, startSession);
router.post('/chat', verifyToken, processResponse);
router.post('/end', verifyToken, endSession);

module.exports = router;