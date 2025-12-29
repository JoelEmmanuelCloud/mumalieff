import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { requireAdmin } from '@/lib/utils/auth';

// GET /api/users - Get all users with pagination and search (Admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pageSize = 10;
    const page = Number(searchParams.get('pageNumber')) || 1;
    const keyword = searchParams.get('keyword');

    let query: any = {};
    if (keyword) {
      query = {
        $or: [
          { firstName: { $regex: keyword, $options: 'i' } },
          { lastName: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } }
        ]
      };
    }

    const count = await User.countDocuments(query);

    const users = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' },
          fullName: { $concat: ['$firstName', ' ', '$lastName'] }
        }
      },
      {
        $project: {
          password: 0,
          orders: 0
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: pageSize * (page - 1) },
      { $limit: pageSize }
    ]);

    return successResponse({
      users,
      page,
      pages: Math.ceil(count / pageSize),
      totalUsers: count,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return errorResponse('Admin access required', 403);
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Get users error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch users', 500);
  }
}
