const crypto = require('crypto');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const validateOTPFormat = (otp) => {
  return /^\d{6}$/.test(otp);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

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

const cleanupRateLimit = () => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.resetTime > windowMs) {
      rateLimitMap.delete(key);
    }
  }
};

setInterval(cleanupRateLimit, 30 * 60 * 1000);

module.exports = {
  generateOTP,
  generateToken,
  validateOTPFormat,
  validateEmail,
  validatePassword,
  checkRateLimit,
};