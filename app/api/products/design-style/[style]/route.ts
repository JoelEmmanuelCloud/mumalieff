import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/products/design-style/[style] - Get products by design style
export async function GET(
  request: NextRequest,
  { params }: { params: { style: string } }
) {
  try {
    await connectDB();

    const { style } = params;
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 20;
    const page = Number(searchParams.get('pageNumber')) || 1;
    const pageSize = 12;

    const query = {
      category: 'Wear Your Conviction',
      designStyle: style,
      isActive: true
    };

    const count = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort({ rating: -1, createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    return successResponse({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      totalProducts: count,
      designStyle: style
    });
  } catch (error) {
    console.error('Get products by design style error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch products', 500);
  }
}
