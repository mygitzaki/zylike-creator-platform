const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
  getComprehensiveStats,
  getComprehensiveAnalytics,
  getCreatorsWithAnalytics,
  getCreatorDetails
} = require('../controllers/admin.comprehensive.controller');

// Apply auth middleware to all routes
router.use(verifyToken);
router.use(requireAdmin);

// Comprehensive admin statistics
router.get('/stats', getComprehensiveStats);

// Comprehensive analytics (traffic, revenue trends, etc.)
router.get('/analytics/comprehensive', getComprehensiveAnalytics);

// Get creators with performance analytics
router.get('/creators', getCreatorsWithAnalytics);

// Get detailed creator information
router.get('/creator/:creatorId', getCreatorDetails);

module.exports = router;
