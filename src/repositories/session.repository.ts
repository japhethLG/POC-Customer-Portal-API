/**
 * Session Repository
 *
 * Data access layer for Session model
 */

import { Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { Session } from '../models/Session.model';
import { ISession } from '../types';

export class SessionRepository extends BaseRepository<ISession> {
  constructor() {
    super(Session);
  }

  /**
   * Find session by token
   *
   * @param token - JWT token
   * @returns Session or null if not found
   */
  async findByToken(token: string): Promise<ISession | null> {
    return this.findOne({ token });
  }

  /**
   * Find all sessions for a customer
   *
   * @param customerId - Customer ID
   * @returns Array of sessions
   */
  async findByCustomerId(customerId: string | Types.ObjectId): Promise<ISession[]> {
    return this.find({ customerId });
  }

  /**
   * Create session for customer
   *
   * @param customerId - Customer ID
   * @param token - JWT token
   * @param expiresAt - Expiration date
   * @returns Created session
   */
  async createSession(
    customerId: string | Types.ObjectId,
    token: string,
    expiresAt: Date
  ): Promise<ISession> {
    return this.create({
      customerId: customerId as any,
      token,
      expiresAt,
    });
  }

  /**
   * Delete session by token
   *
   * @param token - JWT token
   * @returns True if deleted, false if not found
   */
  async deleteByToken(token: string): Promise<boolean> {
    return this.deleteOne({ token });
  }

  /**
   * Delete all sessions for a customer
   *
   * @param customerId - Customer ID
   * @returns Number of deleted sessions
   */
  async deleteByCustomerId(customerId: string | Types.ObjectId): Promise<number> {
    const result = await this.model.deleteMany({ customerId }).exec();
    return result.deletedCount || 0;
  }

  /**
   * Delete expired sessions
   *
   * @returns Number of deleted sessions
   */
  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.model.deleteMany({ expiresAt: { $lt: now } }).exec();
    return result.deletedCount || 0;
  }
}

// Export singleton instance
export const sessionRepository = new SessionRepository();
