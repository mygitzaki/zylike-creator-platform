// backend/routes/transaction.routes.js
const express = require('express');
const router = express.Router();
const { getTransactions } = require('../controllers/transaction.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, getTransactions);

module.exports = router;
