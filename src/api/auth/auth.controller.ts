import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../server';
import { UserRole } from '@prisma/client';
import { validationResult } from 'express-validator';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Helper function to generate JWT token
const generateToken = (id: string, email: string, role: UserRole): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  
  return jwt.sign(
    { id, email, role },
    JWT_SECRET as jwt.Secret,
    { expiresIn } as jwt.SignOptions
  );
};

// Register a new pharmacist
export const registerPharmacist = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      bio,
      experience,
      education,
      latitude,
      longitude
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user and pharmacist profile in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.PHARMACIST
        }
      });

      // Create pharmacist profile
      const pharmacistProfile = await prisma.pharmacistProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phoneNumber,
          bio,
          experience,
          education,
          city: req.body.city,
          area: req.body.area || null
        }
      });

      return { user, pharmacistProfile };
    });

    // Generate JWT token
    const token = generateToken(result.user.id, result.user.email, result.user.role);

    // Return user data and token
    return res.status(201).json({
      message: 'Pharmacist registered successfully',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        profile: {
          firstName: result.pharmacistProfile.firstName,
          lastName: result.pharmacistProfile.lastName
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// Register a new pharmacy owner
export const registerPharmacyOwner = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      password,
      pharmacyName,
      contactPerson,
      phoneNumber,
      address,
      latitude,
      longitude
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user and pharmacy owner profile in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.PHARMACY_OWNER
        }
      });

      // Create pharmacy owner profile
      const pharmacyOwnerProfile = await prisma.pharmacyOwnerProfile.create({
        data: {
          userId: user.id,
          pharmacyName,
          contactPerson,
          phoneNumber,
          address,
          city: req.body.city,
          area: req.body.area || null
        }
      });

      return { user, pharmacyOwnerProfile };
    });

    // Generate JWT token
    const token = generateToken(result.user.id, result.user.email, result.user.role);

    // Return user data and token
    return res.status(201).json({
      message: 'Pharmacy owner registered successfully',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        profile: {
          pharmacyName: result.pharmacyOwnerProfile.pharmacyName,
          contactPerson: result.pharmacyOwnerProfile.contactPerson
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user (both pharmacist and pharmacy owner)
export const login = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        pharmacistProfile: true,
        pharmacyOwnerProfile: true
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Prepare profile data based on user role
    let profileData = {};
    if (user.role === UserRole.PHARMACIST && user.pharmacistProfile) {
      profileData = {
        firstName: user.pharmacistProfile.firstName,
        lastName: user.pharmacistProfile.lastName
      };
    } else if (user.role === UserRole.PHARMACY_OWNER && user.pharmacyOwnerProfile) {
      profileData = {
        pharmacyName: user.pharmacyOwnerProfile.pharmacyName,
        contactPerson: user.pharmacyOwnerProfile.contactPerson
      };
    }

    // Return user data and token
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: profileData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};