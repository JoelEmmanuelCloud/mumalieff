import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/products/base-for-customization - Get base products for customization
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 10;

    const products = await Product.find({
      category: 'Customize Your Prints',
      isBaseProduct: true,
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return successResponse(products);
  } catch (error) {
    console.error('Get base products error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch base products', 500);
  }
}
