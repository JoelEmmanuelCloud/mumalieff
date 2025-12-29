import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/utils/auth';

// Helper function to verify user purchase
const verifyUserPurchase = async (userId: string, productId: string) => {
  try {
    const order = await Order.findOne({
      user: userId,
      'orderItems.product': productId,
      isPaid: true,
      isDelivered: true,
      status: 'Delivered'
    }).sort({ deliveredAt: -1 });

    if (order) {
      return {
        hasPurchased: true,
        isVerified: true,
        orderId: order._id,
        purchaseDate: order.deliveredAt || order.createdAt
      };
    }

    const customOrder = await CustomOrder.findOne({
      user: userId,
      baseProduct: productId,
      status: 'completed'
    }).sort({ updatedAt: -1 });

    if (customOrder) {
      return {
        hasPurchased: true,
        isVerified: true,
        orderId: customOrder._id,
        purchaseDate: customOrder.updatedAt
      };
    }

    return {
      hasPurchased: false,
      isVerified: false,
      orderId: null,
      purchaseDate: null
    };
  } catch (error) {
    return {
      hasPurchased: false,
      isVerified: false,
      orderId: null,
      purchaseDate: null
    };
  }
};

// GET /api/products/[id]/verify-purchase - Verify if user has purchased a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { id: productId } = params;

    const verification = await verifyUserPurchase(user._id.toString(), productId);

    const product = await Product.findById(productId, 'reviews');
    const hasReviewed = product ? product.reviews.some(
      (review: any) => review.user.toString() === user._id.toString()
    ) : false;

    return successResponse({
      productId,
      hasPurchased: verification.hasPurchased,
      isVerified: verification.isVerified,
      canReview: verification.hasPurchased && !hasReviewed,
      hasReviewed,
      purchaseDate: verification.purchaseDate
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Verify purchase error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to verify purchase', 500);
  }
}
