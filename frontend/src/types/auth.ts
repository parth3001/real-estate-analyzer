// Authentication types for frontend

/**
 * Dual-mode related types
 */
export type UserMode = 'novice' | 'pro';
export type PersonaType = 'learning' | 'experienced' | 'data_analyst' | 'speed_scanner';

export interface DualModePreferences {
  currentMode: UserMode;
  personaMapping: {
    novice: PersonaType;
    pro: PersonaType;
  };
  onboardingCompleted: boolean;
  modeHistory: Array<{
    mode: UserMode;
    timestamp: string;
  }>;
  preferences: {
    showEducationalTooltips: boolean;
    defaultAnalysisComplexity: 'basic' | 'detailed' | 'comprehensive';
    autoSwitchToProAfterAnalyses?: number;
  };
}

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
  dualModePreferences?: DualModePreferences;
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
  /**
   * Task #78 (2026-06-18): set when the user's stored termsVersion is
   * older than the latest material ToS version. Frontend forces a
   * re-consent modal before allowing access to /app.
   */
  requiresReconsent?: boolean;
  /** The version the user must affirmatively accept. */
  currentTosVersion?: string;
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
  // Task #78 (2026-06-18) — returns the reconsent flag so callers can
  // route into the modal before navigating.
  login: (
    credentials: LoginCredentials
  ) => Promise<{ requiresReconsent: boolean; currentTosVersion?: string }>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  changePassword: (data: PasswordChangeData) => Promise<void>;
  clearError: () => void;

  // Hydrates the context state immediately after magic-link verify
  // stores tokens in localStorage. Without this, ProtectedRoute reads
  // stale isAuthenticated=false and bounces the user back to /login
  // even though the JWT is already valid.
  setAuthenticatedUser: (user: User) => void;

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