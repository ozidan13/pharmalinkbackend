import { query } from 'express-validator';

// Validation for product search parameters
export const validateSearchParams = [
  // Optional search query
  query('q')
    .optional()
    .isString()
    .withMessage('Search query must be a string'),
  
  // Optional category filter
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  
  // Optional near expiry filter
  query('nearExpiry')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Near expiry must be true or false'),
  
  // Optional price range filters
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .custom((value, { req }) => {
      const minPrice = (req.query as { minPrice?: string }).minPrice ? parseFloat((req.query as { minPrice?: string }).minPrice as string) : 0;
      const maxPrice = parseFloat(value);
      if (maxPrice < minPrice) {
        throw new Error('Maximum price must be greater than or equal to minimum price');
      }
      return true;
    }),
  
  // Pagination parameters
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];