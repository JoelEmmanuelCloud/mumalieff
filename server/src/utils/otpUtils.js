// server/src/utils/otpUtils.js
const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate a secure random token for password reset
 * @returns {string} Random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid
 */
const validateOTPFormat = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Check if email is valid
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if password meets requirements
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return {
    isValid: password.length >= minLength,
    requirements: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
    },
    message: password.length < minLength ? 
      `Password must be at least ${minLength} characters long` : null,
  };
};

/**
 * Rate limiting helper
 * @param {string} key - Unique key for rate limiting
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} Rate limit status
 */
const rateLimitMap = new Map();

const checkRateLimit = (key, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now - record.resetTime > windowMs) {
    rateLimitMap.set(key, {
      attempts: 1,
      resetTime: now,
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  if (record.attempts >= maxAttempts) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: record.resetTime + windowMs,
    };
  }
  
  record.attempts++;
  return { 
    allowed: true, 
    remaining: maxAttempts - record.attempts,
  };
};

/**
 * Clean up rate limit records (should be called periodically)
 */
const cleanupRateLimit = () => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.resetTime > windowMs) {
      rateLimitMap.delete(key);
    }
  }
};

// Clean up every 30 minutes
setInterval(cleanupRateLimit, 30 * 60 * 1000);

module.exports = {
  generateOTP,
  generateToken,
  validateOTPFormat,
  validateEmail,
  validatePassword,
  checkRateLimit,
};