/**
 * FRED (Federal Reserve Economic Data) API Service
 * 
 * Integrates with FRED API for economic indicators affecting real estate markets
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';
import {
  FredSeriesResponse,
  FredSeriesInfo,
  EconomicData,
  FredQuery,
  FRED_SERIES_IDS,
  FredSeriesId,
  MarketDataError
} from '../types/marketData';

export class FredService {
  private client: AxiosInstance;
  private apiKey?: string;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor() {
    // Trim the API key to remove any accidental whitespace
    this.apiKey = process.env.FRED_API_KEY?.trim();
    this.baseUrl = process.env.FRED_BASE_URL || 'https://api.stlouisfed.org/fred';

    // FRED API key is optional - many endpoints work without it
    if (!this.apiKey) {
      logger.info('FRED API key not provided. Using public access (may have rate limits).');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      params: {
        ...(this.apiKey && { api_key: this.apiKey }),
        file_type: 'json'
      }
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the current 30-year mortgage rate
   */
  async getCurrentMortgageRate(): Promise<number> {
    try {
      const data = await this.getLatestObservation(FRED_SERIES_IDS.MORTGAGE_30_YEAR);
      return parseFloat(data.value) || 0;
    } catch (error) {
      logger.warn('Failed to fetch current mortgage rate, using default:', error);
      return 7.5; // Default fallback rate
    }
  }

  /**
   * Get mortgage rate trend (rising, falling, stable)
   */
  async getMortgageRateTrend(): Promise<'Rising' | 'Falling' | 'Stable'> {
    try {
      const observations = await this.getSeriesObservations(FRED_SERIES_IDS.MORTGAGE_30_YEAR, {
        limit: 4, // Get last 4 observations
        sort_order: 'desc'
      });

      if (observations.length < 3) return 'Stable';

      const rates = observations.map(obs => parseFloat(obs.value)).filter(rate => !isNaN(rate));
      if (rates.length < 3) return 'Stable';

      const recent = rates[0];
      const previous = rates[1];
      const older = rates[2];

      const recentChange = recent - previous;
      const previousChange = previous - older;

      // Determine trend
      if (recentChange > 0.1 && previousChange > 0) return 'Rising';
      if (recentChange < -0.1 && previousChange < 0) return 'Falling';
      return 'Stable';
    } catch (error) {
      logger.warn('Failed to determine mortgage rate trend:', error);
      return 'Stable';
    }
  }

  /**
   * Get current inflation rate (CPI)
   */
  async getInflationRate(): Promise<number> {
    try {
      const data = await this.getLatestObservation(FRED_SERIES_IDS.INFLATION_CPI);
      
      // Calculate year-over-year percentage change
      const observations = await this.getSeriesObservations(FRED_SERIES_IDS.INFLATION_CPI, {
        limit: 13, // 13 months to get year-over-year
        sort_order: 'desc'
      });

      if (observations.length >= 13) {
        const current = parseFloat(observations[0].value);
        const yearAgo = parseFloat(observations[12].value);
        
        if (!isNaN(current) && !isNaN(yearAgo) && yearAgo > 0) {
          return ((current - yearAgo) / yearAgo) * 100;
        }
      }

      return 3.0; // Default fallback
    } catch (error) {
      logger.warn('Failed to fetch inflation rate, using default:', error);
      return 3.0;
    }
  }

  /**
   * Get current unemployment rate
   */
  async getUnemploymentRate(): Promise<number> {
    try {
      const data = await this.getLatestObservation(FRED_SERIES_IDS.UNEMPLOYMENT_RATE);
      return parseFloat(data.value) || 0;
    } catch (error) {
      logger.warn('Failed to fetch unemployment rate, using default:', error);
      return 4.0;
    }
  }

  /**
   * Get housing price index (Case-Shiller)
   */
  async getHousingPriceIndex(): Promise<number> {
    try {
      const data = await this.getLatestObservation(FRED_SERIES_IDS.CASE_SHILLER_NATIONAL);
      return parseFloat(data.value) || 0;
    } catch (error) {
      logger.warn('Failed to fetch housing price index, using default:', error);
      return 300; // Default index value
    }
  }

  /**
   * Get housing price index change (year-over-year)
   */
  async getHousingPriceIndexChange(): Promise<number> {
    try {
      const observations = await this.getSeriesObservations(FRED_SERIES_IDS.CASE_SHILLER_NATIONAL, {
        limit: 13, // 13 months to get year-over-year
        sort_order: 'desc'
      });

      if (observations.length >= 13) {
        const current = parseFloat(observations[0].value);
        const yearAgo = parseFloat(observations[12].value);
        
        if (!isNaN(current) && !isNaN(yearAgo) && yearAgo > 0) {
          return ((current - yearAgo) / yearAgo) * 100;
        }
      }

      return 5.0; // Default growth rate
    } catch (error) {
      logger.warn('Failed to calculate housing price index change:', error);
      return 5.0;
    }
  }

  /**
   * Get federal funds rate
   */
  async getFederalFundsRate(): Promise<number> {
    try {
      const data = await this.getLatestObservation(FRED_SERIES_IDS.FEDERAL_FUNDS_RATE);
      return parseFloat(data.value) || 0;
    } catch (error) {
      logger.warn('Failed to fetch federal funds rate, using default:', error);
      return 5.0;
    }
  }

  /**
   * Get GDP growth rate
   */
  async getGDPGrowthRate(): Promise<number> {
    try {
      // Get quarterly GDP data
      const observations = await this.getSeriesObservations(FRED_SERIES_IDS.GDP_GROWTH, {
        limit: 5, // Last 5 quarters
        sort_order: 'desc'
      });

      if (observations.length >= 5) {
        const current = parseFloat(observations[0].value);
        const yearAgo = parseFloat(observations[4].value);
        
        if (!isNaN(current) && !isNaN(yearAgo) && yearAgo > 0) {
          return ((current - yearAgo) / yearAgo) * 100;
        }
      }

      return 2.5; // Default growth rate
    } catch (error) {
      logger.warn('Failed to fetch GDP growth rate, using default:', error);
      return 2.5;
    }
  }

  /**
   * Get comprehensive economic indicators
   */
  async getEconomicIndicators(): Promise<EconomicData> {
    try {
      logger.info('Fetching comprehensive economic indicators from FRED');

      // Fetch all indicators in parallel for better performance
      const [
        mortgageRate,
        mortgageTrend,
        mortgageChange,
        inflationRate,
        unemploymentRate,
        housingIndex,
        housingIndexChange,
        federalFundsRate,
        gdpGrowth
      ] = await Promise.allSettled([
        this.getCurrentMortgageRate(),
        this.getMortgageRateTrend(),
        this.getMortgageRateChange(),
        this.getInflationRate(),
        this.getUnemploymentRate(),
        this.getHousingPriceIndex(),
        this.getHousingPriceIndexChange(),
        this.getFederalFundsRate(),
        this.getGDPGrowthRate()
      ]);

      // Extract values with fallbacks for failed promises
      const economicData: EconomicData = {
        currentMortgageRate: mortgageRate.status === 'fulfilled' ? mortgageRate.value : 7.5,
        mortgageRateTrend: mortgageTrend.status === 'fulfilled' ? mortgageTrend.value : 'Stable',
        mortgageRateChange: mortgageChange.status === 'fulfilled' ? mortgageChange.value : 0,
        inflationRate: inflationRate.status === 'fulfilled' ? inflationRate.value : 3.0,
        unemploymentRate: unemploymentRate.status === 'fulfilled' ? unemploymentRate.value : 4.0,
        housingIndex: housingIndex.status === 'fulfilled' ? housingIndex.value : 300,
        housingIndexChange: housingIndexChange.status === 'fulfilled' ? housingIndexChange.value : 5.0,
        economicGrowth: gdpGrowth.status === 'fulfilled' ? gdpGrowth.value : 2.5,
        federalFundsRate: federalFundsRate.status === 'fulfilled' ? federalFundsRate.value : 5.0,
        lastUpdated: new Date(),
        dataSource: 'FRED'
      };

      logger.info('Successfully fetched economic indicators', {
        mortgageRate: economicData.currentMortgageRate,
        inflation: economicData.inflationRate,
        unemployment: economicData.unemploymentRate
      });

      return economicData;
    } catch (error) {
      logger.error('Failed to fetch economic indicators, returning defaults:', error);
      
      // Return default economic data
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
        dataSource: 'FRED (defaults)'
      };
    }
  }

  /**
   * Get mortgage rate change over specified period
   */
  private async getMortgageRateChange(): Promise<number> {
    try {
      const observations = await this.getSeriesObservations(FRED_SERIES_IDS.MORTGAGE_30_YEAR, {
        limit: 13, // 13 weeks for quarterly change
        sort_order: 'desc'
      });

      if (observations.length >= 2) {
        const current = parseFloat(observations[0].value);
        const previous = parseFloat(observations[1].value);
        
        if (!isNaN(current) && !isNaN(previous)) {
          return current - previous;
        }
      }

      return 0;
    } catch (error) {
      logger.warn('Failed to calculate mortgage rate change:', error);
      return 0;
    }
  }

  /**
   * Get latest observation for a series
   */
  private async getLatestObservation(seriesId: FredSeriesId): Promise<{ value: string; date: string }> {
    const cacheKey = `latest_${seriesId}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const observations = await this.getSeriesObservations(seriesId, { limit: 1, sort_order: 'desc' });
    
    if (observations.length === 0) {
      throw new Error(`No observations found for series ${seriesId}`);
    }

    const latest = observations[0];
    this.setCachedData(cacheKey, latest, 30); // Cache for 30 minutes
    
    return latest;
  }

  /**
   * Get series observations with query parameters
   */
  private async getSeriesObservations(seriesId: FredSeriesId, query: Partial<FredQuery> = {}): Promise<Array<{ value: string; date: string }>> {
    try {
      const params = {
        series_id: seriesId,
        limit: query.limit || 100,
        sort_order: query.sort_order || 'desc',
        ...query
      };

      logger.debug(`Fetching FRED series ${seriesId} with params:`, params);

      const response = await this.client.get<FredSeriesResponse>('/series/observations', {
        params
      });

      const observations = response.data.observations || [];
      
      // Filter out invalid values
      return observations.filter(obs => obs.value && obs.value !== '.' && !isNaN(parseFloat(obs.value)));
    } catch (error) {
      const marketError = this.createMarketDataError(error, `getSeriesObservations(${seriesId})`);
      logger.error(`Failed to fetch FRED series ${seriesId}:`, marketError);
      throw marketError;
    }
  }

  /**
   * Get cached data
   */
  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached data
   */
  private setCachedData(key: string, data: any, ttlMinutes: number = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: AxiosError): void {
    const status = error.response?.status;
    
    if (status === 429) {
      logger.warn('FRED API rate limit exceeded');
    } else if (status === 400) {
      logger.warn('FRED API bad request - check parameters');
    } else if (status === 404) {
      logger.warn('FRED API series not found');
    }
  }

  /**
   * Create standardized MarketDataError
   */
  private createMarketDataError(error: any, method: string): MarketDataError {
    const isAxiosError = error.isAxiosError;
    const status = isAxiosError ? error.response?.status : undefined;
    const message = isAxiosError ? error.response?.data?.error_message || error.message : error.message;
    
    // FRED API errors are generally retryable except for 400/404
    const retryable = !status || (status !== 400 && status !== 404);
    
    const marketError = new Error(`FRED ${method} failed: ${message}`) as MarketDataError;
    marketError.service = 'FRED';
    marketError.statusCode = status;
    marketError.retryable = retryable;
    marketError.originalError = error;
    
    return marketError;
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      // Test with a simple, always-available series
      await this.getLatestObservation(FRED_SERIES_IDS.FEDERAL_FUNDS_RATE);
      
      return { status: 'healthy', message: 'FRED API connection successful' };
    } catch (error) {
      return { 
        status: 'error', 
        message: `FRED API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  public clearCache(): void {
    this.cache.clear();
    logger.info('FRED service cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Lazy singleton instance - only instantiate when first accessed
// This ensures dotenv.config() has run first in index.ts
let _fredServiceInstance: FredService | null = null;

function getFredServiceInstance(): FredService {
  if (!_fredServiceInstance) {
    _fredServiceInstance = new FredService();
  }
  return _fredServiceInstance;
}

// Export singleton instance with lazy initialization
export const fredService = new Proxy({} as FredService, {
  get(_target, prop) {
    const instance = getFredServiceInstance();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});