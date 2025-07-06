const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const OTP = require('../models/otpModel');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');
const { 
  generateOTP, 
  validateOTPFormat, 
  validateEmail, 
  validatePassword,
  checkRateLimit 
} = require('../utils/otpUtils');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendRegistrationOTP = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const rateLimit = checkRateLimit(`reg_${email}`, 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.status(429);
    throw new Error('Too many registration attempts. Please try again later.');
  }
  
  if (!firstName || !lastName || !email || !password) {
    res.status(400);
    throw new Error('Please provide first name, last name, email, and password');
  }
  
  if (!validateEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    res.status(400);
    throw new Error(passwordValidation.message);
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  const otp = generateOTP();

  await OTP.deleteMany({ email, type: 'registration' });
  
  await OTP.create({
    email,
    otp,
    type: 'registration',
    userData: {
      firstName,
      lastName,
      password, 
      phone,
    },
  });

  try {
    await sendOTPEmail(email, otp, 'registration', firstName);
    
    res.status(200).json({
      message: 'Registration OTP sent to your email',
      email,
      expiresIn: '10 minutes',
    });
  } catch (error) {
    await OTP.deleteMany({ email, type: 'registration' });
    throw error;
  }
});

const verifyRegistrationOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and OTP');
  }
  
  if (!validateOTPFormat(otp)) {
    res.status(400);
    throw new Error('Please provide a valid 6-digit OTP');
  }
  
  const otpRecord = await OTP.findOne({ 
    email, 
    type: 'registration',
    verified: false 
  });
  
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  
  if (otpRecord.attempts >= 3) {
    await OTP.deleteMany({ email, type: 'registration' });
    res.status(400);
    throw new Error('Too many invalid attempts. Please request a new OTP.');
  }
  
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    res.status(400);
    throw new Error(`Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`);
  }
  
  const user = await User.create({
    firstName: otpRecord.userData.firstName,
    lastName: otpRecord.userData.lastName,
    email: otpRecord.email,
    password: otpRecord.userData.password,
    phone: otpRecord.userData.phone,
  });
  
  await OTP.deleteMany({ email, type: 'registration' });
  
  sendWelcomeEmail(email, user.firstName).catch(() => {});
  
  const token = generateToken(user._id);
  
  res.status(201).json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    token,
    message: 'Registration successful',
  });
});

