const { PrismaClient } = require('@prisma/client');
const tipaltiService = require('../services/tipaltiService');
const prisma = new PrismaClient();

// ===== CREATOR PAYMENT ACCOUNT MANAGEMENT =====

/**
 * Get creator's payment account setup
 */
exports.getPaymentAccount = async (req, res) => {
  try {
    const creatorId = req.creator.id;

    let paymentAccount = await prisma.paymentAccount.findUnique({
      where: { creatorId }
    });

    if (!paymentAccount) {
      // Create default payment account
      paymentAccount = await prisma.paymentAccount.create({
        data: {
          creatorId,
          preferredMethod: 'BANK_TRANSFER',
          payoutFrequency: 'MONTHLY',
          minimumPayout: 50.00
        }
      });
    }

    // Hide sensitive data from response
    const safePaymentAccount = {
      ...paymentAccount,
      accountNumber: paymentAccount.accountNumber ? '****' + paymentAccount.accountNumber?.slice(-4) : null,
      routingNumber: paymentAccount.routingNumber ? '****' + paymentAccount.routingNumber?.slice(-4) : null,
      taxId: paymentAccount.taxId ? '***-**-' + paymentAccount.taxId?.slice(-4) : null
    };

    res.json({
      paymentAccount: safePaymentAccount,
      tipaltiStatus: paymentAccount.tipaltiStatus || 'PENDING'
    });

  } catch (error) {
    console.error('Get payment account error:', error);
    res.status(500).json({ error: 'Failed to fetch payment account' });
  }
};

/**
 * Update creator's payment account
 */
exports.updatePaymentAccount = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const {
      preferredMethod,
      payoutFrequency,
      minimumPayout,
      bankName,
      accountNumber,
      routingNumber,
      swiftCode,
      iban,
      paypalEmail,
      payoneerEmail,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      taxId,
      taxStatus,
      // Tax form data instead of uploads
      fullLegalName,
      dateOfBirth,
      taxResidence,
      businessType,
      businessName,
      taxClassification,
      certifyTaxInfo,
      authorizeBackupWithholding,
      // Identity verification data instead of uploads
      idDocumentType,
      idDocumentNumber,
      idExpirationDate,
      idIssuingAuthority,
      certifyIdentity,
      // Compliance agreements
      agreeToTerms,
      agreeToOFAC,
      agreeToTipalti
    } = req.body;

    // Convert date strings to proper DateTime objects
    const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    const parsedIdExpirationDate = idExpirationDate ? new Date(idExpirationDate) : null;

    // Validate compliance requirements with form data
    const hasTaxInfo = fullLegalName && dateOfBirth && taxResidence && businessType && taxClassification && certifyTaxInfo;
    const hasIdentityInfo = idDocumentType && idDocumentNumber && idExpirationDate && idIssuingAuthority && certifyIdentity;
    const hasAgreements = agreeToTerms && agreeToOFAC && agreeToTipalti;
    const hasBasicInfo = taxId && addressLine1 && city && country;

    if (hasTaxInfo && hasIdentityInfo && hasAgreements && hasBasicInfo) {
      // All compliance requirements met - mark as ready for verification
      var tipaltiStatusUpdate = 'SUBMITTED_FOR_VERIFICATION';
    } else {
      var tipaltiStatusUpdate = 'PENDING';
    }

    // Update payment account
    const paymentAccount = await prisma.paymentAccount.upsert({
      where: { creatorId },
      update: {
        preferredMethod,
        payoutFrequency,
        minimumPayout,
        bankName,
        accountNumber, // TODO: Encrypt in production
        routingNumber, // TODO: Encrypt in production
        swiftCode,
        iban,
        paypalEmail,
        payoneerEmail,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        taxId, // TODO: Encrypt in production
        taxStatus: taxStatus || 'PENDING',
        // Tax form data
        fullLegalName,
        dateOfBirth: parsedDateOfBirth,
        taxResidence,
        businessType,
        businessName,
        taxClassification,
        certifyTaxInfo,
        authorizeBackupWithholding,
        // Identity verification data
        idDocumentType,
        idDocumentNumber,
        idExpirationDate: parsedIdExpirationDate,
        idIssuingAuthority,
        certifyIdentity,
        tipaltiStatus: tipaltiStatusUpdate,
        lastUpdated: new Date()
      },
      create: {
        creatorId,
        preferredMethod,
        payoutFrequency,
        minimumPayout,
        bankName,
        accountNumber,
        routingNumber,
        swiftCode,
        iban,
        paypalEmail,
        payoneerEmail,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        taxId,
        taxStatus: taxStatus || 'PENDING',
        // Tax form data
        fullLegalName,
        dateOfBirth: parsedDateOfBirth,
        taxResidence,
        businessType,
        businessName,
        taxClassification,
        certifyTaxInfo,
        authorizeBackupWithholding,
        // Identity verification data
        idDocumentType,
        idDocumentNumber,
        idExpirationDate: parsedIdExpirationDate,
        idIssuingAuthority,
        certifyIdentity,
        tipaltiStatus: tipaltiStatusUpdate
      }
    });

    // If we have enough info, try to create/update Tipalti payee
    if (this.hasRequiredPaymentInfo(paymentAccount)) {
      await this.syncWithTipalti(creatorId);
    }

    res.json({
      message: 'Payment account updated successfully',
      paymentAccount: {
        ...paymentAccount,
        accountNumber: accountNumber ? '****' + accountNumber.slice(-4) : null,
        routingNumber: routingNumber ? '****' + routingNumber.slice(-4) : null,
        taxId: taxId ? '***-**-' + taxId.slice(-4) : null
      }
    });

  } catch (error) {
    console.error('Update payment account error:', error);
    res.status(500).json({ error: 'Failed to update payment account' });
  }
};

