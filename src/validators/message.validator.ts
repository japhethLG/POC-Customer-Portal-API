/**
 * Message Validation Schemas
 *
 * Zod schemas for validating message-related requests
 */

import { z } from 'zod';

/**
 * Get messages validation schema
 */
export const getMessagesSchema = z.object({
  params: z.object({
    jobId: z.string().min(1, 'Job ID is required'),
  }),
});

/**
 * Send message validation schema
 */
export const sendMessageSchema = z.object({
  params: z.object({
    jobId: z.string().min(1, 'Job ID is required'),
  }),
  body: z.object({
    message: z
      .string()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message cannot exceed 1000 characters'),
  }),
});
