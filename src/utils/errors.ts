/**
 * Custom Error Classes for the Application
 *
 * Provides a hierarchy of error classes for consistent error handling
 * throughout the application.
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 400 - Bad Request
 * Used for validation errors or malformed requests
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(400, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 401 - Unauthorized
 * Used for authentication failures
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 - Forbidden
 * Used for authorization failures (user is authenticated but lacks permission)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 - Not Found
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 - Conflict
 * Used when a request conflicts with current state (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 500 - Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, false); // Not operational - unexpected error
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 - Service Unavailable
 * Used when external services (like ServiceM8) are unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string = 'External service') {
    super(503, `${service} is currently unavailable`);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Domain-specific errors for business logic
 */

export class JobCreationError extends AppError {
  constructor(message: string = 'Failed to create job') {
    super(500, message);
    Object.setPrototypeOf(this, JobCreationError.prototype);
  }
}

export class JobUpdateError extends AppError {
  constructor(message: string = 'Failed to update job') {
    super(500, message);
    Object.setPrototypeOf(this, JobUpdateError.prototype);
  }
}

export class JobDeletionError extends AppError {
  constructor(message: string = 'Failed to delete job') {
    super(500, message);
    Object.setPrototypeOf(this, JobDeletionError.prototype);
  }
}

export class AuthenticationError extends UnauthorizedError {
  constructor(message: string = 'Invalid credentials') {
    super(message);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor(message: string = 'Token has expired') {
    super(message);
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor(message: string = 'Invalid token') {
    super(message);
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}
