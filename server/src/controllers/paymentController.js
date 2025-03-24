const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Order = require('../models/orderModel');

/**
 * @desc    Initialize Paystack payment
 * @route   POST /api/payments/paystack/initialize
 * @access  Private
 */
const initializePaystack = asyncHandler(async (req, res) => {
  const { email, amount, orderId, callbackUrl } = req.body;

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

  // Check if order is already paid
  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  try {
    // Initialize Paystack transaction
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Paystack uses kobo (smallest currency unit)
        callback_url: callbackUrl,
        metadata: {
          order_id: orderId,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: orderId,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    res.status(500);
    throw new Error('Failed to initialize payment');
  }
});

/**
 * @desc    Verify Paystack payment
 * @route   GET /api/payments/paystack/verify/:reference
 * @access  Private
 */
const verifyPaystack = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  try {
    // Verify transaction with Paystack
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
      // Extract order ID from metadata
      const orderId = data.metadata?.order_id;

      if (!orderId) {
        res.status(400);
        throw new Error('Order ID not found in transaction metadata');
      }

      // Update order payment status
      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404);
        throw new Error('Order not found');
      }

      if (order.isPaid) {
        return res.json({ message: 'Order is already paid' });
      }

      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: data.id,
        status: data.status,
        update_time: new Date().toISOString(),
        email_address: data.customer.email,
        reference: data.reference,
      };

      const updatedOrder = await order.save();
      
      res.json({
        message: 'Payment successful',
        order: updatedOrder,
      });
    } else {
      res.status(400);
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    res.status(500);
    throw new Error('Failed to verify payment');
  }
});

/**
 * @desc    Handle Paystack webhook
 * @route   POST /api/payments/paystack/webhook
 * @access  Public
 */
const paystackWebhook = asyncHandler(async (req, res) => {
  // Verify the event is from Paystack
  const hash = req.headers['x-paystack-signature'];
  
  // In production, you should verify the signature
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const computedHash = crypto
    .createHmac('sha512', secretKey)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== computedHash) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  // Handle the event
  if (event.event === 'charge.success') {
    const { data } = event;
    const orderId = data.metadata?.order_id;

    if (orderId) {
      const order = await Order.findById(orderId);

      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: data.id,
          status: data.status,
          update_time: new Date().toISOString(),
          email_address: data.customer.email,
          reference: data.reference,
        };

        await order.save();
      }
    }
  }

  // Acknowledge receipt of webhook
  res.sendStatus(200);
});

module.exports = {
  initializePaystack,
  verifyPaystack,
  paystackWebhook,
};