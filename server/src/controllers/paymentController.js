const asyncHandler = require('express-async-handler');
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/orderModel');
const Payment = require('../models/paymentModel');

/**
 * @desc    Initialize Paystack payment - FIXED VERSION
 * @route   POST /api/payments/paystack/initialize
 * @access  Private
 */
const initializePaystack = asyncHandler(async (req, res) => {
  const { email, amount, orderId, callbackUrl } = req.body;

  console.log('Initialize payment request:', { email, amount, orderId });

  // Validate required fields
  if (!email || !amount || !orderId) {
    res.status(400);
    throw new Error('Email, amount, and order ID are required');
  }

  // Verify the order exists and belongs to the user
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Check if order already has a successful payment
  const existingPayment = await Payment.findOne({ 
    order: orderId, 
    status: 'success' 
  });
  
  if (existingPayment) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  // Generate unique reference
  const reference = `mlf_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

  try {
    console.log('Initializing with Paystack API...');
    
    // FIXED: Ensure amount is in kobo and properly formatted
    const amountInKobo = Math.round(amount * 100);
    
    // Initialize Paystack transaction
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountInKobo, // Paystack uses kobo
        reference,
        callback_url: callbackUrl || `${req.protocol}://${req.get('host')}/order/${orderId}`,
        metadata: {
          order_id: orderId,
          user_id: req.user._id.toString(),
          order_number: order.orderNumber,
          customer_name: req.user.name,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: orderId,
            },
            {
              display_name: 'Customer',
              variable_name: 'customer_name',
              value: req.user.name,
            },
            {
              display_name: 'Order Number',
              variable_name: 'order_number',
              value: order.orderNumber || orderId.slice(-8),
            },
          ],
        },
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Paystack API response:', response.data);

    // Create payment record
    const payment = new Payment({
      order: orderId,
      user: req.user._id,
      paymentMethod: 'paystack',
      amount: amountInKobo, // Store in kobo for consistency
      currency: 'NGN',
      status: 'pending',
      transactionReference: reference,
      customerEmail: email,
      customerPhone: req.user.phone,
      initiatedAt: new Date(),
    });

    await payment.save();

    console.log('Payment record created:', payment._id);

    // FIXED: Return the correct response structure
    res.json({
      success: true,
      data: {
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference: reference,
        amount: amountInKobo,
        public_key: process.env.PAYSTACK_PUBLIC_KEY, // Include public key for frontend
      },
      paymentId: payment._id,
      message: 'Payment initialization successful',
    });
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    
    // More specific error handling
    if (error.response?.status === 400) {
      res.status(400);
      throw new Error(error.response.data.message || 'Invalid payment data');
    } else if (error.response?.status === 401) {
      res.status(500);
      throw new Error('Payment gateway authentication failed');
    } else {
      res.status(500);
      throw new Error('Failed to initialize payment');
    }
  }
});

/**
 * @desc    Verify Paystack payment with enhanced fallback - FIXED VERSION
 * @route   GET /api/payments/paystack/verify/:reference
 * @access  Private
 */
