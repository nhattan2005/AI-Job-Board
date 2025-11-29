const express = require('express');
const { getJobMatchingScore, getTailoredCV } = require('../controllers/aiController');

const router = express.Router();

// Route to calculate job matching score
router.post('/match', getJobMatchingScore);

// Route to tailor CV
router.post('/tailor-cv', getTailoredCV);

module.exports = router;