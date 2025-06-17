const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
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
    estimatedCompletionDays: '3-5'
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
 * @desc    Create new review (with purchase verification)
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const userId = req.user._id;

  // Validate input
  if (!rating || !comment) {
    res.status(400);
    throw new Error('Please provide both rating and comment');
  }

  // Find the product
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user already reviewed this product
  const alreadyReviewed = product.reviews.find(
    (review) => review.user.toString() === userId.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  // Verify user has purchased this product
  const purchaseVerification = await verifyUserPurchase(userId, productId);
  
  if (!purchaseVerification.hasPurchased) {
    res.status(403);
    throw new Error('You can only review products you have purchased and received');
  }

  // Create the review
  const review = {
    name: req.user.firstName + ' ' + req.user.lastName || req.user.firstName,
    rating: Number(rating),
    comment,
    user: userId,
    verified: purchaseVerification.isVerified,
    order: purchaseVerification.orderId,
    purchaseDate: purchaseVerification.purchaseDate,
  };

  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  
  // Recalculate average rating
  product.rating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save();

  res.status(201).json({ 
    message: 'Review added successfully',
    review: product.reviews[product.reviews.length - 1] // Return the newly added review
  });
});

/**
 * @desc    Update a review (only by review author)
 * @route   PUT /api/products/:productId/reviews/:reviewId
 * @access  Private
 */
const updateProductReview = asyncHandler(async (req, res) => {
  const { productId, reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const review = product.reviews.id(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user owns this review
  if (review.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('You can only update your own reviews');
  }

  // Update review
  review.rating = Number(rating) || review.rating;
  review.comment = comment || review.comment;
  review.updatedAt = new Date();

  // Recalculate average rating
  product.rating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save();

  res.json({ 
    message: 'Review updated successfully',
    review 
  });
});

/**
 * @desc    Delete a review (only by review author or admin)
 * @route   DELETE /api/products/:productId/reviews/:reviewId
 * @access  Private
 */
const deleteProductReview = asyncHandler(async (req, res) => {
  const { productId, reviewId } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.isAdmin;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const review = product.reviews.id(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user owns this review or is admin
  if (review.user.toString() !== userId.toString() && !isAdmin) {
    res.status(403);
    throw new Error('You can only delete your own reviews');
  }

  // Remove review
  product.reviews.pull(reviewId);
  product.numReviews = product.reviews.length;

  // Recalculate average rating
  if (product.reviews.length > 0) {
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
  } else {
    product.rating = 0;
  }

  await product.save();

  res.json({ message: 'Review deleted successfully' });
});

/**
 * @desc    Get reviews for a product with pagination
 * @route   GET /api/products/:id/reviews
 * @access  Public
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = req.query.sortBy || 'newest'; // newest, oldest, highest, lowest

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let reviews = [...product.reviews];

  // Sort reviews
  switch (sortBy) {
    case 'oldest':
      reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'highest':
      reviews.sort((a, b) => b.rating - a.rating);
      break;
    case 'lowest':
      reviews.sort((a, b) => a.rating - b.rating);
      break;
    case 'newest':
    default:
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

  // Calculate statistics
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    ratingCounts[review.rating]++;
  });

  const verifiedCount = reviews.filter(review => review.verified).length;

  res.json({
    reviews: paginatedReviews,
    pagination: {
      page,
      limit,
      total: reviews.length,
      pages: Math.ceil(reviews.length / limit)
    },
    statistics: {
      averageRating: product.rating,
      totalReviews: product.numReviews,
      ratingCounts,
      verifiedCount,
      verifiedPercentage: reviews.length > 0 ? Math.round((verifiedCount / reviews.length) * 100) : 0
    }
  });
});

/**
 * @desc    Get user's review eligibility for products
 * @route   GET /api/products/review-eligibility
 * @access  Private
 */
const getReviewEligibility = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get all delivered orders for the user
  const orders = await Order.find({
    user: userId,
    isPaid: true,
    isDelivered: true,
    status: 'Delivered'
  }).populate('orderItems.product', 'name images');

  // Get all products user has purchased
  const purchasedProducts = [];
  const productReviewStatus = new Map();

  orders.forEach(order => {
    order.orderItems.forEach(item => {
      if (item.product) {
        const productId = item.product._id.toString();
        
        if (!productReviewStatus.has(productId)) {
          purchasedProducts.push({
            productId: item.product._id,
            productName: item.product.name,
            productImage: item.product.images[0]?.url,
            purchaseDate: order.deliveredAt,
            orderId: order._id
          });
          productReviewStatus.set(productId, true);
        }
      }
    });
  });

  // Check which products user has already reviewed
  const reviewedProductIds = [];
  for (const product of purchasedProducts) {
    const productDoc = await Product.findById(product.productId, 'reviews');
    const hasReviewed = productDoc.reviews.some(
      review => review.user.toString() === userId.toString()
    );
    
    if (hasReviewed) {
      reviewedProductIds.push(product.productId.toString());
    }
  }

  // Filter out already reviewed products
  const eligibleForReview = purchasedProducts.filter(
    product => !reviewedProductIds.includes(product.productId.toString())
  );

  res.json({
    eligibleForReview,
    totalPurchased: purchasedProducts.length,
    totalReviewed: reviewedProductIds.length
  });
});

/**
 * @desc    Verify if user has purchased a product
 * @param   {String} userId 
 * @param   {String} productId 
 * @returns {Object} verification result
 */
const verifyUserPurchase = async (userId, productId) => {
  try {
    // Check regular orders
    const order = await Order.findOne({
      user: userId,
      'orderItems.product': productId,
      isPaid: true,
      isDelivered: true, // Only allow reviews after delivery
      status: 'Delivered'
    }).sort({ deliveredAt: -1 }); // Get most recent delivery

    if (order) {
      return {
        hasPurchased: true,
        isVerified: true,
        orderId: order._id,
        purchaseDate: order.deliveredAt || order.createdAt
      };
    }

    // Check custom orders (if applicable)
    const customOrder = await CustomOrder.findOne({
      user: userId,
      baseProduct: productId,
      status: 'completed' // Assuming completed means delivered
    }).sort({ updatedAt: -1 });

    if (customOrder) {
      return {
        hasPurchased: true,
        isVerified: true,
        orderId: customOrder._id,
        purchaseDate: customOrder.updatedAt
      };
    }

    return {
      hasPurchased: false,
      isVerified: false,
      orderId: null,
      purchaseDate: null
    };

  } catch (error) {
    console.error('Error verifying purchase:', error);
    return {
      hasPurchased: false,
      isVerified: false,
      orderId: null,
      purchaseDate: null
    };
  }
};

/**
 * @desc    Verify if user purchased a specific product
 * @route   GET /api/products/:id/verify-purchase
 * @access  Private
 */
const verifyProductPurchase = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const userId = req.user._id;

  const verification = await verifyUserPurchase(userId, productId);
  
  // Check if user has already reviewed this product
  const product = await Product.findById(productId, 'reviews');
  const hasReviewed = product ? product.reviews.some(
    review => review.user.toString() === userId.toString()
  ) : false;
  
  res.json({
    productId,
    hasPurchased: verification.hasPurchased,
    isVerified: verification.isVerified,
    canReview: verification.hasPurchased && !hasReviewed,
    hasReviewed,
    purchaseDate: verification.purchaseDate
  });
});

