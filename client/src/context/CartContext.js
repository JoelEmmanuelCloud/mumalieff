// CartContext.js

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { saveAbandonedCart, clearAbandonedCart } from '../services/cartService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Initial state
const initialState = {
  cartItems: [],
  shippingAddress: {},
  paymentMethod: '',
  itemsPrice: 0,
  shippingPrice: 0,
  taxPrice: 0, // Keep for compatibility but will always be 0
  totalPrice: 0,
  discount: 0,
  promoCode: '',
};

// Load state from localStorage
const loadFromStorage = () => {
  try {
    const cartInfoFromStorage = localStorage.getItem('cartInfo')
      ? JSON.parse(localStorage.getItem('cartInfo'))
      : initialState;
      
    // Calculate prices on load
    return {
      ...cartInfoFromStorage,
      itemsPrice: calculateItemsPrice(cartInfoFromStorage.cartItems),
      taxPrice: 0, // No VAT
      totalPrice: calculateTotalPrice(
        calculateItemsPrice(cartInfoFromStorage.cartItems),
        cartInfoFromStorage.shippingPrice || 0,
        0, // No VAT
        cartInfoFromStorage.discount || 0
      ),
    };
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return initialState;
  }
};

// Helper function to calculate items price
const calculateItemsPrice = (cartItems) => {
  return cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
};

// Helper function to calculate total price (no tax)
const calculateTotalPrice = (itemsPrice, shippingPrice, taxPrice, discount) => {
  return itemsPrice + shippingPrice - discount; // Removed taxPrice from calculation
};

// Action types
const CART_ADD_ITEM = 'CART_ADD_ITEM';
const CART_UPDATE_ITEM = 'CART_UPDATE_ITEM';
const CART_REMOVE_ITEM = 'CART_REMOVE_ITEM';
const CART_CLEAR_ITEMS = 'CART_CLEAR_ITEMS';
const CART_SAVE_SHIPPING_ADDRESS = 'CART_SAVE_SHIPPING_ADDRESS';
const CART_SAVE_PAYMENT_METHOD = 'CART_SAVE_PAYMENT_METHOD';
const CART_APPLY_PROMO = 'CART_APPLY_PROMO';
const CART_REMOVE_PROMO = 'CART_REMOVE_PROMO';
const CART_RESET = 'CART_RESET';
const CART_UPDATE_PRICING = 'CART_UPDATE_PRICING';

