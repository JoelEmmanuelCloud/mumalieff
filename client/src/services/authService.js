import api from './apiConfig';
import axios from 'axios';


// // Login user
// export const loginUser = async (userData) => {
//   const response = await api.post('/users/login', userData);
//   return response.data;
// };

// // Register user
// export const registerUser = async (userData) => {
//   const response = await api.post('/users', userData);
//   return response.data;
// };

// Get user profile
export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

// Update user profile
export const updateUserProfile = async (userData) => {
  const response = await api.put('/users/profile', userData);
  return response.data;
};

// Add shipping address
export const addShippingAddress = async (addressData) => {
  const response = await api.post('/users/shipping', addressData);
  return response.data;
};

// Update shipping address
export const updateShippingAddress = async (id, addressData) => {
  const response = await api.put(`/users/shipping/${id}`, addressData);
  return response.data;
};

// Add to wishlist
export const addToWishlist = async (productId) => {
  const response = await api.post('/users/wishlist', { productId });
  return response.data;
};

// Remove from wishlist
export const removeFromWishlist = async (productId) => {
  const response = await api.delete(`/users/wishlist/${productId}`);
  return response.data;
};

// Get wishlist
export const getWishlist = async () => {
  const response = await api.get('/users/wishlist');
  return response.data;
};

// Admin: Get all users with search support
export const getUsers = async (pageNumber = 1, keyword = '') => {
  let url = `/users?pageNumber=${pageNumber}`;
  
  if (keyword) {
    url += `&keyword=${keyword}`;
  }
  
  const response = await api.get(url);
  return response.data;
};

// Admin: Delete user
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Admin: Get user by ID
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Admin: Update user
export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

/**
* Change admin password
 * @param {Object} passwordData - Object containing current and new passwords
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @returns {Promise<Object>} User data
 */
export const changeAdminPassword = async ({ currentPassword, newPassword }) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
    },
  };

  const { data } = await axios.put(
    '/api/users/change-password',
    { currentPassword, newPassword },
    config
  );
  return data;
};