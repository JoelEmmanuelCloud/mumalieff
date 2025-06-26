// server/src/services/cartService.js

const Cart = require('../models/cartModel'); // You'll need to create this model
const { sendAbandonedCartEmail } = require('./emailService');

/**
 * @desc    Save cart for abandoned cart tracking
 */
const saveAbandonedCart = async (userId, cartItems, total) => {
  try {
    const existingCart = await Cart.findOne({ user: userId });
    
    if (existingCart) {
      existingCart.items = cartItems;
      existingCart.total = total;
      existingCart.lastUpdated = new Date();
      existingCart.remindersSent = 0; // Reset reminders
      await existingCart.save();
    } else {
      const newCart = new Cart({
        user: userId,
        items: cartItems,
        total: total,
        lastUpdated: new Date(),
        remindersSent: 0
      });
      await newCart.save();
    }
  } catch (error) {
    console.error('Error saving abandoned cart:', error);
  }
};

/**
 * @desc    Process abandoned cart reminders (run via cron job)
 */
const processAbandonedCartReminders = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // First reminder: 1 hour after abandonment
    const firstReminderCarts = await Cart.find({
      lastUpdated: { $lt: oneHourAgo, $gt: oneDayAgo },
      remindersSent: 0,
      items: { $exists: true, $not: { $size: 0 } }
    }).populate('user', 'name email');

    for (const cart of firstReminderCarts) {
      try {
        await sendAbandonedCartEmail(cart, cart.user, 'first');
        cart.remindersSent = 1;
        cart.lastReminderSent = now;
        await cart.save();
        console.log(`First abandoned cart reminder sent to ${cart.user.email}`);
      } catch (error) {
        console.error(`Failed to send first reminder to ${cart.user.email}:`, error);
      }
    }

    // Second reminder: 24 hours after abandonment
    const secondReminderCarts = await Cart.find({
      lastUpdated: { $lt: oneDayAgo, $gt: threeDaysAgo },
      remindersSent: 1,
      items: { $exists: true, $not: { $size: 0 } }
    }).populate('user', 'name email');

    for (const cart of secondReminderCarts) {
      try {
        await sendAbandonedCartEmail(cart, cart.user, 'second');
        cart.remindersSent = 2;
        cart.lastReminderSent = now;
        await cart.save();
        console.log(`Second abandoned cart reminder sent to ${cart.user.email}`);
      } catch (error) {
        console.error(`Failed to send second reminder to ${cart.user.email}:`, error);
      }
    }

    // Final reminder: 3 days after abandonment
    const finalReminderCarts = await Cart.find({
      lastUpdated: { $lt: threeDaysAgo },
      remindersSent: 2,
      items: { $exists: true, $not: { $size: 0 } }
    }).populate('user', 'name email');

    for (const cart of finalReminderCarts) {
      try {
        await sendAbandonedCartEmail(cart, cart.user, 'final');
        cart.remindersSent = 3;
        cart.lastReminderSent = now;
        await cart.save();
        console.log(`Final abandoned cart reminder sent to ${cart.user.email}`);
      } catch (error) {
        console.error(`Failed to send final reminder to ${cart.user.email}:`, error);
      }
    }

    // Clean up old carts (older than 7 days with 3 reminders sent)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await Cart.deleteMany({
      lastUpdated: { $lt: sevenDaysAgo },
      remindersSent: { $gte: 3 }
    });

  } catch (error) {
    console.error('Error processing abandoned cart reminders:', error);
  }
};

/**
 * @desc    Clear abandoned cart (when user makes purchase or clears cart)
 */
const clearAbandonedCart = async (userId) => {
  try {
    await Cart.deleteOne({ user: userId });
  } catch (error) {
    console.error('Error clearing abandoned cart:', error);
  }
};

module.exports = {
  saveAbandonedCart,
  processAbandonedCartReminders,
  clearAbandonedCart
};
