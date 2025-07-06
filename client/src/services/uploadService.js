import api from './apiConfig';

export const uploadImage = async (imageFile, uploadType = 'product') => {

  const formData = new FormData();
  formData.append('image', imageFile);
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      uploadType,
    },
  };
  
  const response = await api.post('/upload', formData, config);
  return response.data;
};

export const deleteImage = async (publicId) => {
  const response = await api.delete(`/upload/${publicId}`);
  return response.data;
};