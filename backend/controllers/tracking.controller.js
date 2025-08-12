const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ 1. Track click event and redirect (ANALYTICS ONLY - NO PAYMENT FOR CLICKS)
exports.trackClick = async (req, res) => {
  const { shortCode } = req.params;
  const { ip, userAgent, referrer } = req.headers;
  
  try {
    // Find the link
    const link = await prisma.link.findUnique({
      where: { shortCode },
      include: { creator: true }
    });
    
    if (!link || !link.isActive) {
      return res.status(404).json({ error: 'Link not found or inactive' });
    }
    
    // Record the click event (FOR ANALYTICS ONLY - NO EARNINGS FROM CLICKS)
    await prisma.clickEvent.create({
      data: {
        linkId: link.id,
        ipAddress: req.ip || ip,
        userAgent: userAgent,
        referrer: referrer,
        location: req.headers['cf-ipcountry'] || 'Unknown'
      }
    });
    
    // Increment click counter (ANALYTICS ONLY - NO PAYMENT)
    await prisma.link.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } }
    });
    
    console.log(`🖱️ Click tracked for creator ${link.creator.name}: ${shortCode} (Analytics only - no payment)`);
    
    // Redirect to the original URL
    res.redirect(302, link.originalUrl);
    
  } catch (error) {
    console.error('Click tracking error:', error);
    res.status(500).json({ error: 'Click tracking failed' });
  }
};

