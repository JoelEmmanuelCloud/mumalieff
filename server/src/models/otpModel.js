// server/src/models/otpModel.js
const mongoose = require('mongoose');

const otpSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['registration', 'login', 'forgot_password'],
    },
    userData: {
      // Store registration data temporarily
      name: String,
      password: String,
      phone: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3,
    },
    expiresAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic cleanup
// otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;