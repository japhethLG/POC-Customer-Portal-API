/**
 * Authentication Validation Schemas
 *
 * Zod schemas for validating authentication requests (register, login, logout)
 */

import { z } from 'zod';

/**
 * Register validation schema
 * Either email or phone is required along with password
 */
export const registerSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email format').optional(),
      phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      firstName: z.string().min(1, 'First name is required').optional(),
      lastName: z.string().min(1, 'Last name is required').optional(),
      address: z.string().optional(),
    })
    .refine((data) => data.email || data.phone, {
      message: 'Either email or phone is required',
      path: ['email'], // Show error on email field
    }),
});

/**
 * Login validation schema
 * Either email or phone is required along with password
 */
export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email format').optional(),
      phone: z.string().optional(),
      password: z.string().min(1, 'Password is required'),
    })
    .refine((data) => data.email || data.phone, {
      message: 'Either email or phone is required',
      path: ['email'],
    }),
});

/**
 * Logout validation schema
 * No body required for logout, but included for consistency
 */
export const logoutSchema = z.object({
  body: z.object({}).optional(),
});
