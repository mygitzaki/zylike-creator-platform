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
  checkRealImpactData,
  getPendingApplications,
  reviewApplication,
  updateCreatorImpactIds,
  removeCreatorImpactIds,
  bulkUpdateCreatorStatus,
  getCreatorManagementSummary,
  getAllCreatorApplications,
  getCreatorDetails,
  updateCreatorDetails,
  getCreatorByEmail,
  discoverAvailablePrograms,
  bulkUpdateCommissionRates
} = require('../controllers/admin.controller');

// Middleware
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// 📊 Get total platform statistics
router.get('/stats', verifyToken, requireAdmin, getPlatformStats);

// 👥 Get all creators with optional search/sort
router.get('/creators', verifyToken, requireAdmin, getAllCreators);

// 📝 Get pending applications for review
router.get('/applications/pending', verifyToken, requireAdmin, getPendingApplications);

// 📋 Get ALL creator applications (pending, approved, rejected)
router.get('/applications/all', verifyToken, requireAdmin, getAllCreatorApplications);

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

// 🆔 POWERFUL ADMIN: Impact ID Management
router.put('/creator/:creatorId/impact-ids', verifyToken, requireAdmin, updateCreatorImpactIds);
router.delete('/creator/:creatorId/impact-ids', verifyToken, requireAdmin, removeCreatorImpactIds);

// 👤 Creator Details Management
router.get('/creator/:creatorId/details', verifyToken, requireAdmin, getCreatorDetails);
router.put('/creator/:creatorId/details', verifyToken, requireAdmin, updateCreatorDetails);

// 🔄 POWERFUL ADMIN: Bulk Creator Management
router.post('/creators/bulk-status', verifyToken, requireAdmin, bulkUpdateCreatorStatus);

// 💰 POWERFUL ADMIN: Bulk Commission Rate Updates
router.post('/creators/bulk-commission', verifyToken, requireAdmin, bulkUpdateCommissionRates);

// 📊 POWERFUL ADMIN: Creator Management Summary
router.get('/creators/summary', verifyToken, requireAdmin, getCreatorManagementSummary);

// 🔍 TEMP: Check creator by email (for debugging)
router.get('/creator/email', verifyToken, requireAdmin, getCreatorByEmail);

// 🔍 DISCOVERY: Get all available Impact.com programs/brands
router.get('/programs/discover', verifyToken, requireAdmin, discoverAvailablePrograms);

// 🧪 TEMP: Test endpoint removed - brand discovery confirmed working

// Onboarding routes removed

// 🔧 TEMPORARY DEBUG: Check database data
router.get('/debug/database', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN DEBUG: Checking database data...');
    
    // Check if commissionRate column exists
    const columnExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'Creator' AND column_name = 'commissionRate'
    `;
    
    const columnExistsResult = columnExists[0].count > 0;
    console.log('📊 commissionRate column exists:', columnExistsResult);
    
    if (columnExistsResult) {
      // Check what's actually in the commissionRate field
      const commissionData = await prisma.$queryRaw`
        SELECT "id", "name", "email", "commissionRate", "commissionReason", "commissionUpdatedAt"
        FROM "Creator" 
        ORDER BY "name"
        LIMIT 10
      `;
      
      console.log('📊 Commission rate data from database:', commissionData);
      
      // Check for NULL values
      const nullCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Creator" 
        WHERE "commissionRate" IS NULL
      `;
      
      // Check for non-NULL values
      const notNullCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Creator" 
        WHERE "commissionRate" IS NOT NULL
      `;
      
      res.json({
        success: true,
        columnExists: columnExistsResult,
        sampleData: commissionData,
        nullCount: nullCount[0].count,
        notNullCount: notNullCount[0].count,
        totalCreators: nullCount[0].count + notNullCount[0].count
      });
    } else {
      res.json({
        success: false,
        columnExists: false,
        error: 'commissionRate column does not exist'
      });
    }
    
  } catch (error) {
    console.error('❌ ADMIN DEBUG Error:', error);
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
});

module.exports = router;
