import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authService, RegisterData, LoginData } from '../services/authService';
import { emailService } from '../services/emailService';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * Validation rules for user registration
 */
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

/**
 * Validation rules for password change
 */
export const validatePasswordChange = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

/**
 * Helper function to handle validation errors
 */
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('[AuthController] Validation errors:', errors.array());
    res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
    return true;
  }
  return false;
};

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    if (handleValidationErrors(req, res)) return;

    const userData: RegisterData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName
    };

    logger.info(`[AuthController] Registration request for: ${userData.email}`);

    const result = await authService.register(userData);

    // Send verification email asynchronously (don't block response)
    if (!result.user.isVerified) {
      const verificationToken = authService.generateEmailVerificationToken(result.user.id);
      emailService.sendVerificationEmail(result.user.email, verificationToken)
        .catch(error => {
          logger.error(`[AuthController] Failed to send verification email to ${result.user.email}:`, error);
        });
    }

    logger.info(`[AuthController] Registration successful for: ${result.user.email}`);
    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    logger.error('[AuthController] Registration error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
    }
    
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    if (handleValidationErrors(req, res)) return;

    const credentials: LoginData = {
      email: req.body.email,
      password: req.body.password
    };

    logger.info(`[AuthController] Login request for: ${credentials.email}`);

    const result = await authService.login(credentials);

    logger.info(`[AuthController] Login successful for: ${result.user.email}`);
    res.json({
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    logger.error('[AuthController] Login error:', error);
    
    if (error instanceof Error && error.message.includes('Invalid email or password')) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    logger.info('[AuthController] Token refresh request');

    const result = await authService.refreshToken(token);

    logger.info('[AuthController] Token refresh successful');
    res.json({
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    logger.error('[AuthController] Token refresh error:', error);
    
    if (error instanceof Error && (
      error.message.includes('invalid') || 
      error.message.includes('expired') ||
      error.message.includes('not found')
    )) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }
    
    res.status(500).json({ error: 'Token refresh failed. Please try again.' });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    logger.info(`[AuthController] Profile request for user: ${userId}`);

    const user = await authService.getUserProfile(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('[AuthController] Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof typeof updates] === undefined) {
        delete updates[key as keyof typeof updates];
      }
    });

    logger.info(`[AuthController] Profile update request for user: ${userId}`);

    const user = await authService.updateProfile(userId, updates);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    logger.info(`[AuthController] Profile updated for user: ${user.email}`);
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    logger.error('[AuthController] Update profile error:', error);
    
    if (error instanceof Error && error.message.includes('already in use')) {
      res.status(409).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    if (handleValidationErrors(req, res)) return;

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    logger.info(`[AuthController] Password change request for user: ${userId}`);

    await authService.changePassword(userId, currentPassword, newPassword);

    logger.info(`[AuthController] Password changed successfully for user: ${userId}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('[AuthController] Change password error:', error);
    
    if (error instanceof Error && error.message.includes('incorrect')) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }
    
    res.status(500).json({ error: 'Failed to change password' });
  }
};

/**
 * Logout user (client-side token removal)
 */
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    logger.info(`[AuthController] Logout request for user: ${userId}`);

    // Note: In a stateless JWT system, logout is primarily handled client-side
    // by removing the tokens. Server-side logout would require token blacklisting
    // which is not implemented in this basic version.

    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('[AuthController] Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Validation rules for dual-mode preferences
 */
export const validateDualModeUpdate = [
  body('mode')
    .isIn(['novice', 'pro'])
    .withMessage('Mode must be either "novice" or "pro"'),
  
  body('targetPersona')
    .optional()
    .isIn(['learning', 'experienced', 'data_analyst', 'speed_scanner'])
    .withMessage('Target persona must be a valid persona type')
];

/**
 * Get current user's dual-mode preference
 */
export const getDualMode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    logger.info(`[AuthController] Dual-mode get request for user: ${userId}`);

    const user = await authService.getUserProfile(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return dual-mode preferences or defaults
    const dualModePrefs = user.dualModePreferences || {
      currentMode: 'novice',
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

    res.json({ 
      dualModePreferences: dualModePrefs,
      currentMode: dualModePrefs.currentMode,
      personaMapping: dualModePrefs.personaMapping
    });
  } catch (error) {
    logger.error('[AuthController] Get dual-mode error:', error);
    res.status(500).json({ error: 'Failed to get dual-mode preferences' });
  }
};

/**
 * Update user's dual-mode preference
 */
export const updateDualMode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    if (handleValidationErrors(req, res)) return;

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { mode, targetPersona } = req.body;

    logger.info(`[AuthController] Dual-mode update request for user: ${userId}, mode: ${mode}`);

    const user = await authService.updateDualModePreferences(userId, {
      currentMode: mode,
      targetPersona
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    logger.info(`[AuthController] Dual-mode updated for user: ${user.email}, new mode: ${mode}`);
    res.json({
      message: 'Dual-mode preference updated successfully',
      currentMode: user.dualModePreferences?.currentMode || mode,
      personaMapping: user.dualModePreferences?.personaMapping
    });
  } catch (error) {
    logger.error('[AuthController] Update dual-mode error:', error);
    res.status(500).json({ error: 'Failed to update dual-mode preference' });
  }
};

/**
 * Complete dual-mode onboarding
 */
export const completeDualModeOnboarding = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { preferredMode, personaMapping } = req.body;

    logger.info(`[AuthController] Dual-mode onboarding completion for user: ${userId}`);

    const user = await authService.completeDualModeOnboarding(userId, {
      preferredMode: preferredMode || 'novice',
      personaMapping: personaMapping || {
        novice: 'learning',
        pro: 'experienced'
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    logger.info(`[AuthController] Dual-mode onboarding completed for user: ${user.email}`);
    res.json({
      message: 'Dual-mode onboarding completed successfully',
      dualModePreferences: user.dualModePreferences
    });
  } catch (error) {
    logger.error('[AuthController] Complete dual-mode onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete dual-mode onboarding' });
  }
};

/**
 * Validation rules for email verification
 */
export const validateEmailVerification = [
  body('token')
    .isLength({ min: 1 })
    .withMessage('Verification token is required')
];

/**
 * Validation rules for resend verification
 */
export const validateResendVerification = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

/**
 * Validation rules for forgot password
 */
export const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

/**
 * Validation rules for password reset
 */
export const validatePasswordReset = [
  body('token')
    .isLength({ min: 1 })
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

/**
 * Verify email with token
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    if (handleValidationErrors(req, res)) return;

    const { token } = req.body;

    logger.info('[AuthController] Email verification request');

    // Verify token and get user ID
    const { id } = authService.verifyEmailToken(token);

    // Mark user as verified
    const user = await authService.verifyUserEmail(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Send welcome email
    emailService.sendWelcomeEmail(user.email, user.firstName)
      .catch(error => {
        logger.error(`[AuthController] Failed to send welcome email to ${user.email}:`, error);
      });

    // Send admin notification about new signup
    emailService.sendAdminSignupNotification(user.email, user.firstName, user.lastName)
      .catch(error => {
        logger.error(`[AuthController] Failed to send admin signup notification for ${user.email}:`, error);
      });

    logger.info(`[AuthController] Email verified for user: ${user.email}`);
    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    logger.error('[AuthController] Email verification error:', error);

    if (error instanceof Error && error.message.includes('Invalid or expired')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Email verification failed. Please try again.' });
  }
};

/**
 * Resend verification email
 */
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    logger.info(`[AuthController] Resend verification request for: ${email}`);

    // Find user (but don't reveal if they exist or not)
    const user = await authService.findUserByEmail(email);

    if (user && !user.isVerified) {
      const verificationToken = authService.generateEmailVerificationToken(user.id);
      await emailService.sendVerificationEmail(user.email, verificationToken);
    }

    // Always return success (don't leak user existence)
    res.json({
      message: 'If an unverified account exists with this email, a new verification link has been sent.'
    });
  } catch (error) {
    logger.error('[AuthController] Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email. Please try again.' });
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    if (handleValidationErrors(req, res)) return;

    const { email } = req.body;

    logger.info(`[AuthController] Password reset request for: ${email}`);

    // Find user (but don't reveal if they exist or not)
    const user = await authService.findUserByEmail(email);

    if (user) {
      const resetToken = authService.generatePasswordResetToken(user.id);
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    }

    // Always return success (don't leak user existence)
    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    logger.error('[AuthController] Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request. Please try again.' });
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    if (handleValidationErrors(req, res)) return;

    const { token, password } = req.body;

    logger.info('[AuthController] Password reset attempt');

    // Verify token and get user ID
    const { id } = authService.verifyPasswordResetToken(token);

    // Reset password
    await authService.resetUserPassword(id, password);

    logger.info(`[AuthController] Password reset successfully for user: ${id}`);
    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    logger.error('[AuthController] Password reset error:', error);

    if (error instanceof Error && error.message.includes('Invalid or expired')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
};