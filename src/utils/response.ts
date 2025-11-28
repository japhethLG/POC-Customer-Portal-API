/**
 * Response Formatter Utilities
 *
 * Provides standardized response formatting for consistent API responses.
 */

import { Response } from 'express';

/**
 * Standard success response structure
 */
interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
}

/**
 * Standard error response structure
 */
interface ErrorResponse {
  success: false;
  message: string;
  errors?: any[];
  stack?: string;
}

/**
 * Send a successful response
 *
 * @param res - Express response object
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @param message - Optional success message
 * @param meta - Optional metadata (e.g., pagination info)
 *
 * @example
 * sendSuccess(res, user, 201, 'User created successfully');
 * sendSuccess(res, users, 200, undefined, { total: 100, page: 1 });
 */
export const sendSuccess = <T = any>(
  res: Response,
  data?: T,
  statusCode: number = 200,
  message?: string,
  meta?: Record<string, any>
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 *
 * @param res - Express response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @param errors - Optional array of detailed errors
 * @param stack - Optional stack trace (only in development)
 *
 * @example
 * sendError(res, 'Invalid email format', 400);
 * sendError(res, 'Validation failed', 400, validationErrors);
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: any[],
  stack?: string
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  if (stack && process.env.NODE_ENV !== 'production') {
    response.stack = stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 *
 * @param res - Express response object
 * @param data - Array of items
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @param message - Optional success message
 *
 * @example
 * sendPaginated(res, jobs, 1, 10, 100, 'Jobs retrieved successfully');
 */
export const sendPaginated = <T = any>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response => {
  const totalPages = Math.ceil(total / limit);

  return sendSuccess(
    res,
    data,
    200,
    message,
    {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  );
};

/**
 * Send a "no content" response (204)
 *
 * @param res - Express response object
 *
 * @example
 * sendNoContent(res); // Used after DELETE operations
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Send a "created" response (201)
 *
 * @param res - Express response object
 * @param data - Created resource data
 * @param message - Optional success message
 *
 * @example
 * sendCreated(res, newUser, 'User created successfully');
 */
export const sendCreated = <T = any>(
  res: Response,
  data: T,
  message?: string
): Response => {
  return sendSuccess(res, data, 201, message);
};
