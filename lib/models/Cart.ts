import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  price: number;
  qty: number;
  size: string;
  color: string;
  customDesign?: {
    hasCustomDesign: boolean;
    designUrl?: string;
    designPublicId?: string;
  };
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  total: number;
  lastUpdated: Date;
  remindersSent: number;
  lastReminderSent?: Date;
}

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true },
        size: { type: String, required: true },
        color: { type: String, required: true },
        customDesign: {
          hasCustomDesign: { type: Boolean, default: false },
          designUrl: { type: String },
          designPublicId: { type: String },
        },
      },
    ],
    total: {
      type: Number,
      required: true,
      default: 0.0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    remindersSent: {
      type: Number,
      default: 0,
    },
    lastReminderSent: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ lastUpdated: 1 });
cartSchema.index({ remindersSent: 1 });

const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);

export default Cart;
