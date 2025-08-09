const express = require('express');
const router = express.Router();

const { registerCreator, loginCreator, getProfile, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware'); // ✅ Middleware to verify JWT

// Public routes
router.post('/signup', registerCreator);
router.post('/login', loginCreator);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected route
router.get('/profile', verifyToken, getProfile);

module.exports = router;
