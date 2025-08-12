const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkDatabaseData() {
  try {
    console.log('🔍 Checking Railway database data directly...');
    
    // Check if commissionRate column exists
    console.log('🔍 Checking if commissionRate column exists...');
    const columnExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'Creator' AND column_name = 'commissionRate'
    `;
    
    console.log('📊 commissionRate column exists:', columnExists[0].count > 0);
    
    if (columnExists[0].count > 0) {
      // Check what's actually in the commissionRate field
      console.log('🔍 Checking commissionRate values in database...');
      const commissionData = await prisma.$queryRaw`
        SELECT "id", "name", "email", "commissionRate", "commissionReason", "commissionUpdatedAt"
        FROM "Creator" 
        ORDER BY "name"
        LIMIT 10
      `;
      
      console.log('📊 Commission rate data from database:');
      commissionData.forEach(creator => {
        console.log(`  - ${creator.name}: commissionRate = ${creator.commissionRate} (type: ${typeof creator.commissionRate})`);
      });
      
      // Check for NULL values
      const nullCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Creator" 
        WHERE "commissionRate" IS NULL
      `;
      
      console.log(`📊 Creators with NULL commissionRate: ${nullCount[0].count}`);
      
      // Check for undefined values
      const undefinedCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Creator" 
        WHERE "commissionRate" IS NOT NULL
      `;
      
      console.log(`📊 Creators with commissionRate values: ${undefinedCount[0].count}`);
      
    } else {
      console.log('❌ commissionRate column does not exist!');
    }
    
    // Check all Creator table columns
    console.log('🔍 All Creator table columns:');
    const allColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Creator'
      ORDER BY ordinal_position
    `;
    
    allColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseData();
