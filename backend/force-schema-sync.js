const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function forceSchemaSync() {
  try {
    console.log('🚀 Force syncing Railway database schema...');
    
    // Force push the schema to Railway
    const { execSync } = require('child_process');
    
    console.log('📊 Pushing schema to Railway...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    console.log('✅ Schema pushed successfully!');
    
    // Verify the commissionRate field exists
    console.log('🔍 Verifying commissionRate field...');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Creator' AND column_name = 'commissionRate'
    `;
    
    if (result.length > 0) {
      console.log('✅ commissionRate field found:', result[0]);
    } else {
      console.log('❌ commissionRate field NOT found!');
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
    console.error('❌ Error forcing schema sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceSchemaSync();
