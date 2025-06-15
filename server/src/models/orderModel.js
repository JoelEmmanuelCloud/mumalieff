const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
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
      enum: ['paystack-card', 'paystack-transfer', 'paystack-ussd'],
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
      reference: { type: String },
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
  },
  {
    timestamps: true,
  }
);

// Calculate the total amount before saving
orderSchema.pre('save', function(next) {
  // Calculate total if it's not already set
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

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;