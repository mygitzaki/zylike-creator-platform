const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.registerCreator = async (req, res) => {
  try {
    // Validate required fields
    const { name, email, password, walletAddress, bio, socialMediaLinks, groupLinks } = req.body;
    
    // Input validation with detailed error messages
    console.log('🔍 Validating input:', { name, email, password: password ? '***' : 'undefined' });
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      console.log('❌ Name validation failed:', { name, type: typeof name, length: name ? name.length : 0 });
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log('❌ Email validation failed:', { email, type: typeof email, hasAt: email ? email.includes('@') : false });
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    
    if (!password || typeof password !== 'string' || password.length < 6) {
      console.log('❌ Password validation failed:', { password: password ? '***' : 'undefined', type: typeof password, length: password ? password.length : 0 });
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existing = await prisma.creator.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build the data object with safe defaults
    const createData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'USER',
      applicationStatus: 'PENDING',
      isActive: false,
      walletAddress: '0x0000000000000000000000000000000000000000' // Default wallet
    };

    // Safely add optional fields with validation
    if (bio && typeof bio === 'string' && bio.trim().length > 0) {
      createData.bio = bio.trim();
    }
    
    if (socialMediaLinks && typeof socialMediaLinks === 'object' && !Array.isArray(socialMediaLinks)) {
      // Filter out empty values and ensure they're strings
      const cleanSocialLinks = {};
      Object.keys(socialMediaLinks).forEach(key => {
        const value = socialMediaLinks[key];
        if (value && typeof value === 'string' && value.trim() !== '') {
          cleanSocialLinks[key] = value.trim();
        }
      });
      if (Object.keys(cleanSocialLinks).length > 0) {
        createData.socialMediaLinks = cleanSocialLinks;
      }
    }
    
    if (groupLinks && typeof groupLinks === 'object' && !Array.isArray(groupLinks)) {
      // Filter out empty values and ensure they're strings
      const cleanGroupLinks = {};
      Object.keys(groupLinks).forEach(key => {
        const value = groupLinks[key];
        if (value && typeof value === 'string' && value.trim() !== '') {
          cleanGroupLinks[key] = value.trim();
        }
      });
      if (Object.keys(cleanGroupLinks).length > 0) {
        createData.groupLinks = cleanGroupLinks;
      }
    }

    const creator = await prisma.creator.create({
      data: createData,
    });

    console.log('✅ Creator application submitted:', creator.email);
    res.status(201).json({ 
      message: 'Application submitted successfully. Admin will review and approve your account.',
      creatorId: creator.id,
      status: 'PENDING',
      nextStep: 'Wait for admin approval to start creating affiliate links.'
    });
  } catch (err) {
    console.error('Signup failed:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      error: 'Signup failed', 
      details: err.message,
      type: err.name 
    });
  }
};

exports.loginCreator = async (req, res) => {
  try {
    const { email, password } = req.body;

    const creator = await prisma.creator.findUnique({ where: { email } });
    if (!creator) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, creator.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // ✅ include role in token payload
    const token = jwt.sign(
      {
        id: creator.id,
        email: creator.email,
        name: creator.name,
        role: creator.role, // ✅ include role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ token, creator });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// 🔐 Create admin account (one-time use for setup)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;

    // Simple protection - require a secret key
    if (secretKey !== 'admin-setup-2024') {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    // Check if admin already exists
    const existingAdmin = await prisma.creator.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin account already exists' });
    }

    // Check if email is already in use
    const existing = await prisma.creator.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.creator.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN', // 🔐 Set as admin
        walletAddress: '0x0000000000000000000000000000000000000000', // Placeholder wallet address
        commissionRate: 15 // Default admin commission rate
      },
    });

    res.status(201).json({ 
      message: 'Admin account created successfully', 
      adminId: admin.id,
      email: admin.email 
    });
  } catch (err) {
    console.error('Admin creation failed:', err);
    res.status(500).json({ error: 'Admin creation failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // Try to fetch full creator data from database
    try {
      const creator = await prisma.creator.findUnique({
        where: { id: req.creator.id },
        select: {
          id: true,
          impactSubId: true,
          name: true,
          email: true,
          walletAddress: true,
          commissionRate: true,
          isActive: true,
          role: true,
          createdAt: true
        }
      });

      if (creator) {
        res.json({ creator });
        return;
      }
    } catch (dbError) {
      console.error('Database connection error in getProfile:', dbError.message);
    }

    // Fallback: Return JWT data with default values when database is unavailable
    const fallbackCreator = {
      ...req.creator,
      impactSubId: null,
      walletAddress: 'Database Unavailable',
      commissionRate: 70,
      isActive: true, // Default to true since schema default is true
      createdAt: new Date().toISOString()
    };

    res.json({ 
      creator: fallbackCreator,
      warning: 'Database temporarily unavailable. Showing limited profile data from session.'
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ✅ Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const creator = await prisma.creator.findUnique({ where: { email } });
    if (!creator) {
      // For security, don't reveal if email exists
      return res.status(200).json({ 
        message: 'If an account with that email exists, you will receive password reset instructions.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // In a real app, you'd save this token to the database
    // For demo purposes, we'll just send a success message
    
    // TODO: Send email with reset link containing the token
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    console.log(`🔑 Password reset requested for ${email}`);
    console.log(`Reset token (for demo): ${resetToken}`);
    
    res.status(200).json({ 
      message: 'Password reset instructions have been sent to your email.',
      // For demo purposes only - remove in production
      demo: {
        resetToken,
        instructions: 'In a real app, this would be sent via email'
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// ✅ Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, email } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // In a real app, you'd verify the token from database
    // For demo purposes, we'll allow any non-empty token
    if (!token || token.length < 10) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Find user by email (in real app, find by token)
    let creator;
    if (email) {
      creator = await prisma.creator.findUnique({ where: { email } });
    }

    if (!creator) {
      return res.status(400).json({ error: 'Invalid reset token or user not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.creator.update({
      where: { id: creator.id },
      data: { password: hashedPassword }
    });

    // TODO: Invalidate the reset token in database

    console.log(`✅ Password reset successful for ${creator.email}`);

    res.status(200).json({ 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
