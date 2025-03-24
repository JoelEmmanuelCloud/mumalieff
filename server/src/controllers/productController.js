const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');

/**
 * @desc    Fetch all products
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.pageNumber) || 1;

  // Build query based on filters
  const query = {};

  // Search functionality
  if (req.query.keyword) {
    query.name = {
      $regex: req.query.keyword,
      $options: 'i', // case-insensitive
    };
  }

  // Category filter
  if (req.query.category) {
    query.category = req.query.category;
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
      default:
        sortOption = { createdAt: -1 };
    }
  } else {
    // Default sort by newest
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
 * @desc    Fetch single product
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
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
    price,
    description,
    images,
    category,
    sizes,
    colors,
    countInStock,
    material,
    allowCustomization,
    featured,
    isSale,
    salePrice,
  } = req.body;

  const product = new Product({
    name,
    price,
    user: req.user._id, // Admin who created the product
    images: images || [],
    category,
    description,
    sizes: sizes || [],
    colors: colors || [],
    countInStock,
    material,
    allowCustomization: allowCustomization || false,
    featured: featured || false,
    isSale: isSale || false,
    salePrice,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    images,
    category,
    sizes,
    colors,
    countInStock,
    material,
    allowCustomization,
    featured,
    isSale,
    salePrice,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.images = images || product.images;
    product.category = category || product.category;
    product.sizes = sizes || product.sizes;
    product.colors = colors || product.colors;
    product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
    product.material = material || product.material;
    product.allowCustomization = allowCustomization !== undefined ? allowCustomization : product.allowCustomization;
    product.featured = featured !== undefined ? featured : product.featured;
    product.isSale = isSale !== undefined ? isSale : product.isSale;
    product.salePrice = salePrice !== undefined ? salePrice : product.salePrice;

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
  
  const products = await Product.find({})
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
  
  const products = await Product.find({ featured: true })
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
  
  const products = await Product.find({ isSale: true })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json(products);
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getFeaturedProducts,
  getSaleProducts,
};