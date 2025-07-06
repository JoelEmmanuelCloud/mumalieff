const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { saveAbandonedCart, clearAbandonedCart } = require('../services/cartService');


router.post('/save', protect, async (req, res) => {
  try {
    const { cartItems, total } = req.body;
    
    if (cartItems && cartItems.length > 0) {
      await saveAbandonedCart(req.user._id, cartItems, total);
      res.json({ success: true, message: 'Cart saved for abandonment tracking' });
    } else {
   
      await clearAbandonedCart(req.user._id);
      res.json({ success: true, message: 'Abandoned cart cleared' });
    }
  } catch (error) {
   
    res.status(500).json({ success: false, message: 'Failed to save cart' });
  }
});


router.delete('/clear', protect, async (req, res) => {
  try {
    await clearAbandonedCart(req.user._id);
    res.json({ success: true, message: 'Abandoned cart cleared' });
  } catch (error) {
   
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

module.exports = router;