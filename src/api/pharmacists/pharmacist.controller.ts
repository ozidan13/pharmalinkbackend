import { Request, Response } from 'express';
import { prisma } from '../../server';
import { validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';

// Get the current pharmacist's profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Get the pharmacist profile with user email and CV data
    const profile = await prisma.pharmacistProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        cvUrl: true,
        bio: true,
        experience: true,
        education: true,
        city: true,
        area: true,
        available: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ 
        success: false,
        message: 'Pharmacist profile not found' 
      });
    }

    // Format the response to include the email from the user relation
    // and ensure CV URL is a full URL if it exists
    const { user, cvUrl, ...profileData } = profile;
    const response = {
      ...profileData,
      email: user?.email,
      cv: cvUrl ? {
        url: cvUrl.startsWith('http') ? cvUrl : `${process.env.API_BASE_URL || 'http://localhost:5000'}${cvUrl}`,
        uploadedAt: profile.updatedAt
      } : null
    };

    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred while fetching your profile' 
    });
  }
};

// Update the current pharmacist's profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const {
      firstName,
      lastName,
      phoneNumber,
      bio,
      experience,
      education,
      city,
      area,
      available
    } = req.body;

    // Update profile with city (required) and area (optional)
    const updateData = {
      firstName,
      lastName,
      phoneNumber,
      bio,
      experience,
      education,
      city: city as string, // Ensure city is a string and required
      ...(area !== undefined && { area: area as string }), // Include area only if provided
      ...(available !== undefined && { available }), // Include available only if provided
      updatedAt: new Date()
    };
    
    // Update the profile and include the user's email in the response
    const updatedProfile = await prisma.pharmacistProfile.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    // Format the response to include the email from the user relation
    const { user, ...profileData } = updatedProfile;
    const response = {
      ...profileData,
      email: user?.email
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: response
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    
    // Handle specific error cases
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist profile not found'
      });
    }

    return res.status(500).json({ 
      success: false,
      message: 'An error occurred while updating your profile' 
    });
  }
};

// Get a specific pharmacist by ID (for pharmacy owners)
export const getPharmacistById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Check if the user is a pharmacy owner
    const pharmacyOwner = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId },
      select: {
        subscriptionStatus: true,
        subscriptionExpiresAt: true
      }
    });

    if (!pharmacyOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Only pharmacy owners can view pharmacist details' 
      });
    }

    // Check if the pharmacy owner has a valid subscription
    const hasValidSubscription = 
      pharmacyOwner.subscriptionStatus !== 'none' && 
      (!pharmacyOwner.subscriptionExpiresAt || new Date(pharmacyOwner.subscriptionExpiresAt) > new Date());

    if (!hasValidSubscription) {
      return res.status(403).json({ 
        success: false,
        message: 'Active subscription is required to view pharmacist details' 
      });
    }

    // Get pharmacist profile with user email and CV data
    const pharmacist = await prisma.pharmacistProfile.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        cvUrl: true,
        bio: true,
        experience: true,
        education: true,
        city: true,
        area: true,
        available: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!pharmacist) {
      return res.status(404).json({ 
        success: false,
        message: 'Pharmacist not found' 
      });
    }

    // Format the response to include the email from the user relation
    // and ensure CV URL is a full URL if it exists
    const { user, cvUrl, ...pharmacistData } = pharmacist;
    const response = {
      ...pharmacistData,
      email: user?.email,
      cv: cvUrl ? {
        url: cvUrl.startsWith('http') ? cvUrl : `${process.env.API_BASE_URL || 'http://localhost:5000'}${cvUrl}`,
        uploadedAt: pharmacist.updatedAt
      } : null
    };

    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching pharmacist:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred while fetching pharmacist details' 
    });
  }
};

// Search for pharmacists based on city and other criteria
export const searchPharmacists = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { 
      city,
      area,
      available,
      page = '1',
      limit = '10'
    } = req.query;

    // Convert page and limit to numbers
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build the where clause
    const where: any = { 
      city: city as string,
      ...(area && { area: area as string }),
      ...(available === 'true' && { available: true })
    };

    // Get total count for pagination
    const total = await prisma.pharmacistProfile.count({ where });
    
    // Find pharmacists with pagination
    const pharmacists = await prisma.pharmacistProfile.findMany({
      where,
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      skip,
      take: limitNum,
      orderBy: {
        lastName: 'asc'
      }
    });

    // Calculate pagination metadata
    const pages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        pharmacists: pharmacists.map(({ user, cvUrl, ...pharmacist }) => ({
          ...pharmacist,
          email: user?.email || null,
          cv: cvUrl ? {
            url: cvUrl.startsWith('http') ? cvUrl : `${process.env.API_BASE_URL || 'http://localhost:5000'}${cvUrl}`,
            uploadedAt: pharmacist.updatedAt
          } : null
        })),
        pagination: {
          total,
          limit: limitNum,
          page: pageNum,
          pages
        },
        filters: {
          applied: {
            city,
            area: area || null,
            available: available === 'true'
          }
        }
      }
    });
  } catch (error: unknown) {
    console.error('Error searching pharmacists:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to search pharmacists',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

// Get pharmacist's CV information
export const getCV = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Get the pharmacist's profile with CV URL
    const profile = await prisma.pharmacistProfile.findUnique({
      where: { userId },
      select: {
        cvUrl: true,
        updatedAt: true
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist profile not found'
      });
    }

    if (!profile.cvUrl) {
      return res.status(404).json({
        success: false,
        message: 'CV not found for this pharmacist'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        cvUrl: profile.cvUrl,
        uploadedAt: profile.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching CV:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your CV'
    });
  }
};

// Upload CV for pharmacist
export const uploadCV = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded. Please upload a valid CV file (PDF, DOC, or DOCX, max 5MB).' 
      });
    }

    try {
      // Get the uploaded file details
      const fileUrl = `/uploads/cvs/${req.file.filename}`;

      // Update pharmacist profile with CV URL
      const updatedProfile = await prisma.pharmacistProfile.update({
        where: { userId },
        data: { 
          cvUrl: fileUrl,
          updatedAt: new Date()
        },
        select: {
          id: true,
          cvUrl: true,
          updatedAt: true
        }
      });

      return res.status(200).json({
        success: true,
        message: 'CV uploaded successfully',
        data: {
          cvUrl: updatedProfile.cvUrl,
          updatedAt: updatedProfile.updatedAt
        }
      });

    } catch (dbError) {
      // If database update fails, remove the uploaded file
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw dbError;
    }

  } catch (error: any) {
    console.error('Error uploading CV:', error);
    
    // Handle specific error cases
    if (error?.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist profile not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred while uploading your CV. Please try again.'
    });
  }
};