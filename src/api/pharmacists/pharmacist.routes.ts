import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  getProfile, 
  updateProfile, 
  getPharmacistById, 
  searchPharmacists, 
  uploadCV,
  getCV
} from './pharmacist.controller';
import { 
  authenticate, 
  isPharmacist, 
  isPharmacyOwner 
} from '../../middleware/auth.middleware';
import { 
  validateUpdateProfile, 
  validateSearchParams 
} from './pharmacist.validator';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'cvs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for CV uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `cv-${uniqueSuffix}${ext}`);
  }
});

// File filter for CV uploads
const cvFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const filetypes = /pdf|doc|docx/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only PDF, DOC, and DOCX files are allowed (max 5MB)'));
};

// Configure multer with file size limit and filter
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: cvFileFilter
});

// Apply authentication to all routes that need it
router.use(authenticate);

/**
 * @route   GET /api/pharmacists/me
 * @desc    Get current pharmacist's profile
 * @access  Private (Pharmacist)
 */
router.get('/me', isPharmacist, getProfile);

/**
 * @route   PUT /api/pharmacists/me
 * @desc    Update current pharmacist's profile
 * @access  Private (Pharmacist)
 */
router.put('/me', isPharmacist, validateUpdateProfile, updateProfile);

// CV management endpoints
router.route('/me/cv')
  .get(isPharmacist, getCV) // Get CV
  .post(isPharmacist, upload.single('cv'), uploadCV); // Upload/Update CV

/**
 * @route   GET /api/pharmacists/search
 * @desc    Search for pharmacists (public)
 * @access  Public
 */
router.get('/search', validateSearchParams, searchPharmacists);

/**
 * @route   GET /api/pharmacists/:id
 * @desc    Get pharmacist by ID (for pharmacy owners)
 * @access  Private (Pharmacy Owner)
 */
router.get('/:id', isPharmacyOwner, getPharmacistById);

export default router;