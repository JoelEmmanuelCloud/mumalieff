import mongoose, { Document, Model, Schema} from 'mongoose';

export interface IPayment extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'abandoned' | 'refunded';
  transactionReference: string;
  paymentGatewayResponse?: any;
  paystackData?: any;
  failureReason?: string;
  gatewayResponse?: string;
  webhookVerified: boolean;
  webhookEvents: Array<{
    event: string;
    data: any;
    receivedAt: Date;
  }>;
  initiatedAt: Date;
  paidAt?: Date;
  abandonedAt?: Date;
  retryCount: number;
  lastRetryAt?: Date;
  customerEmail: string;
  customerPhone?: string;
  splitPayment?: any;
  disputes: any[];
  refunds: any[];
  notes?: string;
  tags: string[];
  isSuccessful: boolean;
  amountInNaira: number;
  feesInNaira: number;
  netAmount: number;
  paymentChannel: string;
  markAsSuccessful(paystackResponse: any): Promise<IPayment>;
  markAsFailed(reason: string, gatewayResponse?: string): Promise<IPayment>;
  markAsAbandoned(): Promise<IPayment>;
  addWebhookEvent(event: string, data: any): Promise<IPayment>;
  isRetryable(): boolean;
  getPaymentSummary(): any;
}

const paymentSchema = new Schema<IPayment>(
  {
    order: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    user: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.Mixed,
    },
    paystackData: {
      type: Schema.Types.Mixed,
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
        data: Schema.Types.Mixed,
        receivedAt: {
          type: Date,
          default: Date.now,
        },
      },
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
      type: Schema.Types.Mixed,
    },
    disputes: [
      {
        type: Schema.Types.Mixed,
      },
    ],
    refunds: [
      {
        type: Schema.Types.Mixed,
      },
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

// Indexes
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ customerEmail: 1 });
paymentSchema.index({ paidAt: 1 });
paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtuals
paymentSchema.virtual('isSuccessful').get(function (this: IPayment) {
  return this.status === 'success';
});

paymentSchema.virtual('amountInNaira').get(function (this: IPayment) {
  return this.amount / 100;
});

paymentSchema.virtual('feesInNaira').get(function (this: IPayment) {
  return this.paymentGatewayResponse?.fees_breakdown?.total_fees
    ? this.paymentGatewayResponse.fees_breakdown.total_fees / 100
    : 0;
});

paymentSchema.virtual('netAmount').get(function (this: IPayment) {
  const fees = this.paymentGatewayResponse?.fees_breakdown?.total_fees || 0;
  return (this.amount - fees) / 100;
});

paymentSchema.virtual('paymentChannel').get(function (this: IPayment) {
  return this.paymentGatewayResponse?.channel || 'unknown';
});

// Methods
paymentSchema.methods.markAsSuccessful = function (paystackResponse: any) {
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

paymentSchema.methods.markAsFailed = function (reason: string, gatewayResponse?: string) {
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

paymentSchema.methods.addWebhookEvent = function (event: string, data: any) {
  this.webhookEvents.push({
    event,
    data,
    receivedAt: new Date(),
  });
  return this.save();
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

// Pre-save hooks
paymentSchema.pre<IPayment>('save', function (next) {
  if (this.amount <= 0) {
    next(new Error('Payment amount must be greater than 0'));
  } else {
    next();
  }
});

paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
