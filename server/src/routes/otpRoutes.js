// server/src/routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  sendLoginOTP,
  verifyLoginOTP,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  resendOTP,
} = require('../controllers/otpController');

// Registration OTP routes
router.post('/register/send-otp', sendRegistrationOTP);
router.post('/register/verify-otp', verifyRegistrationOTP);

// Login OTP routes
router.post('/login/send-otp', sendLoginOTP);
router.post('/login/verify-otp', verifyLoginOTP);

// Forgot password OTP routes
router.post('/forgot-password/send-otp', sendForgotPasswordOTP);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOTP);
router.post('/reset-password', resetPassword);

// Resend OTP route
router.post('/resend-otp', resendOTP);

module.exports = router;