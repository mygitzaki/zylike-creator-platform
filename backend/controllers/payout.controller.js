const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * CONSERVATIVE PAYOUT STRATEGY - Option A
 * 
 * Cash Flow Timeline:
 * - Day 0: Sale made
 * - Day 35: We receive money from Walmart/Impact.com
 * - Day 45: Creator funds unlock (10+ day safety buffer)
 * - 15th/30th: Scheduled payouts
 * 
 * Rules:
 * - 15 days: Minimum eligibility period
 * - 45 days: Lock period (safety buffer)
 * - $25: Minimum payout threshold
 * - Force payout after 45 days regardless of minimum
 * - Payouts on 15th and 30th of every month
 */

// Get next payout date (15th or 30th)
const getNextPayoutDate = () => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let nextPayoutDate;
  
  if (currentDay < 15) {
    // Next payout is 15th of current month
    nextPayoutDate = new Date(currentYear, currentMonth, 15);
  } else if (currentDay < 30) {
    // Next payout is 30th of current month (or last day if month has <30 days)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const payoutDay = Math.min(30, lastDayOfMonth);
    nextPayoutDate = new Date(currentYear, currentMonth, payoutDay);
  } else {
    // Next payout is 15th of next month
    nextPayoutDate = new Date(currentYear, currentMonth + 1, 15);
  }
  
  return nextPayoutDate;
};

// Calculate eligibility and lock dates for new earnings
const calculatePaymentDates = (earnedAt) => {
  const earnedDate = new Date(earnedAt);
  
  // 15 days from earned date (eligible for payout)
  const eligibleAt = new Date(earnedDate);
  eligibleAt.setDate(eligibleAt.getDate() + 15);
  
  // 45 days from earned date (lock period ends)
  const lockedUntil = new Date(earnedDate);
  lockedUntil.setDate(lockedUntil.getDate() + 45);
  
  return { eligibleAt, lockedUntil };
};

// Create earning record with proper payment timeline
const createEarning = async (transactionData) => {
  try {
    const { eligibleAt, lockedUntil } = calculatePaymentDates(transactionData.earnedAt || new Date());
    
    const earning = await prisma.earning.create({
      data: {
        ...transactionData,
        eligibleAt,
        lockedUntil,
        status: 'LOCKED' // Initial status
      }
    });
    
    console.log(`📈 Created earning: $${earning.netAmount} for creator ${earning.creatorId}`);
    console.log(`⏱️ Eligible: ${eligibleAt.toDateString()}, Lock ends: ${lockedUntil.toDateString()}`);
    
    return earning;
  } catch (error) {
    console.error('Error creating earning:', error);
    throw error;
  }
};

