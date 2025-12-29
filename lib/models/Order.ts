import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrderItem {
  name: string;
  qty: number;
  image: string;
  price: number;
  size: string;
  color: string;
  product: mongoose.Types.ObjectId;
  customDesign?: {
    hasCustomDesign: boolean;
    designUrl?: string;
    designPublicId?: string;
    designPlacement?: 'front' | 'back' | 'left-sleeve' | 'right-sleeve';
    designSize?: 'small' | 'medium' | 'large';
  };
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  orderItems: IOrderItem[];
  createdAt: Date;
  updatedAt: Date;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentResult?: {
    id?: string;
    status?: string;
    update_time?: string;
    email_address?: string;
    reference?: string;
    channel?: string;
    amount?: number;
    fees?: number;
  };
  paymentReference?: string;
  paymentReminderSent: boolean;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: Date;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingNumber?: string;
  isDelivered: boolean;
  deliveredAt?: Date;
  deliveryConfirmedByCustomer: boolean;
  customerDeliveryConfirmedAt?: Date;
  notes?: string;
  promoCode?: string;
  discount: number;
  estimatedDeliveryDate?: Date;
  cancellationReason?: string;
  refundStatus: 'none' | 'requested' | 'processing' | 'completed' | 'rejected';
  refundAmount: number;
  orderAge: number;
  statusColor: string;
  markAsPaid(paymentResult: any): Promise<IOrder>;
  updateStatus(newStatus: string, options?: any): Promise<IOrder>;
  calculateRefundAmount(): number;
}

const orderSchema = new Schema<IOrder>(
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
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        size: { type: String, required: true },
        color: { type: String, required: true },
        product: {
          type: Schema.Types.ObjectId,
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
            default: 'front',
          },
          designSize: {
            type: String,
            enum: ['small', 'medium', 'large'],
            default: 'medium',
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

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ isPaid: 1 });

// Pre-save hooks
orderSchema.pre<IOrder>('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

orderSchema.pre<IOrder>('save', function (next) {
  if (
    !this.totalPrice ||
    this.isModified('orderItems') ||
    this.isModified('shippingPrice') ||
    this.isModified('taxPrice') ||
    this.isModified('discount')
  ) {
    this.totalPrice = this.itemsPrice + this.taxPrice + this.shippingPrice - this.discount;
  }
  next();
});

// Virtuals
orderSchema.virtual('orderAge').get(function (this: IOrder) {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

orderSchema.virtual('statusColor').get(function (this: IOrder) {
  const statusColors: Record<string, string> = {
    Pending: 'warning',
    Processing: 'info',
    Shipped: 'primary',
    Delivered: 'success',
    Cancelled: 'error',
  };
  return statusColors[this.status] || 'default';
});

// Methods
orderSchema.methods.markAsPaid = function (paymentResult: any) {
  this.isPaid = true;
  this.paidAt = new Date();
  this.paymentResult = paymentResult;
  this.paymentReference = paymentResult.reference;

  if (this.status === 'Pending') {
    this.status = 'Processing';
  }

  return this.save();
};

orderSchema.methods.updateStatus = function (newStatus: string, options: any = {}) {
  const validTransitions: Record<string, string[]> = {
    Pending: ['Processing', 'Cancelled'],
    Processing: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered'],
    Delivered: [],
    Cancelled: [],
  };

  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus as any;

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

orderSchema.methods.calculateRefundAmount = function () {
  if (!this.isPaid) return 0;

  if (this.status === 'Pending' || this.status === 'Processing') {
    return this.totalPrice;
  } else if (this.status === 'Shipped') {
    return this.totalPrice - this.shippingPrice;
  }

  return 0;
};

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order;
