const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        size: { type: String, required: true },
        color: { type: String, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        customDesign: {
          hasCustomDesign: { type: Boolean, default: false },
          designUrl: { type: String },
          designPublicId: { type: String },
          designPlacement: {
            type: String,
            enum: ['front', 'back', 'left-sleeve', 'right-sleeve'],
            default: 'front'
          },
          designSize: {
            type: String,
            enum: ['small', 'medium', 'large'],
            default: 'medium'
          },
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'Nigeria' },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['paystack-card', 'paystack-transfer', 'paystack-ussd', 'paystack'],
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
      reference: { type: String },
      channel: { type: String },
      amount: { type: Number },
      fees: { type: Number },
    },
    paymentReference: {
      type: String,
      unique: true,
      sparse: true, 
    },
    paymentReminderSent: {
    type: Boolean,
    default: false,
   },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    trackingNumber: {
      type: String,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    deliveryConfirmedByCustomer: {
      type: Boolean,
      default: false,
    },
    customerDeliveryConfirmedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
    promoCode: {
      type: String,
    },
    discount: {
      type: Number,
      default: 0.0,
    },
    // Additional fields for better order management
    estimatedDeliveryDate: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'processing', 'completed', 'rejected'],
      default: 'none',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ isPaid: 1 });


// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Calculate the total amount before saving
orderSchema.pre('save', function(next) {
  // Calculate total if it's not already set or if relevant fields are modified
  if (!this.totalPrice || this.isModified('orderItems') || this.isModified('shippingPrice') || this.isModified('taxPrice') || this.isModified('discount')) {
    this.totalPrice = (
      this.itemsPrice + 
      this.taxPrice + 
      this.shippingPrice - 
      this.discount
    );
  }
  next();
});

// Virtual for order age in days
orderSchema.virtual('orderAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for order status color (for UI)
orderSchema.virtual('statusColor').get(function() {
  const statusColors = {
    'Pending': 'warning',
    'Processing': 'info',
    'Shipped': 'primary',
    'Delivered': 'success',
    'Cancelled': 'error'
  };
  return statusColors[this.status] || 'default';
});

// Static method to find orders by user with pagination
orderSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 10, status, isPaid } = options;
  const skip = (page - 1) * limit;
  
  const query = { user: userId };
  if (status) query.status = status;
  if (isPaid !== undefined) query.isPaid = isPaid;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'name email');
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        paidOrders: {
          $sum: { $cond: ['$isPaid', 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: ['$isDelivered', 1, 0] }
        },
        averageOrderValue: { $avg: '$totalPrice' }
      }
    }
  ]);
};

// Instance method to mark as paid
orderSchema.methods.markAsPaid = function(paymentResult) {
  this.isPaid = true;
  this.paidAt = new Date();
  this.paymentResult = paymentResult;
  this.paymentReference = paymentResult.reference;
  
  // Auto-update status if still pending
  if (this.status === 'Pending') {
    this.status = 'Processing';
  }
  
  return this.save();
};

// Instance method to update status with validation
orderSchema.methods.updateStatus = function(newStatus, options = {}) {
  const validTransitions = {
    'Pending': ['Processing', 'Cancelled'],
    'Processing': ['Shipped', 'Cancelled'],
    'Shipped': ['Delivered'],
    'Delivered': [],
    'Cancelled': []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'Delivered') {
    this.isDelivered = true;
    this.deliveredAt = new Date();
  }
  
  if (newStatus === 'Cancelled') {
    this.cancellationReason = options.reason || '';
  }
  
  if (options.trackingNumber) {
    this.trackingNumber = options.trackingNumber;
  }
  
  if (options.notes) {
    this.notes = options.notes;
  }
  
  return this.save();
};

// Instance method to calculate refund amount
orderSchema.methods.calculateRefundAmount = function() {
  if (!this.isPaid) return 0;
  
  // Simple refund logic - can be enhanced based on business rules
  if (this.status === 'Pending' || this.status === 'Processing') {
    return this.totalPrice; // Full refund
  } else if (this.status === 'Shipped') {
    return this.totalPrice - this.shippingPrice; // Refund minus shipping
  }
  
  return 0; // No refund for delivered orders
};

// Set virtuals to be included in JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;