const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  cancelOrder,
  getOrderStats,
  getDailySales,
  confirmOrderDelivery,
  getOrderTracking,
  reportOrderIssue,
  retryOrderPayment,
  updateShippingAddress,
  validateOrderForPayment,
  calculateOrderTotal,
  checkOrderStatus,
  getOrderSummary,
  estimateDeliveryDate,
  validatePromoCode,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Stats route - must come before /:id
router.route('/stats')
  .get(protect, admin, getOrderStats);

// Daily sales route - must come before /:id
router.route('/daily-sales')
  .get(protect, admin, getDailySales);

// My orders route - must come before /:id
router.route('/myorders')
  .get(protect, getMyOrders);

// General routes for creating and listing orders
router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

// Specific order by ID routes
router.route('/:id')
  .get(protect, getOrderById);

// Payment route
router.route('/:id/pay')
  .put(protect, updateOrderToPaid);

// Cancel order route
router.route('/:id/cancel')
  .put(protect, cancelOrder);

// Update order status route (admin only)
router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

// NEW ROUTES - Add these missing endpoints:

// Confirm delivery route
router.route('/:id/confirm-delivery')
  .put(protect, confirmOrderDelivery);

// Get order tracking route
router.route('/:id/tracking')
  .get(protect, getOrderTracking);

// Report order issue route
router.route('/:id/report-issue')
  .post(protect, reportOrderIssue);

// Retry payment route
router.route('/:id/retry-payment')
  .post(protect, retryOrderPayment);

// Update shipping address route
router.route('/:id/shipping-address')
  .put(protect, updateShippingAddress);

// Validate order route
router.route('/validate')
  .post(protect, validateOrderForPayment);

// Calculate order total route
router.route('/calculate-total')
  .post(protect, calculateOrderTotal);

// Check order status route
router.route('/:id/status-check')
  .get(protect, checkOrderStatus);

// Get order summary route
router.route('/summary')
  .get(protect, getOrderSummary);

// Estimate delivery date route
router.route('/estimate-delivery')
  .post(protect, estimateDeliveryDate);

// Validate promo code route
router.route('/validate-promo')
  .post(protect, validatePromoCode);

module.exports = router;