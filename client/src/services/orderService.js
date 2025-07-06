import api from './apiConfig';

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const payOrder = async (id, paymentResult) => {
  const response = await api.put(`/orders/${id}/pay`, paymentResult);
  return response.data;
};

export const cancelOrder = async (id) => {
  const response = await api.put(`/orders/${id}/cancel`);
  return response.data;
};

export const getMyOrders = async (pageNumber = 1) => {
  const response = await api.get(`/orders/myorders?pageNumber=${pageNumber}`);
  return response.data;
};

export const getOrders = async (params = {}) => {
  const {
    pageNumber = 1,
    status,
    isPaid,
    isDelivered,
    startDate,
    endDate,
    userId
  } = params;

  let url = `/orders?pageNumber=${pageNumber}`;

  if (status) url += `&status=${status}`;
  if (isPaid !== undefined) url += `&isPaid=${isPaid}`;
  if (isDelivered !== undefined) url += `&isDelivered=${isDelivered}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  if (userId) url += `&userId=${userId}`;

  const response = await api.get(url);
  return response.data;
};

export const updateOrderStatus = async (id, statusData) => {
  const response = await api.put(`/orders/${id}/status`, statusData);
  return response.data;
};

export const getOrderStats = async () => {
  const response = await api.get('/orders/stats');
  return response.data;
};

export const getDailySales = async (days = 7) => {
  const response = await api.get(`/orders/daily-sales?days=${days}`);
  return response.data;
};

export const getOrderTracking = async (id) => {
  try {
    const response = await api.get(`/orders/${id}/tracking`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get tracking information');
  }
};

export const requestOrderCancellation = async (id, reason) => {
  try {
    const response = await api.put(`/orders/${id}/cancel-request`, { reason });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to request cancellation');
  }
};

export const getOrderInvoice = async (id) => {
  try {
    const response = await api.get(`/orders/${id}/invoice`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get invoice');
  }
};

export const retryOrderPayment = async (id) => {
  try {
    const response = await api.post(`/orders/${id}/retry-payment`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to retry payment');
  }
};

export const updateShippingAddress = async (id, shippingAddress) => {
  try {
    const response = await api.put(`/orders/${id}/shipping-address`, { shippingAddress });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update shipping address');
  }
};

export const validateOrderForPayment = async (orderData) => {
  try {
    const response = await api.post('/orders/validate', orderData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Order validation failed');
  }
};

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

export const checkOrderStatus = async (id) => {
  try {
    const response = await api.get(`/orders/${id}/status`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to check order status');
  }
};

export const confirmOrderDelivery = async (id, confirmationData = {}) => {
  try {
    const response = await api.put(`/orders/${id}/confirm-delivery`, confirmationData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to confirm delivery');
  }
};

export const reportOrderIssue = async (id, issueData) => {
  try {
    const response = await api.post(`/orders/${id}/report-issue`, issueData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to report issue');
  }
};

export const updateOrderTracking = async (id, trackingData) => {
  try {
    const response = await api.put(`/orders/${id}/tracking`, trackingData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update tracking');
  }
};

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

export const createOrderWithPayment = async (orderData) => {
  try {
    await validateOrderForPayment(orderData);
    const order = await createOrder(orderData);
    return order;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create order');
  }
};

export const processOrderPaymentAndUpdate = async (orderId, paymentResult) => {
  try {
    const updatedOrder = await payOrder(orderId, paymentResult);
    return updatedOrder;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to process payment');
  }
};

export const completeOrderWorkflow = async (orderData, paymentData) => {
  try {
    const order = await createOrderWithPayment(orderData);
    
    if (paymentData) {
      const paidOrder = await processOrderPaymentAndUpdate(order._id, paymentData);
      return paidOrder;
    }
    
    return order;
  } catch (error) {
    throw new Error(error.message || 'Failed to complete order workflow');
  }
};