/**
 * Payment Utilities
 * Helper functions for payment processing
 */

// Convert Naira to Kobo (Paystack uses kobo as the smallest unit)
const nairaToKobo = (nairaAmount) => {
  return Math.round(nairaAmount * 100);
};

// Convert Kobo to Naira
const koboToNaira = (koboAmount) => {
  return koboAmount / 100;
};

// Format currency for display
const formatCurrency = (amount, currency = 'NGN', locale = 'en-NG') => {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

// Format amount without currency symbol
const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount);
};

// Generate unique payment reference
const generatePaymentReference = (prefix = 'MLF') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

// Validate Nigerian phone number
const validateNigerianPhone = (phone) => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid Nigerian number
  const nigerianPattern = /^(\+234|234|0)([789][01])\d{8}$/;
  return nigerianPattern.test(cleanPhone);
};

// Format Nigerian phone number
const formatNigerianPhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('234')) {
    return `+${cleanPhone}`;
  } else if (cleanPhone.startsWith('0')) {
    return `+234${cleanPhone.slice(1)}`;
  } else if (cleanPhone.length === 10) {
    return `+234${cleanPhone}`;
  }
  
  return phone; // Return original if can't format
};

// Validate email
const validateEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

// Calculate VAT (7.5% for Nigeria)
const calculateVAT = (amount, vatRate = 0.075) => {
  return Math.round(amount * vatRate);
};

// Calculate shipping cost based on location and weight
const calculateShipping = (location, weight = 1, baseRate = 1000) => {
  const locationMultipliers = {
    'Lagos': 1.0,
    'Abuja': 1.2,
    'Port Harcourt': 1.3,
    'Kano': 1.5,
    'Ibadan': 1.1,
    'Benin City': 1.2,
    'Kaduna': 1.4,
    'default': 1.5
  };
  
  const multiplier = locationMultipliers[location] || locationMultipliers.default;
  const weightMultiplier = weight > 1 ? 1 + ((weight - 1) * 0.2) : 1;
  
  return Math.round(baseRate * multiplier * weightMultiplier);
};

// Get free shipping threshold
const getFreeShippingThreshold = () => {
  return 50000; // ₦50,000
};

// Check if order qualifies for free shipping
const qualifiesForFreeShipping = (orderAmount, threshold = null) => {
  const freeShippingThreshold = threshold || getFreeShippingThreshold();
  return orderAmount >= freeShippingThreshold;
};

// Payment status helpers
const getPaymentStatusColor = (status) => {
  const statusColors = {
    'pending': 'warning',
    'success': 'success',
    'failed': 'error',
    'cancelled': 'secondary',
    'abandoned': 'warning',
    'refunded': 'info'
  };
  return statusColors[status] || 'secondary';
};

const getPaymentStatusText = (status) => {
  const statusTexts = {
    'pending': 'Pending',
    'success': 'Successful',
    'failed': 'Failed',
    'cancelled': 'Cancelled',
    'abandoned': 'Abandoned',
    'refunded': 'Refunded'
  };
  return statusTexts[status] || 'Unknown';
};

// Payment channel helpers
const getPaymentChannelIcon = (channel) => {
  const channelIcons = {
    'card': '💳',
    'bank': '🏦',
    'ussd': '📱',
    'qr': '📱',
    'mobile_money': '📱',
    'bank_transfer': '🏦'
  };
  return channelIcons[channel] || '💳';
};

const getPaymentChannelName = (channel) => {
  const channelNames = {
    'card': 'Debit/Credit Card',
    'bank': 'Bank Transfer',
    'ussd': 'USSD',
    'qr': 'QR Code',
    'mobile_money': 'Mobile Money',
    'bank_transfer': 'Bank Transfer'
  };
  return channelNames[channel] || 'Unknown';
};

// Discount calculations
const calculateDiscount = (amount, discountType, discountValue) => {
  if (discountType === 'percentage') {
    return Math.round((amount * discountValue) / 100);
  } else if (discountType === 'fixed') {
    return Math.min(discountValue, amount); // Don't exceed the total amount
  }
  return 0;
};

const applyPromoCode = (amount, promoCode, promoCodes = {}) => {
  const promo = promoCodes[promoCode.toUpperCase()];
  if (!promo) {
    throw new Error('Invalid promo code');
  }
  
  if (promo.minAmount && amount < promo.minAmount) {
    throw new Error(`Minimum order amount of ${formatCurrency(promo.minAmount)} required for this promo code`);
  }
  
  if (promo.expiryDate && new Date() > new Date(promo.expiryDate)) {
    throw new Error('Promo code has expired');
  }
  
  const discount = calculateDiscount(amount, promo.type, promo.value);
  return {
    discount,
    promoCode: promoCode.toUpperCase(),
    description: promo.description
  };
};

