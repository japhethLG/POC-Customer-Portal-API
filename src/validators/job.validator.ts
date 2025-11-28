/**
 * Job Validation Schemas
 *
 * Zod schemas for validating job-related requests (create, update, delete)
 */

import { z } from 'zod';

/**
 * Job status enum values
 */
const jobStatusEnum = z.enum([
  'Quote',
  'Work Order',
  'Scheduled',
  'In Progress',
  'Complete',
  'Cancelled',
]);

/**
 * Create job validation schema
 */
export const createJobSchema = z.object({
  body: z.object({
    job_address: z.string().min(1, 'Job address is required'),
    job_description: z.string().min(1, 'Job description is required'),
    scheduled_date: z.string().optional(),
    status: jobStatusEnum.optional(),
    contact_name: z.string().optional(),
    contact_email: z.string().email('Invalid email format').optional(),
    contact_phone: z.string().optional(),
  }),
});

/**
 * Update job validation schema
 * All fields are optional for updates
 */
export const updateJobSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Job ID is required'),
  }),
  body: z.object({
    job_address: z.string().min(1, 'Job address cannot be empty').optional(),
    job_description: z.string().min(1, 'Job description cannot be empty').optional(),
    scheduled_date: z.string().optional(),
    status: jobStatusEnum.optional(),
    contact_name: z.string().optional(),
    contact_email: z.string().email('Invalid email format').optional(),
    contact_phone: z.string().optional(),
  }),
});

/**
 * Delete job validation schema
 */
export const deleteJobSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Job ID is required'),
  }),
});

/**
 * Get job by ID validation schema
 */
export const getJobByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Job ID is required'),
  }),
});
