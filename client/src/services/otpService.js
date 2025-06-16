// src/services/otpService.js
import api from './apiConfig';

// Registration OTP services
export const sendRegistrationOTP = async (userData) => {
  const response = await api.post('/auth/register/send-otp', userData);
  return response.data;
};

export const verifyRegistrationOTP = async (email, otp) => {
  const response = await api.post('/auth/register/verify-otp', { email, otp });
  return response.data;
};

// Login OTP services
export const sendLoginOTP = async (email, password) => {
  const response = await api.post('/auth/login/send-otp', { email, password });
  return response.data;
};

export const verifyLoginOTP = async (email, otp) => {
  const response = await api.post('/auth/login/verify-otp', { email, otp });
  return response.data;
};

// Forgot password OTP services
export const sendForgotPasswordOTP = async (email) => {
  const response = await api.post('/auth/forgot-password/send-otp', { email });
  return response.data;
};

export const verifyForgotPasswordOTP = async (email, otp) => {
  const response = await api.post('/auth/forgot-password/verify-otp', { email, otp });
  return response.data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await api.post('/auth/reset-password', { email, otp, newPassword });
  return response.data;
};

// Resend OTP service
export const resendOTP = async (email, type) => {
  const response = await api.post('/auth/resend-otp', { email, type });
  return response.data;
};