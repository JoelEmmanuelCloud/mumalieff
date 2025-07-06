const Cart = require('../models/cartModel');
const { sendAbandonedCartEmail } = require('./emailService');

const saveAbandonedCart = async (userId, cartItems, total) => {
  try {
    const existingCart = await Cart.findOne({ user: userId });
    
    if (existingCart) {
      existingCart.items = cartItems;
      existingCart.total = total;
      existingCart.lastUpdated = new Date();
      existingCart.remindersSent = 0;
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
    throw error;
  }
};

const processAbandonedCartReminders = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

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
      } catch (error) {
        continue;
      }
    }

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
      } catch (error) {
        continue;
      }
    }

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
      } catch (error) {
        continue;
      }
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await Cart.deleteMany({
      lastUpdated: { $lt: sevenDaysAgo },
      remindersSent: { $gte: 3 }
    });

  } catch (error) {
    throw error;
  }
};

const clearAbandonedCart = async (userId) => {
  try {
    await Cart.deleteOne({ user: userId });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveAbandonedCart,
  processAbandonedCartReminders,
  clearAbandonedCart
};