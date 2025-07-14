// Authentication types for frontend

/**
 * User information
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt?: string;
  lastLogin?: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Authentication response from API
 */
export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Profile update data
 */
export interface ProfileUpdateData {
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
 * Authentication context type
 */
export interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  changePassword: (data: PasswordChangeData) => Promise<void>;
  clearError: () => void;
  
  // Utility
  getToken: () => string | null;
  refreshToken: () => Promise<void>;
}

/**
 * Auth error types
 */
export interface AuthError {
  message: string;
  details?: Array<{
    msg: string;
    path: string;
    value: any;
  }>;
}

/**
 * Token storage keys
 */
export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data'
} as const;

/**
 * Auth form validation errors
 */
export interface AuthFormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  currentPassword?: string;
  newPassword?: string;
  general?: string;
}