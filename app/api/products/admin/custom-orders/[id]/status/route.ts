import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import CustomOrder from '@/lib/models/CustomOrder';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAdmin } from '@/lib/utils/auth';

// PUT /api/products/admin/custom-orders/[id]/status - Update custom order status (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;

    const order = await CustomOrder.findById(id);

    if (!order) {
      return notFoundResponse('Custom order not found');
    }

    order.status = status;
    if (notes) {
      order.adminNotes = notes;
    }
    order.updatedAt = new Date();

    const updatedOrder = await order.save();

    return successResponse(updatedOrder, 'Custom order status updated successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return errorResponse('Admin access required', 403);
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Update custom order status error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to update custom order status', 500);
  }
}
