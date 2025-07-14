import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  User, 
  AuthContextType, 
  LoginCredentials, 
  RegisterData, 
  ProfileUpdateData, 
  PasswordChangeData,
  AuthFormErrors
} from '../types/auth';
import { authApi, tokenUtils } from '../services/api';

// Authentication state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Action types for reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true,
      };
    
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = tokenUtils.getAccessToken();
        const userData = tokenUtils.getUserData();
        
        if (token && userData) {
          // Validate token by fetching profile
          const response = await authApi.getProfile();
          
          if (response.status === 200 && response.data.user) {
            dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
          } else {
            // Invalid token, clear storage
            tokenUtils.removeTokens();
            dispatch({ type: 'SET_INITIALIZED' });
          }
        } else {
          dispatch({ type: 'SET_INITIALIZED' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens
        tokenUtils.removeTokens();
        dispatch({ type: 'SET_INITIALIZED' });
      }
    };

    initializeAuth();
  }, []);

  // Helper function to handle API errors
  const handleApiError = (error: any): string => {
    if (error.response?.data?.details) {
      // Validation errors
      const details = error.response.data.details;
      return details.map((detail: any) => detail.msg).join(', ');
    }
    return error.response?.data?.error || error.message || 'An error occurred';
  };

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authApi.login(credentials);
      
      if (response.status === 200 && response.data.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authApi.register(data);
      
      if (response.status === 201 && response.data.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Update profile function
  const updateProfile = async (data: ProfileUpdateData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authApi.updateProfile(data);
      
      if (response.status === 200 && response.data.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Change password function
  const changePassword = async (data: PasswordChangeData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authApi.changePassword(data);
      
      if (response.status === 200) {
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Get token function
  const getToken = (): string | null => {
    return tokenUtils.getAccessToken();
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authApi.refreshToken();
      
      if (response.status !== 200) {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Force logout on refresh failure
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    
    // Utility
    getToken,
    refreshToken,
  };

  // Don't render children until auth is initialized
  if (!state.isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Hook for form validation
export const useAuthValidation = () => {
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }
    return null;
  };

  const validateName = (name: string, fieldName: string): string | null => {
    if (!name || name.trim() === '') return `${fieldName} is required`;
    if (name.length > 50) return `${fieldName} must be less than 50 characters`;
    return null;
  };

  const validateLoginForm = (credentials: LoginCredentials): AuthFormErrors => {
    const errors: AuthFormErrors = {};
    
    const emailError = validateEmail(credentials.email);
    if (emailError) errors.email = emailError;
    
    if (!credentials.password) errors.password = 'Password is required';
    
    return errors;
  };

  const validateRegisterForm = (data: RegisterData): AuthFormErrors => {
    const errors: AuthFormErrors = {};
    
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validatePassword(data.password);
    if (passwordError) errors.password = passwordError;
    
    const firstNameError = validateName(data.firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validateName(data.lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;
    
    return errors;
  };

  return {
    validateEmail,
    validatePassword,
    validateName,
    validateLoginForm,
    validateRegisterForm,
  };
};

export default AuthContext;