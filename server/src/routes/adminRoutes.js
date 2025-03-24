// server/src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Get dashboard stats
router.route('/dashboard').get(protect, admin, getDashboardStats);

module.exports = router;