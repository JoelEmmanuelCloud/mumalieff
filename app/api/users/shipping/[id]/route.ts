import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/utils/auth';

// PUT /api/users/shipping/[id] - Update shipping address
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const { id: addressId } = params;
    const body = await request.json();
    const { address, city, state, postalCode, country, isDefault } = body;

    const user = await User.findById(currentUser._id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    const addressIndex = user.shippingAddresses.findIndex(
      (addr: any) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return notFoundResponse('Shipping address not found');
    }

    if (isDefault) {
      user.shippingAddresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    (user.shippingAddresses[addressIndex] as any) = {
      ...user.shippingAddresses[addressIndex],
      address: address || user.shippingAddresses[addressIndex].address,
      city: city || user.shippingAddresses[addressIndex].city,
      state: state || user.shippingAddresses[addressIndex].state,
      postalCode: postalCode || user.shippingAddresses[addressIndex].postalCode,
      country: country || user.shippingAddresses[addressIndex].country,
      isDefault: isDefault !== undefined ? isDefault : user.shippingAddresses[addressIndex].isDefault,
      _id: (user.shippingAddresses[addressIndex] as any)._id,
    };

    await user.save();

    return successResponse({
      message: 'Shipping address updated',
      shippingAddresses: user.shippingAddresses,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Update shipping address error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to update shipping address', 500);
  }
}
