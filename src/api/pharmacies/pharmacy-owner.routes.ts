import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  updateSubscription 
} from './pharmacy-owner.controller';
import { authenticate, isPharmacyOwner } from '../../middleware/auth.middleware';
import { validateUpdateProfile, validateSubscription } from './pharmacy-owner.validator';

const router = Router();

// Apply authentication and role check to all routes
router.use(authenticate, isPharmacyOwner);

/**
 * @route   GET /api/pharmacy-owners/me
 * @desc    Get current pharmacy owner's profile
 * @access  Private (Pharmacy Owner)
 */
router.get('/me', getProfile);

/**
 * @route   PUT /api/pharmacy-owners/me
 * @desc    Update current pharmacy owner's profile
 * @access  Private (Pharmacy Owner)
 */
router.put('/me', validateUpdateProfile, updateProfile);

/**
 * @route   POST /api/pharmacy-owners/me/subscription
 * @desc    Update pharmacy owner's subscription
 * @access  Private (Pharmacy Owner)
 */
router.post('/me/subscription', validateSubscription, updateSubscription);

export default router;