const verifyPaystack = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  console.log('Verifying payment reference:', reference);

  try {
    // First, try to find the payment record
    let payment = await Payment.findOne({ transactionReference: reference }).populate('order');
    
    // Always verify with Paystack regardless of local payment status
    console.log('Verifying with Paystack API...');
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { data } = paystackResponse.data;
    console.log('Paystack verification result:', data.status, data.gateway_response);

    if (data.status === 'success') {
      // Find or create payment record
      if (!payment) {
        console.log('Payment record not found, creating from Paystack data...');
        
        // Extract order ID from metadata
        const orderId = data.metadata?.order_id;
        
        if (!orderId) {
          res.status(400);
          throw new Error('Order ID not found in payment metadata');
        }

        const order = await Order.findById(orderId);
        if (!order) {
          res.status(404);
          throw new Error('Order not found');
        }

        // Verify the order belongs to the authenticated user
        if (order.user.toString() !== req.user._id.toString()) {
          res.status(401);
          throw new Error('Not authorized');
        }

        // Create payment record retroactively
        payment = new Payment({
          order: orderId,
          user: req.user._id,
          paymentMethod: 'paystack',
          amount: data.amount,
          currency: 'NGN',
          status: 'success',
          transactionReference: reference,
          customerEmail: data.customer.email,
          customerPhone: data.customer.phone,
          initiatedAt: new Date(data.created_at),
          paidAt: new Date(data.paid_at),
          paymentGatewayResponse: data,
        });

        await payment.save();
        payment.order = order; // Populate for response
      } else {
        // Update existing payment record
        if (payment.status !== 'success') {
          await payment.markAsSuccessful(data);
        }
      }

      // Update order payment status
      const order = await Order.findById(payment.order._id || payment.order);
      if (order && !order.isPaid) {
        console.log('Updating order payment status...');
        
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentMethod = 'paystack';
        order.paymentReference = reference;
        order.paymentResult = {
          id: data.id,
          status: data.status,
          update_time: new Date().toISOString(),
          email_address: data.customer.email,
          reference: data.reference,
          channel: data.channel,
          amount: data.amount,
          fees: data.fees,
        };

        await order.save();
        console.log('Order payment status updated successfully');
      }
      
      // FIXED: Return consistent response structure
      res.json({
        success: true,
        message: 'Payment verification successful',
        payment: payment,
        order: order,
        transaction: data,
      });
    } else {
      // Payment failed
      if (payment && payment.status !== 'failed') {
        await payment.markAsFailed(
          data.gateway_response || 'Payment verification failed',
          data.gateway_response
        );
      }
      
      res.status(400);
      throw new Error(`Payment verification failed: ${data.gateway_response || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    
    // Enhanced error handling
    if (error.response?.status === 404) {
      res.status(404);
      throw new Error('Transaction not found');
    } else if (error.message.includes('Not authorized')) {
      res.status(401);
      throw new Error('Not authorized');
    } else if (error.message.includes('already verified')) {
      // This is okay, return success
      const payment = await Payment.findOne({ transactionReference: reference }).populate('order');
      res.json({
        success: true,
        message: 'Payment already verified',
        payment: payment,
        order: payment?.order,
      });
    } else {
      res.status(500);
      throw new Error(error.message || 'Failed to verify payment');
    }
  }
});

/**
 * @desc    Handle direct payment update (for orders without payment records) - IMPROVED
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if order belongs to user or if user is admin
  if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Prevent duplicate payment updates
  if (order.isPaid) {
    return res.json(order);
  }

  console.log('Updating order to paid status:', order._id);

  // Update order payment information
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id || req.body.reference,
    status: req.body.status || 'success',
    update_time: req.body.update_time || new Date().toISOString(),
    email_address: req.body.email_address || order.user?.email,
    reference: req.body.reference,
    channel: req.body.channel || 'paystack',
    amount: req.body.amount || order.totalPrice * 100,
    fees: req.body.fees || 0,
  };

  if (req.body.reference) {
    order.paymentReference = req.body.reference;
  }

  const updatedOrder = await order.save();
  console.log('Order payment status updated successfully');
  
  res.json(updatedOrder);
});

/**
 * @desc    Handle Paystack webhook - ENHANCED
 * @route   POST /api/payments/paystack/webhook
 * @access  Public
 */
const paystackWebhook = asyncHandler(async (req, res) => {
  // Verify the event is from Paystack
  const hash = req.headers['x-paystack-signature'];
  
  if (!hash) {
    return res.status(401).send('No signature provided');
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const computedHash = crypto
    .createHmac('sha512', secretKey)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== computedHash) {
    console.log('Webhook signature verification failed');
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  console.log(`Webhook received: ${event.event}`);

  try {
    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;
      
      case 'charge.dispute.create':
        await handleDisputeCreate(event.data);
        break;
      
      case 'charge.dispute.remind':
        await handleDisputeRemind(event.data);
        break;
      
      case 'charge.dispute.resolve':
        await handleDisputeResolve(event.data);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    // Acknowledge receipt of webhook
    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Helper function to handle successful charge - ENHANCED
const handleChargeSuccess = async (data) => {
  const orderId = data.metadata?.order_id;
  const reference = data.reference;

  console.log('Processing successful charge webhook:', { orderId, reference });

  if (!orderId || !reference) {
    console.log('Missing order ID or reference in webhook data');
    return;
  }

  try {
    // Find or create payment record
    let payment = await Payment.findOne({ transactionReference: reference });
    
    if (!payment) {
      console.log('Creating payment record from webhook...');
      const order = await Order.findById(orderId);
      if (order) {
        payment = new Payment({
          order: orderId,
          user: order.user,
          paymentMethod: 'paystack',
          amount: data.amount,
          currency: 'NGN',
          status: 'success',
          transactionReference: reference,
          customerEmail: data.customer.email,
          customerPhone: data.customer.phone,
          initiatedAt: new Date(data.created_at),
          paidAt: new Date(data.paid_at),
          paymentGatewayResponse: data,
        });
        
        await payment.save();
        console.log('Payment record created from webhook');
      }
    } else if (payment.status !== 'success') {
      // Update existing payment record
      await payment.markAsSuccessful(data);
      console.log('Payment record updated from webhook');
    }

    // Update order
    const order = await Order.findById(orderId);
    if (order && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentMethod = 'paystack';
      order.paymentReference = reference;
      order.paymentResult = {
        id: data.id,
        status: data.status,
        update_time: new Date().toISOString(),
        email_address: data.customer.email,
        reference: data.reference,
        channel: data.channel,
        amount: data.amount,
        fees: data.fees,
      };
      await order.save();
      
      console.log(`Order ${orderId} marked as paid via webhook`);
    }
  } catch (error) {
    console.error('Error handling charge success webhook:', error);
  }
};

// Helper functions for other webhook events (unchanged)
const handleDisputeCreate = async (data) => {
  const reference = data.transaction?.reference;
  
  if (reference) {
    const payment = await Payment.findOne({ transactionReference: reference });
    if (payment) {
      await payment.addWebhookEvent('charge.dispute.create', data);
      await payment.addDispute(data);
      console.log(`Dispute created for payment ${reference}`);
    }
  }
};

const handleDisputeRemind = async (data) => {
  const reference = data.transaction?.reference;
  
  if (reference) {
    const payment = await Payment.findOne({ transactionReference: reference });
    if (payment) {
      await payment.addWebhookEvent('charge.dispute.remind', data);
      console.log(`Dispute reminder for payment ${reference}`);
    }
  }
};

const handleDisputeResolve = async (data) => {
  const reference = data.transaction?.reference;
  
  if (reference) {
    const payment = await Payment.findOne({ transactionReference: reference });
    if (payment) {
      await payment.addWebhookEvent('charge.dispute.resolve', data);
      
      // Update dispute in payment record
      const dispute = payment.disputes.find(d => d.id === data.id);
      if (dispute) {
        dispute.status = data.status;
        dispute.resolution = data.resolution;
        dispute.resolved_at = new Date(data.resolved_at);
        await payment.save();
      }
      
      console.log(`Dispute resolved for payment ${reference}: ${data.resolution}`);
    }
  }
};


/**
 * @desc    Get payment history for user
 * @route   GET /api/payments/history
 * @access  Private
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  
  // Build filter
  const filter = { user: req.user._id };
  
  if (status) {
    filter.status = status;
  }
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const payments = await Payment.find(filter)
    .populate('order', 'orderNumber totalPrice createdAt orderItems')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(filter);

  res.json({
    success: true,
    data: payments,
    pagination: {
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
      total,
    },
  });
});

/**
 * @desc    Get payments for a specific order
 * @route   GET /api/payments/order/:orderId
 * @access  Private
 */
const getOrderPayments = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Verify order belongs to user
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const payments = await Payment.find({ order: orderId }).sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: payments,
  });
});

/**
 * @desc    Get payment analytics (Admin only)
 * @route   GET /api/payments/analytics
 * @access  Private/Admin
 */
const getPaymentAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const [statusAnalytics, channelAnalytics] = await Promise.all([
    Payment.getAnalytics(start, end),
    Payment.getChannelAnalytics(start, end),
  ]);

  res.json({
    success: true,
    data: {
      statusBreakdown: statusAnalytics,
      channelBreakdown: channelAnalytics,
      period: {
        start,
        end,
      },
    },
  });
});

module.exports = {
  initializePaystack,
  verifyPaystack,
  updateOrderToPaid,
  paystackWebhook,
  getPaymentHistory,
  getOrderPayments,
  getPaymentAnalytics,
};