const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 🚀 NEW SIMPLE CREATOR SYSTEM - Clean and Error-Free

/**
 * Simple creator signup - no complex validation
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, bio, socialMediaLinks, groupLinks } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }
    
    // Check if email exists
    const existing = await prisma.creator.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create creator with simple data
    const creator = await prisma.creator.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'USER',
        applicationStatus: 'PENDING',
        isActive: false,
        walletAddress: '0x0000000000000000000000000000000000000000',
        bio: bio ? bio.trim() : null,
        socialMediaLinks: socialMediaLinks || null,
        groupLinks: groupLinks || null
      }
    });
    
    console.log('✅ Creator signed up:', creator.email);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Admin will review and approve your account.',
      creatorId: creator.id,
      status: 'PENDING'
    });
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      error: 'Signup failed. Please try again.' 
    });
  }
};

/**
 * Simple creator login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find creator
    const creator = await prisma.creator.findUnique({ where: { email } });
    if (!creator) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, creator.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: creator.id, email: creator.email, name: creator.name, role: creator.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        role: creator.role,
        applicationStatus: creator.applicationStatus,
        isActive: creator.isActive
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * Get creator profile with application data
 */
exports.getProfile = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        socialMediaLinks: true,
        groupLinks: true,
        applicationStatus: true,
        isActive: true,
        commissionRate: true,
        createdAt: true
      }
    });
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    // Define application steps for frontend compatibility
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
    
    // Calculate current step based on application status
    let currentStep = 0;
    if (creator.applicationStatus === 'APPROVED') {
      currentStep = 7;
    } else if (creator.applicationStatus === 'PENDING') {
      currentStep = 6;
    } else if (creator.applicationStatus === 'REJECTED') {
      currentStep = 5;
    } else {
      currentStep = 1; // Default to profile step
    }
    
    // Return data in the format the frontend expects
    res.json({
      success: true,
      creator: {
        ...creator,
        totalSteps: steps.length,
        currentStepInfo: steps[currentStep] || steps[0],
        nextStep: currentStep < steps.length - 1 ? currentStep + 1 : null,
        currentStep: currentStep,
        requiredSocialCount: creator.socialMediaLinks ? Object.keys(creator.socialMediaLinks).filter(key => 
          creator.socialMediaLinks[key] && creator.socialMediaLinks[key].trim() !== ''
        ).length : 0,
        optionalPlatformsCount: creator.groupLinks ? Object.keys(creator.groupLinks).filter(key => 
          creator.groupLinks[key] && creator.groupLinks[key].trim() !== ''
        ).length : 0,
        isProfileComplete: Boolean(creator.name && creator.bio),
        hasRequiredSocial: creator.socialMediaLinks ? Object.keys(creator.socialMediaLinks).filter(key => 
          creator.socialMediaLinks[key] && creator.socialMediaLinks[key].trim() !== ''
        ).length >= 1 : false,
        canSubmit: Boolean(creator.name && creator.bio && creator.socialMediaLinks && 
          Object.keys(creator.socialMediaLinks).filter(key => 
            creator.socialMediaLinks[key] && creator.socialMediaLinks[key].trim() !== ''
          ).length >= 1)
      },
      steps
    });
    
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Update creator profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const creatorId = req.creator.id;
    const { bio, socialMediaLinks, groupLinks } = req.body;
    
    const updatedCreator = await prisma.creator.update({
      where: { id: creatorId },
      data: {
        bio: bio || null,
        socialMediaLinks: socialMediaLinks || null,
        groupLinks: groupLinks || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        socialMediaLinks: true,
        groupLinks: true,
        applicationStatus: true,
        isActive: true
      }
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      creator: updatedCreator
    });
    
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
