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
  getTopProducts,
  getFeaturedProducts,
  getSaleProducts,
  getDesignStyles,
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

// Protected routes
router.route('/custom-order').post(protect, submitCustomDesignOrder);
router.route('/:id/reviews').post(protect, createProductReview);

// Admin routes
router.route('/').post(protect, admin, createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;