import { Router } from 'express';
import { login, registerPharmacist, registerPharmacyOwner } from './auth.controller';
import { validateRegisterPharmacist, validateRegisterPharmacyOwner, validateLogin } from './auth.validator';

const router = Router();

/**
 * @route   POST /api/auth/register/pharmacists
 * @desc    Register a new pharmacist
 * @access  Public
 */
router.post('/register/pharmacists', validateRegisterPharmacist, registerPharmacist);

/**
 * @route   POST /api/auth/register/pharmacy-owners
 * @desc    Register a new pharmacy owner
 * @access  Public
 */
router.post('/register/pharmacy-owners', validateRegisterPharmacyOwner, registerPharmacyOwner);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', validateLogin, login);

export default router;