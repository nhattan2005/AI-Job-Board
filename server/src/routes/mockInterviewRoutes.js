const express = require('express');
const router = express.Router();
const { startSession, processResponse } = require('../controllers/mockInterviewController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/start', verifyToken, startSession);
router.post('/chat', verifyToken, processResponse);

module.exports = router;