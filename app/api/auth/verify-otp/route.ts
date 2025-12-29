import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import OTP from '@/lib/models/OTP';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/utils/jwt';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, otp, type } = body;

    // Validation
    if (!email || !otp || !type) {
      return validationErrorResponse([
        { field: 'email', message: 'Email, OTP, and type are required' },
      ]);
    }

    // Find OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      type,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return errorResponse('OTP not found or expired', 404);
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return errorResponse('Too many failed attempts. Please request a new OTP.', 429);
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return errorResponse(
        `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`,
        400
      );
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    let user;
    let token;

    // Handle different types
    if (type === 'registration') {
      // Create new user
      if (!otpRecord.userData) {
        return errorResponse('User data missing', 400);
      }

      user = await User.create({
        firstName: otpRecord.userData.firstName,
        lastName: otpRecord.userData.lastName,
        email: email.toLowerCase(),
        password: otpRecord.userData.password,
        phone: otpRecord.userData.phone,
      });

      token = generateToken(user);

      // Clean up OTP
      await OTP.deleteMany({ email: email.toLowerCase() });

      return successResponse(
        {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin,
          },
          token,
        },
        'Registration successful',
        201
      );
    } else if (type === 'login') {
      // Find existing user
      user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return errorResponse('User not found', 404);
      }

      token = generateToken(user);

      // Clean up OTP
      await OTP.deleteMany({ email: email.toLowerCase() });

      return successResponse(
        {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin,
          },
          token,
        },
        'Login successful'
      );
    } else if (type === 'forgot_password') {
      // Return temporary token for password reset
      user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Generate a temporary reset token
      const resetToken = generateToken(user);

      return successResponse(
        {
          resetToken,
          email: user.email,
        },
        'OTP verified. You can now reset your password.'
      );
    }

    return errorResponse('Invalid OTP type', 400);
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return errorResponse(error.message || 'Failed to verify OTP', 500);
  }
}
