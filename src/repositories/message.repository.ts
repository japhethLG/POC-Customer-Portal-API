/**
 * Message Repository
 *
 * Data access layer for Message model
 */

import { Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { Message } from '../models/Message.model';
import { IMessage } from '../types';

export class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(Message);
  }

  /**
   * Find all messages for a job
   *
   * @param jobId - Job ID
   * @returns Array of messages sorted by creation date
   */
  async findByJobId(jobId: string | Types.ObjectId): Promise<IMessage[]> {
    return this.find(
      { jobId },
      {
        sort: { createdAt: 1 }, // Oldest first
      }
    );
  }

  /**
   * Find messages for a job with lean query (plain objects)
   *
   * @param jobId - Job ID
   * @returns Array of message objects
   */
  async findByJobIdLean(jobId: string | Types.ObjectId): Promise<any[]> {
    return this.model
      .find({ jobId })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  /**
   * Create customer message
   *
   * @param jobId - Job ID
   * @param customerId - Customer ID
   * @param message - Message content
   * @returns Created message
   */
  async createCustomerMessage(
    jobId: string | Types.ObjectId,
    customerId: string | Types.ObjectId,
    message: string
  ): Promise<IMessage> {
    return this.create({
      jobId: jobId as any,
      customerId: customerId as any,
      message,
      senderType: 'customer',
    });
  }

  /**
   * Create system message
   *
   * @param jobId - Job ID
   * @param customerId - Customer ID
   * @param message - Message content
   * @returns Created message
   */
  async createSystemMessage(
    jobId: string | Types.ObjectId,
    customerId: string | Types.ObjectId,
    message: string
  ): Promise<IMessage> {
    return this.create({
      jobId: jobId as any,
      customerId: customerId as any,
      message,
      senderType: 'system',
    });
  }
}

// Export singleton instance
export const messageRepository = new MessageRepository();
