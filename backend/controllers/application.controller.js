const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createSubaffiliate } = require('../services/impactService');

// Creator Application System - Comprehensive approval workflow

/**
 * Get creator's application status and progress
 */
exports.getApplicationStatus = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        name: true,
        email: true,
        applicationStatus: true,
        bio: true,
        socialMediaLinks: true,
        groupLinks: true,
        applicationNotes: true,
        rejectionReason: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Define application steps
    const steps = [
      { step: 0, title: "Welcome", description: "Welcome to Zylike Creator Application" },
      { step: 1, title: "Profile", description: "Tell us about yourself" },
      { step: 2, title: "Required Social", description: "Connect at least one social platform" },
      { step: 3, title: "Optional Links", description: "Add additional platforms (optional)" },
      { step: 4, title: "Review", description: "Review your application" },
      { step: 5, title: "Submit", description: "Submit for admin approval" },
      { step: 6, title: "Pending", description: "Awaiting admin review" },
      { step: 7, title: "Complete", description: "Application approved!" }
    ];

    // Count connected social platforms from JSON fields
    const socialMediaLinks = creator.socialMediaLinks || {};
    const groupLinks = creator.groupLinks || {};
    
    const requiredSocialPlatforms = Object.keys(socialMediaLinks).filter(key => 
      socialMediaLinks[key] && socialMediaLinks[key].trim() !== ''
    );
    
    const optionalPlatforms = Object.keys(groupLinks).filter(key => 
      groupLinks[key] && groupLinks[key].trim() !== ''
    );

    // Check application completeness
    const isProfileComplete = Boolean(creator.name && creator.bio);
    const hasRequiredSocial = requiredSocialPlatforms.length >= 1;
    const canSubmit = Boolean(isProfileComplete && hasRequiredSocial);
    
    // Calculate current step based on completion status
    let currentStep = 0;
    if (creator.applicationStatus === 'APPROVED') {
      currentStep = 7; // Complete
    } else if (creator.applicationStatus === 'PENDING') {
      currentStep = 6; // Pending admin review
    } else if (canSubmit) {
      currentStep = 5; // Ready to submit
    } else if (hasRequiredSocial) {
      currentStep = 4; // Has required social, can review
    } else if (isProfileComplete) {
      currentStep = 3; // Profile complete, needs social
    } else if (creator.name) {
      currentStep = 2; // Has name, needs bio
    } else {
      currentStep = 1; // Just started
    }

    res.json({
      success: true,
      creator: {
        ...creator,
        totalSteps: steps.length,
        currentStepInfo: steps[currentStep] || steps[0],
        nextStep: currentStep < steps.length - 1 ? currentStep + 1 : null,
        currentStep: currentStep,
        requiredSocialCount: requiredSocialPlatforms.length,
        optionalPlatformsCount: optionalPlatforms.length,
        isProfileComplete,
        hasRequiredSocial,
        canSubmit
      },
      steps
    });

  } catch (error) {
    console.error('Get application status error:', error);
    res.status(500).json({ error: 'Failed to get application status' });
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

    if (!bio || bio.trim().length < 20) {
      return res.status(400).json({ error: 'Bio must be at least 20 characters long' });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be less than 500 characters' });
    }

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        name: name.trim(),
        bio: bio.trim(),
        onboardingStep: Math.max(1, req.creator.onboardingStep || 0)
      },
      select: {
        id: true,
        name: true,
        bio: true,
        onboardingStep: true,
        applicationStatus: true
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
 * Update required social media platforms (Step 2)
 */
exports.updateRequiredSocial = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { instagram, tiktok, twitter, youtube, facebook } = req.body;

    // Helper function to validate and clean social handles
    const cleanHandle = (handle, platform) => {
      if (!handle || handle.trim() === '') return null;
      
      // Remove platform-specific prefixes and @ symbols
      let cleaned = handle.trim();
      
      switch(platform) {
        case 'instagram':
          cleaned = cleaned.replace(/^[@]|^https?:\/\/(www\.)?(instagram\.com\/)/i, '');
          break;
        case 'tiktok':
          cleaned = cleaned.replace(/^[@]|^https?:\/\/(www\.)?(tiktok\.com\/@)/i, '');
          break;
        case 'twitter':
          cleaned = cleaned.replace(/^[@]|^https?:\/\/(www\.)?(twitter\.com\/|x\.com\/)/i, '');
          break;
        case 'youtube':
          cleaned = cleaned.replace(/^[@]|^https?:\/\/(www\.)?(youtube\.com\/(c\/|channel\/|@|user\/))/i, '');
          break;
        case 'facebook':
          cleaned = cleaned.replace(/^https?:\/\/(www\.)?(facebook\.com\/)/i, '');
          break;
      }
      
      return cleaned;
    };

    const socialData = {
      socialInstagram: cleanHandle(instagram, 'instagram'),
      socialTiktok: cleanHandle(tiktok, 'tiktok'),
      socialTwitter: cleanHandle(twitter, 'twitter'),
      socialYoutube: cleanHandle(youtube, 'youtube'),
      socialFacebook: cleanHandle(facebook, 'facebook')
    };

    // Check if at least one social platform is provided
    const hasAnySocial = Object.values(socialData).some(value => value);
    
    if (!hasAnySocial) {
      return res.status(400).json({ 
        error: 'At least one social media platform is required' 
      });
    }

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        ...socialData,
        onboardingStep: Math.max(2, req.creator.onboardingStep || 0)
      },
      select: {
        id: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        socialYoutube: true,
        socialFacebook: true,
        onboardingStep: true,
        applicationStatus: true
      }
    });

    res.json({
      success: true,
      message: 'Required social platforms updated successfully',
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Update required social error:', error);
    res.status(500).json({ error: 'Failed to update social media platforms' });
  }
};

