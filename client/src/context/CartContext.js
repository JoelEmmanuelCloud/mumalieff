import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Initial state
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
      totalPrice: calculateTotalPrice(
        calculateItemsPrice(cartInfoFromStorage.cartItems),
        cartInfoFromStorage.shippingPrice || 0,
        cartInfoFromStorage.taxPrice || 0,
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

// Helper function to calculate total price
const calculateTotalPrice = (itemsPrice, shippingPrice, taxPrice, discount) => {
  return itemsPrice + shippingPrice + taxPrice - discount;
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
      
      // Calculate new prices
      const itemsPrice = calculateItemsPrice(cartItems);
      const totalPrice = calculateTotalPrice(
        itemsPrice,
        state.shippingPrice,
        state.taxPrice,
        state.discount
      );
      
      return {
        ...state,
        cartItems,
        itemsPrice,
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
      
      // Calculate new prices
      const itemsPrice = calculateItemsPrice(cartItems);
      const totalPrice = calculateTotalPrice(
        itemsPrice,
        state.shippingPrice,
        state.taxPrice,
        state.discount
      );
      
      return {
        ...state,
        cartItems,
        itemsPrice,
        totalPrice,
      };
    }
    
    case CART_REMOVE_ITEM: {
      const { id, size, color } = action.payload;
      
      // Filter out the item to remove
      const cartItems = state.cartItems.filter(
        (item) => !(item.product === id && item.size === size && item.color === color)
      );
      
      // Calculate new prices
      const itemsPrice = calculateItemsPrice(cartItems);
      const totalPrice = calculateTotalPrice(
        itemsPrice,
        state.shippingPrice,
        state.taxPrice,
        state.discount
      );
      
      return {
        ...state,
        cartItems,
        itemsPrice,
        totalPrice,
      };
    }
    
    case CART_CLEAR_ITEMS:
      return {
        ...state,
        cartItems: [],
        itemsPrice: 0,
        totalPrice: state.shippingPrice + state.taxPrice - state.discount,
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
        state.taxPrice,
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
        state.taxPrice,
        0
      );
      
      return {
        ...state,
        promoCode: '',
        discount: 0,
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
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartInfo', JSON.stringify(state));
  }, [state]);
  
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
  const resetCart = () => {
    dispatch({ type: CART_RESET });
  };
  
  // Calculate shipping price based on items total
  useEffect(() => {
    const calculateShipping = () => {
      // Free shipping for orders over ₦50,000
      const shippingPrice = state.itemsPrice > 50000 ? 0 : 2500;
      
      // Calculate tax (7.5% VAT)
      const taxPrice = state.itemsPrice * 0.075;
      
      // Update total with new shipping and tax values
      const totalPrice = calculateTotalPrice(
        state.itemsPrice,
        shippingPrice,
        taxPrice,
        state.discount
      );
      
      // Save to state
      state.shippingPrice = shippingPrice;
      state.taxPrice = taxPrice;
      state.totalPrice = totalPrice;
    };
    
    calculateShipping();
  }, [state.itemsPrice, state.discount]);
  
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;