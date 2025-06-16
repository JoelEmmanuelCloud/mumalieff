const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const CustomOrder = require('../models/customOrderModel'); 
const mongoose = require('mongoose');

/**
 * @desc    Fetch all products with updated filtering
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.pageNumber) || 1;

  // Build query based on filters
  const query = { isActive: true };

  // Search functionality
  if (req.query.keyword) {
    query.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { description: { $regex: req.query.keyword, $options: 'i' } },
      { convictionMessage: { $regex: req.query.keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.keyword, 'i')] } }
    ];
  }

  // Category filter (main categories)
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Design style filter (for Wear Your Conviction)
  if (req.query.designStyle) {
    query.designStyle = req.query.designStyle;
  }

  // Price range filter
  if (req.query.minPrice && req.query.maxPrice) {
    query.price = {
      $gte: Number(req.query.minPrice),
      $lte: Number(req.query.maxPrice),
    };
  } else if (req.query.minPrice) {
    query.price = { $gte: Number(req.query.minPrice) };
  } else if (req.query.maxPrice) {
    query.price = { $lte: Number(req.query.maxPrice) };
  }

  // Filter by size availability
  if (req.query.size) {
    query['sizes.name'] = req.query.size;
    query['sizes.inStock'] = true;
  }

  // Filter by color availability
  if (req.query.color) {
    query['colors.name'] = req.query.color;
    query['colors.inStock'] = true;
  }

  // Filter by featured products
  if (req.query.featured === 'true') {
    query.featured = true;
  }

  // Filter by sale items
  if (req.query.onSale === 'true') {
    query.isSale = true;
  }

  // Filter by customization capability
  if (req.query.allowCustomization === 'true') {
    query.allowCustomization = true;
  }

  // Filter base products only
  if (req.query.baseProducts === 'true') {
    query.isBaseProduct = true;
  }

  // Count total matching products
  const count = await Product.countDocuments(query);

  // Sort options
  let sortOption = {};
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'popular':
        sortOption = { soldCount: -1, views: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
  } else {
    sortOption = { createdAt: -1 };
  }

  // Fetch products
  const products = await Product.find(query)
    .sort(sortOption)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    totalProducts: count,
  });
});

/**
 * @desc    Get base products for customization
 * @route   GET /api/products/base-for-customization
 * @access  Public
 */
const getBaseProductsForCustomization = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  
  const products = await Product.find({
    category: 'Customize Your Prints',
    isBaseProduct: true,
    isActive: true
  })
  .sort({ createdAt: -1 })
  .limit(limit);

  res.json(products);
});

/**
 * @desc    Get products by design style
 * @route   GET /api/products/design-style/:style
 * @access  Public
 */
const getProductsByDesignStyle = asyncHandler(async (req, res) => {
  const { style } = req.params;
  const limit = Number(req.query.limit) || 20;
  const page = Number(req.query.pageNumber) || 1;
  const pageSize = 12;

  const query = {
    category: 'Wear Your Conviction',
    designStyle: style,
    isActive: true
  };

  const count = await Product.countDocuments(query);
  
  const products = await Product.find(query)
    .sort({ rating: -1, createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    totalProducts: count,
    designStyle: style
  });
});

/**
 * @desc    Submit custom design order
 * @route   POST /api/products/custom-order
 * @access  Private
 */
const submitCustomDesignOrder = asyncHandler(async (req, res) => {
  const {
    baseProductId,
    customDesign,
    quantity,
    size,
    color,
    specialInstructions,
    contactPreferences
  } = req.body;

  // Validate base product
  const baseProduct = await Product.findById(baseProductId);
  if (!baseProduct || baseProduct.category !== 'Customize Your Prints') {
    res.status(404);
    throw new Error('Base product not found or not customizable');
  }

  // Create custom order (you'll need to create this model)
  const customOrder = new CustomOrder({
    user: req.user._id,
    baseProduct: baseProductId,
    customDesign: {
      designUrl: customDesign.designUrl,
      designPublicId: customDesign.designPublicId,
      placement: customDesign.placement,
      size: customDesign.size,
      printMethod: customDesign.printMethod || 'Digital Print'
    },
    quantity,
    size,
    color,
    basePrice: baseProduct.price,
    customizationPrice: baseProduct.customizationOptions.customizationPrice || 0,
    totalPrice: (baseProduct.price + (baseProduct.customizationOptions.customizationPrice || 0)) * quantity,
    specialInstructions,
    contactPreferences,
    status: 'pending',
    estimatedCompletionDays: 3-5
  });

  const savedOrder = await customOrder.save();
  
  res.status(201).json({
    message: 'Custom design order submitted successfully',
    orderId: savedOrder._id,
    estimatedCompletion: '3-5 business days'
  });
});

