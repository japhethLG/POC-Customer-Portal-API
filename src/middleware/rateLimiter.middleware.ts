/**
 * Rate Limiter Middleware
 *
 * Protects the API from brute force attacks and abuse by limiting
 * the number of requests from a single IP address.
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * General API rate limiter
 * Applies to all API routes
 *
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests (optional - only count failed requests)
  // skipSuccessfulRequests: false,
  // Skip failed requests (optional - only count successful requests)
  // skipFailedRequests: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    });
  },
});

/**
 * Authentication rate limiter
 * Stricter limits for login/register endpoints to prevent brute force attacks
 *
 * Limits: 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
    });
  },
});

/**
 * Job creation rate limiter
 * Moderate limits for job creation to prevent spam
 *
 * Limits: 20 requests per 15 minutes per IP
 */
export const jobCreationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 job creations per windowMs
  message: {
    success: false,
    message: 'Too many job creation requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Job creation rate limit exceeded. Please try again after 15 minutes.',
    });
  },
});
