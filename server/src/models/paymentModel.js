const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'paystack',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'NGN',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'success', 'failed', 'cancelled', 'abandoned', 'refunded'],
      default: 'pending',
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true,
    },
    paymentGatewayResponse: {
      id: Number,
      domain: String,
      status: String,
      reference: String,
      amount: Number,
      message: String,
      gateway_response: String,
      paid_at: Date,
      created_at: Date,
      channel: {
        type: String,
        enum: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      },
      currency: String,
      ip_address: String,
      metadata: {
        order_id: String,
        user_id: String,
        order_type: String,
        order_number: String,
        custom_fields: [
          {
            display_name: String,
            variable_name: String,
            value: String,
          }
        ],
      },
      authorization: {
        authorization_code: String,
        bin: String,
        last4: String,
        exp_month: String,
        exp_year: String,
        channel: String,
        card_type: String,
        bank: String,
        country_code: String,
        brand: String,
        reusable: Boolean,
        signature: String,
        account_name: String,
      },
      customer: {
        id: Number,
        first_name: String,
        last_name: String,
        email: String,
        customer_code: String,
        phone: String,
        metadata: mongoose.Schema.Types.Mixed,
        risk_action: String,
        international_format_phone: String,
      },
      plan: mongoose.Schema.Types.Mixed,
      split: mongoose.Schema.Types.Mixed,
      order_id: String,
      paidAt: Date,
      createdAt: Date,
      requested_amount: Number,
      pos_transaction_data: mongoose.Schema.Types.Mixed,
      source: {
        type: String,
        source: String,
        entry_point: String,
        identifier: String,
      },
      fees_breakdown: {
        merchant_fee: Number,
        paystack_fee: Number,
        stamp_duty_fee: Number,
        total_fees: Number,
      },
      log: {
        start_time: Number,
        time_spent: Number,
        attempts: Number,
        errors: Number,
        success: Boolean,
        mobile: Boolean,
        input: [mongoose.Schema.Types.Mixed],
        history: [mongoose.Schema.Types.Mixed],
      },
    },
    paystackData: {
      type: mongoose.Schema.Types.Mixed,
    },
    failureReason: {
      type: String,
    },
    gatewayResponse: {
      type: String,
    },
    webhookVerified: {
      type: Boolean,
      default: false,
    },
    webhookEvents: [
      {
        event: String,
        data: mongoose.Schema.Types.Mixed,
        receivedAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
    },
    abandonedAt: {
      type: Date,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: {
      type: Date,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
    },
    splitPayment: {
      type: mongoose.Schema.Types.Mixed,
    },
    disputes: [
      {
        id: String,
        refund_amount: Number,
        currency: String,
        status: String,
        resolution: String,
        domain: String,
        due_at: Date,
        resolved_at: Date,
        evidence: mongoose.Schema.Types.Mixed,
        transaction: {
          id: Number,
          reference: String,
        },
        category: String,
        customer: mongoose.Schema.Types.Mixed,
        bin: String,
        last4: String,
        createdAt: Date,
        updatedAt: Date,
      }
    ],
    refunds: [
      {
        id: String,
        reference: String,
        amount: Number,
        currency: String,
        transaction_reference: String,
        transaction_date: Date,
        customer_note: String,
        merchant_note: String,
        deducted_amount: Number,
        status: String,
        refunded_by: String,
        expected_at: Date,
        refunded_at: Date,
        createdAt: Date,
        updatedAt: Date,
      }
    ],
    notes: {
      type: String,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'paymentGatewayResponse.channel': 1 });
paymentSchema.index({ customerEmail: 1 });
paymentSchema.index({ paidAt: 1 });
paymentSchema.index({ createdAt: 1 });

paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

paymentSchema.virtual('isSuccessful').get(function () {
  return this.status === 'success';
});

paymentSchema.virtual('amountInNaira').get(function () {
  return this.amount / 100;
});

paymentSchema.virtual('feesInNaira').get(function () {
  return this.paymentGatewayResponse?.fees_breakdown?.total_fees ? 
    this.paymentGatewayResponse.fees_breakdown.total_fees / 100 : 0;
});

paymentSchema.virtual('netAmount').get(function () {
  const fees = this.paymentGatewayResponse?.fees_breakdown?.total_fees || 0;
  return (this.amount - fees) / 100;
});

paymentSchema.virtual('paymentChannel').get(function () {
  return this.paymentGatewayResponse?.channel || 'unknown';
});

paymentSchema.statics.findByOrder = function (orderId) {
  return this.find({ order: orderId }).sort({ createdAt: -1 });
};

paymentSchema.statics.findSuccessfulPayment = function (orderId) {
  return this.findOne({ order: orderId, status: 'success' });
};

paymentSchema.statics.getAnalytics = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: endDate || new Date(),
        },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
      },
    },
  ]);
};

