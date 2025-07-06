const cron = require('node-cron');
const { processAbandonedCartReminders } = require('../services/cartService');

const startAbandonedCartJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      await processAbandonedCartReminders();
    } catch (error) {
    }
  });
  
};


const processOrderReminders = async () => {
  try {
    const Order = require('../models/orderModel');
    const { sendPaymentFailedEmail } = require('../services/emailService');
    
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
    
      } catch (error) {
        
      }
    }
  } catch (error) {
   
  }
};


const startPaymentReminderJob = () => {
  cron.schedule('0 */2 * * *', async () => {
    
    try {
      await processOrderReminders();
      
    } catch (error) {

    }
  });
 
};


const startEmailJobs = () => {
  startAbandonedCartJob();
  startPaymentReminderJob();
  
};

module.exports = {
  startEmailJobs,
  startAbandonedCartJob,
  startPaymentReminderJob,
  processAbandonedCartReminders,
  processOrderReminders
};