// ✅ 2. Get intelligent analytics for a specific creator
exports.getCreatorAnalytics = async (req, res) => {
  const creatorId = req.creator.id; // From auth middleware
  const { timeFrame = '30d' } = req.query;
  
  try {
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    const previousStartDate = new Date();
    
    switch (timeFrame) {
      case '1d': 
        startDate.setDate(now.getDate() - 1); 
        previousStartDate.setDate(now.getDate() - 2);
        break;
      case '7d': 
        startDate.setDate(now.getDate() - 7); 
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case '30d': 
        startDate.setDate(now.getDate() - 30); 
        previousStartDate.setDate(now.getDate() - 60);
        break;
      case '90d': 
        startDate.setDate(now.getDate() - 90); 
        previousStartDate.setDate(now.getDate() - 180);
        break;
      default: 
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
    }
    
    // Get current period data
    const [links, transactions, clickEvents, conversionEvents] = await Promise.all([
      prisma.link.findMany({
        where: { creatorId },
        include: {
          clickEvents: {
            where: { createdAt: { gte: startDate } }
          },
          conversionEvents: {
            where: { createdAt: { gte: startDate } }
          }
        }
      }),
      prisma.transaction.findMany({
        where: {
          creatorId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.clickEvent.findMany({
        where: {
          link: { creatorId },
          createdAt: { gte: startDate }
        },
        include: { link: true }
      }),
      prisma.conversionEvent.findMany({
        where: {
          link: { creatorId },
          createdAt: { gte: startDate }
        },
        include: { link: true }
      })
    ]);
    
    // Get previous period for comparison
    const [previousTransactions, previousClickEvents] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          creatorId,
          createdAt: { gte: previousStartDate, lt: startDate }
        }
      }),
      prisma.clickEvent.findMany({
        where: {
          link: { creatorId },
          createdAt: { gte: previousStartDate, lt: startDate }
        }
      })
    ]);
    
    // Calculate current metrics
    const totalClicks = clickEvents.length;
    const totalConversions = conversionEvents.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.grossAmount, 0);
    const totalEarnings = transactions.reduce((sum, t) => sum + t.creatorPayout, 0);
    
    // Separate commissionable vs non-commissionable sales
    const commissionableTransactions = transactions.filter(t => t.isCommissionable);
    const nonCommissionableTransactions = transactions.filter(t => !t.isCommissionable);
    
    const commissionableRevenue = commissionableTransactions.reduce((sum, t) => sum + t.grossAmount, 0);
    const commissionableEarnings = commissionableTransactions.reduce((sum, t) => sum + t.creatorPayout, 0);
    const nonCommissionableRevenue = nonCommissionableTransactions.reduce((sum, t) => sum + t.grossAmount, 0);
    const nonCommissionableEarnings = nonCommissionableTransactions.reduce((sum, t) => sum + t.creatorPayout, 0);
    
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;
    const avgOrderValue = totalConversions > 0 ? (totalRevenue / totalConversions) : 0;
    
    // Calculate previous metrics for growth (only commissionable)
    const previousCommissionableTransactions = previousTransactions.filter(t => t.isCommissionable);
    const previousCommissionableEarnings = previousCommissionableTransactions.reduce((sum, t) => sum + t.creatorPayout, 0);
    const previousClicks = previousClickEvents.length;
    
    // Growth calculations (based on commissionable earnings only)
    const earningsGrowth = previousCommissionableEarnings > 0 ? ((commissionableEarnings - previousCommissionableEarnings) / previousCommissionableEarnings * 100) : 0;
    const clicksGrowth = previousClicks > 0 ? ((totalClicks - previousClicks) / previousClicks * 100) : 0;
    
    // Performance by time periods (daily breakdown)
    const dailyData = {};
    const days = timeFrame === '1d' ? 24 : (timeFrame === '7d' ? 7 : (timeFrame === '30d' ? 30 : 90));
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      if (timeFrame === '1d') {
        date.setHours(date.getHours() + i);
      } else {
        date.setDate(date.getDate() + i);
      }
      const key = timeFrame === '1d' ? date.getHours() : date.toISOString().split('T')[0];
      dailyData[key] = { clicks: 0, conversions: 0, earnings: 0 };
    }
    
    // Fill daily data
    clickEvents.forEach(click => {
      const key = timeFrame === '1d' ? click.createdAt.getHours() : click.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) dailyData[key].clicks++;
    });
    
    conversionEvents.forEach(conversion => {
      const key = timeFrame === '1d' ? conversion.createdAt.getHours() : conversion.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) dailyData[key].conversions++;
    });
    
    // Only include commissionable transactions in daily earnings
    commissionableTransactions.forEach(transaction => {
      const key = timeFrame === '1d' ? transaction.createdAt.getHours() : transaction.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) dailyData[key].earnings += transaction.creatorPayout;
    });
    
    // Top performing links
    const topLinks = links
      .map(link => ({
        id: link.id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        clicks: link.clickEvents.length,
        conversions: link.conversionEvents.length,
        revenue: link.conversionEvents.reduce((sum, c) => sum + c.orderValue, 0),
        conversionRate: link.clickEvents.length > 0 ? (link.conversionEvents.length / link.clickEvents.length * 100) : 0,
        createdAt: link.createdAt
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Device and location analytics
    const deviceStats = {};
    const locationStats = {};
    const referrerStats = {};
    
    clickEvents.forEach(click => {
      // Extract device type from user agent
      const userAgent = click.userAgent || '';
      let device = 'Desktop';
      if (userAgent.includes('Mobile')) device = 'Mobile';
      else if (userAgent.includes('Tablet')) device = 'Tablet';
      
      deviceStats[device] = (deviceStats[device] || 0) + 1;
      locationStats[click.location] = (locationStats[click.location] || 0) + 1;
      
      const referrer = click.referrer || 'Direct';
      const domain = referrer.includes('://') ? new URL(referrer).hostname : referrer;
      referrerStats[domain] = (referrerStats[domain] || 0) + 1;
    });
    
    // Intelligent insights
    const insights = [];
    
    if (conversionRate > 5) {
      insights.push({
        type: 'success',
        title: 'Excellent Conversion Rate',
        message: `Your ${conversionRate.toFixed(1)}% conversion rate is above industry average. Keep up the great work!`,
        action: 'Scale up your top-performing campaigns'
      });
    } else if (conversionRate < 1) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        message: 'Consider optimizing your content and targeting more relevant audiences.',
        action: 'Review your top-performing links for insights'
      });
    }
    
    if (earningsGrowth > 20) {
      insights.push({
        type: 'success',
        title: 'Strong Growth',
        message: `Your earnings grew by ${earningsGrowth.toFixed(1)}% compared to the previous period!`,
        action: 'Double down on what\'s working'
      });
    }
    
    if (totalClicks > 0 && totalConversions === 0) {
      insights.push({
        type: 'info',
        title: 'Optimize for Conversions',
        message: 'You\'re getting clicks but no conversions. Try more targeted content.',
        action: 'Review your link destinations and audience fit'
      });
    }
    
    res.status(200).json({
      timeFrame,
      analytics: {
        // Core metrics (showing only commissionable data to creators)
        totalClicks,
        totalConversions,
        totalRevenue: commissionableRevenue,  // Only commissionable revenue
        totalEarnings: commissionableEarnings, // Only commissionable earnings
        
        // Detailed commissionable data
        commissionableRevenue,
        commissionableEarnings,
        commissionableCount: commissionableTransactions.length,
        
        conversionRate: conversionRate.toFixed(2),
        avgOrderValue: totalConversions > 0 ? (commissionableRevenue / totalConversions).toFixed(2) : '0.00',
        linksCreated: links.length,
        transactionsCount: commissionableTransactions.length, // Only commissionable transactions
        
        // Growth metrics
        earningsGrowth: earningsGrowth.toFixed(1),
        clicksGrowth: clicksGrowth.toFixed(1),
        
        // Performance data
        dailyData: Object.entries(dailyData).map(([date, data]) => ({
          date,
          ...data
        })),
        
        // Breakdowns
        deviceStats,
        locationStats,
        referrerStats,
        
        // Insights
        insights
      },
      topLinks,
      recentTransactions: transactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(t => ({
          id: t.id,
          amount: t.grossAmount,
          earnings: t.creatorPayout,
          status: t.status,
          createdAt: t.createdAt
        }))
    });
    
  } catch (error) {
    console.error('Get creator analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// ✅ 3. Record conversion from Impact.com webhook (REAL SALES = REAL EARNINGS)
exports.recordConversion = async (req, res) => {
  const { actionId, campaignId, subId1, amount, payout, status } = req.body;
  
  try {
    // ✅ ADDED: Basic webhook validation
    if (!actionId || !subId1 || !amount) {
      console.log('⚠️ Invalid webhook data received:', { actionId, subId1, amount });
      return res.status(400).json({ error: 'Missing required webhook data' });
    }
    
    // ✅ ADDED: Validate amount is a positive number
    const grossAmount = parseFloat(amount || 0);
    if (grossAmount <= 0 || isNaN(grossAmount)) {
      console.log('⚠️ Invalid amount in webhook:', amount);
      return res.status(400).json({ error: 'Invalid amount value' });
    }
    
    // Find creator by subId1
    const creator = await prisma.creator.findFirst({
      where: { impactSubId: subId1 }
    });
    
    if (!creator) {
      console.log(`⚠️ Creator not found for subId: ${subId1}`);
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    // ✅ ADDED: Check if creator is active and approved
    if (!creator.isActive || creator.applicationStatus !== 'APPROVED') {
      console.log(`⚠️ Creator ${creator.name} is not active or approved`);
      return res.status(400).json({ error: 'Creator not eligible for commissions' });
    }
    
    // Find associated link (if any)
    const link = await prisma.link.findFirst({
      where: { 
        creatorId: creator.id,
        campaignId: campaignId 
      }
    });
    
    if (link) {
      // Record conversion event
      await prisma.conversionEvent.create({
        data: {
          linkId: link.id,
          impactActionId: actionId,
          orderValue: grossAmount,
          commission: grossAmount * (creator.commissionRate / 100), // Use calculated commission
          status: status || 'PENDING'
        }
      });
      
      // Update link stats
      await prisma.link.update({
        where: { id: link.id },
        data: { 
          conversions: { increment: 1 },
          revenue: { increment: grossAmount }
        }
      });
      
      console.log(`💰 Conversion recorded for ${creator.name}: $${grossAmount}`);
    }
    
    // ✅ FIXED: Calculate REAL revenue split using creator's commission rate
    const creatorCommissionRate = creator.commissionRate || 70; // Default to 70% if not set
    
    // Calculate actual payout based on creator's commission rate
    const creatorPayout = grossAmount * (creatorCommissionRate / 100);
    const platformFee = grossAmount - creatorPayout;
    
    console.log(`💸 Revenue Split for ${creator.name}:`);
    console.log(`   Gross Amount: $${grossAmount}`);
    console.log(`   Creator Rate: ${creatorCommissionRate}%`);
    console.log(`   Creator Payout: $${creatorPayout.toFixed(2)}`);
    console.log(`   Platform Fee: $${platformFee.toFixed(2)}`);
    
    // ✅ ADDED: Check for duplicate transactions
    const existingTransaction = await prisma.transaction.findFirst({
      where: { impactActionId: actionId }
    });
    
    if (existingTransaction) {
      console.log(`⚠️ Transaction already exists for actionId: ${actionId}`);
      return res.status(200).json({ message: 'Transaction already recorded' });
    }
    
    // Create transaction record with REAL calculated values
    await prisma.transaction.create({
      data: {
        creatorId: creator.id,
        grossAmount,          // Total sale amount from Impact.com
        platformFee,          // Zylike's calculated fee
        creatorPayout,        // Creator's calculated payout based on their rate
        status: status || 'PENDING',
        impactActionId: actionId,
        isCommissionable: true // Mark as commissionable for bonuses
      }
    });
    
    res.status(200).json({ 
      message: 'Conversion recorded successfully',
      revenueSplit: {
        grossAmount,
        creatorCommissionRate,
        creatorPayout: creatorPayout.toFixed(2),
        platformFee: platformFee.toFixed(2)
      }
    });
    
  } catch (error) {
    console.error('Record conversion error:', error);
    res.status(500).json({ error: 'Failed to record conversion' });
  }
};

// ✅ 4. Get platform-wide analytics (Admin only)
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const { timeFrame = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeFrame) {
      case '1d': startDate.setDate(now.getDate() - 1); break;
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      default: startDate.setDate(now.getDate() - 30);
    }
    
    // Get all data for the timeframe
    const [totalClicks, totalConversions, totalRevenue, totalCreators, activeLinks] = await Promise.all([
      prisma.clickEvent.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.conversionEvent.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { grossAmount: true, creatorPayout: true, platformFee: true }
      }),
      prisma.creator.count({
        where: { role: 'USER' }
      }),
      prisma.link.count({
        where: { 
          isActive: true,
          createdAt: { gte: startDate }
        }
      })
    ]);
    
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;
    
    res.status(200).json({
      timeFrame,
      platformAnalytics: {
        totalClicks,
        totalConversions,
        conversionRate: conversionRate.toFixed(2),
        totalRevenue: totalRevenue._sum.grossAmount || 0,
        totalCreatorEarnings: totalRevenue._sum.creatorPayout || 0,
        totalPlatformFees: totalRevenue._sum.platformFee || 0,
        totalCreators,
        activeLinks
      }
    });
    
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch platform analytics' });
  }
};

