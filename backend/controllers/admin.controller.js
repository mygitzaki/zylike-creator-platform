const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getImpactStatsBySubId, getAllSubaffiliates, createSubaffiliate } = require('../services/impactService');

// Helper: create a short, readable slug from a name
function makeSlugFromName(name) {
  const base = (name || 'creator').toLowerCase().replace(/[^a-z0-9]+/g, '');
  return base.substring(0, 8) || 'creator';
}

// Helper function to determine if a product/action is commissionable for bonuses
function determineIfCommissionable(action) {
  // In production, you would have more sophisticated logic here:
  // - Check product categories (electronics, clothing = commissionable, gift cards = not)
  // - Check merchant rules
  // - Check campaign settings
  // - Check product SKUs or IDs
  
  // For now, let's use simple rules based on common scenarios:
  const actionType = action.ActionType || '';
  const amount = parseFloat(action.Amount || 0);
  
  // Gift cards typically don't count for bonuses
  const productName = (action.ProductName || '').toLowerCase();
  if (productName.includes('gift card') || productName.includes('giftcard')) {
    return false;
  }
  
  // Very low value items might not count
  if (amount < 10) {
    return false;
  }
  
  // Only sales/conversions count (not clicks, registrations, etc.)
  if (actionType.toLowerCase().includes('sale') || actionType.toLowerCase().includes('conversion')) {
    return true;
  }
  
  // Default to commissionable for most products
  return true;
}

// Helper: build a random tail to avoid collisions
function randomTail(length = 5) {
  return Math.random().toString(36).slice(2, 2 + length);
}

