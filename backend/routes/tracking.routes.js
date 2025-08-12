const express = require('express');
const router = express.Router();

// Controllers
const {
  trackClick,
  getCreatorAnalytics,
  recordConversion,
  getPlatformAnalytics,
  testCommissionCalculation
} = require('../controllers/tracking.controller');

// Middleware
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// 🖱️ Public route: Track clicks and redirect (no auth required)
router.get('/click/:shortCode', trackClick);

// 📊 Creator analytics (requires auth)
router.get('/analytics', verifyToken, getCreatorAnalytics);

// 💰 Webhook for Impact.com conversions (no auth - webhook)
router.post('/conversion', recordConversion);

// 📈 Platform-wide analytics (admin only)
router.get('/platform-analytics', verifyToken, requireAdmin, getPlatformAnalytics);

// 🧪 Test commission calculation (admin only - for development)
router.post('/test-commission', verifyToken, requireAdmin, testCommissionCalculation);

module.exports = router;

