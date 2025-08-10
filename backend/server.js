const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// Route Imports
const authRoutes = require('./routes/auth.routes');
const linkRoutes = require('./routes/link.routes');
const transactionRoutes = require('./routes/transaction.routes');
const adminRoutes = require('./routes/admin.routes');
const trackingRoutes = require('./routes/tracking.routes');
const paymentRoutes = require('./routes/payment.routes');
const uploadRoutes = require('./routes/upload.routes');
const bonusRoutes = require('./routes/bonus.routes');
const payoutRoutes = require('./routes/payout.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const applicationRoutes = require('./routes/application.routes');
const oauthRoutes = require('./routes/oauth.routes');

const app = express();

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
    'https://zylike-creator-platform.vercel.app'  // Vercel production domain - FIXED
  ], 
  credentials: true                // allow cookies/auth headers
}));

// Middleware
app.use(express.json());

// Serve uploaded files (with basic security)
app.use('/uploads', express.static('uploads'));

// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);         // 🔐 Protected
app.use('/api/transactions', transactionRoutes); // 🔐 Protected
app.use('/api/admin', adminRoutes);        // 🔐 Protected + Admin Only
app.use('/api/tracking', trackingRoutes);  // 🖱️ Click tracking + Analytics
app.use('/api/payments', paymentRoutes);   // 💰 Payment & Payout Management
app.use('/api/upload', uploadRoutes);      // 📁 File Upload for Compliance Documents
app.use('/api/bonus', bonusRoutes);        // 🎁 Bonus Tracker & Management
app.use('/api/payouts', payoutRoutes);     // 🏦 Conservative Payout Engine (15th/30th)
app.use('/api/onboarding', onboardingRoutes); // 🎯 Smart Creator Onboarding Process
app.use('/api/application', applicationRoutes); // 📝 Comprehensive Creator Application System
app.use('/api/oauth', oauthRoutes);        // 🔗 OAuth Social Media Integration

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  console.log('📍 Health check requested');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), service: 'zylike-backend' });
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
      const { execSync } = require('child_process');
      console.log('🔄 Applying database migrations...');
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Database schema synced');
    } catch (migrationError) {
      console.log('⚠️ Migration warning:', migrationError.message);
      console.log('📋 Database might already be in sync, continuing...');
    }
    
    await prisma.$disconnect();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} - Admin fix v2`);
      console.log(`📍 Health check available at: http://0.0.0.0:${PORT}/health`);
      console.log(`🌐 External URL: https://zylike-creator-platform-production.up.railway.app`);
      console.log(`🔗 API Base: https://zylike-creator-platform-production.up.railway.app/api`);
      
      // Log all incoming requests for debugging
      app.use((req, res, next) => {
        console.log(`📥 ${req.method} ${req.path} from ${req.ip}`);
        next();
      });
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
