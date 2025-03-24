import api from './apiConfig';

// Upload image
export const uploadImage = async (imageFile, uploadType = 'product') => {
  // Create FormData
  const formData = new FormData();
  formData.append('image', imageFile);
  
  // Set header explicitly for file upload
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      uploadType, // 'product' or 'custom-design'
    },
  };
  
  const response = await api.post('/upload', formData, config);
  return response.data;
};

// Delete image
export const deleteImage = async (publicId) => {
  const response = await api.delete(`/upload/${publicId}`);
  return response.data;
};