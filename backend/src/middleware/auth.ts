import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    /**
     * Set by chatIdentityMiddleware when the request was resolved via the
     * ghost-user pattern (no Bearer token, sessionId-keyed User record).
     * Downstream code can check this flag to gate logged-in-only features
     * (saved deals, portfolio writes, etc.).
     */
    anonymous?: boolean;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('[Auth] No token provided in request');
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('[Auth] JWT_SECRET not configured');
      res.status(500).json({ error: 'Authentication service not configured' });
      return;
    }

    // Verify the token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Validate that user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      logger.warn(`[Auth] User not found for token: ${decoded.id}`);
      res.status(401).json({ error: 'Invalid token - user not found' });
      return;
    }

    // Attach user information to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    logger.info(`[Auth] Authenticated user: ${decoded.email} (${decoded.role})`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('[Auth] Invalid JWT token:', error.message);
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('[Auth] JWT token expired:', error.message);
      res.status(401).json({ error: 'Token expired' });
    } else {
      logger.error('[Auth] Token verification error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

/**
 * Optional authentication middleware - does not fail if no token provided
 * Used for endpoints that can work with or without authentication
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided - continue without authentication
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('[Auth] JWT_SECRET not configured');
      next(); // Continue without auth rather than failing
      return;
    }

    // Try to verify the token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.id);
    
    if (user) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      logger.info(`[Auth] Optional auth - authenticated user: ${decoded.email}`);
    }
    
    next();
  } catch (error) {
    // Ignore token errors in optional auth
    logger.info('[Auth] Optional auth - ignoring token error:', error instanceof Error ? error.message : error);
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('[Auth] Role check failed - no authenticated user');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`[Auth] Role check failed - user ${req.user.email} has role ${req.user.role}, requires: ${allowedRoles.join(', ')}`);
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    logger.info(`[Auth] Role check passed - user ${req.user.email} has required role: ${req.user.role}`);
    next();
  };
};

/**
 * Admin-only authorization middleware
 */
export const requireAdmin = requireRole('admin');

// Export main auth middleware with consistent naming
export const authMiddleware = authenticateToken;