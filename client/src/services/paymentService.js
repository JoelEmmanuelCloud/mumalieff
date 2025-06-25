// Updated paymentService.js

import api from './apiConfig';

// Initialize Paystack payment with backend record creation
export const initializePaystack = async (paymentData) => {
  try {
    const response = await api.post('/payments/paystack/initialize', paymentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to initialize payment');
  }
};

// Verify Paystack payment
export const verifyPaystack = async (reference) => {
  try {
    const response = await api.get(`/payments/paystack/verify/${reference}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to verify payment');
  }
};

// Enhanced Paystack inline payment with proper backend integration
export const processPaystackPayment = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if Paystack is loaded
      if (!window.PaystackPop) {
        reject(new Error('Paystack payment library not loaded. Please refresh the page and try again.'));
        return;
      }

      // Validate required data
      if (!data.email || !data.amount || !data.orderId) {
        reject(new Error('Missing required payment data'));
        return;
      }

      // Step 1: Initialize payment with backend (creates payment record)
      console.log('Initializing payment with backend...');
      const initResponse = await initializePaystack({
        email: data.email,
        amount: data.amount,
        orderId: data.orderId,
        callbackUrl: data.callbackUrl || `${window.location.origin}/order/${data.orderId}`
      });

      if (!initResponse.success) {
        reject(new Error('Failed to initialize payment'));
        return;
      }

      const { data: paystackData } = initResponse;
      
      // Step 2: Open Paystack payment modal
      const handler = window.PaystackPop.setup({
        key: paystackData.public_key || process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: data.email,
        amount: paystackData.amount,
        currency: 'NGN',
        ref: paystackData.reference,
        callback: function(response) {
          // Payment successful on Paystack side
          console.log('Payment successful on Paystack:', response);
          resolve({
            ...response,
            orderId: data.orderId,
            paystackData: initResponse
          });
        },
        onClose: function() {
          // User closed the payment dialog
          reject(new Error('Payment was cancelled'));
        },
        metadata: {
          order_id: data.orderId,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: data.orderId,
            },
            {
              display_name: 'Customer Email',
              variable_name: 'customer_email',
              value: data.email,
            },
          ],
        },
        // Enable multiple payment channels
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
      });

      // Open the payment modal
      handler.openIframe();
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      reject(new Error(error.message || 'Failed to initialize payment. Please try again.'));
    }
  });
};

// Verify payment and update order with proper error handling
export const verifyPaymentAndUpdateOrder = async (reference, orderId) => {
  try {
    console.log('Verifying payment:', { reference, orderId });
    
    // Verify payment with backend
    const verificationResponse = await verifyPaystack(reference);
    
    if (verificationResponse.success) {
      console.log('Payment verified successfully:', verificationResponse);
      return {
        payment: verificationResponse,
        order: verificationResponse.order
      };
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new Error(error.message || 'Failed to verify payment');
  }
};

// Alternative payment flow for orders without payment records
export const directPaymentVerification = async (reference, orderId) => {
  try {
    // First try to verify directly with Paystack API
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (result.status && result.data.status === 'success') {
      // Update order payment status directly
      const orderUpdateResponse = await api.put(`/orders/${orderId}/pay`, {
        id: result.data.id,
        status: result.data.status,
        update_time: new Date().toISOString(),
        email_address: result.data.customer.email,
        reference: result.data.reference,
        channel: result.data.channel,
        amount: result.data.amount,
        fees: result.data.fees,
      });

      return {
        payment: result,
        order: orderUpdateResponse.data
      };
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Direct payment verification error:', error);
    throw new Error(error.message || 'Failed to verify payment');
  }
};

// Create order and initialize payment in one go
export const createOrderAndInitializePayment = async (orderData) => {
  try {
    // Step 1: Create order
    const orderResponse = await api.post('/orders', orderData);
    const order = orderResponse.data;

    // Step 2: Initialize payment for the created order
    const paymentData = {
      email: orderData.customerEmail || orderData.user?.email,
      amount: order.totalPrice,
      orderId: order._id,
      callbackUrl: `${window.location.origin}/order/${order._id}`
    };

    const paymentResponse = await initializePaystack(paymentData);

    return {
      order,
      payment: paymentResponse
    };
  } catch (error) {
    console.error('Create order and payment error:', error);
    throw new Error(error.response?.data?.message || 'Failed to create order and initialize payment');
  }
};

// Retry payment for existing order
export const retryPayment = async (orderId) => {
  try {
    // Get order details
    const orderResponse = await api.get(`/orders/${orderId}`);
    const order = orderResponse.data;

    if (order.isPaid) {
      throw new Error('Order is already paid');
    }

    // Initialize new payment
    const paymentData = {
      email: order.user.email,
      amount: order.totalPrice,
      orderId: order._id,
      callbackUrl: `${window.location.origin}/order/${order._id}`
    };

    const initResponse = await initializePaystack(paymentData);
    
    if (initResponse.success) {
      return initResponse.data;
    } else {
      throw new Error('Failed to initialize retry payment');
    }
  } catch (error) {
    console.error('Retry payment error:', error);
    throw new Error(error.response?.data?.message || 'Failed to retry payment');
  }
};

// Check payment status with fallback
export const checkPaymentStatus = async (reference, orderId = null) => {
  try {
    // First try backend verification
    const response = await verifyPaystack(reference);
    return {
      isPaid: response.success && response.transaction?.status === 'success',
      status: response.transaction?.status || 'unknown',
      transaction: response.transaction
    };
  } catch (error) {
    // Fallback to direct Paystack verification if orderId is provided
    if (orderId) {
      try {
        const directResult = await directPaymentVerification(reference, orderId);
        return {
          isPaid: true,
          status: 'success',
          transaction: directResult.payment.data
        };
      } catch (directError) {
        console.error('Direct verification also failed:', directError);
      }
    }
    
    console.error('Error checking payment status:', error);
    return {
      isPaid: false,
      status: 'error',
      error: error.message
    };
  }
};

// Format amount for display
export const formatAmount = (amount, currency = 'NGN') => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  });
  return formatter.format(amount);
};

// Convert kobo to naira
export const koboToNaira = (kobo) => {
  return kobo / 100;
};

// Convert naira to kobo
export const nairaToKobo = (naira) => {
  return Math.round(naira * 100);
};

// Validate payment amount
export const validatePaymentAmount = (amount, minAmount = 100, maxAmount = 1000000) => {
  if (!amount || isNaN(amount)) {
    return { isValid: false, error: 'Amount is required and must be a number' };
  }
  
  if (amount < minAmount) {
    return { isValid: false, error: `Amount must be at least ₦${minAmount}` };
  }
  
  if (amount > maxAmount) {
    return { isValid: false, error: `Amount cannot exceed ₦${maxAmount.toLocaleString()}` };
  }
  
  return { isValid: true };
};

// Handle payment errors
export const handlePaymentError = (error) => {
  console.error('Payment error:', error);
  
  const errorMessages = {
    'insufficient_funds': 'Insufficient funds in your account',
    'invalid_card': 'Invalid card details',
    'expired_card': 'Your card has expired',
    'declined': 'Transaction was declined by your bank',
    'network_error': 'Network error. Please check your connection and try again',
    'timeout': 'Transaction timed out. Please try again',
    'payment_record_not_found': 'Payment record not found. Please try again or contact support.',
  };
  
  const message = errorMessages[error.code] || error.message || 'An unexpected error occurred';
  
  return {
    message,
    code: error.code || 'unknown_error',
    suggestion: getSuggestionForError(error.code || error.message)
  };
};

// Get suggestion for payment errors
const getSuggestionForError = (errorCode) => {
  const suggestions = {
    'insufficient_funds': 'Please ensure you have sufficient funds and try again',
    'invalid_card': 'Please check your card details and try again',
    'expired_card': 'Please use a different card',
    'declined': 'Please contact your bank or try a different payment method',
    'network_error': 'Please check your internet connection and try again',
    'timeout': 'Please try again in a few minutes',
    'payment_record_not_found': 'This appears to be a technical issue. Please contact support if the problem persists.',
  };
  
  return suggestions[errorCode] || 'Please try again or contact support if the problem persists';
};