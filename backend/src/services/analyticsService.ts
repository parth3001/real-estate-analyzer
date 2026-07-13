import { AnalyticsEvent, AnalyticsEventType, EventMetadata } from '../models/Analytics';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import {
  type CanonicalStrategy,
  toLegacyDealStrategy,
  normalizeStrategy,
} from '../domain/strategy';

/**
 * Analytics Service
 *
 * Lightweight event tracking for platform usage analytics.
 * All tracking is async and non-blocking to avoid impacting user request performance.
 *
 * Key Design Principles:
 * - Failures don't break user flows (silent fallback)
 * - Async non-blocking writes
 * - Minimal metadata (privacy-focused)
 * - No PII beyond existing User model
 *
 * Issue #243 (2026-07-12, iteration-2): analytics WIRE values are
 * kebab-shaped for historical continuity with existing analytics_events
 * documents (P4 append-only substrate discipline; pre-flight gotcha #7).
 * In-code representation is CanonicalStrategy (snake). Cross the boundary
 * via `toLegacyDealStrategy` on WRITE, `normalizeStrategy` on READ. The
 * model's Mongoose enum stays kebab (LEGACY_WIRE tier, whitelisted in
 * `.eslintrc.js`); this service is the one call site that projects.
 */

/**
 * Accepts either CanonicalStrategy (new callers) or the persisted kebab
 * wire (legacy callers that read raw from Deal.investmentStrategy). Both
 * shapes are normalized before persistence so the collection stays clean.
 */
type AnalyticsStrategyInput = CanonicalStrategy | string | undefined;

function projectStrategyForWire(
  raw: AnalyticsStrategyInput
): 'brrrr' | 'buy-hold' | 'house-hack' | undefined {
  if (raw === undefined) return undefined;
  const canonical = normalizeStrategy(raw);
  if (canonical === null) return undefined;
  return toLegacyDealStrategy(canonical);
}

class AnalyticsService {
  /**
   * Track calculator completion (anonymous or logged-in)
   * Triggered when user completes property analysis
   */
  async trackCalculatorCompleted(metadata: {
    strategy: AnalyticsStrategyInput;
    dealScore?: number;
    userId?: string;
  }): Promise<void> {
    try {
      const wireStrategy = projectStrategyForWire(metadata.strategy);
      await this.trackEvent('calculator_completed', {
        strategy: wireStrategy,
        dealScore: metadata.dealScore,
        isAnonymous: !metadata.userId
      }, metadata.userId);

      logger.info('[ANALYTICS] Calculator completed', {
        strategy: wireStrategy,
        dealScore: metadata.dealScore,
        isAnonymous: !metadata.userId
      });
    } catch (error) {
      // Silent fail - don't break user flow
      logger.error('[ANALYTICS] Failed to track calculator completion:', error);
    }
  }

  /**
   * Track wizard completion (logged-in users only)
   * Triggered when user completes 4-step property wizard
   */
  async trackWizardCompleted(metadata: {
    strategy?: AnalyticsStrategyInput;
    dealScore?: number;
    userId?: string;
    userRole?: string;
  }): Promise<void> {
    try {
      // Skip tracking for admin users
      if (metadata.userRole === 'admin') {
        logger.info('[ANALYTICS] ⏭️  Skipping admin wizard completion tracking');
        return;
      }

      const wireStrategy = projectStrategyForWire(metadata.strategy);
      await this.trackEvent('wizard_completed', {
        strategy: wireStrategy,
        dealScore: metadata.dealScore,
        isAnonymous: !metadata.userId
      }, metadata.userId);

      logger.info('[ANALYTICS] Wizard completed', {
        strategy: wireStrategy,
        dealScore: metadata.dealScore,
        userId: metadata.userId,
        isAnonymous: !metadata.userId
      });
    } catch (error) {
      // Silent fail - don't break user flow
      logger.error('[ANALYTICS] Failed to track wizard completion:', error);
    }
  }

  /**
   * Track user registration
   * Triggered when new user successfully creates account
   */
  async trackUserRegistered(userId: string, metadata?: {
    source?: string;
    affiliateCode?: string;
  }, userRole?: string): Promise<void> {
    try {
      // Skip tracking for admin users
      if (userRole === 'admin') {
        logger.info('[ANALYTICS] ⏭️  Skipping admin registration tracking');
        return;
      }

      await this.trackEvent('user_registered', {
        source: metadata?.source || 'direct',
        affiliateCode: metadata?.affiliateCode
      }, userId);

      logger.info('[ANALYTICS] User registered', {
        userId,
        source: metadata?.source,
        affiliateCode: metadata?.affiliateCode
      });
    } catch (error) {
      logger.error('[ANALYTICS] Failed to track user registration:', error);
    }
  }

