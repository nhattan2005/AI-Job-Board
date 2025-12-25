const express = require('express');
const multer = require('multer');
const { avatarStorage } = require('../config/cloudinary'); // 👈 IMPORT
const { register, login, getProfile, updateProfile, uploadAvatar, changePassword, verifyEmailOTP, verifyEmailLink, resendVerification } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// 👇 SỬ DỤNG CLOUDINARY STORAGE
const upload = multer({ storage: avatarStorage });

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

// 👇 ROUTE UPLOAD AVATAR
router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

module.exports = router;