// Get all earnings ready for payout
const getEarningsReadyForPayout = async () => {
  const now = new Date();
  
  try {
    // Get earnings that are past their lock period (45+ days old)
    const forcedPayoutEarnings = await prisma.earning.findMany({
      where: {
        status: 'LOCKED',
        lockedUntil: {
          lte: now // Lock period has ended
        }
      },
      include: {
        creator: {
          include: {
            paymentAccount: true
          }
        }
      }
    });
    
    // Get earnings that are eligible (15+ days) AND creator has $25+ balance
    const eligibleEarnings = await prisma.earning.findMany({
      where: {
        status: 'LOCKED',
        eligibleAt: {
          lte: now // Eligible period has passed
        },
        lockedUntil: {
          gt: now // Still within lock period
        }
      },
      include: {
        creator: {
          include: {
            paymentAccount: true
          }
        }
      }
    });
    
    // Group by creator and calculate totals
    const creatorPayouts = new Map();
    
    // Process forced payouts (45+ days old)
    forcedPayoutEarnings.forEach(earning => {
      const creatorId = earning.creatorId;
      if (!creatorPayouts.has(creatorId)) {
        creatorPayouts.set(creatorId, {
          creator: earning.creator,
          earnings: [],
          totalAmount: 0,
          forcePayoutAmount: 0,
          eligibleAmount: 0
        });
      }
      
      const payout = creatorPayouts.get(creatorId);
      payout.earnings.push(earning);
      payout.totalAmount += earning.netAmount;
      payout.forcePayoutAmount += earning.netAmount;
    });
    
    // Process eligible payouts (check $25 minimum)
    eligibleEarnings.forEach(earning => {
      const creatorId = earning.creatorId;
      if (!creatorPayouts.has(creatorId)) {
        creatorPayouts.set(creatorId, {
          creator: earning.creator,
          earnings: [],
          totalAmount: 0,
          forcePayoutAmount: 0,
          eligibleAmount: 0
        });
      }
      
      const payout = creatorPayouts.get(creatorId);
      payout.eligibleAmount += earning.netAmount;
    });
    
    // Filter creators who meet payout criteria
    const readyForPayout = [];
    
    creatorPayouts.forEach((payout, creatorId) => {
      const { creator, earnings, totalAmount, forcePayoutAmount, eligibleAmount } = payout;
      const minimumPayout = creator.paymentAccount?.minimumPayout || 25.00;
      
      // Include if: forced payout (45+ days) OR eligible amount >= minimum
      if (forcePayoutAmount > 0 || eligibleAmount >= minimumPayout) {
        // Add eligible earnings if we're doing a payout
        if (forcePayoutAmount > 0 || eligibleAmount >= minimumPayout) {
          eligibleEarnings
            .filter(e => e.creatorId === creatorId)
            .forEach(earning => {
              if (!earnings.find(e => e.id === earning.id)) {
                earnings.push(earning);
                payout.totalAmount += earning.netAmount;
              }
            });
        }
        
        readyForPayout.push({
          creator,
          earnings,
          totalAmount: payout.totalAmount,
          reason: forcePayoutAmount > 0 ? 'FORCED_45_DAY' : 'MINIMUM_THRESHOLD'
        });
      }
    });
    
    return readyForPayout;
  } catch (error) {
    console.error('Error getting earnings ready for payout:', error);
    throw error;
  }
};

// Process scheduled payouts (runs on 15th and 30th)
const processScheduledPayouts = async () => {
  try {
    console.log('🏦 Processing scheduled payouts...');
    
    const readyForPayout = await getEarningsReadyForPayout();
    
    if (readyForPayout.length === 0) {
      console.log('✅ No payouts ready for processing');
      return { processed: 0, totalAmount: 0 };
    }
    
    const processedPayouts = [];
    let totalProcessed = 0;
    
    for (const payoutData of readyForPayout) {
      try {
        const payout = await createPayout(payoutData);
        processedPayouts.push(payout);
        totalProcessed += payout.totalAmount;
        
        console.log(`💰 Processed payout: $${payout.totalAmount} for ${payout.creator.name} (${payout.reason})`);
      } catch (error) {
        console.error(`❌ Failed to process payout for creator ${payoutData.creator.id}:`, error);
      }
    }
    
    console.log(`🎉 Completed scheduled payouts: ${processedPayouts.length} payouts, $${totalProcessed.toFixed(2)} total`);
    
    return {
      processed: processedPayouts.length,
      totalAmount: totalProcessed,
      payouts: processedPayouts
    };
  } catch (error) {
    console.error('Error processing scheduled payouts:', error);
    throw error;
  }
};

// Create individual payout record
const createPayout = async (payoutData) => {
  const { creator, earnings, totalAmount, reason } = payoutData;
  
  try {
    const payout = await prisma.$transaction(async (prisma) => {
      // Create payout record
      const payout = await prisma.payout.create({
        data: {
          creatorId: creator.id,
          totalAmount,
          paymentMethod: creator.paymentAccount?.preferredMethod || 'BANK_TRANSFER',
          currency: 'USD',
          status: 'PENDING',
          scheduledAt: new Date(),
          adminNotes: `Auto-generated payout - ${reason}`
        }
      });
      
      // Update all earnings to reference this payout
      const earningIds = earnings.map(e => e.id);
      await prisma.earning.updateMany({
        where: {
          id: { in: earningIds }
        },
        data: {
          status: 'PENDING_PAYOUT',
          payoutId: payout.id,
          availableAt: new Date()
        }
      });
      
      return payout;
    });
    
    // TODO: Integrate with Tipalti API to actually send payment
    // await tipaltiService.createPayment(payout);
    
    return { ...payout, creator, reason };
  } catch (error) {
    console.error('Error creating payout:', error);
    throw error;
  }
};

