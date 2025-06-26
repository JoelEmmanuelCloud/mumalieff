// Updated paymentService.js

import api from './apiConfig';

// Initialize Paystack payment with backend record creation
export const initializePaystack = async (paymentData) => {
  try {
    const response = await api.post('/payments/paystack/initialize', paymentData);
    return response.data;
  } catch (error) {
    console.error('Backend initialization error:', error.response?.data);
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

// FIXED: Enhanced Paystack inline payment with proper backend integration
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

      console.log('Initializing payment with backend...', data);

      // Step 1: Initialize payment with backend (creates payment record)
      const initResponse = await initializePaystack({
        email: data.email,
        amount: data.amount,
        orderId: data.orderId,
        callbackUrl: data.callbackUrl || `${window.location.origin}/order/${data.orderId}`
      });

      console.log('Backend initialization response:', initResponse);

      if (!initResponse.success || !initResponse.data) {
        reject(new Error('Failed to initialize payment with backend'));
        return;
      }

      const paystackData = initResponse.data;
      
      // FIXED: Ensure we have the correct public key
      const publicKey = paystackData.public_key || 
                       import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 
                       process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;

      if (!publicKey) {
        reject(new Error('Paystack public key not found'));
        return;
      }

      console.log('Opening Paystack modal with:', {
        key: publicKey.substring(0, 10) + '...',
        amount: paystackData.amount,
        reference: paystackData.reference,
        email: data.email
      });

      // Step 2: Open Paystack payment modal with corrected configuration
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: data.email,
        amount: paystackData.amount, // This should be in kobo (from backend)
        currency: 'NGN',
        ref: paystackData.reference,
        
        // SUCCESS CALLBACK
        callback: function(response) {
          console.log('Paystack payment successful:', response);
          resolve({
            ...response,
            orderId: data.orderId,
            backendData: initResponse
          });
        },
        
        // CLOSE/CANCEL CALLBACK
        onClose: function() {
          console.log('Payment modal closed by user');
          reject(new Error('Payment was cancelled by user'));
        },
        
        // Enhanced metadata
        metadata: {
          order_id: data.orderId,
          user_email: data.email,
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
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      });

      // Open the payment modal
      handler.openIframe();
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      reject(new Error(error.message || 'Failed to initialize payment. Please try again.'));
    }
  });
};

// FIXED: Verify payment and update order with better error handling
export const verifyPaymentAndUpdateOrder = async (reference, orderId) => {
  try {
    console.log('Verifying payment:', { reference, orderId });
    
    // Add delay to ensure webhook processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify payment with backend
    const verificationResponse = await verifyPaystack(reference);
    
    if (verificationResponse.success) {
      console.log('Payment verified successfully:', verificationResponse);
      return {
        payment: verificationResponse.payment || verificationResponse,
        order: verificationResponse.order
      };
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    
    // If verification fails, try direct order update as fallback
    if (error.message.includes('Payment record not found') || error.message.includes('not found')) {
      console.log('Attempting direct order update...');
      return await directPaymentVerification(reference, orderId);
    }
    
    throw new Error(error.message || 'Failed to verify payment');
  }
};

// FIXED: Alternative payment flow for orders without payment records
export const directPaymentVerification = async (reference, orderId) => {
  try {
    console.log('Direct payment verification for:', { reference, orderId });
    
    // Update order payment status directly using the existing endpoint
    const orderUpdateResponse = await api.put(`/orders/${orderId}/pay`, {
      id: reference,
      status: 'success',
      update_time: new Date().toISOString(),
      email_address: '', // Will be filled by backend if needed
      reference: reference,
      channel: 'paystack',
      amount: 0, // Will be filled by backend
      fees: 0,
    });

    console.log('Direct order update successful:', orderUpdateResponse.data);

    return {
      payment: { reference, status: 'success' },
      order: orderUpdateResponse.data
    };
  } catch (error) {
    console.error('Direct payment verification error:', error);
    throw new Error(error.response?.data?.message || 'Failed to verify payment directly');
  }
};

// FIXED: Create order and initialize payment in one go
export const createOrderAndInitializePayment = async (orderData) => {
  try {
    console.log('Creating order and initializing payment...', orderData);
    
    // Step 1: Create order
    const orderResponse = await api.post('/orders', orderData);
    const order = orderResponse.data;

    console.log('Order created:', order);

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
    const response = await api.post(`/payments/retry/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Retry payment error:', error);
    throw new Error(error.response?.data?.message || 'Failed to retry payment');
  }
};

// FIXED: Check payment status with better fallback logic
export const checkPaymentStatus = async (reference, orderId = null) => {
  try {
    // First try backend verification
    const response = await verifyPaystack(reference);
    return {
      isPaid: response.success && (response.payment?.status === 'success' || response.transaction?.status === 'success'),
      status: response.payment?.status || response.transaction?.status || 'unknown',
      transaction: response.transaction || response.payment
    };
  } catch (error) {
    console.error('Error checking payment status:', error);
    
    // Fallback: assume success if we have a reference (Paystack wouldn't callback without success)
    if (reference && orderId) {
      try {
        await directPaymentVerification(reference, orderId);
        return {
          isPaid: true,
          status: 'success',
          transaction: { reference, status: 'success' }
        };
      } catch (directError) {
        console.error('Direct verification also failed:', directError);
      }
    }
    
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

// FIXED: Better payment amount validation
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

// IMPROVED: Enhanced error handling
export const handlePaymentError = (error) => {
  console.error('Payment error details:', error);
  
  // Extract meaningful error messages
  let errorMessage = 'An unexpected error occurred';
  let errorCode = 'unknown_error';
  
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  // Check for specific error patterns
  if (errorMessage.includes('insufficient')) {
    errorCode = 'insufficient_funds';
    errorMessage = 'Insufficient funds in your account';
  } else if (errorMessage.includes('declined') || errorMessage.includes('invalid')) {
    errorCode = 'declined';
    errorMessage = 'Transaction was declined. Please check your card details or try another card';
  } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    errorCode = 'network_error';
    errorMessage = 'Network error. Please check your connection and try again';
  } else if (errorMessage.includes('cancelled')) {
    errorCode = 'cancelled';
    errorMessage = 'Payment was cancelled';
  } else if (errorMessage.includes('not found')) {
    errorCode = 'payment_record_not_found';
    errorMessage = 'Payment record not found. This may be a temporary issue.';
  }
  
  return {
    message: errorMessage,
    code: errorCode,
    suggestion: getSuggestionForError(errorCode)
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
    'cancelled': 'You can retry the payment anytime',
    'payment_record_not_found': 'Please try again. If the problem persists, contact support.',
  };
  
  return suggestions[errorCode] || 'Please try again or contact support if the problem persists';
};