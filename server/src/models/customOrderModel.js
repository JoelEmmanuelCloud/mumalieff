const mongoose = require('mongoose');

const customOrderSchema = mongoose.Schema(
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
    baseProduct: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    customDesign: {
      designUrl: { 
        type: String, 
        required: true 
      },
      designPublicId: { 
        type: String, 
        required: true 
      },
      placement: {
        type: String,
        enum: ['Front', 'Back', 'Left Chest', 'Right Chest', 'Left Sleeve', 'Right Sleeve'],
        required: true,
        default: 'Front'
      },
      size: {
        type: String,
        enum: ['Small', 'Medium', 'Large'],
        required: true,
        default: 'Medium'
      },
      printMethod: {
        type: String,
        enum: ['Screen Print', 'Digital Print', 'Vinyl', 'Embroidery', 'Heat Transfer'],
        default: 'Digital Print'
      },
      colors: [{
        type: String
      }],
      dimensions: {
        width: Number,
        height: Number,
        unit: { type: String, default: 'inches' }
      }
    },
    productDetails: {
      size: {
        type: String,
        required: true,
        enum: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
      },
      color: {
        name: { type: String, required: true },
        colorCode: { type: String, required: true }
      },
      material: {
        type: String,
        default: 'Cotton'
      }
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0
      },
      customizationPrice: {
        type: Number,
        default: 0,
        min: 0
      },
      rushOrderFee: {
        type: Number,
        default: 0,
        min: 0
      },
      subtotal: {
        type: Number,
        required: true,
        min: 0
      },
      tax: {
        type: Number,
        default: 0,
        min: 0
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0
      }
    },
    specialInstructions: {
      type: String,
      maxlength: [500, 'Special instructions cannot exceed 500 characters']
    },
    contactPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false }
    },
    status: {
      type: String,
      enum: [
        'pending',
        'design_review',
        'approved',
        'in_production',
        'quality_check',
        'shipped',
        'delivered',
        'cancelled',
        'revision_needed'
      ],
      default: 'pending'
    },
    statusHistory: [{
      status: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      notes: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    timeline: {
      orderReceived: { type: Date, default: Date.now },
      designApproved: Date,
      productionStarted: Date,
      qualityCheckCompleted: Date,
      shipped: Date,
      delivered: Date,
      estimatedCompletion: Date,
      actualCompletion: Date
    },
    estimatedCompletionDays: {
      type: Number,
      default: 5,
      min: 1
    },
    isRushOrder: {
      type: Boolean,
      default: false
    },
    rushOrderDays: {
      type: Number,
      min: 1,
      max: 3
    },
    designFeedback: {
      approved: { type: Boolean, default: false },
      revisionNotes: String,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approvedAt: Date
    },
    adminNotes: {
      type: String,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    },
    customerNotes: {
      type: String,
      maxlength: [500, 'Customer notes cannot exceed 500 characters']
    },
    shippingInfo: {
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'Nigeria' }
      },
      method: {
        type: String,
        enum: ['standard', 'express', 'overnight'],
        default: 'standard'
      },
      trackingNumber: String,
      carrier: String,
      shippedDate: Date,
      estimatedDelivery: Date,
      actualDelivery: Date
    },
    payment: {
      method: String,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
      },
      transactionId: String,
      paidAt: Date,
      refundedAt: Date,
      refundAmount: Number
    },
    attachments: [{
      url: String,
      publicId: String,
      type: {
        type: String,
        enum: ['design_reference', 'revision', 'approval', 'final_product']
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

customOrderSchema.index({ user: 1, createdAt: -1 });
customOrderSchema.index({ status: 1, createdAt: -1 });
customOrderSchema.index({ 'timeline.estimatedCompletion': 1 });

customOrderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `CO-${timestamp}-${random}`;
  }
  next();
});

customOrderSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('pricing.basePrice') || this.isModified('pricing.customizationPrice') || this.isModified('pricing.rushOrderFee')) {
    const subtotal = (this.pricing.basePrice + this.pricing.customizationPrice + this.pricing.rushOrderFee) * this.quantity;
    const tax = subtotal * 0.075;
    
    this.pricing.subtotal = subtotal;
    this.pricing.tax = tax;
    this.pricing.totalPrice = subtotal + tax;
  }
  next();
});

customOrderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      notes: this.adminNotes
    });
    
    switch (this.status) {
      case 'approved':
        this.timeline.designApproved = new Date();
        break;
      case 'in_production':
        this.timeline.productionStarted = new Date();
        break;
      case 'quality_check':
        this.timeline.qualityCheckCompleted = new Date();
        break;
      case 'shipped':
        this.timeline.shipped = new Date();
        break;
      case 'delivered':
        this.timeline.delivered = new Date();
        this.timeline.actualCompletion = new Date();
        break;
    }
  }
  next();
});

customOrderSchema.virtual('orderAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

customOrderSchema.virtual('daysUntilCompletion').get(function() {
  if (!this.timeline.estimatedCompletion) return null;
  
  const now = new Date();
  const diffTime = this.timeline.estimatedCompletion - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

customOrderSchema.virtual('progressPercentage').get(function() {
  const statusProgress = {
    'pending': 10,
    'design_review': 20,
    'approved': 30,
    'in_production': 60,
    'quality_check': 80,
    'shipped': 90,
    'delivered': 100,
    'cancelled': 0,
    'revision_needed': 15
  };
  
  return statusProgress[this.status] || 0;
});

customOrderSchema.methods.updateStatus = function(newStatus, notes = '', updatedBy = null) {
  this.status = newStatus;
  this.adminNotes = notes;
  
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    notes,
    updatedBy
  });
  
  return this.save();
};

customOrderSchema.methods.calculateEstimatedCompletion = function() {
  const baseProductionDays = this.isRushOrder ? this.rushOrderDays : this.estimatedCompletionDays;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + baseProductionDays);
  
  this.timeline.estimatedCompletion = estimatedDate;
  return estimatedDate;
};

customOrderSchema.statics.findByStatus = function(status, options = {}) {
  return this.find({ status, isActive: true })
    .populate('user', 'name email phone')
    .populate('baseProduct', 'name price category')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

customOrderSchema.statics.findOverdueOrders = function() {
  const today = new Date();
  return this.find({
    'timeline.estimatedCompletion': { $lt: today },
    status: { $nin: ['delivered', 'cancelled'] },
    isActive: true
  })
  .populate('user', 'name email phone')
  .populate('baseProduct', 'name')
  .sort({ 'timeline.estimatedCompletion': 1 });
};

customOrderSchema.statics.findOrdersRequiringAttention = function() {
  return this.find({
    status: { $in: ['pending', 'design_review', 'revision_needed'] },
    isActive: true
  })
  .populate('user', 'name email')
  .populate('baseProduct', 'name')
  .sort({ createdAt: 1 });
};

customOrderSchema.set('toJSON', { virtuals: true });
customOrderSchema.set('toObject', { virtuals: true });

const CustomOrder = mongoose.model('CustomOrder', customOrderSchema);

module.exports = CustomOrder;