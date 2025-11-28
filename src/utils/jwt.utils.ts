import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { TokenPayload } from '../types';

export class JWTUtils {
  /**
   * Generate a JWT token
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload as object, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode token without verification (useful for debugging)
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get expiration date from JWT expiry string
   */
  static getExpirationDate(expiresIn: string = config.jwtExpiresIn): Date {
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
      throw new Error('Invalid expiry format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const now = new Date();
    switch (unit) {
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
    }

    return now;
  }
}

