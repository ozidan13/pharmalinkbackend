import { query, body } from 'express-validator';

// Validation for updating pharmacist profile
export const validateUpdateProfile = [
  // Optional fields validation
  body('firstName')
    .optional()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  
  body('lastName')
    .optional()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  
  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('bio')
    .optional()
    .isString()
    .withMessage('Bio must be a string'),
  
  body('experience')
    .optional()
    .isString()
    .withMessage('Experience must be a string'),
  
  body('education')
    .optional()
    .isString()
    .withMessage('Education must be a string'),
  
  // Location validation
  body('city')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('area')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Area must be less than 100 characters'),
  
  body('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean value')
];

// Validation for search parameters
export const validateSearchParams = [
  query('city')
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  query('area')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Area must be less than 100 characters'),
  
  query('available')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Available must be true or false'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];