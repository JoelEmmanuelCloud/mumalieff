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