import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICustomOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  baseProduct: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  customDesign: {
    designUrl: string;
    designPublicId: string;
    placement: string;
    size: string;
    printMethod?: string;
    colors?: string[];
    dimensions?: {
      width?: number;
      height?: number;
      unit?: string;
    };
  };
  productDetails: {
    size: string;
    color: {
      name: string;
      colorCode: string;
    };
    material?: string;
  };
  quantity: number;
  pricing: {
    basePrice: number;
    customizationPrice: number;
    rushOrderFee: number;
    subtotal: number;
    tax: number;
    totalPrice: number;
  };
  specialInstructions?: string;
  contactPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  status: string;
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    notes?: string;
    updatedBy?: mongoose.Types.ObjectId;
  }>;
  timeline: {
    orderReceived: Date;
    designApproved?: Date;
    productionStarted?: Date;
    qualityCheckCompleted?: Date;
    shipped?: Date;
    delivered?: Date;
    estimatedCompletion?: Date;
    actualCompletion?: Date;
  };
  estimatedCompletionDays: number;
  isRushOrder: boolean;
  rushOrderDays?: number;
  designFeedback: {
    approved: boolean;
    revisionNotes?: string;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
  };
  adminNotes?: string;
  customerNotes?: string;
  shippingInfo?: any;
  payment?: any;
  attachments: any[];
  isActive: boolean;
  orderAge: number;
  daysUntilCompletion: number | null;
  progressPercentage: number;
  updateStatus(newStatus: string, notes?: string, updatedBy?: mongoose.Types.ObjectId): Promise<ICustomOrder>;
  calculateEstimatedCompletion(): Date;
}

const customOrderSchema = new Schema<ICustomOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    baseProduct: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    customDesign: {
      designUrl: {
        type: String,
        required: true,
      },
      designPublicId: {
        type: String,
        required: true,
      },
      placement: {
        type: String,
        enum: ['Front', 'Back', 'Left Chest', 'Right Chest', 'Left Sleeve', 'Right Sleeve'],
        required: true,
        default: 'Front',
      },
      size: {
        type: String,
        enum: ['Small', 'Medium', 'Large'],
        required: true,
        default: 'Medium',
      },
      printMethod: {
        type: String,
        enum: ['Screen Print', 'Digital Print', 'Vinyl', 'Embroidery', 'Heat Transfer'],
        default: 'Digital Print',
      },
      colors: [{ type: String }],
      dimensions: {
        width: Number,
        height: Number,
        unit: { type: String, default: 'inches' },
      },
    },
    productDetails: {
      size: {
        type: String,
        required: true,
        enum: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
      },
      color: {
        name: { type: String, required: true },
        colorCode: { type: String, required: true },
      },
      material: {
        type: String,
        default: 'Cotton',
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      customizationPrice: {
        type: Number,
        default: 0,
        min: 0,
      },
      rushOrderFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      tax: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    specialInstructions: {
      type: String,
      maxlength: [500, 'Special instructions cannot exceed 500 characters'],
    },
    contactPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
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
        'revision_needed',
      ],
      default: 'pending',
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    timeline: {
      orderReceived: { type: Date, default: Date.now },
      designApproved: Date,
      productionStarted: Date,
      qualityCheckCompleted: Date,
      shipped: Date,
      delivered: Date,
      estimatedCompletion: Date,
      actualCompletion: Date,
    },
    estimatedCompletionDays: {
      type: Number,
      default: 5,
      min: 1,
    },
    isRushOrder: {
      type: Boolean,
      default: false,
    },
    rushOrderDays: {
      type: Number,
      min: 1,
      max: 3,
    },
    designFeedback: {
      approved: { type: Boolean, default: false },
      revisionNotes: String,
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      approvedAt: Date,
    },
    adminNotes: {
      type: String,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
    customerNotes: {
      type: String,
      maxlength: [500, 'Customer notes cannot exceed 500 characters'],
    },
    shippingInfo: {
      type: Schema.Types.Mixed,
    },
    payment: {
      type: Schema.Types.Mixed,
    },
    attachments: [
      {
        type: Schema.Types.Mixed,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customOrderSchema.index({ user: 1, createdAt: -1 });
customOrderSchema.index({ status: 1, createdAt: -1 });
customOrderSchema.index({ 'timeline.estimatedCompletion': 1 });

// Pre-save hooks
customOrderSchema.pre<ICustomOrder>('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `CO-${timestamp}-${random}`;
  }
  next();
});

customOrderSchema.pre<ICustomOrder>('save', function (next) {
  if (
    this.isModified('quantity') ||
    this.isModified('pricing.basePrice') ||
    this.isModified('pricing.customizationPrice') ||
    this.isModified('pricing.rushOrderFee')
  ) {
    const subtotal =
      (this.pricing.basePrice + this.pricing.customizationPrice + this.pricing.rushOrderFee) *
      this.quantity;
    const tax = subtotal * 0.075;

    this.pricing.subtotal = subtotal;
    this.pricing.tax = tax;
    this.pricing.totalPrice = subtotal + tax;
  }
  next();
});

// Virtuals
customOrderSchema.virtual('orderAge').get(function (this: ICustomOrder) {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

customOrderSchema.virtual('daysUntilCompletion').get(function (this: ICustomOrder) {
  if (!this.timeline.estimatedCompletion) return null;

  const now = new Date();
  const diffTime = this.timeline.estimatedCompletion.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

customOrderSchema.virtual('progressPercentage').get(function (this: ICustomOrder) {
  const statusProgress: Record<string, number> = {
    pending: 10,
    design_review: 20,
    approved: 30,
    in_production: 60,
    quality_check: 80,
    shipped: 90,
    delivered: 100,
    cancelled: 0,
    revision_needed: 15,
  };

  return statusProgress[this.status] || 0;
});

// Methods
customOrderSchema.methods.updateStatus = function (
  newStatus: string,
  notes: string = '',
  updatedBy: mongoose.Types.ObjectId | null = null
) {
  this.status = newStatus;
  this.adminNotes = notes;

  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    notes,
    updatedBy: updatedBy || undefined,
  });

  return this.save();
};

customOrderSchema.methods.calculateEstimatedCompletion = function () {
  const baseProductionDays = this.isRushOrder ? this.rushOrderDays : this.estimatedCompletionDays;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + baseProductionDays);

  this.timeline.estimatedCompletion = estimatedDate;
  return estimatedDate;
};

customOrderSchema.set('toJSON', { virtuals: true });
customOrderSchema.set('toObject', { virtuals: true });

const CustomOrder: Model<ICustomOrder> =
  mongoose.models.CustomOrder || mongoose.model<ICustomOrder>('CustomOrder', customOrderSchema);

export default CustomOrder;
