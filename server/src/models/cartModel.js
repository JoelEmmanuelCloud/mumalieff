// server/src/models/cartModel

const mongoose = require('mongoose');

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
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

// Index for efficient queries
cartSchema.index({ user: 1 });
cartSchema.index({ lastUpdated: 1 });
cartSchema.index({ remindersSent: 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;