/**
 * Customer Repository
 *
 * Data access layer for Customer model
 */

import { BaseRepository } from './base.repository';
import { Customer } from '../models/Customer.model';
import { ICustomer } from '../types';

export class CustomerRepository extends BaseRepository<ICustomer> {
  constructor() {
    super(Customer);
  }

  /**
   * Find customer by email
   *
   * @param email - Customer email
   * @returns Customer or null if not found
   */
  async findByEmail(email: string): Promise<ICustomer | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find customer by phone
   *
   * @param phone - Customer phone
   * @returns Customer or null if not found
   */
  async findByPhone(phone: string): Promise<ICustomer | null> {
    return this.findOne({ phone });
  }

  /**
   * Find customer by email or phone
   *
   * @param email - Customer email
   * @param phone - Customer phone
   * @returns Customer or null if not found
   */
  async findByEmailOrPhone(email?: string, phone?: string): Promise<ICustomer | null> {
    const filter: any = { $or: [] };

    if (email) {
      filter.$or.push({ email: email.toLowerCase() });
    }

    if (phone) {
      filter.$or.push({ phone });
    }

    if (filter.$or.length === 0) {
      return null;
    }

    return this.findOne(filter);
  }

  /**
   * Find customer by ServiceM8 client UUID
   *
   * @param uuid - ServiceM8 client UUID
   * @returns Customer or null if not found
   */
  async findByServiceM8Uuid(uuid: string): Promise<ICustomer | null> {
    return this.findOne({ servicem8ClientUuid: uuid });
  }
}

// Export singleton instance
export const customerRepository = new CustomerRepository();
