import { Request, Response } from 'express';
import { Customer, Session } from '../models';
import { JWTUtils } from '../utils/jwt.utils';
import { servicem8Service } from '../services/servicem8.service';

export class AuthController {
  /**
   * Register a new customer
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, phone, password, firstName, lastName, address } = req.body;

      // Validate input
      if ((!email && !phone) || !password) {
        res.status(400).json({
          success: false,
          message: 'Either email or phone, and password are required',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
        return;
      }

      // Check if customer already exists
      const existingCustomer = await Customer.findOne({
        $or: [
          email ? { email: email.toLowerCase().trim() } : null,
          phone ? { phone: phone.trim() } : null,
        ].filter(Boolean),
      });

      if (existingCustomer) {
        res.status(400).json({
          success: false,
          message: 'Customer with this email or phone already exists',
        });
        return;
      }

      // Create company in ServiceM8 (optional but recommended)
      let servicem8ClientUuid: string | undefined;
      try {
        const companyName = `${firstName || ''} ${lastName || ''}`.trim() || email || phone || 'Customer';
        const company = await servicem8Service.createCompany({
          name: companyName,
          email: email,
          mobile: phone,
          address: address,
        });
        servicem8ClientUuid = company.uuid;
        console.log(`✅ Created ServiceM8 company: ${servicem8ClientUuid}`);
      } catch (error: any) {
        console.warn('Failed to create ServiceM8 company:', error.message);
        // Continue without ServiceM8 company - not critical
      }

      // Create customer in our database
      const customer = await Customer.create({
        email: email?.toLowerCase().trim(),
        phone: phone?.trim(),
        password,
        firstName,
        lastName,
        address,
        servicem8ClientUuid,
      });

      // Generate JWT token
      const token = JWTUtils.generateToken({
        customerId: customer._id.toString(),
        email: customer.email || customer.phone || '',
      });

      // Store session in database
      const expiresAt = JWTUtils.getExpirationDate();
      await Session.create({
        customerId: customer._id,
        token,
        expiresAt,
      });

      console.log(`✅ Customer registered: ${customer.email || customer.phone}`);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
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
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }
  }

  /**
   * Login customer with (email OR phone) and password
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, phone, password } = req.body;

      // Validate input
      if ((!email && !phone) || !password) {
        res.status(400).json({
          success: false,
          message: 'Either email or phone, and password are required',
        });
        return;
      }

      // Find customer by email OR phone
      const query: any = {};
      if (email) {
        query.email = email.toLowerCase().trim();
      } else if (phone) {
        query.phone = phone.trim();
      }

      const customer = await Customer.findOne(query);

      if (!customer) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Verify password
      const isPasswordValid = await customer.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Generate JWT token
      const token = JWTUtils.generateToken({
        customerId: customer._id.toString(),
        email: customer.email || customer.phone || '',
      });

      // Store session in database
      const expiresAt = JWTUtils.getExpirationDate();
      await Session.create({
        customerId: customer._id,
        token,
        expiresAt,
      });

      console.log(`✅ Customer logged in: ${customer.email || customer.phone}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
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
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  }

  /**
   * Logout customer (invalidate session)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await Session.deleteOne({ token });
        console.log('✅ Customer logged out');
      }

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }

  /**
   * Get current customer info
   */
  static async me(req: any, res: Response): Promise<void> {
    try {
      const customer = req.customer;

      res.json({
        success: true,
        data: {
          id: customer._id,
          email: customer.email,
          phone: customer.phone,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
      });
    } catch (error: any) {
      console.error('Get me error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get customer info',
      });
    }
  }
}

