import { Router } from 'express';
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
  validateRegister,
  validateLogin,
  validatePasswordChange,
  validateDualModeUpdate
} from '../controllers/authController';

const router = Router();

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

export default router;