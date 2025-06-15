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
const {
  verifyPaystackWebhookWithRawBody,
  rawBodyParser,
  logWebhookEvent,
  validateWebhookEvent,
  webhookTimeout,
  webhookRateLimit
} = require('../middleware/webhookMiddleware');

// @desc    Initialize Paystack payment
// @route   POST /api/payments/paystack/initialize
// @access  Private
router.post('/paystack/initialize', protect, initializePaystack);

// @desc    Verify Paystack payment
// @route   GET /api/payments/paystack/verify/:reference
// @access  Private
router.get('/paystack/verify/:reference', protect, verifyPaystack);

// @desc    Handle Paystack webhook
// @route   POST /api/payments/paystack/webhook
// @access  Public (but verified via signature)
// Note: Webhook route should use raw body parser and signature verification
router.post('/paystack/webhook', 
  express.raw({ type: 'application/json' }), // Parse as raw buffer first
  webhookRateLimit(),
  webhookTimeout(30000),
  (req, res, next) => {
    // Convert buffer to string and parse JSON
    try {
      const rawBody = req.body.toString();
      req.body = JSON.parse(rawBody);
      req.rawBody = rawBody;
      next();
    } catch (error) {
      console.error('Error parsing webhook body:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON body'
      });
    }
  },
  verifyPaystackWebhookWithRawBody,
  logWebhookEvent,
  validateWebhookEvent,
  paystackWebhook
);

// @desc    Get payment history for logged in user
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, getPaymentHistory);

// @desc    Get payments for a specific order
// @route   GET /api/payments/order/:orderId
// @access  Private
router.get('/order/:orderId', protect, getOrderPayments);

// @desc    Get payment analytics (Admin only)
// @route   GET /api/payments/analytics
// @access  Private/Admin
router.get('/analytics', protect, admin, getPaymentAnalytics);

// @desc    Get payment statistics (Admin only)
// @route   GET /api/payments/stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const Payment = require('../models/paymentModel');
    
    const [statusStats, channelStats, revenueStats] = await Promise.all([
      Payment.getAnalytics(start, end),
      Payment.getChannelAnalytics(start, end),
      Payment.getRevenueAnalytics(start, end),
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: statusStats,
        channelBreakdown: channelStats,
        revenueData: revenueStats,
        period: { start, end },
      },
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

// @desc    Retry failed payment
// @route   POST /api/payments/retry/:orderId
// @access  Private
router.post('/retry/:orderId', protect, async (req, res) => {
  try {
    const Order = require('../models/orderModel');
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }
    
    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot retry payment for cancelled order'
      });
    }
    
    // Initialize new payment
    const paymentData = {
      email: req.user.email,
      amount: order.totalPrice,
      orderId: order._id,
      callbackUrl: `${req.protocol}://${req.get('host')}/order/${order._id}`
    };
    
    // Use the existing initialize payment function
    req.body = paymentData;
    await initializePaystack(req, res);
    
  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry payment'
    });
  }
});

// @desc    Cancel payment
// @route   POST /api/payments/cancel/:orderId
// @access  Private
router.post('/cancel/:orderId', protect, async (req, res) => {
  try {
    const Payment = require('../models/paymentModel');
    const payment = await Payment.findOne({ 
      order: req.params.orderId,
      user: req.user._id,
      status: 'pending'
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No pending payment found for this order'
      });
    }
    
    payment.status = 'cancelled';
    payment.abandonedAt = new Date();
    await payment.save();
    
    res.json({
      success: true,
      message: 'Payment cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel payment'
    });
  }
});

// @desc    Get payment methods/channels
// @route   GET /api/payments/methods
// @access  Public
router.get('/methods', (req, res) => {
  const paymentMethods = [
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Pay with your Visa, Mastercard, or Verve card',
      icon: 'credit-card',
      enabled: true
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: 'bank',
      enabled: true
    },
    {
      id: 'ussd',
      name: 'USSD',
      description: 'Pay with USSD code from your phone',
      icon: 'phone',
      enabled: true
    },
    {
      id: 'qr',
      name: 'QR Code',
      description: 'Scan QR code to pay',
      icon: 'qr-code',
      enabled: true
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'Pay with mobile money',
      icon: 'mobile',
      enabled: true
    }
  ];
  
  res.json({
    success: true,
    data: paymentMethods
  });
});

module.exports = router;