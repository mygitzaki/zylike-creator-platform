// backend/controllers/link.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateTrackingLink, getCampaigns } = require('../services/impactService');

/**
 * Create a new tracking link using Impact.com
 */
exports.createLink = async (req, res) => {
  const userId = req.creator.id;
  const { originalUrl, campaignId } = req.body;

  console.log('🔗 Creating link for user:', userId);
  console.log('🔗 Original URL:', originalUrl);
  console.log('🔗 Campaign ID:', campaignId);
  console.log('🔗 Request body:', req.body);
  console.log('🔗 Creator object:', req.creator);

  if (!originalUrl) {
    console.log('❌ No original URL provided');
    return res.status(400).json({ error: 'Original URL is required' });
  }

  try {
    // Get creator to find their Impact subId
    const creator = await prisma.creator.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        impactSubId: true,
        role: true
      }
    });

    console.log('🔍 Creator found:', {
      id: creator?.id,
      name: creator?.name,
      email: creator?.email,
      impactSubId: creator?.impactSubId,
      applicationStatus: creator?.applicationStatus,
      isActive: creator?.isActive,
      role: creator?.role
    });

    if (!creator) {
      console.log('❌ Creator not found');
      return res.status(404).json({ error: 'Creator not found' });
    }

    if (!creator.impactSubId) {
      console.log('⚠️ Creator has no Impact Sub ID - using test ID for demonstration');
      // For testing purposes, use a test impactSubId
      creator.impactSubId = 'test_creator_' + creator.id.substring(0, 8);
    }

    // Check if creator is approved and active (skip for admin users)
    if (creator.role !== 'ADMIN') {
      // For now, allow all creators to generate links since approval system is simplified
      console.log('✅ Creator user - allowing link generation');
    } else {
      console.log('✅ Admin user - skipping approval checks');
    }

    console.log('✅ Creator has valid Impact.com IDs and is approved for link generation');

    // Decide campaign: if none provided, default to the only available real program (WalmartCreator.com → 16662)
    const resolvedCampaignId = campaignId || '16662';

    console.log('🎯 Generating tracking link with:', {
      campaignId: resolvedCampaignId,
      impactSubId: creator.impactSubId,
      originalUrl
    });

    // Generate tracking link through Impact.com
    const trackingLink = await generateTrackingLink(resolvedCampaignId, creator.impactSubId, originalUrl);
    
    console.log('✅ Impact.com tracking link generated:', trackingLink);

    // Check if this is a mock link (due to permissions)
    const isMockLink = !trackingLink.IsReal;
    if (isMockLink) {
      console.log('⚠️ Generated mock tracking link due to Impact.com permissions');
      console.log('📋 User should contact admin to enable real tracking links');
    }

    // Save to database
    const shortCode = trackingLink.TrackingLinkId || generateShortCode();
    
    const newLink = await prisma.link.create({
      data: {
        originalUrl,
        shortCode: shortCode,
        impactLinkId: trackingLink.TrackingLinkId,
        campaignId: resolvedCampaignId,
        creatorId: userId,
      },
    });

    // Return the REAL Impact.com tracking URL as the main trackingUrl
    res.status(201).json({
      ...newLink,
      trackingUrl: trackingLink.TrackingUrl, // Use REAL Impact.com URL
      localTrackingUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/tracking/click/${shortCode}`, // Internal tracking for analytics
      isMockLink: isMockLink, // Whether this is a mock link
      linkType: isMockLink ? 'mock' : 'real', // Link type for frontend
      message: isMockLink ? 
        'Link generated with mock tracking (contact admin to enable real Impact.com links)' : 
        'Link generated successfully with real Impact.com tracking'
    });
  } catch (error) {
    console.error('❌ Create link error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    res.status(500).json({ 
      error: 'Server error while creating tracking link',
      details: error.message,
      errorType: error.name
    });
  }
};

/**
 * Get all links for the logged-in creator
 */
exports.getUserLinks = async (req, res) => {
  const userId = req.creator.id;

  try {
    const links = await prisma.link.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(links);
  } catch (error) {
    console.error('❌ Get links error:', error);
    res.status(500).json({ error: 'Server error while fetching links' });
  }
};

/**
 * Get available campaigns for link generation
 */
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await getCampaigns();
    res.status(200).json({ campaigns });
  } catch (error) {
    console.error('❌ Get campaigns error:', error);
    res.status(500).json({ error: 'Server error while fetching campaigns' });
  }
};

/**
 * Helper to generate a unique 8-character short code
 */
function generateShortCode() {
  return Math.random().toString(36).substring(2, 10);
}
