const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
  getAllCreators,
  getPlatformStats,
  updateCreatorImpactId,
  updateCreatorCommission,
  bulkUpdateCommissionRates,
  getCreatorDetails,
  reviewApplication,
  toggleCreatorStatus,
  deleteCreator
} = require('../controllers/admin.simple.controller');

// 🔐 All routes require admin authentication
router.use(verifyToken, requireAdmin);

// 📊 Get all creators
router.get('/creators', getAllCreators);

// 📈 Get platform statistics
router.get('/stats', getPlatformStats);

// 👤 Get specific creator details
router.get('/creators/:creatorId', getCreatorDetails);

// 🔗 Update creator's Impact.com ID
router.put('/creators/:creatorId/impact-id', updateCreatorImpactId);

// 💰 Update creator's commission rate
router.put('/creators/:creatorId/commission', updateCreatorCommission);

// 📊 Bulk update commission rates
router.post('/creators/bulk-commission', bulkUpdateCommissionRates);

// 📝 Review creator application
router.post('/creators/:creatorId/review', reviewApplication);

// 🔄 Activate/Deactivate creator account
router.put('/creators/:creatorId/status', toggleCreatorStatus);

// 🗑️ Delete creator
router.delete('/creators/:creatorId', deleteCreator);

module.exports = router;
