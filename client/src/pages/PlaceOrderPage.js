//PlaceOrderPage.js 

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { createOrder } from '../services/orderService';
import { processPaystackPayment, handlePaymentError } from '../services/paymentService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import PaymentHandler from '../components/PaymentHandler';

const PlaceOrderPage = () => {
  const navigate = useNavigate();
  const { 
    cartItems, 
    shippingAddress, 
    paymentMethod, 
    itemsPrice, 
    shippingPrice, 
    totalPrice, // taxPrice removed
    discount, 
    promoCode, 
    resetCart 
  } = useCart();
  const { user } = useAuth();
  
  // State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentOption, setPaymentOption] = useState('pay_now'); // 'pay_now' or 'pay_later'

  // Create order mutation
  const createOrderMutation = useMutation(createOrder, {
    onSuccess: (data) => {
      setCreatedOrder(data);
      
      if (paymentOption === 'pay_now') {
        // Show payment modal immediately
        setShowPaymentModal(true);
      } else {
        // Navigate to order page for later payment
        resetCart();
        navigate(`/order/${data._id}`);
      }
    },
    onError: (error) => {
      console.error('Order creation error:', error);
    }
  });

  // Redirect if cart is empty or missing required data
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    } else if (!shippingAddress.address) {
      navigate('/shipping');
    } else if (!paymentMethod) {
      navigate('/payment');
    }
  }, [cartItems, shippingAddress, paymentMethod, navigate]);

  // Handle place order with immediate payment
  const handlePlaceAndPayOrder = () => {
    setPaymentOption('pay_now');
    createOrderMutation.mutate({
      orderItems: cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice: 0, // No VAT
      totalPrice,
      discount,
      promoCode,
    });
  };

  // Handle place order for later payment
  const handlePlaceOrderLater = () => {
    setPaymentOption('pay_later');
    createOrderMutation.mutate({
      orderItems: cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice: 0, // No VAT
      totalPrice,
      discount,
      promoCode,
    });
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentData) => {
    resetCart();
    setShowPaymentModal(false);
    navigate(`/order/${createdOrder._id}`, { 
      state: { paymentSuccess: true } 
    });
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    setShowPaymentModal(false);
    // Navigate to order page where user can retry payment
    navigate(`/order/${createdOrder._id}`, { 
      state: { paymentError: error.message } 
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        {/* Checkout Steps */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between">
            <div className="w-1/3 text-center">
              <div className="relative">
                <div className="h-8 w-8 bg-success text-white rounded-full flex items-center justify-center font-medium mx-auto">
                  ✓
                </div>
                <p className="mt-2 text-sm font-medium text-success dark:text-success-light">Shipping</p>
              </div>
            </div>
            <div className="w-1/3 text-center">
              <div className="relative">
                <div className="h-8 w-8 bg-success text-white rounded-full flex items-center justify-center font-medium mx-auto">
                  ✓
                </div>
                <p className="mt-2 text-sm font-medium text-success dark:text-success-light">Payment</p>
              </div>
            </div>
            <div className="w-1/3 text-center">
              <div className="relative">
                <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center font-medium mx-auto">
                  3
                </div>
                <p className="mt-2 text-sm font-medium text-primary dark:text-white">Place Order</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Shipping</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Address:</strong> {shippingAddress.address}, {shippingAddress.city},{' '}
                  {shippingAddress.state} {shippingAddress.postalCode},{' '}
                  {shippingAddress.country}
                </p>
              </div>
              
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Payment Method</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Method:</strong>{' '}
                  {paymentMethod === 'paystack-card' ? 'Paystack - Card Payment' : 'Paystack - Bank Transfer'}
                </p>
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Order Items</h2>
                
                {cartItems.length === 0 ? (
                  <Message>Your cart is empty</Message>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cartItems.map((item) => (
                      <li key={`${item.product}-${item.size}-${item.color}`} className="py-4 flex">
                        <div className="flex-shrink-0 w-16 h-16">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <Link to={`/product/${item.product}`} className="font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </Link>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Size: {item.size} | Color: {item.color}
                              </p>
                              
                              {item.customDesign && item.customDesign.hasCustomDesign && (
                                <p className="mt-1 text-sm text-accent-gold">
                                  Custom Design
                                </p>
                              )}
                            </div>
                            <p className="text-gray-900 dark:text-white">
                              {item.qty} x ₦{item.price.toLocaleString()} = ₦{(item.qty * item.price).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Payment Options */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Choose Payment Option</h2>
              
              <div className="space-y-4">
                <div className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    id="pay_now"
                    name="paymentOption"
                    value="pay_now"
                    checked={paymentOption === 'pay_now'}
                    onChange={(e) => setPaymentOption(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="pay_now" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    <div>
                      <p className="font-semibold text-green-600 dark:text-green-400">Pay Now (Recommended)</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Complete payment immediately and confirm your order</p>
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    id="pay_later"
                    name="paymentOption"
                    value="pay_later"
                    checked={paymentOption === 'pay_later'}
                    onChange={(e) => setPaymentOption(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="pay_later" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    <div>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">Place Order & Pay Later</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Place order now and complete payment from your orders page</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-6 dark:text-white">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-300">Items</span>
                  <span className="font-medium dark:text-white">₦{itemsPrice.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                  <span className="font-medium dark:text-white">
                    {shippingPrice > 0 ? `₦${shippingPrice.toLocaleString()}` : 'Free'}
                  </span>
                </div>
                
                {/* VAT line removed completely */}
                
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
              
              {createOrderMutation.error && (
                <Message variant="error" className="my-4">
                  {createOrderMutation.error.response?.data?.message || 'Error creating order'}
                </Message>
              )}
              
              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {paymentOption === 'pay_now' ? (
                  <button
                    type="button"
                    onClick={handlePlaceAndPayOrder}
                    disabled={cartItems.length === 0 || createOrderMutation.isLoading}
                    className="btn btn-success w-full py-4 text-lg font-semibold"
                  >
                    {createOrderMutation.isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader size="small" />
                        <span className="ml-2">Creating Order...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                        </svg>
                        Pay Now - ₦{totalPrice.toLocaleString()}
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlaceOrderLater}
                    disabled={cartItems.length === 0 || createOrderMutation.isLoading}
                    className="btn btn-primary w-full py-4 text-lg font-semibold"
                  >
                    {createOrderMutation.isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader size="small" />
                        <span className="ml-2">Creating Order...</span>
                      </div>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                )}
                
                {/* Back to Payment Button */}
                <button
                  type="button"
                  onClick={() => navigate('/payment')}
                  className="btn btn-secondary w-full"
                  disabled={createOrderMutation.isLoading}
                >
                  Back to Payment Method
                </button>
              </div>

              {/* Security Notice */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      Secure Payment
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Your payment is protected by 256-bit SSL encryption
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && createdOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold dark:text-white">
                    Complete Your Payment
                  </h3>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      navigate(`/order/${createdOrder._id}`);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <p className="text-green-800 dark:text-green-200 font-medium">
                        Order Created Successfully!
                      </p>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        Order #{createdOrder.orderNumber || createdOrder._id?.slice(-8)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <PaymentHandler
                  order={createdOrder}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceOrderPage;