const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ===== SIMPLIFIED PAYMENT ACCOUNT MANAGEMENT (No Tipalti) =====

/**
 * Get creator's payment account setup
 */
exports.getPaymentAccount = async (req, res) => {
  try {
    const creatorId = req.creator.id;

    const paymentAccount = await prisma.paymentAccount.findUnique({
      where: { creatorId }
    });

    if (!paymentAccount) {
      return res.json({
        paymentAccount: null,
        message: 'No payment account setup yet'
      });
    }

    // Hide sensitive data from response
    const safePaymentAccount = {
      ...paymentAccount,
      accountNumber: paymentAccount.accountNumber ? '****' + paymentAccount.accountNumber?.slice(-4) : null,
      routingNumber: paymentAccount.routingNumber ? '****' + paymentAccount.routingNumber?.slice(-4) : null,
      ssn: paymentAccount.ssn ? '***-**-' + paymentAccount.ssn?.slice(-4) : null,
      taxId: paymentAccount.taxId ? '***-**-' + paymentAccount.taxId?.slice(-4) : null
    };

    res.json({
      paymentAccount: safePaymentAccount
    });

  } catch (error) {
    console.error('Get payment account error:', error);
    res.status(500).json({ error: 'Failed to fetch payment account' });
  }
};

/**
 * Setup/Update creator's payment account (Professional Template)
 */
exports.setupPaymentAccount = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const {
      // Bank Information
      bankName,
      accountNumber,
      routingNumber,
      accountType = 'checking',
      
      // Personal Information
      fullName,
      address,
      city,
      state,
      zipCode,
      country = 'United States',
      
      // Tax Information
      ssn,
      taxId,
      businessType = 'individual',
      phoneNumber,
      dateOfBirth
    } = req.body;

    // Basic validation
    if (!bankName || !accountNumber || !routingNumber) {
      return res.status(400).json({ error: 'Bank details are required' });
    }

    if (!fullName || !address || !city || !state || !zipCode) {
      return res.status(400).json({ error: 'Personal information is required' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Tax ID validation based on business type
    if (businessType === 'individual' && !ssn) {
      return res.status(400).json({ error: 'SSN is required for individuals' });
    }

    if (businessType !== 'individual' && !taxId) {
      return res.status(400).json({ error: 'Tax ID is required for businesses' });
    }

    const processedData = {
      creatorId,
      paymentMethod: 'BANK_TRANSFER',
      bankName,
      accountNumber,
      routingNumber,
      accountType,
      isDefault: true,
      fullName,
      address,
      city,
      state,
      zipCode,
      country,
      phoneNumber,
      ssn,
      taxId,
      businessType,
      status: 'ACTIVE', // Simple approval for now
      updatedAt: new Date()
    };

    // Parse date if provided
    if (dateOfBirth) {
      processedData.dateOfBirth = new Date(dateOfBirth);
    }

    const paymentAccount = await prisma.paymentAccount.upsert({
      where: { creatorId },
      update: processedData,
      create: processedData,
    });

    res.json({ 
      message: 'Payment account setup completed successfully',
      paymentAccount: {
        ...paymentAccount,
        // Don't send sensitive data back
        accountNumber: '****' + accountNumber.slice(-4),
        routingNumber: '****' + routingNumber.slice(-4),
        ssn: ssn ? '***-**-' + ssn.slice(-4) : undefined,
        taxId: taxId ? '***-***' + taxId.slice(-4) : undefined
      }
    });
  } catch (error) {
    console.error('Payment account setup error:', error);
    res.status(500).json({ error: 'Failed to setup payment account' });
  }
};

/**
 * Get earnings with pagination
 */
exports.getEarnings = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [earnings, total] = await Promise.all([
      prisma.earning.findMany({
        where: { creatorId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.earning.count({
        where: { creatorId }
      })
    ]);

    res.json({
      earnings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
};

/**
 * Get payout history with pagination
 */
exports.getPayoutHistory = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where: { creatorId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.payout.count({
        where: { creatorId }
      })
    ]);

    res.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({ error: 'Failed to fetch payout history' });
  }
};

/**
 * Get payment statistics
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const creatorId = req.creator.id;

    const [
      totalEarnings,
      totalPayouts,
      pendingEarnings,
      lastPayout
    ] = await Promise.all([
      prisma.earning.aggregate({
        where: { creatorId },
        _sum: { amount: true }
      }),
      prisma.payout.aggregate({
        where: { creatorId, status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.earning.aggregate({
        where: { 
          creatorId,
          eligibleAt: { lte: new Date() },
          payoutId: null // Not yet paid out
        },
        _sum: { amount: true }
      }),
      prisma.payout.findFirst({
        where: { creatorId },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      totalEarnings: totalEarnings._sum.amount || 0,
      totalPayouts: totalPayouts._sum.amount || 0,
      pendingEarnings: pendingEarnings._sum.amount || 0,
      balance: (totalEarnings._sum.amount || 0) - (totalPayouts._sum.amount || 0),
      lastPayout: lastPayout ? {
        amount: lastPayout.amount,
        date: lastPayout.createdAt,
        status: lastPayout.status
      } : null
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
};

module.exports = exports;
