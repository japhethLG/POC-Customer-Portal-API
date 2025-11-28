/**
 * Booking Validation Schemas
 *
 * Zod schemas for validating booking-related requests
 */

import { z } from 'zod';

/**
 * Get all bookings validation schema
 * Supports optional query parameters for filtering/pagination
 */
export const getAllBookingsSchema = z.object({
  query: z
    .object({
      page: z
        .string()
        .regex(/^\d+$/, 'Page must be a number')
        .transform(Number)
        .optional(),
      limit: z
        .string()
        .regex(/^\d+$/, 'Limit must be a number')
        .transform(Number)
        .optional(),
      status: z.string().optional(),
    })
    .optional(),
});

/**
 * Get booking by ID validation schema
 */
export const getBookingByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking ID is required'),
  }),
});
