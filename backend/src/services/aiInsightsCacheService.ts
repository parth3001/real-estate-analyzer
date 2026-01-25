import { logger } from '../utils/logger';
import { MarketDataCache } from '../models/MarketDataCache';

/**
 * AI Insights Caching Service - Layer 2 Performance Architecture
 * 
 * Intelligent caching for expensive AI analysis with smart invalidation
 * based on significant parameter changes.
 */

interface CacheKey {
  propertyHash: string;
  parametersHash: string;
  version: string;
}

interface CachedAIInsights {
  insights: any;
  timestamp: number;
  cacheKey: CacheKey;
  performanceMetrics: {
    generationTime: number;
    modelUsed: string;
    tokensUsed?: number;
  };
}

export class AIInsightsCacheService {
  private static readonly CACHE_PREFIX = 'ai_insights';
  private static readonly CACHE_TTL_HOURS = 24; // 24 hour TTL for AI insights
  private static readonly VERSION = '2.1'; // Increment when AI prompts change (2.1: Issue #78 - personalized context)

  /**
   * Generate cache key based on property data and critical parameters
   */
  private static generateCacheKey(propertyData: any): CacheKey {
    // Critical parameters that affect AI analysis
    const criticalParams = {
      purchasePrice: propertyData.purchasePrice,
      monthlyRent: propertyData.monthlyRent,
      downPayment: propertyData.downPayment,
      interestRate: propertyData.interestRate,
      propertyType: propertyData.propertyType,
      location: `${propertyData.propertyAddress?.city}-${propertyData.propertyAddress?.state}`,
      // Financial parameters that significantly impact AI insights
      propertyTaxRate: propertyData.propertyTaxRate,
      insuranceRate: propertyData.insuranceRate,
      maintenanceCost: propertyData.maintenanceCost,
      propertyManagementRate: propertyData.propertyManagementRate,
      // User's personal context (Issue #78) - different goals = different AI response
      userContext: propertyData.enhancedGoals?.freeTextStrategy ||
                   propertyData.enhancedGoals?.strategy ||
                   'none',
      // Long-term assumptions
      assumptions: {
        projectionYears: propertyData.longTermAssumptions?.projectionYears,
        annualRentIncrease: propertyData.longTermAssumptions?.annualRentIncrease,
        annualPropertyValueIncrease: propertyData.longTermAssumptions?.annualPropertyValueIncrease,
        vacancyRate: propertyData.longTermAssumptions?.vacancyRate
      }
    };

    // Create normalized hash
    const propertyHash = this.createHash(JSON.stringify(criticalParams));
    const parametersHash = this.createHash(JSON.stringify(criticalParams.assumptions));

    return {
      propertyHash,
      parametersHash,
      version: this.VERSION
    };
  }

  /**
   * Simple hash function for cache keys
   */
  private static createHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached AI insights if available and valid
   */
  static async getCachedInsights(propertyData: any): Promise<CachedAIInsights | null> {
    try {
      const cacheKey = this.generateCacheKey(propertyData);
      const cacheKeyStr = `${this.CACHE_PREFIX}:${cacheKey.propertyHash}:${cacheKey.version}`;
      
      // Use MarketDataCache model directly for AI insights storage
      const cached = await MarketDataCache.findValidCache(cacheKeyStr);
      
      if (!cached) {
        logger.info('AI insights cache miss', { 
          propertyHash: cacheKey.propertyHash,
          cacheKey: cacheKeyStr 
        });
        return null;
      }

      const cachedData: CachedAIInsights = cached.data;
      
      // Validate cache version and freshness
      if (cachedData.cacheKey.version !== this.VERSION) {
        logger.info('AI insights cache version mismatch, invalidating', {
          cached: cachedData.cacheKey.version,
          current: this.VERSION
        });
        await this.invalidateCache(propertyData);
        return null;
      }

      // Check if data is too old (beyond TTL)
      const ageHours = (Date.now() - cachedData.timestamp) / (1000 * 60 * 60);
      if (ageHours > this.CACHE_TTL_HOURS) {
        logger.info('AI insights cache expired', { ageHours, ttl: this.CACHE_TTL_HOURS });
        await this.invalidateCache(propertyData);
        return null;
      }

      logger.info('AI insights cache hit', { 
        ageHours: ageHours.toFixed(2),
        generationTime: cachedData.performanceMetrics.generationTime,
        modelUsed: cachedData.performanceMetrics.modelUsed
      });

      return cachedData;
    } catch (error) {
      logger.error('Error retrieving AI insights from cache', error);
      return null;
    }
  }

