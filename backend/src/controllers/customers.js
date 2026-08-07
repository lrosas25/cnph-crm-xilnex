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

  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📅 Birthdate received:', req.body.birthdate);

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
      console.log('❌ Xilnex sync failed, extracting specific error message...');
      
      // Extract the specific error message from Xilnex response
      let specificError = 'Xilnex sync failed';
      
      if (xilnexResult.details && xilnexResult.details.status) {
        specificError = xilnexResult.details.status;
      } else if (xilnexResult.details && xilnexResult.details.warning) {
        specificError = xilnexResult.details.warning;
      } else if (xilnexResult.error) {
        specificError = xilnexResult.error;
      }
      
      console.log('📝 Specific Xilnex error message:', specificError);
      
      return res.status(400).json({
        success: false,
        message: `${specificError}. Customer was not saved.`,
        error: specificError,
        xilnexError: xilnexResult
      });
    }
    
    // Xilnex sync succeeded or was skipped - now create customer in MongoDB
    console.log('✅ Xilnex sync successful/skipped, creating customer in MongoDB...');
    
    const customerData = { ...req.body };
    
    // Ensure birthdate is properly formatted as Date object
    if (customerData.birthdate) {
      customerData.birthdate = new Date(customerData.birthdate);
      console.log('📅 Formatted birthdate:', customerData.birthdate);
    }
    
    // Add Xilnex data if sync was successful
    if (xilnexResult.success && xilnexResult.xilnexClientId) {
      customerData.xilnexClientId = xilnexResult.xilnexClientId;
      customerData.xilnexSyncStatus = 'synced';
      customerData.xilnexSyncDate = new Date();
    } else if (xilnexResult.skipped) {
      customerData.xilnexSyncStatus = 'disabled';
    }
    
    console.log('💾 Final customer data before save:', JSON.stringify(customerData, null, 2));
    
    const customer = await Customer.create(customerData);
    
    console.log('✅ Customer successfully created in MongoDB with ID:', customer._id);
    console.log('📅 Saved birthdate:', customer.birthdate);
    
    res.status(201).json({
      success: true,
      data: customer,
      xilnexSync: xilnexResult
    });
    
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    
    // Check if this is a Xilnex-related error with specific details
    let errorMessage = error.message;
    
    if (error.response && error.response.data) {
      if (error.response.data.status) {
        errorMessage = error.response.data.status;
      } else if (error.response.data.warning) {
        errorMessage = error.response.data.warning;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorMessage
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

  const updateData = { ...req.body };
  
  // Ensure birthdate is properly formatted as Date object if provided
  if (updateData.birthdate) {
    updateData.birthdate = new Date(updateData.birthdate);
    console.log('📅 Updating birthdate to:', updateData.birthdate);
  }

  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    updateData,
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