const crypto = require('crypto');
const SaleTransaction = require('../models/SaleTransaction');
const Customer = require('../models/Customer');
const asyncHandler = require('../middleware/asyncHandler');

// Xilnex sends header: xilnex-webhook-signature = <raw HMAC-SHA256 hex>
const verifySignature = (rawBody, signature) => {
  const secret = process.env.XILNEX_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if secret not configured (dev only)

  if (!signature) return false;

  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch {
    return false; // Buffers differ in length — invalid signature
  }
};

/**
 * Attempt to resolve Xilnex client to a CRM Customer by email or phone.
 */
const resolveCrmCustomer = async (xilnexClientId, email, phone) => {
  try {
    const query = [];
    if (email) query.push({ email: email.toLowerCase() });
    if (phone) query.push({ phone });
    if (xilnexClientId) query.push({ xilnexClientId });

    if (query.length === 0) return null;

    return await Customer.findOne({ $or: query }).select('_id').lean();
  } catch {
    return null;
  }
};

/**
 * Map a raw Xilnex webhook payload to our SaleTransaction schema.
 * Adjust field paths here to match whatever Xilnex actually sends.
 */
const mapPayload = (payload) => {
  const tx = payload.transaction || payload.sale || payload;

  return {
    xilnexTransactionId: tx.id || tx.transactionId || tx.transaction_id,
    xilnexReceiptNo: tx.receiptNo || tx.receipt_no || tx.receiptNumber,
    outlet: tx.outletName || tx.outlet_name || tx.outlet,
    outletCode: tx.outletCode || tx.outlet_code,
    xilnexClientId: tx.clientId || tx.client_id || tx.customerId,
    customerName: tx.clientName || tx.client_name || tx.customerName,
    customerEmail: tx.clientEmail || tx.client_email || tx.customerEmail,
    customerPhone: tx.clientMobile || tx.client_mobile || tx.customerPhone,
    transactionDate: tx.transactionDate || tx.transaction_date || tx.createdAt || new Date(),
    items: (tx.items || tx.saleItems || []).map((item) => ({
      itemCode: item.itemCode || item.item_code || item.code,
      itemName: item.itemName || item.item_name || item.name,
      quantity: item.quantity || item.qty,
      unitPrice: item.unitPrice || item.unit_price || item.price,
      discount: item.discount || 0,
      totalPrice: item.totalPrice || item.total_price || item.total
    })),
    subtotal: tx.subtotal || tx.subTotal || tx.sub_total,
    discountTotal: tx.discountTotal || tx.discount_total || tx.discount || 0,
    taxTotal: tx.taxTotal || tx.tax_total || tx.tax || 0,
    grandTotal: tx.grandTotal || tx.grand_total || tx.total || tx.amount,
    currency: tx.currency || 'MYR',
    paymentMethod: tx.paymentMethod || tx.payment_method || tx.paymentType,
    paymentStatus: 'completed',
    staffId: tx.staffId || tx.staff_id || tx.cashierId,
    staffName: tx.staffName || tx.staff_name || tx.cashierName
  };
};

// @desc    Receive Xilnex completed sale webhook
// @route   POST /api/webhooks/xilnex/sale-completed
// @access  Public (verified by HMAC signature)
const receiveSaleCompleted = asyncHandler(async (req, res) => {
  const signature = req.headers['xilnex-webhook-signature'];

  if (!verifySignature(req.rawBody, signature)) {
    return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
  }

  const payload = req.body;

  // Xilnex may batch multiple transactions in one call
  const events = Array.isArray(payload) ? payload : [payload];
  const results = [];

  for (const event of events) {
    const eventType = event.event || event.type || event.eventType;

    // Match Xilnex Event Hub names: "Complete Sales", "Complete Sales v2"
    const isSaleEvent =
      !eventType ||
      /complete\s+sales/i.test(eventType);

    if (!isSaleEvent) {
      results.push({ skipped: true, reason: `Unhandled event type: ${eventType}` });
      continue;
    }

    const mapped = mapPayload(event);

    if (!mapped.xilnexTransactionId) {
      results.push({ skipped: true, reason: 'Missing transaction ID' });
      continue;
    }

    // Resolve CRM customer
    const crmCustomer = await resolveCrmCustomer(
      mapped.xilnexClientId,
      mapped.customerEmail,
      mapped.customerPhone
    );

    try {
      const transaction = await SaleTransaction.findOneAndUpdate(
        { xilnexTransactionId: mapped.xilnexTransactionId },
        {
          ...mapped,
          crmCustomerId: crmCustomer?._id || null,
          rawPayload: event,
          processed: true,
          processedAt: new Date(),
          processingError: null
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.push({ success: true, transactionId: transaction.xilnexTransactionId });
    } catch (err) {
      // Record the error but still acknowledge so Xilnex doesn't retry indefinitely
      await SaleTransaction.findOneAndUpdate(
        { xilnexTransactionId: mapped.xilnexTransactionId },
        {
          ...mapped,
          rawPayload: event,
          processed: false,
          processingError: err.message
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).catch(() => {});

      results.push({ success: false, error: err.message, transactionId: mapped.xilnexTransactionId });
    }
  }

  return res.status(200).json({ success: true, processed: results.length, results });
});

// @desc    List stored sale transactions
// @route   GET /api/webhooks/xilnex/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const {
    outlet,
    from,
    to,
    customerId,
    page = 1,
    limit = 50
  } = req.query;

  const filter = {};
  if (outlet) filter.outlet = outlet;
  if (customerId) filter.crmCustomerId = customerId;
  if (from || to) {
    filter.transactionDate = {};
    if (from) filter.transactionDate.$gte = new Date(from);
    if (to) filter.transactionDate.$lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [transactions, total] = await Promise.all([
    SaleTransaction.find(filter)
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('crmCustomerId', 'firstName lastName email')
      .lean(),
    SaleTransaction.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: transactions
  });
});

// @desc    Get a single sale transaction
// @route   GET /api/webhooks/xilnex/transactions/:id
// @access  Private
const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await SaleTransaction.findById(req.params.id)
    .populate('crmCustomerId', 'firstName lastName email phone')
    .lean();

  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  res.status(200).json({ success: true, data: transaction });
});

module.exports = { receiveSaleCompleted, getTransactions, getTransaction };
