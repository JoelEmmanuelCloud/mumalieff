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

// Public routes
router.route('/').get(getProducts);
router.route('/top').get(getTopProducts);
router.route('/featured').get(getFeaturedProducts);
router.route('/sale').get(getSaleProducts);
router.route('/base-for-customization').get(getBaseProductsForCustomization);
router.route('/design-styles').get(getDesignStyles);
router.route('/design-style/:style').get(getProductsByDesignStyle);

// Review routes - Enhanced with verification
router.route('/:id/reviews').get(getProductReviews).post(protect, createProductReview);
router.route('/:productId/reviews/:reviewId').put(protect, updateProductReview).delete(protect, deleteProductReview);
router.route('/:productId/reviews/:reviewId/helpful').post(protect, markReviewHelpful).delete(protect, unmarkReviewHelpful);

// Protected routes
router.route('/custom-order').post(protect, submitCustomDesignOrder);
router.route('/review-eligibility').get(protect, getReviewEligibility);
router.route('/:id/verify-purchase').get(protect, verifyProductPurchase);

// Admin routes
router.route('/').post(protect, admin, createProduct);
router.route('/admin/custom-orders').get(protect, admin, getCustomDesignOrders);
router.route('/admin/custom-orders/:id/status').put(protect, admin, updateCustomOrderStatus);

// Product CRUD routes
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;