// ✅ 1. Platform stats
exports.getPlatformStats = async (req, res) => {
  try {
    // Get comprehensive creator statistics
    const totalCreators = await prisma.creator.count();
    const activeCreators = await prisma.creator.count({
      where: { 
        isActive: true,
        role: 'USER' // Only count actual creators, not admins
      }
    });
    const pendingApplications = await prisma.creator.count({
      where: { applicationStatus: 'PENDING' }
    });
    const creatorsWithImpactIds = await prisma.creator.count({
      where: { 
        impactSubId: { not: null },
        role: 'USER'
      }
    });
    
    // Get other platform statistics
    const totalLinks = await prisma.link.count();
    const totalTransactions = await prisma.transaction.count();
    
    // Calculate revenue statistics
    const revenueStats = await prisma.transaction.aggregate({
      _sum: {
        grossAmount: true,
        creatorPayout: true,
        platformFee: true
      }
    });
    
    // Get click statistics
    const totalClicks = await prisma.clickEvent.count();
    const totalConversions = await prisma.conversionEvent.count();
    
    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0';

    console.log('📊 Platform stats calculated:', {
      totalCreators,
      activeCreators,
      pendingApplications,
      creatorsWithImpactIds
    });

    res.status(200).json({
      totalCreators,
      activeCreators,
      pendingApplications,
      creatorsWithImpactIds,
      totalLinks,
      totalTransactions,
      totalRevenue: revenueStats._sum.grossAmount || 0,
      totalCreatorEarnings: revenueStats._sum.creatorPayout || 0,
      totalPlatformFees: revenueStats._sum.platformFee || 0,
      totalClicks,
      totalConversions,
      conversionRate: parseFloat(conversionRate)
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ✅ 2. Get pending applications for review
exports.getPendingApplications = async (req, res) => {
  try {
    const pendingApplications = await prisma.creator.findMany({
      where: {
        applicationStatus: 'PENDING'
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        appliedAt: true,

        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        socialYoutube: true,
        socialFacebook: true,
        facebookGroups: true,

        linkedinProfile: true,
        pinterestProfile: true,

        blogUrl: true,
        shopUrl: true,
        otherPlatforms: true,
        onboardingStep: true,
        applicationStatus: true,
        createdAt: true,
        role: true,
        walletAddress: true
      },
      orderBy: {
        appliedAt: 'asc'
      }
    });

    res.status(200).json({ 
      success: true,
      applications: pendingApplications,
      count: pendingApplications.length
    });
  } catch (error) {
    console.error('Fetch pending applications error:', error);
    res.status(500).json({ error: 'Failed to fetch pending applications' });
  }
};

// ✅ 2.5. Get ALL creator applications (pending, approved, rejected)
exports.getAllCreatorApplications = async (req, res) => {
  try {
    console.log('📋 Fetching all creator applications...');
    
    const allApplications = await prisma.creator.findMany({
      where: {
        applicationStatus: { 
          in: ['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        country: true,
        appliedAt: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        socialYoutube: true,
        socialFacebook: true,
        facebookGroups: true,
        linkedinProfile: true,
        pinterestProfile: true,
        blogUrl: true,
        shopUrl: true,
        otherPlatforms: true,
        onboardingStep: true,
        applicationStatus: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        reviewNotes: true,
        impactId: true,
        impactSubId: true,
        isActive: true,
        commissionRate: true,
        createdAt: true,
        role: true,
        walletAddress: true,
        isOnboarded: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${allApplications.length} creator applications`);

    res.status(200).json({ 
      success: true,
      applications: allApplications,
      count: allApplications.length,
      stats: {
        total: allApplications.length,
        pending: allApplications.filter(app => app.applicationStatus === 'PENDING').length,
        approved: allApplications.filter(app => app.applicationStatus === 'APPROVED').length,
        rejected: allApplications.filter(app => app.applicationStatus === 'REJECTED').length,
        changesRequested: allApplications.filter(app => app.applicationStatus === 'CHANGES_REQUESTED').length
      }
    });
  } catch (error) {
    console.error('❌ Fetch all applications error:', error);
    console.error('❌ Error details:', error.message);
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
};

// ✅ 2.6. Get detailed creator information for editing
exports.getCreatorDetails = async (req, res) => {
  try {
    const { creatorId } = req.params;
    console.log('🔍 Getting creator details for:', creatorId);
    
    // Only select fields that actually exist in the schema
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        appliedAt: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        socialYoutube: true,
        socialFacebook: true,
        facebookGroups: true,
        linkedinProfile: true,
        pinterestProfile: true,
        blogUrl: true,
        shopUrl: true,
        otherPlatforms: true,
        onboardingStep: true,
        applicationStatus: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        reviewNotes: true,
        impactId: true,
        impactSubId: true,
        isActive: true,
        commissionRate: true,
        role: true,
        walletAddress: true,
        createdAt: true,
        // Note: removed fields that don't exist in schema:
        // - submittedAt, personalWebsite, twitchChannel, updatedAt
      }
    });

    console.log('✅ Creator found:', creator ? creator.name : 'NOT FOUND');

    if (!creator) {
      return res.status(404).json({ 
        success: false,
        error: 'Creator not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      creator: creator
    });
  } catch (error) {
    console.error('❌ Fetch creator details error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch creator details',
      details: error.message
    });
  }
};

// ✅ 2.7. Update creator details
exports.updateCreatorDetails = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, ...safeUpdateData } = updateData;
    
    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: safeUpdateData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        socialYoutube: true,
        socialFacebook: true,
        facebookGroups: true,

        linkedinProfile: true,
        pinterestProfile: true,

        blogUrl: true,
        shopUrl: true,
        otherPlatforms: true,
        onboardingStep: true,
        applicationStatus: true,
        impactId: true,
        impactSubId: true,
        isActive: true,
        commissionRate: true,
        role: true,
        walletAddress: true,
        role: true,
        walletAddress: true
      }
    });

    res.status(200).json({ 
      success: true,
      message: 'Creator details updated successfully',
      creator: updatedCreator
    });
  } catch (error) {
    console.error('Update creator details error:', error);
    res.status(500).json({ error: 'Failed to update creator details' });
  }
};

// ✅ 3. Review and approve/reject applications
exports.reviewApplication = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { action, reason, notes, impactId, impactSubId } = req.body;
    const adminId = req.creator.id;

    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (action === 'reject' && !reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    let updateData = {
      reviewNotes: notes || null
    };

    switch (action) {
      case 'approve':
        // Generate Impact IDs if not provided
        let finalImpactId = impactId;
        let finalImpactSubId = impactSubId;
        
        if (!finalImpactId || !finalImpactSubId) {
          const creatorToApprove = await prisma.creator.findUnique({
            where: { id: creatorId },
            select: { name: true, email: true }
          });
          
          const baseName = (creatorToApprove?.name || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6);
          const timestamp = Date.now().toString(36);
          const randomSuffix = Math.random().toString(36).substring(2, 5);
          
          finalImpactId = finalImpactId || `zylike_${baseName}_${timestamp}`;
          finalImpactSubId = finalImpactSubId || `${baseName}_${timestamp}_${randomSuffix}`;
        }
        
        try {
          // Create sub-affiliate in Impact.com
          const subaffiliateData = {
            SubId: finalImpactSubId,
            Name: (await prisma.creator.findUnique({ where: { id: creatorId } }))?.name || 'Zylike Creator',
            Email: (await prisma.creator.findUnique({ where: { id: creatorId } }))?.email || 'creator@zylike.com'
          };
          
          const { createSubaffiliate } = require('../services/impactService');
          await createSubaffiliate(subaffiliateData);
          console.log(`✅ Created Impact sub-affiliate: ${finalImpactSubId}`);
        } catch (impactError) {
          console.error('❌ Failed to create Impact sub-affiliate:', impactError);
          // Continue with approval even if Impact creation fails
        }
        
        updateData = {
          ...updateData,
          applicationStatus: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: adminId,
          onboardingStep: 7,
          isOnboarded: true,
          onboardedAt: new Date(),
          impactId: finalImpactId,
          impactSubId: finalImpactSubId
        };
        break;
      
      case 'reject':
        updateData = {
          ...updateData,
          applicationStatus: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: reason
        };
        break;
      
      case 'request_changes':
        updateData = {
          ...updateData,
          applicationStatus: 'CHANGES_REQUESTED',
          onboardingStep: 4
        };
        break;
    }

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        applicationStatus: true,
        impactId: true,
        impactSubId: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        reviewNotes: true,
        onboardingStep: true,
        isOnboarded: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Application ${action}d successfully`,
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Review application error:', error);
    res.status(500).json({ error: 'Failed to review application' });
  }
};

// ✅ 4. All creators with search & sort
exports.getAllCreators = async (req, res) => {
  try {
    const { search = '', sortBy = 'createdAt', order = 'desc' } = req.query;
    const allowedSortFields = ['name', 'email', 'createdAt', 'role'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const creators = await prisma.creator.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { impactId: { contains: search, mode: 'insensitive' } },
          { impactSubId: { contains: search, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        [sortField]: order.toLowerCase() === 'asc' ? 'asc' : 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        applicationStatus: true,
        impactId: true,
        impactSubId: true,
        isActive: true,
        isOnboarded: true,
        approvedAt: true,
        approvedBy: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        socialYoutube: true,
        socialFacebook: true
      }
    });

    res.status(200).json({ creators });
  } catch (error) {
    console.error('Fetch creators error:', error);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
};

// ✅ 3. Transactions list
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// ✅ 4. Promote user to admin
exports.promoteToAdmin = async (req, res) => {
  const { creatorId } = req.params;

  try {
    const updated = await prisma.creator.update({
      where: { id: creatorId },
      data: { role: 'ADMIN' },
    });

    res.status(200).json({ message: 'User promoted to admin', creator: updated });
  } catch (error) {
    console.error('Promote to admin error:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
};

// ✅ 5. Delete creator
exports.deleteCreator = async (req, res) => {
  const { creatorId } = req.params;

  try {
    await prisma.creator.delete({
      where: { id: creatorId },
    });

    res.status(200).json({ message: 'Creator deleted successfully' });
  } catch (error) {
    console.error('Delete creator error:', error);
    res.status(500).json({ error: 'Failed to delete creator' });
  }
};

// ✅ 6. Get single creator profile
exports.getCreatorProfile = async (req, res) => {
  const { creatorId } = req.params;

  try {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.status(200).json({ creator });
  } catch (error) {
    console.error('Get creator profile error:', error);
    res.status(500).json({ error: 'Failed to fetch creator profile' });
  }
};

// ✅ 7. Get creator impact stats (custom range supported)
exports.getCreatorImpactStats = async (req, res) => {
  const { creatorId } = req.params;
  const { start, end } = req.query;

  try {
    const creator = await prisma.creator.findUnique({ where: { id: creatorId } });

    if (!creator || !creator.impactSubId) {
      return res.status(404).json({ error: 'Creator or impactSubId not found' });
    }

    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end || new Date().toISOString().split('T')[0];

    const stats = await getImpactStatsBySubId(creator.impactSubId, startDate, endDate);

    res.status(200).json(stats);
  } catch (err) {
    console.error('Impact Stats Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch impact stats' });
  }
};

// ✅ 8. Seed transactions from Impact actions with REAL data
exports.seedTransactionsFromImpact = async (req, res) => {
  try {
    const { getActions } = require('../services/impactService');
    
    // Get all real Impact.com actions
    const impactActions = await getActions();
    
    if (impactActions.length === 0) {
      return res.status(200).json({ message: 'No Impact.com actions found to seed' });
    }

    let seededCount = 0;
    let creatorsCreated = 0;
    
    for (const action of impactActions) {
      try {
        // Try to find or create a creator for this action
        const subId = action.SubId1 || 'general';
        
        let creator = await prisma.creator.findFirst({
          where: { impactSubId: subId }
        });
        
        if (!creator) {
          // Create a new creator based on action location data
          const locationName = action.CustomerCity && action.CustomerRegion 
            ? `${action.CustomerCity}, ${action.CustomerRegion}`
            : 'Unknown Location';
            
          creator = await prisma.creator.create({
            data: {
              name: subId ? `Creator ${subId}` : `Creator from ${locationName}`,
              email: subId ? `${subId}@impact.com` : `creator_${Date.now()}@impact.com`,
              password: 'dummy_password', // This should be hashed in production
              walletAddress: `wallet_${subId || Date.now()}`,
              impactSubId: subId,
              role: 'USER'
            }
          });
          creatorsCreated++;
        }
        
        // Check if transaction already exists
        const existingTransaction = await prisma.transaction.findFirst({
          where: { impactActionId: action.Id }
        });
        
        if (!existingTransaction) {
          // Calculate revenue split: 70% creator, 30% platform (CONVERSION-BASED ONLY)
          const grossAmount = parseFloat(action.Amount || 0); // Real sale amount from Impact.com
          const creatorPayout = grossAmount * (creator.commissionRate / 100); // 70% of SALE
          const platformFee = grossAmount - creatorPayout; // 30% platform fee
          
          // Determine if this product is commissionable for bonuses
          // In production, this logic would be based on product categories, merchant rules, etc.
          const isCommissionable = determineIfCommissionable(action);

          // Create a transaction with the real Impact.com data (ONLY FOR REAL SALES)
          await prisma.transaction.create({
            data: {
              creatorId: creator.id,
              grossAmount: grossAmount,    // Customer paid this amount
              platformFee: platformFee,   // Zylike keeps 30%
              creatorPayout: creatorPayout, // Creator earns 70% (ONLY when customer buys)
              isCommissionable: isCommissionable, // Whether this counts for bonuses
              status: action.State || 'PENDING',
              impactActionId: action.Id,
              createdAt: new Date(action.EventDate || action.CreationDate)
            }
          });
          seededCount++;
        }
      } catch (innerError) {
        console.error(`Error seeding action ${action.Id}:`, innerError.message);
      }
    }

    res.status(200).json({ 
      message: `✅ Successfully seeded ${seededCount} REAL transactions from Impact.com!`,
      totalActionsProcessed: impactActions.length,
      creatorsCreated: creatorsCreated,
      transactionsSeeded: seededCount,
      realData: true
    });
  } catch (error) {
    console.error('Seed transactions error:', error);
    res.status(500).json({ error: 'Failed to seed transactions from Impact.com' });
  }
};

// ✅ 9. Sync creators with Impact.com subaffiliates
exports.syncWithImpactSubaffiliates = async (req, res) => {
  try {
    const impactSubaffiliates = await getAllSubaffiliates();
    let syncedCount = 0;

    for (const subaffiliate of impactSubaffiliates) {
      // Check if creator exists with this subId
      const existingCreator = await prisma.creator.findFirst({
        where: { impactSubId: subaffiliate.SubId },
      });

      if (!existingCreator) {
        // Create new creator from Impact subaffiliate
        await prisma.creator.create({
          data: {
            name: subaffiliate.Name || `Creator ${subaffiliate.SubId}`,
            email: subaffiliate.Email || `${subaffiliate.SubId}@impact.com`,
            password: 'temp-password-' + Math.random().toString(36).substring(2),
            walletAddress: '0x' + Math.random().toString(36).substring(2),
            impactSubId: subaffiliate.SubId,
            role: 'USER',
          },
        });
        syncedCount++;
      }
    }

    res.status(200).json({ 
      message: `Synced ${syncedCount} new creators from Impact.com subaffiliates.`,
      totalSubaffiliates: impactSubaffiliates.length 
    });
  } catch (error) {
    console.error('Sync subaffiliates error:', error);
    res.status(500).json({ error: 'Failed to sync with Impact subaffiliates' });
  }
};

// ✅ 10. Create new Impact.com subaffiliate
exports.createImpactSubaffiliate = async (req, res) => {
  try {
    const { name, email, subId, creatorId, customSubId, autoGenerate } = req.body;

    // If creatorId and customSubId are provided, just assign the Impact ID directly
    if (creatorId && customSubId) {
      await prisma.creator.update({
        where: { id: creatorId },
        data: { impactSubId: customSubId }
      });
      
      return res.status(200).json({ 
        message: `Impact ID "${customSubId}" assigned successfully!`,
        subId: customSubId
      });
    }

    // NEW: Auto-generate a unique Impact ID and assign to an existing creator
    if (creatorId && autoGenerate) {
      // Fetch the creator
      const creator = await prisma.creator.findUnique({ where: { id: creatorId } });
      if (!creator) {
        return res.status(404).json({ error: 'Creator not found' });
      }

      // Collect existing subIds from DB to ensure uniqueness
      const existingCreators = await prisma.creator.findMany({
        select: { impactSubId: true },
        where: { impactSubId: { not: null } }
      });
      const existingDbIds = new Set(existingCreators.map(c => c.impactSubId));

      // Also try to collect subIds from Impact (best-effort)
      let existingImpactIds = new Set();
      try {
        const subs = await getAllSubaffiliates();
        existingImpactIds = new Set(subs.map(s => s.SubId).filter(Boolean));
      } catch (e) {
        // Ignore connectivity issues; we'll still guarantee local uniqueness
      }

      const base = makeSlugFromName(creator.name);
      let candidate;
      let attempts = 0;
      do {
        attempts += 1;
        candidate = `${base}_${randomTail(6)}`;
      } while ((existingDbIds.has(candidate) || existingImpactIds.has(candidate)) && attempts < 50);

      // Assign locally
      await prisma.creator.update({
        where: { id: creatorId },
        data: { impactSubId: candidate }
      });

      // Attempt to register on Impact by creating a tracking entity (best-effort)
      let impactRegistered = false;
      try {
        await createSubaffiliate({ Name: creator.name || base, Email: creator.email || `${candidate}@impact.com`, SubId: candidate });
        impactRegistered = true;
      } catch (e) {
        // Keep local assignment even if remote registration fails
        impactRegistered = false;
      }

      return res.status(200).json({
        message: `Impact ID "${candidate}" ${impactRegistered ? 'assigned and registered on Impact' : 'assigned locally'}`,
        subId: candidate,
        impactRegistered
      });
    }

    // Original functionality for creating new subaffiliates
    if (!name || !email || !subId) {
      return res.status(400).json({ error: 'Name, email, and subId are required' });
    }

    // Create subaffiliate in Impact.com
    const impactSubaffiliate = await createSubaffiliate({
      Name: name,
      Email: email,
      SubId: subId,
    });

    // Create creator in our database
    const creator = await prisma.creator.create({
      data: {
        name,
        email,
        password: 'temp-password-' + Math.random().toString(36).substring(2),
        walletAddress: '0x' + Math.random().toString(36).substring(2),
        impactSubId: subId,
        role: 'USER',
      },
    });

    res.status(201).json({ 
      message: 'Subaffiliate created successfully',
      creator,
      impactSubaffiliate 
    });
  } catch (error) {
    console.error('Create subaffiliate error:', error);
    res.status(500).json({ error: 'Failed to create subaffiliate' });
  }
};

// ✅ 11. Test Impact.com connection
exports.testImpactConnection = async (req, res) => {
  try {
    const { getCampaigns, checkImpactAPIAvailability } = require('../services/impactService');
    
    const isRealAPIAvailable = await checkImpactAPIAvailability();
    const campaigns = await getCampaigns();
    
    res.status(200).json({ 
      message: isRealAPIAvailable ? 'Real Impact.com API connected' : 'Using mock data',
      realAPIAvailable: isRealAPIAvailable,
      campaignsCount: campaigns.length,
      sampleCampaigns: campaigns.slice(0, 3)
    });
  } catch (error) {
    console.error('Impact connection test error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to Impact.com',
      details: error.message 
    });
  }
};

// ✅ 12. Get available brands/campaigns for admin control
exports.getAvailableBrands = async (req, res) => {
  try {
    const { getCampaigns } = require('../services/impactService');
    const campaigns = await getCampaigns();
    
    // Add availability status (admin can control which brands are available to creators)
    const brandsWithStatus = campaigns.map(campaign => ({
      ...campaign,
      isAvailable: true, // Default to available
      commissionRate: 70, // Default creator commission
      description: `Earn commissions promoting ${campaign.Name} products`
    }));
    
    res.status(200).json({ brands: brandsWithStatus });
  } catch (error) {
    console.error('Get available brands error:', error);
    res.status(500).json({ error: 'Failed to fetch available brands' });
  }
};

// ✅ 13. Update brand availability
exports.updateBrandAvailability = async (req, res) => {
  const { brandId } = req.params;
  const { isAvailable, commissionRate } = req.body;
  
  try {
    // Note: In a full implementation, you'd store this in a database
    // For now, we'll return success as this controls client-side availability
    res.status(200).json({ 
      message: 'Brand availability updated',
      brandId,
      isAvailable,
      commissionRate
    });
  } catch (error) {
    console.error('Update brand availability error:', error);
    res.status(500).json({ error: 'Failed to update brand availability' });
  }
};

// ✅ 14. POWERFUL ADMIN: Update creator status (activate/deactivate)
exports.updateCreatorStatus = async (req, res) => {
  const { creatorId } = req.params;
  const { isActive, reason } = req.body;
  
  try {
    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: { 
        isActive: isActive,
        statusReason: reason || null,
        statusUpdatedAt: new Date()
      }
    });
    
    // Deactivate all creator's links if creator is deactivated
    if (!isActive) {
      await prisma.link.updateMany({
        where: { creatorId: creatorId },
        data: { isActive: false }
      });
    }
    
    res.status(200).json({ 
      message: `Creator ${isActive ? 'activated' : 'deactivated'} successfully`,
      creator: updatedCreator
    });
  } catch (error) {
    console.error('Update creator status error:', error);
    res.status(500).json({ error: 'Failed to update creator status' });
  }
};

// ✅ 15. POWERFUL ADMIN: Set custom commission rate for creator
exports.setCreatorCommissionRate = async (req, res) => {
  const { creatorId } = req.params;
  const { commissionRate, reason } = req.body;
  
  try {
    if (commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({ error: 'Commission rate must be between 0 and 100' });
    }
    
    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: { 
        commissionRate: parseInt(commissionRate),
        commissionReason: reason || `Custom rate set by admin`,
        commissionUpdatedAt: new Date()
      }
    });
    
    res.status(200).json({ 
      message: `Commission rate updated to ${commissionRate}%`,
      creator: updatedCreator
    });
  } catch (error) {
    console.error('Set commission rate error:', error);
    res.status(500).json({ error: 'Failed to set commission rate' });
  }
};

// ✅ 16. POWERFUL ADMIN: Get detailed creator performance
exports.getCreatorPerformance = async (req, res) => {
  const { creatorId } = req.params;
  const { timeFrame = '30d' } = req.query;
  
  try {
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeFrame) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
      default: startDate.setDate(now.getDate() - 30);
    }
    
    // Get creator details
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: {
        links: {
          include: {
            clickEvents: {
              where: { createdAt: { gte: startDate } }
            },
            conversionEvents: {
              where: { createdAt: { gte: startDate } }
            }
          }
        },
        transactions: {
          where: { createdAt: { gte: startDate } }
        }
      }
    });
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    // Calculate performance metrics
    const totalClicks = creator.links.reduce((sum, link) => sum + link.clickEvents.length, 0);
    const totalConversions = creator.links.reduce((sum, link) => sum + link.conversionEvents.length, 0);
    const totalRevenue = creator.transactions.reduce((sum, t) => sum + t.grossAmount, 0);
    const totalEarnings = creator.transactions.reduce((sum, t) => sum + t.creatorPayout, 0);
    const platformFees = creator.transactions.reduce((sum, t) => sum + t.platformFee, 0);
    
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;
    const avgOrderValue = totalConversions > 0 ? (totalRevenue / totalConversions) : 0;
    
    // Get top performing links
    const topLinks = creator.links
      .map(link => ({
        id: link.id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        clicks: link.clickEvents.length,
        conversions: link.conversionEvents.length,
        revenue: link.conversionEvents.reduce((sum, conv) => sum + conv.orderValue, 0)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    res.status(200).json({
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        commissionRate: creator.commissionRate,
        isActive: creator.isActive,
        joinedAt: creator.createdAt
      },
      performance: {
        timeFrame,
        totalClicks,
        totalConversions,
        conversionRate: conversionRate.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        totalEarnings: totalEarnings.toFixed(2),
        platformFees: platformFees.toFixed(2),
        avgOrderValue: avgOrderValue.toFixed(2),
        linksCount: creator.links.length,
        transactionsCount: creator.transactions.length
      },
      topLinks
    });
    
  } catch (error) {
    console.error('Get creator performance error:', error);
    res.status(500).json({ error: 'Failed to fetch creator performance' });
  }
};

// ✅ 17. POWERFUL ADMIN: Bulk actions on creators
exports.bulkCreatorActions = async (req, res) => {
  const { action, creatorIds, data } = req.body;
  
  try {
    let result;
    
    switch (action) {
      case 'activate':
        result = await prisma.creator.updateMany({
          where: { id: { in: creatorIds } },
          data: { isActive: true, statusUpdatedAt: new Date() }
        });
        break;
        
      case 'deactivate':
        result = await prisma.creator.updateMany({
          where: { id: { in: creatorIds } },
          data: { isActive: false, statusUpdatedAt: new Date() }
        });
        // Also deactivate their links
        await prisma.link.updateMany({
          where: { creatorId: { in: creatorIds } },
          data: { isActive: false }
        });
        break;
        
      case 'setCommission':
        if (!data.commissionRate || data.commissionRate < 0 || data.commissionRate > 100) {
          return res.status(400).json({ error: 'Invalid commission rate' });
        }
        result = await prisma.creator.updateMany({
          where: { id: { in: creatorIds } },
          data: { 
            commissionRate: parseInt(data.commissionRate),
            commissionUpdatedAt: new Date()
          }
        });
        break;
        
      case 'delete':
        // First delete related records
        await prisma.transaction.deleteMany({
          where: { creatorId: { in: creatorIds } }
        });
        await prisma.link.deleteMany({
          where: { creatorId: { in: creatorIds } }
        });
        result = await prisma.creator.deleteMany({
          where: { id: { in: creatorIds } }
        });
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    res.status(200).json({ 
      message: `Bulk ${action} completed successfully`,
      affectedCount: result.count
    });
    
  } catch (error) {
    console.error('Bulk creator actions error:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
};

// ✅ 18. POWERFUL ADMIN: Advanced platform analytics
// ✅ 16. Check real Impact.com data availability
exports.checkRealImpactData = async (req, res) => {
  try {
    console.log('🔍 Checking real Impact.com data...');
    
    const { getActions, getCampaigns } = require('../services/impactService');
    
    // Get real Impact.com data
    const [actions, campaigns] = await Promise.all([
      getActions(),
      getCampaigns()
    ]);
    
    // Get existing creators and their data
    const creators = await prisma.creator.findMany({
      where: { role: 'USER' },
      include: {
        links: true,
        transactions: true
      }
    });
    
    const creatorsWithImpactIds = creators.filter(c => c.impactSubId);
    const transactionsCount = creators.reduce((sum, c) => sum + c.transactions.length, 0);
    const linksCount = creators.reduce((sum, c) => sum + c.links.length, 0);
    
    res.status(200).json({
      message: '🔍 Real Impact.com data check completed',
      realData: {
        impactActions: actions.length,
        impactCampaigns: campaigns.length,
        localCreators: creators.length,
        creatorsWithImpactIds: creatorsWithImpactIds.length,
        localTransactions: transactionsCount,
        localLinks: linksCount,
        sampleActions: actions.slice(0, 3),
        sampleCampaigns: campaigns.slice(0, 3)
      },
      recommendations: {
        needsImpactIdAssignment: creators.length - creatorsWithImpactIds.length,
        needsTransactionImport: actions.length > transactionsCount,
        hasRealData: actions.length > 0 || transactionsCount > 0
      }
    });
    
  } catch (error) {
    console.error('Check real Impact data error:', error);
    res.status(500).json({ error: 'Failed to check real Impact.com data' });
  }
};

// ✅ 17. Seed real dashboard data for testing (REMOVED - User wants real data only)
/*
exports.seedDashboardData = async (req, res) => {
  try {
    console.log('🌱 Seeding real dashboard data...');
    
    // Get all creators
    const creators = await prisma.creator.findMany({
      where: { role: 'USER' }
    });
    
    if (creators.length === 0) {
      return res.status(400).json({ error: 'No creators found. Create some creators first.' });
    }
    
    let linksCreated = 0;
    let transactionsCreated = 0;
    let clicksGenerated = 0;
    
    // Create real links and data for each creator
    for (const creator of creators) {
      // Create 2-5 links for each creator
      const linkCount = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < linkCount; i++) {
        const shortCode = `${creator.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 4)}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const urls = [
          'https://www.walmart.com/ip/product123',
          'https://www.amazon.com/dp/product456',
          'https://www.target.com/p/product789',
          'https://www.bestbuy.com/site/product012',
          'https://www.nike.com/product345'
        ];
        
        const link = await prisma.link.create({
          data: {
            creatorId: creator.id,
            shortCode: shortCode,
            originalUrl: urls[Math.floor(Math.random() * urls.length)],
            impactLinkId: `impact_${shortCode}`,
            campaignId: `campaign_${Math.floor(Math.random() * 5) + 1}`,
            clicks: 0,
            conversions: 0,
            revenue: 0,
            isActive: true
          }
        });
        
        linksCreated++;
        
        // Generate 10-50 clicks for each link
        const clickCount = Math.floor(Math.random() * 41) + 10;
        
        for (let j = 0; j < clickCount; j++) {
          const clickDate = new Date();
          clickDate.setDate(clickDate.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
          
          await prisma.clickEvent.create({
            data: {
              linkId: link.id,
              ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              referrer: 'https://google.com',
              location: ['US', 'CA', 'UK', 'AU'][Math.floor(Math.random() * 4)],
              createdAt: clickDate
            }
          });
          
          clicksGenerated++;
        }
        
        // Update link clicks count
        await prisma.link.update({
          where: { id: link.id },
          data: { clicks: clickCount }
        });
        
        // Generate 1-5 conversions for each link (10-20% conversion rate)
        const conversionCount = Math.floor(Math.random() * 3) + 1;
        let linkRevenue = 0;
        
        for (let k = 0; k < conversionCount; k++) {
          const orderValue = Math.floor(Math.random() * 200) + 50; // $50-$250
          const commissionRate = creator.commissionRate || 70;
          const creatorPayout = (orderValue * commissionRate) / 100;
          const platformFee = orderValue - creatorPayout;
          
          const conversionDate = new Date();
          conversionDate.setDate(conversionDate.getDate() - Math.floor(Math.random() * 25)); // Random date in last 25 days
          
          // Create conversion event
          await prisma.conversionEvent.create({
            data: {
              linkId: link.id,
              impactActionId: `action_${Date.now()}_${k}`,
              orderValue: orderValue,
              commission: creatorPayout,
              status: 'APPROVED',
              createdAt: conversionDate
            }
          });
          
          // Create transaction
          await prisma.transaction.create({
            data: {
              creatorId: creator.id,
              grossAmount: orderValue,
              platformFee: platformFee,
              creatorPayout: creatorPayout,
              status: 'COMPLETED',
              impactActionId: `action_${Date.now()}_${k}`,
              createdAt: conversionDate
            }
          });
          
          linkRevenue += orderValue;
          transactionsCreated++;
        }
        
        // Update link conversions and revenue
        await prisma.link.update({
          where: { id: link.id },
          data: { 
            conversions: conversionCount,
            revenue: linkRevenue
          }
        });
      }
    }
    
    console.log(`✅ Dashboard data seeded successfully!`);
    
    res.status(200).json({
      message: '✅ Real dashboard data seeded successfully!',
      data: {
        creatorsProcessed: creators.length,
        linksCreated,
        clicksGenerated,
        transactionsCreated,
        realData: true
      }
    });
    
  } catch (error) {
    console.error('Seed dashboard data error:', error);
    res.status(500).json({ error: 'Failed to seed dashboard data' });
  }
};
*/

exports.getAdvancedPlatformAnalytics = async (req, res) => {
  const { timeFrame = '30d' } = req.query;
  
  try {
    console.log('🔍 Starting advanced analytics request for timeFrame:', timeFrame);
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    const prevStartDate = new Date();
    
    switch (timeFrame) {
      case '7d': 
        startDate.setDate(now.getDate() - 7);
        prevStartDate.setDate(now.getDate() - 14);
        break;
      case '30d': 
        startDate.setDate(now.getDate() - 30);
        prevStartDate.setDate(now.getDate() - 60);
        break;
      case '90d': 
        startDate.setDate(now.getDate() - 90);
        prevStartDate.setDate(now.getDate() - 180);
        break;
      default: 
        startDate.setDate(now.getDate() - 30);
        prevStartDate.setDate(now.getDate() - 60);
    }
    
    console.log('📅 Date range:', { startDate, prevStartDate });
    
    // Get current period data
    console.log('🔄 Starting Promise.all for analytics data...');
    const [currentRevenue, prevRevenue, topCreators, recentTransactions] = await Promise.all([
      // Current period revenue
      prisma.transaction.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { grossAmount: true, creatorPayout: true, platformFee: true },
        _count: true
      }),
      
      // Previous period revenue
      prisma.transaction.aggregate({
        where: { 
          createdAt: { 
            gte: prevStartDate,
            lt: startDate
          }
        },
        _sum: { grossAmount: true, creatorPayout: true, platformFee: true },
        _count: true
      }),
      
      // Top performing creators (simplified to avoid complex relations)
      prisma.creator.findMany({
        include: {
          transactions: {
            where: { createdAt: { gte: startDate } }
          }
        },
        take: 10
      }).catch(error => {
        console.error('❌ Error fetching top creators:', error);
        return []; // Return empty array on error
      }),
      
      // Recent transactions
      prisma.transaction.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          creator: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);
    
    // Calculate growth rates
    const revenueGrowth = prevRevenue._sum.grossAmount > 0 
      ? ((currentRevenue._sum.grossAmount - prevRevenue._sum.grossAmount) / prevRevenue._sum.grossAmount * 100)
      : 0;
    
    // Process top creators
    console.log('📊 Processing top creators data...');
    const topCreatorsWithStats = topCreators
      .map(creator => {
        try {
          const revenue = creator.transactions?.reduce((sum, t) => sum + (t.grossAmount || 0), 0) || 0;
          const earnings = creator.transactions?.reduce((sum, t) => sum + (t.creatorPayout || 0), 0) || 0;
          const platformFees = creator.transactions?.reduce((sum, t) => sum + (t.platformFee || 0), 0) || 0;
          
          return {
            id: creator.id,
            name: creator.name || 'Unknown',
            email: creator.email || 'No email',
            revenue,
            earnings,
            platformFees,
            transactionCount: creator.transactions?.length || 0,
            linkCount: 0, // Simplified - removed _count.links
            commissionRate: creator.commissionRate || 70,
            isActive: creator.isActive || false
          };
        } catch (error) {
          console.error('❌ Error processing creator:', creator.id, error);
          return null;
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    console.log('✅ Processed', topCreatorsWithStats.length, 'top creators');
    
    console.log('📤 Sending analytics response...');
    
    const responseData = {
      timeFrame,
      overview: {
        totalRevenue: currentRevenue?._sum?.grossAmount || 0,
        totalCreatorEarnings: currentRevenue?._sum?.creatorPayout || 0,
        totalPlatformFees: currentRevenue?._sum?.platformFee || 0,
        totalTransactions: currentRevenue?._count || 0,
        revenueGrowth: isNaN(revenueGrowth) ? '0.00' : revenueGrowth.toFixed(2)
      },
      topCreators: topCreatorsWithStats || [],
      recentTransactions: (recentTransactions || []).map(t => ({
        id: t.id,
        amount: t.grossAmount || 0,
        creatorEarnings: t.creatorPayout || 0,
        platformFee: t.platformFee || 0,
        status: t.status || 'UNKNOWN',
        creator: t.creator?.name || 'Unknown Creator',
        createdAt: t.createdAt
      }))
    };
    
    res.status(200).json(responseData);
    console.log('✅ Advanced analytics response sent successfully');
    
  } catch (error) {
    console.error('❌ Advanced platform analytics error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch advanced analytics',
      details: error.message 
    });
  }
};

// Onboarding management functions removed

// ✅ 25. POWERFUL ADMIN: Update creator Impact IDs
exports.updateCreatorImpactIds = async (req, res) => {
  const { creatorId } = req.params;
  const { impactId, impactSubId, reason } = req.body;
  
  try {
    // Validate creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId }
    });
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    // Check if new Impact Sub ID is unique (if provided)
    if (impactSubId && impactSubId !== creator.impactSubId) {
      const existingCreator = await prisma.creator.findUnique({
        where: { impactSubId }
      });
      
      if (existingCreator && existingCreator.id !== creatorId) {
        return res.status(400).json({ error: 'Impact Sub ID already exists for another creator' });
      }
    }
    
    // Update Impact IDs
    const updateData = {};
    if (impactId !== undefined) updateData.impactId = impactId;
    if (impactSubId !== undefined) updateData.impactSubId = impactSubId;
    
    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: updateData
    });
    
    res.status(200).json({ 
      message: 'Impact IDs updated successfully',
      creator: updatedCreator
    });
  } catch (error) {
    console.error('Update Impact IDs error:', error);
    res.status(500).json({ error: 'Failed to update Impact IDs' });
  }
};

// ✅ 26. POWERFUL ADMIN: Remove creator Impact IDs
exports.removeCreatorImpactIds = async (req, res) => {
  const { creatorId } = req.params;
  const { reason } = req.body;
  
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId }
    });
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    // Remove Impact IDs
    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        impactId: null,
        impactSubId: null
      }
    });
    
    res.status(200).json({ 
      message: 'Impact IDs removed successfully',
      creator: updatedCreator
    });
  } catch (error) {
    console.error('Remove Impact IDs error:', error);
    res.status(500).json({ error: 'Failed to remove Impact IDs' });
  }
};

