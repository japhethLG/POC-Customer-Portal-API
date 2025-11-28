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
   * @param jobUuid - ServiceM8 Job UUID
   * @returns Array of messages sorted by creation date
   */
  async findByJobUuid(jobUuid: string): Promise<IMessage[]> {
    return this.find(
      { jobUuid },
      {
        sort: { createdAt: 1 }, // Oldest first
      }
    );
  }

  /**
   * Find messages for a job with lean query (plain objects)
   *
   * @param jobUuid - ServiceM8 Job UUID
   * @returns Array of message objects
   */
  async findByJobUuidLean(jobUuid: string): Promise<any[]> {
    return this.model
      .find({ jobUuid })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  /**
   * Create customer message
   *
   * @param jobUuid - ServiceM8 Job UUID
   * @param customerId - Customer ID
   * @param message - Message content
   * @returns Created message
   */
  async createCustomerMessage(
    jobUuid: string,
    customerId: string | Types.ObjectId,
    message: string
  ): Promise<IMessage> {
    return this.create({
      jobUuid,
      customerId: customerId as any,
      message,
      senderType: 'customer',
    });
  }

  /**
   * Create system message
   *
   * @param jobUuid - ServiceM8 Job UUID
   * @param customerId - Customer ID
   * @param message - Message content
   * @returns Created message
   */
  async createSystemMessage(
    jobUuid: string,
    customerId: string | Types.ObjectId,
    message: string
  ): Promise<IMessage> {
    return this.create({
      jobUuid,
      customerId: customerId as any,
      message,
      senderType: 'system',
    });
  }
}

// Export singleton instance
export const messageRepository = new MessageRepository();
