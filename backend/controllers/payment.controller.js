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
    
    // Debug log the incoming request
    console.log('🔍 Payment setup request body:', req.body);
    console.log('🔍 Creator ID:', creatorId);
    
    const {
      // Banking Information (International)
      bankName,
      accountNumber,
      routingNumber,
      swiftCode,
      iban,
      accountType = 'checking',
      
      // Personal Information (International)
      fullName,
      address,
      city,
      stateProvince,
      postalCode,
      country,
      
      // Tax/Identity Information (International)
      taxId,
      businessType = 'individual',
      phoneNumber,
      dateOfBirth
    } = req.body;

    // International validation with detailed logging
    console.log('🔍 Validation check - bankName:', bankName, 'accountNumber:', accountNumber);
    if (!bankName || !accountNumber) {
      console.log('❌ Bank validation failed');
      return res.status(400).json({ error: 'Bank name and account number are required' });
    }

    console.log('🔍 Validation check - country:', country);
    if (!country) {
      console.log('❌ Country validation failed');
      return res.status(400).json({ error: 'Country is required' });
    }

    // Country-specific validation
    console.log('🔍 Country-specific validation for:', country);
    if (country === 'United States' && !routingNumber) {
      console.log('❌ US routing number validation failed');
      return res.status(400).json({ error: 'Routing number is required for US banks' });
    }

    if (country !== 'United States' && !swiftCode) {
      console.log('❌ International SWIFT code validation failed');
      return res.status(400).json({ error: 'SWIFT code is required for international banks' });
    }

    console.log('🔍 Address validation - fullName:', fullName, 'city:', city, 'stateProvince:', stateProvince, 'postalCode:', postalCode);
    if (!fullName || !address || !city || !stateProvince || !postalCode) {
      console.log('❌ Address validation failed');
      return res.status(400).json({ error: 'Complete address information is required' });
    }

    console.log('🔍 Contact validation - phoneNumber:', phoneNumber, 'dateOfBirth:', dateOfBirth);
    if (!phoneNumber || !dateOfBirth) {
      console.log('❌ Contact validation failed');
      return res.status(400).json({ error: 'Phone number and date of birth are required' });
    }

    console.log('✅ All validation passed!');

    const processedData = {
      creatorId,
      // Use schema field names exactly
      preferredMethod: 'BANK_TRANSFER',
      bankName,
      accountNumber,
      routingNumber: routingNumber || null,
      swiftCode: swiftCode || null,
      iban: iban || null,
      // Personal information
      fullLegalName: fullName, // Map to existing field
      addressLine1: address, // Map to existing field
      city,
      state: stateProvince, // Map to existing field
      postalCode: postalCode, // Use correct field name
      country,
      // Tax and business info
      taxId: taxId || null,
      businessType,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      // Verification status
      isVerified: false,
      taxStatus: 'PENDING'
    };

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
        accountNumber: accountNumber ? '****' + accountNumber.slice(-4) : null,
        routingNumber: routingNumber ? '****' + routingNumber.slice(-4) : null,
        swiftCode: swiftCode ? '****' + swiftCode.slice(-4) : null,
        taxId: taxId ? '***-***' + taxId.slice(-4) : null
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
