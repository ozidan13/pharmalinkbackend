import { Router } from 'express';
import { 
  createProduct, 
  getMyProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct, 
  getAllProducts, 
  searchProducts 
} from './store.controller';
import { authenticate, isPharmacyOwner } from '../../middleware/auth.middleware';
import { 
  validateCreateProduct, 
  validateUpdateProduct 
} from './store.validator';
import { validateSearchParams } from './store.search.validator';

const router = Router();

// Public routes
/**
 * @route   GET /api/store/products
 * @desc    Get all products (public)
 * @access  Public
 */
router.get('/products', getAllProducts);

/**
 * @route   GET /api/store/products/search
 * @desc    Search products (public)
 * @access  Public
 */
router.get('/products/search', validateSearchParams, searchProducts);

/**
 * @route   GET /api/store/products/:id
 * @desc    Get product by ID (public)
 * @access  Public
 */
router.get('/products/:id', getProductById);

// Protected routes (require authentication)
router.use(authenticate);

// Product management routes (require pharmacy owner role)
router.use(isPharmacyOwner);

/**
 * @route   POST /api/store/products
 * @desc    Create a new product
 * @access  Private (Pharmacy Owner)
 */
router.post('/products', validateCreateProduct, createProduct);

/**
 * @route   GET /api/store/products/me
 * @desc    Get current pharmacy owner's products
 * @access  Private (Pharmacy Owner)
 */
router.get('/products/me', getMyProducts);

/**
 * @route   PUT /api/store/products/:id
 * @desc    Update a product
 * @access  Private (Pharmacy Owner)
 */
router.put('/products/:id', validateUpdateProduct, updateProduct);

/**
 * @route   DELETE /api/store/products/:id
 * @desc    Delete a product
 * @access  Private (Pharmacy Owner)
 */
router.delete('/products/:id', deleteProduct);

export default router;