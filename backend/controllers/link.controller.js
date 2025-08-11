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
      console.log('❌ Creator has no Impact Sub ID - cannot generate links');
      return res.status(400).json({ 
        error: 'Your account does not have Impact.com IDs assigned. Please contact admin for approval.',
        needsApproval: true,
        currentStatus: creator.applicationStatus
      });
    }

    // Check if creator is approved and active
    if (creator.applicationStatus !== 'APPROVED') {
      console.log('❌ Creator not approved:', creator.applicationStatus);
      return res.status(400).json({ 
        error: `Your application status is "${creator.applicationStatus}". You need admin approval to generate links.`,
        needsApproval: true,
        currentStatus: creator.applicationStatus
      });
    }

    if (!creator.isActive) {
      console.log('❌ Creator not active');
      return res.status(400).json({ 
        error: 'Your account is not active. Please contact admin.',
        needsActivation: true
      });
    }

    console.log('✅ Creator has valid Impact.com IDs and is approved for link generation');
        
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
