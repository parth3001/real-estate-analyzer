import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth';
import {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  getDualMode,
  updateDualMode,
  completeDualModeOnboarding,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  validateRegister,
  validateLogin,
  validatePasswordChange,
  validateDualModeUpdate,
  validateEmailVerification,
  validateResendVerification,
  validateForgotPassword,
  validatePasswordReset
} from '../controllers/authController';

const router = Router();

// Stricter rate limiting for email-related endpoints (password reset, verification)
const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 email requests per window per IP (stricter than general auth)
  message: {
    error: 'Too many email requests. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (primarily client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/password', authenticateToken, validatePasswordChange, changePassword);

/**
 * @route   GET /api/auth/dual-mode
 * @desc    Get user's dual-mode preferences
 * @access  Private
 */
router.get('/dual-mode', authenticateToken, getDualMode);

/**
 * @route   PUT /api/auth/dual-mode
 * @desc    Update user's dual-mode preference
 * @access  Private
 */
router.put('/dual-mode', authenticateToken, validateDualModeUpdate, updateDualMode);

/**
 * @route   POST /api/auth/dual-mode/onboarding
 * @desc    Complete dual-mode onboarding
 * @access  Private
 */
router.post('/dual-mode/onboarding', authenticateToken, completeDualModeOnboarding);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
router.post('/verify-email', validateEmailVerification, verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification', emailRateLimit, validateResendVerification, resendVerification);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', emailRateLimit, validateForgotPassword, forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validatePasswordReset, resetPassword);

export default router;