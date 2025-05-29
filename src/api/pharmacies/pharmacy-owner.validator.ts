import { body } from 'express-validator';

// Validation for updating pharmacy owner profile
export const validateUpdateProfile = [
  // Optional fields validation
  body('pharmacyName')
    .optional()
    .notEmpty()
    .withMessage('Pharmacy name cannot be empty'),
  
  body('contactPerson')
    .optional()
    .notEmpty()
    .withMessage('Contact person name cannot be empty'),
  
  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string'),
  
  // Location validation
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('area')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Area must be less than 100 characters')
];

// Validation for subscription update
export const validateSubscription = [
  body('planType')
    .notEmpty()
    .withMessage('Plan type is required')
    .isIn(['none', 'basic', 'premium'])
    .withMessage('Plan type must be one of: none, basic, premium')
];