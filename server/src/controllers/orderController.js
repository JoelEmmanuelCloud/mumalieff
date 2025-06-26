// server/src/controllers/orderController.js 
const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const { 
  sendOrderConfirmationEmail,
  sendShippingConfirmationEmail,
  sendDeliveryConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderStatusUpdateEmail,
  sendPaymentFailedEmail
} = require('../services/emailService');

/**
 * @desc    Create new order (UPDATED with email)
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    promoCode,
    discount,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Verify all products exist and have enough stock
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }
    
    if (product.countInStock < item.qty) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}`);
    }
  }

  // Create new order
  const order = new Order({
    orderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    promoCode,
    discount: discount || 0,
  });

  // Save the order
  const createdOrder = await order.save();

  // Update product stock count
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    product.countInStock -= item.qty;
    await product.save();
  }

  // Send order confirmation email
  try {
    await sendOrderConfirmationEmail(createdOrder, req.user);
    console.log(`Order confirmation email sent for order ${createdOrder._id}`);
  } catch (emailError) {
    console.error('Failed to send order confirmation email:', emailError);
    // Don't fail the order creation if email fails
  }

  res.status(201).json(createdOrder);
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    // Check if the order belongs to the user or if the user is an admin
    if (
      order.user._id.toString() === req.user._id.toString() ||
      req.user.isAdmin
    ) {
      res.json(order);
    } else {
      res.status(401);
      throw new Error('Not authorized to view this order');
    }
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Update order to paid (UPDATED with email)
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    const wasUnpaid = !order.isPaid;
    
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
      reference: req.body.reference,
    };

    const updatedOrder = await order.save();

    // Send payment confirmation email only if order was previously unpaid
    if (wasUnpaid) {
      try {
        await sendOrderConfirmationEmail(updatedOrder, order.user);
        console.log(`Payment confirmation email sent for order ${updatedOrder._id}`);
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }
    }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Update order status (UPDATED with email)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    const previousStatus = order.status;
    order.status = status || order.status;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    // If status is delivered, update delivery fields
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    // Send appropriate email based on status change
    try {
      if (status === 'Shipped' && previousStatus !== 'Shipped') {
        await sendShippingConfirmationEmail(updatedOrder, order.user, {
          trackingNumber: trackingNumber,
          carrier: 'Our delivery partner'
        });
        console.log(`Shipping confirmation email sent for order ${updatedOrder._id}`);
      } else if (status === 'Delivered' && previousStatus !== 'Delivered') {
        await sendDeliveryConfirmationEmail(updatedOrder, order.user);
        console.log(`Delivery confirmation email sent for order ${updatedOrder._id}`);
      } else if (status !== previousStatus) {
        await sendOrderStatusUpdateEmail(updatedOrder, order.user, previousStatus, status);
        console.log(`Order status update email sent for order ${updatedOrder._id}`);
      }
    } catch (emailError) {
      console.error('Failed to send order status email:', emailError);
    }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});


/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const count = await Order.countDocuments({ user: req.user._id });
  
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    totalOrders: count,
  });
});

/**
 * @desc    Get all orders with enhanced filtering
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getOrders = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  
  // Build query based on filters
  const query = {};
  
  // Filter by user ID (for the user-specific orders link)
  if (req.query.userId) {
    query.user = req.query.userId;
  }
  
  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Filter by payment status
  if (req.query.isPaid === 'true') {
    query.isPaid = true;
  } else if (req.query.isPaid === 'false') {
    query.isPaid = false;
  }
  
  // Filter by delivery status
  if (req.query.isDelivered === 'true') {
    query.isDelivered = true;
  } else if (req.query.isDelivered === 'false') {
    query.isDelivered = false;
  }
  
  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const count = await Order.countDocuments(query);
  
  const orders = await Order.find(query)
    .populate('user', 'id name email')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    totalOrders: count,
  });
});

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the order belongs to the user or if the user is an admin
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Check if order can be cancelled
  if (order.status !== 'Pending' && order.status !== 'Processing') {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }

  // Update order status
  order.status = 'Cancelled';
  order.cancellationReason = reason || 'Customer requested cancellation';
  
  // Restore product inventory
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.countInStock += item.qty;
      await product.save();
    }
  }

  const updatedOrder = await order.save();

  // Send cancellation confirmation email
  try {
    await sendOrderCancellationEmail(updatedOrder, order.user, reason);
    console.log(`Order cancellation email sent for order ${updatedOrder._id}`);
  } catch (emailError) {
    console.error('Failed to send order cancellation email:', emailError);
  }

  res.json(updatedOrder);
});

/**
 * @desc    Get order statistics
 * @route   GET /api/orders/stats
 * @access  Private/Admin
 */
