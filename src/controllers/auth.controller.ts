/**
 * Authentication Controller
 *
 * Thin controller that delegates to AuthService.
 * Handles HTTP concerns only (request/response).
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthRequest } from '../types';

export class AuthController {
  /**
   * Register a new customer
   * POST /api/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, phone, password, firstName, lastName, address } = req.body;

    const result = await authService.register({
      email,
      phone,
      password,
      firstName,
      lastName,
      address,
    });

    sendCreated(res, result, 'Registration successful');
  });

  /**
   * Login customer
   * POST /api/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, phone, password } = req.body;

    const result = await authService.login({
      email,
      phone,
      password,
    });

    sendSuccess(res, result, 200, 'Login successful');
  });

  /**
   * Logout customer
   * POST /api/auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await authService.logout(token);
    }

    sendSuccess(res, undefined, 200, 'Logout successful');
  });

  /**
   * Get current customer info
   * GET /api/auth/me
   */
  static me = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const customer = req.customer!;
    const profile = authService.getProfile(customer);

    sendSuccess(res, profile);
  });
}
