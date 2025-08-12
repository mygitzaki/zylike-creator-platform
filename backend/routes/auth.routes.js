const express = require('express');
const router = express.Router();

const { loginCreator, getProfile, forgotPassword, resetPassword, createAdmin } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware'); // ✅ Middleware to verify JWT

// Public routes
// router.post('/signup', registerCreator); // 🧹 REMOVED - Moved to creator system
router.post('/login', loginCreator);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/create-admin', createAdmin); // 🔐 Create admin account (one-time use)

// Protected route
router.get('/profile', verifyToken, getProfile);

module.exports = router;
