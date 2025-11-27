import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All booking routes require authentication
router.use(authMiddleware);

// GET /api/bookings
router.get('/', BookingController.getAllBookings);

// GET /api/bookings/:id
router.get('/:id', BookingController.getBookingById);

export default router;

