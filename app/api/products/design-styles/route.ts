import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/products/design-styles - Get available design styles with product counts
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const designStyles = ['Religious/Spiritual', 'Motivational'];

    const stylesWithCount = await Promise.all(
      designStyles.map(async (style) => {
        const count = await Product.countDocuments({
          category: 'Wear Your Conviction',
          designStyle: style,
          isActive: true
        });
        return { style, count };
      })
    );

    return successResponse(stylesWithCount);
  } catch (error) {
    console.error('Get design styles error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch design styles', 500);
  }
}
