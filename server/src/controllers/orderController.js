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
 * @desc    Get daily sales data (FIXED VERSION)
 * @route   GET /api/orders/daily-sales
 * @access  Private/Admin
 */
const getDailySales = asyncHandler(async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    
    console.log(`Getting daily sales for ${days} days`);
    
    // Calculate dates in Lagos timezone to match your data
    const lagosTime = new Date().toLocaleString("en-US", {timeZone: "Africa/Lagos"});
    const today = new Date(lagosTime);
    
    // Calculate the start date - go back (days-1) to include today
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    
    // End date is end of today
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    console.log('Date range:', { startDate, endDate });
    console.log('Lagos time now:', today);
    
    // Get daily sales data - using createdAt directly without timezone conversion
    // since your data is already stored with proper timestamps
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isPaid: true, // Only count paid orders for sales
        },
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$createdAt'
              // Remove timezone conversion - let it use the stored timezone
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
    
    console.log('Raw sales data from DB:', dailySalesData);
    
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
    
    console.log('Complete sales data:', completeSalesData);
    
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
      
      console.log('Weekly data:', weeklyData);
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


/**
 * @desc    Confirm order delivery (UPDATED)
 * @route   PUT /api/orders/:id/confirm-delivery
 * @access  Private
 */
const confirmOrderDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the order belongs to the user
  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Check if order is marked as delivered by admin
  if (order.status !== 'Delivered') {
    res.status(400);
    throw new Error('Order is not marked as delivered yet');
  }

  // Check if already confirmed by customer
  if (order.deliveryConfirmedByCustomer) {
    res.status(400);
    throw new Error('Delivery has already been confirmed');
  }

  // Update delivery confirmation
  order.deliveryConfirmedByCustomer = true;
  order.customerDeliveryConfirmedAt = Date.now();
  order.notes = order.notes 
    ? `${order.notes}. Customer confirmed delivery on ${new Date().toISOString()}.` 
    : `Customer confirmed delivery on ${new Date().toISOString()}.`;

  const updatedOrder = await order.save();

  // Optional: Send confirmation email to admin or update analytics
  try {
    // You can add email notification logic here
    console.log(`Customer confirmed delivery for order ${updatedOrder.orderNumber}`);
  } catch (emailError) {
    console.error('Failed to send delivery confirmation notification:', emailError);
  }

  res.json({
    message: 'Delivery confirmed successfully',
    order: updatedOrder
  });
});

/**
 * @desc    Get order tracking information
 * @route   GET /api/orders/:id/tracking
 * @access  Private
 */
const getOrderTracking = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the order belongs to the user or if the user is an admin
  if (
    order.user.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Return tracking information
  const trackingInfo = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
    isDelivered: order.isDelivered,
    deliveredAt: order.deliveredAt,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    // You can add more tracking details here based on your logistics provider
    trackingEvents: [
      { 
        status: 'Order Placed', 
        date: order.createdAt,
        description: 'Your order has been placed successfully'
      },
      ...(order.isPaid ? [{
        status: 'Payment Confirmed',
        date: order.paidAt,
        description: 'Payment has been confirmed'
      }] : []),
      ...(order.status === 'Processing' ? [{
        status: 'Processing',
        date: order.updatedAt,
        description: 'Your order is being processed'
      }] : []),
      ...(order.status === 'Shipped' ? [{
        status: 'Shipped',
        date: order.updatedAt,
        description: `Your order has been shipped${order.trackingNumber ? ` with tracking number ${order.trackingNumber}` : ''}`
      }] : []),
      ...(order.isDelivered ? [{
        status: 'Delivered',
        date: order.deliveredAt,
        description: 'Your order has been delivered'
      }] : [])
    ]
  };

  res.json(trackingInfo);
});

/**
 * @desc    Report order issue
 * @route   POST /api/orders/:id/report-issue
 * @access  Private
 */
const reportOrderIssue = asyncHandler(async (req, res) => {
  const { type, description } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the order belongs to the user
  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (!type || !description) {
    res.status(400);
    throw new Error('Issue type and description are required');
  }

  // Add issue to order notes
  const issueNote = `ISSUE REPORTED - Type: ${type}, Description: ${description}, Reported on: ${new Date().toISOString()}`;
  order.notes = order.notes ? `${order.notes}\n${issueNote}` : issueNote;

  await order.save();

  // Here you could also create a separate Issue model or send email to admin
  // For now, we'll just update the order notes

  res.json({
    message: 'Issue reported successfully. Our team will contact you soon.',
    order
  });
});

/**
 * @desc    Retry order payment
 * @route   POST /api/orders/:id/retry-payment
 * @access  Private
 */
const retryOrderPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the order belongs to the user
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Check if order is already paid
  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  // Check if order can accept payment
  if (!['Pending', 'Processing'].includes(order.status)) {
    res.status(400);
    throw new Error('Payment cannot be retried for this order status');
  }

  // Return order details for payment processing
  res.json({
    message: 'Payment retry initiated',
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      user: order.user,
      orderItems: order.orderItems
    }
  });
});

/**
 * @desc    Update shipping address
 * @route   PUT /api/orders/:id/shipping-address
 * @access  Private
 */
const updateShippingAddress = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the order belongs to the user
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Check if order status allows address change
  if (order.status !== 'Pending') {
    res.status(400);
    throw new Error('Shipping address can only be updated for pending orders');
  }

  // Validate shipping address
  if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
    res.status(400);
    throw new Error('Complete shipping address is required');
  }

  // Update shipping address
  order.shippingAddress = {
    address: shippingAddress.address,
    city: shippingAddress.city,
    state: shippingAddress.state,
    postalCode: shippingAddress.postalCode,
    country: shippingAddress.country || 'Nigeria'
  };

  const updatedOrder = await order.save();

  res.json({
    message: 'Shipping address updated successfully',
    order: updatedOrder
  });
});

