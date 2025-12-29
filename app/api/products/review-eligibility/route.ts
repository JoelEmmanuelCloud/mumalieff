import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/utils/auth';

// GET /api/products/review-eligibility - Get products eligible for review
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const orders = await Order.find({
      user: user._id,
      isPaid: true,
      isDelivered: true,
      status: 'Delivered'
    }).populate('orderItems.product', 'name images');

    const purchasedProducts: any[] = [];
    const productReviewStatus = new Map();

    orders.forEach((order: any) => {
      order.orderItems.forEach((item: any) => {
        if (item.product) {
          const productId = item.product._id.toString();

          if (!productReviewStatus.has(productId)) {
            purchasedProducts.push({
              productId: item.product._id,
              productName: item.product.name,
              productImage: item.product.images[0]?.url,
              purchaseDate: order.deliveredAt,
              orderId: order._id
            });
            productReviewStatus.set(productId, true);
          }
        }
      });
    });

    const reviewedProductIds: string[] = [];
    for (const product of purchasedProducts) {
      const productDoc = await Product.findById(product.productId, 'reviews');
      const hasReviewed = productDoc?.reviews.some(
        (review: any) => review.user.toString() === user._id.toString()
      );

      if (hasReviewed) {
        reviewedProductIds.push(product.productId.toString());
      }
    }

    const eligibleForReview = purchasedProducts.filter(
      (product) => !reviewedProductIds.includes(product.productId.toString())
    );

    return successResponse({
      eligibleForReview,
      totalPurchased: purchasedProducts.length,
      totalReviewed: reviewedProductIds.length
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Get review eligibility error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch review eligibility', 500);
  }
}
