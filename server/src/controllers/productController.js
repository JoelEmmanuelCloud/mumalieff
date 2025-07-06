const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const CustomOrder = require('../models/customOrderModel'); 
const mongoose = require('mongoose');

const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.pageNumber) || 1;

  const query = { isActive: true };

  if (req.query.keyword) {
    query.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { description: { $regex: req.query.keyword, $options: 'i' } },
      { convictionMessage: { $regex: req.query.keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.keyword, 'i')] } }
    ];
  }

  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.designStyle) {
    query.designStyle = req.query.designStyle;
  }

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

  if (req.query.size) {
    query['sizes.name'] = req.query.size;
    query['sizes.inStock'] = true;
  }

  if (req.query.color) {
    query['colors.name'] = req.query.color;
    query['colors.inStock'] = true;
  }

  if (req.query.featured === 'true') {
    query.featured = true;
  }

  if (req.query.onSale === 'true') {
    query.isSale = true;
  }

  if (req.query.allowCustomization === 'true') {
    query.allowCustomization = true;
  }

  if (req.query.baseProducts === 'true') {
    query.isBaseProduct = true;
  }

  const count = await Product.countDocuments(query);

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

  const baseProduct = await Product.findById(baseProductId);
  if (!baseProduct || baseProduct.category !== 'Customize Your Prints') {
    res.status(404);
    throw new Error('Base product not found or not customizable');
  }

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

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product ID');
  }

  const product = await Product.findById(id);

  if (product && product.isActive) {
    await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

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

  if (!name || !price || !description || !category) {
    res.status(400);
    throw new Error('Please provide name, price, description, and category');
  }

  const allowedCategories = ['Customize Your Prints', 'Wear Your Conviction'];
  if (!allowedCategories.includes(category)) {
    res.status(400);
    throw new Error('Invalid category. Must be either "Customize Your Prints" or "Wear Your Conviction"');
  }

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

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
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

const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const userId = req.user._id;

  if (!rating || !comment) {
    res.status(400);
    throw new Error('Please provide both rating and comment');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = product.reviews.find(
    (review) => review.user.toString() === userId.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const purchaseVerification = await verifyUserPurchase(userId, productId);
  
  if (!purchaseVerification.hasPurchased) {
    res.status(403);
    throw new Error('You can only review products you have purchased and received');
  }

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
  
  product.rating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save();

  res.status(201).json({ 
    message: 'Review added successfully',
    review: product.reviews[product.reviews.length - 1]
  });
});

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

  if (review.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('You can only update your own reviews');
  }

  review.rating = Number(rating) || review.rating;
  review.comment = comment || review.comment;
  review.updatedAt = new Date();

  product.rating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save();

  res.json({ 
    message: 'Review updated successfully',
    review 
  });
});

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

  if (review.user.toString() !== userId.toString() && !isAdmin) {
    res.status(403);
    throw new Error('You can only delete your own reviews');
  }

  product.reviews.pull(reviewId);
  product.numReviews = product.reviews.length;

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

const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = req.query.sortBy || 'newest';

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let reviews = [...product.reviews];

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

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

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

const getReviewEligibility = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const orders = await Order.find({
    user: userId,
    isPaid: true,
    isDelivered: true,
    status: 'Delivered'
  }).populate('orderItems.product', 'name images');

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

  const eligibleForReview = purchasedProducts.filter(
    product => !reviewedProductIds.includes(product.productId.toString())
  );

  res.json({
    eligibleForReview,
    totalPurchased: purchasedProducts.length,
    totalReviewed: reviewedProductIds.length
  });
});

const verifyUserPurchase = async (userId, productId) => {
  try {
    const order = await Order.findOne({
      user: userId,
      'orderItems.product': productId,
      isPaid: true,
      isDelivered: true,
      status: 'Delivered'
    }).sort({ deliveredAt: -1 });

    if (order) {
      return {
        hasPurchased: true,
        isVerified: true,
        orderId: order._id,
        purchaseDate: order.deliveredAt || order.createdAt
      };
    }

    const customOrder = await CustomOrder.findOne({
      user: userId,
      baseProduct: productId,
      status: 'completed'
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
    return {
      hasPurchased: false,
      isVerified: false,
      orderId: null,
      purchaseDate: null
    };
  }
};

const verifyProductPurchase = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const userId = req.user._id;

  const verification = await verifyUserPurchase(userId, productId);
  
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

  if (review.user.toString() === userId.toString()) {
    res.status(400);
    throw new Error('You cannot mark your own review as helpful');
  }

  if (review.helpfulUsers && review.helpfulUsers.includes(userId)) {
    res.status(400);
    throw new Error('You have already marked this review as helpful');
  }

  if (!review.helpfulUsers) {
    review.helpfulUsers = [];
  }

  review.helpfulUsers.push(userId);
  review.helpfulVotes = review.helpfulUsers.length;

  await product.save();
  res.json({ message: 'Review marked as helpful', helpfulVotes: review.helpfulVotes });
});

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

  if (!review.helpfulUsers || !review.helpfulUsers.includes(userId)) {
    res.status(400);
    throw new Error('You have not marked this review as helpful');
  }

  review.helpfulUsers = review.helpfulUsers.filter(id => id.toString() !== userId.toString());
  review.helpfulVotes = review.helpfulUsers.length;

  await product.save();
  res.json({ message: 'Review unmarked as helpful', helpfulVotes: review.helpfulVotes });
});

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

const getDesignStyles = asyncHandler(async (req, res) => {
  const designStyles = [
    'Religious/Spiritual', 
    'Motivational'
  ];

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