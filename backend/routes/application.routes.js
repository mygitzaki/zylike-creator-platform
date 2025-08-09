const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
  getApplicationStatus,
  updateProfile,
  updateRequiredSocial,
  updateOptionalPlatforms,
  submitApplication,
  getPendingApplications,
  reviewApplication
} = require('../controllers/application.controller');

// Creator Application System Routes

/**
 * @route GET /api/application/status
 * @desc Get current user's application status and progress
 * @access Private
 */
router.get('/status', verifyToken, getApplicationStatus);

/**
 * @route PUT /api/application/profile
 * @desc Update profile information (Step 1)
 * @access Private
 */
router.put('/profile', verifyToken, updateProfile);

/**
 * @route PUT /api/application/social/required
 * @desc Update required social media platforms (Step 2)
 * @access Private
 */
router.put('/social/required', verifyToken, updateRequiredSocial);

/**
 * @route PUT /api/application/social/optional
 * @desc Update optional platforms and links (Step 3)
 * @access Private
 */
router.put('/social/optional', verifyToken, updateOptionalPlatforms);

/**
 * @route POST /api/application/submit
 * @desc Submit application for admin review
 * @access Private
 */
router.post('/submit', verifyToken, submitApplication);

/**
 * @route GET /api/application/admin/pending
 * @desc Get all pending applications for review
 * @access Admin only
 */
router.get('/admin/pending', verifyToken, requireAdmin, getPendingApplications);

/**
 * @route POST /api/application/admin/review/:creatorId
 * @desc Approve, reject, or request changes for an application
 * @access Admin only
 */
router.post('/admin/review/:creatorId', verifyToken, requireAdmin, reviewApplication);

module.exports = router;
