import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { getOrderById, payOrder, cancelOrder } from '../services/orderService';
import { processPaystackPayment, verifyPaystack } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Fetch order details
  const { data: order, isLoading, error, refetch } = useQuery(
    ['order', id],
    () => getOrderById(id),
    {
      enabled: !!id,
    }
  );
  
  // Pay order mutation
  const payOrderMutation = useMutation(payOrder, {
    onSuccess: () => {
      refetch();
      toast.success('Payment successful');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Payment failed');
    },
  });
  
  // Cancel order mutation
  const cancelOrderMutation = useMutation(cancelOrder, {
    onSuccess: () => {
      refetch();
      toast.success('Order cancelled successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });
  
  // Verify payment mutation
  const verifyPaymentMutation = useMutation(verifyPaystack, {
    onSuccess: (data) => {
      // Update order status
      payOrderMutation.mutate({
        id,
        paymentResult: {
          id: data.order._id,
          status: 'success',
          update_time: new Date().toISOString(),
          email_address: user.email,
          reference: data.order.paymentResult.reference,
        },
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to verify payment');
      setIsProcessingPayment(false);
    },
  });
  
  // Handle Paystack payment
  const handlePaystackPayment = async () => {
    if (!order) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Generate reference
      const reference = `MUM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const response = await processPaystackPayment({
        email: user.email,
        amount: order.totalPrice,
        orderId: order._id,
        reference,
      });
      
      // Verify payment
      verifyPaymentMutation.mutate(response.reference);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment could not be processed. Please try again.');
      setIsProcessingPayment(false);
    }
  };
  
  // Handle cancel order
  const handleCancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(id);
    }
  };
  
  // Check URL for payment reference
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reference = searchParams.get('reference');
    
    if (reference) {
      verifyPaymentMutation.mutate(reference);
      
      // Remove reference from URL
      navigate(`/order/${id}`, { replace: true });
    }
  }, [id, navigate, verifyPaymentMutation]);
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="error">
            {error.response?.data?.message || 'Error loading order details'}
          </Message>
        ) : !order ? (
          <Message>Order not found</Message>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-semibold dark:text-white">Order #{order._id}</h1>
              <Link
                to="/orders"
                className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue"
              >
                Back to Orders
              </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Order Details */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden mb-6">
                  {/* Order Status */}
                  <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold dark:text-white">Order Status: {order.status}</h2>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'Delivered'
                          ? 'bg-success-light text-success'
                          : order.status === 'Cancelled'
                          ? 'bg-error-light text-error'
                          : 'bg-warning-light text-warning'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 dark:text-white">Shipping</h2>
                    <p className="mb-2 text-gray-700 dark:text-gray-300">
                      <strong>Name:</strong> {order.user.name}
                    </p>
                    <p className="mb-2 text-gray-700 dark:text-gray-300">
                      <strong>Email:</strong> {order.user.email}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Address:</strong> {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                      {order.shippingAddress.state} {order.shippingAddress.postalCode},{' '}
                      {order.shippingAddress.country}
                    </p>
                    
                    {order.isDelivered ? (
                      <Message variant="success" className="mt-4">
                        Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                      </Message>
                    ) : (
                      <Message className="mt-4">Not delivered yet</Message>
                    )}
                  </div>
                  
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 dark:text-white">Payment</h2>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Method:</strong>{' '}
                      {order.paymentMethod === 'paystack-card' ? 'Paystack - Card Payment' : 'Paystack - Bank Transfer'}
                    </p>
                    
                    {order.isPaid ? (
                      <Message variant="success" className="mt-4">
                        Paid on {new Date(order.paidAt).toLocaleDateString()}
                      </Message>
                    ) : (
                      <Message variant="warning" className="mt-4">Not paid yet</Message>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4 dark:text-white">Order Items</h2>
                    
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {order.orderItems.map((item) => (
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
                      <span className="font-medium dark:text-white">₦{order.itemsPrice.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                      <span className="font-medium dark:text-white">
                        {order.shippingPrice > 0 ? `₦${order.shippingPrice.toLocaleString()}` : 'Free'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600 dark:text-gray-300">Tax (7.5% VAT)</span>
                      <span className="font-medium dark:text-white">₦{order.taxPrice.toLocaleString()}</span>
                    </div>
                    
                    {order.discount > 0 && (
                      <div className="flex justify-between text-base">
                        <span className="text-success dark:text-success-light">Discount {order.promoCode && `(${order.promoCode})`}</span>
                        <span className="font-medium text-success dark:text-success-light">-₦{order.discount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="dark:text-white">Total</span>
                        <span className="dark:text-white">₦{order.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pay Button */}
                  {!order.isPaid && order.status !== 'Cancelled' && (
                    <div className="mt-6">
                      {isProcessingPayment || payOrderMutation.isLoading || verifyPaymentMutation.isLoading ? (
                        <div className="flex justify-center">
                          <Loader />
                        </div>
                      ) : (
                        <button
                          onClick={handlePaystackPayment}
                          className="btn btn-primary w-full py-3"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Cancel Button */}
                  {!order.isPaid && order.status !== 'Cancelled' && (
                    <div className="mt-4">
                      <button
                        onClick={handleCancelOrder}
                        className="btn btn-secondary w-full py-3"
                        disabled={cancelOrderMutation.isLoading}
                      >
                        {cancelOrderMutation.isLoading ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    </div>
                  )}
                  
                  {/* Order Tracking */}
                  {order.status !== 'Pending' && order.status !== 'Cancelled' && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold mb-4 dark:text-white">Order Tracking</h3>
                      
                      <div className="space-y-3">
                        <div className={`flex items-center ${order.isPaid ? 'text-success' : 'text-gray-400'}`}>
                          <div className={`flex-shrink-0 h-5 w-5 rounded-full ${order.isPaid ? 'bg-success' : 'bg-gray-200 dark:bg-gray-700'} flex items-center justify-center`}>
                            {order.isPaid && (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Payment Confirmed</p>
                          </div>
                        </div>
                        
                        <div className={`flex items-center ${order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered' ? 'text-success' : 'text-gray-400'}`}>
                          <div className={`flex-shrink-0 h-5 w-5 rounded-full ${order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered' ? 'bg-success' : 'bg-gray-200 dark:bg-gray-700'} flex items-center justify-center`}>
                            {(order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered') && (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Processing</p>
                          </div>
                        </div>
                        
                        <div className={`flex items-center ${order.status === 'Shipped' || order.status === 'Delivered' ? 'text-success' : 'text-gray-400'}`}>
                          <div className={`flex-shrink-0 h-5 w-5 rounded-full ${order.status === 'Shipped' || order.status === 'Delivered' ? 'bg-success' : 'bg-gray-200 dark:bg-gray-700'} flex items-center justify-center`}>
                            {(order.status === 'Shipped' || order.status === 'Delivered') && (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Shipped</p>
                            {order.trackingNumber && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">Tracking: {order.trackingNumber}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className={`flex items-center ${order.status === 'Delivered' ? 'text-success' : 'text-gray-400'}`}>
                          <div className={`flex-shrink-0 h-5 w-5 rounded-full ${order.status === 'Delivered' ? 'bg-success' : 'bg-gray-200 dark:bg-gray-700'} flex items-center justify-center`}>
                            {order.status === 'Delivered' && (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Delivered</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderPage;