const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        alt: { type: String },
      },
    ],
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: ['Graphic Tees', 'Plain Tees', 'Custom Prints'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    sizes: [
      {
        name: { 
          type: String, 
          required: true,
          enum: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] 
        },
        inStock: { type: Boolean, default: true },
      },
    ],
    colors: [
      {
        name: { type: String, required: true },
        colorCode: { type: String, required: true },
        inStock: { type: Boolean, default: true },
      },
    ],
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price must be positive'],
    },
    countInStock: {
      type: Number,
      required: [true, 'Please add stock count'],
      default: 0,
      min: [0, 'Stock count must be positive'],
    },
    material: {
      type: String,
      required: false,
    },
    allowCustomization: {
      type: Boolean,
      default: false,
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isSale: {
      type: Boolean,
      default: false,
    },
    salePrice: {
      type: Number,
      validate: {
        validator: function(value) {
          // Sale price must be less than regular price if it exists
          return !value || value < this.price;
        },
        message: 'Sale price must be less than regular price',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.isSale && this.salePrice) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

// Set virtuals to true when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;