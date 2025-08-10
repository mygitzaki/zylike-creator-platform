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
        applicationStatus: true,
        isActive: true
      }
    });

    console.log('🔍 Creator found:', {
      id: creator?.id,
      name: creator?.name,
      email: creator?.email,
      impactSubId: creator?.impactSubId,
      applicationStatus: creator?.applicationStatus,
      isActive: creator?.isActive
    });

    if (!creator) {
      console.log('❌ Creator not found');
      return res.status(404).json({ error: 'Creator not found' });
    }

    if (!creator.impactSubId) {
      console.log('⚠️ Creator has no Impact Sub ID - attempting to auto-assign...');
      
      // Auto-generate Impact Sub ID for active creators (more permissive for testing)
      if (!creator.isActive) {
        console.log('❌ Creator not active');
        return res.status(400).json({ 
          error: 'Your account is not active. Please contact admin.',
          needsActivation: true
        });
      }

      // Allow link generation for PENDING, UNDER_REVIEW, and APPROVED creators
      const allowedStatuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED'];
      if (!allowedStatuses.includes(creator.applicationStatus)) {
        console.log('❌ Creator application status not allowed:', creator.applicationStatus);
        return res.status(400).json({ 
          error: `Application status "${creator.applicationStatus}" not allowed for link generation. Please contact admin.`,
          currentStatus: creator.applicationStatus,
          needsApproval: true
        });
      }

      try {
        // Generate a unique Impact Sub ID
        const baseSubId = creator.name?.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8) || 'creator';
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const newImpactSubId = `${baseSubId}_${randomSuffix}`;

        console.log('🆔 Auto-assigning Impact Sub ID:', newImpactSubId);

        // Update the creator with the new Impact Sub ID
        const updatedCreator = await prisma.creator.update({
          where: { id: userId },
          data: { 
            impactSubId: newImpactSubId,
            impactId: `impact_${newImpactSubId}` // Also set impactId for completeness
          },
          select: {
            id: true,
            name: true,
            impactSubId: true,
            impactId: true
          }
        });

        console.log('✅ Impact Sub ID assigned:', updatedCreator);
        
        // Update the creator object for link generation
        creator.impactSubId = updatedCreator.impactSubId;
        
      } catch (assignError) {
        console.error('❌ Failed to auto-assign Impact Sub ID:', assignError);
        return res.status(500).json({ 
          error: 'Failed to configure Impact tracking. Please contact admin.',
          needsAdmin: true
        });
      }
    }

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

    // Generate local tracking URL
    const localTrackingUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/tracking/click/${shortCode}`;

    res.status(201).json({
      ...newLink,
      trackingUrl: localTrackingUrl, // Use local tracking URL
      impactTrackingUrl: trackingLink.TrackingUrl, // Original Impact URL
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
