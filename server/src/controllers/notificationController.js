const db = require('../config/database');

// Get notifications for logged-in user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20 } = req.query;

        const result = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );

        // Get unread count
        const countResult = await db.query(
            'SELECT COUNT(*)::int as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({
            notifications: result.rows,
            unreadCount: countResult.rows[0].unread_count
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await db.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await db.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// Get unread count only
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            'SELECT COUNT(*)::int as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({ unreadCount: result.rows[0].unread_count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

// Helper: Create notification (used by other controllers)
const createNotification = async (userId, type, title, message, link = null) => {
    try {
        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, link) 
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, type, title, message, link]
        );
        console.log(`✅ Notification created for user ${userId}: ${title}`);
    } catch (error) {
        console.error('Create notification error:', error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    createNotification
};