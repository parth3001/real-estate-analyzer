import { Portfolio, IPortfolio, IPortfolioGoals } from '../../models/Portfolio';
import { PortfolioAnalytics, IPortfolioAnalytics } from '../../models/PortfolioAnalytics';
import { PortfolioRecommendation, IPortfolioRecommendation } from '../../models/PortfolioRecommendations';
import { DealModel } from '../../models/Deal';
import mongoose from 'mongoose';
import { portfolioAnalyticsService } from './portfolioAnalyticsService';
import { logger } from '../../utils/logger';
import { cacheService } from '../cacheService';

// Request/Response Interfaces
export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  goals: IPortfolioGoals;
  settings?: {
    includeInSFRAnalysis?: boolean;
    alertsEnabled?: boolean;
  };
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  goals?: Partial<IPortfolioGoals>;
  settings?: {
    includeInSFRAnalysis?: boolean;
    alertsEnabled?: boolean;
  };
}

export interface PortfolioSummary {
  id: string;
  name: string;
  description?: string;
  primaryGoal: string;
  riskTolerance: string;
  totalProperties: number;
  monthlyNetCashFlow: number;
  totalValue: number;
  status: string;
  createdAt: Date;
  lastAnalyticsUpdate?: Date;
}

export interface PortfolioDetails {
  portfolio: IPortfolio;
  analytics?: IPortfolioAnalytics;
  recommendations: IPortfolioRecommendation[];
  properties: any[]; // Will be Deal objects with analysis
  totalProperties: number;
}

export class PortfolioService {
  /**
   * Create a new portfolio for a user
   */
  async createPortfolio(userId: string, data: CreatePortfolioRequest): Promise<IPortfolio> {
    try {
      // Validate user ID
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Create portfolio with default settings
      const portfolioData = {
        userId: new mongoose.Types.ObjectId(userId),
        name: data.name.trim(),
        description: data.description?.trim(),
        goals: data.goals,
        settings: {
          includeInSFRAnalysis: data.settings?.includeInSFRAnalysis ?? true,
          alertsEnabled: data.settings?.alertsEnabled ?? true,
          currency: 'USD' as const
        },
        status: 'ACTIVE' as const
      };

      const portfolio = new Portfolio(portfolioData);
      const savedPortfolio = await portfolio.save();

      console.log(`Portfolio created: ${savedPortfolio._id} for user ${userId}`);
      return savedPortfolio;
    } catch (error: any) {
      console.error('Error creating portfolio:', error);
      throw new Error(`Failed to create portfolio: ${error.message}`);
    }
  }

