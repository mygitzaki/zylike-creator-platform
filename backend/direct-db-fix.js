const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function directDatabaseFix() {
  try {
    console.log('🔧 Directly fixing Railway database...');
    
    // First, let's see what tables exist
    console.log('🔍 Checking database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📊 Available tables:', tables.map(t => t.table_name));
    
    // Check if Creator table exists and its structure
    console.log('🔍 Checking Creator table structure...');
    const creatorColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Creator' 
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Creator table columns:');
    creatorColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if commissionRate exists
    const commissionRateExists = creatorColumns.find(col => col.column_name === 'commissionRate');
    
    if (!commissionRateExists) {
      console.log('❌ commissionRate column missing! Adding it now...');
      
      // Add the commissionRate column
      await prisma.$executeRaw`
        ALTER TABLE "Creator" 
        ADD COLUMN "commissionRate" INTEGER DEFAULT 70
      `;
      
      console.log('✅ commissionRate column added!');
      
      // Add other missing columns
      const reasonExists = creatorColumns.find(col => col.column_name === 'commissionReason');
      if (!reasonExists) {
        await prisma.$executeRaw`
          ALTER TABLE "Creator" 
          ADD COLUMN "commissionReason" TEXT
        `;
        console.log('✅ commissionReason column added!');
      }
      
      const updatedAtExists = creatorColumns.find(col => col.column_name === 'commissionUpdatedAt');
      if (!updatedAtExists) {
        await prisma.$executeRaw`
          ALTER TABLE "Creator" 
          ADD COLUMN "commissionUpdatedAt" TIMESTAMP
        `;
        console.log('✅ commissionUpdatedAt column added!');
      }
      
      // Set default values for all creators
      console.log('🔧 Setting default commission rates...');
      await prisma.$executeRaw`
        UPDATE "Creator" 
        SET "commissionRate" = 70, 
            "commissionReason" = 'Default rate set by system',
            "commissionUpdatedAt" = NOW()
      `;
      
      console.log('✅ Default commission rates set!');
      
    } else {
      console.log('✅ commissionRate column exists!');
    }
    
    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const result = await prisma.$queryRaw`
      SELECT "id", "name", "commissionRate", "commissionReason", "commissionUpdatedAt"
      FROM "Creator" 
      LIMIT 5
    `;
    
    console.log('📊 Sample creator data after fix:');
    result.forEach(creator => {
      console.log(`  - ${creator.name}: ${creator.commissionRate}% (${creator.commissionReason || 'No reason'})`);
    });
    
    console.log('🎉 Database fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

directDatabaseFix();
