import { Router } from 'express';
import authRoutes from './auth.routes';
import bookingRoutes from './booking.routes';
import messageRoutes from './message.routes';
import jobRoutes from './job.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/jobs', jobRoutes);
router.use('/messages', messageRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ServiceM8 Portal API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;

