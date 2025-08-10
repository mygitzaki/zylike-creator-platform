const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.creator.findUnique({
      where: { email: 'admin@zylike.com' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('Email: admin@zylike.com');
      console.log('Password: admin123');
      return;
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
    console.log('Email: admin@zylike.com');
    console.log('Password: admin123');
    console.log('User ID:', admin.id);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
