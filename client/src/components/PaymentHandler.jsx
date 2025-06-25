import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { 
  processPaystackPayment, 
  verifyPaymentAndUpdateOrder,
  retryPayment,
  formatAmount,
  validatePaymentAmount,
  handlePaymentError
} from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import Loader from './common/Loader';
import Message from './common/Message';

const PaymentHandler = ({ order, onPaymentSuccess, onPaymentError }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [error, setError] = useState(null);
  
  // Verify payment mutation
  const verifyPaymentMutation = useMutation(
    ({ reference, orderId }) => verifyPaymentAndUpdateOrder(reference, orderId),
    {
      onSuccess: (data) => {
        setPaymentStatus('success');
        toast.success('Payment verified successfully!');
        if (onPaymentSuccess) {
          onPaymentSuccess(data);
        } else {
          navigate(`/order/${order._id}`);
        }
      },
      onError: (error) => {
        setPaymentStatus('failed');
        const errorInfo = handlePaymentError(error);
        setError(errorInfo);
        toast.error(errorInfo.message);
        if (onPaymentError) {
          onPaymentError(errorInfo);
        }
      },
    }
  );
  
  // Retry payment mutation
  const retryPaymentMutation = useMutation(
    (orderId) => retryPayment(orderId),
    {
      onSuccess: (paymentData) => {
        toast.success('Payment retry initiated');
        handlePaystackPayment(paymentData.data);
      },
      onError: (error) => {
        const errorInfo = handlePaymentError(error);
        toast.error(errorInfo.message);
        setError(errorInfo);
      },
    }
  );
  
  // Check for payment reference in URL (redirect from Paystack)
  useEffect(() => {
    const reference = searchParams.get('reference');
    const status = searchParams.get('status');
    
    if (reference && order?._id) {
      if (status === 'success') {
        setPaymentStatus('verifying');
        verifyPaymentMutation.mutate({ reference, orderId: order._id });
      } else if (status === 'cancelled') {
        setPaymentStatus('cancelled');
        setError({ message: 'Payment was cancelled', code: 'cancelled' });
      }
      
      // Clean up URL
      navigate(window.location.pathname, { replace: true });
    }
  }, [searchParams, order, navigate, verifyPaymentMutation]);
  
  // Handle Paystack payment
  const handlePaystackPayment = async (paymentData = null) => {
    if (!order) {
      toast.error('Order information is missing');
      return;
    }
    
    // Validate payment amount
    const validation = validatePaymentAmount(order.totalPrice);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setPaymentStatus('processing');
    
    try {
      const paymentInfo = paymentData || {
        email: user?.email || order.user?.email,
        amount: order.totalPrice,
        orderId: order._id,
      };
      
      const response = await processPaystackPayment(paymentInfo);
      
      // Payment was successful on Paystack side
      setPaymentStatus('verifying');
      verifyPaymentMutation.mutate({ 
        reference: response.reference, 
        orderId: order._id 
      });
      
    } catch (error) {
      setIsProcessing(false);
      setPaymentStatus('failed');
      const errorInfo = handlePaymentError(error);
      setError(errorInfo);
      toast.error(errorInfo.message);
      
      if (onPaymentError) {
        onPaymentError(errorInfo);
      }
    }
  };
  
  // Handle retry payment
  const handleRetryPayment = () => {
    if (!order?._id) return;
    retryPaymentMutation.mutate(order._id);
  };
  
  // Render payment status
  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <div className="text-center py-8">
            <Loader />
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Processing your payment...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please don't close this window
            </p>
          </div>
        );
        
      case 'verifying':
        return (
          <div className="text-center py-8">
            <Loader />
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Verifying your payment...
            </p>
          </div>
        );
        
      case 'success':
        return (
          <Message variant="success" className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p>Your order has been confirmed and payment received.</p>
          </Message>
        );
        
      case 'failed':
        return (
          <Message variant="error" className="text-center py-8">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold mb-2">Payment Failed</h3>
            <p className="mb-4">{error?.message || 'An error occurred during payment'}</p>
            {error?.suggestion && (
              <p className="text-sm mb-4">{error.suggestion}</p>
            )}
            <button 
              onClick={handleRetryPayment}
              disabled={retryPaymentMutation.isLoading}
              className="btn btn-primary"
            >
              {retryPaymentMutation.isLoading ? 'Retrying...' : 'Retry Payment'}
            </button>
          </Message>
        );
        
      case 'cancelled':
        return (
          <Message variant="warning" className="text-center py-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2">Payment Cancelled</h3>
            <p className="mb-4">You cancelled the payment process.</p>
            <button 
              onClick={() => handlePaystackPayment()}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </Message>
        );
        
              default:
        return null;
    }
  };
  
  // Don't render if order is already paid
  if (order?.isPaid) {
    return (
      <Message variant="success" className="text-center py-4">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold">Order Already Paid</h3>
        <p>This order has been successfully paid.</p>
      </Message>
    );
  }
  
  // Don't render if order is cancelled
  if (order?.status === 'Cancelled') {
    return (
      <Message variant="error" className="text-center py-4">
        <div className="text-4xl mb-2">❌</div>
        <h3 className="text-lg font-semibold">Order Cancelled</h3>
        <p>This order has been cancelled and cannot be paid.</p>
      </Message>
    );
  }
  
  return (
    <div className="payment-handler">
      {paymentStatus !== 'idle' ? (
        renderPaymentStatus()
      ) : (
        <div className="payment-section">
          {/* Payment Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3 dark:text-white">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Order Total:</span>
                <span className="font-semibold dark:text-white">
                  {formatAmount(order?.totalPrice || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Items:</span>
                <span className="dark:text-gray-300">
                  {formatAmount(order?.itemsPrice || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Shipping:</span>
                <span className="dark:text-gray-300">
                  {order?.shippingPrice > 0 ? formatAmount(order.shippingPrice) : 'Free'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tax:</span>
                <span className="dark:text-gray-300">
                  {formatAmount(order?.taxPrice || 0)}
                </span>
              </div>
              {order?.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 dark:text-green-400">Discount:</span>
                  <span className="text-green-600 dark:text-green-400">
                    -{formatAmount(order.discount)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 dark:text-white">Payment Method</h3>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img 
                    src="/images/paystack-logo.png" 
                    alt="Paystack" 
                    className="h-8 w-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Secure Payment by Paystack
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Card, Bank Transfer, USSD & More
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Secure Payment
                </h3>
                <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  <p>Your payment information is encrypted and secure. We don't store your card details.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <Message variant="error" className="mb-6">
              <h4 className="font-semibold">Payment Error</h4>
              <p>{error.message}</p>
              {error.suggestion && (
                <p className="text-sm mt-1">{error.suggestion}</p>
              )}
            </Message>
          )}
          
          {/* Pay Now Button */}
          <button
            onClick={() => handlePaystackPayment()}
            disabled={isProcessing || !order || !user}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
              isProcessing || !order || !user
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-200'
            }`}
          >
            {isProcessing ? (
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
                Pay {formatAmount(order?.totalPrice || 0)} Now
              </div>
            )}
          </button>
          
          {/* Alternative Actions */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Having trouble with payment?{' '}
              <button 
                onClick={() => window.location.href = 'mailto:support@yourstore.com'}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Contact Support
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHandler;