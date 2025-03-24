import api from './apiConfig';

// Get all products with filters
export const getProducts = async (params = {}) => {
  const { 
    keyword, 
    pageNumber = 1, 
    category, 
    minPrice, 
    maxPrice, 
    size, 
    color, 
    sort, 
    featured, 
    onSale 
  } = params;
  
  let url = `/products?pageNumber=${pageNumber}`;
  
  if (keyword) url += `&keyword=${keyword}`;
  if (category) url += `&category=${category}`;
  if (minPrice) url += `&minPrice=${minPrice}`;
  if (maxPrice) url += `&maxPrice=${maxPrice}`;
  if (size) url += `&size=${size}`;
  if (color) url += `&color=${color}`;
  if (sort) url += `&sort=${sort}`;
  if (featured) url += `&featured=${featured}`;
  if (onSale) url += `&onSale=${onSale}`;
  
  const response = await api.get(url);
  return response.data;
};

// Get product by ID
export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Get top rated products
export const getTopProducts = async (limit = 5) => {
  const response = await api.get(`/products/top?limit=${limit}`);
  return response.data;
};

// Get featured products
export const getFeaturedProducts = async (limit = 6) => {
  const response = await api.get(`/products/featured?limit=${limit}`);
  return response.data;
};

// Get sale products
export const getSaleProducts = async (limit = 6) => {
  const response = await api.get(`/products/sale?limit=${limit}`);
  return response.data;
};

// Create product review
export const createProductReview = async (productId, reviewData) => {
  const response = await api.post(`/products/${productId}/reviews`, reviewData);
  return response.data;
};

// Admin: Create product
export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

// Admin: Update product
export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

// Admin: Delete product
export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};