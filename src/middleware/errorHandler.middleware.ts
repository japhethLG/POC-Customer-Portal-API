/**
 * Enhanced Error Handler Middleware
 *
 * Global error handler for all errors thrown in the application.
 * Handles custom errors, Mongoose errors, JWT errors, and unexpected errors.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { Error as MongooseError } from 'mongoose';

/**
 * Global error handler middleware
 *
 * Must be registered LAST in the middleware chain (after all routes)
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error with request context
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    statusCode: error.statusCode || 500,
  });

  // Handle custom AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  // Handle Mongoose validation errors
  if (error instanceof MongooseError.ValidationError) {
    const errors = Object.values(error.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (error instanceof MongooseError.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid ${error.path}: ${error.value}`,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  // Handle Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];

    res.status(409).json({
      success: false,
      message: `${field} '${value}' already exists`,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token has expired',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  // Handle multer errors (if file upload is implemented)
  if (error.name === 'MulterError') {
    let message = 'File upload error';

    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }

    res.status(400).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  // Default error response for unexpected errors
  const statusCode = error.statusCode || error.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : error.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

