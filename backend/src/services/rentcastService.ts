/**
 * RentCast API Service
 * 
 * Integrates with RentCast API for property rent estimates, market data, and comparable properties
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import {
  RentcastPropertyResponse,
  RentcastComparablesResponse,
  RentcastMarketDataResponse,
  RentcastPropertyDetailsResponse,
  EnhancedPropertyData,
  PropertyMarketData,
  ComparableProperty,
  MarketTrendData,
  RentcastQuery,
  MarketDataError
} from '../types/marketData';

export class RentcastService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private rateLimitRemaining: number = 100;
  private rateLimitReset: number = Date.now() + 3600000; // 1 hour from now

  constructor() {
    this.apiKey = process.env.RENTCAST_API_KEY || '';
    this.baseUrl = process.env.RENTCAST_BASE_URL || 'https://api.rentcast.io/v1';

    if (!this.apiKey) {
      logger.warn('RentCast API key not found. Market data features will be disabled.');
    }

    logger.info('RentCast service initialized with MongoDB persistent cache');

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'RealEstateAnalyzer/1.0'
      }
    });

    // Response interceptor for rate limiting tracking
    this.client.interceptors.response.use(
      (response) => {
        // Track rate limiting from headers
        const remaining = response.headers['x-ratelimit-remaining'];
        const reset = response.headers['x-ratelimit-reset'];
        
        if (remaining) this.rateLimitRemaining = parseInt(remaining);
        if (reset) this.rateLimitReset = parseInt(reset) * 1000; // Convert to milliseconds

        logger.debug(`RentCast rate limit: ${this.rateLimitRemaining} remaining`);
        return response;
      },
      (error) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get property rent estimate and basic market data
   */
  async getPropertyRentEstimate(address: string): Promise<PropertyMarketData> {
    try {
      if (!this.apiKey) {
        throw new Error('RentCast API key not configured');
      }

      await this.checkRateLimit();

      logger.info(`Fetching RentCast property data for: ${address}`, {
        endpoint: '/avm/rent/long-term',
        baseURL: this.baseUrl,
        hasApiKey: !!this.apiKey
      });

      const response = await this.client.get<RentcastPropertyResponse>('/avm/rent/long-term', {
        params: {
          address: address
        }
      });

      logger.info('RentCast API response:', {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        rentEstimate: response.data?.rentEstimate,
        confidence: response.data?.confidence
      });

      const data = response.data;
      const transformedData = this.transformPropertyData(data);
      
      logger.info('Transformed RentCast data:', {
        rentEstimate: transformedData.rentEstimate,
        confidence: transformedData.confidence,
        dataSource: transformedData.dataSource
      });
      
      return transformedData;
    } catch (error) {
      const marketError = this.createMarketDataError(error, 'getPropertyRentEstimate');
      logger.error('Failed to fetch RentCast property data:', {
        error: marketError.message,
        address,
        apiEndpoint: '/avm/rent/long-term',
        axiosError: error instanceof Error ? {
          message: error.message,
          response: (error as any).response ? {
            status: (error as any).response.status,
            statusText: (error as any).response.statusText,
            data: (error as any).response.data
          } : null
        } : null
      });
      throw marketError;
    }
  }

  /**
   * Get comparable properties for market analysis
   */
  async getComparableProperties(
    address: string, 
    radius: number = 0.5, 
    limit: number = 10
  ): Promise<ComparableProperty[]> {
    try {
      if (!this.apiKey) {
        throw new Error('RentCast API key not configured');
      }

      await this.checkRateLimit();

      logger.info(`Fetching comparable properties for: ${address}`);

      // Use the value endpoint which includes comparables
      const response = await this.client.get<RentcastComparablesResponse>('/avm/value', {
        params: {
          address: address
        }
      });

      const data = response.data;
      
      return this.transformComparables(data);
    } catch (error) {
      const marketError = this.createMarketDataError(error, 'getComparableProperties');
      logger.error('Failed to fetch comparable properties:', marketError);
      
      // Return empty array for graceful degradation
      if (marketError.retryable) {
        throw marketError;
      }
      
      logger.warn('Returning empty comparables array due to non-retryable error');
      return [];
    }
  }

  /**
   * Get market trends data for a ZIP code
   */
  async getMarketTrends(zipCode: string, rentComparables?: any[]): Promise<MarketTrendData> {
    try {
      if (!this.apiKey) {
        throw new Error('RentCast API key not configured');
      }

      await this.checkRateLimit();

      logger.info(`Fetching market trends for ZIP: ${zipCode}`);

      const response = await this.client.get<RentcastMarketDataResponse>('/markets', {
        params: {
          zipCode: zipCode
        }
      });

      const data = response.data;
      
      return this.transformMarketTrends(data, rentComparables);
    } catch (error) {
      const marketError = this.createMarketDataError(error, 'getMarketTrends');
      logger.error('Failed to fetch market trends:', marketError);
      throw marketError;
    }
  }

  /**
   * Get comprehensive market data (combines multiple endpoints)
   */
  async getComprehensiveMarketData(query: RentcastQuery): Promise<{
    property?: PropertyMarketData;
    comparables: ComparableProperty[];
    marketTrends?: MarketTrendData;
  }> {
    const results = {
      property: undefined as PropertyMarketData | undefined,
      comparables: [] as ComparableProperty[],
      marketTrends: undefined as MarketTrendData | undefined
    };

    try {
      let rentData: any = null;
      let salesData: any = null;
      let marketData: any = null;

      // Check MongoDB cache first
      const [cachedRentData, cachedSalesData, cachedMarketData] = await Promise.all([
        query.address ? cacheService.getRentCache(query.address) : Promise.resolve(null),
        query.address ? cacheService.getSalesCache(query.address) : Promise.resolve(null),
        query.zipCode ? cacheService.getMarketCache(query.zipCode) : Promise.resolve(null)
      ]);

      // Use cached data if available
      rentData = cachedRentData;
      salesData = cachedSalesData;
      marketData = cachedMarketData;

      // Only make API calls for data not in cache
      const apiCalls = [];

      // 1. Rent estimate (includes rental comparables)
      if (query.address && !rentData) {
        apiCalls.push(
          this.client.get('/avm/rent/long-term', {
            params: { address: query.address }
          }).then(async response => {
            const data = response.data;
            await cacheService.setRentCache(query.address!, data);
            return { type: 'rent', data };
          })
          .catch(error => {
            logger.warn('Failed to fetch rent data:', error);
            return { type: 'rent', data: null };
          })
        );
      }

      // 2. Sales comparables (only if we need sales data and it's not cached)
      if (query.address && !salesData) {
        apiCalls.push(
          this.client.get('/avm/value', {
            params: { address: query.address }
          }).then(async response => {
            const data = response.data;
            await cacheService.setSalesCache(query.address!, data);
            return { type: 'sales', data };
          })
          .catch(error => {
            logger.warn('Failed to fetch sales data:', error);
            return { type: 'sales', data: null };
          })
        );
      }

      // 3. Market trends (only if not cached)
      if (query.zipCode && !marketData) {
        apiCalls.push(
          this.client.get('/markets', {
            params: { zipCode: query.zipCode }
          }).then(async response => {
            const data = response.data;
            await cacheService.setMarketCache(query.zipCode!, data);
            return { type: 'market', data };
          })
          .catch(error => {
            logger.warn('Failed to fetch market data:', error);
            return { type: 'market', data: null };
          })
        );
      }

      // Execute only necessary API calls in parallel
      if (apiCalls.length > 0) {
        await this.checkRateLimit();
        const responses = await Promise.all(apiCalls);

        // Process new API responses
        for (const response of responses) {
          switch (response.type) {
            case 'rent':
              if (response.data) rentData = response.data;
              break;
            case 'sales':
              if (response.data) salesData = response.data;
              break;
            case 'market':
              if (response.data) marketData = response.data;
              break;
          }
        }
      }

      // Transform data efficiently
      if (rentData) {
        results.property = this.transformPropertyData(rentData);
      }

      // Prioritize sales comparables for property analysis (not rental comparables)
      if (salesData && salesData.comparables) {
        results.comparables = this.transformComparables(salesData);
      }
      
      // Only use rental comparables if no sales comparables are available
      if (results.comparables.length === 0 && rentData && rentData.comparables) {
        // Don't use rental comparables for sales comparison - log warning instead
        logger.warn('No sales comparables available, rental comparables cannot be used for purchase price analysis');
      }

      // Market trends using all available data
      if (marketData) {
        const rentComparables = rentData?.comparables || [];
        results.marketTrends = this.transformMarketTrends(marketData, rentComparables);
      }

      logger.info('Optimized API calls completed:', {
        rentDataAvailable: !!rentData,
        salesDataAvailable: !!salesData,
        marketDataAvailable: !!marketData,
        apiCallsMade: apiCalls.length,
        cacheHits: {
          rent: !!cachedRentData,
          sales: !!cachedSalesData,
          market: !!cachedMarketData
        },
        cacheSource: 'MongoDB'
      });

      return results;
    } catch (error) {
      logger.error('Failed to fetch comprehensive market data:', error);
      return results; // Return partial results
    }
  }

  /**
   * Transform RentCast property response to internal format
   */
  private transformPropertyData(data: any): PropertyMarketData {
    const rentEstimate = data.rent || 0;
    const rentRangeLow = data.rentRangeLow || rentEstimate * 0.9;
    const rentRangeHigh = data.rentRangeHigh || rentEstimate * 1.1;
    
    return {
      rentEstimate,
      rentRange: {
        low: rentRangeLow,
        high: rentRangeHigh
      },
      marketPosition: this.determineMarketPosition(rentEstimate),
      confidence: 80, // RentCast doesn't provide confidence, use reasonable default
      pricePerSqft: undefined, // Not provided in rent endpoint
      lastUpdated: new Date(),
      dataSource: 'RentCast'
    };
  }

  /**
   * Transform RentCast rental comparables to internal format
   */
  private transformRentalComparables(comparables: any[]): ComparableProperty[] {
    if (!comparables || !Array.isArray(comparables)) {
      return [];
    }

    return comparables
      .filter((comp: any) => comp.price && comp.price > 0)
      .map((comp: any) => ({
        address: comp.formattedAddress || comp.address,
        distance: comp.distance || 0,
        salePrice: comp.price, // This is actually rent price for rental comparables
        saleDate: comp.listedDate ? new Date(comp.listedDate) : new Date(),
        pricePerSqft: comp.squareFootage ? comp.price / comp.squareFootage : 0,
        bedrooms: comp.bedrooms || 0,
        bathrooms: comp.bathrooms || 0,
        sqft: comp.squareFootage || 0,
        daysOnMarket: comp.daysOnMarket || 0,
        propertyType: comp.propertyType || 'Unknown',
        rentEstimate: comp.price, // For rental comparables, price is the rent
        latitude: comp.latitude,
        longitude: comp.longitude,
        yearBuilt: comp.yearBuilt,
        lotSize: comp.lotSize
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, 10); // Limit to 10 comparables
  }

  /**
   * Transform RentCast sales comparables response to internal format
   */
  private transformComparables(data: any): ComparableProperty[] {
    if (!data.comparables || !Array.isArray(data.comparables)) {
      return [];
    }

    return data.comparables
      .filter((comp: any) => comp.price && comp.price > 0)
      .map((comp: any) => ({
        address: comp.formattedAddress || comp.address,
        distance: comp.distance || 0,
        salePrice: comp.price,
        saleDate: comp.listedDate ? new Date(comp.listedDate) : new Date(),
        pricePerSqft: comp.squareFootage ? comp.price / comp.squareFootage : 0,
        bedrooms: comp.bedrooms || 0,
        bathrooms: comp.bathrooms || 0,
        sqft: comp.squareFootage || 0,
        daysOnMarket: comp.daysOnMarket || 0,
        propertyType: comp.propertyType || 'Unknown',
        rentEstimate: comp.rentEstimate,
        latitude: comp.latitude,
        longitude: comp.longitude,
        yearBuilt: comp.yearBuilt,
        lotSize: comp.lotSize
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, 10); // Limit to 10 comparables
  }

  /**
   * Transform RentCast market data response to internal format
   */
  private transformMarketTrends(data: any, rentComparables?: any[]): MarketTrendData {
    const saleData = data.saleData || {};
    
    // Calculate median rent from comparables if available
    let medianRent = 0;
    let averageRent = 0;
    
    if (rentComparables && rentComparables.length > 0) {
      const validRents = rentComparables
        .map(comp => comp.price)
        .filter(rent => rent && rent > 0)
        .sort((a, b) => a - b);
        
      if (validRents.length > 0) {
        medianRent = validRents[Math.floor(validRents.length / 2)];
        averageRent = validRents.reduce((sum, rent) => sum + rent, 0) / validRents.length;
      }
    }
    
    // Use reasonable defaults if no rental data available
    if (medianRent === 0) {
      // Estimate rent based on sale prices (rough 1% rule)
      const medianSalePrice = saleData.medianPrice || 0;
      if (medianSalePrice > 0) {
        medianRent = Math.round(medianSalePrice * 0.01); // 1% of sale price as monthly rent
        averageRent = medianRent;
      } else {
        // Fallback to regional average (this prevents division by zero)
        medianRent = 2500; // Reasonable default for most markets
        averageRent = 2500;
      }
    }
    
    return {
      zipCode: data.zipCode,
      city: 'Unknown', // Not provided in the API response
      state: 'Unknown', // Not provided in the API response
      medianRent,
      averageRent,
      rentGrowthRate: 3, // Default assumption
      medianSalePrice: saleData.medianPrice || 0,
      averageSalePrice: saleData.averagePrice || saleData.medianPrice || 0,
      priceGrowthRate: 5, // Default assumption - could calculate from history
      daysOnMarket: saleData.averageDaysOnMarket || 0,
      inventoryLevel: this.determineInventoryLevel(saleData.averageDaysOnMarket || 0),
      priceToRentRatio: this.calculatePriceToRentRatio(
        saleData.medianPrice || 0,
        medianRent
      ),
      seasonalTrend: this.determineSeasonalTrend(),
      sampleSize: {
        rentals: rentComparables?.length || 0,
        sales: saleData.totalListings || 0
      },
      lastUpdated: new Date(),
      dataSource: 'RentCast'
    };
  }

  /**
   * Determine market position based on rent estimate
   */
  private determineMarketPosition(rentEstimate: number): 'Below Market' | 'At Market' | 'Above Market' {
    // This is a simplified logic - in a real implementation, you'd compare against market data
    // For now, we'll use the confidence/estimate to make a basic determination
    return 'At Market'; // Default value - this should be enhanced with actual market comparison
  }

  /**
   * Determine inventory level based on days on market
   */
  private determineInventoryLevel(daysOnMarket: number): 'Low' | 'Normal' | 'High' {
    if (daysOnMarket < 30) return 'Low';
    if (daysOnMarket > 90) return 'High';
    return 'Normal';
  }

  /**
   * Calculate price-to-rent ratio
   */
  private calculatePriceToRentRatio(medianPrice: number, medianRent: number): number {
    if (medianRent === 0) return 0;
    return medianPrice / (medianRent * 12);
  }

  /**
   * Determine seasonal trend (simplified)
   */
  private determineSeasonalTrend(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 5) return 'Spring Market - Increasing Activity';
    if (month >= 6 && month <= 8) return 'Summer Market - Peak Activity';
    if (month >= 9 && month <= 11) return 'Fall Market - Moderating Activity';
    return 'Winter Market - Lower Activity';
  }

  /**
   * Check rate limiting before making API calls
   */
  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitRemaining <= 1 && Date.now() < this.rateLimitReset) {
      const waitTime = this.rateLimitReset - Date.now();
      logger.warn(`RentCast rate limit reached. Waiting ${waitTime}ms`);
      
      if (waitTime > 60000) { // If more than 1 minute, throw error
        throw new Error('RentCast rate limit exceeded. Please try again later.');
      }
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Handle API errors and create standardized MarketDataError
   */
  private handleApiError(error: AxiosError): void {
    const status = error.response?.status;
    
    if (status === 429) {
      logger.warn('RentCast rate limit exceeded');
      this.rateLimitRemaining = 0;
      this.rateLimitReset = Date.now() + 3600000; // Reset in 1 hour
    } else if (status === 401) {
      logger.error('RentCast API authentication failed - check API key');
    } else if (status === 403) {
      logger.error('RentCast API access forbidden - check API permissions');
    }
  }

  /**
   * Create standardized MarketDataError
   */
  private createMarketDataError(error: any, method: string): MarketDataError {
    const isAxiosError = error.isAxiosError;
    const status = isAxiosError ? error.response?.status : undefined;
    const message = isAxiosError ? error.response?.data?.message || error.message : error.message;
    
    // Determine if error is retryable
    const retryable = !status || status >= 500 || status === 429;
    
    const marketError = new Error(`RentCast ${method} failed: ${message}`) as MarketDataError;
    marketError.service = 'RentCast';
    marketError.statusCode = status;
    marketError.retryable = retryable;
    marketError.originalError = error;
    
    return marketError;
  }

  /**
   * Get current rate limit status
   */
  public getRateLimitStatus() {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset,
      canMakeRequest: this.rateLimitRemaining > 0 || Date.now() >= this.rateLimitReset
    };
  }

  /**
   * Get comprehensive property details using RentCast /properties endpoint
   * Enhanced for Phase 2 - provides detailed property characteristics
   */
  async getEnhancedPropertyDetails(address: string): Promise<EnhancedPropertyData | null> {
    try {
      // Check cache first using 'market' type (property details are market data)
      const cached = await cacheService.get('market', address);
      
      if (cached) {
        logger.info('Enhanced property details retrieved from cache', { address });
        return cached;
      }

      // Check rate limiting
      await this.checkRateLimit();

      // Make API call to RentCast /properties endpoint
      const response = await this.client.get<RentcastPropertyDetailsResponse[]>('/properties', {
        params: { address: address.trim() }
      });

      if (!response.data || response.data.length === 0) {
        logger.warn('No property found in RentCast properties endpoint', { address });
        return null;
      }

      // Transform the first result to our internal format
      const propertyData = this.transformEnhancedPropertyData(response.data[0]);
      
      // Cache the result for 720 hours (30 days) using 'market' type
      await cacheService.set(
        'market',
        address,
        propertyData,
        { source: 'RentCast', address }
      );

      logger.info('Enhanced property details fetched and cached', { 
        address,
        bedrooms: propertyData.propertyDetails.bedrooms,
        bathrooms: propertyData.propertyDetails.bathrooms,
        squareFootage: propertyData.propertyDetails.squareFootage,
        confidence: propertyData.dataQuality.confidence
      });

      return propertyData;

    } catch (error) {
      const marketError = this.createMarketDataError(error, 'getEnhancedPropertyDetails');
      logger.error('Enhanced property details lookup failed', {
        address,
        error: marketError.message,
        statusCode: marketError.statusCode
      });

      // Return null for graceful degradation instead of throwing
      return null;
    }
  }

  /**
   * Transform RentCast property details to internal enhanced format
   */
  private transformEnhancedPropertyData(property: RentcastPropertyDetailsResponse): EnhancedPropertyData {
    // Calculate data completeness score
    const totalFields = 20; // Total trackable fields
    let populatedFields = 0;
    
    // Check core fields
    if (property.bedrooms) populatedFields++;
    if (property.bathrooms) populatedFields++;
    if (property.squareFootage) populatedFields++;
    if (property.lotSize) populatedFields++;
    if (property.yearBuilt) populatedFields++;
    if (property.propertyType) populatedFields++;
    if (property.lastSalePrice) populatedFields++;
    if (property.taxAssessedValue) populatedFields++;
    if (property.annualTaxAmount) populatedFields++;
    if (property.rentEstimate) populatedFields++;
    if (property.valueEstimate) populatedFields++;
    if (property.garage !== undefined) populatedFields++;
    if (property.pool !== undefined) populatedFields++;
    if (property.ac !== undefined) populatedFields++;
    if (property.heating) populatedFields++;
    if (property.cooling) populatedFields++;
    if (property.fireplace !== undefined) populatedFields++;
    if (property.basement !== undefined) populatedFields++;
    if (property.stories) populatedFields++;
    if (property.parkingSpaces) populatedFields++;

    const completeness = Math.round((populatedFields / totalFields) * 100);
    
    // Base confidence starts at 85 for RentCast data
    let confidence = 85;
    
    // Adjust confidence based on completeness
    if (completeness >= 80) confidence += 10;
    else if (completeness >= 60) confidence += 5;
    else if (completeness < 40) confidence -= 15;
    
    // Adjust confidence based on data freshness
    if (property.lastUpdated) {
      const lastUpdated = new Date(property.lastUpdated);
      const monthsOld = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld > 6) confidence -= 10;
      else if (monthsOld > 12) confidence -= 20;
    }

    return {
      address: {
        formatted: property.formattedAddress,
        standardized: {
          street: property.addressLine1,
          city: property.city,
          state: property.state,
          zipCode: property.zipCode,
          county: property.county
        },
        coordinates: {
          latitude: property.latitude,
          longitude: property.longitude
        }
      },
      propertyDetails: {
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFootage: property.squareFootage,
        lotSize: property.lotSize,
        yearBuilt: property.yearBuilt,
        stories: property.stories,
        parkingSpaces: property.parkingSpaces,
        hasGarage: property.garage || false,
        hasPool: property.pool || false,
        hasAC: property.ac || false,
        hasFireplace: property.fireplace || false,
        hasBasement: property.basement || false,
        heating: property.heating,
        cooling: property.cooling,
        flooring: property.flooring,
        roofType: property.roofType,
        exteriorWalls: property.exteriorWalls
      },
      financialData: {
        lastSalePrice: property.lastSalePrice,
        lastSaleDate: property.lastSaleDate,
        pricePerSquareFoot: property.pricePerSquareFoot,
        taxAssessedValue: property.taxAssessedValue,
        annualTaxAmount: property.annualTaxAmount,
        rentEstimate: property.rentEstimate,
        rentEstimateRange: property.rentEstimateRange,
        valueEstimate: property.valueEstimate,
        valueEstimateRange: property.valueEstimateRange
      },
      dataQuality: {
        confidence: Math.max(0, Math.min(100, confidence)),
        lastUpdated: property.lastUpdated ? new Date(property.lastUpdated) : new Date(),
        dataSource: 'RentCast Enhanced',
        completeness
      }
    };
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      if (!this.apiKey) {
        return { status: 'error', message: 'API key not configured' };
      }

      // RentCast doesn't have a health endpoint, so we'll just verify the API key exists
      // and check rate limit status
      const rateLimitStatus = this.getRateLimitStatus();
      
      if (!rateLimitStatus.canMakeRequest) {
        return { 
          status: 'degraded', 
          message: `RentCast API rate limited. Resets at ${new Date(this.rateLimitReset).toISOString()}` 
        };
      }
      
      return { status: 'healthy', message: 'RentCast API configured and ready' };
    } catch (error) {
      return { 
        status: 'error', 
        message: `RentCast health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Cache management methods - now delegated to MongoDB cache service
   */
  public async clearCache(): Promise<number> {
    return await cacheService.clearAll();
  }

  public async getCacheStatus(): Promise<{ status: string; message: string }> {
    return await cacheService.healthCheck();
  }
}

// Export singleton instance
export const rentcastService = new RentcastService();