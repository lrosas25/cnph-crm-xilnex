const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
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
    default: 'lead'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'],
    default: 'website'
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
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Contact must be assigned to a user']
  },
  lastContactDate: {
    type: Date
  },
  nextFollowUpDate: {
    type: Date
  },
  dealValue: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Xilnex integration fields
  xilnexClientId: {
    type: String,
    sparse: true // Allow multiple documents with null values
  },
  xilnexSyncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed', 'not_synced'],
    default: 'not_synced'
  },
  xilnexSyncDate: {
    type: Date
  },
  xilnexSyncError: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound index for efficient searching
ContactSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  email: 'text', 
  company: 'text' 
});

// Index for performance
ContactSchema.index({ assignedTo: 1, status: 1 });
ContactSchema.index({ company: 1 });
ContactSchema.index({ email: 1 });
ContactSchema.index({ xilnexClientId: 1 });

// Virtual for full name
ContactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
ContactSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Contact', ContactSchema);