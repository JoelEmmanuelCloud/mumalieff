import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { 
  processPaystackPayment, 
  verifyPaymentAndUpdateOrder,
  directPaymentVerification,
  retryPayment,
  formatAmount,
  validatePaymentAmount,
  handlePaymentError
} from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const PaymentHandler = ({ order, onPaymentSuccess, onPaymentError }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Verify payment mutation with enhanced error handling
  const verifyPaymentMutation = useMutation(
    ({ reference, orderId }) => {
      console.log('Starting payment verification...', { reference, orderId });
      return verifyPaymentAndUpdateOrder(reference, orderId);
    },
    {
      onSuccess: (data) => {
        console.log('Payment verification successful:', data);
        setPaymentStatus('success');
        setIsProcessing(false);
        toast.success('Payment verified successfully!');
        
        if (onPaymentSuccess) {
          onPaymentSuccess(data);
        } else {
          // Small delay to show success message
          setTimeout(() => {
            navigate(`/order/${order._id}`, { 
              state: { paymentSuccess: true } 
            });
          }, 2000);
        }
      },
      onError: (error) => {
        console.error('Payment verification failed:', error);
        setPaymentStatus('failed');
        setIsProcessing(false);
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
        console.log('Payment retry successful:', paymentData);
        toast.success('Payment retry initiated');
        setRetryCount(prev => prev + 1);
        handlePaystackPayment(paymentData);
      },
      onError: (error) => {
        console.error('Payment retry failed:', error);
        const errorInfo = handlePaymentError(error);
        toast.error(errorInfo.message);
        setError(errorInfo);
      },
    }
  );
  
  // Check for payment reference in URL (redirect from Paystack)
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const status = searchParams.get('status');
    
    console.log('URL params:', { reference, status });
    
    if (reference && order?._id) {
      if (status === 'success' || status === 'successful') {
        console.log('Payment success detected from URL, verifying...');
        setPaymentStatus('verifying');
        verifyPaymentMutation.mutate({ reference, orderId: order._id });
      } else if (status === 'cancelled' || status === 'failed') {
        setPaymentStatus('cancelled');
        setError({ 
          message: status === 'cancelled' ? 'Payment was cancelled' : 'Payment failed',
          code: status 
        });
      }
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, order, verifyPaymentMutation]);
  
  // FIXED: Enhanced Paystack payment handler
  const handlePaystackPayment = async (paymentData = null) => {
    if (!order) {
      toast.error('Order information is missing');
      return;
    }

    if (!user?.email) {
      toast.error('User email is required for payment');
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
        email: user.email,
        amount: order.totalPrice,
        orderId: order._id,
        callbackUrl: `${window.location.origin}/order/${order._id}?payment=success`
      };
      
      console.log('Processing payment with data:', paymentInfo);
      
      const response = await processPaystackPayment(paymentInfo);
      
      console.log('Paystack payment response:', response);
      
      // Payment was successful on Paystack side, now verify
      setPaymentStatus('verifying');
      
      // Add a small delay to allow webhook processing
      setTimeout(() => {
        verifyPaymentMutation.mutate({ 
          reference: response.reference, 
          orderId: order._id 
        });
      }, 3000);
      
    } catch (error) {
      console.error('Payment processing error:', error);
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
    
    if (retryCount >= 3) {
      toast.error('Maximum retry attempts reached. Please contact support.');
      return;
    }
    
    setError(null);
    setPaymentStatus('idle');
    retryPaymentMutation.mutate(order._id);
  };
  
  // Handle manual payment verification (for debugging)
  const handleManualVerification = () => {
    const reference = prompt('Enter payment reference to verify:');
    if (reference && order?._id) {
      setPaymentStatus('verifying');
      verifyPaymentMutation.mutate({ reference, orderId: order._id });
    }
  };
  
  // Render payment status
  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg font-medium">
              Opening payment gateway...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Please complete your payment in the popup window
            </p>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Don't close this window until payment is complete
              </p>
            </div>
          </div>
        );
        
      case 'verifying':
        return (
          <div className="text-center py-8">
            <div className="animate-pulse">
              <div className="rounded-full h-16 w-16 bg-blue-600 mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg font-medium">
              Verifying your payment...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This may take a few seconds
            </p>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        );
        
      case 'success':
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
              Payment Successful! 🎉
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your order has been confirmed and payment received.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You will be redirected to your order page shortly...
            </p>
          </div>
        );
        
      case 'failed':
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Payment Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error?.message || 'An error occurred during payment'}
            </p>
            {error?.suggestion && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                💡 {error.suggestion}
              </p>
            )}
            <div className="space-y-3">
              {retryCount < 3 && (
                <button 
                  onClick={handleRetryPayment}
                  disabled={retryPaymentMutation.isLoading}
                  className="btn btn-primary w-full"
                >
                  {retryPaymentMutation.isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader size="small" />
                      <span className="ml-2">Retrying...</span>
                    </div>
                  ) : (
                    `Try Again (${3 - retryCount} attempts left)`
                  )}
                </button>
              )}
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => window.location.href = 'mailto:support@mumalieff.com'}
                  className="btn btn-secondary flex-1"
                >
                  Contact Support
                </button>
                
                {process.env.NODE_ENV === 'development' && (
                  <button 
                    onClick={handleManualVerification}
                    className="btn btn-outline flex-1 text-xs"
                  >
                    Manual Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'cancelled':
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-4">
              <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
              Payment Cancelled
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You cancelled the payment process.
            </p>
            <button 
              onClick={() => {
                setPaymentStatus('idle');
                setError(null);
                handlePaystackPayment();
              }}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Don't render if order is already paid
  if (order?.isPaid) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
          Order Already Paid ✅
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          This order has been successfully paid.
        </p>
      </div>
    );
  }
  
  // Don't render if order is cancelled
  if (order?.status === 'Cancelled') {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
          Order Cancelled ❌
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          This order has been cancelled and cannot be paid.
        </p>
      </div>
    );
  }
  
  return (
    <div className="payment-handler max-w-2xl mx-auto">
      {paymentStatus !== 'idle' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          {renderPaymentStatus()}
        </div>
      ) : (
        <div className="payment-section space-y-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
              </svg>
              Payment Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Order Total:</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatAmount(order?.totalPrice || 0)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
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
          </div>
          
          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Secure Payment by Paystack
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-2xl mb-1">💳</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Cards</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-2xl mb-1">🏦</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Bank</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-2xl mb-1">📱</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">USSD</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-2xl mb-1">📋</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Transfer</div>
              </div>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Payment Error
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error.message}
                  </p>
                  {error.suggestion && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      💡 {error.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Pay Now Button */}
          <button
            onClick={() => handlePaystackPayment()}
            disabled={isProcessing || !order || !user}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              isProcessing || !order || !user
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5 focus:ring-4 focus:ring-green-200'
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
                Pay {formatAmount(order?.totalPrice || 0)} Securely
              </div>
            )}
          </button>
          
          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  🔒 Your payment is secure
                </h3>
                <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  <p>Protected by 256-bit SSL encryption. We don't store your payment details.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Support Link */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Having trouble with payment?{' '}
              <button 
                onClick={() => window.location.href = 'mailto:support@mumalieff.com'}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
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