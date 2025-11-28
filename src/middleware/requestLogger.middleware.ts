/**
 * Request Logger Middleware
 *
 * Logs all incoming HTTP requests with details like method, URL,
 * status code, and response time.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to log HTTP requests
 *
 * Logs request details when the response is finished
 * Includes: method, URL, status code, response time, and user agent
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    // Determine log level based on status code
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]('HTTP Request', {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.get('user-agent') || 'unknown',
    });
  });

  next();
};

/**
 * Middleware to log request body (use carefully, avoid logging sensitive data)
 *
 * Only use in development for debugging purposes
 * DO NOT use in production as it may log sensitive information
 */
export const requestBodyLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV === 'development' && req.body) {
    // Sanitize sensitive fields
    const sanitizedBody = { ...req.body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];

    sensitiveFields.forEach((field) => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '***REDACTED***';
      }
    });

    logger.debug('Request Body', {
      method: req.method,
      url: req.originalUrl,
      body: sanitizedBody,
    });
  }

  next();
};