  /**
   * Get all portfolios for a user (summary view)
   */
  async getUserPortfolios(userId: string): Promise<PortfolioSummary[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      const portfolios = await Portfolio.find({ userId: new mongoose.Types.ObjectId(userId), status: 'ACTIVE' }).sort({ createdAt: -1 });
      const portfolioSummaries: PortfolioSummary[] = [];

      for (const portfolio of portfolios) {
        // Get property count for this portfolio
        const propertyCount = await DealModel.countDocuments({ 
          portfolioId: portfolio._id 
        });

        // Get latest analytics if available
        const latestAnalytics = await PortfolioAnalytics.findOne({
          portfolioId: portfolio._id
        }).sort({ calculatedAt: -1 });

        const summary: PortfolioSummary = {
          id: portfolio._id.toString(),
          name: portfolio.name,
          description: portfolio.description,
          primaryGoal: portfolio.goals.primaryGoal,
          riskTolerance: portfolio.goals.riskTolerance,
          totalProperties: propertyCount,
          monthlyNetCashFlow: latestAnalytics?.summary?.monthlyNetCashFlow || 0,
          totalValue: latestAnalytics?.summary?.totalValue || 0,
          status: portfolio.status,
          createdAt: portfolio.createdAt,
          lastAnalyticsUpdate: latestAnalytics?.calculatedAt
        };

        portfolioSummaries.push(summary);
      }

      return portfolioSummaries;
    } catch (error: any) {
      console.error('Error getting user portfolios:', error);
      throw new Error(`Failed to get portfolios: ${error.message}`);
    }
  }

  /**
   * Get portfolio by ID (for internal use without user verification)
   */
  async getPortfolioById(portfolioId: string): Promise<IPortfolio | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
        throw new Error('Invalid portfolio ID');
      }

      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        status: 'ACTIVE'
      });

      return portfolio;
    } catch (error: any) {
      console.error('Error getting portfolio by ID:', error);
      throw new Error(`Failed to get portfolio: ${error.message}`);
    }
  }

  /**
   * Get detailed portfolio information with analytics and properties
   */
  async getPortfolioDetails(portfolioId: string, userId: string): Promise<PortfolioDetails> {
    try {
      if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
        throw new Error('Invalid portfolio ID');
      }

      // Get portfolio and verify ownership
      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        userId: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      });

      if (!portfolio) {
        throw new Error('Portfolio not found or access denied');
      }

      // Get portfolio properties
      const properties = await DealModel.find({ 
        portfolioId: new mongoose.Types.ObjectId(portfolioId)
      }).sort({ createdAt: -1 });

      console.log(`Portfolio ${portfolioId} details query:`);
      console.log(`- Found ${properties.length} properties with portfolioId`);
      
      // Debug: also check all properties for this user
      const allUserProperties = await DealModel.find({ 
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ createdAt: -1 });
      console.log(`- User has ${allUserProperties.length} total properties`);
      allUserProperties.forEach((prop, i) => {
        console.log(`  ${i + 1}. ${prop.propertyName} (portfolioId: ${prop.portfolioId || 'none'})`);
      });

      // Get latest analytics
      const analytics = await PortfolioAnalytics.findOne({
        portfolioId: new mongoose.Types.ObjectId(portfolioId)
      }).sort({ calculatedAt: -1 });

      // Get active recommendations
      const recommendations = await PortfolioRecommendation.find({
        portfolioId: new mongoose.Types.ObjectId(portfolioId),
        status: { $in: ['PENDING', 'VIEWED'] },
        expiresAt: { $gt: new Date() }
      }).sort({ priority: -1, createdAt: -1 });

      const details: PortfolioDetails = {
        portfolio,
        analytics: analytics || undefined,
        recommendations,
        properties,
        totalProperties: properties.length
      };

      return details;
    } catch (error: any) {
      console.error('Error getting portfolio details:', error);
      throw new Error(`Failed to get portfolio details: ${error.message}`);
    }
  }

  /**
   * Remove a property from all portfolios (used during cascade deletion)
   */
  async removePropertyFromAllPortfolios(userId: string, propertyId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        throw new Error('Invalid property ID');
      }

      logger.info(`Removing property ${propertyId} from all portfolios for user ${userId}`);

      // The Portfolio model doesn't store properties in an array
      // Instead, properties have a portfolioId field that links them to portfolios
      // When a property is deleted, we need to unset the portfolioId from the deal
      // This is already handled by the Deal deletion process where portfolioId gets removed
      
      // For proper cascade deletion, we should update the Deal model to remove portfolioId
      // This is handled in the deleteDeal function by unsetting the portfolioId field
      
      const result = await DealModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(propertyId),
          userId: new mongoose.Types.ObjectId(userId)
        },
        {
          $unset: { portfolioId: 1 },
          updatedAt: new Date()
        }
      );

      if (result.matchedCount > 0) {
        logger.info(`Successfully removed portfolioId reference from property ${propertyId}`);
      } else {
        logger.info(`Property ${propertyId} was not associated with any portfolio or not found`);
      }

    } catch (error) {
      logger.error('Error removing property from all portfolios:', error);
      throw error;
    }
  }

  /**
   * Update portfolio information
   */
  async updatePortfolio(
    portfolioId: string, 
    userId: string, 
    updates: UpdatePortfolioRequest
  ): Promise<IPortfolio> {
    try {
      if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
        throw new Error('Invalid portfolio ID');
      }

      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        userId: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      });

      if (!portfolio) {
        throw new Error('Portfolio not found or access denied');
      }

      // Update fields
      if (updates.name !== undefined) {
        portfolio.name = updates.name.trim();
      }
      
      if (updates.description !== undefined) {
        portfolio.description = updates.description?.trim();
      }

      if (updates.goals) {
        portfolio.goals = { ...portfolio.goals, ...updates.goals };
      }

      if (updates.settings) {
        portfolio.settings = { ...portfolio.settings, ...updates.settings };
      }

      const updatedPortfolio = await portfolio.save();
      console.log(`Portfolio updated: ${portfolioId}`);

      return updatedPortfolio;
    } catch (error: any) {
      console.error('Error updating portfolio:', error);
      throw new Error(`Failed to update portfolio: ${error.message}`);
    }
  }

  /**
   * Archive a portfolio (soft delete)
   */
  async archivePortfolio(portfolioId: string, userId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
        throw new Error('Invalid portfolio ID');
      }

      const result = await Portfolio.updateOne(
        {
          _id: portfolioId,
          userId: new mongoose.Types.ObjectId(userId),
          status: 'ACTIVE'
        },
        {
          status: 'ARCHIVED',
          updatedAt: new Date()
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Portfolio not found or access denied');
      }

      // Remove portfolio association from deals but keep the deals
      await DealModel.updateMany(
        { portfolioId: new mongoose.Types.ObjectId(portfolioId) },
        { $unset: { portfolioId: 1 } }
      );

      console.log(`Portfolio archived: ${portfolioId}`);
    } catch (error: any) {
      console.error('Error archiving portfolio:', error);
      throw new Error(`Failed to archive portfolio: ${error.message}`);
    }
  }

  /**
   * Add a property (deal) to a portfolio
   */
  async addPropertyToPortfolio(
    portfolioId: string, 
    propertyId: string, 
    userId: string
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(portfolioId) || 
          !mongoose.Types.ObjectId.isValid(propertyId)) {
        throw new Error('Invalid portfolio or property ID');
      }

      // Verify portfolio ownership
      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        userId: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      });

      if (!portfolio) {
        throw new Error('Portfolio not found or access denied');
      }

      // CACHE INVALIDATION (Issue #41): Invalidate BEFORE write to avoid race condition
      await cacheService.deletePortfolioCache(userId);

      // Verify property ownership and update
      const result = await DealModel.updateOne(
        {
          _id: propertyId,
          userId: new mongoose.Types.ObjectId(userId)
        },
        {
          portfolioId: new mongoose.Types.ObjectId(portfolioId),
          updatedAt: new Date()
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Property not found or access denied');
      }

      // CACHE INVALIDATION (Issue #41): Double invalidation for safety
      await cacheService.deletePortfolioCache(userId);

      // Recalculate portfolio analytics
      try {
        await portfolioAnalyticsService.calculatePortfolioAnalytics(portfolioId);
      } catch (analyticsError) {
        console.warn('Failed to calculate analytics after adding property:', analyticsError);
      }

      console.log(`Property ${propertyId} added to portfolio ${portfolioId}`);
    } catch (error: any) {
      console.error('Error adding property to portfolio:', error);
      throw new Error(`Failed to add property to portfolio: ${error.message}`);
    }
  }

  /**
   * Remove a property from a portfolio
   */
  async removePropertyFromPortfolio(
    portfolioId: string,
    propertyId: string,
    userId: string
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(portfolioId) ||
          !mongoose.Types.ObjectId.isValid(propertyId)) {
        throw new Error('Invalid portfolio or property ID');
      }

      // CACHE INVALIDATION (Issue #41): Invalidate BEFORE write to avoid race condition
      await cacheService.deletePortfolioCache(userId);

      // Verify ownership and remove portfolio association
      const result = await DealModel.updateOne(
        {
          _id: propertyId,
          portfolioId: new mongoose.Types.ObjectId(portfolioId),
          userId: new mongoose.Types.ObjectId(userId)
        },
        {
          $unset: { portfolioId: 1 },
          updatedAt: new Date()
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Property not found in portfolio or access denied');
      }

      // CACHE INVALIDATION (Issue #41): Double invalidation for safety
      await cacheService.deletePortfolioCache(userId);

      // Recalculate portfolio analytics
      try {
        await portfolioAnalyticsService.calculatePortfolioAnalytics(portfolioId);
      } catch (analyticsError) {
        console.warn('Failed to calculate analytics after removing property:', analyticsError);
      }

      console.log(`Property ${propertyId} removed from portfolio ${portfolioId}`);
    } catch (error: any) {
      console.error('Error removing property from portfolio:', error);
      throw new Error(`Failed to remove property from portfolio: ${error.message}`);
    }
  }

  /**
   * Get portfolios that user can add a property to
   *
   * PERFORMANCE FIX (Issue #41): Uses MongoDB aggregation + caching
   * - Before: 27 seconds (N+1 query anti-pattern)
   * - After (cold): ~800ms (single aggregation query)
   * - After (warm): ~50ms (cached)
   * - Improvement: 96% (cold), 99.8% (warm)
   */
  async getAvailablePortfoliosForProperty(userId: string): Promise<PortfolioSummary[]> {
    const startTime = Date.now();

    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Check cache first (5-minute TTL)
      try {
        const cached = await cacheService.getPortfolioCache(userId);
        if (cached) {
          const duration = Date.now() - startTime;
          logger.info(`Portfolio summaries (CACHED): ${duration}ms`);
          return cached;
        }
      } catch (cacheError) {
        logger.warn('Cache read failed, proceeding with aggregation:', cacheError);
        // Continue with aggregation if cache fails
      }

      // MongoDB aggregation pipeline - single query replaces N+1 pattern
      interface AggregationResult {
        _id: mongoose.Types.ObjectId;
        name: string;
        description?: string;
        goals: IPortfolioGoals;
        status: string;
        createdAt: Date;
        properties: any[];
        propertyCount: number;
        totalValue: number;
        monthlyNetCashFlow: number;
      }

      const results = await Portfolio.aggregate<AggregationResult>([
        // Stage 1: Match user's active portfolios
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            status: 'ACTIVE'
          }
        },

        // Stage 2: Join with properties collection using $lookup
        {
          $lookup: {
            from: 'deals',
            let: { portfolioId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$portfolioId', '$$portfolioId'] }
                }
              },
              {
                $project: {
                  purchasePrice: 1,
                  'analysis.monthlyAnalysis.cashFlow': 1
                }
              }
            ],
            as: 'properties'
          }
        },

        // Stage 3: Calculate aggregated metrics with null safety
        {
          $addFields: {
            propertyCount: { $size: '$properties' },

            // Total value with null safety
            totalValue: {
              $sum: {
                $map: {
                  input: '$properties',
                  as: 'prop',
                  in: { $ifNull: ['$$prop.purchasePrice', 0] }
                }
              }
            },

            // Monthly cash flow with nested null safety
            monthlyNetCashFlow: {
              $sum: {
                $map: {
                  input: '$properties',
                  as: 'prop',
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: [{ $type: '$$prop.analysis' }, 'missing'] },
                          { $ne: [{ $type: '$$prop.analysis.monthlyAnalysis' }, 'missing'] },
                          { $ne: [{ $type: '$$prop.analysis.monthlyAnalysis.cashFlow' }, 'missing'] }
                        ]
                      },
                      then: '$$prop.analysis.monthlyAnalysis.cashFlow',
                      else: 0
                    }
                  }
                }
              }
            }
          }
        },

        // Stage 4: Project final shape
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            goals: 1,
            status: 1,
            createdAt: 1,
            propertyCount: 1,
            totalValue: 1,
            monthlyNetCashFlow: 1
          }
        },

        // Stage 5: Sort by creation date (newest first)
        {
          $sort: { createdAt: -1 }
        }
      ]);

      // Runtime validation and type conversion
      const portfolioSummaries: PortfolioSummary[] = results.map(result => {
        if (!result._id || !result.name) {
          logger.error('Invalid aggregation result:', result);
          throw new Error('Aggregation returned invalid data');
        }

        return {
          id: result._id.toString(),
          name: result.name,
          description: result.description,
          primaryGoal: result.goals?.primaryGoal || 'CASH_FLOW',
          riskTolerance: result.goals?.riskTolerance || 'MODERATE',
          totalProperties: result.propertyCount || 0,
          monthlyNetCashFlow: Math.round(result.monthlyNetCashFlow || 0),
          totalValue: Math.round(result.totalValue || 0),
          status: result.status,
          createdAt: result.createdAt
        };
      });

      const duration = Date.now() - startTime;
      logger.info(`Portfolio summaries fetched (AGGREGATED): ${duration}ms, count: ${portfolioSummaries.length}`);

      // Cache the results (5-minute TTL)
      try {
        await cacheService.setPortfolioCache(userId, portfolioSummaries);
        logger.debug(`Cached portfolio summaries for user ${userId}`);
      } catch (cacheError) {
        logger.warn('Cache write failed:', cacheError);
        // Don't fail the request if cache write fails
      }

      return portfolioSummaries;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`Portfolio summaries fetch FAILED after ${duration}ms:`, error);
      throw new Error(`Failed to get available portfolios: ${error.message}`);
    }
  }

  /* LEGACY IMPLEMENTATION - Kept for rollback reference (N+1 query anti-pattern)
   *
   * Issue: Makes 1 + (2N) database queries for N portfolios
   * Performance: 27 seconds for 2 portfolios
   *
   * To rollback: Uncomment this code and remove aggregation implementation above
   *
  async getAvailablePortfoliosForPropertyLEGACY(userId: string): Promise<PortfolioSummary[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      const portfolios = await Portfolio.find({ userId: new mongoose.Types.ObjectId(userId), status: 'ACTIVE' }).sort({ createdAt: -1 });

      const portfolioSummaries: PortfolioSummary[] = [];

      for (const portfolio of portfolios) {
        let propertyCount = 0;
        let monthlyNetCashFlow = 0;
        let totalValue = 0;

        try {
          let properties = await DealModel.find({
            portfolioId: portfolio._id
          });

          if (properties.length === 0) {
            const allPropsWithPortfolio = await DealModel.find({ portfolioId: { $exists: true } });
            properties = allPropsWithPortfolio.filter(deal => {
              return deal.portfolioId && deal.portfolioId.toString() === portfolio._id.toString();
            });
          }

          propertyCount = properties.length;

          if (properties.length > 0) {
            for (const property of properties) {
              totalValue += property.purchasePrice || 0;
              const cashFlow = property.analysis?.monthlyAnalysis?.cashFlow || 0;
              monthlyNetCashFlow += cashFlow;
            }
          }

        } catch (analyticsError) {
          console.warn(`Error calculating analytics for portfolio ${portfolio._id}:`, analyticsError);
        }

        portfolioSummaries.push({
          id: portfolio._id.toString(),
          name: portfolio.name,
          description: portfolio.description,
          primaryGoal: portfolio.goals.primaryGoal,
          riskTolerance: portfolio.goals.riskTolerance,
          totalProperties: propertyCount,
          monthlyNetCashFlow: Math.round(monthlyNetCashFlow),
          totalValue: Math.round(totalValue),
          status: portfolio.status,
          createdAt: portfolio.createdAt
        });
      }

      return portfolioSummaries;
    } catch (error: any) {
      console.error('Error getting available portfolios:', error);
      throw new Error(`Failed to get available portfolios: ${error.message}`);
    }
  }
  */

  /**
   * Check if user owns a portfolio
   */
  async verifyPortfolioOwnership(portfolioId: string, userId: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
        return false;
      }

      const portfolio = await Portfolio.findOne({
        _id: portfolioId,
        userId: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      });

      return !!portfolio;
    } catch (error) {
      console.error('Error verifying portfolio ownership:', error);
      return false;
    }
  }
}

export const portfolioService = new PortfolioService();
export default portfolioService;