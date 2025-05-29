import { body } from 'express-validator';

// Validation for pharmacist registration
export const validateRegisterPharmacist = [
  // Email validation
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  // Password validation
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  // Required fields validation
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  
  // Optional fields validation
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
  
  // Location validation - city is required for pharmacist registration
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  // Area is optional
  body('area')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Area must be less than 100 characters')
];

// Validation for pharmacy owner registration
export const validateRegisterPharmacyOwner = [
  // Email validation
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  // Password validation
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  // Required fields validation
  body('pharmacyName')
    .notEmpty()
    .withMessage('Pharmacy name is required'),
  
  body('contactPerson')
    .notEmpty()
    .withMessage('Contact person name is required'),
  
  // Optional fields validation
  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string'),
  
  // Location validation - city is required for pharmacy owner registration
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  // Area is optional
  body('area')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Area must be less than 100 characters')
];

// Validation for login
export const validateLogin = [
  // Email validation
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];