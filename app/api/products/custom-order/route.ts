import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import CustomOrder from '@/lib/models/CustomOrder';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/utils/auth';

// POST /api/products/custom-order - Submit a custom design order
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const {
      baseProductId,
      customDesign,
      quantity,
      size,
      color,
      specialInstructions,
      contactPreferences
    } = body;

    const baseProduct = await Product.findById(baseProductId);
    if (!baseProduct || baseProduct.category !== 'Customize Your Prints') {
      return notFoundResponse('Base product not found or not customizable');
    }

    const customOrder = new CustomOrder({
      user: user._id,
      baseProduct: baseProductId,
      customDesign: {
        designUrl: customDesign.designUrl,
        designPublicId: customDesign.designPublicId,
        placement: customDesign.placement,
        size: customDesign.size,
        printMethod: customDesign.printMethod || 'Digital Print'
      },
      quantity,
      size,
      color,
      basePrice: baseProduct.price,
      customizationPrice: baseProduct.customizationOptions?.customizationPrice || 0,
      totalPrice: (baseProduct.price + (baseProduct.customizationOptions?.customizationPrice || 0)) * quantity,
      specialInstructions,
      contactPreferences,
      status: 'pending',
      estimatedCompletionDays: '3-5'
    });

    const savedOrder = await customOrder.save();

    return successResponse(
      {
        message: 'Custom design order submitted successfully',
        orderId: savedOrder._id,
        estimatedCompletion: '3-5 business days'
      },
      'Custom design order submitted successfully',
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Submit custom order error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to submit custom order', 500);
  }
}
