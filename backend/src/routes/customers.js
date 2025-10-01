const express = require('express');
const { body } = require('express-validator');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customers');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Temporarily disable authentication for testing
// router.use(protect);

// Validation rules
const customerValidation = [
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('outlet').trim().isLength({ min: 1 }).withMessage('Outlet is required')
];

router
  .route('/')
  .get(getCustomers)
  .post(customerValidation, createCustomer);

router
  .route('/:id')
  .get(getCustomer)
  .put(customerValidation, updateCustomer)
  .delete(deleteCustomer);

module.exports = router;