// ✅ 27. POWERFUL ADMIN: Bulk creator actions (activate/deactivate multiple)
exports.bulkUpdateCreatorStatus = async (req, res) => {
  const { creatorIds, action, reason } = req.body;
  
  try {
    if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
      return res.status(400).json({ error: 'Creator IDs array is required' });
    }
    
    if (!['activate', 'deactivate'].includes(action)) {
      return res.status(400).json({ error: 'Action must be activate or deactivate' });
    }
    
    const isActive = action === 'activate';
    
    // Update all creators
    const updatedCreators = await prisma.creator.updateMany({
      where: { id: { in: creatorIds } },
      data: { 
        isActive: isActive,
        statusReason: reason || null,
        statusUpdatedAt: new Date()
      }
    });
    
    // Deactivate all links if deactivating creators
    if (!isActive) {
      await prisma.link.updateMany({
        where: { creatorId: { in: creatorIds } },
        data: { isActive: false }
      });
    }
    
    res.status(200).json({ 
      message: `${action}d ${updatedCreators.count} creators successfully`,
      count: updatedCreators.count
    });
  } catch (error) {
    console.error('Bulk update creator status error:', error);
    res.status(500).json({ error: 'Failed to bulk update creator status' });
  }
};

// ✅ 28. POWERFUL ADMIN: Get creator management summary
exports.getCreatorManagementSummary = async (req, res) => {
  try {
    const [
      totalCreators,
      activeCreators,
      pendingCreators,
      approvedCreators,
      rejectedCreators,
      creatorsWithImpactIds
    ] = await Promise.all([
      prisma.creator.count(),
      prisma.creator.count({ where: { isActive: true } }),
      prisma.creator.count({ where: { applicationStatus: 'PENDING' } }),
      prisma.creator.count({ where: { applicationStatus: 'APPROVED' } }),
      prisma.creator.count({ where: { applicationStatus: 'REJECTED' } }),
      prisma.creator.count({ where: { impactId: { not: null } } })
    ]);
    
    res.status(200).json({
      summary: {
        total: totalCreators,
        active: activeCreators,
        inactive: totalCreators - activeCreators,
        pending: pendingCreators,
        approved: approvedCreators,
        rejected: rejectedCreators,
        withImpactIds: creatorsWithImpactIds,
        withoutImpactIds: totalCreators - creatorsWithImpactIds
      }
    });
  } catch (error) {
    console.error('Creator management summary error:', error);
    res.status(500).json({ error: 'Failed to fetch creator management summary' });
  }
};
