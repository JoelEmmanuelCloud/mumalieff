import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { createOrder } from '../services/orderService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';

const PlaceOrderPage = () => {
  const navigate = useNavigate();
  const { cartItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice, discount, promoCode, resetCart } = useCart();
  const { user } = useAuth();
  
  // Create order mutation
  const createOrderMutation = useMutation(createOrder, {
    onSuccess: (data) => {
      resetCart();
      navigate(`/order/${data._id}`);
    },
  });
  
  // Redirect if cart is empty or if shipping address/payment method not set
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    } else if (!shippingAddress.address) {
      navigate('/shipping');
    } else if (!paymentMethod) {
      navigate('/payment');
    }
  }, [cartItems, shippingAddress, paymentMethod, navigate]);
  
  // Handle place order
  const handlePlaceOrder = () => {
    createOrderMutation.mutate({
      orderItems: cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      discount,
      promoCode,
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
          </div>
          
          {/* Order Summary */}
          <div>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
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
              
              {createOrderMutation.error && (
                <Message variant="error" className="my-4">
                  {createOrderMutation.error.response?.data?.message || 'Error creating order'}
                </Message>
              )}
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={cartItems.length === 0 || createOrderMutation.isLoading}
                  className="btn btn-primary w-full py-3"
                >
                  {createOrderMutation.isLoading ? <Loader size="small" /> : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderPage;