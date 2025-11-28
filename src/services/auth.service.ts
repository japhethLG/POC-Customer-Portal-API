/**
 * Authentication Service
 *
 * Handles all authentication-related business logic including
 * registration, login, logout, and session management.
 */

import { Types } from 'mongoose';
import { JWTUtils } from '../utils/jwt.utils';
import { servicem8Service } from './servicem8.service';
import { customerRepository } from '../repositories/customer.repository';
import { sessionRepository } from '../repositories/session.repository';
import { logger } from '../utils/logger';
import {
  ConflictError,
  AuthenticationError,
  ValidationError,
} from '../utils/errors';
import { ICustomer } from '../types';

/**
 * Registration input data
 */
export interface RegisterInput {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  address?: string;
}

/**
 * Login input data
 */
export interface LoginInput {
  email?: string;
  phone?: string;
  password: string;
}

/**
 * Auth result with token and customer data
 */
export interface AuthResult {
  token: string;
  customer: {
    id: Types.ObjectId;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    servicem8ClientUuid: string; // Required - created during registration
  };
}

/**
 * Customer profile data
 */
export interface CustomerProfile {
  id: Types.ObjectId;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

class AuthService {
  /**
   * Register a new customer
   *
   * @param input - Registration data
   * @returns Auth result with token and customer
   * @throws ValidationError if input is invalid
   * @throws ConflictError if customer already exists
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const { email, phone, password, firstName, lastName, address } = input;

    // Normalize inputs
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedPhone = phone?.trim();

    // Validate input - these checks are redundant with Zod but provide safety
    if (!normalizedEmail && !normalizedPhone) {
      throw new ValidationError('Either email or phone is required');
    }

    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Check if customer already exists
    const existingCustomer = await customerRepository.findByEmailOrPhone(
      normalizedEmail,
      normalizedPhone
    );

    if (existingCustomer) {
      throw new ConflictError('Customer with this email or phone already exists');
    }

    // Create company in ServiceM8 (mandatory - registration fails if this fails)
    const companyName = `${firstName || ''} ${lastName || ''}`.trim() || 
                        normalizedEmail || 
                        normalizedPhone || 
                        'Customer';
    
    let servicem8ClientUuid: string;
    try {
      const company = await servicem8Service.createCompany({
        name: companyName,
        email: normalizedEmail,
        mobile: normalizedPhone,
        address: address,
      });
      
      servicem8ClientUuid = company.uuid;
      logger.info('Created ServiceM8 company for new customer', { servicem8ClientUuid });
    } catch (error: any) {
      logger.error('Failed to create ServiceM8 company during registration', { 
        error: error.message 
      });
      throw new Error('Failed to create customer account in ServiceM8. Please try again.');
    }

    // Create customer in database
    const customer = await customerRepository.create({
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      firstName,
      lastName,
      address,
      servicem8ClientUuid,
    });

    // Generate JWT token
    const token = JWTUtils.generateToken({
      customerId: customer._id.toString(),
      email: normalizedEmail || normalizedPhone || '',
    });

    // Store session in database
    const expiresAt = JWTUtils.getExpirationDate();
    await sessionRepository.createSession(customer._id, token, expiresAt);

    logger.info('Customer registered successfully', { 
      customerId: customer._id,
      email: customer.email, 
      phone: customer.phone 
    });

    return {
      token,
      customer: {
        id: customer._id,
        email: customer.email,
        phone: customer.phone,
        firstName: customer.firstName,
        lastName: customer.lastName,
        address: customer.address,
        servicem8ClientUuid: customer.servicem8ClientUuid,
      },
    };
  }

  /**
   * Login a customer
   *
   * @param input - Login credentials
   * @returns Auth result with token and customer
   * @throws ValidationError if input is invalid
   * @throws AuthenticationError if credentials are invalid
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const { email, phone, password } = input;

    // Normalize inputs
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedPhone = phone?.trim();

    // Validate input
    if (!normalizedEmail && !normalizedPhone) {
      throw new ValidationError('Either email or phone is required');
    }

    if (!password) {
      throw new ValidationError('Password is required');
    }

    // Find customer by email or phone
    const customer = await customerRepository.findByEmailOrPhone(
      normalizedEmail,
      normalizedPhone
    );

    if (!customer) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await customer.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate JWT token
    const token = JWTUtils.generateToken({
      customerId: customer._id.toString(),
      email: customer.email || customer.phone || '',
    });

    // Store session in database
    const expiresAt = JWTUtils.getExpirationDate();
    await sessionRepository.createSession(customer._id, token, expiresAt);

    logger.info('Customer logged in successfully', { 
      customerId: customer._id,
      email: customer.email, 
      phone: customer.phone 
    });

    return {
      token,
      customer: {
        id: customer._id,
        email: customer.email,
        phone: customer.phone,
        firstName: customer.firstName,
        lastName: customer.lastName,
        address: customer.address,
        servicem8ClientUuid: customer.servicem8ClientUuid,
      },
    };
  }

  /**
   * Logout a customer by invalidating their session
   *
   * @param token - JWT token to invalidate
   */
  async logout(token: string): Promise<void> {
    if (token) {
      await sessionRepository.deleteByToken(token);
      logger.info('Customer logged out successfully');
    }
  }

  /**
   * Get customer profile from a customer document
   *
   * @param customer - Customer document
   * @returns Customer profile data
   */
  getProfile(customer: ICustomer): CustomerProfile {
    return {
      id: customer._id,
      email: customer.email,
      phone: customer.phone,
      firstName: customer.firstName,
      lastName: customer.lastName,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();