// Reducer function
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ADD_ITEM: {
      const newItem = action.payload;
      
      // Check if item already exists in cart
      const existingItem = state.cartItems.find(
        (item) => 
          item.product === newItem.product && 
          item.size === newItem.size && 
          item.color === newItem.color &&
          (!item.customDesign || !newItem.customDesign)
      );
      
      let cartItems;
      
      if (existingItem) {
        // Update existing item quantity
        cartItems = state.cartItems.map((item) =>
          item.product === existingItem.product && 
          item.size === existingItem.size && 
          item.color === existingItem.color ? 
            { ...item, qty: item.qty + newItem.qty } : item
        );
      } else {
        // Add new item
        cartItems = [...state.cartItems, newItem];
      }
      
      // Calculate new prices (no tax)
      const itemsPrice = calculateItemsPrice(cartItems);
      const totalPrice = calculateTotalPrice(
        itemsPrice,
        state.shippingPrice,
        0, // No VAT
        state.discount
      );
      
      return {
        ...state,
        cartItems,
        itemsPrice,
        taxPrice: 0, // No VAT
        totalPrice,
      };
    }
    
    case CART_UPDATE_ITEM: {
      const { id, qty, size, color } = action.payload;
      
      // Update item quantity
      const cartItems = state.cartItems.map((item) =>
        item.product === id && item.size === size && item.color === color
          ? { ...item, qty }
          : item
      );
      
      // Calculate new prices (no tax)
      const itemsPrice = calculateItemsPrice(cartItems);
      const totalPrice = calculateTotalPrice(
        itemsPrice,
        state.shippingPrice,
        0, // No VAT
        state.discount
      );
      
      return {
        ...state,
        cartItems,
        itemsPrice,
        taxPrice: 0, // No VAT
        totalPrice,
      };
    }
    
    case CART_REMOVE_ITEM: {
      const { id, size, color } = action.payload;
      
      // Filter out the item to remove
      const cartItems = state.cartItems.filter(
        (item) => !(item.product === id && item.size === size && item.color === color)
      );
      
      // Calculate new prices (no tax)
      const itemsPrice = calculateItemsPrice(cartItems);
      const totalPrice = calculateTotalPrice(
        itemsPrice,
        state.shippingPrice,
        0, // No VAT
        state.discount
      );
      
      return {
        ...state,
        cartItems,
        itemsPrice,
        taxPrice: 0, // No VAT
        totalPrice,
      };
    }
    
    case CART_CLEAR_ITEMS:
      return {
        ...state,
        cartItems: [],
        itemsPrice: 0,
        taxPrice: 0, // No VAT
        totalPrice: state.shippingPrice - state.discount, // Removed tax
      };
    
    case CART_SAVE_SHIPPING_ADDRESS:
      return {
        ...state,
        shippingAddress: action.payload,
      };
    
    case CART_SAVE_PAYMENT_METHOD:
      return {
        ...state,
        paymentMethod: action.payload,
      };
    
    case CART_APPLY_PROMO: {
      const { promoCode, discountAmount } = action.payload;
      const totalPrice = calculateTotalPrice(
        state.itemsPrice,
        state.shippingPrice,
        0, // No VAT
        discountAmount
      );
      
      return {
        ...state,
        promoCode,
        discount: discountAmount,
        totalPrice,
      };
    }
    
    case CART_REMOVE_PROMO: {
      const totalPrice = calculateTotalPrice(
        state.itemsPrice,
        state.shippingPrice,
        0, // No VAT
        0
      );
      
      return {
        ...state,
        promoCode: '',
        discount: 0,
        totalPrice,
      };
    }
    
    case CART_UPDATE_PRICING: {
      const { shippingPrice } = action.payload; // Removed taxPrice parameter
      const totalPrice = calculateTotalPrice(
        state.itemsPrice,
        shippingPrice,
        0, // No VAT
        state.discount
      );
      
      return {
        ...state,
        shippingPrice,
        taxPrice: 0, // No VAT
        totalPrice,
      };
    }
    
    case CART_RESET:
      return initialState;
    
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, loadFromStorage);
  const { isAuthenticated, user } = useAuth();
  const abandonedCartTimeoutRef = useRef(null);
  const previousCartItemsRef = useRef([]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartInfo', JSON.stringify(state));
  }, [state]);

  // Abandoned cart tracking function
  const saveCartForAbandonment = useCallback(async () => {
    if (isAuthenticated && state.cartItems.length > 0) {
      try {
        const cartData = {
          cartItems: state.cartItems.map(item => ({
            product: item.product,
            name: item.name,
            image: item.image,
            price: item.price,
            qty: item.qty,
            size: item.size,
            color: item.color,
            customDesign: item.customDesign
          })),
          total: state.totalPrice
        };
        
        await saveAbandonedCart(cartData);
        console.log('Cart saved for abandonment tracking');
      } catch (error) {
        console.error('Failed to save cart for abandonment:', error);
      }
    } else if (isAuthenticated && state.cartItems.length === 0) {
      // Clear abandoned cart if cart is empty
      try {
        await clearAbandonedCart();
        console.log('Abandoned cart cleared');
      } catch (error) {
        console.error('Failed to clear abandoned cart:', error);
      }
    }
  }, [isAuthenticated, state.cartItems, state.totalPrice]);

  // Track cart changes for abandoned cart
  useEffect(() => {
    // Clear existing timeout
    if (abandonedCartTimeoutRef.current) {
      clearTimeout(abandonedCartTimeoutRef.current);
    }

    // Only track if cart has items and user is authenticated
    if (isAuthenticated && state.cartItems.length > 0) {
      // Check if cart actually changed (not just initial load)
      const cartChanged = JSON.stringify(state.cartItems) !== JSON.stringify(previousCartItemsRef.current);
      
      if (cartChanged) {
        // Set a timeout to save cart after 2 seconds of inactivity
        abandonedCartTimeoutRef.current = setTimeout(() => {
          saveCartForAbandonment();
        }, 2000);
      }
    }

    // Update previous cart items reference
    previousCartItemsRef.current = state.cartItems;

    // Cleanup timeout on unmount
    return () => {
      if (abandonedCartTimeoutRef.current) {
        clearTimeout(abandonedCartTimeoutRef.current);
      }
    };
  }, [state.cartItems, isAuthenticated, saveCartForAbandonment]);

  // Clear abandoned cart when user completes order
  const handleOrderCompletion = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await clearAbandonedCart();
        console.log('Abandoned cart cleared after order completion');
      } catch (error) {
        console.error('Failed to clear abandoned cart after order:', error);
      }
    }
  }, [isAuthenticated]);

  // Add item to cart
  const addToCart = (product, qty, size, color, customDesign = null) => {
    dispatch({
      type: CART_ADD_ITEM,
      payload: {
        product: product._id,
        name: product.name,
        image: product.images[0].url,
        price: product.isSale ? product.salePrice : product.price,
        countInStock: product.countInStock,
        qty,
        size,
        color,
        customDesign,
      },
    });
    
    toast.success(`${product.name} added to cart`);
  };
  
  // Update cart item
  const updateCartItem = (id, qty, size, color) => {
    dispatch({
      type: CART_UPDATE_ITEM,
      payload: { id, qty, size, color },
    });
  };
  
  // Remove item from cart
  const removeFromCart = (id, size, color) => {
    dispatch({
      type: CART_REMOVE_ITEM,
      payload: { id, size, color },
    });
    
    toast.info('Item removed from cart');
  };
  
  // Clear cart
  const clearCart = () => {
    dispatch({ type: CART_CLEAR_ITEMS });
  };
  
  // Save shipping address
  const saveShippingAddress = (address) => {
    dispatch({
      type: CART_SAVE_SHIPPING_ADDRESS,
      payload: address,
    });
  };
  
  // Save payment method
  const savePaymentMethod = (method) => {
    dispatch({
      type: CART_SAVE_PAYMENT_METHOD,
      payload: method,
    });
  };
  
  // Apply promo code
  const applyPromoCode = (promoCode, discountAmount) => {
    dispatch({
      type: CART_APPLY_PROMO,
      payload: { promoCode, discountAmount },
    });
    
    toast.success(`Promo code ${promoCode} applied!`);
  };
  
  // Remove promo code
  const removePromoCode = () => {
    dispatch({ type: CART_REMOVE_PROMO });
    toast.info('Promo code removed');
  };
  
  // Reset cart after checkout
  const resetCart = async () => {
    // Clear abandoned cart tracking first
    await handleOrderCompletion();
    
    // Then reset the cart state
    dispatch({ type: CART_RESET });
  };

  // Calculate shipping price based on items total (removed tax calculation)
  useEffect(() => {
    const calculatePricing = () => {
      // Free shipping for orders over ₦50,000
      const shippingPrice = state.itemsPrice > 50000 ? 0 : 2500;
      
      // No tax calculation needed
      
      // Only update if shipping price has changed
      if (state.shippingPrice !== shippingPrice) {
        dispatch({
          type: CART_UPDATE_PRICING,
          payload: { shippingPrice }
        });
      }
    };
    
    calculatePricing();
  }, [state.itemsPrice, state.shippingPrice]);

  // Get cart item count
  const getCartItemCount = () => {
    return state.cartItems.reduce((total, item) => total + item.qty, 0);
  };

  // Get cart summary for display
  const getCartSummary = () => {
    return {
      itemCount: getCartItemCount(),
      subtotal: state.itemsPrice,
      shipping: state.shippingPrice,
      tax: 0, // No VAT
      discount: state.discount,
      total: state.totalPrice,
      promoCode: state.promoCode,
      hasItems: state.cartItems.length > 0,
      freeShippingEligible: state.itemsPrice > 50000,
      freeShippingProgress: state.itemsPrice < 50000 ? (50000 - state.itemsPrice) : 0
    };
  };

  // Check if specific item is in cart
  const isItemInCart = (productId, size, color) => {
    return state.cartItems.some(
      item => item.product === productId && item.size === size && item.color === color
    );
  };

  // Get specific cart item
  const getCartItem = (productId, size, color) => {
    return state.cartItems.find(
      item => item.product === productId && item.size === size && item.color === color
    );
  };
  
  return (
    <CartContext.Provider
      value={{
        ...state,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        saveShippingAddress,
        savePaymentMethod,
        applyPromoCode,
        removePromoCode,
        resetCart,
        handleOrderCompletion,
        getCartItemCount,
        getCartSummary,
        isItemInCart,
        getCartItem,
        saveCartForAbandonment,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;