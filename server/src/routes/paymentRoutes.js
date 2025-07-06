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

router.post('/paystack/initialize', protect, initializePaystack);

router.get('/paystack/verify/:reference', protect, verifyPaystack);

router.post('/paystack/webhook', 
  express.raw({ type: 'application/json' }),
  webhookRateLimit(),
  webhookTimeout(30000),
  (req, res, next) => {
    try {
      const rawBody = req.body.toString();
      req.body = JSON.parse(rawBody);
      req.rawBody = rawBody;
      next();
    } catch (error) {
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

router.get('/history', protect, getPaymentHistory);

router.get('/order/:orderId', protect, getOrderPayments);

router.get('/analytics', protect, admin, getPaymentAnalytics);

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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

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
    
    const paymentData = {
      email: req.user.email,
      amount: order.totalPrice,
      orderId: order._id,
      callbackUrl: `${req.protocol}://${req.get('host')}/order/${order._id}`
    };
    
    req.body = paymentData;
    await initializePaystack(req, res);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retry payment'
    });
  }
});

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
    res.status(500).json({
      success: false,
      message: 'Failed to cancel payment'
    });
  }
});

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