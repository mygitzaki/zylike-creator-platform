const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// One-time setup endpoint to create admin user
router.post('/create-admin', async (req, res) => {
  try {
    console.log('🔐 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.creator.findUnique({
      where: { email: 'admin@zylike.com' }
    });
    
    if (existingAdmin) {
      return res.json({ 
        success: true, 
        message: 'Admin user already exists!',
        email: 'admin@zylike.com'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const admin = await prisma.creator.create({
      data: {
        name: 'Admin User',
        email: 'admin@zylike.com',
        password: hashedPassword,
        role: 'ADMIN',
        isOnboarded: true,
        applicationStatus: 'APPROVED',
        bio: 'System Administrator',
        submittedAt: new Date()
      }
    });
    
    console.log('✅ Admin user created successfully!');
    
    res.json({
      success: true,
      message: 'Admin user created successfully!',
      email: 'admin@zylike.com',
      userId: admin.id
    });
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user',
      details: error.message
    });
  }
});

module.exports = router;
