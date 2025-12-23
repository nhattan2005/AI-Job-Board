const express = require('express');
const multer = require('multer');
const path = require('path');
const { register, login, getProfile, updateProfile, uploadAvatar, changePassword, verifyEmailOTP, verifyEmailLink, resendVerification } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// 👇 CẤU HÌNH MULTER CHO AVATAR
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/'); // Đảm bảo thư mục này đã tồn tại
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Public routes
router.post('/register', register);
router.post('/verify-email-otp', verifyEmailOTP);
router.get('/verify-email/:token', verifyEmailLink);
router.post('/resend-verification', resendVerification);
router.post('/login', login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.patch('/profile', verifyToken, updateProfile);
router.patch('/change-password', verifyToken, changePassword);
// 👇 THÊM ROUTE UPLOAD AVATAR
router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

module.exports = router;