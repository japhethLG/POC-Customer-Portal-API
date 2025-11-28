/**
 * Booking Service
 *
 * Handles all booking-related business logic by fetching directly from ServiceM8.
 * No local database storage - all data fetched in real-time.
 */

import { servicem8Service } from './servicem8.service';
import { logger } from '../utils/logger';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { ICustomer, ServiceM8Job, ServiceM8Attachment } from '../types';

/**
 * Booking summary for list view
 */
export interface BookingSummary {
  id: string;
  servicem8Uuid: string;
  jobNumber?: string;
  status?: string;
  address?: string;
  description?: string;
  scheduledDate?: string;
  contactName?: string;
}

/**
 * Attachment summary
 */
export interface AttachmentSummary {
  id: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Booking detail with attachments
 */
export interface BookingDetail extends BookingSummary {
  contactEmail?: string;
  contactPhone?: string;
  attachments: AttachmentSummary[];
}

class BookingService {
  /**
   * Get all bookings for a customer directly from ServiceM8
   *
   * @param customerId - Customer ID (for logging)
   * @param customer - Customer document
   * @returns Array of bookings
   */
  async getAllBookings(
    customerId: string,
    customer: ICustomer
  ): Promise<BookingSummary[]> {
    logger.info('Fetching bookings for customer from ServiceM8', { 
      customerId,
      email: customer.email,
      servicem8ClientUuid: customer.servicem8ClientUuid
    });

    // Fetch all jobs from ServiceM8
    const allJobs = await servicem8Service.getAllJobs();

    // Filter jobs that belong to this customer (by company_uuid) and are active
    const customerJobs = allJobs.filter(
      job => job.company_uuid === customer.servicem8ClientUuid && job.active === 1
    );

    logger.info('Found active jobs for customer in ServiceM8', { 
      count: customerJobs.length 
    });

    return customerJobs.map(job => this.mapServiceM8JobToSummary(job));
  }

  /**
   * Get a specific booking by UUID from ServiceM8
   *
   * @param jobUuid - ServiceM8 Job UUID
   * @param customerId - Customer ID for logging
   * @param customer - Customer document for ownership verification
   * @returns Booking detail with attachments
   * @throws NotFoundError if booking not found
   * @throws ForbiddenError if customer doesn't own the booking
   */
  async getBookingById(
    jobUuid: string,
    customerId: string,
    customer: ICustomer
  ): Promise<BookingDetail> {
    logger.info('Fetching booking from ServiceM8', { 
      customerId,
      jobUuid
    });

    // Fetch job from ServiceM8
    const job = await servicem8Service.getJobByUuid(jobUuid);

    if (!job) {
      throw new NotFoundError('Booking');
    }

    // Check if job is active
    if (job.active === 0) {
      throw new NotFoundError('Booking');
    }

    // Verify customer owns this job
    if (job.company_uuid !== customer.servicem8ClientUuid) {
      logger.warn('Customer attempted to access booking they do not own', {
        customerId,
        jobUuid,
        jobCompanyUuid: job.company_uuid,
        customerCompanyUuid: customer.servicem8ClientUuid
      });
      throw new ForbiddenError('You do not have permission to access this booking');
    }

    // Fetch attachments from ServiceM8
    const servicem8Attachments = await servicem8Service.getJobAttachments(jobUuid);

    return {
      ...this.mapServiceM8JobToSummary(job),
      contactEmail: job.job_contact_email,
      contactPhone: job.job_contact_mobile,
      attachments: servicem8Attachments.map(att => this.mapServiceM8AttachmentToSummary(att)),
    };
  }

  /**
   * Map ServiceM8 job to booking summary
   */
  private mapServiceM8JobToSummary(job: ServiceM8Job): BookingSummary {
    return {
      id: job.uuid,
      servicem8Uuid: job.uuid,
      jobNumber: job.generated_job_id,
      status: job.status,
      address: job.job_address,
      description: job.job_description,
      scheduledDate: job.scheduled_date,
      contactName: job.job_contact_name,
    };
  }

  /**
   * Map ServiceM8 attachment to attachment summary
   */
  private mapServiceM8AttachmentToSummary(attachment: ServiceM8Attachment): AttachmentSummary {
    return {
      id: attachment.uuid,
      fileName: attachment.file_name,
      fileType: attachment.file_type || attachment.content_type,
      fileUrl: attachment.file,
      thumbnailUrl: attachment.file, // ServiceM8 doesn't provide separate thumbnails
    };
  }
}

// Export singleton instance
export const bookingService = new BookingService();
