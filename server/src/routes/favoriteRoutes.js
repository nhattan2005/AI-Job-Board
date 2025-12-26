const express = require('express');
const { verifyToken, verifyCandidate } = require('../middleware/authMiddleware');
const {
    getFavoriteJobs,
    addFavoriteJob,
    removeFavoriteJob,
    checkIsFavorite
} = require('../controllers/favoriteController');

const router = express.Router();

// Candidate routes
router.get('/my-favorites', verifyToken, verifyCandidate, getFavoriteJobs);
router.post('/add', verifyToken, verifyCandidate, addFavoriteJob);
router.delete('/remove/:jobId', verifyToken, verifyCandidate, removeFavoriteJob);
router.get('/check/:jobId', verifyToken, verifyCandidate, checkIsFavorite);

module.exports = router;