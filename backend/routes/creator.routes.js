const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  signup,
  login,
  getProfile,
  updateProfile
} = require('../controllers/creator.controller');

// 🚀 NEW SIMPLE CREATOR SYSTEM - Clean Routes

/**
 * @route POST /api/creator/signup
 * @desc Simple creator signup
 * @access Public
 */
router.post('/signup', signup);

/**
 * @route POST /api/creator/login
 * @desc Simple creator login
 * @access Public
 */
router.post('/login', login);

/**
 * @route GET /api/creator/profile
 * @desc Get creator profile
 * @access Private
 */
router.get('/profile', verifyToken, getProfile);

/**
 * @route PUT /api/creator/profile
 * @desc Update creator profile
 * @access Private
 */
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
