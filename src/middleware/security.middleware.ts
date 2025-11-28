/**
 * Security Middleware
 *
 * Configures various security middlewares to protect the application from
 * common web vulnerabilities.
 */

import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { Application } from 'express';
import { logger } from '../utils/logger';

/**
 * Configure Helmet for security headers
 *
 * Helmet helps secure Express apps by setting various HTTP headers
 * - Prevents clickjacking (X-Frame-Options)
 * - Prevents MIME sniffing (X-Content-Type-Options)
 * - Enables XSS filter (X-XSS-Protection)
 * - Enforces HTTPS (Strict-Transport-Security in production)
 * - Prevents DNS prefetching when not needed
 */
export const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
  });
};

/**
 * Configure MongoDB sanitization
 *
 * Prevents NoSQL injection attacks by sanitizing user input
 * Removes keys that start with '$' or contain '.'
 *
 * @example
 * // Malicious input: { $gt: "" } in email field
 * // After sanitization: { } (removed)
 */
export const configureMongoSanitize = () => {
  return mongoSanitize({
    replaceWith: '_', // Replace prohibited characters with underscore
    onSanitize: ({ req, key }) => {
      logger.warn('Sanitized potentially malicious key in request', { key });
    },
  });
};

/**
 * Apply all security middleware to the app
 *
 * @param app - Express application instance
 */
export const applySecurity = (app: Application): void => {
  // Apply Helmet for security headers
  app.use(configureHelmet());

  // Apply MongoDB input sanitization
  app.use(configureMongoSanitize());

  // Note: XSS-Clean is deprecated but still functional
  // Consider migrating to a different XSS sanitization library in the future
  // For now, we'll rely on Helmet's XSS protection and input validation
};
