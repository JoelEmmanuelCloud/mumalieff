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

  const createdOrder = await order.save();

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    product.countInStock -= item.qty;
    await product.save();
  }

  try {
    await sendOrderConfirmationEmail(createdOrder, req.user);
  } catch (emailError) {
  }

  res.status(201).json(createdOrder);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
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

    if (wasUnpaid) {
      try {
        await sendOrderConfirmationEmail(updatedOrder, order.user);
      } catch (emailError) {
      }
    }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    const previousStatus = order.status;
    order.status = status || order.status;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    try {
      if (status === 'Shipped' && previousStatus !== 'Shipped') {
        await sendShippingConfirmationEmail(updatedOrder, order.user, {
          trackingNumber: trackingNumber,
          carrier: 'Our delivery partner'
        });
      } else if (status === 'Delivered' && previousStatus !== 'Delivered') {
        await sendDeliveryConfirmationEmail(updatedOrder, order.user);
      } else if (status !== previousStatus) {
        await sendOrderStatusUpdateEmail(updatedOrder, order.user, previousStatus, status);
      }
    } catch (emailError) {
    }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

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

const getOrders = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  
  const query = {};
  
  if (req.query.userId) {
    query.user = req.query.userId;
  }
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.isPaid === 'true') {
    query.isPaid = true;
  } else if (req.query.isPaid === 'false') {
    query.isPaid = false;
  }
  
  if (req.query.isDelivered === 'true') {
    query.isDelivered = true;
  } else if (req.query.isDelivered === 'false') {
    query.isDelivered = false;
  }
  
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

const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (order.status !== 'Pending' && order.status !== 'Processing') {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }

  order.status = 'Cancelled';
  order.cancellationReason = reason || 'Customer requested cancellation';
  
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.countInStock += item.qty;
      await product.save();
    }
  }

  const updatedOrder = await order.save();

  try {
    await sendOrderCancellationEmail(updatedOrder, order.user, reason);
  } catch (emailError) {
  }

  res.json(updatedOrder);
});

const getOrderStats = asyncHandler(async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
  
    let totalSales = 0;
    try {
      const totalSalesResult = await Order.aggregate([
        {
          $match: {
            isPaid: true
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
      totalSales = 0;
    }
    
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
          $sort: { count: -1 }
        }
      ]);
    
    } catch (statusError) {
      ordersByStatus = [];
    }
    
    let salesLastWeek = [];
    try {
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      
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
      salesLastWeek = [];
    }
    
    const stats = {
      totalOrders: Number(totalOrders) || 0,
      totalSales: Number(totalSales) || 0,
      ordersByStatus: Array.isArray(ordersByStatus) ? ordersByStatus : [],
      salesLastWeek: Array.isArray(salesLastWeek) ? salesLastWeek : [],
    };
    
    res.json(stats);
    
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to fetch order statistics: ${error.message}`);
  }
});

const getDailySales = asyncHandler(async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    
    const lagosTime = new Date().toLocaleString("en-US", {timeZone: "Africa/Lagos"});
    const today = new Date(lagosTime);
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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
    
    const completeSalesData = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < days; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const existingData = dailySalesData.find(item => item._id === dateString);
      
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
    res.status(500);
    throw new Error(`Failed to fetch daily sales data: ${error.message}`);
  }
});

const confirmOrderDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (order.status !== 'Delivered') {
    res.status(400);
    throw new Error('Order is not marked as delivered yet');
  }

  if (order.deliveryConfirmedByCustomer) {
    res.status(400);
    throw new Error('Delivery has already been confirmed');
  }

  order.deliveryConfirmedByCustomer = true;
  order.customerDeliveryConfirmedAt = Date.now();
  order.notes = order.notes 
    ? `${order.notes}. Customer confirmed delivery on ${new Date().toISOString()}.` 
    : `Customer confirmed delivery on ${new Date().toISOString()}.`;

  const updatedOrder = await order.save();

  try {
  } catch (emailError) {
  }

  res.json({
    message: 'Delivery confirmed successfully',
    order: updatedOrder
  });
});

const getOrderTracking = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (
    order.user.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const trackingInfo = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
    isDelivered: order.isDelivered,
    deliveredAt: order.deliveredAt,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
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

const reportOrderIssue = asyncHandler(async (req, res) => {
  const { type, description } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (!type || !description) {
    res.status(400);
    throw new Error('Issue type and description are required');
  }

  const issueNote = `ISSUE REPORTED - Type: ${type}, Description: ${description}, Reported on: ${new Date().toISOString()}`;
  order.notes = order.notes ? `${order.notes}\n${issueNote}` : issueNote;

  await order.save();

  res.json({
    message: 'Issue reported successfully. Our team will contact you soon.',
    order
  });
});

const retryOrderPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  if (!['Pending', 'Processing'].includes(order.status)) {
    res.status(400);
    throw new Error('Payment cannot be retried for this order status');
  }

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

const updateShippingAddress = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (order.status !== 'Pending') {
    res.status(400);
    throw new Error('Shipping address can only be updated for pending orders');
  }

  if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
    res.status(400);
    throw new Error('Complete shipping address is required');
  }

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

const calculateOrderTotal = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, promoCode } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  let itemsPrice = 0;
  for (const item of orderItems) {
    itemsPrice += item.price * item.qty;
  }

  const shippingPrice = itemsPrice > 50000 ? 0 : 2500;

  const taxPrice = 0;

  let discount = 0;
  if (promoCode) {
    if (promoCode === 'WELCOME10') {
      discount = itemsPrice * 0.1;
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

const checkOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

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

const getOrderSummary = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  
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

const estimateDeliveryDate = asyncHandler(async (req, res) => {
  const { shippingAddress, orderItems } = req.body;

  if (!shippingAddress) {
    res.status(400);
    throw new Error('Shipping address is required');
  }

  let estimatedDays = 3;

  if (shippingAddress.state?.toLowerCase() === 'lagos') {
    estimatedDays = 1;
  } else if (['abuja', 'kano', 'ibadan', 'port harcourt'].includes(shippingAddress.state?.toLowerCase())) {
    estimatedDays = 2;
  } else {
    estimatedDays = 4;
  }

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

const validatePromoCode = asyncHandler(async (req, res) => {
  const { promoCode, orderTotal, orderItems } = req.body;

  if (!promoCode) {
    res.status(400);
    throw new Error('Promo code is required');
  }

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