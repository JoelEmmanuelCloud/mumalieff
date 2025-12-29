import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import CustomOrder from '@/lib/models/CustomOrder';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
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

// GET /api/products/[id]/reviews - Get product reviews with pagination and sorting
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const sortBy = searchParams.get('sortBy') || 'newest';

    const product = await Product.findById(id);
    if (!product) {
      return notFoundResponse('Product not found');
    }

    let reviews = [...product.reviews];

    // Sort reviews
    switch (sortBy) {
      case 'oldest':
        reviews.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        reviews.sort((a: any, b: any) => b.rating - a.rating);
        break;
      case 'lowest':
        reviews.sort((a: any, b: any) => a.rating - b.rating);
        break;
      case 'newest':
      default:
        reviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReviews = reviews.slice(startIndex, endIndex);

    // Calculate statistics
    const ratingCounts: any = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review: any) => {
      ratingCounts[review.rating]++;
    });

    const verifiedCount = reviews.filter((review: any) => review.verified).length;

    return successResponse({
      reviews: paginatedReviews,
      pagination: {
        page,
        limit,
        total: reviews.length,
        pages: Math.ceil(reviews.length / limit)
      },
      statistics: {
        averageRating: product.rating,
        totalReviews: product.numReviews,
        ratingCounts,
        verifiedCount,
        verifiedPercentage: reviews.length > 0 ? Math.round((verifiedCount / reviews.length) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch reviews', 500);
  }
}

// POST /api/products/[id]/reviews - Create a product review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { id: productId } = params;
    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || !comment) {
      return errorResponse('Please provide both rating and comment', 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
      return notFoundResponse('Product not found');
    }

    // Check if already reviewed
    const alreadyReviewed = product.reviews.find(
      (review: any) => review.user.toString() === user._id.toString()
    );

    if (alreadyReviewed) {
      return errorResponse('You have already reviewed this product', 400);
    }

    // Verify purchase
    const purchaseVerification = await verifyUserPurchase(user._id.toString(), productId);

    if (!purchaseVerification.hasPurchased) {
      return errorResponse('You can only review products you have purchased and received', 403);
    }

    const review = {
      name: `${user.firstName} ${user.lastName}` || user.firstName,
      rating: Number(rating),
      comment,
      user: user._id,
      verified: purchaseVerification.isVerified,
      order: purchaseVerification.orderId,
      purchaseDate: purchaseVerification.purchaseDate,
    } as any;

    product.reviews.push(review);
    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc: number, item: any) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    return successResponse(
      {
        message: 'Review added successfully',
        review: product.reviews[product.reviews.length - 1]
      },
      'Review added successfully',
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Create review error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to create review', 500);
  }
}
