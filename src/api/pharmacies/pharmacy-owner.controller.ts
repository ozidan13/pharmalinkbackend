import { Request, Response } from 'express';
import { prisma } from '../../server';
import { validationResult } from 'express-validator';

// Get the current pharmacy owner's profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const profile = await prisma.pharmacyOwnerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        pharmacyName: true,
        contactPerson: true,
        phoneNumber: true,
        address: true,
        city: true,
        area: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        updatedAt: true
      } as const
    });

    if (!profile) {
      return res.status(404).json({ message: 'Pharmacy owner profile not found' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Update the current pharmacy owner's profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      pharmacyName,
      contactPerson,
      phoneNumber,
      address,
      city,
      area
    } = req.body;

    // Update profile with city (required) and area (optional)
    const updateData = {
      pharmacyName,
      contactPerson,
      phoneNumber,
      address,
      city: city as string,
      ...(area !== undefined && { area: area as string })
    };

    const updatedProfile = await prisma.pharmacyOwnerProfile.update({
      where: { userId },
      data: updateData
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// Update subscription status
export const updateSubscription = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { planType } = req.body;

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update subscription status
    const updatedProfile = await prisma.pharmacyOwnerProfile.update({
      where: { userId },
      data: {
        subscriptionStatus: planType,
        subscriptionExpiresAt: expiresAt
      }
    });

    return res.status(200).json({
      message: 'Subscription updated successfully',
      subscription: {
        status: updatedProfile.subscriptionStatus,
        expiresAt: updatedProfile.subscriptionExpiresAt
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ message: 'Server error while updating subscription' });
  }
};