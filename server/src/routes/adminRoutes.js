const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const {
    getDashboardStats,
    getAllUsers,
    toggleBanUser,
    getAllJobsAdmin,
    toggleHideJob,
    getAdminActions
} = require('../controllers/adminController');

const router = express.Router();

// Tất cả routes đều cần verifyToken + verifyAdmin
router.use(verifyToken, verifyAdmin);

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/actions', getAdminActions);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:userId/ban', toggleBanUser);

// Job management
router.get('/jobs', getAllJobsAdmin);
router.patch('/jobs/:jobId/hide', toggleHideJob);

module.exports = router;