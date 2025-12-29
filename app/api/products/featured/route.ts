import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/products/featured - Get featured products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 6;
    const category = searchParams.get('category');

    const query: any = { featured: true, isActive: true };
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return successResponse(products);
  } catch (error) {
    console.error('Get featured products error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch featured products', 500);
  }
}
