const express = require('express');
const router = express.Router();
const {
  initializePaystack,
  verifyPaystack,
  paystackWebhook,
  getPaymentHistory,
  getOrderPayments,
  getPaymentAnalytics,
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Paystack routes
router.route('/paystack/initialize').post(protect, initializePaystack);
router.route('/paystack/verify/:reference').get(protect, verifyPaystack);
router.route('/paystack/webhook').post(paystackWebhook);

// Payment history and analytics
router.route('/history').get(protect, getPaymentHistory);
router.route('/order/:orderId').get(protect, getOrderPayments);
router.route('/analytics').get(protect, admin, getPaymentAnalytics);

module.exports = router;