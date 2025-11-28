/**
 * Winston Logger Configuration
 *
 * Provides structured logging configuration for the application.
 * Logs are written to files and console based on environment.
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from './env';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format for development
 * Provides colorized, human-readable output
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return msg;
  })
);

/**
 * Production log format
 * Structured JSON for log aggregation services
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: config.nodeEnv === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'servicem8-portal-api' },
  transports: [
    // Error logs - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined logs - all levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Add console transport in development
 * or if explicitly requested
 */
if (config.nodeEnv !== 'production' || process.env.LOG_TO_CONSOLE === 'true') {
  logger.add(
    new winston.transports.Console({
      format: devFormat,
    })
  );
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'exceptions.log'),
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'rejections.log'),
  })
);

/**
 * Create a stream object for Morgan HTTP logging
 */
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
