const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get comprehensive admin statistics
 */
exports.getComprehensiveStats = async (req, res) => {
  try {
    const { timeFrame = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeFrame) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get basic stats
    const [
      totalCreators,
      activeCreators,
      pendingApplications,
      totalTransactions,
      totalRevenue,
      totalClicks,
      totalLinks,
      pendingPayouts
    ] = await Promise.all([
      prisma.creator.count(),
      prisma.creator.count({
        where: {
          isActive: true,
          applicationStatus: 'APPROVED'
        }
      }),
      prisma.creator.count({
        where: {
          applicationStatus: 'PENDING'
        }
      }),
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      prisma.transaction.aggregate({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _sum: {
          grossAmount: true
        }
      }),
      prisma.clickEvent.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      prisma.link.count(),
      prisma.earning.aggregate({
        where: {
          status: 'LOCKED',
          lockedUntil: {
            lte: now
          }
        },
        _sum: {
          netAmount: true
        }
      })
    ]);

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalTransactions / totalClicks) * 100 : 0;

    // Get average order value
    const avgOrderValue = totalTransactions > 0 
      ? (totalRevenue._sum.grossAmount || 0) / totalTransactions 
      : 0;

    // Get revenue growth (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime()));
    
    const previousRevenue = await prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      },
      _sum: {
        grossAmount: true
      }
    });

    const revenueGrowth = previousRevenue._sum.grossAmount > 0
      ? (((totalRevenue._sum.grossAmount || 0) - (previousRevenue._sum.grossAmount || 0)) / (previousRevenue._sum.grossAmount || 0)) * 100
      : 0;

    // Get next payout date
    const nextPayout = await prisma.payoutSchedule.findFirst({
      where: {
        isActive: true
      },
      orderBy: {
        nextRun: 'asc'
      }
    });

    res.json({
      totalCreators,
      activeCreators,
      pendingApplications,
      totalTransactions,
      totalRevenue: totalRevenue._sum.grossAmount || 0,
      totalClicks,
      totalLinks,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgOrderValue,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      pendingPayouts: pendingPayouts._sum.netAmount || 0,
      nextPayoutDate: nextPayout?.nextRun || null,
      customerLTV: avgOrderValue * 2.5, // Estimated
      returnRate: 15 // Estimated - would need actual return tracking
    });

  } catch (error) {
    console.error('Get comprehensive stats error:', error);
    res.status(500).json({ error: 'Failed to fetch comprehensive statistics' });
  }
};

/**
 * Get comprehensive analytics including traffic sources, revenue trends, etc.
 */
exports.getComprehensiveAnalytics = async (req, res) => {
  try {
    const { timeFrame = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeFrame) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get traffic sources data
    const clickEvents = await prisma.clickEvent.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        referrer: true,
        userAgent: true,
        location: true
      }
    });

    // Process traffic sources
    const trafficSources = {};
    clickEvents.forEach(event => {
      const source = event.referrer || 'Direct';
      const domain = source.includes('://') 
        ? new URL(source).hostname.replace('www.', '')
        : source;
      
      trafficSources[domain] = (trafficSources[domain] || 0) + 1;
    });

    const totalTraffic = clickEvents.length;
    const trafficSourcesArray = Object.entries(trafficSources)
      .map(([name, visits]) => ({
        name: name === 'Direct' ? 'Direct Traffic' : name,
        visits,
        percentage: totalTraffic > 0 ? Math.round((visits / totalTraffic) * 100) : 0,
        color: getColorForSource(name)
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    // Get daily revenue data
    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        SUM("grossAmount") as revenue,
        COUNT(*) as transactions
      FROM "Transaction"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt")
    `;

    const revenueData = dailyRevenue.map(day => ({
      label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(day.revenue) || 0
    }));

    // Get daily conversion data
    const dailyConversions = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as conversions
      FROM "ConversionEvent"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt")
    `;

    const conversionData = dailyConversions.map(day => ({
      label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseInt(day.conversions) || 0
    }));

    res.json({
      traffic: {
        sources: trafficSourcesArray,
        totalVisits: totalTraffic
      },
      revenue: revenueData,
      conversions: conversionData
    });

  } catch (error) {
    console.error('Get comprehensive analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch comprehensive analytics' });
  }
};

