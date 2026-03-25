import express from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

/**
 * Analytics Routes
 *
 * All routes require authentication and admin role
 * Used by /admin/analytics frontend dashboard
 */

// Apply authentication and admin role requirement to all analytics routes
router.use(authMiddleware);
router.use(requireRole('admin'));

/**
 * GET /api/analytics/summary
 * Get platform usage summary (calculator, registrations, logins, deals)
 * Query params: ?days=7|30|90
 */
router.get('/summary', analyticsController.getAnalyticsSummary.bind(analyticsController));

/**
 * GET /api/analytics/engagement
 * Get user engagement metrics (most active users)
 * Query params: ?days=7|30|90
 */
router.get('/engagement', analyticsController.getUserEngagement.bind(analyticsController));

/**
 * GET /api/analytics/events
 * Get raw analytics events (for debugging/export)
 * Query params: ?type=calculator_completed&days=7&limit=100
 */
router.get('/events', analyticsController.getRawEvents.bind(analyticsController));

export default router;
