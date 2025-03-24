// server/src/controllers/adminController.js

const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  // Total users
  const userCount = await User.countDocuments({});
  
  // Total products
  const productCount = await Product.countDocuments({});
  
  // Total orders
  const orderCount = await Order.countDocuments({});
  
  // Total sales
  const sales = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
  ]);
  
  const totalSales = sales.length > 0 ? sales[0].totalSales : 0;
  
  // Recent orders
  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email');
  
  res.json({
    userCount,
    productCount,
    orderCount,
    totalSales,
    recentOrders
  });
});

module.exports = {
  getDashboardStats
};