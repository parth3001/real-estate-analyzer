import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  CommandCenterData,
  FocusedDashboardData,
  MarketContext,
  UrgentAction,
  ReviewItem,
  PipelineDealSummary,
  ActivityItem,
  QuickWin,
  PortfolioSummary
} from '../types/commandCenter';

// Import services
import { DealModel } from '../models/Deal';
import Portfolio from '../models/Portfolio';

/**
 * Command Center Dashboard Controller
 * Aggregates cross-workflow data for immediate action insights
 */
export class CommandCenterController {

  /**
   * Get command center dashboard data
   * Supports both detailed and focused views via view parameter
   */
  static async getCommandCenterData(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const view = req.query.view as string || 'detailed';
      logger.info('CommandCenter: Loading dashboard for user', userId, 'view:', view);

      // Execute all data gathering in parallel for performance
      const [
        portfolioSummary,
        urgentActions,
        reviewItems,
        activePipeline,
        recentActivity,
        quickWins
      ] = await Promise.all([
        CommandCenterController.getPortfolioSummary(userId),
        CommandCenterController.getUrgentActions(userId),
        CommandCenterController.getReviewItems(userId),
        CommandCenterController.getActivePipeline(userId),
        CommandCenterController.getRecentActivity(userId),
        CommandCenterController.getQuickWins(userId)
      ]);

      const commandCenterData: CommandCenterData = {
        success: true,
        portfolioSummary,
        urgentActions,
        reviewItems,
        activePipeline,
        recentActivity,
        quickWins,
        lastUpdated: new Date().toISOString()
      };

      // Transform to focused view if requested
      if (view === 'focused') {
        const focusedData = await CommandCenterController.transformToFocusedView(commandCenterData);
        logger.info('CommandCenter: Focused view data prepared');
        return res.status(200).json(focusedData);
      }

      logger.info('CommandCenter: Data aggregated successfully', {
        urgentCount: urgentActions.length,
        reviewCount: reviewItems.length,
        pipelineCount: activePipeline.length
      });

      // Return detailed view (existing behavior)
      res.status(200).json(commandCenterData);

    } catch (error: any) {
      logger.error('CommandCenter: Error loading dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load command center data',
        error: error.message
      });
    }
  }

  /**
   * Aggregate portfolio health across all user portfolios
   */
  private static async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    try {
      // Get all user portfolios
      const portfolios = await Portfolio.find({ userId });

      // Get all user deals for overall metrics
      const deals = await DealModel.find({ userId });

      let totalValue = 0;
      let monthlyNetCashFlow = 0;
      let totalProperties = 0;
      let urgentAlerts = 0;
      let reviewAlerts = 0;

      // Calculate basic portfolio metrics from deals
      // Note: Portfolio analytics will be calculated separately in portfolio service
      // For now, aggregate from deals associated with portfolios
      for (const deal of deals) {
        if (deal.analysis && deal.analysis.monthlyAnalysis) {
          totalValue += deal.purchasePrice || 0;
          monthlyNetCashFlow += deal.analysis.monthlyAnalysis.cashFlow || 0;
          totalProperties += 1;
        }
      }

      // Calculate alerts from deals
      for (const deal of deals) {
        if (deal.analysis) {
          if (deal.analysis.monthlyAnalysis?.cashFlow && deal.analysis.monthlyAnalysis.cashFlow < 0) urgentAlerts++;
          if (deal.investmentDecision && !deal.portfolioId) reviewAlerts++;
        }
      }

      // Calculate health score (0-100)
      let healthScore = 100;
      if (monthlyNetCashFlow < 0) healthScore -= 30;
      if (urgentAlerts > 0) healthScore -= (urgentAlerts * 10);
      if (totalProperties === 0) healthScore = 50; // New user baseline

      return {
        totalValue,
        monthlyNetCashFlow,
        totalProperties,
        portfolioCount: portfolios.length,
        healthScore: Math.max(0, Math.min(100, healthScore)),
        alerts: {
          urgent: urgentAlerts,
          review: reviewAlerts,
          info: 0
        }
      };

    } catch (error) {
      logger.error('CommandCenter: Error getting portfolio summary:', error);
      return {
        totalValue: 0,
        monthlyNetCashFlow: 0,
        totalProperties: 0,
        portfolioCount: 0,
        healthScore: 50,
        alerts: { urgent: 0, review: 0, info: 0 }
      };
    }
  }

  /**
   * Identify urgent actions requiring immediate attention
   */
  private static async getUrgentActions(userId: string): Promise<UrgentAction[]> {
    const urgentActions: UrgentAction[] = [];

    try {
      // Find deals with negative cash flow
      const negativeCashFlowDeals = await DealModel.find({
        userId,
        'analysis.monthlyAnalysis.cashFlow': { $lt: 0 }
      }).limit(3);

      for (const deal of negativeCashFlowDeals) {
        urgentActions.push({
          id: `negative-${deal._id}`,
          type: 'NEGATIVE_CASHFLOW',
          title: 'Negative Cash Flow Detected',
          description: `${deal.propertyAddress.street} is generating negative cash flow: $${Math.round(deal.analysis.monthlyAnalysis.cashFlow || 0)}/month`,
          severity: 'high',
          actionUrl: `/analysis/${deal._id}`,
          actionLabel: 'Review Property',
          metadata: {
            dealId: deal._id.toString(),
            estimatedValue: Math.abs(deal.analysis.monthlyAnalysis.cashFlow || 0)
          }
        });
      }

      // Find completed analyses awaiting decision
      const completedAnalyses = await DealModel.find({
        userId,
        'investmentDecision': { $exists: true },
        portfolioId: { $exists: false }
      }).limit(5);

      for (const deal of completedAnalyses) {
        const daysOld = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));

        urgentActions.push({
          id: `analysis-${deal._id}`,
          type: 'ANALYSIS_READY',
          title: 'Analysis Ready for Decision',
          description: `${deal.propertyAddress.street} - ${deal.investmentDecision?.verdict || 'Review needed'}`,
          severity: daysOld > 7 ? 'high' : 'medium',
          actionUrl: `/analysis/${deal._id}`,
          actionLabel: 'Make Decision',
          metadata: {
            dealId: deal._id.toString(),
            dealQuality: deal.investmentDecision?.professionalAssessment?.dealQuality,
            verdict: deal.investmentDecision?.verdict
          }
        });
      }

      return urgentActions.slice(0, 5); // Limit to top 5 urgent items

    } catch (error) {
      logger.error('CommandCenter: Error getting urgent actions:', error);
      return [];
    }
  }

  /**
   * Get items ready for review (less urgent than actions)
   */
  private static async getReviewItems(userId: string): Promise<ReviewItem[]> {
    const reviewItems: ReviewItem[] = [];

    try {
      // Recent analyses that could be added to portfolios
      const recentAnalyses = await DealModel.find({
        userId,
        'investmentDecision.verdict': { $in: ['BUY', 'NEGOTIATE'] }
      })
      .sort({ updatedAt: -1 })
      .limit(3);

      for (const deal of recentAnalyses) {
        reviewItems.push({
          id: `review-${deal._id}`,
          type: 'COMPLETED_ANALYSIS',
          title: `${deal.investmentDecision.verdict} Recommendation`,
          description: `${deal.propertyAddress.street} - Quality Score: ${deal.investmentDecision.professionalAssessment?.dealQuality || 0}/100`,
          completedAt: deal.updatedAt.toISOString(),
          actionUrl: `/analysis/${deal._id}`,
          actionLabel: 'Add to Portfolio',
          priority: deal.investmentDecision.verdict === 'BUY' ? 'high' : 'medium',
          metadata: {
            dealQuality: deal.investmentDecision.professionalAssessment?.dealQuality,
            verdict: deal.investmentDecision.verdict,
            dealId: deal._id.toString()
          }
        });
      }

      return reviewItems;

    } catch (error) {
      logger.error('CommandCenter: Error getting review items:', error);
      return [];
    }
  }

  /**
   * Get active pipeline deals with urgency detection
   */
  private static async getActivePipeline(userId: string): Promise<PipelineDealSummary[]> {
    try {
      // For now, return recent deals as pipeline summary
      // In production, this would integrate with actual pipeline system
      const activeDeals = await DealModel.find({
        userId
      })
      .sort({ updatedAt: -1 })
      .limit(4);

      return activeDeals.map(deal => {
        const daysOld = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));

        const hasAnalysis = !!deal.investmentDecision;
        return {
          id: deal._id.toString(),
          dealName: deal.propertyAddress.street,
          currentStage: hasAnalysis ? 'ANALYSIS' : 'LEAD',
          stageProgress: hasAnalysis ? 100 : 50,
          daysInStage: daysOld,
          nextAction: hasAnalysis ? 'Make Decision' : 'Complete Analysis',
          isUrgent: daysOld > 7,
          askingPrice: deal.purchasePrice,
          location: `${deal.propertyAddress.city}, ${deal.propertyAddress.state}`
        };
      });

    } catch (error) {
      logger.error('CommandCenter: Error getting active pipeline:', error);
      return [];
    }
  }

  /**
   * Get recent activity across all workflows
   */
  private static async getRecentActivity(userId: string): Promise<ActivityItem[]> {
    try {
      const recentDeals = await DealModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5);

      return recentDeals.map(deal => ({
        id: deal._id.toString(),
        type: deal.investmentDecision ? 'ANALYSIS_COMPLETED' : 'DEAL_ADDED',
        title: deal.investmentDecision ? 'Analysis Completed' : 'Property Added',
        description: `${deal.propertyAddress.street} in ${deal.propertyAddress.city}`,
        timestamp: deal.updatedAt.toISOString(),
        actionUrl: `/deals/${deal._id}`,
        icon: deal.investmentDecision ? 'analysis' : 'add'
      }));

    } catch (error) {
      logger.error('CommandCenter: Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Identify quick wins and opportunities
   */
  private static async getQuickWins(userId: string): Promise<QuickWin[]> {
    const quickWins: QuickWin[] = [];

    try {
      // Look for high-quality deals not yet in portfolios
      const goodDeals = await DealModel.find({
        userId,
        'investmentDecision.professionalAssessment.dealQuality': { $gte: 75 },
        portfolioId: { $exists: false }
      }).limit(2);

      for (const deal of goodDeals) {
        const dealQuality = deal.investmentDecision?.professionalAssessment?.dealQuality || 0;
        const monthlyFlow = deal.analysis?.monthlyAnalysis?.cashFlow || 0;
        quickWins.push({
          id: `win-${deal._id}`,
          type: 'PORTFOLIO_OPTIMIZATION',
          title: 'High-Quality Deal Ready',
          description: `${deal.propertyAddress.street} (${dealQuality}/100) ready to add to portfolio`,
          estimatedValue: monthlyFlow * 12, // Annual cash flow
          effort: 'low',
          actionUrl: `/analysis/${deal._id}`,
          actionLabel: 'Add to Portfolio'
        });
      }

      // Always suggest starting analysis for new users
      const dealCount = await DealModel.countDocuments({ userId });
      if (dealCount === 0) {
        quickWins.push({
          id: 'first-analysis',
          type: 'MARKET_TIMING',
          title: 'Start Your First Analysis',
          description: 'Begin building your real estate portfolio with our guided property wizard',
          estimatedValue: 0,
          effort: 'low',
          actionUrl: '/sfr-analysis',
          actionLabel: 'Analyze Property'
        });
      }

      return quickWins.slice(0, 3);

    } catch (error) {
      logger.error('CommandCenter: Error getting quick wins:', error);
      return [];
    }
  }

  /**
   * Transform detailed command center data to focused view
   * Prioritizes most urgent decision and next pipeline item
   */
  private static async transformToFocusedView(data: CommandCenterData): Promise<FocusedDashboardData> {
    try {
      // Get most urgent decision (highest priority urgent action or review item)
      const urgentDecision = data.urgentActions.find(action => action.type === 'ANALYSIS_READY') ||
                            data.reviewItems.find(item => item.type === 'COMPLETED_ANALYSIS') ||
                            data.urgentActions[0] ||
                            null;

      // Get next item in pipeline (first item that's not ready for decision)
      const nextInPipeline = data.activePipeline.find(deal => !deal.nextAction?.includes('Decision')) ||
                            data.activePipeline[0] ||
                            null;

      // Extract market context
      const marketContext = await CommandCenterController.extractMarketContext(urgentDecision, nextInPipeline);

      return {
        success: true,
        urgentDecision,
        nextInPipeline,
        marketContext,
        lastUpdated: data.lastUpdated
      };

    } catch (error) {
      logger.error('CommandCenter: Error transforming to focused view:', error);
      return {
        success: false,
        urgentDecision: null,
        nextInPipeline: null,
        marketContext: null,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Extract market context using real property data and RentCast API
   * Provides graceful fallbacks if market data unavailable
   */
  private static async extractMarketContext(urgentDecision: any, nextInPipeline: any): Promise<MarketContext | null> {
    try {
      // Use the property from urgent decision or next pipeline item
      const targetProperty = urgentDecision || nextInPipeline;
      if (!targetProperty) {
        logger.info('CommandCenter: No target property for market context');
        return null;
      }

      // Get the actual deal to extract property address
      let dealId: string | null = null;
      if (targetProperty.metadata?.dealId) {
        dealId = targetProperty.metadata.dealId;
      } else if (targetProperty.id) {
        dealId = targetProperty.id;
      }

      if (!dealId) {
        logger.info('CommandCenter: No deal ID found for market context');
        return null;
      }

      // Fetch the actual deal to get property address
      const deal = await DealModel.findById(dealId);
      if (!deal || !deal.propertyAddress) {
        logger.info('CommandCenter: No property address found for market context');
        return null;
      }

      const { city, state, zipCode } = deal.propertyAddress;

      // Try to get real market data using RentCast service
      try {
        // Import RentCast service for market data
        const rentcastService = require('../services/rentcastService');

        // Get market data by ZIP code (more accurate than city)
        const marketData = await rentcastService.getMarketData(zipCode);

        if (marketData && marketData.rentData) {
          const marketContext: MarketContext = {
            location: `${city}, ${state}`,
            avgRent: Math.round(marketData.rentData.averageRent || 1800),
            trendPercentage: marketData.trendData?.monthlyChange || 2.1
          };

          logger.info('CommandCenter: Real market context extracted', marketContext);
          return marketContext;
        }
      } catch (apiError) {
        logger.warn('CommandCenter: RentCast API unavailable, using fallback data', apiError);
      }

      // Fallback with location-specific estimates if API fails
      const fallbackRent = this.getFallbackRentByLocation(city, state);
      const marketContext: MarketContext = {
        location: `${city}, ${state}`,
        avgRent: fallbackRent,
        trendPercentage: 2.1 // Default positive trend
      };

      logger.info('CommandCenter: Fallback market context extracted', marketContext);
      return marketContext;

    } catch (error) {
      logger.error('CommandCenter: Error getting market context:', error);
      // Ultimate graceful fallback
      return {
        location: "Market Area",
        avgRent: 1850,
        trendPercentage: 2.1
      };
    }
  }

  /**
   * Get fallback rent estimates by location
   */
  private static getFallbackRentByLocation(city: string, state: string): number {
    const cityLower = city.toLowerCase();
    const stateLower = state.toLowerCase();

    // Texas markets
    if (stateLower === 'tx' || stateLower === 'texas') {
      if (cityLower.includes('dallas') || cityLower.includes('plano') || cityLower.includes('frisco')) {
        return 2200;
      } else if (cityLower.includes('anna') || cityLower.includes('mckinney')) {
        return 1850;
      } else if (cityLower.includes('austin')) {
        return 2500;
      } else if (cityLower.includes('houston')) {
        return 2100;
      } else if (cityLower.includes('san antonio')) {
        return 1700;
      } else {
        return 1800; // General Texas default
      }
    }

    // Other states - basic estimates
    if (stateLower === 'ca' || stateLower === 'california') return 3200;
    if (stateLower === 'ny' || stateLower === 'new york') return 2800;
    if (stateLower === 'fl' || stateLower === 'florida') return 2000;

    // National average fallback
    return 1900;
  }
}