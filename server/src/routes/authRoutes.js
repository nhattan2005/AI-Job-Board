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
const { avatarStorage } = require('../config/cloudinary');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: avatarStorage });

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

router.post('/upload-avatar', verifyToken, upload.single('avatar'), uploadAvatar);

module.exports = router;