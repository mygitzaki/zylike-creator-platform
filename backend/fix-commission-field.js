const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixCommissionField() {
  try {
    console.log('🔧 Fixing missing commissionRate field in Railway database...');
    
    // Check if commissionRate column exists
    console.log('🔍 Checking if commissionRate column exists...');
    const columnExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'Creator' AND column_name = 'commissionRate'
    `;
    
    if (columnExists[0].count > 0) {
      console.log('✅ commissionRate column already exists!');
      return;
    }
    
    console.log('❌ commissionRate column missing! Adding it now...');
    
    // Add the commissionRate column
    await prisma.$executeRaw`
      ALTER TABLE "Creator" 
      ADD COLUMN "commissionRate" INTEGER DEFAULT 70
    `;
    
    console.log('✅ commissionRate column added successfully!');
    
    // Add the commissionReason column if it doesn't exist
    const reasonExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'Creator' AND column_name = 'commissionReason'
    `;
    
    if (reasonExists[0].count === 0) {
      console.log('🔧 Adding commissionReason column...');
      await prisma.$executeRaw`
        ALTER TABLE "Creator" 
        ADD COLUMN "commissionReason" TEXT
      `;
      console.log('✅ commissionReason column added!');
    }
    
    // Add the commissionUpdatedAt column if it doesn't exist
    const updatedAtExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'Creator' AND column_name = 'commissionUpdatedAt'
    `;
    
    if (updatedAtExists[0].count === 0) {
      console.log('🔧 Adding commissionUpdatedAt column...');
      await prisma.$executeRaw`
        ALTER TABLE "Creator" 
        ADD COLUMN "commissionUpdatedAt" TIMESTAMP
      `;
      console.log('✅ commissionUpdatedAt column added!');
    }
    
    // Set default commission rate for all existing creators
    console.log('🔧 Setting default commission rate for existing creators...');
    await prisma.$executeRaw`
      UPDATE "Creator" 
      SET "commissionRate" = 70, 
          "commissionReason" = 'Default rate set by system',
          "commissionUpdatedAt" = NOW()
      WHERE "commissionRate" IS NULL
    `;
    
    console.log('✅ Default commission rates set for all creators!');
    
    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const result = await prisma.$queryRaw`
      SELECT "id", "name", "commissionRate", "commissionReason", "commissionUpdatedAt"
      FROM "Creator" 
      LIMIT 5
    `;
    
    console.log('📊 Sample creator data after fix:');
    result.forEach(creator => {
      console.log(`  - ${creator.name}: ${creator.commissionRate}% (${creator.commissionReason})`);
    });
    
    console.log('🎉 Database schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing commission field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCommissionField();
