/**
 * Market Intelligence Service
 * 
 * Orchestrates multiple market data sources to provide comprehensive real estate market intelligence
 */

import { logger } from '../utils/logger';
import { rentcastService } from './rentcastService';
import { fredService } from './fredService';
import {
  MarketDataResponse,
  MarketDataQuery,
  MarketInsight,
  InvestmentTimingAnalysis,
  PropertyMarketData,
  ComparableProperty,
  MarketTrendData,
  EconomicData,
  MarketDataError
} from '../types/marketData';

export class MarketIntelligenceService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private cacheTTL: number;

  constructor() {
    this.cacheTTL = parseInt(process.env.CACHE_TTL_MINUTES || '60') * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Get comprehensive market data for a property
   */
  async getComprehensiveMarketData(query: MarketDataQuery): Promise<MarketDataResponse> {
    try {
      const cacheKey = this.generateCacheKey(query);
      const cached = this.getCachedData(cacheKey);
      
      if (cached && !query.forceRefresh) {
        logger.debug('Returning cached market data for query:', query);
        return cached;
      }

      logger.info('Fetching comprehensive market data', {
        address: query.address,
        zipCode: query.zipCode,
        propertyType: query.propertyType,
        apiKeyConfigured: !!process.env.RENTCAST_API_KEY,
        fredApiConfigured: !!process.env.FRED_API_KEY
      });

      // Fetch data from multiple sources in parallel
      const [rentcastData, economicData] = await Promise.allSettled([
        this.fetchRentcastData(query),
        query.includeEconomicData !== false ? fredService.getEconomicIndicators() : Promise.resolve(null)
      ]);

      // Log detailed results from each service
      logger.info('Market data fetch results:', {
        rentcastStatus: rentcastData.status,
        rentcastError: rentcastData.status === 'rejected' ? rentcastData.reason?.message : null,
        economicStatus: economicData.status,
        economicError: economicData.status === 'rejected' ? economicData.reason?.message : null
      });

      // Extract successful results with fallbacks
      const rentcast = rentcastData.status === 'fulfilled' ? rentcastData.value : null;
      const economic = economicData.status === 'fulfilled' ? economicData.value : null;

      // Log what data we actually got
      logger.info('Retrieved market data:', {
        hasRentcastProperty: !!rentcast?.property,
        hasRentcastComparables: rentcast?.comparables?.length || 0,
        hasRentcastTrends: !!rentcast?.marketTrends,
        hasEconomicData: !!economic,
        rentcastDataSource: rentcast?.property?.dataSource,
        economicDataSource: economic?.dataSource
      });

      // Combine all data sources
      const marketData: MarketDataResponse = {
        property: rentcast?.property || this.createFallbackPropertyData(),
        comparables: rentcast?.comparables || [],
        marketTrends: rentcast?.marketTrends || this.createFallbackMarketTrends(query.zipCode),
        economicIndicators: economic || this.createFallbackEconomicData(),
        location: {
          address: query.address,
          zipCode: query.zipCode,
          city: query.city,
          state: query.state
        },
        lastUpdated: new Date(),
        dataSource: this.getDataSources(rentcast, economic),
        cacheKey
      };

      // Cache the result
      this.setCachedData(cacheKey, marketData);

      logger.info('Successfully compiled comprehensive market data', {
        propertyDataAvailable: !!marketData.property,
        propertyRentEstimate: marketData.property?.rentEstimate,
        comparablesCount: marketData.comparables.length,
        economicDataAvailable: !!economic,
        dataSources: marketData.dataSource,
        usingFallbackData: marketData.dataSource.includes('Fallback')
      });

      return marketData;
    } catch (error) {
      logger.error('Failed to fetch comprehensive market data:', error);
      
      // Return minimal data structure to prevent analysis failure
      return this.createFallbackMarketData(query);
    }
  }

  /**
   * Generate market insights based on comprehensive market data
   */
  async generateMarketInsights(
    propertyData: any,
    marketData: MarketDataResponse
  ): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];

    try {
      // Market Position Insights
      if (marketData.property && propertyData.monthlyRent) {
        const positionInsight = this.analyzeMarketPosition(
          propertyData.monthlyRent,
          marketData.property,
          marketData.marketTrends
        );
        if (positionInsight) insights.push(positionInsight);
      }

      // Rental Market Insights
      if (marketData.marketTrends) {
        const rentalInsight = this.analyzeRentalMarket(marketData.marketTrends);
        if (rentalInsight) insights.push(rentalInsight);
      }

      // Economic Climate Insights
      if (marketData.economicIndicators) {
        const economicInsight = this.analyzeEconomicClimate(marketData.economicIndicators);
        if (economicInsight) insights.push(economicInsight);
      }

      // Comparable Analysis Insights
      if (marketData.comparables.length > 0 && propertyData.purchasePrice) {
        const comparableInsight = this.analyzeComparables(
          propertyData.purchasePrice,
          marketData.comparables
        );
        if (comparableInsight) insights.push(comparableInsight);
      }

      // Investment Timing Insights
      const timingInsight = this.analyzeInvestmentTimingInsight(
        marketData.economicIndicators,
        marketData.marketTrends
      );
      if (timingInsight) insights.push(timingInsight);

      logger.info(`Generated ${insights.length} market insights`);
      return insights;
    } catch (error) {
      logger.error('Failed to generate market insights:', error);
      return [];
    }
  }

  /**
   * Analyze investment timing based on market conditions
   */
  async analyzeInvestmentTiming(
    marketData: MarketDataResponse
  ): Promise<InvestmentTimingAnalysis> {
    try {
      const economic = marketData.economicIndicators;
      const trends = marketData.marketTrends;

      // Calculate market signals
      const signals = this.calculateMarketSignals(economic, trends);
      
      // Determine market cycle
      const marketCycle = this.determineMarketCycle(signals);
      
      // Generate recommendation
      const recommendation = this.generateInvestmentRecommendation(signals, marketCycle);
      
      // Calculate timing score
      const timingScore = this.calculateTimingScore(signals);
      
      // Identify risks and opportunities
      const riskFactors = this.identifyRiskFactors(economic, trends);
      const opportunities = this.identifyOpportunities(economic, trends, signals);
      
      return {
        recommendation: recommendation.action,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning,
        marketCycle,
        timingScore,
        riskFactors,
        opportunities,
        marketSignals: signals,
        nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      };
    } catch (error) {
      logger.error('Failed to analyze investment timing:', error);
      
      // Return conservative default analysis
      return this.createFallbackTimingAnalysis();
    }
  }

  /**
   * Fetch RentCast data with error handling
   */
  private async fetchRentcastData(query: MarketDataQuery) {
    try {
      if (!process.env.RENTCAST_API_KEY) {
        logger.warn('RentCast API key not configured, skipping RentCast data');
        return null;
      }

      logger.info('Calling RentCast service with query:', {
        address: query.address,
        zipCode: query.zipCode,
        city: query.city,
        state: query.state,
        propertyType: query.propertyType,
        radius: query.radius || 0.5,
        maxComparables: query.maxComparables || 10
      });

      const result = await rentcastService.getComprehensiveMarketData({
        address: query.address,
        zipCode: query.zipCode,
        city: query.city,
        state: query.state,
        propertyType: query.propertyType,
        radius: query.radius,
        limit: query.maxComparables
      });

      logger.info('RentCast service returned:', {
        hasProperty: !!result?.property,
        hasComparables: !!result?.comparables?.length,
        hasMarketTrends: !!result?.marketTrends,
        propertyRentEstimate: result?.property?.rentEstimate,
        comparablesCount: result?.comparables?.length || 0
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch RentCast data:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        address: query.address,
        zipCode: query.zipCode
      });
      return null;
    }
  }

  /**
   * Analyze market position
   */
  private analyzeMarketPosition(
    propertyRent: number,
    propertyData: PropertyMarketData,
    marketTrends: MarketTrendData
  ): MarketInsight | null {
    try {
      const marketMedian = marketTrends.medianRent;
      
      // Prevent division by zero
      if (!marketMedian || marketMedian <= 0) {
        logger.warn('Market median rent is 0 or invalid, skipping market position analysis');
        return {
          category: 'Market Position',
          insight: `Property rent is $${propertyRent.toLocaleString()} per month. Market median data is not available for comparison.`,
          impact: 'Neutral',
          confidence: 50,
          dataSource: 'RentCast',
          metrics: {
            propertyRent,
            marketMedian: 0,
            differencePercent: 0
          }
        };
      }
      
      const rentDifference = propertyRent - marketMedian;
      const rentDifferencePercent = (rentDifference / marketMedian) * 100;

      let insight: string;
      let impact: 'Positive' | 'Negative' | 'Neutral';

      if (rentDifferencePercent > 10) {
        insight = `Property rent is ${rentDifferencePercent.toFixed(1)}% above market median ($${marketMedian.toLocaleString()}). This may indicate premium positioning or potential overpricing.`;
        impact = 'Negative';
      } else if (rentDifferencePercent < -10) {
        insight = `Property rent is ${Math.abs(rentDifferencePercent).toFixed(1)}% below market median ($${marketMedian.toLocaleString()}). This presents good value or potential for rent increases.`;
        impact = 'Positive';
      } else {
        insight = `Property rent is aligned with market median ($${marketMedian.toLocaleString()}), indicating fair market positioning.`;
        impact = 'Neutral';
      }

      return {
        category: 'Market Position',
        insight,
        impact,
        confidence: propertyData.confidence,
        dataSource: 'RentCast',
        metrics: {
          propertyRent,
          marketMedian,
          differencePercent: rentDifferencePercent
        }
      };
    } catch (error) {
      logger.warn('Failed to analyze market position:', error);
      return null;
    }
  }

  /**
   * Analyze rental market trends
   */
  private analyzeRentalMarket(trends: MarketTrendData): MarketInsight | null {
    try {
      const growthRate = trends.rentGrowthRate;
      let insight: string;
      let impact: 'Positive' | 'Negative' | 'Neutral';

      if (growthRate > 5) {
        insight = `Strong rental market with ${growthRate.toFixed(1)}% annual rent growth, indicating high demand and investment potential.`;
        impact = 'Positive';
      } else if (growthRate < 0) {
        insight = `Declining rental market with ${Math.abs(growthRate).toFixed(1)}% annual rent decrease, suggesting oversupply or economic challenges.`;
        impact = 'Negative';
      } else {
        insight = `Stable rental market with ${growthRate.toFixed(1)}% annual rent growth, typical of balanced supply and demand.`;
        impact = 'Neutral';
      }

      return {
        category: 'Rental Market',
        insight,
        impact,
        confidence: 80,
        dataSource: 'RentCast',
        metrics: {
          rentGrowthRate: growthRate,
          medianRent: trends.medianRent,
          inventoryLevel: trends.inventoryLevel
        }
      };
    } catch (error) {
      logger.warn('Failed to analyze rental market:', error);
      return null;
    }
  }

  /**
   * Analyze economic climate
   */
  private analyzeEconomicClimate(economic: EconomicData): MarketInsight | null {
    try {
      const mortgageRate = economic.currentMortgageRate;
      const inflation = economic.inflationRate;
      const unemployment = economic.unemploymentRate;

      let insight: string;
      let impact: 'Positive' | 'Negative' | 'Neutral';

      if (mortgageRate > 7 && inflation > 4) {
        insight = `Challenging economic environment with high mortgage rates (${mortgageRate}%) and inflation (${inflation}%), potentially reducing buyer demand.`;
        impact = 'Negative';
      } else if (mortgageRate < 5 && unemployment < 4) {
        insight = `Favorable economic environment with low mortgage rates (${mortgageRate}%) and unemployment (${unemployment}%), supporting real estate investment.`;
        impact = 'Positive';
      } else {
        insight = `Mixed economic signals with mortgage rates at ${mortgageRate}% and unemployment at ${unemployment}%. Market conditions are moderately supportive.`;
        impact = 'Neutral';
      }

      return {
        category: 'Economic Climate',
        insight,
        impact,
        confidence: 85,
        dataSource: 'FRED',
        metrics: {
          mortgageRate,
          inflation,
          unemployment,
          trend: economic.mortgageRateTrend
        }
      };
    } catch (error) {
      logger.warn('Failed to analyze economic climate:', error);
      return null;
    }
  }

  /**
   * Analyze comparable properties
   */
  private analyzeComparables(
    propertyPrice: number,
    comparables: ComparableProperty[]
  ): MarketInsight | null {
    try {
      if (comparables.length === 0) return null;

      const avgPrice = comparables.reduce((sum, comp) => sum + comp.salePrice, 0) / comparables.length;
      const avgPricePerSqft = comparables.reduce((sum, comp) => sum + comp.pricePerSqft, 0) / comparables.length;
      const priceDifference = propertyPrice - avgPrice;
      const priceDifferencePercent = (priceDifference / avgPrice) * 100;

      let insight: string;
      let impact: 'Positive' | 'Negative' | 'Neutral';

      if (priceDifferencePercent > 10) {
        insight = `Property price is ${priceDifferencePercent.toFixed(1)}% above comparable sales average (${avgPrice.toLocaleString()}), suggesting potential overvaluation.`;
        impact = 'Negative';
      } else if (priceDifferencePercent < -10) {
        insight = `Property price is ${Math.abs(priceDifferencePercent).toFixed(1)}% below comparable sales average (${avgPrice.toLocaleString()}), indicating good value.`;
        impact = 'Positive';
      } else {
        insight = `Property price aligns with comparable sales (avg: ${avgPrice.toLocaleString()}), suggesting fair market value.`;
        impact = 'Neutral';
      }

      return {
        category: 'Comparable Analysis',
        insight,
        impact,
        confidence: Math.min(90, 60 + (comparables.length * 5)), // Higher confidence with more comps
        dataSource: 'RentCast',
        metrics: {
          propertyPrice,
          avgComparablePrice: avgPrice,
          avgPricePerSqft,
          comparablesCount: comparables.length,
          differencePercent: priceDifferencePercent
        }
      };
    } catch (error) {
      logger.warn('Failed to analyze comparables:', error);
      return null;
    }
  }

  /**
   * Analyze investment timing for market insights
   */
  private analyzeInvestmentTimingInsight(
    economic: EconomicData,
    trends: MarketTrendData
  ): MarketInsight | null {
    try {
      const mortgageRate = economic.currentMortgageRate;
      const rentGrowth = trends.rentGrowthRate;
      const priceGrowth = trends.priceGrowthRate;

      let insight: string;
      let impact: 'Positive' | 'Negative' | 'Neutral';

      // Simple timing logic - can be enhanced
      if (rentGrowth > 3 && priceGrowth < 5 && mortgageRate < 8) {
        insight = `Good timing for investment: rent growth (${rentGrowth.toFixed(1)}%) outpacing price growth (${priceGrowth.toFixed(1)}%) with reasonable financing costs.`;
        impact = 'Positive';
      } else if (mortgageRate > 8 || priceGrowth > 10) {
        insight = `Challenging timing: high financing costs (${mortgageRate}%) or rapid price appreciation (${priceGrowth.toFixed(1)}%) may limit returns.`;
        impact = 'Negative';
      } else {
        insight = `Neutral timing for investment. Market conditions are balanced but monitor interest rate and price trends.`;
        impact = 'Neutral';
      }

      return {
        category: 'Investment Timing',
        insight,
        impact,
        confidence: 75,
        dataSource: 'RentCast + FRED',
        metrics: {
          mortgageRate,
          rentGrowth,
          priceGrowth,
          mortgageTrend: economic.mortgageRateTrend
        }
      };
    } catch (error) {
      logger.warn('Failed to analyze investment timing:', error);
      return null;
    }
  }

  /**
   * Calculate market signals for timing analysis
   */
  private calculateMarketSignals(economic: EconomicData, trends: MarketTrendData) {
    // Normalize signals to -1 to 1 scale
    const interestRateSignal = this.normalizeSignal(economic.currentMortgageRate, 3, 10, true);
    const inflationSignal = this.normalizeSignal(economic.inflationRate, 0, 6, true);
    const housingSupplySignal = this.normalizeSignal(trends.daysOnMarket, 15, 120, true);
    const economicGrowthSignal = this.normalizeSignal(economic.economicGrowth, -2, 6);

    const overallSignal = (interestRateSignal + inflationSignal + housingSupplySignal + economicGrowthSignal) / 4;

    return {
      interestRateSignal,
      inflationSignal,
      housingSupplySignal,
      economicGrowthSignal,
      overallSignal
    };
  }

  /**
   * Normalize a value to -1 to 1 scale
   */
  private normalizeSignal(value: number, min: number, max: number, inverted: boolean = false): number {
    let normalized = Math.max(-1, Math.min(1, (value - min) / (max - min) * 2 - 1));
    return inverted ? -normalized : normalized;
  }

  /**
   * Determine market cycle based on signals
   */
  private determineMarketCycle(signals: any): 'Expansion' | 'Peak' | 'Contraction' | 'Recovery' | 'Unknown' {
    const overall = signals.overallSignal;
    
    if (overall > 0.3) return 'Expansion';
    if (overall > 0) return 'Recovery';
    if (overall > -0.3) return 'Peak';
    if (overall > -0.7) return 'Contraction';
    return 'Unknown';
  }

  /**
   * Generate investment recommendation
   */
  private generateInvestmentRecommendation(signals: any, cycle: string) {
    const overall = signals.overallSignal;
    
    if (overall > 0.3) {
      return {
        action: 'Buy' as const,
        confidence: 85,
        reasoning: ['Strong market fundamentals', 'Favorable economic conditions', 'Good growth potential']
      };
    } else if (overall > 0) {
      return {
        action: 'Buy' as const,
        confidence: 70,
        reasoning: ['Recovering market conditions', 'Opportunity for value appreciation', 'Moderate risk profile']
      };
    } else if (overall > -0.3) {
      return {
        action: 'Hold' as const,
        confidence: 60,
        reasoning: ['Market at peak', 'Monitor for better opportunities', 'Maintain current positions']
      };
    } else {
      return {
        action: 'Caution' as const,
        confidence: 75,
        reasoning: ['Challenging market conditions', 'Wait for improvement', 'Focus on cash preservation']
      };
    }
  }

  /**
   * Calculate timing score
   */
  private calculateTimingScore(signals: any): number {
    // Convert -1 to 1 scale to 0 to 100 score
    return Math.round((signals.overallSignal + 1) * 50);
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(economic: EconomicData, trends: MarketTrendData): string[] {
    const risks: string[] = [];
    
    if (economic.currentMortgageRate > 8) {
      risks.push('High mortgage rates increasing financing costs');
    }
    
    if (economic.inflationRate > 5) {
      risks.push('High inflation eroding purchasing power');
    }
    
    if (economic.unemploymentRate > 6) {
      risks.push('Elevated unemployment affecting rental demand');
    }
    
    if (trends.priceGrowthRate > 10) {
      risks.push('Rapid price appreciation may indicate bubble conditions');
    }
    
    if (trends.daysOnMarket > 90) {
      risks.push('Extended time on market suggests buyer hesitation');
    }
    
    return risks;
  }

  /**
   * Identify opportunities
   */
  private identifyOpportunities(economic: EconomicData, trends: MarketTrendData, signals: any): string[] {
    const opportunities: string[] = [];
    
    if (economic.currentMortgageRate < 6) {
      opportunities.push('Low mortgage rates provide favorable financing');
    }
    
    if (trends.rentGrowthRate > 4) {
      opportunities.push('Strong rent growth supports cash flow');
    }
    
    if (economic.unemploymentRate < 4) {
      opportunities.push('Low unemployment supports rental demand');
    }
    
    if (signals.overallSignal > 0.2) {
      opportunities.push('Positive market momentum favors investment');
    }
    
    if (trends.inventoryLevel === 'Low') {
      opportunities.push('Limited inventory may support price appreciation');
    }
    
    return opportunities;
  }

  /**
   * Helper methods for fallback data
   */
  private createFallbackPropertyData(): PropertyMarketData {
    return {
      rentEstimate: 0,
      rentRange: { low: 0, high: 0 },
      marketPosition: 'At Market',
      confidence: 0,
      lastUpdated: new Date(),
      dataSource: 'Fallback'
    };
  }

  private createFallbackMarketTrends(zipCode: string): MarketTrendData {
    return {
      zipCode,
      city: 'Unknown',
      state: 'Unknown',
      medianRent: 0,
      averageRent: 0,
      rentGrowthRate: 3,
      medianSalePrice: 0,
      averageSalePrice: 0,
      priceGrowthRate: 5,
      daysOnMarket: 60,
      inventoryLevel: 'Normal',
      priceToRentRatio: 0,
      seasonalTrend: 'Stable',
      sampleSize: { rentals: 0, sales: 0 },
      lastUpdated: new Date(),
      dataSource: 'Fallback'
    };
  }

  private createFallbackEconomicData(): EconomicData {
    return {
      currentMortgageRate: 7.5,
      mortgageRateTrend: 'Stable',
      mortgageRateChange: 0,
      inflationRate: 3.0,
      unemploymentRate: 4.0,
      housingIndex: 300,
      housingIndexChange: 5.0,
      economicGrowth: 2.5,
      federalFundsRate: 5.0,
      lastUpdated: new Date(),
      dataSource: 'Fallback'
    };
  }

  private createFallbackMarketData(query: MarketDataQuery): MarketDataResponse {
    return {
      property: this.createFallbackPropertyData(),
      comparables: [],
      marketTrends: this.createFallbackMarketTrends(query.zipCode),
      economicIndicators: this.createFallbackEconomicData(),
      location: {
        address: query.address,
        zipCode: query.zipCode,
        city: query.city,
        state: query.state
      },
      lastUpdated: new Date(),
      dataSource: ['Fallback']
    };
  }

  private createFallbackTimingAnalysis(): InvestmentTimingAnalysis {
    return {
      recommendation: 'Hold',
      confidence: 50,
      reasoning: ['Limited market data available', 'Proceed with standard due diligence'],
      marketCycle: 'Unknown',
      timingScore: 50,
      riskFactors: ['Limited market intelligence available'],
      opportunities: ['Conduct thorough local market research'],
      marketSignals: {
        interestRateSignal: 0,
        inflationSignal: 0,
        housingSupplySignal: 0,
        economicGrowthSignal: 0,
        overallSignal: 0
      },
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };
  }

  private getDataSources(rentcast: any, economic: any): string[] {
    const sources: string[] = [];
    if (rentcast) sources.push('RentCast');
    if (economic) sources.push('FRED');
    if (sources.length === 0) sources.push('Fallback');
    return sources;
  }

  /**
   * Cache management
   */
  private generateCacheKey(query: MarketDataQuery): string {
    return `market_data:${query.zipCode}:${query.address?.replace(/\s+/g, '_').toLowerCase() || 'no_address'}`;
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.cacheTTL
    });
  }

  /**
   * Health check for all services
   */
  public async healthCheck(): Promise<{ status: string; services: any[] }> {
    const [rentcastHealth, fredHealth] = await Promise.allSettled([
      rentcastService.healthCheck(),
      fredService.healthCheck()
    ]);

    const services = [
      {
        name: 'RentCast',
        status: rentcastHealth.status === 'fulfilled' ? rentcastHealth.value : { status: 'error', message: 'Health check failed' }
      },
      {
        name: 'FRED',
        status: fredHealth.status === 'fulfilled' ? fredHealth.value : { status: 'error', message: 'Health check failed' }
      }
    ];

    const overallStatus = services.every(s => s.status.status === 'healthy') ? 'healthy' : 'degraded';

    return { status: overallStatus, services };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    fredService.clearCache();
    logger.info('Market intelligence cache cleared');
  }
}

// Export singleton instance
export const marketIntelligenceService = new MarketIntelligenceService();