// server/src/controllers/otpController.js
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
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

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * @desc    Send registration OTP
 * @route   POST /api/auth/register/send-otp
 * @access  Public
 */
const sendRegistrationOTP = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  
  // Rate limiting
  const rateLimit = checkRateLimit(`reg_${email}`, 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.status(429);
    throw new Error('Too many registration attempts. Please try again later.');
  }
  
  // Validate input
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
  
  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Generate OTP
  const otp = generateOTP();
  
  // Delete any existing OTP for this email and type
  await OTP.deleteMany({ email, type: 'registration' });
  
  // Save OTP to database
  await OTP.create({
    email,
    otp,
    type: 'registration',
    userData: {
      firstName,
      lastName,
      password: hashedPassword,
      phone,
    },
  });
  
  // Send OTP email (using firstName for personalization)
  try {
    await sendOTPEmail(email, otp, 'registration', firstName);
    
    res.status(200).json({
      message: 'Registration OTP sent to your email',
      email,
      expiresIn: '10 minutes',
    });
  } catch (error) {
    // Clean up OTP if email sending fails
    await OTP.deleteMany({ email, type: 'registration' });
    throw error;
  }
});

/**
 * @desc    Verify registration OTP and create user
 * @route   POST /api/auth/register/verify-otp
 * @access  Public
 */
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
  
  // Find OTP record
  const otpRecord = await OTP.findOne({ 
    email, 
    type: 'registration',
    verified: false 
  });
  
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  
  // Check attempts
  if (otpRecord.attempts >= 3) {
    await OTP.deleteMany({ email, type: 'registration' });
    res.status(400);
    throw new Error('Too many invalid attempts. Please request a new OTP.');
  }
  
  // Verify OTP
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    res.status(400);
    throw new Error(`Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`);
  }
  
  // Create user
  const user = await User.create({
    firstName: otpRecord.userData.firstName,
    lastName: otpRecord.userData.lastName,
    email: otpRecord.email,
    password: otpRecord.userData.password,
    phone: otpRecord.userData.phone,
  });
  
  // Mark OTP as verified and clean up
  await OTP.deleteMany({ email, type: 'registration' });
  
  // Send welcome email (non-blocking) - using firstName for personalization
  sendWelcomeEmail(email, user.firstName).catch(console.error);
  
  // Generate JWT token
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

/**
 * @desc    Send login OTP
 * @route   POST /api/auth/login/send-otp
 * @access  Public
 */
const sendLoginOTP = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Rate limiting
  const rateLimit = checkRateLimit(`login_${email}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.status(429);
    throw new Error('Too many login attempts. Please try again later.');
  }
  
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }
  
  // Find user and verify password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  
  if (!user.isActive) {
    res.status(401);
    throw new Error('Your account has been deactivated. Please contact support.');
  }
  
  // Generate OTP
  const otp = generateOTP();
  
  // Delete any existing login OTP for this email
  await OTP.deleteMany({ email, type: 'login' });
  
  // Save OTP to database
  await OTP.create({
    email,
    otp,
    type: 'login',
  });
  
  // Send OTP email using firstName for personalization
  await sendOTPEmail(email, otp, 'login', user.firstName);
  
  res.status(200).json({
    message: 'Login OTP sent to your email',
    email,
    expiresIn: '10 minutes',
  });
});

/**
 * @desc    Verify login OTP
 * @route   POST /api/auth/login/verify-otp
 * @access  Public
 */
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
  
  // Find OTP record
  const otpRecord = await OTP.findOne({ 
    email, 
    type: 'login',
    verified: false 
  });
  
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  
  // Check attempts
  if (otpRecord.attempts >= 3) {
    await OTP.deleteMany({ email, type: 'login' });
    res.status(400);
    throw new Error('Too many invalid attempts. Please request a new OTP.');
  }
  
  // Verify OTP
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    res.status(400);
    throw new Error(`Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`);
  }
  
  // Get user
  const user = await User.findOne({ email });
  
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('User account not found or deactivated');
  }
  
  // Clean up OTP
  await OTP.deleteMany({ email, type: 'login' });
  
  // Generate JWT token
  const token = generateToken(user._id);
  
  // Check if admin needs password change
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

/**
 * @desc    Send forgot password OTP
 * @route   POST /api/auth/forgot-password/send-otp
 * @access  Public
 */
const sendForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  // Rate limiting
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
  
  // Check if user exists
  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal if email exists or not for security
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
  
  // Generate OTP
  const otp = generateOTP();
  
  // Delete any existing forgot password OTP for this email
  await OTP.deleteMany({ email, type: 'forgot_password' });
  
  // Save OTP to database
  await OTP.create({
    email,
    otp,
    type: 'forgot_password',
  });
  
  // Send OTP email using firstName for personalization
  await sendOTPEmail(email, otp, 'forgot_password', user.firstName);
  
  res.status(200).json({
    message: 'Password reset OTP sent to your email',
    email,
    expiresIn: '10 minutes',
  });
});

/**
 * @desc    Verify forgot password OTP
 * @route   POST /api/auth/forgot-password/verify-otp
 * @access  Public
 */
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
  
  // Find OTP record
  const otpRecord = await OTP.findOne({ 
    email, 
    type: 'forgot_password',
    verified: false 
  });
  
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  
  // Check attempts
  if (otpRecord.attempts >= 3) {
    await OTP.deleteMany({ email, type: 'forgot_password' });
    res.status(400);
    throw new Error('Too many invalid attempts. Please request a new OTP.');
  }
  
  // Verify OTP
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    res.status(400);
    throw new Error(`Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`);
  }
  
  // Mark OTP as verified (keep it for password reset)
  otpRecord.verified = true;
  await otpRecord.save();
  
  res.json({
    message: 'OTP verified successfully. You can now reset your password.',
    email,
    verified: true,
  });
});

/**
 * @desc    Reset password after OTP verification
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
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
  
  // Find verified OTP record
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
  
  // Find user and update password
  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Update password
  user.password = newPassword;
  user.requirePasswordChange = false; // Reset any password change requirement
  await user.save();
  
  // Clean up OTP
  await OTP.deleteMany({ email, type: 'forgot_password' });
  
  // Generate new JWT token
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

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
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
  
  // Rate limiting for resend
  const rateLimit = checkRateLimit(`resend_${type}_${email}`, 2, 5 * 60 * 1000); // 2 resends per 5 minutes
  if (!rateLimit.allowed) {
    res.status(429);
    throw new Error('Too many resend attempts. Please wait before requesting again.');
  }
  
  // Check if there's an existing OTP record
  const existingOTP = await OTP.findOne({ email, type, verified: false });
  
  if (!existingOTP) {
    res.status(400);
    throw new Error('No active OTP found. Please start the process again.');
  }
  
  // For registration, we have userData stored
  if (type === 'registration') {
    if (!existingOTP.userData) {
      res.status(400);
      throw new Error('Registration data not found. Please start registration again.');
    }
  }
  
  // For login and forgot_password, verify user exists
  if (type === 'login' || type === 'forgot_password') {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400);
      throw new Error('User not found');
    }
  }
  
  // Generate new OTP
  const newOTP = generateOTP();
  
  // Update existing record
  existingOTP.otp = newOTP;
  existingOTP.attempts = 0;
  existingOTP.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await existingOTP.save();
  
  // Get user name for email
  let userName = 'User';
  if (type === 'registration') {
    userName = existingOTP.userData.firstName;
  } else {
    const user = await User.findOne({ email });
    userName = user ? user.firstName : 'User';
  }
  
  // Send OTP email
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