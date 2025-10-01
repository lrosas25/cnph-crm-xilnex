const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot be longer than 20 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot be more than 100 characters']
  },
  status: {
    type: String,
    enum: ['lead', 'prospect', 'customer', 'inactive'],
    default: 'customer'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'],
    default: 'website'
  },
  outlet: {
    type: String,
    required: [true, 'Please select an outlet'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  dealValue: {
    type: Number,
    default: 0
  },
  // Customer-specific fields
  customerType: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastContactDate: {
    type: Date
  },
  // Xilnex integration fields
  xilnexClientId: {
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
  collection: 'customers' // Explicitly set collection name
});

// Virtual for full name
CustomerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to include virtuals in JSON output
CustomerSchema.set('toJSON', { virtuals: true });
CustomerSchema.set('toObject', { virtuals: true });

// Index for better performance
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ xilnexClientId: 1 });
CustomerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Customer', CustomerSchema);