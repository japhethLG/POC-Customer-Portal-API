/**
 * Booking Controller
 *
 * Thin controller that delegates to BookingService.
 * Handles HTTP concerns only (request/response).
 */

import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { bookingService } from '../services/booking.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class BookingController {
  /**
   * Get all bookings for the authenticated customer
   * GET /api/bookings
   */
  static getAllBookings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const customerId = req.customerId!;
    const customer = req.customer!;

    const result = await bookingService.getAllBookings(customerId, customer);

    sendSuccess(
      res,
      result.bookings,
      200,
      undefined,
      { cached: result.cached }
    );
  });

  /**
   * Get a specific booking by ID
   * GET /api/bookings/:id
   */
  static getBookingById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const customerId = req.customerId!;

    const booking = await bookingService.getBookingById(id, customerId);

    sendSuccess(res, booking);
  });
}
