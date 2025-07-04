const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/productController');

const { protect, admin } = require('../middleware/authMiddleware');

// Main products route - FIXED: Combined GET and POST in one route definition
router
  .route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

// Public routes for specific product queries
router.route('/top').get(getTopProducts);
router.route('/featured').get(getFeaturedProducts);
router.route('/sale').get(getSaleProducts);
router.route('/base-for-customization').get(getBaseProductsForCustomization);
router.route('/design-styles').get(getDesignStyles);
router.route('/design-style/:style').get(getProductsByDesignStyle);

// Review routes - Enhanced with verification
router
  .route('/:id/reviews')
  .get(getProductReviews)
  .post(protect, createProductReview);

router
  .route('/:productId/reviews/:reviewId')
  .put(protect, updateProductReview)
  .delete(protect, deleteProductReview);

router
  .route('/:productId/reviews/:reviewId/helpful')
  .post(protect, markReviewHelpful)
  .delete(protect, unmarkReviewHelpful);

// Protected routes
router.route('/custom-order').post(protect, submitCustomDesignOrder);
router.route('/review-eligibility').get(protect, getReviewEligibility);
router.route('/:id/verify-purchase').get(protect, verifyProductPurchase);

// Admin routes for custom orders
router.route('/admin/custom-orders').get(protect, admin, getCustomDesignOrders);
router.route('/admin/custom-orders/:id/status').put(protect, admin, updateCustomOrderStatus);

// Individual product CRUD routes - Keep this at the end to avoid conflicts
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;