// Order total calculations
const calculateOrderTotals = (items, shippingLocation = 'Lagos', promoCode = null) => {
  // Calculate items total
  const itemsPrice = items.reduce((total, item) => {
    return total + (item.price * item.qty);
  }, 0);
  
  // Calculate shipping
  const totalWeight = items.reduce((weight, item) => weight + (item.weight || 1) * item.qty, 0);
  let shippingPrice = 0;
  
  if (!qualifiesForFreeShipping(itemsPrice)) {
    shippingPrice = calculateShipping(shippingLocation, totalWeight);
  }
  
  // Calculate subtotal before tax and discount
  const subtotal = itemsPrice + shippingPrice;
  
  // Calculate tax (VAT)
  const taxPrice = calculateVAT(itemsPrice); // Tax only on items, not shipping
  
  // Apply promo code if provided
  let discount = 0;
  let appliedPromoCode = null;
  
  if (promoCode) {
    try {
      const promoResult = applyPromoCode(itemsPrice, promoCode);
      discount = promoResult.discount;
      appliedPromoCode = promoResult.promoCode;
    } catch (error) {
      console.warn('Promo code error:', error.message);
    }
  }
  
  // Calculate final total
  const totalPrice = itemsPrice + shippingPrice + taxPrice - discount;
  
  return {
    itemsPrice,
    shippingPrice,
    taxPrice,
    discount,
    totalPrice: Math.max(0, totalPrice), // Ensure total is never negative
    promoCode: appliedPromoCode,
    breakdown: {
      subtotal: itemsPrice,
      shipping: shippingPrice,
      tax: taxPrice,
      discount: discount,
      total: Math.max(0, totalPrice)
    }
  };
};

// Payment validation
const validatePaymentData = (paymentData) => {
  const errors = [];
  
  if (!paymentData.email || !validateEmail(paymentData.email)) {
    errors.push('Valid email is required');
  }
  
  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.push('Valid amount is required');
  }
  
  if (paymentData.amount && paymentData.amount < 100) {
    errors.push('Minimum payment amount is ₦100');
  }
  
  if (paymentData.amount && paymentData.amount > 10000000) {
    errors.push('Maximum payment amount is ₦10,000,000');
  }
  
  if (!paymentData.orderId) {
    errors.push('Order ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Bank code mappings for Nigerian banks
const getNigerianBanks = () => {
  return [
    { code: '044', name: 'Access Bank' },
    { code: '063', name: 'Access Bank (Diamond)' },
    { code: '050', name: 'Ecobank Nigeria' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '014', name: 'Mainstreet Bank' },
    { code: '526', name: 'Parallex Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '101', name: 'Providus Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '100', name: 'Suntrust Bank' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '033', name: 'United Bank For Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' }
  ];
};

// Error handling helpers
const getPaymentErrorMessage = (errorCode) => {
  const errorMessages = {
    'insufficient_funds': 'Insufficient funds. Please check your account balance.',
    'invalid_card': 'Invalid card details. Please check and try again.',
    'expired_card': 'Your card has expired. Please use a different card.',
    'blocked_card': 'Your card is blocked. Please contact your bank.',
    'declined': 'Transaction declined by your bank. Please try again or use a different card.',
    'network_error': 'Network error. Please check your connection and try again.',
    'timeout': 'Transaction timed out. Please try again.',
    'invalid_amount': 'Invalid transaction amount.',
    'duplicate_transaction': 'Duplicate transaction detected.',
    'maintenance': 'Service is temporarily unavailable. Please try again later.',
    'invalid_reference': 'Invalid transaction reference.',
    'already_processed': 'Transaction has already been processed.'
  };
  
  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
};

const getPaymentSuggestion = (errorCode) => {
  const suggestions = {
    'insufficient_funds': 'Fund your account or try a different payment method.',
    'invalid_card': 'Double-check your card number, expiry date, and CVV.',
    'expired_card': 'Use a valid, non-expired card.',
    'blocked_card': 'Contact your bank to unblock your card.',
    'declined': 'Contact your bank or try a different payment method.',
    'network_error': 'Check your internet connection and try again.',
    'timeout': 'Wait a moment and try again.',
    'maintenance': 'Try again in a few minutes.'
  };
  
  return suggestions[errorCode] || 'Contact support if the problem persists.';
};

// Webhook event handlers
const isWebhookEventRelevant = (eventType) => {
  const relevantEvents = [
    'charge.success',
    'charge.dispute.create',
    'charge.dispute.remind',
    'charge.dispute.resolve',
    'transfer.success',
    'transfer.failed',
    'transfer.reversed'
  ];
  
  return relevantEvents.includes(eventType);
};

// Payment analytics helpers
const groupPaymentsByPeriod = (payments, period = 'day') => {
  const grouped = {};
  
  payments.forEach(payment => {
    const date = new Date(payment.createdAt);
    let key;
    
    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        payments: [],
        totalAmount: 0,
        successfulPayments: 0,
        failedPayments: 0
      };
    }
    
    grouped[key].payments.push(payment);
    grouped[key].totalAmount += payment.amount;
    
    if (payment.status === 'success') {
      grouped[key].successfulPayments++;
    } else if (payment.status === 'failed') {
      grouped[key].failedPayments++;
    }
  });
  
  return Object.values(grouped);
};

// Export all utilities
module.exports = {
  // Currency functions
  nairaToKobo,
  koboToNaira,
  formatCurrency,
  formatAmount,
  
  // Payment processing
  generatePaymentReference,
  validatePaymentData,
  calculateOrderTotals,
  
  // Validation
  validateNigerianPhone,
  formatNigerianPhone,
  validateEmail,
  
  // Calculations
  calculateVAT,
  calculateShipping,
  calculateDiscount,
  applyPromoCode,
  qualifiesForFreeShipping,
  getFreeShippingThreshold,
  
  // Status and channel helpers
  getPaymentStatusColor,
  getPaymentStatusText,
  getPaymentChannelIcon,
  getPaymentChannelName,
  
  // Error handling
  getPaymentErrorMessage,
  getPaymentSuggestion,
  
  // Banks and webhooks
  getNigerianBanks,
  isWebhookEventRelevant,
  
  // Analytics
  groupPaymentsByPeriod
};