const sendLoginOTP = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const rateLimit = checkRateLimit(`login_${email}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.status(429);
    throw new Error('Too many login attempts. Please try again later.');
  }
  
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }
  
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  
  if (!user.isActive) {
    res.status(401);
    throw new Error('Your account has been deactivated. Please contact support.');
  }
  
  const otp = generateOTP();
  
  await OTP.deleteMany({ email, type: 'login' });
  
  await OTP.create({
    email,
    otp,
    type: 'login',
  });
  
  await sendOTPEmail(email, otp, 'login', user.firstName);
  
  res.status(200).json({
    message: 'Login OTP sent to your email',
    email,
    expiresIn: '10 minutes',
  });
});

const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and OTP');
  }
  
  if (!validateOTPFormat(otp)) {
    res.status(400);
    throw new Error('Please provide a valid 6-digit OTP');
  }
  
  const otpRecord = await OTP.findOne({ 
    email, 
    type: 'login',
    verified: false 
  });
  
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  
  if (otpRecord.attempts >= 3) {
    await OTP.deleteMany({ email, type: 'login' });
    res.status(400);
    throw new Error('Too many invalid attempts. Please request a new OTP.');
  }
  
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    res.status(400);
    throw new Error(`Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`);
  }
  
  const user = await User.findOne({ email });
  
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('User account not found or deactivated');
  }
  
  await OTP.deleteMany({ email, type: 'login' });
  
  const token = generateToken(user._id);
  
  const requirePasswordChange = user.isAdmin ? 
    (user.requirePasswordChange || false) : false;
  
  res.json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    requirePasswordChange,
    token,
    message: 'Login successful',
  });
});

const sendForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const rateLimit = checkRateLimit(`forgot_${email}`, 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.status(429);
    throw new Error('Too many password reset attempts. Please try again later.');
  }
  
  if (!email) {
    res.status(400);
    throw new Error('Please provide email address');
  }
  
  if (!validateEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }
  
  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(200).json({
      message: 'If an account with this email exists, you will receive a password reset OTP',
      email,
    });
    return;
  }
  
  if (!user.isActive) {
    res.status(400);
    throw new Error('Account is deactivated. Please contact support.');
  }
  
  const otp = generateOTP();
  
  await OTP.deleteMany({ email, type: 'forgot_password' });
  
  await OTP.create({
    email,
    otp,
    type: 'forgot_password',
  });
  
  await sendOTPEmail(email, otp, 'forgot_password', user.firstName);
  
  res.status(200).json({
    message: 'Password reset OTP sent to your email',
    email,
    expiresIn: '10 minutes',
  });
});

const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and OTP');
  }
  
  if (!validateOTPFormat(otp)) {
    res.status(400);
    throw new Error('Please provide a valid 6-digit OTP');
  }
  
  const otpRecord = await OTP.findOne({ 
    email, 
    type: 'forgot_password',
    verified: false 
  });
  
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  
  if (otpRecord.attempts >= 3) {
    await OTP.deleteMany({ email, type: 'forgot_password' });
    res.status(400);
    throw new Error('Too many invalid attempts. Please request a new OTP.');
  }
  
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    res.status(400);
    throw new Error(`Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`);
  }
  
  otpRecord.verified = true;
  await otpRecord.save();
  
  res.json({
    message: 'OTP verified successfully. You can now reset your password.',
    email,
    verified: true,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Please provide email, OTP, and new password');
  }
  
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    res.status(400);
    throw new Error(passwordValidation.message);
  }
  
  const otpRecord = await OTP.findOne({ 
    email, 
    otp,
    type: 'forgot_password',
    verified: true 
  });
  
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired verification. Please start the process again.');
  }
  
  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  user.password = newPassword;
  user.requirePasswordChange = false;
  await user.save();
  
  await OTP.deleteMany({ email, type: 'forgot_password' });
  
  const token = generateToken(user._id);
  
  res.json({
    message: 'Password reset successful',
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    requirePasswordChange: false,
    token,
  });
});

const resendOTP = asyncHandler(async (req, res) => {
  const { email, type } = req.body;
  
  if (!email || !type) {
    res.status(400);
    throw new Error('Please provide email and OTP type');
  }
  
  if (!['registration', 'login', 'forgot_password'].includes(type)) {
    res.status(400);
    throw new Error('Invalid OTP type');
  }
  
  const rateLimit = checkRateLimit(`resend_${type}_${email}`, 2, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.status(429);
    throw new Error('Too many resend attempts. Please wait before requesting again.');
  }
  
  const existingOTP = await OTP.findOne({ email, type, verified: false });
  
  if (!existingOTP) {
    res.status(400);
    throw new Error('No active OTP found. Please start the process again.');
  }
  
  if (type === 'registration') {
    if (!existingOTP.userData) {
      res.status(400);
      throw new Error('Registration data not found. Please start registration again.');
    }
  }
  
  if (type === 'login' || type === 'forgot_password') {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400);
      throw new Error('User not found');
    }
  }
  
  const newOTP = generateOTP();
  
  existingOTP.otp = newOTP;
  existingOTP.attempts = 0;
  existingOTP.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await existingOTP.save();
  
  let userName = 'User';
  if (type === 'registration') {
    userName = existingOTP.userData.firstName;
  } else {
    const user = await User.findOne({ email });
    userName = user ? user.firstName : 'User';
  }
  
  await sendOTPEmail(email, newOTP, type, userName);
  
  res.json({
    message: 'OTP resent successfully',
    email,
    type,
    expiresIn: '10 minutes',
  });
});

module.exports = {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  sendLoginOTP,
  verifyLoginOTP,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  resendOTP,
};