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


router.route('/stats')
  .get(protect, admin, getOrderStats);

router.route('/daily-sales')
  .get(protect, admin, getDailySales);

router.route('/myorders')
  .get(protect, getMyOrders);

router.route('/validate')
  .post(protect, validateOrderForPayment);

router.route('/calculate-total')
  .post(protect, calculateOrderTotal);

router.route('/summary')
  .get(protect, getOrderSummary);

router.route('/estimate-delivery')
  .post(protect, estimateDeliveryDate);

router.route('/validate-promo')
  .post(protect, validatePromoCode);

router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/pay')
  .put(protect, updateOrderToPaid);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

router.route('/:id/confirm-delivery')
  .put(protect, confirmOrderDelivery);

router.route('/:id/tracking')
  .get(protect, getOrderTracking);

router.route('/:id/report-issue')
  .post(protect, reportOrderIssue);

router.route('/:id/retry-payment')
  .post(protect, retryOrderPayment);

router.route('/:id/shipping-address')
  .put(protect, updateShippingAddress);


router.route('/:id/status-check')
  .get(protect, checkOrderStatus);

module.exports = router;