/**
 * Update optional platforms and links (Step 3)
 */
exports.updateOptionalPlatforms = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { 
      facebookGroups, 
      personalWebsite, 
      linkedinProfile, 
      pinterestProfile, 
      twitchChannel, 
      blogUrl, 
      shopUrl, 
      otherPlatforms 
    } = req.body;

    // Helper function to validate URLs
    const validateUrl = (url) => {
      if (!url || url.trim() === '') return null;
      
      const cleaned = url.trim();
      
      // Add https:// if no protocol specified
      if (cleaned && !cleaned.match(/^https?:\/\//)) {
        return `https://${cleaned}`;
      }
      
      return cleaned;
    };

    const optionalData = {
      facebookGroups: facebookGroups?.trim() || null,
      personalWebsite: validateUrl(personalWebsite),
      linkedinProfile: validateUrl(linkedinProfile),
      pinterestProfile: validateUrl(pinterestProfile),
      twitchChannel: twitchChannel?.trim() || null,
      blogUrl: validateUrl(blogUrl),
      shopUrl: validateUrl(shopUrl),
      otherPlatforms: otherPlatforms?.trim() || null
    };

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        ...optionalData,
        onboardingStep: Math.max(3, req.creator.onboardingStep || 0)
      },
      select: {
        id: true,
        facebookGroups: true,
        personalWebsite: true,
        linkedinProfile: true,
        pinterestProfile: true,
        twitchChannel: true,
        blogUrl: true,
        shopUrl: true,
        otherPlatforms: true,
        onboardingStep: true,
        applicationStatus: true
      }
    });

    res.json({
      success: true,
      message: 'Optional platforms updated successfully',
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Update optional platforms error:', error);
    res.status(500).json({ error: 'Failed to update optional platforms' });
  }
};

/**
 * Submit application for admin review
 */
