const express = require('express');
const { 
    register, 
    verifyEmailOTP, 
    verifyEmailLink, 
    resendVerification, 
    login, 
    getProfile, 
    updateProfile, 
    changePassword,
    uploadAvatar,
    forgotPassword,
    validateResetToken,
    resetPassword
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadAvatar: uploadAvatarMiddleware } = require('../config/cloudinary');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-email-otp', verifyEmailOTP);
router.get('/verify-email/:token', verifyEmailLink);
router.post('/resend-verification', resendVerification);
router.post('/login', login);

// Forgot password routes
router.post('/forgot-password', forgotPassword);
router.get('/validate-reset-token/:token', validateResetToken);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);

// 👇 SỬA DÒNG NÀY - Kiểm tra uploadAvatarMiddleware tồn tại
if (uploadAvatarMiddleware && typeof uploadAvatarMiddleware.single === 'function') {
    router.post('/upload-avatar', verifyToken, uploadAvatarMiddleware.single('avatar'), uploadAvatar);
} else {
    // Fallback nếu uploadAvatarMiddleware không có
    router.post('/upload-avatar', verifyToken, uploadAvatar);
}

module.exports = router;