const getOrderStats = asyncHandler(async (req, res) => {
  try {
    
    // Total orders count
    const totalOrders = await Order.countDocuments({});
  
    // Total sales - handle empty result with better error handling
    let totalSales = 0;
    try {
      const totalSalesResult = await Order.aggregate([
        {
          $match: {
            isPaid: true // Only count paid orders for sales
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' },
          },
        },
      ]);
      
      totalSales = totalSalesResult.length > 0 ? Number(totalSalesResult[0].total) || 0 : 0;
 
    } catch (salesError) {
      console.error('Error calculating total sales:', salesError);
      totalSales = 0;
    }
    
    // Orders by status with better error handling
    let ordersByStatus = [];
    try {
      ordersByStatus = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 } // Sort by count descending
        }
      ]);
    
    } catch (statusError) {
      console.error('Error calculating orders by status:', statusError);
      ordersByStatus = [];
    }
    
    // Last 7 days sales with improved date handling
    let salesLastWeek = [];
    try {
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      lastWeekStart.setHours(0, 0, 0, 0); // Start of day
      
      
      salesLastWeek = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: lastWeekStart },
            isPaid: true,
          },
        },
        {
          $group: {
            _id: { 
              $dateToString: { 
                format: '%Y-%m-%d', 
                date: '$createdAt' 
              } 
            },
            sales: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
    
    } catch (weekError) {
      console.error('Error calculating weekly sales:', weekError);
      salesLastWeek = [];
    }
    
    // Ensure we have default values if no data exists
    const stats = {
      totalOrders: Number(totalOrders) || 0,
      totalSales: Number(totalSales) || 0,
      ordersByStatus: Array.isArray(ordersByStatus) ? ordersByStatus : [],
      salesLastWeek: Array.isArray(salesLastWeek) ? salesLastWeek : [],
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Error in getOrderStats:', error);
    console.error('Error stack:', error.stack);
    res.status(500);
    throw new Error(`Failed to fetch order statistics: ${error.message}`);
  }
});

/**
 * @desc    Get daily sales data
 * @route   GET /api/orders/daily-sales
 * @access  Private/Admin
 */
const getDailySales = asyncHandler(async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    
    // Calculate the start date based on the number of days requested
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Start of day

    
    // Get daily sales data with improved error handling
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPaid: true, // Only count paid orders for sales
        },
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$createdAt'
              // Remove timezone specification to use local time
            } 
          },
          sales: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    
    // Create a complete array with all days, filling in missing days with 0 values
    const completeSalesData = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < days; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const existingData = dailySalesData.find(item => item._id === dateString);
      
      // Format day name for display
      const dayName = days <= 7 
        ? currentDate.toLocaleDateString('en-US', { weekday: 'short' })
        : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      completeSalesData.push({
        day: dayName,
        date: dateString,
        sales: existingData ? Number(existingData.sales) || 0 : 0,
        orders: existingData ? Number(existingData.orders) || 0 : 0,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // If requesting more than 7 days, group by weeks
    if (days > 7) {
      const weeklyData = [];
      const weekSize = 7;
      
      for (let i = 0; i < completeSalesData.length; i += weekSize) {
        const weekData = completeSalesData.slice(i, i + weekSize);
        const weekNumber = Math.floor(i / weekSize) + 1;
        
        const weekSummary = {
          day: `Week ${weekNumber}`,
          sales: weekData.reduce((sum, day) => sum + day.sales, 0),
          orders: weekData.reduce((sum, day) => sum + day.orders, 0),
        };
        
        weeklyData.push(weekSummary);
      }
      
      
      return res.json(weeklyData);
    }
    
    
    res.json(completeSalesData);
    
  } catch (error) {
    console.error('Error in getDailySales:', error);
    console.error('Error stack:', error.stack);
    res.status(500);
    throw new Error(`Failed to fetch daily sales data: ${error.message}`);
  }
});

module.exports = {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  cancelOrder,
  getOrderStats,
  getDailySales, 
};