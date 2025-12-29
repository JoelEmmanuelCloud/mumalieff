import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  type: 'registration' | 'login' | 'forgot_password';
  userData?: {
    firstName?: string;
    lastName?: string;
    password?: string;
    phone?: string;
  };
  verified: boolean;
  attempts: number;
  expiresAt: Date;
}

const otpSchema = new Schema<IOTP>(
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
      firstName: String,
      lastName: String,
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

const OTP: Model<IOTP> = mongoose.models.OTP || mongoose.model<IOTP>('OTP', otpSchema);

export default OTP;
