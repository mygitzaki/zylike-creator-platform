// backend/controllers/transaction.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { updateBonusTracker } = require('./bonus.controller');
const { createEarning } = require('./payout.controller');

exports.getTransactions = async (req, res) => {
  const userId = req.creator.id;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { creatorId: userId },
      include: {
        earnings: {
          select: {
            id: true,
            netAmount: true,
            status: true,
            paidAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Create a new transaction and corresponding earning
 * This is called when Impact.com sends us a conversion
 */
exports.createTransaction = async (transactionData) => {
  try {
    const {
      creatorId,
      impactActionId,
      grossAmount,
      platformFee,
      creatorPayout,
      isCommissionable = true // Default to true, but can be specified
    } = transactionData;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        creatorId,
        impactActionId,
        grossAmount,
        platformFee,
        creatorPayout,
        isCommissionable, // Track whether this sale counts for bonuses
        status: 'CONFIRMED'
      }
    });

    // Create corresponding earning using Conservative payout system
    const earning = await createEarning({
      creatorId,
      transactionId: transaction.id,
      grossAmount,
      platformFee,
      netAmount: creatorPayout,
      isCommissionable, // Use the actual value from transaction data
      earnedAt: new Date()
    });

    // Update bonus tracker ONLY for commissionable sales
    if (isCommissionable) {
      try {
        const bonusUpdate = await updateBonusTracker(creatorId, grossAmount, true);
        console.log(`Bonus tracker updated for creator ${creatorId} (commissionable sale):`, bonusUpdate);
      } catch (bonusError) {
        console.error('Bonus tracker update failed:', bonusError);
        // Don't fail the transaction if bonus tracking fails
      }
    } else {
      console.log(`Skipping bonus tracker update for creator ${creatorId} (non-commissionable sale)`);
    }

    return {
      success: true,
      transaction,
      earning
    };

  } catch (error) {
    console.error('Create transaction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
