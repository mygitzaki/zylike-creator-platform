const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restoreAdmin() {
  try {
    console.log('🔧 Creating admin user account...');
    
    // Create admin user directly
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const adminUser = await prisma.creator.create({
      data: {
        email: 'admin@zylike.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        walletAddress: '0x0000000000000000000000000000000000000000', // Placeholder
        commissionRate: 15 // Default 15%
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@zylike.com');
    console.log('🔑 Password: Admin123!');
    console.log('🆔 User ID:', adminUser.id);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAdmin();
