/**
 * Message Service
 *
 * Handles all message-related business logic including
 * fetching and creating messages with job ownership validation.
 */

import { Types } from 'mongoose';
import { messageRepository } from '../repositories/message.repository';
import { jobRepository } from '../repositories/job.repository';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

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
   * @param jobId - Job ID
   * @param customerId - Customer ID for ownership verification
   * @returns Array of messages
   * @throws NotFoundError if job not found or not owned by customer
   */
  async getMessages(
    jobId: string,
    customerId: Types.ObjectId
  ): Promise<MessageResult[]> {
    // Verify job belongs to customer
    const job = await jobRepository.findOne({ _id: jobId, customerId });
    if (!job) {
      throw new NotFoundError('Booking');
    }

    // Fetch messages (lean query for performance)
    const messages = await messageRepository.findByJobIdLean(jobId);

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
   * @param jobId - Job ID
   * @param customerId - Customer ID
   * @param messageText - Message content
   * @returns Created message
   * @throws NotFoundError if job not found or not owned by customer
   * @throws ValidationError if message is empty
   */
  async sendMessage(
    jobId: string,
    customerId: Types.ObjectId,
    messageText: string
  ): Promise<MessageResult> {
    // Validate message
    const trimmedMessage = messageText?.trim();
    if (!trimmedMessage || trimmedMessage.length === 0) {
      throw new ValidationError('Message is required');
    }

    // Verify job belongs to customer
    const job = await jobRepository.findOne({ _id: jobId, customerId });
    if (!job) {
      throw new NotFoundError('Booking');
    }

    // Create message
    const newMessage = await messageRepository.createCustomerMessage(
      jobId,
      customerId,
      trimmedMessage
    );

    logger.info('New message sent by customer', { 
      jobId, 
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
   * @param jobId - Job ID
   * @param customerId - Customer ID
   * @param messageText - Message content
   * @returns Created message
   */
  async createSystemMessage(
    jobId: string,
    customerId: Types.ObjectId,
    messageText: string
  ): Promise<MessageResult> {
    const newMessage = await messageRepository.createSystemMessage(
      jobId,
      customerId,
      messageText
    );

    logger.info('System message created', { 
      jobId, 
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

