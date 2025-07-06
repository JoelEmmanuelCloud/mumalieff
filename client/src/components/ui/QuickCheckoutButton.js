import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { createOrder } from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import PaymentHandler from '../../components/PaymentHandler';
import Loader from '../../components/common/Loader';

const QuickCheckoutButton = ({ className = "", disabled = false }) => {
  const navigate = useNavigate();
  const { 
    cartItems, 
    shippingAddress, 
    paymentMethod, 
    itemsPrice, 
    shippingPrice, 
    taxPrice, 
    totalPrice, 
    discount, 
    promoCode, 
    resetCart 
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const createOrderMutation = useMutation(createOrder, {
    onSuccess: (data) => {
      setCreatedOrder(data);
      setShowPaymentModal(true);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create order');
    }
  });

  const handleQuickCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }

    if (!shippingAddress.address) {
      navigate('/shipping');
      return;
    }

    if (!paymentMethod) {
      navigate('/payment');
      return;
    }

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

  const handlePaymentSuccess = (paymentData) => {
    resetCart();
    setShowPaymentModal(false);
    toast.success('Payment successful! Order confirmed.');
    navigate(`/order/${createdOrder._id}`, { 
      state: { paymentSuccess: true } 
    });
  };

  const handlePaymentError = (error) => {
    setShowPaymentModal(false);
    toast.error(error.message || 'Payment failed');
    navigate(`/order/${createdOrder._id}`, { 
      state: { paymentError: error.message } 
    });
  };

  const isDisabled = disabled || cartItems.length === 0 || createOrderMutation.isLoading;

  return (
    <>
      <button
        onClick={handleQuickCheckout}
        disabled={isDisabled}
        className={`btn btn-success w-full py-3 text-lg font-semibold ${className} ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {createOrderMutation.isLoading ? (
          <div className="flex items-center justify-center">
            <Loader size="small" />
            <span className="ml-2">Processing...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
            Checkout & Pay Now
          </div>
        )}
      </button>

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
    </>
  );
};

export default QuickCheckoutButton;