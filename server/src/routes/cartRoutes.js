// server/src/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { saveAbandonedCart, clearAbandonedCart } = require('../services/cartService');

/**
 * @desc    Save cart for abandoned cart tracking
 * @route   POST /api/cart/save
 * @access  Private
 */
router.post('/save', protect, async (req, res) => {
  try {
    const { cartItems, total } = req.body;
    
    if (cartItems && cartItems.length > 0) {
      await saveAbandonedCart(req.user._id, cartItems, total);
      res.json({ success: true, message: 'Cart saved for abandonment tracking' });
    } else {
      // Clear abandoned cart if cart is empty
      await clearAbandonedCart(req.user._id);
      res.json({ success: true, message: 'Abandoned cart cleared' });
    }
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({ success: false, message: 'Failed to save cart' });
  }
});

/**
 * @desc    Clear abandoned cart (when user makes purchase)
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
router.delete('/clear', protect, async (req, res) => {
  try {
    await clearAbandonedCart(req.user._id);
    res.json({ success: true, message: 'Abandoned cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

module.exports = router;