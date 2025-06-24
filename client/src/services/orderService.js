import api from './apiConfig';

// Create order
export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

// Get order by ID
export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

// Pay order
export const payOrder = async (id, paymentResult) => {
  const response = await api.put(`/orders/${id}/pay`, paymentResult);
  return response.data;
};

// Cancel order
export const cancelOrder = async (id) => {
  const response = await api.put(`/orders/${id}/cancel`);
  return response.data;
};

// Get logged in user's orders
export const getMyOrders = async (pageNumber = 1) => {
  const response = await api.get(`/orders/myorders?pageNumber=${pageNumber}`);
  return response.data;
};

// Admin: Get all orders with enhanced filtering
export const getOrders = async (params = {}) => {
  const {
    pageNumber = 1,
    status,
    isPaid,
    isDelivered,
    startDate,
    endDate,
    userId // Add userId parameter
  } = params;

  let url = `/orders?pageNumber=${pageNumber}`;

  if (status) url += `&status=${status}`;
  if (isPaid !== undefined) url += `&isPaid=${isPaid}`;
  if (isDelivered !== undefined) url += `&isDelivered=${isDelivered}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  if (userId) url += `&userId=${userId}`; // Add userId to URL

  const response = await api.get(url);
  return response.data;
};

// Admin: Update order status
export const updateOrderStatus = async (id, statusData) => {
  const response = await api.put(`/orders/${id}/status`, statusData);
  return response.data;
};

// Admin: Get order statistics
export const getOrderStats = async () => {
  const response = await api.get('/orders/stats');
  return response.data;
};

// Admin: Get daily sales data
export const getDailySales = async (days = 7) => {
  const response = await api.get(`/orders/daily-sales?days=${days}`);
  return response.data;
};

// Get order tracking information
export const getOrderTracking = async (id) => {
  try {
    const response = await api.get(`/orders/${id}/tracking`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get tracking information');
  }
};

// Request order cancellation (for orders that can't be auto-cancelled)
export const requestOrderCancellation = async (id, reason) => {
  try {
    const response = await api.put(`/orders/${id}/cancel-request`, { reason });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to request cancellation');
  }
};

// Get order invoice/receipt
export const getOrderInvoice = async (id) => {
  try {
    const response = await api.get(`/orders/${id}/invoice`, {
      responseType: 'blob' // For PDF download
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get invoice');
  }
};

// Retry order payment
export const retryOrderPayment = async (id) => {
  try {
    const response = await api.post(`/orders/${id}/retry-payment`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to retry payment');
  }
};

// Update shipping address (only for pending orders)
export const updateShippingAddress = async (id, shippingAddress) => {
  try {
    const response = await api.put(`/orders/${id}/shipping-address`, { shippingAddress });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update shipping address');
  }
};

// Validate order before payment
export const validateOrderForPayment = async (orderData) => {
  try {
    const response = await api.post('/orders/validate', orderData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Order validation failed');
  }
};

// Get order total calculation (useful for cart updates)
export const calculateOrderTotal = async (orderItems, shippingAddress, promoCode = '') => {
  try {
    const response = await api.post('/orders/calculate-total', {
      orderItems,
      shippingAddress,
      promoCode
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to calculate order total');
  }
};

// Check order status
export const checkOrderStatus = async (id) => {
  try {
    const response = await api.get(`/orders/${id}/status`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to check order status');
  }
};

// Mark order as delivered (for delivery confirmation)
export const confirmOrderDelivery = async (id, confirmationData = {}) => {
  try {
    const response = await api.put(`/orders/${id}/confirm-delivery`, confirmationData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to confirm delivery');
  }
};

// Report order issue
export const reportOrderIssue = async (id, issueData) => {
  try {
    const response = await api.post(`/orders/${id}/report-issue`, issueData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to report issue');
  }
};

// Admin: Update order tracking
export const updateOrderTracking = async (id, trackingData) => {
  try {
    const response = await api.put(`/orders/${id}/tracking`, trackingData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update tracking');
  }
};

// Admin: Get order analytics
export const getOrderAnalytics = async (params = {}) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = params;
    let url = `/orders/analytics?groupBy=${groupBy}`;
    
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get analytics');
  }
};

// Admin: Export orders
export const exportOrders = async (params = {}) => {
  try {
    const response = await api.get('/orders/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to export orders');
  }
};

// Admin: Bulk update orders
export const bulkUpdateOrders = async (orderIds, updateData) => {
  try {
    const response = await api.put('/orders/bulk-update', {
      orderIds,
      updateData
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to bulk update orders');
  }
};

// Get order summary for dashboard
export const getOrderSummary = async (userId = null) => {
  try {
    let url = '/orders/summary';
    if (userId) url += `?userId=${userId}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get order summary');
  }
};

// Estimate delivery date
export const estimateDeliveryDate = async (shippingAddress, orderItems) => {
  try {
    const response = await api.post('/orders/estimate-delivery', {
      shippingAddress,
      orderItems
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to estimate delivery date');
  }
};

// Validate promo code for order
export const validatePromoCode = async (promoCode, orderTotal, orderItems) => {
  try {
    const response = await api.post('/orders/validate-promo', {
      promoCode,
      orderTotal,
      orderItems
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to validate promo code');
  }
};

// Format order for display
export const formatOrderForDisplay = (order) => {
  return {
    ...order,
    formattedTotal: `₦${order.totalPrice?.toLocaleString()}`,
    formattedDate: new Date(order.createdAt).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    statusBadgeColor: getStatusBadgeColor(order.status),
    canBeCancelled: ['Pending', 'Processing'].includes(order.status),
    canTrack: ['Shipped', 'Delivered'].includes(order.status),
    isDeliveryOverdue: order.estimatedDeliveryDate && 
      new Date(order.estimatedDeliveryDate) < new Date() && 
      !order.isDelivered
  };
};

// Helper function for status badge colors
const getStatusBadgeColor = (status) => {
  const colors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Processing': 'bg-blue-100 text-blue-800',
    'Shipped': 'bg-purple-100 text-purple-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Create order with payment integration
export const createOrderWithPayment = async (orderData) => {
  try {
    // Step 1: Validate order
    await validateOrderForPayment(orderData);
    
    // Step 2: Create order
    const order = await createOrder(orderData);
    
    // Step 3: Return order for payment processing
    return order;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create order');
  }
};

// Process order payment and update status
export const processOrderPaymentAndUpdate = async (orderId, paymentResult) => {
  try {
    // Update order payment status
    const updatedOrder = await payOrder(orderId, paymentResult);
    
    // You can add additional logic here like sending confirmation emails
    
    return updatedOrder;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to process payment');
  }
};

// Handle order completion workflow
export const completeOrderWorkflow = async (orderData, paymentData) => {
  try {
    // Create order
    const order = await createOrderWithPayment(orderData);
    
    // Process payment if provided
    if (paymentData) {
      const paidOrder = await processOrderPaymentAndUpdate(order._id, paymentData);
      return paidOrder;
    }
    
    return order;
  } catch (error) {
    // If order was created but payment failed, you might want to handle cleanup
    throw new Error(error.message || 'Failed to complete order workflow');
  }
};