const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
  getOnboardingStatus,
  updateProfile,
  updateSocialMedia,
  completeOnboarding,
  resetOnboarding,
  getOnboardingAnalytics
} = require('../controllers/onboarding.controller');

// Smart Onboarding Routes - Built with proper auth and error handling

/**
 * @route GET /api/onboarding/status
 * @desc Get current user's onboarding status and progress
 * @access Private
 */
router.get('/status', verifyToken, getOnboardingStatus);

/**
 * @route PUT /api/onboarding/profile
 * @desc Update profile information (Step 1)
 * @access Private
 */
router.put('/profile', verifyToken, updateProfile);

/**
 * @route PUT /api/onboarding/social
 * @desc Update social media links (Step 2)
 * @access Private
 */
router.put('/social', verifyToken, updateSocialMedia);

/**
 * @route POST /api/onboarding/complete
 * @desc Complete the onboarding process
 * @access Private
 */
router.post('/complete', verifyToken, completeOnboarding);

/**
 * @route POST /api/onboarding/reset
 * @desc Reset onboarding for testing (or user choice)
 * @access Private
 */
router.post('/reset', verifyToken, resetOnboarding);

/**
 * @route GET /api/onboarding/analytics
 * @desc Get onboarding completion analytics
 * @access Admin only
 */
router.get('/analytics', verifyToken, requireAdmin, getOnboardingAnalytics);

module.exports = router;
