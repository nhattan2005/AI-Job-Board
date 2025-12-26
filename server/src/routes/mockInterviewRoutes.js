const express = require('express');
const { verifyToken, verifyCandidate } = require('../middleware/authMiddleware');
const { upload } = require('../controllers/applicationController'); // Reuse upload middleware
const {
    startSession,
    processResponse,
    endSession,
    startPracticeSession
} = require('../controllers/mockInterviewController');
const db = require('../config/database'); // 👈 Import db config

const router = express.Router();

// Existing routes
router.post('/start', verifyToken, verifyCandidate, startSession);
router.post('/chat', verifyToken, verifyCandidate, processResponse);
router.post('/end', verifyToken, verifyCandidate, endSession);

// New route: Start Practice Interview
router.post('/start-practice', verifyToken, verifyCandidate, upload.single('cv'), startPracticeSession);

// 👇 THÊM ROUTE: Get session details
router.get('/session/:sessionId', verifyToken, verifyCandidate, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const result = await db.query(
            'SELECT chat_history FROM mock_interviews WHERE session_id = $1 AND user_id = $2',
            [sessionId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ chat_history: result.rows[0].chat_history || [] });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to get session' });
    }
});

module.exports = router;