/**
 * Sync creator with Tipalti (create or update payee)
 */
exports.syncWithTipalti = async (creatorId) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: { paymentAccount: true }
    });

    if (!creator || !creator.paymentAccount) {
      throw new Error('Creator or payment account not found');
    }

    const { paymentAccount } = creator;

    if (paymentAccount.tipaltiPayeeId) {
      // Update existing payee
      const result = await tipaltiService.updatePayee(paymentAccount.tipaltiPayeeId, {
        payeeDisplayName: creator.name,
        email: creator.email,
        defaultPaymentMethod: tipaltiService.mapPaymentMethod(paymentAccount.preferredMethod),
        minimumPaymentAmount: paymentAccount.minimumPayout
      });

      if (result.success) {
        await prisma.paymentAccount.update({
          where: { creatorId },
          data: { tipaltiStatus: 'UPDATED' }
        });
      }

      return result;
    } else {
      // Create new payee
      const result = await tipaltiService.createPayee(creator, paymentAccount);

      if (result.success) {
        await prisma.paymentAccount.update({
          where: { creatorId },
          data: {
            tipaltiPayeeId: result.tipaltiPayeeId,
            tipaltiStatus: result.status
          }
        });
      }

      return result;
    }

  } catch (error) {
    console.error('Sync with Tipalti error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if payment account has required information for Tipalti
 */
exports.hasRequiredPaymentInfo = (paymentAccount) => {
  const hasAddress = paymentAccount.addressLine1 && 
                    paymentAccount.city && 
                    paymentAccount.country;

  const hasPaymentMethod = (
    (paymentAccount.preferredMethod === 'BANK_TRANSFER' && paymentAccount.accountNumber && paymentAccount.routingNumber) ||
    (paymentAccount.preferredMethod === 'PAYPAL' && paymentAccount.paypalEmail) ||
    (paymentAccount.preferredMethod === 'PAYONEER' && paymentAccount.payoneerEmail)
  );

  return hasAddress && hasPaymentMethod;
};

// ===== EARNINGS MANAGEMENT =====

/**
 * Get creator's earnings summary
 */
exports.getEarnings = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { page = 1, limit = 20, status } = req.query;

    const where = { creatorId };
    if (status) {
      where.status = status;
    }

    const [earnings, totalCount, summary] = await Promise.all([
      prisma.earning.findMany({
        where,
        include: {
          transaction: {
            select: { id: true, impactActionId: true, createdAt: true }
          },
          payout: {
            select: { id: true, status: true, completedAt: true }
          }
        },
        orderBy: { earnedAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.earning.count({ where }),
      prisma.earning.groupBy({
        by: ['status'],
        where: { creatorId },
        _sum: { netAmount: true },
        _count: true
      })
    ]);

    const earningsSummary = {
      totalEarned: summary.reduce((sum, group) => sum + (group._sum.netAmount || 0), 0),
      totalPaid: summary.find(g => g.status === 'PAID')?._sum.netAmount || 0,
      pendingPayout: summary.find(g => g.status === 'EARNED')?._sum.netAmount || 0,
      totalTransactions: summary.reduce((sum, group) => sum + group._count, 0)
    };

    res.json({
      earnings,
      summary: earningsSummary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
};

/**
 * Get creator's payout history
 */
exports.getPayoutHistory = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { page = 1, limit = 10 } = req.query;

    const [payouts, totalCount] = await Promise.all([
      prisma.payout.findMany({
        where: { creatorId },
        include: {
          earnings: {
            select: { id: true, netAmount: true, earnedAt: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.payout.count({ where: { creatorId } })
    ]);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({ error: 'Failed to fetch payout history' });
  }
};

// ===== ADMIN PAYMENT MANAGEMENT =====

/**
 * Process payouts for creators (admin only)
 */
exports.processPayouts = async (req, res) => {
  try {
    const { creatorIds, minimumAmount = 50 } = req.body;
    const adminId = req.creator.id;

    // Get creators with pending earnings
    const creators = await prisma.creator.findMany({
      where: creatorIds ? { id: { in: creatorIds } } : {},
      include: {
        paymentAccount: true,
        earnings: {
          where: {
            status: 'EARNED',
            availableAt: { lte: new Date() }
          }
        }
      }
    });

    const results = [];

    for (const creator of creators) {
      const pendingEarnings = creator.earnings;
      const totalAmount = pendingEarnings.reduce((sum, earning) => sum + earning.netAmount, 0);

      if (totalAmount < minimumAmount) {
        results.push({
          creatorId: creator.id,
          success: false,
          reason: `Amount ${totalAmount} below minimum ${minimumAmount}`
        });
        continue;
      }

      if (!creator.paymentAccount?.tipaltiPayeeId) {
        results.push({
          creatorId: creator.id,
          success: false,
          reason: 'Payment account not set up with Tipalti'
        });
        continue;
      }

      // Create payout record
      const payout = await prisma.payout.create({
        data: {
          creatorId: creator.id,
          totalAmount,
          paymentMethod: creator.paymentAccount.preferredMethod,
          currency: 'USD',
          status: 'PENDING',
          scheduledAt: new Date(),
          processedBy: adminId
        }
      });

      // Link earnings to payout
      await prisma.earning.updateMany({
        where: {
          id: { in: pendingEarnings.map(e => e.id) }
        },
        data: {
          status: 'PENDING_PAYOUT',
          payoutId: payout.id
        }
      });

      // Process payment via Tipalti
      const tipaltiResult = await tipaltiService.createPayment({
        id: payout.id,
        creatorId: creator.id,
        totalAmount,
        currency: 'USD',
        paymentMethod: creator.paymentAccount.preferredMethod,
        scheduledAt: new Date()
      });

      if (tipaltiResult.success) {
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            tipaltiPaymentId: tipaltiResult.tipaltiPaymentId,
            tipaltiStatus: tipaltiResult.status,
            status: 'PROCESSING',
            processedAt: new Date()
          }
        });

        results.push({
          creatorId: creator.id,
          success: true,
          payoutId: payout.id,
          amount: totalAmount,
          tipaltiPaymentId: tipaltiResult.tipaltiPaymentId
        });
      } else {
        // Rollback on failure
        await prisma.earning.updateMany({
          where: { payoutId: payout.id },
          data: { status: 'EARNED', payoutId: null }
        });

        await prisma.payout.update({
          where: { id: payout.id },
          data: { status: 'FAILED', statusReason: tipaltiResult.error }
        });

        results.push({
          creatorId: creator.id,
          success: false,
          reason: tipaltiResult.error
        });
      }
    }

    res.json({
      message: 'Payout processing completed',
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Process payouts error:', error);
    res.status(500).json({ error: 'Failed to process payouts' });
  }
};

/**
 * Get admin payment dashboard stats
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const [
      totalPayments,
      pendingPayouts,
      completedPayouts,
      failedPayouts,
      totalEarnings,
      payoutSummary
    ] = await Promise.all([
      prisma.payout.count(),
      prisma.payout.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      prisma.payout.count({ where: { status: 'COMPLETED' } }),
      prisma.payout.count({ where: { status: 'FAILED' } }),
      prisma.earning.aggregate({ _sum: { netAmount: true } }),
      prisma.payout.groupBy({
        by: ['status'],
        _sum: { totalAmount: true },
        _count: true
      })
    ]);

    res.json({
      totalPayments,
      pendingPayouts,
      completedPayouts,
      failedPayouts,
      totalEarnings: totalEarnings._sum.netAmount || 0,
      payoutSummary
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
};

// ===== WEBHOOK HANDLERS =====

/**
 * Handle Tipalti webhooks
 */
exports.handleTipaltiWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    const result = await tipaltiService.processWebhook(webhookData);
    
    if (result.success) {
      res.status(200).json({ message: 'Webhook processed successfully' });
    } else {
      res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Test Tipalti connection
 */
exports.testTipaltiConnection = async (req, res) => {
  try {
    const result = await tipaltiService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
};

// Generate Tipalti onboarding URL
exports.generateTipaltiOnboardingUrl = async (req, res) => {
  try {
    const creatorId = req.creator.id;

    // Get creator info
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Generate unique onboarding URL for this creator
    // In production, this would use Tipalti's API to generate a real onboarding URL
    const baseUrl = process.env.TIPALTI_ONBOARDING_URL || 'https://sandbox.tipalti.com/onboarding';
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments?onboarding=complete`;
    
    // Create a unique token for this onboarding session
    const onboardingToken = `${creatorId}_${Date.now()}`;
    
    // For sandbox/demo, we'll create a mock URL
    // In production, you'd call Tipalti's API here
    const onboardingUrl = `${baseUrl}?payee=${creator.email}&token=${onboardingToken}&return_url=${encodeURIComponent(returnUrl)}`;

    // Update payment account to track onboarding start
    await prisma.paymentAccount.upsert({
      where: { creatorId },
      update: {
        tipaltiStatus: 'ONBOARDING_STARTED',
        lastUpdated: new Date()
      },
      create: {
        creatorId,
        tipaltiStatus: 'ONBOARDING_STARTED',
        preferredMethod: 'BANK_TRANSFER',
        payoutFrequency: 'MONTHLY',
        minimumPayout: 50
      }
    });

    res.json({
      message: 'Onboarding URL generated successfully',
      onboardingUrl,
      token: onboardingToken
    });

  } catch (error) {
    console.error('Generate onboarding URL error:', error);
    res.status(500).json({ 
      message: 'Failed to generate onboarding URL',
      error: error.message 
    });
  }
};