/**
 * @desc    Validate order for payment
 * @route   POST /api/orders/validate
 * @access  Private
 */
const validateOrderForPayment = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  if (!shippingAddress) {
    res.status(400);
    throw new Error('Shipping address is required');
  }

  // Validate all products exist and have enough stock
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.name}`);
    }
    
    if (product.countInStock < item.qty) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}`);
    }
  }

  res.json({
    message: 'Order validation successful',
    valid: true
  });
});

/**
 * @desc    Calculate order total
 * @route   POST /api/orders/calculate-total
 * @access  Private
 */
const calculateOrderTotal = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, promoCode } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Calculate items total
  let itemsPrice = 0;
  for (const item of orderItems) {
    itemsPrice += item.price * item.qty;
  }

  // Calculate shipping (simple logic - can be enhanced)
  const shippingPrice = itemsPrice > 50000 ? 0 : 2500; // Free shipping over ₦50,000

  // Calculate tax (if applicable)
  const taxPrice = 0; // No tax in your current setup

  // Apply discount (simple promo code logic)
  let discount = 0;
  if (promoCode) {
    // You can implement promo code validation here
    // For now, just a simple example
    if (promoCode === 'WELCOME10') {
      discount = itemsPrice * 0.1; // 10% discount
    }
  }

  const totalPrice = itemsPrice + shippingPrice + taxPrice - discount;

  res.json({
    itemsPrice,
    shippingPrice,
    taxPrice,
    discount,
    totalPrice,
    promoCodeValid: promoCode ? true : false
  });
});

/**
 * @desc    Check order status
 * @route   GET /api/orders/:id/status-check
 * @access  Private
 */
const checkOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if the order belongs to the user or if the user is an admin
  if (
    order.user.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error('Not authorized');
  }

  res.json({
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    isPaid: order.isPaid,
    isDelivered: order.isDelivered,
    canBeCancelled: ['Pending', 'Processing'].includes(order.status)
  });
});

/**
 * @desc    Get order summary
 * @route   GET /api/orders/summary
 * @access  Private
 */
const getOrderSummary = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  
  // If userId is provided and user is not admin, check authorization
  if (userId && !req.user.isAdmin && userId !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const targetUserId = userId || req.user._id;

  const summary = await Order.aggregate([
    { $match: { user: mongoose.Types.ObjectId(targetUserId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: { $cond: ['$isPaid', '$totalPrice', 0] } },
        pendingOrders: { 
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } 
        },
        processingOrders: { 
          $sum: { $cond: [{ $eq: ['$status', 'Processing'] }, 1, 0] } 
        },
        shippedOrders: { 
          $sum: { $cond: [{ $eq: ['$status', 'Shipped'] }, 1, 0] } 
        },
        deliveredOrders: { 
          $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } 
        },
        cancelledOrders: { 
          $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } 
        }
      }
    }
  ]);

  const result = summary[0] || {
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0
  };

  res.json(result);
});

/**
 * @desc    Estimate delivery date
 * @route   POST /api/orders/estimate-delivery
 * @access  Private
 */
const estimateDeliveryDate = asyncHandler(async (req, res) => {
  const { shippingAddress, orderItems } = req.body;

  if (!shippingAddress) {
    res.status(400);
    throw new Error('Shipping address is required');
  }

  // Simple delivery estimation logic (can be enhanced with real logistics API)
  let estimatedDays = 3; // Default 3 days

  // Adjust based on location (simple example)
  if (shippingAddress.state?.toLowerCase() === 'lagos') {
    estimatedDays = 1;
  } else if (['abuja', 'kano', 'ibadan', 'port harcourt'].includes(shippingAddress.state?.toLowerCase())) {
    estimatedDays = 2;
  } else {
    estimatedDays = 4;
  }

  // Add extra day for custom designs
  if (orderItems?.some(item => item.customDesign?.hasCustomDesign)) {
    estimatedDays += 1;
  }

  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDays);

  res.json({
    estimatedDeliveryDate,
    estimatedDays,
    message: `Estimated delivery in ${estimatedDays} business days`
  });
});

/**
 * @desc    Validate promo code
 * @route   POST /api/orders/validate-promo
 * @access  Private
 */
const validatePromoCode = asyncHandler(async (req, res) => {
  const { promoCode, orderTotal, orderItems } = req.body;

  if (!promoCode) {
    res.status(400);
    throw new Error('Promo code is required');
  }

  // Simple promo code validation (enhance with database)
  const promoCodes = {
    'WELCOME10': { discount: 0.1, type: 'percentage', minOrder: 0 },
    'SAVE5000': { discount: 5000, type: 'fixed', minOrder: 20000 },
    'NEWUSER': { discount: 0.15, type: 'percentage', minOrder: 10000 },
  };

  const promo = promoCodes[promoCode.toUpperCase()];

  if (!promo) {
    res.status(400);
    throw new Error('Invalid promo code');
  }

  if (orderTotal < promo.minOrder) {
    res.status(400);
    throw new Error(`Minimum order value of ₦${promo.minOrder.toLocaleString()} required for this promo code`);
  }

  let discountAmount = 0;
  if (promo.type === 'percentage') {
    discountAmount = orderTotal * promo.discount;
  } else {
    discountAmount = promo.discount;
  }

  res.json({
    valid: true,
    promoCode: promoCode.toUpperCase(),
    discountAmount,
    discountType: promo.type,
    message: `Promo code applied! You saved ₦${discountAmount.toLocaleString()}`
  });
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
};