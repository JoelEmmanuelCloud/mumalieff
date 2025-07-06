import api from './apiConfig';
import axios from 'axios';

export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (userData) => {
  const response = await api.put('/users/profile', userData);
  return response.data;
};

export const addShippingAddress = async (addressData) => {
  const response = await api.post('/users/shipping', addressData);
  return response.data;
};

export const updateShippingAddress = async (id, addressData) => {
  const response = await api.put(`/users/shipping/${id}`, addressData);
  return response.data;
};

export const addToWishlist = async (productId) => {
  const response = await api.post('/users/wishlist', { productId });
  return response.data;
};

export const removeFromWishlist = async (productId) => {
  const response = await api.delete(`/users/wishlist/${productId}`);
  return response.data;
};

export const getWishlist = async () => {
  const response = await api.get('/users/wishlist');
  return response.data;
};

export const getUsers = async (pageNumber = 1, keyword = '') => {
  let url = `/users?pageNumber=${pageNumber}`;
  
  if (keyword) {
    url += `&keyword=${keyword}`;
  }
  
  const response = await api.get(url);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

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