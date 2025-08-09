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

// ===== CREATOR PAYMENT ROUTES =====

// Get creator's payment account setup
router.get('/account', verifyToken, getPaymentAccount);

// Setup/Update creator's payment account
router.post('/setup', verifyToken, setupPaymentAccount);

// Get creator's earnings
router.get('/earnings', verifyToken, getEarnings);

// Get creator's payout history
router.get('/payouts', verifyToken, getPayoutHistory);

// Get payment statistics
router.get('/stats', verifyToken, getPaymentStats);

module.exports = router;
