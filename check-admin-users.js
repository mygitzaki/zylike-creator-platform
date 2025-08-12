const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking admin users in database...\n');
    
    // Check all users with ADMIN role
    const adminUsers = await prisma.creator.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true
      }
    });
    
    console.log(`📊 Found ${adminUsers.length} admin users:\n`);
    
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log('');
    });
    
    // Also check for any users with admin-like emails
    const potentialAdmins = await prisma.creator.findMany({
      where: {
        OR: [
          { email: { contains: 'admin' } },
          { email: { contains: 'Admin' } },
          { name: { contains: 'admin' } },
          { name: { contains: 'Admin' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    
    if (potentialAdmins.length > 0) {
      console.log('🔍 Potential admin users (by email/name):\n');
      potentialAdmins.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    // Check total user count
    const totalUsers = await prisma.creator.count();
    const totalAdmins = await prisma.creator.count({ where: { role: 'ADMIN' } });
    const totalRegularUsers = await prisma.creator.count({ where: { role: 'USER' } });
    
    console.log(`\n📈 Database Summary:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Admins: ${totalAdmins}`);
    console.log(`   Regular users: ${totalRegularUsers}`);
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();
