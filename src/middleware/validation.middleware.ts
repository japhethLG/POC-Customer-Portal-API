/**
 * Validation Middleware
 *
 * Generic middleware for validating requests using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validate request against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * router.post('/register', validate(registerSchema), AuthController.register);
 */
export const validate = (schema: z.ZodType<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // If validation passes, continue to next middleware
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors for response
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors,
        });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }

      // Pass other errors to error handler
      next(error);
    }
  };
};
