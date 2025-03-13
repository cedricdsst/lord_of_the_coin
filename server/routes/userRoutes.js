// server/routes/userRoutes.js
const express = require('express');
const { register, login, verifyEmail, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);

// Routes protégées
router.get('/profile', protect, getUserProfile);

module.exports = router;