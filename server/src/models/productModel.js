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
    verified: { type: Boolean, default: false }, // For verified purchases
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
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        alt: { type: String },
        isPrimary: { type: Boolean, default: false }, // Main product image
      },
    ],
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: ['Graphic Tees', 'Plain Tees', 'Custom Prints'],
    },
    subcategory: {
      type: String,
      enum: ['Vintage', 'Modern', 'Sports', 'Music', 'Art', 'Text', 'Logo'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    sizes: [
      {
        name: { 
          type: String, 
          required: true,
          enum: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] 
        },
        inStock: { type: Boolean, default: true },
        stockCount: { type: Number, default: 0, min: 0 }, // Individual size stock
      },
    ],
    colors: [
      {
        name: { type: String, required: true },
        colorCode: { type: String, required: true },
        inStock: { type: Boolean, default: true },
        stockCount: { type: Number, default: 0, min: 0 }, // Individual color stock
      },
    ],
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price must be positive'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price must be positive'],
    },
    countInStock: {
      type: Number,
      required: [true, 'Please add stock count'],
      default: 0,
      min: [0, 'Stock count must be positive'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold must be positive'],
    },
    material: {
      type: String,
      required: false,
      enum: ['Cotton', 'Polyester', 'Cotton Blend', 'Bamboo', 'Linen', 'Other'],
    },
    weight: {
      type: Number, // in grams
      min: [0, 'Weight must be positive'],
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    allowCustomization: {
      type: Boolean,
      default: false,
    },
    customizationOptions: {
      allowText: { type: Boolean, default: false },
      allowImages: { type: Boolean, default: false },
      maxTextLength: { type: Number, default: 50 },
      customizationPrice: { type: Number, default: 0 },
    },
    tags: [{ type: String, lowercase: true }], // For better search
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
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
    saleStartDate: { type: Date },
    saleEndDate: { type: Date },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    metaTitle: { type: String, maxlength: 60 }, // SEO
    metaDescription: { type: String, maxlength: 160 }, // SEO
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ isSale: 1, isActive: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ price: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.isSale && this.salePrice) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice) {
    const sellingPrice = this.isSale ? this.salePrice : this.price;
    return Math.round(((sellingPrice - this.costPrice) / sellingPrice) * 100);
  }
  return 0;
});

// Virtual for current effective price
productSchema.virtual('effectivePrice').get(function() {
  return this.isSale && this.salePrice ? this.salePrice : this.price;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.countInStock === 0) return 'Out of Stock';
  if (this.countInStock <= this.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim('-'); // Remove leading/trailing hyphens
    
    // Add product ID to ensure uniqueness if needed
    if (this._id) {
      this.slug = `${this.slug}-${this._id.toString().slice(-6)}`;
    }
  }
  next();
});

// Pre-save middleware to ensure only one primary image
productSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    
    if (primaryImages.length === 0) {
      // Set first image as primary if none is set
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      // Ensure only the first primary image remains primary
      this.images.forEach((img, index) => {
        img.isPrimary = index === this.images.findIndex(i => i.isPrimary);
      });
    }
  }
  next();
});

// Pre-save middleware to validate sale dates
productSchema.pre('save', function(next) {
  if (this.isSale) {
    if (this.saleStartDate && this.saleEndDate) {
      if (this.saleStartDate >= this.saleEndDate) {
        return next(new Error('Sale start date must be before sale end date'));
      }
    }
    
    if (!this.salePrice) {
      return next(new Error('Sale price is required when product is on sale'));
    }
  }
  next();
});

// Method to calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
    return;
  }
  
  const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating = Math.round((totalRating / this.reviews.length) * 10) / 10; // Round to 1 decimal
  this.numReviews = this.reviews.length;
};

// Method to check if product is currently on sale
productSchema.methods.isCurrentlyOnSale = function() {
  if (!this.isSale || !this.salePrice) return false;
  
  const now = new Date();
  
  if (this.saleStartDate && now < this.saleStartDate) return false;
  if (this.saleEndDate && now > this.saleEndDate) return false;
  
  return true;
};

// Method to update stock after purchase
productSchema.methods.updateStock = function(quantity, size = null, color = null) {
  // Update main stock count
  this.countInStock = Math.max(0, this.countInStock - quantity);
  this.soldCount += quantity;
  
  // Update size-specific stock if provided
  if (size) {
    const sizeObj = this.sizes.find(s => s.name === size);
    if (sizeObj) {
      sizeObj.stockCount = Math.max(0, sizeObj.stockCount - quantity);
      sizeObj.inStock = sizeObj.stockCount > 0;
    }
  }
  
  // Update color-specific stock if provided
  if (color) {
    const colorObj = this.colors.find(c => c.name === color);
    if (colorObj) {
      colorObj.stockCount = Math.max(0, colorObj.stockCount - quantity);
      colorObj.inStock = colorObj.stockCount > 0;
    }
  }
};

// Method to increment view count
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, isActive: true };
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find featured products
productSchema.statics.findFeatured = function(limit = 6) {
  return this.find({ featured: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find sale products
productSchema.statics.findOnSale = function(limit = 10) {
  return this.find({ 
    isSale: true, 
    isActive: true,
    salePrice: { $exists: true, $gt: 0 }
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method for search
productSchema.statics.search = function(searchTerm, options = {}) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return this.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } }
    ],
    isActive: true
  })
  .sort(options.sort || { rating: -1, createdAt: -1 })
  .limit(options.limit || 20)
  .skip(options.skip || 0);
};

// Set virtuals to true when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;