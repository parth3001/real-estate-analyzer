import { Request } from 'express';

/**
 * Extended Request interface with authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * User registration data
 */
export interface UserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * User login credentials
 */
export interface UserLoginCredentials {
  email: string;
  password: string;
}

/**
 * JWT token payload
 */
export interface JwtTokenPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication response with tokens and user data
 */
export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isVerified: boolean;
  };
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * User profile update data
 */
export interface UserProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Password change data
 */
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

/**
 * User roles enum
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

/**
 * Subscription tiers (for future implementation)
 */
export enum SubscriptionTier {
  FREE = 'free',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  INSTITUTIONAL = 'institutional'
}

/**
 * User status enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_NOT_FOUND = 'user_not_found',
  USER_ALREADY_EXISTS = 'user_already_exists',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'token_invalid',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  ACCOUNT_SUSPENDED = 'account_suspended',
  EMAIL_NOT_VERIFIED = 'email_not_verified'
}

/**
 * API response wrapper for authentication endpoints
 */
export interface AuthApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    type: AuthErrorType;
    message: string;
    details?: any;
  };
}