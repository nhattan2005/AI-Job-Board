const express = require('express');
const CareerController = require('../controllers/careerController');

const router = express.Router();

router.post('/generate-career-path', CareerController.generateCareerPath);

module.exports = router;