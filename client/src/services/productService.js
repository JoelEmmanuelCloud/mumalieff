import api from './apiConfig';

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
    onSale,
    designStyle,
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

export const getCustomizableProducts = async (params = {}) => {
  const customizableParams = {
    ...params,
    category: 'Customize Your Prints',
    allowCustomization: true
  };
  return getProducts(customizableParams);
};

export const getPreDesignedProducts = async (params = {}) => {
  const preDesignedParams = {
    ...params,
    category: 'Wear Your Conviction'
  };
  return getProducts(preDesignedParams);
};

export const getProductsByDesignStyle = async (designStyle, params = {}) => {
  const styleParams = {
    ...params,
    category: 'Wear Your Conviction',
    designStyle
  };
  return getProducts(styleParams);
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getTopProducts = async (limit = 5) => {
  const response = await api.get(`/products/top?limit=${limit}`);
  return response.data;
};

export const getFeaturedProducts = async (limit = 6) => {
  const response = await api.get(`/products/featured?limit=${limit}`);
  return response.data;
};

export const getSaleProducts = async (limit = 6) => {
  const response = await api.get(`/products/sale?limit=${limit}`);
  return response.data;
};

export const getFeaturedConvictionProducts = async (limit = 6) => {
  const response = await api.get(`/products/featured?limit=${limit}&category=${encodeURIComponent('Wear Your Conviction')}`);
  return response.data;
};

export const getBaseProductsForCustomization = async (limit = 10) => {
  const response = await api.get(`/products/base-for-customization?limit=${limit}`);
  return response.data;
};

export const createProductReview = async (productId, reviewData) => {
  const response = await api.post(`/products/${productId}/reviews`, reviewData);
  return response.data;
};

export const updateProductReview = async (productId, reviewId, reviewData) => {
  const response = await api.put(`/products/${productId}/reviews/${reviewId}`, reviewData);
  return response.data;
};

export const deleteProductReview = async (productId, reviewId) => {
  const response = await api.delete(`/products/${productId}/reviews/${reviewId}`);
  return response.data;
};

export const getProductReviews = async (productId, params = {}) => {
  const response = await api.get(`/products/${productId}/reviews`, { params });
  return response.data;
};

export const getReviewEligibility = async () => {
  const response = await api.get('/products/review-eligibility');
  return response.data;
};

export const markReviewHelpful = async (productId, reviewId) => {
  const response = await api.post(`/products/${productId}/reviews/${reviewId}/helpful`);
  return response.data;
};

export const unmarkReviewHelpful = async (productId, reviewId) => {
  const response = await api.delete(`/products/${productId}/reviews/${reviewId}/helpful`);
  return response.data;
};

export const verifyProductPurchase = async (productId) => {
  const response = await api.get(`/products/${productId}/verify-purchase`);
  return response.data;
};

export const submitCustomDesignOrder = async (orderData) => {
  const response = await api.post('/products/custom-order', orderData);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const getCustomDesignOrders = async (params = {}) => {
  const { pageNumber = 1, status, dateFrom, dateTo } = params;
  let url = `/admin/custom-orders?pageNumber=${pageNumber}`;
  
  if (status) url += `&status=${status}`;
  if (dateFrom) url += `&dateFrom=${dateFrom}`;
  if (dateTo) url += `&dateTo=${dateTo}`;
  
  const response = await api.get(url);
  return response.data;
};

export const updateCustomOrderStatus = async (orderId, status, notes = '') => {
  const response = await api.put(`/admin/custom-orders/${orderId}/status`, {
    status,
    notes
  });
  return response.data;
};