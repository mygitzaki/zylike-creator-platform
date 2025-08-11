// backend/routes/link.routes.js

const express = require('express');
const router = express.Router();
const { createLink, getUserLinks, getCampaigns } = require('../controllers/link.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Handle preflight OPTIONS request for CORS
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://zylike-creator-platform.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// All routes here require authentication
router.post('/', verifyToken, createLink);       // Create a tracking link
router.get('/', verifyToken, getUserLinks);      // Get all links for the logged-in creator
router.get('/campaigns', verifyToken, getCampaigns); // Get available campaigns

module.exports = router;