paymentSchema.statics.getChannelAnalytics = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: endDate || new Date(),
        },
        status: 'success',
      },
    },
    {
      $group: {
        _id: '$paymentGatewayResponse.channel',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

paymentSchema.statics.getRevenueAnalytics = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: endDate || new Date(),
        },
        status: 'success',
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgTransactionValue: { $avg: '$amount' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
    },
  ]);
};

paymentSchema.methods.markAsSuccessful = function (paystackResponse) {
  this.status = 'success';
  this.paidAt = new Date();
  
  try {
    this.paymentGatewayResponse = JSON.parse(JSON.stringify(paystackResponse));
    this.paystackData = JSON.parse(JSON.stringify(paystackResponse));
  } catch (error) {
    this.paymentGatewayResponse = paystackResponse;
    this.paystackData = paystackResponse;
  }
  
  this.webhookVerified = true;
  this.gatewayResponse = paystackResponse.gateway_response;
  return this.save();
};

paymentSchema.methods.markAsFailed = function (reason, gatewayResponse) {
  this.status = 'failed';
  this.failureReason = reason;
  this.gatewayResponse = gatewayResponse;
  return this.save();
};

paymentSchema.methods.markAsAbandoned = function () {
  this.status = 'abandoned';
  this.abandonedAt = new Date();
  return this.save();
};

paymentSchema.methods.addWebhookEvent = function (event, data) {
  this.webhookEvents.push({
    event,
    data,
    receivedAt: new Date(),
  });
  return this.save();
};

paymentSchema.methods.addDispute = function (disputeData) {
  this.disputes.push(disputeData);
  return this.save();
};

paymentSchema.methods.addRefund = function (refundData) {
  this.refunds.push(refundData);
  const totalRefunded = this.refunds.reduce((sum, refund) => {
    return refund.status === 'processed' ? sum + refund.amount : sum;
  }, 0);
  
  if (totalRefunded >= this.amount) {
    this.status = 'refunded';
  }
  
  return this.save();
};

paymentSchema.methods.incrementRetry = function () {
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  return this.save();
};

paymentSchema.methods.getCustomerPaymentHistory = function () {
  return this.constructor.find({ 
    customerEmail: this.customerEmail 
  }).sort({ createdAt: -1 });
};

paymentSchema.methods.isRetryable = function () {
  return ['failed', 'abandoned'].includes(this.status) && this.retryCount < 3;
};

paymentSchema.methods.getPaymentSummary = function () {
  return {
    id: this._id,
    reference: this.transactionReference,
    amount: this.amountInNaira,
    status: this.status,
    channel: this.paymentChannel,
    paidAt: this.paidAt,
    customer: {
      email: this.customerEmail,
      phone: this.customerPhone,
    },
    order: this.order,
    fees: this.feesInNaira,
    netAmount: this.netAmount,
  };
};

paymentSchema.pre('save', function (next) {
  if (this.paymentGatewayResponse?.customer?.email && !this.customerEmail) {
    this.customerEmail = this.paymentGatewayResponse.customer.email;
  }
  
  if (this.paymentGatewayResponse?.customer?.phone && !this.customerPhone) {
    this.customerPhone = this.paymentGatewayResponse.customer.phone;
  }
  
  if (this.paymentGatewayResponse && this.isModified('paymentGatewayResponse')) {
    try {
      this.paystackData = JSON.parse(JSON.stringify(this.paymentGatewayResponse));
    } catch (error) {
      this.paystackData = this.paymentGatewayResponse;
    }
  }
  
  next();
});

paymentSchema.pre('save', function (next) {
  if (this.amount <= 0) {
    next(new Error('Payment amount must be greater than 0'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Payment', paymentSchema);