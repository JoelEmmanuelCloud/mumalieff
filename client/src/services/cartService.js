// src/services/cartService.js

import api from './apiConfig';

/**
 * Save cart for abandoned cart tracking
 * @param {Object} cartData - Cart data including items and total
 * @returns {Promise} API response
 */
export const saveAbandonedCart = async (cartData) => {
  try {
    const response = await api.post('/cart/save', {
      cartItems: cartData.cartItems,
      total: cartData.total
    });
    return response.data;
  } catch (error) {
    // Don't throw error for abandoned cart saving - it's not critical
    console.error('Failed to save abandoned cart:', error.response?.data?.message || error.message);
    return { success: false, message: 'Failed to save cart' };
  }
};

/**
 * Clear abandoned cart tracking
 * @returns {Promise} API response
 */
export const clearAbandonedCart = async () => {
  try {
    const response = await api.delete('/cart/clear');
    return response.data;
  } catch (error) {
    // Don't throw error for clearing abandoned cart - it's not critical
    console.error('Failed to clear abandoned cart:', error.response?.data?.message || error.message);
    return { success: false, message: 'Failed to clear cart' };
  }
};

/**
 * Handle order completion - clears abandoned cart and performs cleanup
 * @returns {Promise} API response
 */
export const handleOrderCompletion = async () => {
  try {
    const result = await clearAbandonedCart();
    console.log('Order completion handled - abandoned cart cleared');
    return result;
  } catch (error) {
    console.error('Error handling order completion:', error);
    return { success: false, message: 'Failed to handle order completion' };
  }
};

/**
 * Validate cart items before checkout
 * @param {Array} cartItems - Array of cart items to validate
 * @returns {Promise} Validation result
 */
