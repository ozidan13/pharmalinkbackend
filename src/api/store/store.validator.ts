import { body } from 'express-validator';

// Validation for creating a product
export const validateCreateProduct = [
  // Required fields validation
  body('name')
    .notEmpty()
    .withMessage('Product name is required'),
  
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  // Optional fields validation
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('isNearExpiry')
    .optional()
    .isBoolean()
    .withMessage('isNearExpiry must be a boolean value'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.isNearExpiry === true && !value) {
        throw new Error('Expiry date is required for near-expiry products');
      }
      return true;
    }),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL')
];

// Validation for updating a product
export const validateUpdateProduct = [
  // Optional fields validation
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('category')
    .optional()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('isNearExpiry')
    .optional()
    .isBoolean()
    .withMessage('isNearExpiry must be a boolean value'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.isNearExpiry === true && !value) {
        throw new Error('Expiry date is required for near-expiry products');
      }
      return true;
    }),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL')
];