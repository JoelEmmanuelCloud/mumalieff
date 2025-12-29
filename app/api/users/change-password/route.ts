import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/utils/auth';
import { generateToken } from '@/lib/utils/jwt';

// PUT /api/users/change-password - Change user password
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters long', 400);
    }

    const user = await User.findById(currentUser._id).select('+password');

    if (!user) {
      return notFoundResponse('User not found');
    }

    if (!(await user.matchPassword(currentPassword))) {
      return errorResponse('Current password is incorrect', 401);
    }

    user.password = newPassword;
    user.requirePasswordChange = false;
    await user.save();

    const token = generateToken(user);

    return successResponse({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      requirePasswordChange: false,
      token,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Change password error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to change password', 500);
  }
}
