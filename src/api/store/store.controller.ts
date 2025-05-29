import { Request, Response } from 'express';
import { prisma } from '../../server';
import { validationResult } from 'express-validator';
import { searchProductsService } from './store.service';

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get pharmacy owner profile
    const pharmacyOwner = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId }
    });

    if (!pharmacyOwner) {
      return res.status(404).json({ message: 'Pharmacy owner profile not found' });
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get pharmacy owner profile
    const pharmacyOwner = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId }
    });

    if (!pharmacyOwner) {
      return res.status(404).json({ message: 'Pharmacy owner profile not found' });
    }

    // Get products
    const products = await prisma.product.findMany({
      where: { pharmacyOwnerId: pharmacyOwner.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Server error while fetching products' });
  }
};

// Get a specific product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get product
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        pharmacyOwner: {
          select: {
            pharmacyName: true,
            contactPerson: true,
            phoneNumber: true,
            address: true,
            city: true,
            area: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ message: 'Server error while fetching product' });
  }
};

// Update a product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get pharmacy owner profile
    const pharmacyOwner = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId }
    });

    if (!pharmacyOwner) {
      return res.status(404).json({ message: 'Pharmacy owner profile not found' });
    }

    // Check if product exists and belongs to this pharmacy owner
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        pharmacyOwnerId: pharmacyOwner.id
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found or you do not have permission to update it' });
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

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        category,
        isNearExpiry: isNearExpiry !== undefined ? isNearExpiry === true : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        imageUrl,
        stock: stock !== undefined ? parseInt(stock, 10) : undefined
      }
    });

    return res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Server error while updating product' });
  }
};

// Delete a product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get pharmacy owner profile
    const pharmacyOwner = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId }
    });

    if (!pharmacyOwner) {
      return res.status(404).json({ message: 'Pharmacy owner profile not found' });
    }

    // Check if product exists and belongs to this pharmacy owner
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        pharmacyOwnerId: pharmacyOwner.id
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found or you do not have permission to delete it' });
    }

    // Delete product
    await prisma.product.delete({
      where: { id }
    });

    return res.status(200).json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Server error while deleting product' });
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