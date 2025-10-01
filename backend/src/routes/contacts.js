const express = require('express');
const { body } = require('express-validator');
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
} = require('../controllers/contacts');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Temporarily disable authentication for testing
// router.use(protect);

// Validation rules
const contactValidation = [
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

router
  .route('/')
  .get(getContacts)
  .post(contactValidation, createContact);

router
  .route('/:id')
  .get(getContact)
  .put(contactValidation, updateContact)
  .delete(deleteContact);

module.exports = router;