/**
 * Get creators with detailed performance data
 */
exports.getCreatorsWithAnalytics = async (req, res) => {
  try {
    const creators = await prisma.creator.findMany({
      include: {
        transactions: {
          select: {
            grossAmount: true,
            creatorPayout: true
          }
        },
        links: {
          select: {
            clicks: true,
            conversions: true,
            clickEvents: {
              select: {
                referrer: true
              }
            }
          }
        },
        earnings: {
          select: {
            netAmount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const creatorsWithAnalytics = creators.map(creator => {
      const totalEarnings = creator.earnings.reduce((sum, earning) => sum + earning.netAmount, 0);
      const totalClicks = creator.links.reduce((sum, link) => sum + link.clicks, 0);
      const totalConversions = creator.links.reduce((sum, link) => sum + link.conversions, 0);
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Get traffic sources for this creator
      const trafficSources = new Set();
      creator.links.forEach(link => {
        link.clickEvents.forEach(click => {
          if (click.referrer) {
            const domain = click.referrer.includes('://') 
              ? new URL(click.referrer).hostname.replace('www.', '')
              : click.referrer;
            trafficSources.add(domain);
          }
        });
      });

      return {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        applicationStatus: creator.applicationStatus,
        impactSubId: creator.impactSubId, // Add impact subid for admin view
        totalEarnings,
        totalClicks,
        totalConversions,
        conversionRate,
        trafficSources: Array.from(trafficSources).slice(0, 5),
        memberSince: creator.createdAt,
        isActive: creator.isActive
      };
    });

    res.json({
      creators: creatorsWithAnalytics
    });

  } catch (error) {
    console.error('Get creators with analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch creators analytics' });
  }
};

/**
 * Get detailed creator information
 */
exports.getCreatorDetails = async (req, res) => {
  try {
    const { creatorId } = req.params;

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        links: {
          include: {
            clickEvents: true,
            conversionEvents: true
          }
        },
        earnings: true,
        paymentAccount: true,
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Calculate additional analytics
    const totalRevenue = creator.transactions.reduce((sum, t) => sum + t.grossAmount, 0);
    const totalClicks = creator.links.reduce((sum, l) => sum + l.clicks, 0);
    const totalConversions = creator.links.reduce((sum, l) => sum + l.conversions, 0);

    // Traffic source analysis
    const trafficAnalysis = {};
    creator.links.forEach(link => {
      link.clickEvents.forEach(click => {
        const source = click.referrer || 'Direct';
        const domain = source.includes('://') 
          ? new URL(source).hostname.replace('www.', '')
          : source;
        
        trafficAnalysis[domain] = (trafficAnalysis[domain] || 0) + 1;
      });
    });

    res.json({
      creator: {
        ...creator,
        analytics: {
          totalRevenue,
          totalClicks,
          totalConversions,
          conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
          trafficSources: Object.entries(trafficAnalysis)
            .map(([source, clicks]) => ({ source, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
        }
      }
    });

  } catch (error) {
    console.error('Get creator details error:', error);
    res.status(500).json({ error: 'Failed to fetch creator details' });
  }
};

// Helper function to assign colors to traffic sources
function getColorForSource(source) {
  const colors = [
    '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
    '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];
  
  const sourceColors = {
    'Direct Traffic': '#6B7280',
    'google.com': '#4285F4',
    'facebook.com': '#1877F2',
    'instagram.com': '#E4405F',
    'twitter.com': '#1DA1F2',
    'tiktok.com': '#000000',
    'youtube.com': '#FF0000',
    'linkedin.com': '#0A66C2'
  };

  return sourceColors[source] || colors[Math.abs(source.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
}

module.exports = exports;