export const validateCartItems = async (cartItems) => {
  try {
    const response = await api.post('/cart/validate', {
      cartItems: cartItems.map(item => ({
        product: item.product,
        qty: item.qty,
        size: item.size,
        color: item.color
      }))
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to validate cart items');
  }
};

/**
 * Apply promo code to cart
 * @param {string} promoCode - Promo code to apply
 * @param {number} orderTotal - Current order total
 * @param {Array} cartItems - Cart items for validation
 * @returns {Promise} Promo code application result
 */
export const applyPromoCode = async (promoCode, orderTotal, cartItems) => {
  try {
    const response = await api.post('/cart/apply-promo', {
      promoCode,
      orderTotal,
      cartItems
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to apply promo code');
  }
};

/**
 * Calculate shipping cost based on cart items and address
 * @param {Array} cartItems - Cart items
 * @param {Object} shippingAddress - Shipping address
 * @returns {Promise} Shipping calculation result
 */
export const calculateShipping = async (cartItems, shippingAddress) => {
  try {
    const response = await api.post('/cart/calculate-shipping', {
      cartItems,
      shippingAddress
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to calculate shipping');
  }
};

/**
 * Get estimated delivery date for cart items
 * @param {Array} cartItems - Cart items
 * @param {Object} shippingAddress - Shipping address
 * @returns {Promise} Delivery estimation result
 */
export const getEstimatedDelivery = async (cartItems, shippingAddress) => {
  try {
    const response = await api.post('/cart/estimate-delivery', {
      cartItems,
      shippingAddress
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get delivery estimate');
  }
};

/**
 * Save cart to user's saved carts (for later)
 * @param {Object} cartData - Cart data to save
 * @param {string} cartName - Name for the saved cart
 * @returns {Promise} Save result
 */
export const saveCartForLater = async (cartData, cartName) => {
  try {
    const response = await api.post('/cart/save-for-later', {
      cartItems: cartData.cartItems,
      total: cartData.total,
      cartName: cartName || `Saved Cart ${new Date().toLocaleDateString()}`
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to save cart for later');
  }
};

/**
 * Get user's saved carts
 * @returns {Promise} Saved carts list
 */
export const getSavedCarts = async () => {
  try {
    const response = await api.get('/cart/saved-carts');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get saved carts');
  }
};

/**
 * Load a saved cart
 * @param {string} cartId - ID of the saved cart to load
 * @returns {Promise} Saved cart data
 */
export const loadSavedCart = async (cartId) => {
  try {
    const response = await api.get(`/cart/saved-carts/${cartId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load saved cart');
  }
};

/**
 * Delete a saved cart
 * @param {string} cartId - ID of the saved cart to delete
 * @returns {Promise} Delete result
 */
export const deleteSavedCart = async (cartId) => {
  try {
    const response = await api.delete(`/cart/saved-carts/${cartId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete saved cart');
  }
};

/**
 * Get cart recommendations based on current cart items
 * @param {Array} cartItems - Current cart items
 * @returns {Promise} Recommendations
 */
export const getCartRecommendations = async (cartItems) => {
  try {
    const response = await api.post('/cart/recommendations', {
      cartItems
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get recommendations');
  }
};

/**
 * Sync cart with server (useful for multi-device sync)
 * @param {Object} localCart - Local cart state
 * @returns {Promise} Synced cart data
 */
export const syncCart = async (localCart) => {
  try {
    const response = await api.post('/cart/sync', {
      cartItems: localCart.cartItems,
      total: localCart.totalPrice,
      lastModified: Date.now()
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to sync cart');
  }
};

/**
 * Check product availability in cart
 * @param {Array} cartItems - Cart items to check
 * @returns {Promise} Availability check result
 */
export const checkProductAvailability = async (cartItems) => {
  try {
    const response = await api.post('/cart/check-availability', {
      cartItems
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to check product availability');
  }
};

/**
 * Get cart analytics for user (order history, preferences, etc.)
 * @returns {Promise} Cart analytics data
 */
export const getCartAnalytics = async () => {
  try {
    const response = await api.get('/cart/analytics');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get cart analytics');
  }
};

/**
 * Share cart with others (generates shareable link)
 * @param {Object} cartData - Cart data to share
 * @param {Object} shareOptions - Share options (expiry, permissions, etc.)
 * @returns {Promise} Share result with link
 */
export const shareCart = async (cartData, shareOptions = {}) => {
  try {
    const response = await api.post('/cart/share', {
      cartItems: cartData.cartItems,
      total: cartData.total,
      shareOptions: {
        expiryDays: shareOptions.expiryDays || 7,
        allowModify: shareOptions.allowModify || false,
        message: shareOptions.message || ''
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to share cart');
  }
};

/**
 * Load shared cart from link
 * @param {string} shareToken - Share token from URL
 * @returns {Promise} Shared cart data
 */
export const loadSharedCart = async (shareToken) => {
  try {
    const response = await api.get(`/cart/shared/${shareToken}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load shared cart');
  }
};

/**
 * Utility functions for cart manipulation
 */

/**
 * Calculate cart totals locally (for immediate UI updates)
 * @param {Array} cartItems - Cart items
 * @param {Object} options - Calculation options
 * @returns {Object} Calculated totals
 */
export const calculateCartTotals = (cartItems, options = {}) => {
  const itemsPrice = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const shippingPrice = options.shippingPrice || (itemsPrice > 50000 ? 0 : 2500);
  const taxRate = options.taxRate || 0.075; // 7.5% VAT
  const taxPrice = Math.round(itemsPrice * taxRate);
  const discount = options.discount || 0;
  const totalPrice = itemsPrice + shippingPrice + taxPrice - discount;

  return {
    itemsPrice,
    shippingPrice,
    taxPrice,
    discount,
    totalPrice,
    itemCount: cartItems.reduce((acc, item) => acc + item.qty, 0),
    freeShippingEligible: itemsPrice > 50000,
    freeShippingRemaining: itemsPrice < 50000 ? 50000 - itemsPrice : 0
  };
};

/**
 * Format cart item for API submission
 * @param {Object} item - Cart item
 * @returns {Object} Formatted item
 */
export const formatCartItemForAPI = (item) => {
  return {
    product: item.product,
    name: item.name,
    image: item.image,
    price: item.price,
    qty: item.qty,
    size: item.size,
    color: item.color,
    customDesign: item.customDesign || null
  };
};

/**
 * Validate cart item data
 * @param {Object} item - Cart item to validate
 * @returns {Object} Validation result
 */
export const validateCartItem = (item) => {
  const errors = [];

  if (!item.product) errors.push('Product ID is required');
  if (!item.name) errors.push('Product name is required');
  if (!item.price || item.price <= 0) errors.push('Valid price is required');
  if (!item.qty || item.qty <= 0) errors.push('Valid quantity is required');
  if (!item.size) errors.push('Size selection is required');
  if (!item.color) errors.push('Color selection is required');

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if cart items have changed (for optimistic updates)
 * @param {Array} oldItems - Previous cart items
 * @param {Array} newItems - New cart items
 * @returns {boolean} Whether items have changed
 */
export const cartItemsChanged = (oldItems, newItems) => {
  if (oldItems.length !== newItems.length) return true;
  
  return oldItems.some((oldItem, index) => {
    const newItem = newItems[index];
    return (
      oldItem.product !== newItem.product ||
      oldItem.qty !== newItem.qty ||
      oldItem.size !== newItem.size ||
      oldItem.color !== newItem.color ||
      oldItem.price !== newItem.price
    );
  });
};

/**
 * Debounce function for cart updates
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Export all functions as default object for easier importing
export default {
  saveAbandonedCart,
  clearAbandonedCart,
  handleOrderCompletion,
  validateCartItems,
  applyPromoCode,
  calculateShipping,
  getEstimatedDelivery,
  saveCartForLater,
  getSavedCarts,
  loadSavedCart,
  deleteSavedCart,
  getCartRecommendations,
  syncCart,
  checkProductAvailability,
  getCartAnalytics,
  shareCart,
  loadSharedCart,
  calculateCartTotals,
  formatCartItemForAPI,
  validateCartItem,
  cartItemsChanged,
  debounce
};