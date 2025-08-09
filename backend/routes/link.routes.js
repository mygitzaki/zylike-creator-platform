// backend/routes/link.routes.js

const express = require('express');
const router = express.Router();
const { createLink, getUserLinks, getCampaigns } = require('../controllers/link.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All routes here require authentication
router.post('/', verifyToken, createLink);       // Create a tracking link
router.get('/', verifyToken, getUserLinks);      // Get all links for the logged-in creator
router.get('/campaigns', verifyToken, getCampaigns); // Get available campaigns

module.exports = router;
