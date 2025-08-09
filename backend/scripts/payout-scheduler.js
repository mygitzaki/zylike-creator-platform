#!/usr/bin/env node

/**
 * ZYLIKE PAYOUT SCHEDULER
 * Conservative Strategy: Runs on 15th and 30th of every month
 * 
 * Usage:
 * - For cron job: 0 9 15,30 * * /path/to/node /path/to/this/script.js
 * - For manual run: node scripts/payout-scheduler.js
 */

const { PrismaClient } = require('@prisma/client');
const payoutController = require('../controllers/payout.controller');

const prisma = new PrismaClient();

async function runPayoutScheduler() {
  const now = new Date();
  const day = now.getDate();
  
  console.log(`🏦 Zylike Payout Scheduler started at ${now.toISOString()}`);
  console.log(`📅 Current day: ${day}`);
  
  // Check if today is a payout day (15th or 30th)
  if (day !== 15 && day !== 30) {
    console.log(`⏭️ Not a payout day. Payouts run on 15th and 30th only.`);
    return;
  }
  
  try {
    console.log(`💰 Processing scheduled payouts for ${day === 15 ? '15th' : '30th'} of the month...`);
    
    const result = await payoutController.processScheduledPayouts();
    
    if (result.processed === 0) {
      console.log(`✅ No payouts processed - no creators meet payout criteria`);
    } else {
      console.log(`🎉 Successfully processed ${result.processed} payouts`);
      console.log(`💸 Total amount: $${result.totalAmount.toFixed(2)}`);
      
      // Log individual payouts
      result.payouts?.forEach((payout, index) => {
        console.log(`   ${index + 1}. ${payout.creator.name}: $${payout.totalAmount.toFixed(2)} (${payout.reason})`);
      });
    }
    
    // Log next payout date
    const nextPayoutDate = payoutController.getNextPayoutDate();
    console.log(`📅 Next scheduled payout: ${nextPayoutDate.toDateString()}`);
    
  } catch (error) {
    console.error(`❌ Payout processing failed:`, error);
    
    // In production, you might want to:
    // - Send alert emails to admins
    // - Log to monitoring service
    // - Create incident tickets
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the scheduler
runPayoutScheduler()
  .then(() => {
    console.log(`✨ Payout scheduler completed successfully`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`💥 Scheduler crashed:`, error);
    process.exit(1);
  });
