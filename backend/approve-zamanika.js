const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function approveApplication() {
  try {
    const creator = await prisma.creator.findUnique({
      where: { email: 'zamanika@gmail.com' }
    });

    if (!creator) {
      console.log('❌ Creator with email zamanika@gmail.com not found');
      return;
    }

    console.log('✅ Found creator:', creator.name, creator.email);
    console.log('Current status:', creator.applicationStatus);

    const updatedCreator = await prisma.creator.update({
      where: { email: 'zamanika@gmail.com' },
      data: {
        applicationStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: 'admin-approval-script'
      }
    });

    console.log('🎉 Application approved successfully!');
    console.log('Updated status:', updatedCreator.applicationStatus);
    console.log('Approved at:', updatedCreator.approvedAt);

  } catch (error) {
    console.error('❌ Error approving application:', error);
  } finally {
    await prisma.$disconnect();
  }
}

approveApplication();
