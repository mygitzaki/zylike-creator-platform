const express = require('express');
const router = express.Router();

// Controllers
const {
  getBonusTracker,
  getBonusStatistics
} = require('../controllers/bonus.controller');

// Middleware
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// ===== CREATOR BONUS ROUTES =====

// Get creator's bonus tracker status
router.get('/tracker', verifyToken, getBonusTracker);

// Test endpoint to simulate sales (development only)
router.post('/test-sale', verifyToken, async (req, res) => {
  try {
    const { amount = 1000 } = req.body;
    const { updateBonusTracker } = require('../controllers/bonus.controller');
    
    const result = await updateBonusTracker(req.creator.id, amount, true);
    res.json({ 
      message: `Test sale of $${amount} added`,
      result 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ADMIN BONUS ROUTES =====

// Get bonus statistics (admin only)
router.get('/admin/statistics', verifyToken, requireAdmin, getBonusStatistics);

module.exports = router;
