const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ 1. Get all creators (simplified)
exports.getAllCreators = async (req, res) => {
  try {
    const creators = await prisma.creator.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        impactSubId: true,
        commissionRate: true,
        role: true,
        createdAt: true,
        walletAddress: true,
        _count: {
          select: {
            links: true,
            transactions: true,
            earnings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📊 Retrieved creators:', creators.length);
    res.status(200).json(creators);
  } catch (error) {
    console.error('❌ Failed to fetch creators:', error);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
};

// ✅ 2. Get platform stats (simplified)
exports.getPlatformStats = async (req, res) => {
  try {
    const totalCreators = await prisma.creator.count({ where: { role: 'USER' } });
    const creatorsWithImpactIds = await prisma.creator.count({
      where: { 
        impactSubId: { not: null },
        role: 'USER'
      }
    });
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

    console.log('📊 Platform stats calculated');
    res.status(200).json({
      totalCreators,
      creatorsWithImpactIds,
      totalLinks,
      totalTransactions,
      totalRevenue: revenueStats._sum.grossAmount || 0,
      totalPayouts: revenueStats._sum.creatorPayout || 0,
      totalFees: revenueStats._sum.platformFee || 0
    });
  } catch (error) {
    console.error('❌ Failed to fetch platform stats:', error);
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
};

// ✅ 3. Update creator's Impact.com ID
exports.updateCreatorImpactId = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { impactSubId, commissionRate } = req.body;

    if (!impactSubId) {
      return res.status(400).json({ error: 'Impact Sub ID is required' });
    }

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        impactSubId,
        ...(commissionRate && { commissionRate: parseInt(commissionRate) })
      },
      select: {
        id: true,
        name: true,
        email: true,
        impactSubId: true,
        commissionRate: true,
        role: true
      }
    });

    console.log('✅ Creator Impact ID updated:', updatedCreator.email);
    res.status(200).json({ 
      message: 'Creator Impact ID updated successfully',
      creator: updatedCreator
    });
  } catch (error) {
    console.error('❌ Failed to update creator Impact ID:', error);
    res.status(500).json({ error: 'Failed to update creator Impact ID' });
  }
};

// ✅ 4. Update creator commission rate
exports.updateCreatorCommission = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { commissionRate } = req.body;

    if (!commissionRate || commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({ error: 'Valid commission rate (0-100) is required' });
    }

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: { commissionRate: parseInt(commissionRate) },
      select: {
        id: true,
        name: true,
        email: true,
        commissionRate: true,
        role: true
      }
    });

    console.log('✅ Creator commission rate updated:', updatedCreator.email);
    res.status(200).json({ 
      message: 'Creator commission rate updated successfully',
      creator: updatedCreator
    });
  } catch (error) {
    console.error('❌ Failed to update creator commission rate:', error);
    res.status(500).json({ error: 'Failed to update creator commission rate' });
  }
};

// ✅ 5. Bulk update commission rates
exports.bulkUpdateCommissionRates = async (req, res) => {
  try {
    const { commissionRate, creatorIds } = req.body;

    if (!commissionRate || commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({ error: 'Valid commission rate (0-100) is required' });
    }

    if (!creatorIds || !Array.isArray(creatorIds) || creatorIds.length === 0) {
      return res.status(400).json({ error: 'Creator IDs array is required' });
    }

    const updatePromises = creatorIds.map(creatorId =>
      prisma.creator.update({
        where: { id: creatorId },
        data: { commissionRate: parseInt(commissionRate) }
      })
    );

    await Promise.all(updatePromises);

    console.log('✅ Bulk commission rate update completed for', creatorIds.length, 'creators');
    res.status(200).json({ 
      message: `Commission rate updated to ${commissionRate}% for ${creatorIds.length} creators`,
      updatedCount: creatorIds.length
    });
  } catch (error) {
    console.error('❌ Failed to bulk update commission rates:', error);
    res.status(500).json({ error: 'Failed to bulk update commission rates' });
  }
};

// ✅ 6. Get creator details
exports.getCreatorDetails = async (req, res) => {
  try {
    const { creatorId } = req.params;

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        name: true,
        email: true,
        impactSubId: true,
        commissionRate: true,
        role: true,
        createdAt: true,
        walletAddress: true,
        links: {
          select: {
            id: true,
            originalUrl: true,
            clicks: true,
            conversions: true,
            revenue: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        transactions: {
          select: {
            id: true,
            grossAmount: true,
            creatorPayout: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    console.log('📊 Retrieved creator details:', creator.email);
    res.status(200).json(creator);
  } catch (error) {
    console.error('❌ Failed to fetch creator details:', error);
    res.status(500).json({ error: 'Failed to fetch creator details' });
  }
};

// ✅ 7. Delete creator (admin only)
exports.deleteCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;

    // Check if creator exists and is not an admin
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { role: true, email: true }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    if (creator.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot delete admin accounts' });
    }

    // Delete creator and all related data
    await prisma.creator.delete({
      where: { id: creatorId }
    });

    console.log('🗑️ Creator deleted:', creator.email);
    res.status(200).json({ message: 'Creator deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete creator:', error);
    res.status(500).json({ error: 'Failed to delete creator' });
  }
};
