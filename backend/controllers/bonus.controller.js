const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Bonus tier configuration
const BONUS_TIERS = [
  { tier: 0, threshold: 0, bonus: 0 },
  { tier: 1, threshold: 5000, bonus: 50 },
  { tier: 2, threshold: 10000, bonus: 100 },
  { tier: 3, threshold: 20000, bonus: 200 },
  { tier: 4, threshold: 30000, bonus: 300 }
];

/**
 * Get creator's bonus tracker status
 */
exports.getBonusTracker = async (req, res) => {
  try {
    const creatorId = req.creator.id;

    // Get or create bonus tracker
    let bonusTracker = await prisma.bonusTracker.findUnique({
      where: { creatorId },
      include: {
        bonusPayouts: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!bonusTracker) {
      bonusTracker = await prisma.bonusTracker.create({
        data: {
          creatorId,
          currentPeriodStart: new Date(),
          currentPeriodSales: 0,
          currentTier: 0,
          currentTierBonus: 0,
          totalCommissionableSales: 0,
          totalBonusesEarned: 0,
          nextPayoutDate: getNextPayoutDate()
        },
        include: {
          bonusPayouts: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    }

    // Calculate next tier information
    const nextTier = calculateNextTier(bonusTracker.currentPeriodSales);
    const currentTierInfo = BONUS_TIERS[bonusTracker.currentTier];
    
    res.json({
      bonusTracker: {
        ...bonusTracker,
        tierInfo: {
          current: currentTierInfo,
          next: nextTier,
          allTiers: BONUS_TIERS,
          progressToNext: nextTier ? 
            ((bonusTracker.currentPeriodSales / nextTier.threshold) * 100).toFixed(1) : 100
        }
      }
    });

  } catch (error) {
    console.error('Get bonus tracker error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bonus tracker',
      error: error.message 
    });
  }
};

/**
 * Update bonus tracker when a new commissionable sale occurs
 * This should be called automatically when transactions are created
 */
exports.updateBonusTracker = async (creatorId, saleAmount, isCommissionable = true) => {
  try {
    if (!isCommissionable) {
      console.log(`Skipping bonus tracking for creator ${creatorId}: Non-commissionable sale of $${saleAmount}`);
      return; // Only track commissionable sales
    }

    // Get or create bonus tracker
    let bonusTracker = await prisma.bonusTracker.findUnique({
      where: { creatorId }
    });

    if (!bonusTracker) {
      bonusTracker = await prisma.bonusTracker.create({
        data: {
          creatorId,
          currentPeriodStart: new Date(),
          currentPeriodSales: 0,
          currentTier: 0,
          currentTierBonus: 0,
          totalCommissionableSales: 0,
          totalBonusesEarned: 0,
          nextPayoutDate: getNextPayoutDate()
        }
      });
    }

    // Calculate new sales totals
    const newPeriodSales = bonusTracker.currentPeriodSales + saleAmount;
    const newTotalSales = bonusTracker.totalCommissionableSales + saleAmount;

    // Check if a new tier was achieved
    const previousTier = bonusTracker.currentTier;
    const newTier = calculateTierFromSales(newPeriodSales);
    
    let bonusEarned = 0;
    let newTotalBonuses = bonusTracker.totalBonusesEarned;

    // If tier increased, create bonus payout (non-cumulative)
    if (newTier.tier > previousTier && newTier.tier > 0) {
      bonusEarned = newTier.bonus;
      newTotalBonuses += bonusEarned;

      // Create bonus payout record
      await prisma.bonusPayout.create({
        data: {
          creatorId,
          bonusTrackerId: bonusTracker.id,
          tierAchieved: newTier.tier,
          bonusAmount: bonusEarned,
          salesVolume: newPeriodSales,
          periodStart: bonusTracker.currentPeriodStart,
          periodEnd: new Date(),
          status: 'EARNED',
          availableAt: getNextPayoutDate() // Available on next payout cycle
        }
      });
    }

    // Update bonus tracker
    await prisma.bonusTracker.update({
      where: { creatorId },
      data: {
        currentPeriodSales: newPeriodSales,
        totalCommissionableSales: newTotalSales,
        currentTier: newTier.tier,
        currentTierBonus: newTier.bonus,
        totalBonusesEarned: newTotalBonuses,
        lastBonusEarned: bonusEarned > 0 ? new Date() : bonusTracker.lastBonusEarned,
        isPendingPayout: bonusEarned > 0 ? true : bonusTracker.isPendingPayout
      }
    });

    return {
      tierChanged: newTier.tier > previousTier,
      bonusEarned,
      newTier: newTier.tier,
      newSales: newPeriodSales
    };

  } catch (error) {
    console.error('Update bonus tracker error:', error);
    throw error;
  }
};

/**
 * Reset bonus tracker for new period (called on payout completion)
 */
exports.resetBonusTracker = async (creatorId) => {
  try {
    await prisma.bonusTracker.update({
      where: { creatorId },
      data: {
        currentPeriodStart: new Date(),
        currentPeriodSales: 0,
        currentTier: 0,
        currentTierBonus: 0,
        isPendingPayout: false,
        nextPayoutDate: getNextPayoutDate()
      }
    });

  } catch (error) {
    console.error('Reset bonus tracker error:', error);
    throw error;
  }
};

/**
 * Get bonus payouts ready for payout processing
 */
exports.getBonusPayoutsForPayout = async (creatorId) => {
  try {
    const availableBonuses = await prisma.bonusPayout.findMany({
      where: {
        creatorId,
        status: 'EARNED',
        availableAt: { lte: new Date() },
        payoutId: null
      }
    });

    return availableBonuses;

  } catch (error) {
    console.error('Get bonus payouts error:', error);
    throw error;
  }
};

/**
 * Mark bonus payouts as paid
 */
exports.markBonusPayoutsAsPaid = async (bonusPayoutIds, payoutId) => {
  try {
    await prisma.bonusPayout.updateMany({
      where: { id: { in: bonusPayoutIds } },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        payoutId
      }
    });

  } catch (error) {
    console.error('Mark bonus payouts as paid error:', error);
    throw error;
  }
};

// === HELPER FUNCTIONS ===

function calculateTierFromSales(sales) {
  // Find the highest tier the sales amount qualifies for
  let tier = BONUS_TIERS[0];
  
  for (let i = BONUS_TIERS.length - 1; i >= 0; i--) {
    if (sales >= BONUS_TIERS[i].threshold) {
      tier = BONUS_TIERS[i];
      break;
    }
  }
  
  return tier;
}

function calculateNextTier(currentSales) {
  // Find the next tier above current sales
  for (let i = 0; i < BONUS_TIERS.length; i++) {
    if (currentSales < BONUS_TIERS[i].threshold) {
      return BONUS_TIERS[i];
    }
  }
  
  return null; // Already at highest tier
}

function getNextPayoutDate() {
  // Default to first of next month for bonus payouts
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

// Admin function to get all bonus statistics
exports.getBonusStatistics = async (req, res) => {
  try {
    const stats = await prisma.bonusTracker.aggregate({
      _sum: {
        totalBonusesEarned: true,
        totalCommissionableSales: true
      },
      _count: {
        id: true
      }
    });

    const recentBonuses = await prisma.bonusPayout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        creator: {
          select: { name: true, email: true }
        }
      }
    });

    const tierDistribution = await prisma.bonusTracker.groupBy({
      by: ['currentTier'],
      _count: { currentTier: true }
    });

    res.json({
      statistics: {
        totalBonusesPaid: stats._sum.totalBonusesEarned || 0,
        totalCommissionableSales: stats._sum.totalCommissionableSales || 0,
        activeTrackers: stats._count.id || 0,
        tierDistribution,
        recentBonuses
      }
    });

  } catch (error) {
    console.error('Get bonus statistics error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bonus statistics',
      error: error.message 
    });
  }
};
