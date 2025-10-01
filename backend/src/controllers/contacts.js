const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const Customer = require('../models/Customer');
const asyncHandler = require('../middleware/asyncHandler');
const xilnexService = require('../services/xilnexService');

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private
const getContacts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  let query = {};

  // Users can only see their assigned contacts
  if (req.user && req.user.role === 'user') {
    query.assignedTo = req.user.id;
  }

  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { company: searchRegex }
    ];
  }

  const total = await Contact.countDocuments(query);

  const contacts = await Contact.find(query)
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: contacts.length,
    pagination,
    meta: {
      total,
      page,
      pages: Math.ceil(total / limit)
    },
    data: contacts
  });
});

// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Private
const getContact = asyncHandler(async (req, res, next) => {
  let query = { _id: req.params.id };

  // Users can only access their assigned contacts
  if (req.user && req.user.role === 'user') {
    query.assignedTo = req.user.id;
  }

  const contact = await Contact.findOne(query).populate('assignedTo', 'name email');

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  res.status(200).json({
    success: true,
    data: contact
  });
});

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Private
const createContact = asyncHandler(async (req, res, next) => {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 CREATE CONTACT ENDPOINT HIT');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('='.repeat(80) + '\n');
  
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Save customer to MongoDB customers collection
  console.log('💾 Saving customer to MongoDB customers collection...');

  try {
    // Create customer data object
    const customerData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone || '',
      company: req.body.company || '',
      position: req.body.position || '',
      status: req.body.status || 'customer',
      source: req.body.source || 'website',
      address: req.body.address || {},
      notes: req.body.notes || '',
      tags: req.body.tags || [],
      dealValue: req.body.dealValue || 0,
      customerType: req.body.customerType || 'individual',
      xilnexSyncStatus: 'pending', // Ready for future Xilnex sync
      registrationDate: new Date()
    };

    console.log('📝 Customer data to save:', JSON.stringify(customerData, null, 2));

    // Save to MongoDB
    const customer = await Customer.create(customerData);
    
    console.log('✅ Customer saved to MongoDB successfully!');
    console.log('📋 Customer ID:', customer._id);
    console.log('👤 Customer Name:', customer.fullName);
    console.log('📧 Customer Email:', customer.email);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Customer saved to MongoDB successfully',
      data: {
        customerId: customer._id,
        customer: customer,
        collection: 'customers',
        xilnexSyncStatus: 'pending'
      }
    });

  } catch (error) {
    console.error('❌ Error saving customer to MongoDB:', error.message);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists',
        error: 'Duplicate email address',
        field: 'email'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Error saving customer to database',
      error: error.message
    });
  }
});

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
const updateContact = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  let query = { _id: req.params.id };

  // Users can only update their assigned contacts
  if (req.user && req.user.role === 'user') {
    query.assignedTo = req.user.id;
  }

  // Get the current contact to check for status changes
  const currentContact = await Contact.findOne(query);
  if (!currentContact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  // Add user who's updating the contact
  if (req.user) {
    req.body.lastModifiedBy = req.user.id;
  }

  const contact = await Contact.findOneAndUpdate(
    query,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('assignedTo', 'name email');

  res.status(200).json({
    success: true,
    data: contact
  });
});

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
const deleteContact = asyncHandler(async (req, res, next) => {
  let query = { _id: req.params.id };

  // Users can only delete their assigned contacts
  if (req.user && req.user.role === 'user') {
    query.assignedTo = req.user.id;
  }

  const contact = await Contact.findOne(query);

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  await contact.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Contact deleted successfully',
    data: {}
  });
});

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
};