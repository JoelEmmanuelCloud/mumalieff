const asyncHandler = require('express-async-handler');
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/orderModel');
const Payment = require('../models/paymentModel');

const initializePaystack = asyncHandler(async (req, res) => {
  const { email, amount, orderId, callbackUrl } = req.body;

  if (!email || !amount || !orderId) {
    res.status(400);
    throw new Error('Email, amount, and order ID are required');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const existingPayment = await Payment.findOne({ 
    order: orderId, 
    status: 'success' 
  });
  
  if (existingPayment) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  const reference = `mlf_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

  try {
    const amountInKobo = Math.round(amount * 100);
    
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountInKobo,
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

    const payment = new Payment({
      order: orderId,
      user: req.user._id,
      paymentMethod: 'paystack',
      amount: amountInKobo,
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
      data: {
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference: reference,
        amount: amountInKobo,
        public_key: process.env.PAYSTACK_PUBLIC_KEY,
      },
      paymentId: payment._id,
      message: 'Payment initialization successful',
    });
  } catch (error) {
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

const verifyPaystack = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  try {
    let payment = await Payment.findOne({ transactionReference: reference }).populate('order');
    
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
      if (!payment) {
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

        if (order.user.toString() !== req.user._id.toString()) {
          res.status(401);
          throw new Error('Not authorized');
        }

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
        payment.order = order;
      } else {
        if (payment.status !== 'success') {
          await payment.markAsSuccessful(data);
        }
      }

      const order = await Order.findById(payment.order._id || payment.order);
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
      }
      
      res.json({
        success: true,
        message: 'Payment verification successful',
        payment: payment,
        order: order,
        transaction: data,
      });
    } else {
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
    if (error.response?.status === 404) {
      res.status(404);
      throw new Error('Transaction not found');
    } else if (error.message.includes('Not authorized')) {
      res.status(401);
      throw new Error('Not authorized');
    } else if (error.message.includes('already verified')) {
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

const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (order.isPaid) {
    return res.json(order);
  }

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
  
  res.json(updatedOrder);
});

const paystackWebhook = asyncHandler(async (req, res) => {
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
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  try {
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
        break;
    }

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    res.status(500).send('Webhook processing failed');
  }
});

const handleChargeSuccess = async (data) => {
  const orderId = data.metadata?.order_id;
  const reference = data.reference;

  if (!orderId || !reference) {
    return;
  }

  try {
    let payment = await Payment.findOne({ transactionReference: reference });
    
    if (!payment) {
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
      await payment.markAsSuccessful(data);
    }

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
    }
  } catch (error) {
    // Silent error handling
  }
};

const handleDisputeCreate = async (data) => {
  const reference = data.transaction?.reference;
  
  if (reference) {
    const payment = await Payment.findOne({ transactionReference: reference });
    if (payment) {
      await payment.addWebhookEvent('charge.dispute.create', data);
      await payment.addDispute(data);
    }
  }
};

const handleDisputeRemind = async (data) => {
  const reference = data.transaction?.reference;
  
  if (reference) {
    const payment = await Payment.findOne({ transactionReference: reference });
    if (payment) {
      await payment.addWebhookEvent('charge.dispute.remind', data);
    }
  }
};

const handleDisputeResolve = async (data) => {
  const reference = data.transaction?.reference;
  
  if (reference) {
    const payment = await Payment.findOne({ transactionReference: reference });
    if (payment) {
      await payment.addWebhookEvent('charge.dispute.resolve', data);
      
      const dispute = payment.disputes.find(d => d.id === data.id);
      if (dispute) {
        dispute.status = data.status;
        dispute.resolution = data.resolution;
        dispute.resolved_at = new Date(data.resolved_at);
        await payment.save();
      }
    }
  }
};

const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  
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

const getOrderPayments = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

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