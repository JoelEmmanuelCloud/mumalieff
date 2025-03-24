import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Message from '../components/common/Message';

const CartPage = () => {
  const { cartItems, updateCartItem, removeFromCart, itemsPrice, shippingPrice, taxPrice, totalPrice, applyPromoCode, removePromoCode, promoCode, discount } = useCart();
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
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-semibold mb-6 dark:text-white">Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <Message>
            Your cart is empty. <Link to="/products" className="text-primary font-medium">Continue Shopping</Link>
          </Message>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cartItems.map((item) => (
                    <li key={`${item.product}-${item.size}-${item.color}`} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row">
                        {/* Product Image */}
                        <div className="sm:flex-shrink-0 mb-4 sm:mb-0">
                          <Link to={`/product/${item.product}`}>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full sm:w-24 h-24 object-cover object-center rounded-md"
                            />
                          </Link>
                        </div>
                        
                        {/* Product Info */}
                        <div className="sm:ml-6 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-base font-medium dark:text-white">
                                <Link to={`/product/${item.product}`}>{item.name}</Link>
                              </h3>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Size: {item.size} | Color: {item.color}
                              </p>
                              
                              {item.customDesign && item.customDesign.hasCustomDesign && (
                                <p className="mt-1 text-sm text-accent-gold">
                                  Custom Design
                                </p>
                              )}
                            </div>
                            
                            <p className="text-base font-medium dark:text-white">
                              ₦{(item.price * item.qty).toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="mt-4 flex justify-between items-center">
                            <div className="flex items-center">
                              <button
                                onClick={() => updateCartItem(item.product, Math.max(1, item.qty - 1), item.size, item.color)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-l bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-300"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateCartItem(item.product, Math.max(1, parseInt(e.target.value) || 1), item.size, item.color)}
                                min="1"
                                max={item.countInStock}
                                className="w-12 h-8 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-center text-gray-700 dark:text-white"
                              />
                              <button
                                onClick={() => updateCartItem(item.product, Math.min(item.countInStock, item.qty + 1), item.size, item.color)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-r bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-300"
                              >
                                +
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeFromCart(item.product, item.size, item.color)}
                              className="text-error hover:text-error-dark dark:text-error-light"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            
            {/* Order Summary */}
            <div>
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
                    <span className="font-medium dark:text-white">₦{itemsPrice.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                    <span className="font-medium dark:text-white">
                      {shippingPrice > 0 ? `₦${shippingPrice.toLocaleString()}` : 'Free'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600 dark:text-gray-300">Tax (7.5% VAT)</span>
                    <span className="font-medium dark:text-white">₦{taxPrice.toLocaleString()}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-base">
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
                
                {/* Promo Code */}
                <div className="mt-6">
                  <label htmlFor="promo-code" className="form-label">Promo Code</label>
                  <div className="flex">
                    <input
                      type="text"
                      id="promo-code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="form-input rounded-r-none"
                      placeholder="Enter code"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-error text-sm mt-1">{promoError}</p>}
                  {promoCode && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-success dark:text-success-light">
                        Code <span className="font-medium">{promoCode}</span> applied
                      </span>
                      <button
                        onClick={removePromoCode}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Checkout Button */}
                <div className="mt-6">
                  <button
                    onClick={handleCheckout}
                    className="btn btn-primary w-full py-3"
                    disabled={cartItems.length === 0}
                  >
                    Proceed to Checkout
                  </button>
                </div>
                
                {/* Continue Shopping Link */}
                <div className="mt-4 text-center">
                  <Link to="/products" className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue">
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