const mongoose = require('mongoose');

const OutletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an outlet name'],
    trim: true,
    maxlength: [100, 'Outlet name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please add an outlet code'],
    unique: true,
    trim: true,
    maxlength: [20, 'Outlet code cannot be more than 20 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot be longer than 20 characters']
  },
  email: {
    type: String,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  manager: {
    type: String,
    trim: true,
    maxlength: [100, 'Manager name cannot be more than 100 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  type: {
    type: String,
    enum: ['store', 'warehouse', 'office', 'online'],
    default: 'store'
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  // Xilnex integration fields
  xilnexOutletId: {
    type: String,
    sparse: true // Allow multiple null values but unique non-null values
  },
  xilnexSyncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed', 'disabled'],
    default: 'pending'
  },
  xilnexSyncDate: {
    type: Date
  },
  xilnexSyncError: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'outlets' // Explicitly set collection name
});

// Create indexes
OutletSchema.index({ code: 1 });
OutletSchema.index({ status: 1 });
OutletSchema.index({ type: 1 });

// Virtual for full address
OutletSchema.virtual('fullAddress').get(function() {
  const addressParts = [
    this.address?.street,
    this.address?.city,
    this.address?.state,
    this.address?.zipCode,
    this.address?.country
  ].filter(Boolean);
  
  return addressParts.length > 0 ? addressParts.join(', ') : '';
});

// Virtual for display name
OutletSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.code})`;
});

// Ensure virtual fields are serialized
OutletSchema.set('toJSON', { virtuals: true });
OutletSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Outlet', OutletSchema);