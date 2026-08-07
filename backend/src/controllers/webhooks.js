const crypto = require('crypto');
const SaleTransaction = require('../models/SaleTransaction');
const Customer = require('../models/Customer');
const asyncHandler = require('../middleware/asyncHandler');

const LOG = '[XILNEX WEBHOOK]';

// Xilnex sends the raw secret as xilnex-webhook-signature (not HMAC of body)
const verifySignature = (signature) => {
  const secret = process.env.XILNEX_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(`${LOG} XILNEX_WEBHOOK_SECRET not set — skipping signature verification`);
    return true;
  }

  if (!signature) {
    console.warn(`${LOG} Signature header missing (xilnex-webhook-signature)`);
    return false;
  }

  console.log(`${LOG} Signature received : ${signature}`);
  console.log(`${LOG} Secret configured  : ${secret}`);

  try {
    const match = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(secret)
    );
    console.log(`${LOG} Signature match: ${match}`);
    return match;
  } catch {
    console.error(`${LOG} Signature comparison failed — length mismatch between received and configured secret`);
    return false;
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

// Map the real Xilnex envelope { EventName, Data: { sale } } to SaleTransaction schema
const mapPayload = (payload) => {
  const sale = payload.Data?.sale || payload.Data?.sales || payload;
  const client = sale.client || {};
  const firstPayment = (sale.collection || [])[0] || {};

  return {
    xilnexTransactionId: String(sale.id),
    xilnexReceiptNo: sale.salesOrderNo || sale.orderNo,
    outlet: sale.outlet,
    outletCode: sale.outletId,
    xilnexClientId: sale.clientId ? String(sale.clientId) : null,
    customerName: sale.clientName || client.name || client.recipientName,
    customerEmail: sale.customerEmail || client.clientEmail,
    customerPhone: sale.recipientContact || client.recipientContact || client.clientContactNo,
    transactionDate: sale.dateTime || payload.EventTime || new Date(),
    items: (sale.items || []).map((item) => ({
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discountAmount || 0,
      totalPrice: item.subtotal
    })),
    subtotal: sale.netAmount,
    discountTotal: sale.billDiscountAmount || sale.totalBillDiscountAmount || 0,
    taxTotal: sale.gstTaxAmount || 0,
    grandTotal: sale.grandTotal,
    currency: sale.currencyCode || 'MYR',
    paymentMethod: firstPayment.cardType || firstPayment.method,
    paymentStatus: 'completed',
    staffId: sale.cashier,
    staffName: sale.cashier
  };
};

// @desc    Health check for Xilnex webhook endpoint
// @route   GET /api/webhooks/xilnex/sale-completed
// @access  Public
const saleCompletedHealth = asyncHandler(async (req, res) => {
  const secret = process.env.XILNEX_WEBHOOK_SECRET;
  res.status(200).json({
    success: true,
    endpoint: 'POST /api/webhooks/xilnex/sale-completed',
    status: 'ready',
    signatureVerification: secret ? 'enabled' : 'disabled (XILNEX_WEBHOOK_SECRET not set)',
    timestamp: new Date().toISOString()
  });
});

// @desc    Receive Xilnex completed sale webhook
// @route   POST /api/webhooks/xilnex/sale-completed
// @access  Public (verified by HMAC signature)
const receiveSaleCompleted = asyncHandler(async (req, res) => {
  console.log(`${LOG} ── Incoming request ──────────────────────────`);
  console.log(`${LOG} Method : ${req.method}`);
  console.log(`${LOG} IP     : ${req.ip}`);
  console.log(`${LOG} Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`${LOG} Body   : ${JSON.stringify(req.body, null, 2)}`);

  const signature = req.headers['xilnex-webhook-signature'];

  if (!verifySignature(signature)) {
    console.error(`${LOG} ❌ Signature verification failed — returning 401`);
    return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
  }
  console.log(`${LOG} ✅ Signature OK`);

  const payload = req.body;

  // Xilnex may batch multiple transactions in one call
  const events = Array.isArray(payload) ? payload : [payload];
  console.log(`${LOG} Event count: ${events.length}`);
  const results = [];

  for (const [i, event] of events.entries()) {
    // Xilnex event envelope uses PascalCase: EventName
    const eventType = event.EventName || event.event || event.type || event.eventType;
    console.log(`${LOG} [${i}] eventType: ${eventType ?? '(none)'}`);

    // Match Xilnex.Sales.Complete and Xilnex.Sales.CompleteV2 etc.
    const isSaleEvent =
      !eventType ||
      /^Xilnex\.Sales\.Complete/i.test(eventType);

    if (!isSaleEvent) {
      console.warn(`${LOG} [${i}] Skipped — unhandled event type: ${eventType}`);
      results.push({ skipped: true, reason: `Unhandled event type: ${eventType}` });
      continue;
    }

    const mapped = mapPayload(event);
    console.log(`${LOG} [${i}] Mapped transactionId: ${mapped.xilnexTransactionId ?? '(missing)'}`);
    console.log(`${LOG} [${i}] Mapped grandTotal   : ${mapped.grandTotal}`);
    console.log(`${LOG} [${i}] Mapped outlet        : ${mapped.outlet}`);
    console.log(`${LOG} [${i}] Mapped clientId      : ${mapped.xilnexClientId}`);

    if (!mapped.xilnexTransactionId) {
      console.warn(`${LOG} [${i}] Skipped — missing transaction ID. Raw event keys: ${Object.keys(event).join(', ')}`);
      results.push({ skipped: true, reason: 'Missing transaction ID' });
      continue;
    }

    // Resolve CRM customer
    const crmCustomer = await resolveCrmCustomer(
      mapped.xilnexClientId,
      mapped.customerEmail,
      mapped.customerPhone
    );
    console.log(`${LOG} [${i}] CRM customer match: ${crmCustomer ? crmCustomer._id : 'none'}`);

    try {
      const transaction = await SaleTransaction.findOneAndUpdate(
        { xilnexTransactionId: mapped.xilnexTransactionId },
        {
          ...mapped,
          eventName: eventType,
          crmCustomerId: crmCustomer?._id || null,
          rawPayload: event,
          processed: true,
          processedAt: new Date(),
          processingError: null
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`${LOG} [${i}] ✅ Upserted _id: ${transaction._id}`);
      results.push({ success: true, transactionId: transaction.xilnexTransactionId });
    } catch (err) {
      console.error(`${LOG} [${i}] ❌ MongoDB upsert error: ${err.message}`);
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
      ).catch((e) => console.error(`${LOG} [${i}] ❌ Error-state upsert also failed: ${e.message}`));

      results.push({ success: false, error: err.message, transactionId: mapped.xilnexTransactionId });
    }
  }

  console.log(`${LOG} ── Done. Results: ${JSON.stringify(results)} ──`);
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

module.exports = { receiveSaleCompleted, saleCompletedHealth, getTransactions, getTransaction };
