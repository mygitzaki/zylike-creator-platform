const express = require('express');
const router = express.Router();

// Controllers
const {
  getPaymentAccount,
  setupPaymentAccount,
  getEarnings,
  getPayoutHistory,
  getPaymentStats
} = require('../controllers/payment.controller');

// Middleware
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// ===== CREATOR PAYMENT ROUTES =====

// Get creator's payment account setup
router.get('/account', verifyToken, getPaymentAccount);

// Update creator's payment account
router.put('/account', verifyToken, updatePaymentAccount);

// Get creator's earnings
router.get('/earnings', verifyToken, getEarnings);

// Get creator's payout history
router.get('/payouts', verifyToken, getPayoutHistory);

// Generate Tipalti onboarding URL
router.post('/tipalti/onboard', verifyToken, generateTipaltiOnboardingUrl);

// ===== ADMIN PAYMENT ROUTES =====

// Process payouts (admin only)
router.post('/admin/process-payouts', verifyToken, requireAdmin, processPayouts);

// Get payment statistics (admin only)
router.get('/admin/stats', verifyToken, requireAdmin, getPaymentStats);

// Test Tipalti connection (admin only)
router.get('/admin/test-tipalti', verifyToken, requireAdmin, testTipaltiConnection);

// ===== WEBHOOK ROUTES =====

// Tipalti webhook endpoint (no auth required, Tipalti will authenticate)
router.post('/webhooks/tipalti', handleTipaltiWebhook);

module.exports = router;


