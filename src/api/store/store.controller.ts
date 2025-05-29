import { Request, Response } from 'express';
import { prisma } from '../../server';
import { validationResult } from 'express-validator';
import { searchProductsService } from './store.service';
import { UserRole } from '@prisma/client';

// Extend the Express Request type with our custom user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// Types
type ProductInput = {
  name: string;
  description?: string;
  price: string | number;
  category: string;
  isNearExpiry?: boolean;
  expiryDate?: string;
  imageUrl?: string;
  stock: string | number;
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// Interface for error response
interface ErrorResponse {
  success: boolean;
  message: string;
  code?: string;
  details?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

// Create a new product
// Helper function to send error responses
const sendError = (res: Response, status: number, options: Omit<ErrorResponse, 'success'>) => {
  return res.status(status).json({
    success: false,
    ...options
  });
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, {
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: 'param' in err ? String(err.param) : undefined,
          message: err.msg
        }))
      });
    }

    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return sendError(res, 401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (userRole !== UserRole.PHARMACY_OWNER) {
      return sendError(res, 403, {
        message: 'Access denied. Pharmacy owner role required.',
        code: 'FORBIDDEN'
      });
    }

    // Get pharmacy owner profile with subscription status
    const pharmacyOwner = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId },
      select: { 
        id: true, 
        subscriptionStatus: true,
        subscriptionExpiresAt: true
      }
    });

    if (!pharmacyOwner) {
      return sendError(res, 404, {
        message: 'Pharmacy owner profile not found',
        details: 'Please complete your pharmacy owner profile before adding products.',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Check if subscription is active
    const isSubscriptionActive = pharmacyOwner.subscriptionStatus === 'ACTIVE' && 
      (!pharmacyOwner.subscriptionExpiresAt || new Date(pharmacyOwner.subscriptionExpiresAt) > new Date());

    if (!isSubscriptionActive) {
      return sendError(res, 403, {
        message: 'Subscription required',
        details: 'Your pharmacy account requires an active subscription to add products.',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    const {
      name,
      description,
      price,
      category,
      isNearExpiry,
      expiryDate,
      imageUrl,
      stock
    } = req.body;

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        isNearExpiry: isNearExpiry === true,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        imageUrl,
        stock: parseInt(stock, 10),
        pharmacyOwnerId: pharmacyOwner.id
      }
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Server error while creating product' });
  }
};

// Get all products for the current pharmacy owner
export const getMyProducts = async (req: Request, res: Response) => {
  try {
    console.log('=== STARTING GET MY PRODUCTS ===');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    
    // 1. Verify authentication and authorization
    const userId = req.user?.id;
    console.log('User ID from request:', userId);
    
    if (!userId) {
      console.log('No user ID found in request');
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    console.log('User role from request:', req.user?.role);
    
    if (req.user?.role !== UserRole.PHARMACY_OWNER) {
      console.log('User is not a pharmacy owner');
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Pharmacy owner role required.' 
      });
    }

    // 2. Find the pharmacy owner's profile
    console.log('Looking up pharmacy owner profile for user ID:', userId);
    const pharmacyOwner = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId },
      select: { 
        id: true,
        pharmacyName: true,
        contactPerson: true,
        phoneNumber: true,
        address: true 
      }
    });

    console.log('Found pharmacy owner profile:', JSON.stringify(pharmacyOwner, null, 2));

    if (!pharmacyOwner) {
      console.log('No pharmacy owner profile found for user ID:', userId);
      return res.status(404).json({ 
        success: false,
        message: 'Pharmacy owner profile not found',
        details: 'Please complete your pharmacy owner profile before managing products.'
      });
    }

    // 3. Fetch products for this pharmacy owner
    console.log('Fetching products for pharmacy owner ID:', pharmacyOwner.id);
    const products = await prisma.product.findMany({
      where: { pharmacyOwnerId: pharmacyOwner.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        isNearExpiry: true,
        expiryDate: true,
        imageUrl: true,
        stock: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`Found ${products.length} products for pharmacy owner ${pharmacyOwner.id}`);

    // 4. Prepare and send response
    const responseData = {
      success: true,
      count: products.length,
      data: products.map(product => ({
        ...product,
        pharmacyOwner: {
          pharmacyName: pharmacyOwner.pharmacyName,
          contactPerson: pharmacyOwner.contactPerson,
          phoneNumber: pharmacyOwner.phoneNumber,
          address: pharmacyOwner.address
        }
      }))
    };

    console.log('Sending response:', JSON.stringify(responseData, null, 2));
    return res.status(200).json(responseData);

  } catch (error: unknown) {
    console.error('Error in getMyProducts:', error);
    const errorResponse: {
      success: boolean;
      message: string;
      error: string;
      stack?: string;
    } = { 
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    if (error instanceof Error && process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
    
    return res.status(500).json(errorResponse);
  }
};

// Get a specific product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return sendError(res, 401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Get product with pharmacy owner info
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        isNearExpiry: true,
        expiryDate: true,
        imageUrl: true,
        stock: true,
        createdAt: true,
        updatedAt: true,
        pharmacyOwner: {
          select: {
            id: true,
            userId: true,
            pharmacyName: true,
            contactPerson: true,
            phoneNumber: true,
            address: true
          }
        }
      }
    });

    if (!product) {
      return sendError(res, 404, {
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Only check ownership if the user is a pharmacy owner but not the owner of this product
    if (userRole === UserRole.PHARMACY_OWNER && product.pharmacyOwner.userId !== userId) {
      return sendError(res, 403, {
        message: 'Access denied',
        details: 'You do not have permission to view this product.',
        code: 'FORBIDDEN'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return sendError(res, 500, {
      message: 'Failed to fetch product',
      details: 'An error occurred while fetching the product.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Update a product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, {
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: 'param' in err ? String(err.param) : undefined,
          message: err.msg
        }))
      });
    }

    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return sendError(res, 401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (userRole !== UserRole.PHARMACY_OWNER) {
      return sendError(res, 403, {
        message: 'Access denied. Pharmacy owner role required.',
        code: 'FORBIDDEN'
      });
    }

    // Get pharmacy owner profile
    const pharmacyOwner = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!pharmacyOwner) {
      return sendError(res, 404, {
        message: 'Pharmacy owner profile not found',
        details: 'Please complete your pharmacy owner profile before managing products.',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Check if product exists and belongs to this pharmacy owner
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        pharmacyOwnerId: pharmacyOwner.id
      },
      select: { id: true }
    });

    if (!existingProduct) {
      return sendError(res, 404, {
        message: 'Product not found',
        details: 'The requested product does not exist or you do not have permission to update it.',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    const {
      name,
      description,
      price,
      category,
      isNearExpiry,
      expiryDate,
      imageUrl,
      stock
    } = req.body;

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (isNearExpiry !== undefined) updateData.isNearExpiry = isNearExpiry === true;
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (stock !== undefined) updateData.stock = parseInt(stock, 10);

    // Check if there's any data to update
    if (Object.keys(updateData).length === 0) {
      return sendError(res, 400, {
        message: 'No valid fields provided for update',
        code: 'NO_VALID_FIELDS'
      });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        isNearExpiry: true,
        expiryDate: true,
        imageUrl: true,
        stock: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return sendError(res, 500, {
      message: 'Failed to update product',
      details: 'An error occurred while updating the product.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Delete a product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return sendError(res, 401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (userRole !== UserRole.PHARMACY_OWNER) {
      return sendError(res, 403, {
        message: 'Access denied. Pharmacy owner role required.',
        code: 'FORBIDDEN'
      });
    }

    // Get pharmacy owner profile
    const pharmacyOwner = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!pharmacyOwner) {
      return sendError(res, 404, {
        message: 'Pharmacy owner profile not found',
        details: 'Please complete your pharmacy owner profile before managing products.',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Check if product exists and belongs to this pharmacy owner
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        pharmacyOwnerId: pharmacyOwner.id
      },
      select: { id: true }
    });

    if (!existingProduct) {
      return sendError(res, 404, {
        message: 'Product not found',
        details: 'The requested product does not exist or you do not have permission to delete it.',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Delete the product
    await prisma.product.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return sendError(res, 409, {
          message: 'Cannot delete product',
          details: 'This product is referenced by other records and cannot be deleted.',
          code: 'CONFLICT'
        });
      }
    }
    
    return sendError(res, 500, {
      message: 'Failed to delete product',
      details: 'An error occurred while deleting the product.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Get all products (public endpoint)
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { category, nearExpiry, page = '1', limit = '10' } = req.query;

    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter
    const filter: any = {};
    
    if (category) {
      filter.category = category as string;
    }
    
    if (nearExpiry === 'true') {
      filter.isNearExpiry = true;
    }

    // Get products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: filter,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          pharmacyOwner: {
            select: {
              pharmacyName: true,
              contactPerson: true,
              phoneNumber: true,
              address: true
            }
          }
        }
      }),
      prisma.product.count({ where: filter })
    ]);

    return res.status(200).json({
      products,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalCount / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Server error while fetching products' });
  }
};

// Search products with advanced filtering
export const searchProducts = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      q,          // search query text
      category,   // filter by category
      nearExpiry, // filter by near expiry status
      minPrice,   // minimum price range
      maxPrice,   // maximum price range
      page = '1', 
      limit = '10'
    } = req.query;

    // Parse numeric parameters
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const minPriceValue = minPrice ? parseFloat(minPrice as string) : undefined;
    const maxPriceValue = maxPrice ? parseFloat(maxPrice as string) : undefined;
    
    // Call service function to perform search
    const result = await searchProductsService({
      query: q as string,
      category: category as string,
      nearExpiry: nearExpiry === 'true',
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      page: pageNumber,
      limit: limitNumber
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({ message: 'Server error while searching products' });
  }
};
