import api from './apiConfig';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export const sendRegistrationOTP = async (userData: RegistrationData) => {
  const response = await api.post('/auth/register/send-otp', userData);
  return response.data;
};

export const verifyRegistrationOTP = async (email: string, otp: string) => {
  const response = await api.post('/auth/register/verify-otp', { email, otp });
  return response.data;
};

export const sendLoginOTP = async (email: string, password: string) => {
  const response = await api.post('/auth/login/send-otp', { email, password });
  return response.data;
};

export const verifyLoginOTP = async (email: string, otp: string) => {
  const response = await api.post('/auth/login/verify-otp', { email, otp });
  return response.data;
};

export const sendForgotPasswordOTP = async (email: string) => {
  const response = await api.post('/auth/forgot-password/send-otp', { email });
  return response.data;
};

export const verifyForgotPasswordOTP = async (email: string, otp: string) => {
  const response = await api.post('/auth/forgot-password/verify-otp', { email, otp });
  return response.data;
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const response = await api.post('/auth/reset-password', { email, otp, newPassword });
  return response.data;
};

export const resendOTP = async (email: string, type: string) => {
  const response = await api.post('/auth/resend-otp', { email, type });
  return response.data;
};
