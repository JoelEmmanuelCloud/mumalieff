// CartPage.js - Mobile Optimized

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Message from '../components/common/Message';
import QuickCheckoutButton from '../components/ui/QuickCheckoutButton';

const CartPage = () => {
  const { cartItems, updateCartItem, removeFromCart, itemsPrice, shippingPrice, totalPrice, applyPromoCode, removePromoCode, promoCode, discount, shippingAddress, paymentMethod } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  
  // Handle promo code application
  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    
    // Simple promo code implementation - in a real app you'd validate from backend
    if (promoInput.toUpperCase() === 'MUMALIEFF10') {
      const discountAmount = itemsPrice * 0.1; // 10% discount
      applyPromoCode(promoInput.toUpperCase(), discountAmount);
      setPromoError('');
    } else if (promoInput.toUpperCase() === 'WELCOME20') {
      const discountAmount = itemsPrice * 0.2; // 20% discount
      applyPromoCode(promoInput.toUpperCase(), discountAmount);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
    }
    
    setPromoInput('');
  };
  
  // Handle checkout
  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/shipping');
    } else {
      navigate('/login?redirect=shipping');
    }
  };

  // Check if quick checkout is available (user has shipping & payment method set)
  const canQuickCheckout = isAuthenticated && shippingAddress?.address && paymentMethod;
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-4 sm:py-8 mobile-safe">
      <div className="container-custom mobile-container-fix">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 dark:text-white">Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <Message>
            Your cart is empty. <Link to="/products" className="text-primary font-medium">Continue Shopping</Link>
          </Message>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items - Mobile Optimized */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cartItems.map((item) => (
                    <li key={`${item.product}-${item.size}-${item.color}`} className="p-3 sm:p-4 lg:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        {/* Product Image - Much Smaller on Mobile */}
                        <div className="flex-shrink-0">
                          <Link to={`/product/${item.product}`}>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover object-center rounded-md"
                            />
                          </Link>
                        </div>
                        
                        {/* Product Info - Optimized Layout */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-base font-medium dark:text-white line-clamp-2">
                                <Link to={`/product/${item.product}`} className="hover:text-primary">
                                  {item.name}
                                </Link>
                              </h3>
                              <div className="mt-1 flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <span>Size: {item.size}</span>
                                <span>•</span>
                                <span>Color: {item.color}</span>
                              </div>
                              
                              {item.customDesign && item.customDesign.hasCustomDesign && (
                                <p className="mt-1 text-xs sm:text-sm text-accent-gold font-medium">
                                  Custom Design
                                </p>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0">
                              <p className="text-sm sm:text-base font-semibold dark:text-white">
                                ₦{(item.price * item.qty).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Mobile-First Quantity and Remove Controls */}
                          <div className="mt-3 flex items-center justify-between">
                            {/* Quantity Controls - Compact Mobile Design */}
                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                              <button
                                onClick={() => updateCartItem(item.product, Math.max(1, item.qty - 1), item.size, item.color)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mobile-touch-target"
                                aria-label="Decrease quantity"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateCartItem(item.product, Math.max(1, parseInt(e.target.value) || 1), item.size, item.color)}
                                min="1"
                                max={item.countInStock}
                                className="w-12 sm:w-14 h-8 sm:h-9 border-0 bg-white dark:bg-dark-card text-center text-sm font-medium text-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                style={{ fontSize: '16px' }} // Prevent zoom on iOS
                              />
                              <button
                                onClick={() => updateCartItem(item.product, Math.min(item.countInStock, item.qty + 1), item.size, item.color)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mobile-touch-target"
                                aria-label="Increase quantity"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Remove Button - Touch Friendly */}
                            <button
                              onClick={() => removeFromCart(item.product, item.size, item.color)}
                              className="p-2 text-error hover:text-error-dark dark:text-error-light hover:bg-error-light/10 rounded-md transition-colors mobile-touch-target"
                              aria-label="Remove item"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Order Summary - Mobile Optimized */}
            <div>
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-4 sm:p-6 sticky top-4">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Order Summary</h2>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600 dark:text-gray-300">
                      Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)
                    </span>
                    <span className="font-medium dark:text-white">₦{itemsPrice.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                    <span className="font-medium dark:text-white">
                      {shippingPrice > 0 ? `₦${shippingPrice.toLocaleString()}` : 'Free'}
                    </span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-success dark:text-success-light">Discount ({promoCode})</span>
                      <span className="font-medium text-success dark:text-success-light">-₦{discount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="dark:text-white">Total</span>
                      <span className="dark:text-white">₦{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Promo Code - Mobile Optimized */}
                <div className="mt-4 sm:mt-6">
                  <label htmlFor="promo-code" className="form-label">Promo Code</label>
                  <div className="flex rounded-md overflow-hidden">
                    <input
                      type="text"
                      id="promo-code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 form-input rounded-none border-r-0 text-sm"
                      placeholder="Enter code"
                      style={{ fontSize: '16px' }} // Prevent zoom on iOS
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-3 sm:px-4 py-2 bg-primary text-white hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm font-medium mobile-touch-target"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-error text-xs sm:text-sm mt-1">{promoError}</p>}
                  {promoCode && (
                    <div className="flex justify-between items-center mt-2 text-xs sm:text-sm">
                      <span className="text-success dark:text-success-light">
                        Code <span className="font-medium">{promoCode}</span> applied
                      </span>
                      <button
                        onClick={removePromoCode}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 mobile-touch-target"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Checkout Buttons - Mobile Optimized */}
                <div className="mt-4 sm:mt-6 space-y-3">
                  {/* Quick Checkout Option (if available) */}
                  {canQuickCheckout && (
                    <>
                      <QuickCheckoutButton disabled={cartItems.length === 0} />
                      
                      {/* Divider */}
                      <div className="flex items-center">
                        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="px-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">or</span>
                        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                      </div>
                    </>
                  )}
                  
                  {/* Regular Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    className="btn btn-primary w-full py-3 text-sm sm:text-base font-medium mobile-touch-target"
                    disabled={cartItems.length === 0}
                  >
                    {canQuickCheckout ? 'Review & Checkout' : 'Proceed to Checkout'}
                  </button>
                </div>
                
                {/* Info Messages - Mobile Optimized */}
                {!isAuthenticated && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                      <Link to="/login" className="font-medium underline">Sign in</Link> for faster checkout
                    </p>
                  </div>
                )}
                
                {isAuthenticated && !canQuickCheckout && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                      Complete your shipping and payment details for one-click checkout
                    </p>
                  </div>
                )}
                
                {/* Continue Shopping Link */}
                <div className="mt-4 text-center">
                  <Link to="/products" className="text-sm text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;