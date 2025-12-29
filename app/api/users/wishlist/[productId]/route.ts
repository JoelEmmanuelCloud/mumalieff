import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/utils/auth';

// DELETE /api/users/wishlist/[productId] - Remove product from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const { productId } = params;

    const user = await User.findById(currentUser._id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    user.wishlist = user.wishlist.filter(
      (id: any) => id.toString() !== productId
    );

    await user.save();

    return successResponse({
      message: 'Product removed from wishlist',
      wishlist: user.wishlist,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Remove from wishlist error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to remove from wishlist', 500);
  }
}
