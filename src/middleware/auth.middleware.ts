import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { UserRole } from '@prisma/client';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// Middleware to verify JWT token
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
      role: UserRole;
    };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is a pharmacist
export const isPharmacist = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.PHARMACIST) {
    return res.status(403).json({ message: 'Access denied. Pharmacist role required.' });
  }
  next();
};

// Middleware to check if user is a pharmacy owner
export const isPharmacyOwner = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.PHARMACY_OWNER) {
    return res.status(403).json({ message: 'Access denied. Pharmacy owner role required.' });
  }
  next();
};