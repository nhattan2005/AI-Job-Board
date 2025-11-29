const express = require('express');
const { upload, uploadCV, extractCVText } = require('../controllers/cvController');

const router = express.Router();

// Use multer middleware from controller
router.post('/upload', upload.single('cv'), uploadCV);
router.post('/extract-text', upload.single('cv'), extractCVText);

module.exports = router;