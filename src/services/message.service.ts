/**
 * Message Service
 *
 * Handles all message-related business logic including
 * fetching and creating messages with job ownership validation via ServiceM8.
 */

import { Types } from 'mongoose';
import { messageRepository } from '../repositories/message.repository';
import { servicem8Service } from './servicem8.service';
import { logger } from '../utils/logger';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { ICustomer } from '../types';

/**
 * Message result for API responses
 */
export interface MessageResult {
  id: Types.ObjectId;
  message: string;
  senderType: 'customer' | 'system';
  createdAt: Date;
}

class MessageService {
  /**
   * Get all messages for a job
   *
   * @param jobUuid - ServiceM8 Job UUID
   * @param customerId - Customer ID for logging
   * @param customer - Customer document for ownership verification
   * @returns Array of messages
   * @throws NotFoundError if job not found
   * @throws ForbiddenError if customer doesn't own the job
   */
  async getMessages(
    jobUuid: string,
    customerId: string,
    customer: ICustomer
  ): Promise<MessageResult[]> {
    // Verify job exists and belongs to customer
    const job = await servicem8Service.getJobByUuid(jobUuid);
    if (!job) {
      throw new NotFoundError('Booking');
    }

    // Check if job is active
    if (job.active === 0) {
      throw new NotFoundError('Booking');
    }

    if (job.company_uuid !== customer.servicem8ClientUuid) {
      logger.warn('Customer attempted to access messages for job they do not own', {
        customerId,
        jobUuid,
        jobCompanyUuid: job.company_uuid,
        customerCompanyUuid: customer.servicem8ClientUuid
      });
      throw new ForbiddenError('You do not have permission to access these messages');
    }

    // Fetch messages (lean query for performance)
    const messages = await messageRepository.findByJobUuidLean(jobUuid);

    return messages.map(msg => ({
      id: msg._id,
      message: msg.message,
      senderType: msg.senderType,
      createdAt: msg.createdAt,
    }));
  }

  /**
   * Send a message for a job
   *
   * @param jobUuid - ServiceM8 Job UUID
   * @param customerId - Customer ID
   * @param customer - Customer document for ownership verification
   * @param messageText - Message content
   * @returns Created message
   * @throws NotFoundError if job not found
   * @throws ForbiddenError if customer doesn't own the job
   * @throws ValidationError if message is empty
   */
  async sendMessage(
    jobUuid: string,
    customerId: Types.ObjectId,
    customer: ICustomer,
    messageText: string
  ): Promise<MessageResult> {
    // Validate message
    const trimmedMessage = messageText?.trim();
    if (!trimmedMessage || trimmedMessage.length === 0) {
      throw new ValidationError('Message is required');
    }

    // Verify job exists and belongs to customer
    const job = await servicem8Service.getJobByUuid(jobUuid);
    if (!job) {
      throw new NotFoundError('Booking');
    }

    // Check if job is active
    if (job.active === 0) {
      throw new NotFoundError('Booking');
    }

    if (job.company_uuid !== customer.servicem8ClientUuid) {
      logger.warn('Customer attempted to send message for job they do not own', {
        customerId,
        jobUuid,
        jobCompanyUuid: job.company_uuid,
        customerCompanyUuid: customer.servicem8ClientUuid
      });
      throw new ForbiddenError('You do not have permission to send messages for this job');
    }

    // Create message
    const newMessage = await messageRepository.createCustomerMessage(
      jobUuid,
      customerId,
      trimmedMessage
    );

    logger.info('New message sent by customer', { 
      jobUuid,
      customerId,
      messageId: newMessage._id 
    });

    return {
      id: newMessage._id,
      message: newMessage.message,
      senderType: newMessage.senderType,
      createdAt: newMessage.createdAt,
    };
  }

  /**
   * Create a system message for a job
   * (For internal use, e.g., status updates)
   *
   * @param jobUuid - ServiceM8 Job UUID
   * @param customerId - Customer ID
   * @param messageText - Message content
   * @returns Created message
   */
  async createSystemMessage(
    jobUuid: string,
    customerId: Types.ObjectId,
    messageText: string
  ): Promise<MessageResult> {
    const newMessage = await messageRepository.createSystemMessage(
      jobUuid,
      customerId,
      messageText
    );

    logger.info('System message created', { 
      jobUuid,
      messageId: newMessage._id 
    });

    return {
      id: newMessage._id,
      message: newMessage.message,
      senderType: newMessage.senderType,
      createdAt: newMessage.createdAt,
    };
  }
}

// Export singleton instance
export const messageService = new MessageService();
