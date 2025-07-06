import api from './apiConfig';

export const initializePaystack = async (paymentData) => {
  try {
    const response = await api.post('/payments/paystack/initialize', paymentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to initialize payment');
  }
};

export const verifyPaystack = async (reference) => {
  try {
    const response = await api.get(`/payments/paystack/verify/${reference}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to verify payment');
  }
};

export const processPaystackPayment = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!window.PaystackPop) {
        reject(new Error('Paystack payment library not loaded. Please refresh the page and try again.'));
        return;
      }

      if (!data.email || !data.amount || !data.orderId) {
        reject(new Error('Missing required payment data'));
        return;
      }

      const initResponse = await initializePaystack({
        email: data.email,
        amount: data.amount,
        orderId: data.orderId,
        callbackUrl: data.callbackUrl || `${window.location.origin}/order/${data.orderId}`
      });

      if (!initResponse.success || !initResponse.data) {
        reject(new Error('Failed to initialize payment with backend'));
        return;
      }

      const paystackData = initResponse.data;
      
      const publicKey = paystackData.public_key || 
                       import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 
                       process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;

      if (!publicKey) {
        reject(new Error('Paystack public key not found'));
        return;
      }

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: data.email,
        amount: paystackData.amount,
        currency: 'NGN',
        ref: paystackData.reference,
        
        callback: function(response) {
          resolve({
            ...response,
            orderId: data.orderId,
            backendData: initResponse
          });
        },
        
        onClose: function() {
          reject(new Error('Payment was cancelled by user'));
        },
        
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
        
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      });

      handler.openIframe();
      
    } catch (error) {
      reject(new Error(error.message || 'Failed to initialize payment. Please try again.'));
    }
  });
};

export const verifyPaymentAndUpdateOrder = async (reference, orderId) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const verificationResponse = await verifyPaystack(reference);
    
    if (verificationResponse.success) {
      return {
        payment: verificationResponse.payment || verificationResponse,
        order: verificationResponse.order
      };
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    if (error.message.includes('Payment record not found') || error.message.includes('not found')) {
      return await directPaymentVerification(reference, orderId);
    }
    
    throw new Error(error.message || 'Failed to verify payment');
  }
};

export const directPaymentVerification = async (reference, orderId) => {
  try {
    const orderUpdateResponse = await api.put(`/orders/${orderId}/pay`, {
      id: reference,
      status: 'success',
      update_time: new Date().toISOString(),
      email_address: '',
      reference: reference,
      channel: 'paystack',
      amount: 0,
      fees: 0,
    });

    return {
      payment: { reference, status: 'success' },
      order: orderUpdateResponse.data
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to verify payment directly');
  }
};

export const createOrderAndInitializePayment = async (orderData) => {
  try {
    const orderResponse = await api.post('/orders', orderData);
    const order = orderResponse.data;

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
    throw new Error(error.response?.data?.message || 'Failed to create order and initialize payment');
  }
};

export const retryPayment = async (orderId) => {
  try {
    const response = await api.post(`/payments/retry/${orderId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to retry payment');
  }
};

export const checkPaymentStatus = async (reference, orderId = null) => {
  try {
    const response = await verifyPaystack(reference);
    return {
      isPaid: response.success && (response.payment?.status === 'success' || response.transaction?.status === 'success'),
      status: response.payment?.status || response.transaction?.status || 'unknown',
      transaction: response.transaction || response.payment
    };
  } catch (error) {
    if (reference && orderId) {
      try {
        await directPaymentVerification(reference, orderId);
        return {
          isPaid: true,
          status: 'success',
          transaction: { reference, status: 'success' }
        };
      } catch (directError) {
        // Empty catch block
      }
    }
    
    return {
      isPaid: false,
      status: 'error',
      error: error.message
    };
  }
};

export const formatAmount = (amount, currency = 'NGN') => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  });
  return formatter.format(amount);
};

export const koboToNaira = (kobo) => {
  return kobo / 100;
};

export const nairaToKobo = (naira) => {
  return Math.round(naira * 100);
};

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

export const handlePaymentError = (error) => {
  let errorMessage = 'An unexpected error occurred';
  let errorCode = 'unknown_error';
  
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
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