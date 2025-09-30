import jwt from 'jsonwebtoken';
import { User, IUser, UserMode, PersonaType } from '../models/User';
import { logger } from '../utils/logger';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
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

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthTokens> {
    try {
      logger.info(`[AuthService] Registering new user: ${userData.email}`);

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new user (password will be hashed by pre-save hook)
      const user = new User({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
        isVerified: false
      });

      const savedUser = await user.save();
      logger.info(`[AuthService] User registered successfully: ${savedUser.id}`);

      // Generate tokens
      const tokens = this.generateTokens(savedUser);
      
      return {
        ...tokens,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          isVerified: savedUser.isVerified
        }
      };
    } catch (error) {
      logger.error('[AuthService] Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginData): Promise<AuthTokens> {
    try {
      logger.info(`[AuthService] Login attempt for: ${credentials.email}`);

      // Find user by email (including password for comparison)
      const user = await User.findOne({ email: credentials.email }).select('+password');
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        logger.warn(`[AuthService] Invalid password attempt for: ${credentials.email}`);
        throw new Error('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`[AuthService] Successful login for: ${user.email}`);

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified
        }
      };
    } catch (error) {
      logger.error('[AuthService] Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<Pick<AuthTokens, 'accessToken' | 'refreshToken'>> {
    try {
      logger.info('[AuthService] Refreshing access token');

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, jwtSecret) as TokenPayload;

      // Get current user
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);
      
      logger.info(`[AuthService] Token refreshed for user: ${user.email}`);
      return tokens;
    } catch (error) {
      logger.error('[AuthService] Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<Omit<IUser, 'password'> | null> {
    try {
      logger.info(`[AuthService] Getting profile for user: ${userId}`);
      
      const user = await User.findById(userId).select('-password');
      if (!user) {
        logger.warn(`[AuthService] User not found: ${userId}`);
        return null;
      }

      return user;
    } catch (error) {
      logger.error('[AuthService] Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Pick<IUser, 'firstName' | 'lastName' | 'email'>>): Promise<Omit<IUser, 'password'> | null> {
    try {
      logger.info(`[AuthService] Updating profile for user: ${userId}`);

      // If email is being updated, check for conflicts
      if (updates.email) {
        const existingUser = await User.findOne({ 
          email: updates.email, 
          _id: { $ne: userId } 
        });
        if (existingUser) {
          throw new Error('Email already in use by another user');
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        logger.warn(`[AuthService] User not found for update: ${userId}`);
        return null;
      }

      logger.info(`[AuthService] Profile updated for user: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('[AuthService] Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      logger.info(`[AuthService] Password change request for user: ${userId}`);

      // Get user with password
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password (will be hashed by pre-save hook)
      user.password = newPassword;
      await user.save();

      logger.info(`[AuthService] Password changed successfully for user: ${user.email}`);
    } catch (error) {
      logger.error('[AuthService] Error changing password:', error);
      throw error;
    }
  }

  /**
   * Update user's dual-mode preferences
   */
  async updateDualModePreferences(
    userId: string, 
    updates: { currentMode: UserMode; targetPersona?: PersonaType }
  ): Promise<IUser | null> {
    try {
      logger.info(`[AuthService] Updating dual-mode preferences for user: ${userId}`);

      const user = await User.findById(userId);
      if (!user) {
        logger.warn(`[AuthService] User not found for dual-mode update: ${userId}`);
        return null;
      }

      // Initialize dual-mode preferences if they don't exist
      if (!user.dualModePreferences) {
        user.dualModePreferences = {
          currentMode: updates.currentMode,
          personaMapping: {
            novice: 'learning',
            pro: 'experienced'
          },
          onboardingCompleted: false,
          modeHistory: [],
          preferences: {
            showEducationalTooltips: true,
            defaultAnalysisComplexity: 'basic'
          }
        };
      }

      // Update current mode
      const previousMode = user.dualModePreferences.currentMode;
      user.dualModePreferences.currentMode = updates.currentMode;

      // Update persona mapping if provided
      if (updates.targetPersona) {
        user.dualModePreferences.personaMapping[updates.currentMode] = updates.targetPersona;
      }

      // Add to mode history
      user.dualModePreferences.modeHistory.push({
        mode: updates.currentMode,
        timestamp: new Date()
      });

      // Keep only last 20 mode changes
      if (user.dualModePreferences.modeHistory.length > 20) {
        user.dualModePreferences.modeHistory = user.dualModePreferences.modeHistory.slice(-20);
      }

      const savedUser = await user.save();

      logger.info(`[AuthService] Dual-mode updated for user: ${user.email}, ${previousMode} -> ${updates.currentMode}`);
      return savedUser;
    } catch (error) {
      logger.error('[AuthService] Error updating dual-mode preferences:', error);
      throw error;
    }
  }

  /**
   * Complete dual-mode onboarding for user
   */
  async completeDualModeOnboarding(
    userId: string,
    settings: {
      preferredMode: UserMode;
      personaMapping?: { novice: PersonaType; pro: PersonaType };
    }
  ): Promise<IUser | null> {
    try {
      logger.info(`[AuthService] Completing dual-mode onboarding for user: ${userId}`);

      const user = await User.findById(userId);
      if (!user) {
        logger.warn(`[AuthService] User not found for onboarding completion: ${userId}`);
        return null;
      }

      // Initialize or update dual-mode preferences
      const defaultPersonaMapping = settings.personaMapping || {
        novice: 'learning',
        pro: 'experienced'
      };

      user.dualModePreferences = {
        currentMode: settings.preferredMode,
        personaMapping: defaultPersonaMapping,
        onboardingCompleted: true,
        modeHistory: [{
          mode: settings.preferredMode,
          timestamp: new Date()
        }],
        preferences: {
          showEducationalTooltips: settings.preferredMode === 'novice',
          defaultAnalysisComplexity: settings.preferredMode === 'novice' ? 'basic' : 'detailed'
        }
      };

      const savedUser = await user.save();

      logger.info(`[AuthService] Dual-mode onboarding completed for user: ${user.email}, mode: ${settings.preferredMode}`);
      return savedUser;
    } catch (error) {
      logger.error('[AuthService] Error completing dual-mode onboarding:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens for user
   */
  private generateTokens(user: IUser): Pick<AuthTokens, 'accessToken' | 'refreshToken'> {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: this.accessTokenExpiry
    });

    const refreshToken = jwt.sign(payload, jwtSecret, {
      expiresIn: this.refreshTokenExpiry
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    return jwt.sign(
      {
        id: userId,
        type: 'email_verification'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    return jwt.sign(
      {
        id: userId,
        type: 'password_reset'
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
  }

  /**
   * Verify email verification token
   */
  verifyEmailToken(token: string): { id: string; type: string } {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required');
      }

      const decoded = jwt.verify(token, jwtSecret) as any;

      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }

      return {
        id: decoded.id,
        type: decoded.type
      };
    } catch (error) {
      logger.error('[AuthService] Email token verification failed:', error);
      throw new Error('Invalid or expired verification token');
    }
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string): { id: string; type: string } {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required');
      }

      const decoded = jwt.verify(token, jwtSecret) as any;

      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      return {
        id: decoded.id,
        type: decoded.type
      };
    } catch (error) {
      logger.error('[AuthService] Password reset token verification failed:', error);
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Mark user email as verified
   */
  async verifyUserEmail(userId: string): Promise<IUser | null> {
    try {
      logger.info(`[AuthService] Verifying email for user: ${userId}`);

      const user = await User.findByIdAndUpdate(
        userId,
        {
          isVerified: true,
          $unset: { verifiedAt: "" } // Remove field if it exists
        },
        { new: true }
      ).select('-password');

      if (!user) {
        logger.warn(`[AuthService] User not found for email verification: ${userId}`);
        return null;
      }

      logger.info(`[AuthService] Email verified for user: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('[AuthService] Error verifying user email:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      logger.info(`[AuthService] Resetting password for user: ${userId}`);

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.password = newPassword; // Will be hashed by pre-save hook
      await user.save();

      logger.info(`[AuthService] Password reset successfully for user: ${user.email}`);
    } catch (error) {
      logger.error('[AuthService] Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Find user by email (for password reset and verification)
   */
  async findUserByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email }).select('-password');
    } catch (error) {
      logger.error('[AuthService] Error finding user by email:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();