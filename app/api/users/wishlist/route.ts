import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/utils/auth';

// GET /api/users/wishlist - Get user wishlist
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const user = await User.findById(currentUser._id).populate('wishlist');

    if (!user) {
      return notFoundResponse('User not found');
    }

    return successResponse(user.wishlist);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Get wishlist error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch wishlist', 500);
  }
}

// POST /api/users/wishlist - Add product to wishlist
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const { productId } = body;

    const user = await User.findById(currentUser._id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    const alreadyInWishlist = user.wishlist.find(
      (id: any) => id.toString() === productId
    );

    if (alreadyInWishlist) {
      return errorResponse('Product already in wishlist', 400);
    }

    user.wishlist.push(productId);
    await user.save();

    return successResponse(
      {
        message: 'Product added to wishlist',
        wishlist: user.wishlist,
      },
      'Product added to wishlist',
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Add to wishlist error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to add to wishlist', 500);
  }
}
