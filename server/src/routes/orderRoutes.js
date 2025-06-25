const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  cancelOrder,
  getOrderStats,
  getDailySales,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Stats route - must come before /:id
router.route('/stats')
  .get(protect, admin, getOrderStats);

// Daily sales route - must come before /:id
router.route('/daily-sales')
  .get(protect, admin, getDailySales);

// My orders route - must come before /:id
router.route('/myorders')
  .get(protect, getMyOrders);

// General routes for creating and listing orders
router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

// Specific order by ID routes
router.route('/:id')
  .get(protect, getOrderById);

// IMPORTANT: Add this route for direct payment updates
router.route('/:id/pay')
  .put(protect, updateOrderToPaid);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

module.exports = router;