/**
 * @desc    Fetch single product
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product ID');
  }

  const product = await Product.findById(id);

  if (product && product.isActive) {
    // Use findByIdAndUpdate instead of incrementViews()
    await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Create a product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    designStyle,
    price,
    description,
    convictionMessage,
    images,
    sizes,
    colors,
    countInStock,
    material,
    designInspiration,
    designerCredit
  } = req.body;

  // Validate required fields based on category
  if (!name || !price || !description || !category) {
    res.status(400);
    throw new Error('Please provide name, price, description, and category');
  }

  // Validate category
  const allowedCategories = ['Customize Your Prints', 'Wear Your Conviction'];
  if (!allowedCategories.includes(category)) {
    res.status(400);
    throw new Error('Invalid category. Must be either "Customize Your Prints" or "Wear Your Conviction"');
  }

  // Validate design style for Wear Your Conviction
  if (category === 'Wear Your Conviction' && !designStyle) {
    res.status(400);
    throw new Error('Design style is required for "Wear Your Conviction" products');
  }

  const productData = {
    name,
    price: Number(price),
    user: req.user._id,
    category,
    description,
    images: images || [],
    sizes: sizes || [
      { name: 'S', inStock: true, stockCount: countInStock || 0 },
      { name: 'M', inStock: true, stockCount: countInStock || 0 },
      { name: 'L', inStock: true, stockCount: countInStock || 0 }
    ],
    colors: colors || [],
    countInStock: Number(countInStock) || 0,
    material: material || 'Cotton',
    isActive: true,
    rating: 0,
    numReviews: 0,
    views: 0,
    soldCount: 0
  };

  // Add category-specific fields
  if (category === 'Wear Your Conviction') {
    productData.designStyle = designStyle;
    productData.convictionMessage = convictionMessage;
    productData.designInspiration = designInspiration;
    productData.designerCredit = designerCredit;
    productData.allowCustomization = false;
    productData.isBaseProduct = false;
  } else {
    productData.allowCustomization = true;
    productData.isBaseProduct = true;
    productData.customizationOptions = {
      allowText: true,
      allowImages: true,
      allowLogoUpload: true,
      printAreas: ['Front', 'Back'],
      availablePrintMethods: ['Screen Print', 'Digital Print']
    };
  }

  const product = new Product(productData);
  const createdProduct = await product.save();
  
  res.status(201).json(createdProduct);
});

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Update common fields
    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    product.description = req.body.description || product.description;
    product.images = req.body.images || product.images;
    product.sizes = req.body.sizes || product.sizes;
    product.colors = req.body.colors || product.colors;
    product.countInStock = req.body.countInStock !== undefined ? req.body.countInStock : product.countInStock;
    product.material = req.body.material || product.material;
    product.featured = req.body.featured !== undefined ? req.body.featured : product.featured;
    product.isSale = req.body.isSale !== undefined ? req.body.isSale : product.isSale;
    product.salePrice = req.body.salePrice !== undefined ? req.body.salePrice : product.salePrice;

    // Update category-specific fields
    if (product.category === 'Wear Your Conviction') {
      product.designStyle = req.body.designStyle || product.designStyle;
      product.convictionMessage = req.body.convictionMessage || product.convictionMessage;
      product.designInspiration = req.body.designInspiration || product.designInspiration;
      product.designerCredit = req.body.designerCredit || product.designerCredit;
    } else if (product.category === 'Customize Your Prints') {
      product.customizationOptions = req.body.customizationOptions || product.customizationOptions;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Create new review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    
    // Calculate average rating
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Get top rated products
 * @route   GET /api/products/top
 * @access  Public
 */
const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  const category = req.query.category;
  
  const query = { isActive: true };
  if (category) {
    query.category = category;
  }
  
  const products = await Product.find(query)
    .sort({ rating: -1 })
    .limit(limit);

  res.json(products);
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 6;
  const category = req.query.category;
  
  const query = { featured: true, isActive: true };
  if (category) {
    query.category = category;
  }
  
  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json(products);
});

/**
 * @desc    Get products on sale
 * @route   GET /api/products/sale
 * @access  Public
 */
const getSaleProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 6;
  const category = req.query.category;
  
  const query = { isSale: true, isActive: true };
  if (category) {
    query.category = category;
  }
  
  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json(products);
});

/**
 * @desc    Get design styles for Wear Your Conviction category
 * @route   GET /api/products/design-styles
 * @access  Public
 */
const getDesignStyles = asyncHandler(async (req, res) => {
  const designStyles = [
    'Religious/Spiritual', 
    'Motivational'
  ];

  // Get count for each design style
  const stylesWithCount = await Promise.all(
    designStyles.map(async (style) => {
      const count = await Product.countDocuments({
        category: 'Wear Your Conviction',
        designStyle: style,
        isActive: true
      });
      return { style, count };
    })
  );

  res.json(stylesWithCount);
});

/**
 * @desc    Get custom design orders (Admin)
 * @route   GET /api/admin/custom-orders
 * @access  Private/Admin
 */
const getCustomDesignOrders = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.pageNumber) || 1;
  const status = req.query.status;
  const dateFrom = req.query.dateFrom;
  const dateTo = req.query.dateTo;

  const query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const count = await CustomOrder.countDocuments(query);
  
  const orders = await CustomOrder.find(query)
    .populate('user', 'name email')
    .populate('baseProduct', 'name price')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    totalOrders: count,
  });
});

/**
 * @desc    Update custom order status (Admin)
 * @route   PUT /api/admin/custom-orders/:id/status
 * @access  Private/Admin
 */
const updateCustomOrderStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  
  const order = await CustomOrder.findById(req.params.id);
  
  if (order) {
    order.status = status;
    if (notes) {
      order.adminNotes = notes;
    }
    order.updatedAt = new Date();
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Custom order not found');
  }
});

module.exports = {
  getProducts,
  getProductById,
  getBaseProductsForCustomization,
  getProductsByDesignStyle,
  submitCustomDesignOrder,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getFeaturedProducts,
  getSaleProducts,
  getDesignStyles,
  getCustomDesignOrders,
  updateCustomOrderStatus,
};