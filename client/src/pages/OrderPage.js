import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { 
  getOrderById, 
  cancelOrder, 
  confirmOrderDelivery,
  reportOrderIssue,
  getOrderTracking
} from '../services/orderService';
import { 
  retryPayment, 
  checkPaymentStatus,
  formatAmount 
} from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';
import PaymentHandler from '../components/PaymentHandler';

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [showPaymentHandler, setShowPaymentHandler] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueType, setIssueType] = useState('');

  // Fetch order details
  const { 
    data: order, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['order', id], 
    () => getOrderById(id),
    {
      enabled: !!id,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch tracking info for shipped orders
  const { data: trackingInfo } = useQuery(
    ['orderTracking', id],
    () => getOrderTracking(id),
    {
      enabled: !!id && order?.status === 'Shipped',
      refetchInterval: 30000, // Refetch every 30 seconds for shipped orders
    }
  );

  // Cancel order mutation
  const cancelOrderMutation = useMutation(
    ({ orderId, reason }) => cancelOrder(orderId),
    {
      onSuccess: () => {
        toast.success('Order cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries(['orders']);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to cancel order');
      },
    }
  );

  // Confirm delivery mutation
  const confirmDeliveryMutation = useMutation(
    (orderId) => confirmOrderDelivery(orderId),
    {
      onSuccess: () => {
        toast.success('Delivery confirmed successfully');
        queryClient.invalidateQueries(['order', id]);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to confirm delivery');
      },
    }
  );

  // Report issue mutation
  const reportIssueMutation = useMutation(
    ({ orderId, issueData }) => reportOrderIssue(orderId, issueData),
    {
      onSuccess: () => {
        toast.success('Issue reported successfully. We will contact you soon.');
        setShowIssueModal(false);
        setIssueDescription('');
        setIssueType('');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to report issue');
      },
    }
  );

  // Retry payment mutation
  const retryPaymentMutation = useMutation(
    (orderId) => retryPayment(orderId),
    {
      onSuccess: (paymentData) => {
        toast.success('Payment retry initiated');
        setShowPaymentHandler(true);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to retry payment');
      },
    }
  );

  // Handle payment success
  const handlePaymentSuccess = (paymentData) => {
    toast.success('Payment successful!');
    setShowPaymentHandler(false);
    queryClient.invalidateQueries(['order', id]);
    queryClient.invalidateQueries(['orders']);
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    toast.error(error.message || 'Payment failed');
    setShowPaymentHandler(false);
  };

  // Handle cancel order
  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    cancelOrderMutation.mutate({ orderId: id, reason: cancelReason });
  };

  // Handle report issue
  const handleReportIssue = () => {
    if (!issueType || !issueDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    reportIssueMutation.mutate({
      orderId: id,
      issueData: {
        type: issueType,
        description: issueDescription,
      }
    });
  };

  // Get order status color
  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'text-yellow-600 bg-yellow-100',
      'Processing': 'text-blue-600 bg-blue-100',
      'Shipped': 'text-purple-600 bg-purple-100',
      'Delivered': 'text-green-600 bg-green-100',
      'Cancelled': 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  // Check if order can be cancelled
  const canCancelOrder = () => {
    return ['Pending', 'Processing'].includes(order?.status) && !cancelOrderMutation.isLoading;
  };

  // Check if payment can be retried
  const canRetryPayment = () => {
    return !order?.isPaid && ['Pending', 'Processing'].includes(order?.status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-8">
        <Message variant="error">
          {error.response?.data?.message || 'Failed to load order'}
        </Message>
        <div className="mt-4">
          <button 
            onClick={() => navigate('/orders')}
            className="btn btn-secondary"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-8">
        <Message variant="error">Order not found</Message>
        <div className="mt-4">
          <button 
            onClick={() => navigate('/orders')}
            className="btn btn-secondary"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold dark:text-white">
              Order #{order.orderNumber || order._id?.slice(-8)}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            
            {order.isPaid ? (
              <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-100">
                Paid
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm font-medium text-red-600 bg-red-100">
                Payment Pending
              </span>
            )}
          </div>
        </div>

        {/* Payment Handler Modal */}
        {showPaymentHandler && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold dark:text-white">Complete Payment</h3>
                  <button
                    onClick={() => setShowPaymentHandler(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <PaymentHandler
                  order={order}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2">
            {/* Payment Status Alert */}
            {!order.isPaid && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Payment Required
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Complete your payment to process this order.
                    </p>
                  </div>
                  {canRetryPayment() && (
                    <button
                      onClick={() => setShowPaymentHandler(true)}
                      className="ml-4 btn btn-primary btn-sm"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold dark:text-white">Order Items</h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="p-6 flex">
                    <div className="flex-shrink-0 w-20 h-20">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <Link 
                            to={`/product/${item.product}`} 
                            className="font-medium text-gray-900 dark:text-white hover:text-primary"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Size: {item.size} | Color: {item.color}
                          </p>
                          {item.customDesign?.hasCustomDesign && (
                            <p className="mt-1 text-sm text-accent-gold">
                              Custom Design
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Quantity: {item.qty}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ₦{item.price.toLocaleString()} each
                          </p>
                          <p className="font-medium dark:text-white">
                            ₦{(item.price * item.qty).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Shipping Information</h2>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
              
              {order.trackingNumber && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    Tracking Information
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300">
                    Tracking Number: <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                  {trackingInfo && (
                    <div className="mt-2">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {trackingInfo.status} - {trackingInfo.location}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Actions */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Order Actions</h2>
              
              <div className="flex flex-wrap gap-3">
                {canCancelOrder() && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="btn btn-secondary"
                    disabled={cancelOrderMutation.isLoading}
                  >
                    Cancel Order
                  </button>
                )}
                
                {order.status === 'Delivered' && (
                  <button
                    onClick={() => confirmDeliveryMutation.mutate(id)}
                    className="btn btn-success"
                    disabled={confirmDeliveryMutation.isLoading}
                  >
                    Confirm Delivery
                  </button>
                )}
                
                <button
                  onClick={() => setShowIssueModal(true)}
                  className="btn btn-secondary"
                >
                  Report Issue
                </button>
                
                <Link to="/orders" className="btn btn-secondary">
                  Back to Orders
                </Link>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-6 dark:text-white">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                  <span className="font-medium dark:text-white">
                    ₦{order.itemsPrice.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                  <span className="font-medium dark:text-white">
                    {order.shippingPrice > 0 ? `₦${order.shippingPrice.toLocaleString()}` : 'Free'}
                  </span>
                </div>
                
                <div className="flex justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-300">Tax (0.0% VAT)</span>
                  <span className="font-medium dark:text-white">
                    ₦{order.taxPrice.toLocaleString()}
                  </span>
                </div>
                
                {order.discount > 0 && (
                  <div className="flex justify-between text-base">
                    <span className="text-success dark:text-success-light">
                      Discount {order.promoCode && `(${order.promoCode})`}
                    </span>
                    <span className="font-medium text-success dark:text-success-light">
                      -₦{order.discount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="dark:text-white">Total</span>
                    <span className="dark:text-white">₦{order.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-3 dark:text-white">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Method:</span>
                    <span className="dark:text-white">
                      {order.paymentMethod === 'paystack-card' ? 'Card Payment' : 
                       order.paymentMethod === 'paystack-transfer' ? 'Bank Transfer' : 
                       'Paystack'}
                    </span>
                  </div>
                  
                  {order.paymentReference && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Reference:</span>
                      <span className="font-mono text-xs dark:text-white">
                        {order.paymentReference}
                      </span>
                    </div>
                  )}
                  
                  {order.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Paid At:</span>
                      <span className="dark:text-white">
                        {new Date(order.paidAt).toLocaleDateString('en-NG')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Estimated Delivery */}
              {order.estimatedDeliveryDate && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 text-sm">
                    Estimated Delivery
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-NG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  Cancel Order
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
                
                <div className="mb-4">
                  <label className="form-label">Reason for cancellation</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="form-input"
                    rows="3"
                    placeholder="Please provide a reason for cancellation..."
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                    }}
                    className="btn btn-secondary"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelOrderMutation.isLoading}
                    className="btn btn-error"
                  >
                    {cancelOrderMutation.isLoading ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Issue Modal */}
        {showIssueModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  Report Issue
                </h3>
                
                <div className="mb-4">
                  <label className="form-label">Issue Type</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Select issue type</option>
                    <option value="damaged_item">Damaged Item</option>
                    <option value="wrong_item">Wrong Item Received</option>
                    <option value="missing_item">Missing Item</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="delivery_issue">Delivery Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="form-label">Description</label>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    className="form-input"
                    rows="4"
                    placeholder="Please describe the issue in detail..."
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowIssueModal(false);
                      setIssueDescription('');
                      setIssueType('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportIssue}
                    disabled={reportIssueMutation.isLoading}
                    className="btn btn-primary"
                  >
                    {reportIssueMutation.isLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;