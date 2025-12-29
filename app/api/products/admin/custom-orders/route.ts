import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import CustomOrder from '@/lib/models/CustomOrder';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { requireAdmin } from '@/lib/utils/auth';

// GET /api/products/admin/custom-orders - Get all custom design orders (Admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pageSize = 20;
    const page = Number(searchParams.get('pageNumber')) || 1;
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const count = await CustomOrder.countDocuments(query);

    const orders = await CustomOrder.find(query)
      .populate('user', 'firstName lastName email')
      .populate('baseProduct', 'name price')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    return successResponse({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      totalOrders: count,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return errorResponse('Admin access required', 403);
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Get custom orders error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch custom orders', 500);
  }
}
