import api from './apiConfig';

// Initialize Paystack payment
export const initializePaystack = async (paymentData) => {
  const response = await api.post('/payments/paystack/initialize', paymentData);
  return response.data;
};

// Verify Paystack payment
export const verifyPaystack = async (reference) => {
  const response = await api.get(`/payments/paystack/verify/${reference}`);
  return response.data;
};

// Handle Paystack inline payment
export const processPaystackPayment = (data) => {
  return new Promise((resolve, reject) => {
    try {
      // Paystack inline script must be loaded in index.html
      if (!window.PaystackPop) {
        reject(new Error('Paystack not loaded'));
        return;
      }
      
      const handler = window.PaystackPop.setup({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: data.email,
        amount: data.amount * 100, // Paystack expects amount in kobo (smallest currency unit)
        currency: 'NGN',
        ref: data.reference || '', // Optional unique reference
        callback: function(response) {
          // Payment successful
          resolve(response);
        },
        onClose: function() {
          // User closed the payment dialog
          reject(new Error('Payment dialog closed'));
        },
        metadata: {
          order_id: data.orderId,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: data.orderId,
            },
          ],
        },
      });
      
      handler.openIframe();
    } catch (error) {
      reject(error);
    }
  });
};