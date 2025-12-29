import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import OTP from '@/lib/models/OTP';
import User from '@/lib/models/User';
import { sendOTPEmail } from '@/lib/utils/email';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, type, userData } = body;

    // Validation
    if (!email || !type) {
      return validationErrorResponse([{ field: 'email', message: 'Email and type are required' }]);
    }

    if (!['registration', 'login', 'forgot_password'].includes(type)) {
      return validationErrorResponse([{ field: 'type', message: 'Invalid OTP type' }]);
    }

    // Check if user exists based on type
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (type === 'registration' && existingUser) {
      return errorResponse('User already exists', 400);
    }

    if ((type === 'login' || type === 'forgot_password') && !existingUser) {
      return errorResponse('User not found', 404);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Create new OTP
    const newOTP = await OTP.create({
      email: email.toLowerCase(),
      otp,
      type,
      userData: type === 'registration' ? userData : undefined,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, type);

    if (!emailSent) {
      console.warn('Failed to send OTP email, but OTP was created');
    }

    return successResponse(
      {
        message: 'OTP sent successfully',
        email: email.toLowerCase(),
        expiresIn: 600, // seconds
      },
      'OTP sent to your email'
    );
  } catch (error: any) {
    console.error('Request OTP error:', error);
    return errorResponse(error.message || 'Failed to send OTP', 500);
  }
}
