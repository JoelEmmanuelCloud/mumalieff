import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/utils/auth';
import { generateToken } from '@/lib/utils/jwt';

// GET /api/users/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const userDoc = await User.findById(user._id);

    if (!userDoc) {
      return notFoundResponse('User not found');
    }

    return successResponse({
      _id: userDoc._id,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      fullName: userDoc.fullName,
      email: userDoc.email,
      phone: userDoc.phone,
      isAdmin: userDoc.isAdmin,
      shippingAddresses: userDoc.shippingAddresses,
      wishlist: userDoc.wishlist,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Get profile error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch profile', 500);
  }
}

// PUT /api/users/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const body = await request.json();

    const user = await User.findById(currentUser._id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    user.firstName = body.firstName || user.firstName;
    user.lastName = body.lastName || user.lastName;
    user.email = body.email || user.email;
    user.phone = body.phone || user.phone;

    if (body.password) {
      user.password = body.password;
    }

    const updatedUser = await user.save();

    const token = generateToken(updatedUser);

    return successResponse({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
      token,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Update profile error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to update profile', 500);
  }
}
