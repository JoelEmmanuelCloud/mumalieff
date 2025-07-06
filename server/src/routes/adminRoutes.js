const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const {
  getCustomDesignOrders,
  updateCustomOrderStatus,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');


router.route('/dashboard').get(protect, admin, getDashboardStats);

router.route('/custom-orders').get(protect, admin, getCustomDesignOrders);
router.route('/custom-orders/:id/status').put(protect, admin, updateCustomOrderStatus);

module.exports = router;