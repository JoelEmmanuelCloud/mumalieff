'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface CartItem {
  product: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  size: string;
  color: string;
  countInStock?: number;
  customDesign?: {
    hasCustomDesign: boolean;
    designUrl?: string;
  };
}

interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  resetCart: () => void;
  cartTotal: number;
  cartCount: number;
  shippingAddress: ShippingAddress;
  saveShippingAddress: (address: ShippingAddress) => void;
  paymentMethod: string;
  savePaymentMethod: (method: string) => void;
  itemsPrice: number;
  shippingPrice: number;
  totalPrice: number;
  discount: number;
  promoCode: string;
  applyPromoCode: (code: string, discountAmount: number) => void;
  removePromoCode: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    // Load cart from localStorage on mount
    const storedCart = localStorage.getItem('cart');
    const storedShipping = localStorage.getItem('shippingAddress');
    const storedPayment = localStorage.getItem('paymentMethod');

    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Error parsing stored cart:', error);
        localStorage.removeItem('cart');
      }
    }

    if (storedShipping) {
      try {
        setShippingAddress(JSON.parse(storedShipping));
      } catch (error) {
        console.error('Error parsing stored shipping:', error);
        localStorage.removeItem('shippingAddress');
      }
    }

    if (storedPayment) {
      setPaymentMethod(storedPayment);
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (i) => i.product === item.product && i.size === item.size && i.color === item.color
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          qty: item.qty,
        };
        return updatedItems;
      }

      return [...prevItems, item];
    });
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product === productId && item.size === size && item.color === color)
      )
    );
  };

  const updateQuantity = (productId: string, size: string, color: string, qty: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product === productId && item.size === size && item.color === color
          ? { ...item, qty }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const resetCart = () => {
    setCartItems([]);
    setShippingAddress({
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Nigeria',
    });
    setPaymentMethod('');
    setPromoCode('');
    setDiscount(0);
    localStorage.removeItem('cart');
    localStorage.removeItem('shippingAddress');
    localStorage.removeItem('paymentMethod');
  };

  const saveShippingAddress = (address: ShippingAddress) => {
    setShippingAddress(address);
    localStorage.setItem('shippingAddress', JSON.stringify(address));
  };

  const savePaymentMethod = (method: string) => {
    setPaymentMethod(method);
    localStorage.setItem('paymentMethod', method);
  };

  const applyPromoCode = (code: string, discountAmount: number) => {
    setPromoCode(code);
    setDiscount(discountAmount);
  };

  const removePromoCode = () => {
    setPromoCode('');
    setDiscount(0);
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.qty, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.qty, 0);
  const itemsPrice = cartTotal;
  const shippingPrice = itemsPrice > 100 ? 0 : 10;
  const totalPrice = itemsPrice + shippingPrice - discount;

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    resetCart,
    cartTotal,
    cartCount,
    shippingAddress,
    saveShippingAddress,
    paymentMethod,
    savePaymentMethod,
    itemsPrice,
    shippingPrice,
    totalPrice,
    discount,
    promoCode,
    applyPromoCode,
    removePromoCode,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
