const express = require('express');
const router = express.Router();
const {
  initializePaystack,
  verifyPaystack,
  paystackWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Paystack routes
router.route('/paystack/initialize').post(protect, initializePaystack);
router.route('/paystack/verify/:reference').get(protect, verifyPaystack);
router.route('/paystack/webhook').post(paystackWebhook);

module.exports = router;