const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} = require('../controllers/notificationController');

const router = express.Router();

// Get all notifications for logged-in user
router.get('/', verifyToken, getNotifications);

// Get unread count only
router.get('/unread-count', verifyToken, getUnreadCount);

// Mark notification as read
router.patch('/:id/read', verifyToken, markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', verifyToken, markAllAsRead);

// Delete notification
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;