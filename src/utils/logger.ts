/**
 * Logger Utility
 *
 * Exports the Winston logger instance configured in config/logger.ts
 * Provides easy access to logging throughout the application.
 */

import { logger as winstonLogger } from '../config/logger';

/**
 * Application logger
 *
 * @example
 * import { logger } from '../utils/logger';
 *
 * logger.info('User logged in', { userId: user.id });
 * logger.error('Failed to connect to database', { error: err.message });
 * logger.warn('Cache miss', { key: cacheKey });
 * logger.debug('Processing request', { requestId: req.id });
 */
export const logger = winstonLogger;

/**
 * Log levels:
 * - error: Error messages
 * - warn: Warning messages
 * - info: Informational messages
 * - http: HTTP requests
 * - verbose: Verbose messages
 * - debug: Debug messages
 * - silly: Silly messages (most verbose)
 */
