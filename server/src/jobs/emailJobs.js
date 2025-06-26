// server/src/jobs/emailJobs.js

const cron = require('node-cron');
const { processAbandonedCartReminders } = require('../services/cartService');

/**
 * Run abandoned cart reminders every hour
 */
const startAbandonedCartJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running abandoned cart reminder job...');
    try {
      await processAbandonedCartReminders();
      console.log('Abandoned cart reminder job completed successfully');
    } catch (error) {
      console.error('Abandoned cart reminder job failed:', error);
    }
  });
  
  console.log('Abandoned cart reminder job scheduled to run every hour');
};

/**
 * Process order reminder emails (for unpaid orders)
 */
const processOrderReminders = async () => {
  try {
    const Order = require('../models/orderModel');
    const { sendPaymentFailedEmail } = require('../services/emailService');
    
    // Find unpaid orders older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const unpaidOrders = await Order.find({
      isPaid: false,
      status: { $in: ['Pending', 'Processing'] },
      createdAt: { $lt: oneHourAgo },
      paymentReminderSent: { $ne: true }
    }).populate('user', 'name email');

    for (const order of unpaidOrders) {
      try {
        await sendPaymentFailedEmail(order, order.user, 'Payment reminder - complete your order');
        order.paymentReminderSent = true;
        await order.save();
        console.log(`Payment reminder sent for order ${order._id}`);
      } catch (error) {
        console.error(`Failed to send payment reminder for order ${order._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing order reminders:', error);
  }
};

/**
 * Run payment reminders every 2 hours
 */
const startPaymentReminderJob = () => {
  cron.schedule('0 */2 * * *', async () => {
    console.log('Running payment reminder job...');
    try {
      await processOrderReminders();
      console.log('Payment reminder job completed successfully');
    } catch (error) {
      console.error('Payment reminder job failed:', error);
    }
  });
  
  console.log('Payment reminder job scheduled to run every 2 hours');
};

/**
 * Start all email automation jobs
 */
const startEmailJobs = () => {
  startAbandonedCartJob();
  startPaymentReminderJob();
  console.log('All email automation jobs started successfully');
};

module.exports = {
  startEmailJobs,
  startAbandonedCartJob,
  startPaymentReminderJob,
  processAbandonedCartReminders,
  processOrderReminders
};