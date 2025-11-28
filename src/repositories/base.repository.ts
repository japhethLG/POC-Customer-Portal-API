/**
 * Base Repository
 *
 * Generic repository class providing common CRUD operations for Mongoose models.
 * Specific repositories extend this class to add custom query methods.
 */

import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

/**
 * Generic base repository with common database operations
 *
 * @template T - Mongoose document type
 *
 * @example
 * export class CustomerRepository extends BaseRepository<ICustomer> {
 *   constructor() {
 *     super(Customer);
 *   }
 *
 *   async findByEmail(email: string): Promise<ICustomer | null> {
 *     return this.findOne({ email });
 *   }
 * }
 */
export abstract class BaseRepository<T extends Document> {
  constructor(protected model: Model<T>) {}

  /**
   * Find document by ID
   *
   * @param id - Document ID
   * @returns Document or null if not found
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  /**
   * Find all documents matching filter
   *
   * @param filter - MongoDB filter query
   * @param options - Query options (select, limit, skip, sort)
   * @returns Array of documents
   */
  async find(filter: FilterQuery<T> = {}, options?: QueryOptions): Promise<T[]> {
    let query = this.model.find(filter);

    if (options?.select) {
      query = query.select(options.select);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.skip) {
      query = query.skip(options.skip);
    }

    if (options?.sort) {
      query = query.sort(options.sort);
    }

    return query.exec();
  }

  /**
   * Find single document matching filter
   *
   * @param filter - MongoDB filter query
   * @returns Document or null if not found
   */
  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  /**
   * Create new document
   *
   * @param data - Document data
   * @returns Created document
   */
  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data as any);
  }

  /**
   * Update document by ID
   *
   * @param id - Document ID
   * @param data - Data to update
   * @returns Updated document or null if not found
   */
  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();
  }

  /**
   * Update one document matching filter
   *
   * @param filter - MongoDB filter query
   * @param data - Data to update
   * @returns Updated document or null if not found
   */
  async updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate(filter, data, { new: true, runValidators: true })
      .exec();
  }

  /**
   * Delete document by ID
   *
   * @param id - Document ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id } as any).exec();
    return result.deletedCount > 0;
  }

  /**
   * Delete one document matching filter
   *
   * @param filter - MongoDB filter query
   * @returns True if deleted, false if not found
   */
  async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filter).exec();
    return result.deletedCount > 0;
  }

  /**
   * Count documents matching filter
   *
   * @param filter - MongoDB filter query
   * @returns Number of documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  /**
   * Check if document exists
   *
   * @param filter - MongoDB filter query
   * @returns True if exists, false otherwise
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).limit(1).exec();
    return count > 0;
  }
}
