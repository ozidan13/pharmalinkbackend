import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/error.middleware';

// Import routes (to be implemented)
import authRoutes from './api/auth/auth.routes';
import pharmacistRoutes from './api/pharmacists/pharmacist.routes';
import pharmacyOwnerRoutes from './api/pharmacies/pharmacy-owner.routes';
import storeRoutes from './api/store/store.routes';

// Load environment variables
dotenv.config();

// Initialize Prisma client
export const prisma = new PrismaClient();

// Initialize Express app
const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pharmacists', pharmacistRoutes);
app.use('/api/v1/pharmacies', pharmacyOwnerRoutes);
app.use('/api/v1/store', storeRoutes);

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Server shut down gracefully');
  process.exit(0);
});