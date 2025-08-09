const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Smart Onboarding Controller - Built with safety and incremental approach

/**
 * Get creator's current onboarding status
 */
exports.getOnboardingStatus = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        name: true,
        email: true,
        isOnboarded: true,
        onboardingStep: true,
        bio: true,
        socialInstagram: true,
        socialTiktok: true,
        socialYoutube: true,
        socialTwitter: true,
        onboardedAt: true
      }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Define onboarding steps
    const steps = [
      { step: 0, title: "Welcome", description: "Welcome to Zylike!" },
      { step: 1, title: "Profile", description: "Tell us about yourself" },
      { step: 2, title: "Social Media", description: "Connect your social accounts" },
      { step: 3, title: "Review", description: "Review your information" },
      { step: 4, title: "Complete", description: "Complete your onboarding" }
    ];

    res.json({
      success: true,
      creator: {
        ...creator,
        totalSteps: steps.length,
        currentStepInfo: steps[creator.onboardingStep] || steps[0],
        nextStep: creator.onboardingStep < steps.length - 1 ? creator.onboardingStep + 1 : null
      },
      steps
    });

  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
};

/**
 * Update creator's profile information (Step 1)
 */
exports.updateProfile = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { name, bio } = req.body;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be less than 500 characters' });
    }

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        name: name.trim(),
        bio: bio ? bio.trim() : null,
        onboardingStep: Math.max(1, req.creator.onboardingStep || 0) // Progress to at least step 1
      },
      select: {
        id: true,
        name: true,
        bio: true,
        onboardingStep: true,
        isOnboarded: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Update social media links (Step 2)
 */
exports.updateSocialMedia = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { instagram, tiktok, youtube, twitter } = req.body;

    // Helper function to validate and clean social handles
    const cleanHandle = (handle) => {
      if (!handle || handle.trim() === '') return null;
      // Remove @ symbol and URL prefixes, keep just the handle
      return handle.replace(/^[@]|^https?:\/\/(www\.)?(instagram\.com\/|tiktok\.com\/@|youtube\.com\/(c\/|channel\/|@)|twitter\.com\/)/i, '').trim();
    };

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        socialInstagram: cleanHandle(instagram),
        socialTiktok: cleanHandle(tiktok),
        socialYoutube: cleanHandle(youtube),
        socialTwitter: cleanHandle(twitter),
        onboardingStep: Math.max(2, req.creator.onboardingStep || 0) // Progress to at least step 2
      },
      select: {
        id: true,
        socialInstagram: true,
        socialTiktok: true,
        socialYoutube: true,
        socialTwitter: true,
        onboardingStep: true,
        isOnboarded: true
      }
    });

    res.json({
      success: true,
      message: 'Social media links updated successfully',
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Update social media error:', error);
    res.status(500).json({ error: 'Failed to update social media links' });
  }
};

/**
 * Complete onboarding process
 */
exports.completeOnboarding = async (req, res) => {
  try {
    const creatorId = req.creator.id;

    // Get current creator data to validate completion
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        name: true,
        onboardingStep: true,
        isOnboarded: true
      }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Check if already onboarded
    if (creator.isOnboarded) {
      return res.status(400).json({ error: 'Onboarding already completed' });
    }

    // Validate minimum requirements
    if (!creator.name || creator.name.trim().length < 2) {
      return res.status(400).json({ error: 'Please complete your profile first' });
    }

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        isOnboarded: true,
        onboardingStep: 4, // Final step
        onboardedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        isOnboarded: true,
        onboardingStep: true,
        onboardedAt: true,
        bio: true,
        socialInstagram: true,
        socialTiktok: true,
        socialYoutube: true,
        socialTwitter: true
      }
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully! Welcome to Zylike!',
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
};

/**
 * Reset onboarding (for testing/admin purposes)
 */
exports.resetOnboarding = async (req, res) => {
  try {
    const creatorId = req.creator.id;

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        isOnboarded: false,
        onboardingStep: 0,
        onboardedAt: null,
        bio: null,
        socialInstagram: null,
        socialTiktok: null,
        socialYoutube: null,
        socialTwitter: null
      },
      select: {
        id: true,
        isOnboarded: true,
        onboardingStep: true
      }
    });

    res.json({
      success: true,
      message: 'Onboarding reset successfully',
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Reset onboarding error:', error);
    res.status(500).json({ error: 'Failed to reset onboarding' });
  }
};

/**
 * Get onboarding analytics for admin
 */
exports.getOnboardingAnalytics = async (req, res) => {
  try {
    const [totalCreators, onboardedCreators, stepDistribution] = await Promise.all([
      prisma.creator.count(),
      prisma.creator.count({ where: { isOnboarded: true } }),
      prisma.creator.groupBy({
        by: ['onboardingStep'],
        _count: { id: true }
      })
    ]);

    const analytics = {
      totalCreators,
      onboardedCreators,
      onboardingRate: totalCreators > 0 ? (onboardedCreators / totalCreators * 100).toFixed(1) : 0,
      stepDistribution: stepDistribution.reduce((acc, item) => {
        acc[`step_${item.onboardingStep}`] = item._count.id;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get onboarding analytics error:', error);
    res.status(500).json({ error: 'Failed to get onboarding analytics' });
  }
};
