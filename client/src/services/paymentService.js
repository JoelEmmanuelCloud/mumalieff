import api from './apiConfig';

// Initialize Paystack payment
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

// Get payment history
export const getPaymentHistory = async (params = {}) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = params;
    let url = `/payments/history?page=${page}&limit=${limit}`;
    
    if (status) url += `&status=${status}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
  }
};

// Get payments for a specific order
export const getOrderPayments = async (orderId) => {
  try {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch order payments');
  }
};

// Enhanced Paystack inline payment with better error handling
export const processPaystackPayment = (data) => {
  return new Promise((resolve, reject) => {
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

      // Generate reference if not provided
      const reference = data.reference || `mlf_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

      const handler = window.PaystackPop.setup({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: data.email,
        amount: Math.round(data.amount * 100), // Convert to kobo and ensure integer
        currency: 'NGN',
        ref: reference,
        callback: function(response) {
          // Payment successful
          console.log('Payment successful:', response);
          resolve({
            ...response,
            orderId: data.orderId
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
      reject(new Error('Failed to initialize payment. Please try again.'));
    }
  });
};

// Process payment with order creation
export const processOrderPayment = async (orderData) => {
  try {
    // First, create the order
    const orderResponse = await api.post('/orders', orderData);
    const order = orderResponse.data;

    // Initialize payment for the created order
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
    throw new Error(error.response?.data?.message || 'Failed to process order payment');
  }
};

// Verify payment and update order
export const verifyPaymentAndUpdateOrder = async (reference, orderId) => {
  try {
    // Verify payment with Paystack
    const paymentVerification = await verifyPaystack(reference);
    
    if (paymentVerification.success) {
      // Update order payment status
      const orderUpdateResponse = await api.put(`/orders/${orderId}/pay`, {
        id: paymentVerification.transaction.id,
        status: paymentVerification.transaction.status,
        update_time: new Date().toISOString(),
        email_address: paymentVerification.transaction.customer.email,
        reference: paymentVerification.transaction.reference,
        channel: paymentVerification.transaction.channel,
        amount: paymentVerification.transaction.amount,
        fees: paymentVerification.transaction.fees,
      });

      return {
        payment: paymentVerification,
        order: orderUpdateResponse.data
      };
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to verify payment');
  }
};

// Retry failed payment
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

    return await initializePaystack(paymentData);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to retry payment');
  }
};

// Check payment status
export const checkPaymentStatus = async (reference) => {
  try {
    const response = await verifyPaystack(reference);
    return {
      isPaid: response.success && response.transaction?.status === 'success',
      status: response.transaction?.status || 'unknown',
      transaction: response.transaction
    };
  } catch (error) {
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

// Get supported payment channels
export const getPaymentChannels = () => {
  return [
    { value: 'card', label: 'Debit/Credit Card', icon: '💳' },
    { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
    { value: 'ussd', label: 'USSD', icon: '📱' },
    { value: 'qr', label: 'QR Code', icon: '📱' },
    { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  ];
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
  };
  
  const message = errorMessages[error.code] || error.message || 'An unexpected error occurred';
  
  return {
    message,
    code: error.code || 'unknown_error',
    suggestion: getSuggestionForError(error.code)
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
  };
  
  return suggestions[errorCode] || 'Please try again or contact support if the problem persists';
};