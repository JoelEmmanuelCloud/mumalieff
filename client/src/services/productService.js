// productService.js for two-category system
import api from './apiConfig';

// Get all products with filters - updated for new category system
export const getProducts = async (params = {}) => {
  const {
    keyword,
    pageNumber = 1,
    category, // Now either 'Customize Your Prints' or 'Wear Your Conviction'
    minPrice,
    maxPrice,
    size,
    color,
    sort,
    featured,
    onSale,
    designStyle, // New filter for design styles within categories
    allowCustomization
  } = params;

  let url = `/products?pageNumber=${pageNumber}`;

  if (keyword) url += `&keyword=${keyword}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (minPrice) url += `&minPrice=${minPrice}`;
  if (maxPrice) url += `&maxPrice=${maxPrice}`;
  if (size) url += `&size=${size}`;
  if (color) url += `&color=${color}`;
  if (sort) url += `&sort=${sort}`;
  if (featured) url += `&featured=${featured}`;
  if (onSale) url += `&onSale=${onSale}`;
  if (designStyle) url += `&designStyle=${designStyle}`;
  if (allowCustomization !== undefined) url += `&allowCustomization=${allowCustomization}`;

  const response = await api.get(url);
  return response.data;
};

// Get customizable products (for Customize Your Prints)
export const getCustomizableProducts = async (params = {}) => {
  const customizableParams = {
    ...params,
    category: 'Customize Your Prints',
    allowCustomization: true
  };
  return getProducts(customizableParams);
};

// Get pre-designed products (for Wear Your Conviction)
export const getPreDesignedProducts = async (params = {}) => {
  const preDesignedParams = {
    ...params,
    category: 'Wear Your Conviction'
  };
  return getProducts(preDesignedParams);
};

// Get products by design style (within Wear Your Conviction)
export const getProductsByDesignStyle = async (designStyle, params = {}) => {
  const styleParams = {
    ...params,
    category: 'Wear Your Conviction',
    designStyle
  };
  return getProducts(styleParams);
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

// Get featured products from Wear Your Conviction category
export const getFeaturedConvictionProducts = async (limit = 6) => {
  const response = await api.get(`/products/featured?limit=${limit}&category=${encodeURIComponent('Wear Your Conviction')}`);
  return response.data;
};

// Get base products for customization
export const getBaseProductsForCustomization = async (limit = 10) => {
  const response = await api.get(`/products/base-for-customization?limit=${limit}`);
  return response.data;
};

// Create product review
export const createProductReview = async (productId, reviewData) => {
  const response = await api.post(`/products/${productId}/reviews`, reviewData);
  return response.data;
};

// Submit custom design order
export const submitCustomDesignOrder = async (orderData) => {
  const response = await api.post('/products/custom-order', orderData);
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

// Admin: Get custom design orders
export const getCustomDesignOrders = async (params = {}) => {
  const { pageNumber = 1, status, dateFrom, dateTo } = params;
  let url = `/admin/custom-orders?pageNumber=${pageNumber}`;
  
  if (status) url += `&status=${status}`;
  if (dateFrom) url += `&dateFrom=${dateFrom}`;
  if (dateTo) url += `&dateTo=${dateTo}`;
  
  const response = await api.get(url);
  return response.data;
};

// Admin: Update custom design order status
export const updateCustomOrderStatus = async (orderId, status, notes = '') => {
  const response = await api.put(`/admin/custom-orders/${orderId}/status`, {
    status,
    notes
  });
  return response.data;
};