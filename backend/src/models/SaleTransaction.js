const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  itemCode: { type: String },
  itemName: { type: String },
  quantity: { type: Number },
  unitPrice: { type: Number },
  discount: { type: Number, default: 0 },
  totalPrice: { type: Number }
}, { _id: false });

const SaleTransactionSchema = new mongoose.Schema({
  // Xilnex transaction identifiers
  xilnexTransactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  xilnexReceiptNo: {
    type: String,
    index: true
  },

  // Outlet info
  outlet: {
    type: String,
    index: true
  },
  outletCode: {
    type: String
  },

  // Customer info from Xilnex (may not match a CRM customer)
  xilnexClientId: {
    type: String,
    index: true
  },
  customerName: { type: String },
  customerEmail: { type: String },
  customerPhone: { type: String },

  // CRM customer link (resolved after webhook receipt)
  crmCustomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },

  // Transaction details
  transactionDate: {
    type: Date,
    required: true,
    index: true
  },
  items: [SaleItemSchema],
  subtotal: { type: Number },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number },
  currency: { type: String, default: 'MYR' },

  // Payment info
  paymentMethod: { type: String },
  paymentStatus: {
    type: String,
    enum: ['completed', 'refunded', 'voided', 'unknown'],
    default: 'completed'
  },

  // Staff/cashier
  staffId: { type: String },
  staffName: { type: String },

  // Raw payload stored for auditing / re-processing
  rawPayload: {
    type: mongoose.Schema.Types.Mixed
  },

  // Processing status
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  },
  processingError: {
    type: String
  }
}, {
  timestamps: true
});

SaleTransactionSchema.index({ transactionDate: -1 });
SaleTransactionSchema.index({ outlet: 1, transactionDate: -1 });

module.exports = mongoose.model('SaleTransaction', SaleTransactionSchema);
