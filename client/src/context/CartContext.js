import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { saveAbandonedCart, clearAbandonedCart } from '../services/cartService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const initialState = {
  cartItems: [],
  shippingAddress: {},
  paymentMethod: '',
  itemsPrice: 0,
  shippingPrice: 0,
  taxPrice: 0, 
  totalPrice: 0,
  discount: 0,
  promoCode: '',
};

const loadFromStorage = () => {
  try {
    const cartInfoFromStorage = localStorage.getItem('cartInfo')
      ? JSON.parse(localStorage.getItem('cartInfo'))
      : initialState;
      
    return {
      ...cartInfoFromStorage,
      itemsPrice: calculateItemsPrice(cartInfoFromStorage.cartItems),
      taxPrice: 0, 
      totalPrice: calculateTotalPrice(
        calculateItemsPrice(cartInfoFromStorage.cartItems),
        cartInfoFromStorage.shippingPrice || 0,
        0, 
        cartInfoFromStorage.discount || 0
      ),
    };
  } catch (error) {
    return initialState;
  }
};

const calculateItemsPrice = (cartItems) => {
  return cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
};

const calculateTotalPrice = (itemsPrice, shippingPrice, taxPrice, discount) => {
  return itemsPrice + shippingPrice - discount;
};

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

const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ADD_ITEM: {
      const newItem = action.payload;
      
      const existingItem = state.cartItems.find(
        (item) => 
          item.product === newItem.product && 
          item.size === newItem.size && 
          item.color === newItem.color &&
          (!item.customDesign || !newItem.customDesign)
      );
      
      let cartItems;
      
      if (existingItem) {
        cartItems = state.cartItems.map((item) =>
          item.product === existingItem.product && 
          item.size === existingItem.size && 
          item.color === existingItem.color ? 
            { ...item, qty: item.qty + newItem.qty } : item
        );
      } else {
        cartItems = [...state.cartItems, newItem];
      }
      
      const itemsPrice = calculateItemsPrice(cartItems);
      const totalPrice = calculateTotalPrice(
        itemsPrice,
        state.shippingPrice,
        0,
        state.discount
      );
      
      return {
        ...state,
        cartItems,
        itemsPrice,
        taxPrice: 0,
        totalPrice,
      };
    }
    
    case CART_UPDATE_ITEM: {
      const { id, qty, size, color } = action.payload;
      
      const cartItems = state.cartItems.map((item) =>
        item.product === id && item.size === size && item.color === color
          ? { ...item, qty }
          : item
      );
      
      const itemsPrice = calculateItemsPrice(cartItems);
      const totalPrice = calculateTotalPrice(
        itemsPrice,
        state.shippingPrice,
        0,
        state.discount
      );
      
      return {
        ...state,
        cartItems,
        itemsPrice,
        taxPrice: 0,
        totalPrice,
      };
    }
    
    case CART_REMOVE_ITEM: {
      const { id, size, color } = action.payload;
      
      const cartItems = state.cartItems.filter(
        (item) => !(item.product === id && item.size === size && item.color === color)
      );
      
      const itemsPrice = calculateItemsPrice(cartItems);
      const totalPrice = calculateTotalPrice(
        itemsPrice,
        state.shippingPrice,
        0,
        state.discount
      );
      
      return {
        ...state,
        cartItems,
        itemsPrice,
        taxPrice: 0,
        totalPrice,
      };
    }
    
    case CART_CLEAR_ITEMS:
      return {
        ...state,
        cartItems: [],
        itemsPrice: 0,
        taxPrice: 0,
        totalPrice: state.shippingPrice - state.discount,
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
        0,
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
        0,
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
      const { shippingPrice } = action.payload;
      const totalPrice = calculateTotalPrice(
        state.itemsPrice,
        shippingPrice,
        0,
        state.discount
      );
      
      return {
        ...state,
        shippingPrice,
        taxPrice: 0,
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

  useEffect(() => {
    localStorage.setItem('cartInfo', JSON.stringify(state));
  }, [state]);

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
        
      } catch (error) {
        
      }
    } else if (isAuthenticated && state.cartItems.length === 0) {
      try {
        await clearAbandonedCart();
        
      } catch (error) {
        
      }
    }
  }, [isAuthenticated, state.cartItems, state.totalPrice]);

  useEffect(() => {
    if (abandonedCartTimeoutRef.current) {
      clearTimeout(abandonedCartTimeoutRef.current);
    }

    if (isAuthenticated && state.cartItems.length > 0) {
      const cartChanged = JSON.stringify(state.cartItems) !== JSON.stringify(previousCartItemsRef.current);
      
      if (cartChanged) {
        abandonedCartTimeoutRef.current = setTimeout(() => {
          saveCartForAbandonment();
        }, 2000);
      }
    }

    previousCartItemsRef.current = state.cartItems;

    return () => {
      if (abandonedCartTimeoutRef.current) {
        clearTimeout(abandonedCartTimeoutRef.current);
      }
    };
  }, [state.cartItems, isAuthenticated, saveCartForAbandonment]);

  const handleOrderCompletion = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await clearAbandonedCart();
        
      } catch (error) {
        
      }
    }
  }, [isAuthenticated]);

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
  
  const updateCartItem = (id, qty, size, color) => {
    dispatch({
      type: CART_UPDATE_ITEM,
      payload: { id, qty, size, color },
    });
  };
  
  const removeFromCart = (id, size, color) => {
    dispatch({
      type: CART_REMOVE_ITEM,
      payload: { id, size, color },
    });
    
    toast.info('Item removed from cart');
  };
  
  const clearCart = () => {
    dispatch({ type: CART_CLEAR_ITEMS });
  };
  
  const saveShippingAddress = (address) => {
    dispatch({
      type: CART_SAVE_SHIPPING_ADDRESS,
      payload: address,
    });
  };
  
  const savePaymentMethod = (method) => {
    dispatch({
      type: CART_SAVE_PAYMENT_METHOD,
      payload: method,
    });
  };
  
  const applyPromoCode = (promoCode, discountAmount) => {
    dispatch({
      type: CART_APPLY_PROMO,
      payload: { promoCode, discountAmount },
    });
    
    toast.success(`Promo code ${promoCode} applied!`);
  };
  
  const removePromoCode = () => {
    dispatch({ type: CART_REMOVE_PROMO });
    toast.info('Promo code removed');
  };
  
  const resetCart = async () => {
    await handleOrderCompletion();
    
    dispatch({ type: CART_RESET });
  };

  useEffect(() => {
    const calculatePricing = () => {
      const shippingPrice = state.itemsPrice > 50000 ? 0 : 2500;
      
      if (state.shippingPrice !== shippingPrice) {
        dispatch({
          type: CART_UPDATE_PRICING,
          payload: { shippingPrice }
        });
      }
    };
    
    calculatePricing();
  }, [state.itemsPrice, state.shippingPrice]);

  const getCartItemCount = () => {
    return state.cartItems.reduce((total, item) => total + item.qty, 0);
  };

  const getCartSummary = () => {
    return {
      itemCount: getCartItemCount(),
      subtotal: state.itemsPrice,
      shipping: state.shippingPrice,
      tax: 0,
      discount: state.discount,
      total: state.totalPrice,
      promoCode: state.promoCode,
      hasItems: state.cartItems.length > 0,
      freeShippingEligible: state.itemsPrice > 50000,
      freeShippingProgress: state.itemsPrice < 50000 ? (50000 - state.itemsPrice) : 0
    };
  };

  const isItemInCart = (productId, size, color) => {
    return state.cartItems.some(
      item => item.product === productId && item.size === size && item.color === color
    );
  };

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