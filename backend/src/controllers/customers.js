const { validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const asyncHandler = require('../middleware/asyncHandler');
const xilnexService = require('../services/xilnexService');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  let query = {};

  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by outlet if provided
  if (req.query.outlet) {
    query.outlet = req.query.outlet;
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

  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);

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
    count: customers.length,
    pagination,
    meta: {
      total,
      page,
      pages: Math.ceil(total / limit)
    },
    data: customers
  });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  // First, try to sync with Xilnex BEFORE creating customer in MongoDB
  try {
    // Create a temporary customer object for Xilnex sync (without saving to DB)
    const tempCustomer = {
      ...req.body,
      fullName: `${req.body.firstName} ${req.body.lastName}`,
      _id: 'temp-id-for-xilnex' // Temporary ID for Xilnex
    };
    
    const xilnexResult = await xilnexService.syncContact(tempCustomer);
    
    // Check if Xilnex sync was successful
    if (!xilnexResult.success && !xilnexResult.skipped) {
      // Xilnex sync failed - do not save customer to MongoDB
      return res.status(400).json({
        success: false,
        message: 'Failed to sync with Xilnex. Customer not created.',
        error: xilnexResult.error || 'Xilnex sync failed',
        xilnexError: xilnexResult
      });
    }
    
    // Xilnex sync succeeded or was skipped - now create customer in MongoDB
    console.log('✅ Xilnex sync successful/skipped, creating customer in MongoDB...');
    
    const customerData = { ...req.body };
    
    // Add Xilnex data if sync was successful
    if (xilnexResult.success && xilnexResult.xilnexClientId) {
      customerData.xilnexClientId = xilnexResult.xilnexClientId;
      customerData.xilnexSyncStatus = 'synced';
      customerData.xilnexSyncDate = new Date();
    } else if (xilnexResult.skipped) {
      customerData.xilnexSyncStatus = 'disabled';
    }
    
    const customer = await Customer.create(customerData);
    
    console.log('✅ Customer successfully created in MongoDB with ID:', customer._id);
    
    res.status(201).json({
      success: true,
      data: customer,
      xilnexSync: xilnexResult
    });
    
  } catch (error) {
    // If it's a Xilnex-related error, don't save to MongoDB
    res.status(500).json({
      success: false,
      message: 'Failed to create customer due to sync error',
      error: error.message
    });
  }
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  // Get the current customer
  const currentCustomer = await Customer.findById(req.params.id);
  if (!currentCustomer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  await Customer.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
    message: 'Customer deleted successfully'
  });
});

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};