exports.submitApplication = async (req, res) => {
  try {
    const creatorId = req.creator.id;

    // Get current creator data to validate submission
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        name: true,
        bio: true,
        applicationStatus: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        socialYoutube: true,
        socialFacebook: true
      }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Check if already submitted
    if (creator.applicationStatus !== 'PENDING') {
      return res.status(400).json({ 
        error: `Application already ${creator.applicationStatus.toLowerCase()}` 
      });
    }

    // Validate completion requirements
    if (!creator.name || creator.name.trim().length < 2) {
      return res.status(400).json({ error: 'Please complete your profile first' });
    }

    if (!creator.bio || creator.bio.trim().length < 20) {
      return res.status(400).json({ error: 'Please add a bio to your profile' });
    }

    // Check for at least one social platform
    const hasRequiredSocial = [
      creator.socialInstagram,
      creator.socialTiktok,
      creator.socialTwitter,
      creator.socialYoutube,
      creator.socialFacebook
    ].some(Boolean);

    if (!hasRequiredSocial) {
      return res.status(400).json({ 
        error: 'Please connect at least one social media platform' 
      });
    }

    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        applicationStatus: 'UNDER_REVIEW',
        onboardingStep: 6, // Pending step
        submittedAt: new Date(),
        appliedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        applicationStatus: true,
        onboardingStep: true,
        submittedAt: true,
        appliedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Application submitted successfully! We will review it and get back to you soon.',
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

/**
 * Get all pending applications (Admin only)
 */
exports.getPendingApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'UNDER_REVIEW' } = req.query;

    const applications = await prisma.creator.findMany({
      where: {
        applicationStatus: status
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        applicationStatus: true,
        appliedAt: true,
        submittedAt: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        socialYoutube: true,
        socialFacebook: true,
        facebookGroups: true,
        personalWebsite: true,
        linkedinProfile: true,
        pinterestProfile: true,
        twitchChannel: true,
        blogUrl: true,
        shopUrl: true,
        otherPlatforms: true,
        createdAt: true
      },
      orderBy: {
        appliedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const totalApplications = await prisma.creator.count({
      where: { applicationStatus: status }
    });

    res.json({
      success: true,
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalApplications,
        pages: Math.ceil(totalApplications / limit)
      }
    });

  } catch (error) {
    console.error('Get pending applications error:', error);
    res.status(500).json({ error: 'Failed to get pending applications' });
  }
};

/**
 * Approve or reject application (Admin only)
 */
exports.reviewApplication = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { action, reason, notes } = req.body; // action: 'approve' | 'reject' | 'request_changes'
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
        // Get creator details for better subid generation
        const creatorToApprove = await prisma.creator.findUnique({
          where: { id: creatorId },
          select: { name: true, email: true }
        });
        
        // Generate unique Impact IDs
        const baseName = (creatorToApprove?.name || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6);
        const timestamp = Date.now().toString(36);
        const randomSuffix = Math.random().toString(36).substring(2, 5);
        const impactId = `zylike_${baseName}_${timestamp}`; // Main affiliate ID
        const impactSubId = `${baseName}_${timestamp}_${randomSuffix}`; // Sub-affiliate ID
        
        try {
          // Create sub-affiliate in Impact.com
          const subaffiliateData = {
            SubId: impactSubId,
            Name: creatorToApprove?.name || 'Zylike Creator',
            Email: creatorToApprove?.email || 'creator@zylike.com'
          };
          
          console.log(`🔄 Assigning REAL Impact Sub ID for ${creatorToApprove?.email}:`, subaffiliateData);
          const impactResult = await createSubaffiliate(subaffiliateData);
          console.log(`✅ SUCCESS: Sub ID assigned (will be tracked when used in links):`, impactResult);
          console.log(`🎯 REAL IMPACT IDs assigned to ${creatorToApprove?.email}:`, { impactId, impactSubId });
          console.log(`📊 Sub-affiliate tracking: Performance will be reported via Impact.com "Performance by Sub ID" report`);
          
          updateData = {
            ...updateData,
            applicationStatus: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: adminId,
            onboardingStep: 7, // Complete
            isOnboarded: true,
            onboardedAt: new Date(),
            impactId: impactId, // Assign the main Impact ID
            impactSubId: impactSubId // Assign the sub-affiliate ID
          };
        } catch (impactError) {
          console.error('❌ FAILED to validate Sub ID assignment for', creatorToApprove?.email, ':', impactError.message);
          console.log(`⚠️ FALLBACK: Assigning Sub IDs anyway (may still work in tracking links):`, { impactId, impactSubId });
          // Still approve the creator but log the Impact error
          updateData = {
            ...updateData,
            applicationStatus: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: adminId,
            onboardingStep: 7, // Complete
            isOnboarded: true,
            onboardedAt: new Date(),
            impactSubId: impactSubId // Assign the generated ID even if Impact creation fails
          };
        }
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
          onboardingStep: 4 // Back to review step
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
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        reviewNotes: true,
        impactSubId: true
      }
    });

    res.json({
      success: true,
      message: `Application ${action}d successfully`,
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Review application error:', error);
    res.status(500).json({ error: 'Failed to review application' });
  }
};

