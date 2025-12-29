import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAdmin } from '@/lib/utils/auth';

// GET /api/users/[id] - Get user by ID (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { id } = params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return notFoundResponse('User not found');
    }

    return successResponse(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return errorResponse('Admin access required', 403);
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Get user error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch user', 500);
  }
}

// PUT /api/users/[id] - Update user (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { id } = params;
    const body = await request.json();

    const user = await User.findById(id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    user.firstName = body.firstName || user.firstName;
    user.lastName = body.lastName || user.lastName;
    user.email = body.email || user.email;
    user.phone = body.phone || user.phone;
    user.isAdmin = body.isAdmin !== undefined ? body.isAdmin : user.isAdmin;
    user.isActive = body.isActive !== undefined ? body.isActive : user.isActive;

    const updatedUser = await user.save();

    return successResponse({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
      isActive: updatedUser.isActive,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return errorResponse('Admin access required', 403);
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Update user error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to update user', 500);
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { id } = params;
    const user = await User.findById(id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    if (user.isAdmin) {
      return errorResponse('Cannot delete admin user', 400);
    }

    await user.deleteOne();
    return successResponse({ message: 'User removed' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return errorResponse('Admin access required', 403);
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Delete user error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to delete user', 500);
  }
}
