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


router.post('/register/send-otp', sendRegistrationOTP);
router.post('/register/verify-otp', verifyRegistrationOTP);


router.post('/login/send-otp', sendLoginOTP);
router.post('/login/verify-otp', verifyLoginOTP);


router.post('/forgot-password/send-otp', sendForgotPasswordOTP);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOTP);
router.post('/reset-password', resetPassword);


router.post('/resend-otp', resendOTP);

module.exports = router;