const asyncHandler = require('express-async-handler');
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/orderModel');
const Payment = require('../models/paymentModel');

/**
 * @desc    Initialize Paystack payment
 * @route   POST /api/payments/paystack/initialize
 * @access  Private
 */
const initializePaystack = asyncHandler(async (req, res) => {
  const { email, amount, orderId, callbackUrl } = req.body;

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
    // Initialize Paystack transaction
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Paystack uses kobo (smallest currency unit)
        reference,
        callback_url: callbackUrl,
        metadata: {
          order_id: orderId,
          user_id: req.user._id.toString(),
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
          ],
        },
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'], // Enable all channels
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Create payment record
    const payment = new Payment({
      order: orderId,
      user: req.user._id,
      paymentMethod: 'paystack',
      amount: amount * 100, // Store in kobo
      currency: 'NGN',
      status: 'pending',
      transactionReference: reference,
      customerEmail: email,
      customerPhone: req.user.phone,
      initiatedAt: new Date(),
    });

    await payment.save();

    res.json({
      success: true,
      data: response.data.data,
      paymentId: payment._id,
      message: 'Payment initialization successful',
    });
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    res.status(500);
    throw new Error('Failed to initialize payment');
  }
});

/**
 * @desc    Verify Paystack payment with fallback
 * @route   GET /api/payments/paystack/verify/:reference
 * @access  Private
 */
const verifyPaystack = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  try {
    // First, try to find the payment record
    let payment = await Payment.findOne({ transactionReference: reference }).populate('order');
    
    // If no payment record found, try to find by order and create one
    if (!payment) {
      console.log('Payment record not found, attempting to verify directly with Paystack...');
      
      // Verify with Paystack directly
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

      if (data.status === 'success') {
        // Find the order from metadata
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

        // Update order payment status
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

        return res.json({
          success: true,
          message: 'Payment verification successful',
          payment: payment,
          order: order,
          transaction: data,
        });
      } else {
        res.status(400);
        throw new Error(`Payment verification failed: ${data.gateway_response || 'Unknown error'}`);
      }
    }

    // If payment record exists, verify the payment belongs to the authenticated user
    if (payment.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    // If already successful, return existing data
    if (payment.status === 'success') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        payment: payment,
        order: payment.order,
      });
    }

    // Verify transaction with Paystack for pending payments
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { data } = response.data;

    if (data.status === 'success') {
      // Update payment record
      await payment.markAsSuccessful(data);

      // Update order payment status
      const order = await Order.findById(payment.order);
      if (!order) {
        res.status(404);
        throw new Error('Order not found');
      }

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
      
      res.json({
        success: true,
        message: 'Payment verification successful',
        payment: payment,
        order: order,
        transaction: data,
      });
    } else {
      // Mark payment as failed
      await payment.markAsFailed(
        data.gateway_response || 'Payment verification failed',
        data.gateway_response
      );
      
      res.status(400);
      throw new Error(`Payment verification failed: ${data.gateway_response || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    
    // If it's an axios error, check if it's due to invalid reference
    if (error.response?.status === 404) {
      res.status(404);
      throw new Error('Transaction not found');
    }
    
    // If payment record not found error, provide better message
    if (error.message.includes('Payment record not found')) {
      res.status(404);
      throw new Error('Payment record not found');
    }
    
    res.status(500);
    throw new Error(error.message || 'Failed to verify payment');
  }
});

/**
 * @desc    Handle direct payment update (for orders without payment records)
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

  // Update order payment information
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.email_address,
    reference: req.body.reference,
    channel: req.body.channel,
    amount: req.body.amount,
    fees: req.body.fees,
  };

  if (req.body.reference) {
    order.paymentReference = req.body.reference;
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

/**
 * @desc    Handle Paystack webhook
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

// Helper function to handle successful charge
const handleChargeSuccess = async (data) => {
  const orderId = data.metadata?.order_id;
  const reference = data.reference;

  if (!orderId || !reference) {
    console.log('Missing order ID or reference in webhook data');
    return;
  }

  try {
    // Find payment record or create one if it doesn't exist
    let payment = await Payment.findOne({ transactionReference: reference });
    
    if (!payment) {
      // Create payment record from webhook data
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
      }
    } else if (payment.status !== 'success') {
      // Update existing payment record
      await payment.markAsSuccessful(data);
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

// Helper functions for other webhook events
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