// Get payout status for creator dashboard
const getCreatorPayoutStatus = async (creatorId) => {
  try {
    const now = new Date();
    
    // Get earnings breakdown
    const [lockedEarnings, eligibleEarnings, pendingPayouts, completedPayouts] = await Promise.all([
      // Locked earnings (not yet eligible)
      prisma.earning.findMany({
        where: {
          creatorId,
          status: 'LOCKED',
          eligibleAt: { gt: now }
        },
        orderBy: { earnedAt: 'desc' }
      }),
      
      // Eligible earnings (ready for payout)
      prisma.earning.findMany({
        where: {
          creatorId,
          status: 'LOCKED',
          eligibleAt: { lte: now }
        },
        orderBy: { earnedAt: 'desc' }
      }),
      
      // Pending payouts
      prisma.payout.findMany({
        where: {
          creatorId,
          status: { in: ['PENDING', 'PROCESSING'] }
        },
        include: { earnings: true },
        orderBy: { scheduledAt: 'desc' }
      }),
      
      // Completed payouts (last 10)
      prisma.payout.findMany({
        where: {
          creatorId,
          status: 'COMPLETED'
        },
        include: { earnings: true },
        orderBy: { completedAt: 'desc' },
        take: 10
      })
    ]);
    
    const lockedAmount = lockedEarnings.reduce((sum, e) => sum + e.netAmount, 0);
    const eligibleAmount = eligibleEarnings.reduce((sum, e) => sum + e.netAmount, 0);
    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.totalAmount, 0);
    
    // Calculate next payout info
    const nextPayoutDate = getNextPayoutDate();
    const minimumPayout = 25.00; // Could get from creator's payment account
    
    // Check if creator will get paid on next payout date
    const willGetPaidNext = eligibleAmount >= minimumPayout || 
                            eligibleEarnings.some(e => new Date(e.lockedUntil) <= nextPayoutDate);
    
    return {
      summary: {
        lockedAmount,
        eligibleAmount,
        pendingAmount,
        nextPayoutDate,
        willGetPaidNext,
        minimumPayout
      },
      earnings: {
        locked: lockedEarnings,
        eligible: eligibleEarnings
      },
      payouts: {
        pending: pendingPayouts,
        completed: completedPayouts
      }
    };
  } catch (error) {
    console.error('Error getting creator payout status:', error);
    throw error;
  }
};

// Admin endpoint: Get all pending payouts
const getAllPendingPayouts = async () => {
  try {
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      include: {
        creator: true,
        earnings: true
      },
      orderBy: { scheduledAt: 'asc' }
    });
    
    return pendingPayouts;
  } catch (error) {
    console.error('Error getting pending payouts:', error);
    throw error;
  }
};

// Admin endpoint: Manual payout processing
const processManualPayout = async (creatorId, adminId, notes) => {
  try {
    const readyForPayout = await getEarningsReadyForPayout();
    const creatorPayout = readyForPayout.find(p => p.creator.id === creatorId);
    
    if (!creatorPayout) {
      throw new Error('No earnings ready for payout for this creator');
    }
    
    const payout = await createPayout({
      ...creatorPayout,
      reason: 'MANUAL_ADMIN'
    });
    
    // Update with admin info
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        processedBy: adminId,
        adminNotes: notes || 'Manual payout processed by admin'
      }
    });
    
    return payout;
  } catch (error) {
    console.error('Error processing manual payout:', error);
    throw error;
  }
};

module.exports = {
  createEarning,
  processScheduledPayouts,
  getCreatorPayoutStatus,
  getAllPendingPayouts,
  processManualPayout,
  getNextPayoutDate,
  calculatePaymentDates
};
