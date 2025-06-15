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
    verified: { type: Boolean, default: false },
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
        isPrimary: { type: Boolean, default: false },
      },
    ],
    // Updated category system - only two main categories
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: ['Customize Your Prints', 'Wear Your Conviction'],
    },
    // Design styles for "Wear Your Conviction" category - simplified to two types
    designStyle: {
      type: String,
      enum: [
        'Religious/Spiritual', 
        'Motivational'
      ],
      required: function() {
        return this.category === 'Wear Your Conviction';
      }
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
    // Message/conviction behind the design (for Wear Your Conviction products)
    convictionMessage: {
      type: String,
      maxlength: [500, 'Conviction message cannot exceed 500 characters'],
      required: function() {
        return this.category === 'Wear Your Conviction';
      }
    },
    sizes: [
      {
        name: { 
          type: String, 
          required: true,
          enum: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] 
        },
        inStock: { type: Boolean, default: true },
        stockCount: { type: Number, default: 0, min: 0 },
      },
    ],
    colors: [
      {
        name: { type: String, required: true },
        colorCode: { type: String, required: true },
        inStock: { type: Boolean, default: true },
        stockCount: { type: Number, default: 0, min: 0 },
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
      default: 'Cotton'
    },
    // Customization settings - mainly for "Customize Your Prints"
    allowCustomization: {
      type: Boolean,
      default: function() {
        return this.category === 'Customize Your Prints';
      }
    },
    customizationOptions: {
      allowText: { type: Boolean, default: true },
      allowImages: { type: Boolean, default: true },
      allowLogoUpload: { type: Boolean, default: true },
      maxTextLength: { type: Number, default: 100 },
      customizationPrice: { type: Number, default: 0 },
      availablePrintMethods: [{
        type: String,
        enum: ['Screen Print', 'Digital Print', 'Vinyl', 'Embroidery', 'Heat Transfer']
      }],
      printAreas: [{
        type: String,
        enum: ['Front', 'Back', 'Left Chest', 'Right Chest', 'Left Sleeve', 'Right Sleeve']
      }]
    },
    // For base products in "Customize Your Prints"
    isBaseProduct: {
      type: Boolean,
      default: function() {
        return this.category === 'Customize Your Prints';
      }
    },
    tags: [{ type: String, lowercase: true }],
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
    // SEO fields
    metaTitle: { type: String, maxlength: 60 },
    metaDescription: { type: String, maxlength: 160 },
    // Design inspiration/story (for Wear Your Conviction)
    designInspiration: {
      type: String,
      maxlength: [1000, 'Design inspiration cannot exceed 1000 characters']
    },
    // Artist/designer credit
    designerCredit: {
      name: { type: String },
      portfolio: { type: String },
      socialMedia: { type: String }
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text', convictionMessage: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ category: 1, designStyle: 1, isActive: 1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ isSale: 1, isActive: 1 });
productSchema.index({ allowCustomization: 1, isActive: 1 });
productSchema.index({ isBaseProduct: 1, isActive: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.isSale && this.salePrice) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
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
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    if (this._id) {
      this.slug = `${this.slug}-${this._id.toString().slice(-6)}`;
    }
  }
  next();
});

// Pre-save middleware to set default values based on category
productSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('category')) {
    if (this.category === 'Customize Your Prints') {
      this.allowCustomization = true;
      this.isBaseProduct = true;
      if (!this.customizationOptions.printAreas.length) {
        this.customizationOptions.printAreas = ['Front', 'Back'];
      }
      if (!this.customizationOptions.availablePrintMethods.length) {
        this.customizationOptions.availablePrintMethods = ['Screen Print', 'Digital Print'];
      }
    } else if (this.category === 'Wear Your Conviction') {
      this.allowCustomization = false;
      this.isBaseProduct = false;
    }
  }
  next();
});

// Static method to find products by category
productSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, isActive: true };
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find products by design style (within Wear Your Conviction)
productSchema.statics.findByDesignStyle = function(designStyle, options = {}) {
  const query = { 
    category: 'Wear Your Conviction',
    designStyle,
    isActive: true 
  };
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to find base products for customization
productSchema.statics.findBaseProducts = function(limit = 10) {
  return this.find({ 
    category: 'Customize Your Prints',
    isBaseProduct: true,
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to find conviction products
productSchema.statics.findConvictionProducts = function(options = {}) {
  const query = { 
    category: 'Wear Your Conviction',
    isActive: true 
  };
  
  if (options.designStyle) {
    query.designStyle = options.designStyle;
  }
  
  return this.find(query)
    .sort(options.sort || { rating: -1, createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method for search across both categories
productSchema.statics.search = function(searchTerm, options = {}) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  const query = {
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { convictionMessage: searchRegex },
      { tags: { $in: [searchRegex] } }
    ],
    isActive: true
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query)
    .sort(options.sort || { rating: -1, createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Set virtuals to true when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;