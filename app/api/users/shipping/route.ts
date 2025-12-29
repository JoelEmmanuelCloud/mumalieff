import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/utils/auth';

// POST /api/users/shipping - Add shipping address
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const { address, city, state, postalCode, country, isDefault } = body;

    const user = await User.findById(currentUser._id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    const newAddress = {
      address,
      city,
      state,
      postalCode,
      country: country || 'Nigeria',
      isDefault: isDefault || false,
    };

    if (newAddress.isDefault) {
      user.shippingAddresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    user.shippingAddresses.push(newAddress);
    await user.save();

    return successResponse(
      {
        message: 'Shipping address added',
        shippingAddresses: user.shippingAddresses,
      },
      'Shipping address added',
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Add shipping address error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to add shipping address', 500);
  }
}
