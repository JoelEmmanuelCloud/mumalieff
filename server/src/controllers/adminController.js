const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

const getDashboardStats = asyncHandler(async (req, res) => {

  const userCount = await User.countDocuments({});
  
  const productCount = await Product.countDocuments({});
  
  const orderCount = await Order.countDocuments({});
  
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