/**
 * @desc    Mark review as helpful
 * @route   POST /api/products/:productId/reviews/:reviewId/helpful
 * @access  Private
 */
const markReviewHelpful = asyncHandler(async (req, res) => {
  const { productId, reviewId } = req.params;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const review = product.reviews.id(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Prevent users from marking their own reviews as helpful
  if (review.user.toString() === userId.toString()) {
    res.status(400);
    throw new Error('You cannot mark your own review as helpful');
  }

  // Check if user already marked this review as helpful
  if (review.helpfulUsers && review.helpfulUsers.includes(userId)) {
    res.status(400);
    throw new Error('You have already marked this review as helpful');
  }

  // Initialize helpfulUsers array if it doesn't exist
  if (!review.helpfulUsers) {
    review.helpfulUsers = [];
  }

  // Add user to helpful users and increment count
  review.helpfulUsers.push(userId);
  review.helpfulVotes = review.helpfulUsers.length;

  await product.save();
  res.json({ message: 'Review marked as helpful', helpfulVotes: review.helpfulVotes });
});

/**
 * @desc    Unmark review as helpful
 * @route   DELETE /api/products/:productId/reviews/:reviewId/helpful
 * @access  Private
 */
const unmarkReviewHelpful = asyncHandler(async (req, res) => {
  const { productId, reviewId } = req.params;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const review = product.reviews.id(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user has marked this review as helpful
  if (!review.helpfulUsers || !review.helpfulUsers.includes(userId)) {
    res.status(400);
    throw new Error('You have not marked this review as helpful');
  }

  // Remove user from helpful users and decrement count
  review.helpfulUsers = review.helpfulUsers.filter(id => id.toString() !== userId.toString());
  review.helpfulVotes = review.helpfulUsers.length;

  await product.save();
  res.json({ message: 'Review unmarked as helpful', helpfulVotes: review.helpfulVotes });
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
    .populate('user', 'firstName lastName email')
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
  updateProductReview,
  deleteProductReview,
  getProductReviews,
  getReviewEligibility,
  verifyProductPurchase,
  markReviewHelpful,
  unmarkReviewHelpful,
  getTopProducts,
  getFeaturedProducts,
  getSaleProducts,
  getDesignStyles,
  getCustomDesignOrders,
  updateCustomOrderStatus,
};