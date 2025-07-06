import api from './apiConfig';

export const saveAbandonedCart = async (cartData) => {
  try {
    const response = await api.post('/cart/save', {
      cartItems: cartData.cartItems,
      total: cartData.total
    });
    return response.data;
  } catch (error) {
    
    return { success: false, message: 'Failed to save cart' };
  }
};

export const clearAbandonedCart = async () => {
  try {
    const response = await api.delete('/cart/clear');
    return response.data;
  } catch (error) {
  
    return { success: false, message: 'Failed to clear cart' };
  }
};

export const handleOrderCompletion = async () => {
  try {
    const result = await clearAbandonedCart();

    return result;
  } catch (error) {

    return { success: false, message: 'Failed to handle order completion' };
  }
};

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

export const getSavedCarts = async () => {
  try {
    const response = await api.get('/cart/saved-carts');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get saved carts');
  }
};


export const loadSavedCart = async (cartId) => {
  try {
    const response = await api.get(`/cart/saved-carts/${cartId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load saved cart');
  }
};


export const deleteSavedCart = async (cartId) => {
  try {
    const response = await api.delete(`/cart/saved-carts/${cartId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete saved cart');
  }
};

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


export const getCartAnalytics = async () => {
  try {
    const response = await api.get('/cart/analytics');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get cart analytics');
  }
};


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

export const loadSharedCart = async (shareToken) => {
  try {
    const response = await api.get(`/cart/shared/${shareToken}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to load shared cart');
  }
};

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


export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

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