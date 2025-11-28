import { Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt.utils';
import { Customer } from '../models';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = JWTUtils.verifyToken(token);

    // Fetch customer from database
    const customer = await Customer.findById(payload.customerId);

    if (!customer) {
      res.status(401).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    // Attach customer to request
    req.customer = customer;
    req.customerId = customer._id;

    next();
  } catch (error: any) {
    logger.warn('Auth middleware error', { error: error.message });
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

