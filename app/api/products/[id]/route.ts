import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAdmin } from '@/lib/utils/auth';
import mongoose from 'mongoose';

// GET /api/products/[id] - Get a single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid product ID', 400);
    }

    const product = await Product.findById(id);

    if (product && product.isActive) {
      // Increment view count
      await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });
      return successResponse(product);
    } else {
      return notFoundResponse('Product not found');
    }
  } catch (error) {
    console.error('Get product error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch product', 500);
  }
}

// PUT /api/products/[id] - Update a product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { id } = params;
    const body = await request.json();

    const product = await Product.findById(id);

    if (!product) {
      return notFoundResponse('Product not found');
    }

    // Update fields
    product.name = body.name || product.name;
    product.price = body.price || product.price;
    product.description = body.description || product.description;
    product.images = body.images || product.images;
    product.sizes = body.sizes || product.sizes;
    product.colors = body.colors || product.colors;
    product.countInStock = body.countInStock !== undefined ? body.countInStock : product.countInStock;
    product.material = body.material || product.material;
    product.featured = body.featured !== undefined ? body.featured : product.featured;
    product.isSale = body.isSale !== undefined ? body.isSale : product.isSale;
    product.salePrice = body.salePrice !== undefined ? body.salePrice : product.salePrice;

    if (product.category === 'Wear Your Conviction') {
      product.designStyle = body.designStyle || product.designStyle;
      product.convictionMessage = body.convictionMessage || product.convictionMessage;
      product.designInspiration = body.designInspiration || product.designInspiration;
      product.designerCredit = body.designerCredit || product.designerCredit;
    } else if (product.category === 'Customize Your Prints') {
      product.customizationOptions = body.customizationOptions || product.customizationOptions;
    }

    const updatedProduct = await product.save();
    return successResponse(updatedProduct, 'Product updated successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return errorResponse('Admin access required', 403);
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Update product error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to update product', 500);
  }
}

// DELETE /api/products/[id] - Delete a product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { id } = params;
    const product = await Product.findById(id);

    if (!product) {
      return notFoundResponse('Product not found');
    }

    await product.deleteOne();
    return successResponse({ message: 'Product removed' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return errorResponse('Admin access required', 403);
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Delete product error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to delete product', 500);
  }
}
