// 🚨🚨🚨 RAILWAY FORCE RESTART REQUIRED 🚨🚨🚨
// This server needs to restart to apply database schema fixes
// Deployed: 2025-08-12T19:53:00.000Z
// 🚨🚨🚨 RAILWAY FORCE RESTART REQUIRED 🚨🚨🚨

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Railway-specific: Also try to load from Railway's environment
if (process.env.RAILWAY_ENVIRONMENT) {
  console.log('🚂 Railway environment detected');
}

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'IMPACT_ACCOUNT_SID', 'IMPACT_AUTH_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('🚨 Please set these in Railway environment variables');
  console.error('📋 Current environment variables:', Object.keys(process.env).filter(key => key.includes('IMPACT') || key.includes('DATABASE') || key.includes('JWT')));
  
  // Don't exit immediately on Railway - let it show the error in logs
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
} else {
  console.log('✅ All required environment variables are set');
}

// Route Imports
const authRoutes = require('./routes/auth.routes');
const linkRoutes = require('./routes/link.routes');
const transactionRoutes = require('./routes/transaction.routes');
const adminRoutes = require('./routes/admin.routes');
const adminSimpleRoutes = require('./routes/admin.simple.routes');
const trackingRoutes = require('./routes/tracking.routes');
const paymentRoutes = require('./routes/payment.routes');
const uploadRoutes = require('./routes/upload.routes');
const bonusRoutes = require('./routes/bonus.routes');
const payoutRoutes = require('./routes/payout.routes');

const oauthRoutes = require('./routes/oauth.routes');

const app = express();

// 🚀 Zylike Creator Platform Backend
// Database schema cleaned - ready for real Impact.com links
// Last updated: 2025-08-12 - Fixed link generation
// CRITICAL: Force Railway restart to apply --accept-data-loss flag
// 🚨 MASSIVE CHANGE TO FORCE RAILWAY RESTART - Database schema mismatch detected!
// Production database missing critical fields: applicationStatus, bio, socialMedia, etc.
// This change will force Railway to restart and apply the clean schema

// ✅ CORS: Allow frontend to send cookies/headers with credentials
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174', 
    'http://127.0.0.1:5175',
    'http://192.168.18.70:5173',  // Network IP from vite
    'https://zylike-creator-platform.vercel.app',  // Vercel production domain
    'https://zylike-creator-platform-r97v.vercel.app'  // Current Vercel production domain
  ], 
  credentials: true,               // allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Allow Authorization header
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json());

// Serve uploaded files (with basic security)
app.use('/uploads', express.static('uploads'));

// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);         // 🔐 Protected
app.use('/api/transactions', transactionRoutes); // 🔐 Protected
app.use('/api/admin', adminSimpleRoutes);  // 🎯 Simplified Admin Management
app.use('/api/tracking', trackingRoutes);  // 🖱️ Click tracking + Analytics
app.use('/api/payments', paymentRoutes);   // 💰 Payment & Payout Management
app.use('/api/upload', uploadRoutes);      // 📁 File Upload for Compliance Documents
app.use('/api/bonus', bonusRoutes);        // 🎁 Bonus Tracker & Management
app.use('/api/payouts', payoutRoutes);     // 🏦 Conservative Payout Engine (15th/30th)

app.use('/api/oauth', oauthRoutes);        // 🔗 OAuth Social Media Integration

// Health check endpoint for Railway
app.get('/health', async (req, res) => {
  console.log('📍 Health check requested');
  
  try {
    // Check if database schema is correct
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Try to access a field that should exist in the new schema
    const testQuery = await prisma.creator.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        commissionRate: true
      }
    });
    
    await prisma.$disconnect();
    
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(), 
      service: 'zylike-backend',
      database: 'healthy',
      schema: 'correct'
    });
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(), 
      service: 'zylike-backend',
      database: 'unhealthy',
      schema: 'mismatch',
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  console.log('🏠 Root endpoint requested');
  res.status(200).json({ message: 'Zylike Creator Platform API', status: 'running', timestamp: new Date().toISOString() });
});

// Railway specific health check
app.get('/api/health', (req, res) => {
  console.log('🔍 API health check requested');
  res.status(200).json({ status: 'healthy', service: 'zylike-api', timestamp: new Date().toISOString() });
});

// Start Server
const PORT = process.env.PORT || 5000;

// Setup database and start server
async function startServer() {
  try {
    console.log('🔍 Setting up database...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Apply any pending migrations (safe to run multiple times)
    try {
      console.log('🔄 Checking database schema...');
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Production environment detected - updating database schema...');
        const { execSync } = require('child_process');
        
        // Force database reset to clean schema
        try {
          console.log('🧹 Force cleaning database schema...');
          execSync('npx prisma db push --accept-data-loss --force-reset', { stdio: 'inherit' });
          console.log('✅ Production database schema updated - old columns removed');
        } catch (error) {
          console.log('⚠️ Force reset failed, trying normal push...');
          execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
          console.log('✅ Production database schema updated - old columns removed');
        }
      } else {
        console.log('✅ Development environment - schema check skipped');
      }
      
      // MANUAL DATABASE CLEANUP - Remove old columns directly
      if (process.env.NODE_ENV === 'production') {
        console.log('🧹 Manual database cleanup - removing old Impact.com columns...');
        try {
          // Try to drop old columns manually
          await prisma.$executeRaw`ALTER TABLE "Link" DROP COLUMN IF EXISTS "brandName"`;
          await prisma.$executeRaw`ALTER TABLE "Link" DROP COLUMN IF EXISTS "productName"`;
          await prisma.$executeRaw`ALTER TABLE "Link" DROP COLUMN IF EXISTS "isRealImpactLink"`;
          await prisma.$executeRaw`ALTER TABLE "Link" DROP COLUMN IF EXISTS "trackingUrl"`;
          await prisma.$executeRaw`ALTER TABLE "Link" DROP COLUMN IF EXISTS "impactTrackingData"`;
          console.log('✅ Old columns manually removed from database');
        } catch (cleanupError) {
          console.log('⚠️ Manual cleanup failed (columns may not exist):', cleanupError.message);
        }
      }
    } catch (migrationError) {
      console.log('⚠️ Migration warning:', migrationError.message);
      console.log('📋 Database might already be in sync, continuing...');
    }
    
    await prisma.$disconnect();
    
    // Add request logging middleware BEFORE starting server
    app.use((req, res, next) => {
      console.log(`📥 ${req.method} ${req.path} from ${req.ip}`);
      next();
    });
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} - SSN Fix v2 - Deployed: ${new Date().toISOString()}`);
      console.log(`📍 Health check available at: http://0.0.0.0:${PORT}/health`);
      console.log(`🌐 External URL: https://zylike-creator-platform-production.up.railway.app`);
      console.log(`🔗 API Base: https://zylike-creator-platform-production.up.railway.app/api`);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('📋 Full error:', error);
    process.exit(1);
  }
}

let serverInstance;

// Start the server
startServer().then(server => {
  serverInstance = server;
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Keep the process alive and handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('🛑 Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('🛑 Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
// FORCE RAILWAY RESTART - Tue Aug 12 12:48:43 PDT 2025
