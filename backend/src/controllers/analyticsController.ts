import { Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth';

/**
 * Analytics Controller
 *
 * Admin-only endpoints for platform analytics and usage metrics
 * All endpoints require authentication and admin role
 */

class AnalyticsController {
  /**
   * Get analytics summary for specified time period
   * GET /api/analytics/summary?days=7&environment=production
   *
   * Query Params:
   * - days: 7 | 30 | 90 (default: 7)
   * - environment: 'development' | 'production' (optional, default: all)
   */
  async getAnalyticsSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const environment = req.query.environment as 'development' | 'production' | undefined;

      // Validate days parameter
      if (![7, 30, 90].includes(days)) {
        return res.status(400).json({
          error: 'Invalid days parameter. Must be 7, 30, or 90.'
        });
      }

      // Validate environment parameter
      if (environment && !['development', 'production'].includes(environment)) {
        return res.status(400).json({
          error: 'Invalid environment parameter. Must be "development" or "production".'
        });
      }

      const summary = await analyticsService.getAnalyticsSummary(days, environment);

      logger.info(`[ANALYTICS] Summary requested by ${req.user?.email}`, {
        adminId: req.user?.id,
        days,
        environment: environment || 'all'
      });

      res.json({
        message: 'Analytics summary retrieved successfully',
        data: summary,
        period: `Last ${days} days`
      });

    } catch (error: any) {
      logger.error('[ANALYTICS] Error fetching analytics summary:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics summary',
        details: error.message
      });
    }
  }

  /**
   * Get user engagement metrics
   * GET /api/analytics/engagement?days=30
   *
   * Returns most active users and their activity counts
   */
  async getUserEngagement(req: AuthenticatedRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;

      // Validate days parameter
      if (![7, 30, 90].includes(days)) {
        return res.status(400).json({
          error: 'Invalid days parameter. Must be 7, 30, or 90.'
        });
      }

      const engagement = await analyticsService.getUserEngagement(days);

      logger.info(`[ANALYTICS] User engagement requested by ${req.user?.email}`, {
        adminId: req.user?.id,
        days
      });

      res.json({
        message: 'User engagement metrics retrieved successfully',
        data: engagement,
        period: `Last ${days} days`
      });

    } catch (error: any) {
      logger.error('[ANALYTICS] Error fetching user engagement:', error);
      res.status(500).json({
        error: 'Failed to fetch user engagement metrics',
        details: error.message
      });
    }
  }

  /**
   * Get raw analytics events (for debugging/export)
   * GET /api/analytics/events?type=calculator_completed&days=7
   *
   * Query Params:
   * - type: Event type to filter (optional)
   * - days: Time period (default: 7)
   * - limit: Max results (default: 100, max: 1000)
   */
  async getRawEvents(req: AuthenticatedRequest, res: Response) {
    try {
      const { type, days = '7', limit = '100' } = req.query;
      const daysNum = parseInt(days as string);
      const limitNum = Math.min(parseInt(limit as string), 1000); // Cap at 1000

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      const query: any = {
        timestamp: { $gte: startDate }
      };

      if (type) {
        query.eventType = type;
      }

      const { AnalyticsEvent } = await import('../models/Analytics');
      const events = await AnalyticsEvent.find(query)
        .sort({ timestamp: -1 })
        .limit(limitNum)
        .lean();

      logger.info(`[ANALYTICS] Raw events requested by ${req.user?.email}`, {
        adminId: req.user?.id,
        eventType: type,
        days: daysNum,
        limit: limitNum
      });

      res.json({
        message: 'Raw analytics events retrieved successfully',
        data: events,
        count: events.length,
        filters: {
          type: type || 'all',
          days: daysNum,
          limit: limitNum
        }
      });

    } catch (error: any) {
      logger.error('[ANALYTICS] Error fetching raw events:', error);
      res.status(500).json({
        error: 'Failed to fetch raw analytics events',
        details: error.message
      });
    }
  }
}

// Export controller instance
export const analyticsController = new AnalyticsController();
