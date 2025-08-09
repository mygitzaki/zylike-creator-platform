const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const payoutController = require('../controllers/payout.controller');

// Creator endpoints
router.get('/status', verifyToken, async (req, res) => {
  try {
    const status = await payoutController.getCreatorPayoutStatus(req.creator.id);
    res.json({ success: true, status });
  } catch (error) {
    console.error('Get payout status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payout status' });
  }
});

// Admin endpoints
router.get('/admin/pending', verifyToken, requireAdmin, async (req, res) => {
  try {
    const pendingPayouts = await payoutController.getAllPendingPayouts();
    res.json({ success: true, payouts: pendingPayouts });
  } catch (error) {
    console.error('Get pending payouts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending payouts' });
  }
});

router.post('/admin/process', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await payoutController.processScheduledPayouts();
    res.json({ 
      success: true, 
      message: `Processed ${result.processed} payouts totaling $${result.totalAmount.toFixed(2)}`,
      result 
    });
  } catch (error) {
    console.error('Process payouts error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payouts' });
  }
});

router.post('/admin/manual/:creatorId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { notes } = req.body;
    
    const payout = await payoutController.processManualPayout(
      creatorId, 
      req.creator.id, 
      notes
    );
    
    res.json({ 
      success: true, 
      message: `Manual payout of $${payout.totalAmount.toFixed(2)} processed for creator`,
      payout 
    });
  } catch (error) {
    console.error('Manual payout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// System endpoint for scheduled jobs
router.post('/system/scheduled', async (req, res) => {
  try {
    // This would be called by a cron job or scheduled task
    // Add basic authentication/API key check here
    const result = await payoutController.processScheduledPayouts();
    res.json({ 
      success: true, 
      message: `Scheduled payouts processed: ${result.processed} payouts, $${result.totalAmount.toFixed(2)} total`,
      result 
    });
  } catch (error) {
    console.error('Scheduled payout error:', error);
    res.status(500).json({ success: false, message: 'Failed to process scheduled payouts' });
  }
});

// Test endpoint for development
router.get('/test/next-payout', async (req, res) => {
  try {
    const nextDate = payoutController.getNextPayoutDate();
    res.json({ 
      success: true, 
      nextPayoutDate: nextDate,
      daysUntilNext: Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get next payout date' });
  }
});

module.exports = router;