/**
 * Submit complete application for admin review
 */
exports.submitApplication = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { name, bio, socialMedia, additionalPlatforms } = req.body;
    
    // Validate required fields
    if (!name || !bio) {
      return res.status(400).json({ error: 'Name and bio are required' });
    }
    
    if (bio.length < 20) {
      return res.status(400).json({ error: 'Bio must be at least 20 characters long' });
    }
    
    // Check if at least one social media platform is provided
    const socialFields = Object.values(socialMedia || {});
    const hasSocialMedia = socialFields.some(field => field && field.trim());
    
    if (!hasSocialMedia) {
      return res.status(400).json({ error: 'At least one social media account is required' });
    }
    
    // Update creator with complete application data
    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        name: name.trim(),
        bio: bio.trim(),
        
        // Required social platforms
        socialInstagram: socialMedia?.instagram?.trim() || null,
        socialTiktok: socialMedia?.tiktok?.trim() || null,
        socialTwitter: socialMedia?.twitter?.trim() || null,
        socialYoutube: socialMedia?.youtube?.trim() || null,
        socialFacebook: socialMedia?.facebook?.trim() || null,
        
        // Optional platforms
        facebookGroups: additionalPlatforms?.facebookGroups?.trim() || null,
        personalWebsite: additionalPlatforms?.personalWebsite?.trim() || null,
        linkedinProfile: additionalPlatforms?.linkedinProfile?.trim() || null,
        pinterestProfile: additionalPlatforms?.pinterestProfile?.trim() || null,
        twitchChannel: additionalPlatforms?.twitchChannel?.trim() || null,
        blogUrl: additionalPlatforms?.blogUrl?.trim() || null,
        shopUrl: additionalPlatforms?.shopUrl?.trim() || null,
        otherPlatforms: additionalPlatforms?.otherPlatforms?.trim() || null,
        
        // Update application status
        applicationStatus: 'UNDER_REVIEW',
        appliedAt: new Date(),
        submittedAt: new Date(),
        isOnboarded: true,
        onboardingStep: 6 // Completed application
      }
    });
    
    console.log(`✅ Application submitted for creator: ${updatedCreator.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Application submitted successfully! You will receive an email with our decision within 24-48 hours.',
      creator: {
        id: updatedCreator.id,
        name: updatedCreator.name,
        email: updatedCreator.email,
        applicationStatus: updatedCreator.applicationStatus,
        appliedAt: updatedCreator.appliedAt,
        onboardingStep: updatedCreator.onboardingStep
      }
    });
    
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

/**
 * Get pending applications for admin review
 */
exports.getPendingApplications = async (req, res) => {
  try {
    console.log('📋 Fetching pending applications...');
    
    const pendingApplications = await prisma.creator.findMany({
      where: {
        applicationStatus: { 
          in: ['PENDING', 'UNDER_REVIEW'] 
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        appliedAt: true,
        
        // Social media
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        socialYoutube: true,
        socialFacebook: true,
        facebookGroups: true,
        linkedinProfile: true,
        pinterestProfile: true,
        
        // Additional platforms
        blogUrl: true,
        shopUrl: true,
        otherPlatforms: true,
        
        // Application status
        onboardingStep: true,
        applicationStatus: true,
        isOnboarded: true,
        
        // Timestamps
        createdAt: true,
        submittedAt: true,
        
        // Other fields
        role: true,
        walletAddress: true,
        commissionRate: true,
        
        // Impact IDs
        impactId: true,
        impactSubId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ Found ${pendingApplications.length} pending applications`);
    
    res.status(200).json({
      success: true,
      applications: pendingApplications,
      count: pendingApplications.length
    });
  } catch (error) {
    console.error('❌ Fetch pending applications error:', error);
    res.status(500).json({ error: 'Failed to fetch pending applications', details: error.message });
  }
};
