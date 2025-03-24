import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Message from '../components/common/Message';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { shippingAddress, savePaymentMethod } = useCart();
  
  // State
  const [paymentMethod, setPaymentMethod] = useState('paystack-card');
  
  // Redirect to shipping if no shipping address
  useEffect(() => {
    if (!shippingAddress.address) {
      navigate('/shipping');
    }
  }, [shippingAddress, navigate]);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    savePaymentMethod(paymentMethod);
    navigate('/placeorder');
  };
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          {/* Checkout Steps */}
          <div className="flex justify-between mb-8">
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
                <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center font-medium mx-auto">
                  2
                </div>
                <p className="mt-2 text-sm font-medium text-primary dark:text-white">Payment</p>
              </div>
            </div>
            <div className="w-1/3 text-center">
              <div className="relative">
                <div className="h-8 w-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-medium mx-auto dark:bg-gray-700 dark:text-gray-300">
                  3
                </div>
                <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Place Order</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold mb-6 dark:text-white">Payment Method</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-4 dark:text-white">Select Payment Method</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="paystack-card"
                      name="paymentMethod"
                      value="paystack-card"
                      checked={paymentMethod === 'paystack-card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
                    />
                    <label htmlFor="paystack-card" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Paystack - Card Payment
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="paystack-transfer"
                      name="paymentMethod"
                      value="paystack-transfer"
                      checked={paymentMethod === 'paystack-transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
                    />
                    <label htmlFor="paystack-transfer" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Paystack - Bank Transfer
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/shipping')}
                  className="btn btn-secondary"
                >
                  Back to Shipping
                </button>
                <button type="submit" className="btn btn-primary">
                  Continue to Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;