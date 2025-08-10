const express = require('express');
const router = express.Router();

// Controllers
const {
  getPlatformStats,
  getAllCreators,
  getAllTransactions,
  promoteToAdmin,
  deleteCreator,
  getCreatorProfile,
  getCreatorImpactStats,
  seedTransactionsFromImpact,
  syncWithImpactSubaffiliates,
  createImpactSubaffiliate,
  testImpactConnection,
  getAvailableBrands,
  updateBrandAvailability,
  updateCreatorStatus,
  setCreatorCommissionRate,
  getCreatorPerformance,
  bulkCreatorActions,
  getAdvancedPlatformAnalytics,
  checkRealImpactData
} = require('../controllers/admin.controller');

// Middleware
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// 📊 Get total platform statistics
router.get('/stats', verifyToken, requireAdmin, getPlatformStats);

// 👥 Get all creators with optional search/sort
router.get('/creators', verifyToken, requireAdmin, getAllCreators);

// 📝 Get pending applications for review
router.get('/applications/pending', verifyToken, requireAdmin, getPendingApplications);

// ✅ Approve/reject applications and assign Impact IDs
router.post('/applications/:creatorId/review', verifyToken, requireAdmin, reviewApplication);

// 👤 Get creator profile
router.get('/creator/:creatorId', verifyToken, requireAdmin, getCreatorProfile);

// 💼 Promote creator to admin
router.put('/creator/:creatorId/promote', verifyToken, requireAdmin, promoteToAdmin);

// ❌ Delete a creator
router.delete('/creator/:creatorId', verifyToken, requireAdmin, deleteCreator);

// 💰 Get all transactions (latest first)
router.get('/transactions', verifyToken, requireAdmin, getAllTransactions);

// 🧠 Get Impact stats
router.get('/creator/:creatorId/impact-stats', verifyToken, requireAdmin, getCreatorImpactStats);

// 🌱 Seed new transactions from Impact
router.post('/seed-transactions', verifyToken, requireAdmin, seedTransactionsFromImpact);

// 🔄 Sync with Impact.com subaffiliates
router.post('/sync-subaffiliates', verifyToken, requireAdmin, syncWithImpactSubaffiliates);

// ➕ Create new Impact.com subaffiliate
router.post('/create-subaffiliate', verifyToken, requireAdmin, createImpactSubaffiliate);

// 🧪 Test Impact.com connection
router.get('/test-impact', verifyToken, requireAdmin, testImpactConnection);

// 🏪 Brand management
router.get('/brands', verifyToken, requireAdmin, getAvailableBrands);
router.put('/brands/:brandId', verifyToken, requireAdmin, updateBrandAvailability);

// 💪 POWERFUL ADMIN: Creator control
router.put('/creator/:creatorId/status', verifyToken, requireAdmin, updateCreatorStatus);
router.put('/creator/:creatorId/commission', verifyToken, requireAdmin, setCreatorCommissionRate);
router.get('/creator/:creatorId/performance', verifyToken, requireAdmin, getCreatorPerformance);
router.post('/creators/bulk-actions', verifyToken, requireAdmin, bulkCreatorActions);

// 📊 POWERFUL ADMIN: Advanced analytics
router.get('/analytics/advanced', verifyToken, requireAdmin, getAdvancedPlatformAnalytics);

// 🔍 Check real Impact.com data availability  
router.get('/check-real-data', verifyToken, requireAdmin, checkRealImpactData);

// Onboarding routes removed

module.exports = router;
