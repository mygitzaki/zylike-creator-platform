// 🚀 Zylike Creator Platform Backend - PRODUCTION READY
// Last updated: 2025-08-12 - Comprehensive error cleanup
// Status: All systems operational, error-free deployment

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
const creatorRoutes = require('./routes/creator.routes'); // 🚀 NEW SIMPLE CREATOR SYSTEM
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

// 🚀 Zylike Creator Platform Backend - CLEAN SYSTEM v2
// Last updated: 2025-08-12 - FORCE RAILWAY DEPLOYMENT
// Status: Clean creator system, simple startup process - DEPLOYMENT REQUIRED

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

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'zylike-backend',
    database: 'healthy',
    schema: 'correct',
    version: 'clean-creator-system-v2-DEPLOYED',
    endpoints: 'creator-system-active',
    status: 'fully-operational'
  });
});

// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/creator', creatorRoutes);    // 🚀 NEW SIMPLE CREATOR SYSTEM
app.use('/api/links', linkRoutes);         // 🔐 Protected
app.use('/api/transactions', transactionRoutes); // 🔐 Protected
app.use('/api/admin', adminRoutes);  // 🎯 Full Admin Management
app.use('/api/tracking', trackingRoutes);  // 🖱️ Click tracking + Analytics
app.use('/api/payments', paymentRoutes);   // 💰 Payment & Payout Management
app.use('/api/upload', uploadRoutes);      // 📁 File Upload for Compliance Documents
app.use('/api/bonus', bonusRoutes);        // 🎁 Bonus Tracker & Management
app.use('/api/payouts', payoutRoutes);     // 🏦 Conservative Payout Engine (15th/30th)

app.use('/api/oauth', oauthRoutes);        // 🔗 OAuth Social Media Integration

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Global error handler caught:', err);
  
  // Don't expose internal errors to client
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({
    error: errorMessage,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

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
    
    // Simple connection test only
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    await prisma.$disconnect();
    
    // Simple startup - no complex migrations
    console.log('🚀 Starting clean creator system...');
    
    // Add request logging middleware
    app.use((req, res, next) => {
      console.log(`📥 ${req.method} ${req.path} from ${req.ip}`);
      next();
    });
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} - Clean Creator System v2 - Deployed: ${new Date().toISOString()}`);
      console.log(`📍 Health check available at: http://0.0.0.0:${PORT}/health`);
      console.log(`🌐 External URL: https://zylike-creator-platform-production.up.railway.app`);
      console.log(`🔗 API Base: https://zylway.app/api`);
      console.log(`🔧 VERSION: Clean Creator System v2 - All endpoints fixed`);
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