  /**
   * Cache AI insights with performance metrics
   */
  static async cacheInsights(
    propertyData: any, 
    insights: any, 
    performanceMetrics: { generationTime: number; modelUsed: string; tokensUsed?: number }
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(propertyData);
      const cacheKeyStr = `${this.CACHE_PREFIX}:${cacheKey.propertyHash}:${cacheKey.version}`;

      const cachedData: CachedAIInsights = {
        insights,
        timestamp: Date.now(),
        cacheKey,
        performanceMetrics
      };

      // Use MarketDataCache.createCacheEntry to store AI insights
      await MarketDataCache.createCacheEntry(
        cacheKeyStr,
        'market', // Use 'market' type for AI insights cache
        cachedData,
        this.CACHE_TTL_HOURS,
        {
          source: `ai-insights-${performanceMetrics.modelUsed}-${performanceMetrics.generationTime}ms`
        }
      );

      logger.info('AI insights cached successfully', {
        cacheKey: cacheKeyStr,
        generationTime: performanceMetrics.generationTime,
        modelUsed: performanceMetrics.modelUsed,
        insightsSize: JSON.stringify(insights).length
      });
    } catch (error) {
      logger.error('Error caching AI insights', error);
    }
  }

  /**
   * Determine if parameter changes are significant enough to invalidate cache
   */
  static shouldInvalidateCache(originalData: any, newData: any): boolean {
    const significantThreshold = 0.1; // 10% change threshold

    // Critical parameters that require cache invalidation
    const criticalFields = [
      'purchasePrice',
      'monthlyRent', 
      'downPayment',
      'interestRate'
    ];

    for (const field of criticalFields) {
      const original = originalData[field] || 0;
      const updated = newData[field] || 0;
      
      if (original === 0 && updated > 0) return true;
      if (original > 0 && updated === 0) return true;
      
      const percentChange = Math.abs((updated - original) / original);
      if (percentChange > significantThreshold) {
        logger.info('Significant parameter change detected', {
          field,
          original,
          updated,
          percentChange: (percentChange * 100).toFixed(2) + '%',
          threshold: (significantThreshold * 100) + '%'
        });
        return true;
      }
    }

    // Check long-term assumptions
    const originalAssumptions = originalData.longTermAssumptions || {};
    const newAssumptions = newData.longTermAssumptions || {};
    
    const assumptionFields = [
      'annualRentIncrease',
      'annualPropertyValueIncrease', 
      'vacancyRate'
    ];

    for (const field of assumptionFields) {
      const original = originalAssumptions[field] || 0;
      const updated = newAssumptions[field] || 0;
      
      const percentChange = Math.abs((updated - original) / (original || 1));
      if (percentChange > significantThreshold) {
        logger.info('Significant assumption change detected', {
          field,
          original,
          updated,
          percentChange: (percentChange * 100).toFixed(2) + '%'
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Invalidate cached insights for a property
   */
  static async invalidateCache(propertyData: any): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(propertyData);
      const cacheKeyStr = `${this.CACHE_PREFIX}:${cacheKey.propertyHash}:${cacheKey.version}`;
      
      // Delete from MarketDataCache collection
      await MarketDataCache.deleteOne({ cacheKey: cacheKeyStr });
      
      logger.info('AI insights cache invalidated', { cacheKey: cacheKeyStr });
    } catch (error) {
      logger.error('Error invalidating AI insights cache', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getCacheStats(): Promise<{
    totalCached: number;
    avgAge: number;
    hitRate: number;
  }> {
    // Implementation would depend on your cache store capabilities
    // For now, return placeholder stats
    return {
      totalCached: 0,
      avgAge: 0,
      hitRate: 0
    };
  }

  /**
   * Warm cache for common property scenarios
   */
  static async warmCache(): Promise<void> {
    logger.info('AI insights cache warming not implemented yet');
    // Could pre-generate insights for common property configurations
  }
}