// ✅ 5. Test commission calculation (for development/testing)
exports.testCommissionCalculation = async (req, res) => {
  try {
    const { creatorId, testAmount = 100 } = req.body;
    
    if (!creatorId) {
      return res.status(400).json({ error: 'Creator ID is required' });
    }
    
    // Find creator
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { id: true, name: true, email: true, commissionRate: true }
    });
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    // Calculate commission split
    const grossAmount = parseFloat(testAmount);
    const creatorCommissionRate = creator.commissionRate || 70;
    const creatorPayout = grossAmount * (creatorCommissionRate / 100);
    const platformFee = grossAmount - creatorPayout;
    
    // Create test transaction
    const testTransaction = await prisma.transaction.create({
      data: {
        creatorId: creator.id,
        grossAmount,
        platformFee,
        creatorPayout,
        status: 'TEST',
        impactActionId: `test_${Date.now()}`,
        isCommissionable: true
      }
    });
    
    res.status(200).json({
      message: 'Test commission calculation completed',
      creator: {
        name: creator.name,
        email: creator.email,
        commissionRate: creatorCommissionRate
      },
      calculation: {
        grossAmount,
        creatorCommissionRate: `${creatorCommissionRate}%`,
        creatorPayout: creatorPayout.toFixed(2),
        platformFee: platformFee.toFixed(2),
        platformPercentage: `${((platformFee / grossAmount) * 100).toFixed(1)}%`
      },
      transaction: {
        id: testTransaction.id,
        status: testTransaction.status
      }
    });
    
  } catch (error) {
    console.error('Test commission calculation error:', error);
    res.status(500).json({ error: 'Failed to test commission calculation' });
  }
};
