// server/routes/gameRoutes.js
const express = require('express');
const { getUserGameHistory, getUserStats, getLeaderboard } = require('../controllers/gameController');
const { protect, emailConfirmed } = require('../middleware/authMiddleware');

const router = express.Router();

// Route publique (accessible sans authentification)
router.get('/leaderboard', getLeaderboard);

// Routes protégées (nécessitent authentification)
router.get('/history', protect, emailConfirmed, getUserGameHistory);
router.get('/stats', protect, emailConfirmed, getUserStats);

module.exports = router;