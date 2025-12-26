const express = require('express');
const multer = require('multer');
const { bannerStorage } = require('../config/cloudinary');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const {
    getActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require('../controllers/bannerController');

const router = express.Router();
const upload = multer({ storage: bannerStorage });

// Public routes
router.get('/active', getActiveBanners);

// Admin routes
router.get('/all', verifyToken, verifyAdmin, getAllBanners);
router.post('/', verifyToken, verifyAdmin, upload.single('image'), createBanner);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), updateBanner);
router.delete('/:id', verifyToken, verifyAdmin, deleteBanner);

module.exports = router;