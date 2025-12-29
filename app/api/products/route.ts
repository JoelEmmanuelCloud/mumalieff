import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { requireAuth, requireAdmin } from '@/lib/utils/auth';

// GET /api/products - Get all products with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pageSize = 12;
    const page = Number(searchParams.get('pageNumber')) || 1;

    const query: any = { isActive: true };

    // Keyword search
    const keyword = searchParams.get('keyword');
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { convictionMessage: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } }
      ];
    }

    // Category filter
    const category = searchParams.get('category');
    if (category) {
      query.category = category;
    }

    // Design style filter
    const designStyle = searchParams.get('designStyle');
    if (designStyle) {
      query.designStyle = designStyle;
    }

    // Price range filter
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice && maxPrice) {
      query.price = {
        $gte: Number(minPrice),
        $lte: Number(maxPrice),
      };
    } else if (minPrice) {
      query.price = { $gte: Number(minPrice) };
    } else if (maxPrice) {
      query.price = { $lte: Number(maxPrice) };
    }

    // Size filter
    const size = searchParams.get('size');
    if (size) {
      query['sizes.name'] = size;
      query['sizes.inStock'] = true;
    }

    // Color filter
    const color = searchParams.get('color');
    if (color) {
      query['colors.name'] = color;
      query['colors.inStock'] = true;
    }

    // Featured filter
    if (searchParams.get('featured') === 'true') {
      query.featured = true;
    }

    // On sale filter
    if (searchParams.get('onSale') === 'true') {
      query.isSale = true;
    }

    // Allow customization filter
    if (searchParams.get('allowCustomization') === 'true') {
      query.allowCustomization = true;
    }

    // Base products filter
    if (searchParams.get('baseProducts') === 'true') {
      query.isBaseProduct = true;
    }

    const count = await Product.countDocuments(query);

    // Sorting
    let sortOption: any = {};
    const sort = searchParams.get('sort');
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOption = { price: 1 };
          break;
        case 'price-desc':
          sortOption = { price: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'rating':
          sortOption = { rating: -1 };
          break;
        case 'popular':
          sortOption = { soldCount: -1, views: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    } else {
      sortOption = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    return successResponse({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      totalProducts: count,
    });
  } catch (error) {
    console.error('Get products error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to fetch products', 500);
  }
}

// POST /api/products - Create a new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    await connectDB();

    const body = await request.json();
    const {
      name,
      category,
      designStyle,
      price,
      description,
      convictionMessage,
      images,
      sizes,
      colors,
      countInStock,
      material,
      designInspiration,
      designerCredit
    } = body;

    if (!name || !price || !description || !category) {
      return errorResponse('Please provide name, price, description, and category', 400);
    }

    const allowedCategories = ['Customize Your Prints', 'Wear Your Conviction'];
    if (!allowedCategories.includes(category)) {
      return errorResponse('Invalid category. Must be either "Customize Your Prints" or "Wear Your Conviction"', 400);
    }

    if (category === 'Wear Your Conviction' && !designStyle) {
      return errorResponse('Design style is required for "Wear Your Conviction" products', 400);
    }

    const productData: any = {
      name,
      price: Number(price),
      user: user._id,
      category,
      description,
      images: images || [],
      sizes: sizes || [
        { name: 'S', inStock: true, stockCount: countInStock || 0 },
        { name: 'M', inStock: true, stockCount: countInStock || 0 },
        { name: 'L', inStock: true, stockCount: countInStock || 0 }
      ],
      colors: colors || [],
      countInStock: Number(countInStock) || 0,
      material: material || 'Cotton',
      isActive: true,
      rating: 0,
      numReviews: 0,
      views: 0,
      soldCount: 0
    };

    if (category === 'Wear Your Conviction') {
      productData.designStyle = designStyle;
      productData.convictionMessage = convictionMessage;
      productData.designInspiration = designInspiration;
      productData.designerCredit = designerCredit;
      productData.allowCustomization = false;
      productData.isBaseProduct = false;
    } else {
      productData.allowCustomization = true;
      productData.isBaseProduct = true;
      productData.customizationOptions = {
        allowText: true,
        allowImages: true,
        allowLogoUpload: true,
        printAreas: ['Front', 'Back'],
        availablePrintMethods: ['Screen Print', 'Digital Print']
      };
    }

    const product = new Product(productData);
    const createdProduct = await product.save();

    return successResponse(createdProduct, 'Product created successfully', 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return errorResponse('Admin access required', 403);
    }
    if (error instanceof Error && error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401);
    }
    console.error('Create product error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to create product', 500);
  }
}