  /**
   * Track user login
   * Triggered when user successfully authenticates
   */
  async trackUserLogin(userId: string, userRole?: string): Promise<void> {
    try {
      // Skip tracking for admin users
      if (userRole === 'admin') {
        logger.info('[ANALYTICS] ⏭️  Skipping admin login tracking');
        return;
      }

      await this.trackEvent('user_login', {}, userId);

      logger.info('[ANALYTICS] User login', { userId });
    } catch (error) {
      logger.error('[ANALYTICS] Failed to track user login:', error);
    }
  }

  /**
   * Track deal analysis
   * Triggered when logged-in user analyzes a property
   */
  async trackDealAnalyzed(userId: string, metadata: {
    dealId?: string;
    strategy?: AnalyticsStrategyInput;
    dealScore?: number;
    userRole?: string;
  }): Promise<void> {
    try {
      // Skip tracking for admin users
      if (metadata.userRole === 'admin') {
        logger.info('[ANALYTICS] ⏭️  Skipping admin deal analysis tracking');
        return;
      }

      const wireStrategy = projectStrategyForWire(metadata.strategy);
      await this.trackEvent('deal_analyzed', {
        dealId: metadata.dealId,
        strategy: wireStrategy,
        dealScore: metadata.dealScore
      }, userId);

      logger.info('[ANALYTICS] Deal analyzed', {
        userId,
        dealId: metadata.dealId,
        strategy: wireStrategy
      });
    } catch (error) {
      logger.error('[ANALYTICS] Failed to track deal analysis:', error);
    }
  }

  /**
   * Track deal saved to database
   * Triggered when user saves analysis for later
   */
  async trackDealSaved(userId: string, metadata: {
    dealId: string;
    strategy?: AnalyticsStrategyInput;
    userRole?: string;
  }): Promise<void> {
    try {
      // Skip tracking for admin users
      if (metadata.userRole === 'admin') {
        logger.info('[ANALYTICS] ⏭️  Skipping admin deal save tracking');
        return;
      }

      const wireStrategy = projectStrategyForWire(metadata.strategy);
      await this.trackEvent('deal_saved', {
        dealId: metadata.dealId,
        strategy: wireStrategy
      }, userId);

      logger.info('[ANALYTICS] Deal saved', {
        userId,
        dealId: metadata.dealId
      });
    } catch (error) {
      logger.error('[ANALYTICS] Failed to track deal save:', error);
    }
  }

  /**
   * Generic event tracking method
   * Private helper used by specific tracking methods
   */
  private async trackEvent(
    eventType: AnalyticsEventType,
    metadata: EventMetadata,
    userId?: string
  ): Promise<void> {
    try {
      const event = new AnalyticsEvent({
        eventType,
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        metadata
      });

      // Blocking save - wait for MongoDB to complete
      await event.save();

      logger.info(`[ANALYTICS] ✅ Event saved: ${eventType}`, {
        environment: process.env.NODE_ENV,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error(`[ANALYTICS] ❌ Save failed: ${eventType}`, {
        eventType,
        environment: process.env.NODE_ENV,
        userId: userId || 'anonymous',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Get analytics summary for admin dashboard
   * Returns counts for key metrics over specified time period
   */
  async getAnalyticsSummary(
    startDate: Date,
    endDate: Date,
    environment?: 'development' | 'production'
  ): Promise<{
    calculatorSubmissions: number;
    wizardSubmissions: number;
    userRegistrations: number;
    userLogins: number;
    dealsAnalyzed: number;
    dealsSaved: number;
    environment: string;
    period: { start: Date; end: Date };
  }> {

    try {
      const eventTypes: AnalyticsEventType[] = [
        'calculator_completed',
        'wizard_completed',
        'user_registered',
        'user_login',
        'deal_analyzed',
        'deal_saved'
      ];

      const counts = await AnalyticsEvent.getEventCounts(eventTypes, startDate, endDate, environment);

      return {
        calculatorSubmissions: counts['calculator_completed'] || 0,
        wizardSubmissions: counts['wizard_completed'] || 0,
        userRegistrations: counts['user_registered'] || 0,
        userLogins: counts['user_login'] || 0,
        dealsAnalyzed: counts['deal_analyzed'] || 0,
        dealsSaved: counts['deal_saved'] || 0,
        environment: environment || 'all',
        period: { start: startDate, end: endDate }
      };
    } catch (error) {
      logger.error('[ANALYTICS] Failed to get analytics summary:', error);
      throw new Error('Failed to fetch analytics summary');
    }
  }

  /**
   * Get user engagement metrics
   * Returns most active users and their activity counts
   */
  async getUserEngagement(days: number = 30): Promise<Array<{
    userId: string;
    eventCount: number;
    lastActivity: Date;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const engagement = await AnalyticsEvent.getUserEngagement(startDate);
      return engagement.map(item => ({
        userId: item._id.toString(),
        eventCount: item.eventCount,
        lastActivity: item.lastActivity
      }));
    } catch (error) {
      logger.error('[ANALYTICS] Failed to get user engagement:', error);
      throw new Error('Failed to fetch user engagement metrics');
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
