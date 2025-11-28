import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  getAllBookingsSchema,
  getBookingByIdSchema,
} from '../validators/booking.validator';

const router = Router();

// All booking routes require authentication
router.use(authMiddleware);

// GET /api/bookings
router.get('/', validate(getAllBookingsSchema), BookingController.getAllBookings);

// GET /api/bookings/:id
router.get('/:id', validate(getBookingByIdSchema), BookingController.getBookingById);

export default router;

