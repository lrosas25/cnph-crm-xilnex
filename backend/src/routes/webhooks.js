const express = require('express');
const rateLimit = require('express-rate-limit');
const { receiveSaleCompleted, getTransactions, getTransaction } = require('../controllers/webhooks');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Dedicated rate limiter for the inbound webhook endpoint
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // Allow high-frequency POS traffic
  message: { error: 'Too many webhook requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Inbound webhook from Xilnex (no JWT auth – validated by HMAC signature instead)
router.post('/sale-completed', webhookLimiter, receiveSaleCompleted);

// Query endpoints (require CRM login)
router.get('/transactions', protect, getTransactions);
router.get('/transactions/:id', protect, getTransaction);

module.exports = router;
