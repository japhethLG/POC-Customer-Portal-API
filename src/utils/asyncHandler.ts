/**
 * Async Handler Wrapper
 *
 * Wraps async route handlers to automatically catch errors and pass them to
 * the Express error handling middleware. This eliminates the need for try-catch
 * blocks in every controller method.
 */

import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps an async function and catches any errors
 * @param fn - Async function to wrap
 * @returns Express middleware function
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json({ success: true, data: users });
 * }));
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
