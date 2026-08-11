const express = require('express');
const rateLimit = require('express-rate-limit');
const { receiveSaleCompleted, saleCompletedHealth, getTransactions, getTransaction, getHourlySalesReport } = require('../controllers/webhooks');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Dedicated rate limiter for the inbound webhook endpoint
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // Allow high-frequency POS traffic
  message: { error: 'Too many webhook requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Strip port from IP — X-Forwarded-For from IIS ARR includes port
  keyGenerator: (req) => (req.ip || '').split(':')[0] || 'unknown'
});

// Inbound webhook from Xilnex (no JWT auth – validated by HMAC signature instead)
router.get('/sale-completed', saleCompletedHealth);
router.post('/sale-completed', webhookLimiter, receiveSaleCompleted);

// Query endpoints (require CRM login)
router.get('/transactions', protect, getTransactions);
router.get('/transactions/:id', protect, getTransaction);
router.get('/report/hourly-sales', protect, getHourlySalesReport);

module.exports = router;
