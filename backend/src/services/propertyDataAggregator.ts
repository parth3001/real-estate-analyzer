/**
 * Property Data Aggregator Service
 * 
 * Orchestrates calls to existing cached services (FRED, RentCast) for wizard property lookup
 * Leverages existing MongoDB caching to minimize API costs
 */

import { logger } from '../utils/logger';
import { fredService } from './fredService';
import { rentcastService } from './rentcastService';
import {
  PropertyLookupRequest,
  PropertyLookupResponse,
  SmartDefaultsRequest,
  SmartDefaultsResponse,
  AddressValidationRequest,
  AddressValidationResponse
} from '../types/wizardTypes';

export class PropertyDataAggregator {
  
  /**
   * Main property lookup method - combines multiple data sources
   * Uses existing cached services to minimize API costs
   */
  async lookupProperty(request: PropertyLookupRequest): Promise<PropertyLookupResponse> {
    const startTime = Date.now();
    logger.info('Property lookup started', { address: request.address });

    const response: PropertyLookupResponse = {
      success: false,
      apiCalls: {
        successful: [],
        failed: [],
        cached: []
      },
      errors: []
    };

    try {
      // Step 1: Basic address validation and standardization
      const addressValidation = await this.validateAndStandardizeAddress(request.address);
      
      if (!addressValidation.isValid) {
        response.errors = ['Invalid address format'];
        return response;
      }

      // Step 2: Get property data from RentCast (leverages existing 1-month cache)
      const propertyData = await this.fetchRentCastPropertyData(request.address);
      
      // Step 3: Get current mortgage rates from FRED (leverages existing 30-min cache)
      const mortgageRate = await this.fetchCurrentMortgageRate();

      // Step 4: Assemble comprehensive response
      if (propertyData.success) {
        response.success = true;
        response.propertyDetails = {
          address: {
            formatted: request.address,
            standardized: addressValidation.standardizedAddress!,
            latitude: undefined, // Will be available from comparables if needed
            longitude: undefined
          },
          
          // Property characteristics from RentCast
          squareFootage: propertyData.squareFootage,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          yearBuilt: propertyData.yearBuilt,
          propertyType: propertyData.propertyType,
          
          // Financial data
          marketValue: propertyData.marketValue,
          assessedValue: propertyData.taxAssessedValue,
          annualPropertyTax: propertyData.annualTaxAmount,
          actualPropertyTaxRate: this.calculatePropertyTaxRateFromData(
            propertyData.annualTaxAmount,
            propertyData.taxAssessedValue
          ),
          
          // Data confidence tracking
          dataConfidence: {
            squareFootage: {
              score: propertyData.squareFootage ? 85 : 0,
              source: 'RentCast',
              lastUpdated: new Date()
            },
            bedrooms: {
              score: propertyData.bedrooms ? 90 : 0,
              source: 'RentCast', 
              lastUpdated: new Date()
            },
            bathrooms: {
              score: propertyData.bathrooms ? 90 : 0,
              source: 'RentCast',
              lastUpdated: new Date()
            },
            yearBuilt: {
              score: propertyData.yearBuilt ? 95 : 0,
              source: 'RentCast',
              lastUpdated: new Date()
            },
            currentMortgageRate: {
              score: 100,
              source: 'FRED',
              lastUpdated: new Date()
            }
          }
        };

        // Add rent estimate if available
        if (propertyData.rentEstimate) {
          response.rentEstimate = {
            monthlyRent: propertyData.rentEstimate.value,
            range: propertyData.rentEstimate.range,
            confidence: propertyData.rentEstimate.confidence,
            marketPosition: propertyData.rentEstimate.marketPosition
          };
        }

        // Note: Comparables and market data are not included in the enhanced property data
        // These would need to be fetched separately from the existing comprehensive market data method
        // For now, we'll focus on the core property details

        // Track successful API calls
        response.apiCalls.successful = propertyData.apiCalls.successful;
        response.apiCalls.cached = propertyData.apiCalls.cached;
        
        logger.info('Property lookup completed successfully', {
          address: request.address,
          duration: Date.now() - startTime,
          dataQuality: this.calculateDataQuality(response),
          apiCallsSuccessful: response.apiCalls.successful.length,
          apiCallsCached: response.apiCalls.cached.length
        });
      } else {
        response.errors = propertyData.errors || ['Property data not found'];
        response.apiCalls.failed = propertyData.apiCalls.failed;
      }

    } catch (error) {
      logger.error('Property lookup failed', { 
        address: request.address, 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
      
      response.errors = [error instanceof Error ? error.message : 'Unknown error occurred'];
    }

    return response;
  }

  /**
   * Get smart defaults based on location and property type
   * Uses existing FRED service for economic data
   */
  async getSmartDefaults(request: SmartDefaultsRequest): Promise<SmartDefaultsResponse> {
    logger.info('Fetching smart defaults', { zipCode: request.zipCode, propertyType: request.propertyType });

    try {
      // Get current economic indicators from FRED (cached)
      const economicData = await fredService.getEconomicIndicators();
      
      // Get regional market data from RentCast if available (cached)
      let regionalData = null;
      try {
        regionalData = await rentcastService.getMarketTrends(request.zipCode);
      } catch (error) {
        logger.warn('Regional data not available for smart defaults', { zipCode: request.zipCode });
      }

      // Calculate smart defaults based on property type and location
      const defaults = this.calculateLocationBasedDefaults(
        request.propertyType,
        request.zipCode,
        economicData,
        regionalData
      );

      return {
        success: true,
        defaults,
        regionalContext: {
          marketType: this.determineMarketType(regionalData),
          investmentTiming: this.determineInvestmentTiming(economicData),
          keyFactors: this.getKeyMarketFactors(economicData, regionalData)
        }
      };

    } catch (error) {
      logger.error('Failed to fetch smart defaults', { 
        zipCode: request.zipCode, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        defaults: this.getDefaultAssumptions(request.propertyType),
        errors: [error instanceof Error ? error.message : 'Failed to fetch smart defaults']
      };
    }
  }

  /**
   * Validate and standardize address format
   */
  private async validateAndStandardizeAddress(address: string): Promise<AddressValidationResponse> {
    // Basic address validation for Phase 1
    // In Phase 2, this would integrate with address validation APIs
    
    const addressParts = address.split(',').map(part => part.trim());
    
    if (addressParts.length < 2) {
      return {
        success: false,
        isValid: false,
        errors: ['Address must include street and city']
      };
    }

    // Simple standardization
    const standardized = {
      street: addressParts[0] || '',
      city: addressParts[1] || '',
      state: addressParts[2] || '',
      zipCode: addressParts[3] || '',
      formattedAddress: address
    };

    return {
      success: true,
      isValid: true,
      standardizedAddress: standardized
    };
  }

  /**
   * Fetch property data from RentCast using enhanced property details (Phase 2)
   */
  private async fetchRentCastPropertyData(address: string) {
    try {
      // Use enhanced RentCast service to get comprehensive property details
      const enhancedPropertyData = await rentcastService.getEnhancedPropertyDetails(address);

      if (!enhancedPropertyData) {
        logger.warn('No enhanced property data found from RentCast', { address });
        return { success: false, apiCalls: { successful: [], failed: ['RentCast'], cached: [] } };
      }

      logger.info('Enhanced RentCast data retrieved', {
        address,
        bedrooms: enhancedPropertyData.propertyDetails.bedrooms,
        bathrooms: enhancedPropertyData.propertyDetails.bathrooms,
        squareFootage: enhancedPropertyData.propertyDetails.squareFootage,
        confidence: enhancedPropertyData.dataQuality.confidence
      });

      return {
        success: true,
        // Property characteristics from enhanced data
        squareFootage: enhancedPropertyData.propertyDetails.squareFootage,
        bedrooms: enhancedPropertyData.propertyDetails.bedrooms,
        bathrooms: enhancedPropertyData.propertyDetails.bathrooms,
        yearBuilt: enhancedPropertyData.propertyDetails.yearBuilt,
        propertyType: enhancedPropertyData.propertyDetails.propertyType,
        lotSize: enhancedPropertyData.propertyDetails.lotSize,
        
        // Financial data
        marketValue: enhancedPropertyData.financialData.valueEstimate || 
                    enhancedPropertyData.financialData.taxAssessedValue,
        lastSalePrice: enhancedPropertyData.financialData.lastSalePrice,
        taxAssessedValue: enhancedPropertyData.financialData.taxAssessedValue,
        annualTaxAmount: enhancedPropertyData.financialData.annualTaxAmount,
        
        // Rental data
        rentEstimate: enhancedPropertyData.financialData.rentEstimate ? {
          value: enhancedPropertyData.financialData.rentEstimate,
          range: enhancedPropertyData.financialData.rentEstimateRange ? {
            low: (enhancedPropertyData.financialData.rentEstimateRange as any).min || 
                 (enhancedPropertyData.financialData.rentEstimateRange as any).low,
            high: (enhancedPropertyData.financialData.rentEstimateRange as any).max || 
                  (enhancedPropertyData.financialData.rentEstimateRange as any).high
          } : {
            low: enhancedPropertyData.financialData.rentEstimate * 0.9,
            high: enhancedPropertyData.financialData.rentEstimate * 1.1
          },
          confidence: enhancedPropertyData.dataQuality.confidence,
          marketPosition: 'At Market' as const // Default - can be enhanced later
        } : undefined,
        
        // Property features
        propertyFeatures: {
          hasGarage: enhancedPropertyData.propertyDetails.hasGarage,
          hasPool: enhancedPropertyData.propertyDetails.hasPool,
          hasAC: enhancedPropertyData.propertyDetails.hasAC,
          hasFireplace: enhancedPropertyData.propertyDetails.hasFireplace,
          hasBasement: enhancedPropertyData.propertyDetails.hasBasement,
          stories: enhancedPropertyData.propertyDetails.stories,
          parkingSpaces: enhancedPropertyData.propertyDetails.parkingSpaces,
          heating: enhancedPropertyData.propertyDetails.heating,
          cooling: enhancedPropertyData.propertyDetails.cooling
        },
        
        // Data quality metrics
        dataQuality: {
          confidence: enhancedPropertyData.dataQuality.confidence,
          completeness: enhancedPropertyData.dataQuality.completeness,
          lastUpdated: enhancedPropertyData.dataQuality.lastUpdated,
          dataSource: enhancedPropertyData.dataQuality.dataSource
        },
        
        // Location data
        coordinates: enhancedPropertyData.address.coordinates,
        
        apiCalls: {
          successful: ['RentCast Enhanced'],
          failed: [],
          cached: ['RentCast'] // Likely cached due to existing caching strategy
        }
      };

    } catch (error) {
      logger.warn('Enhanced RentCast lookup failed', { address, error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Property lookup failed'],
        apiCalls: {
          successful: [],
          failed: ['RentCast'],
          cached: []
        }
      };
    }
  }

  /**
   * Get current mortgage rate from FRED using existing cached service
   */
  private async fetchCurrentMortgageRate(): Promise<number> {
    try {
      // Use existing FRED service with caching
      const currentRate = await fredService.getCurrentMortgageRate();
      logger.info('Current mortgage rate retrieved from FRED', { rate: currentRate });
      return currentRate;
    } catch (error) {
      logger.warn('Failed to fetch mortgage rate from FRED, using default', { error });
      return 7.5; // Default fallback
    }
  }

  /**
   * Calculate location-based defaults using economic and regional data
   */
  private calculateLocationBasedDefaults(
    propertyType: 'SFR' | 'MF',
    zipCode: string,
    economicData: any,
    regionalData: any
  ) {
    // Base defaults for investment properties
    const baseDefaults = {
      downPaymentPercentage: propertyType === 'SFR' ? 25 : 25, // 25% for investment properties
      closingCostPercentage: 2.5, // National average
      currentMortgageRate: economicData.currentMortgageRate || 7.5,
      
      // Regional variations
      managementFeePercentage: this.getRegionalManagementFee(zipCode),
      maintenanceReservePercentage: propertyType === 'SFR' ? 5 : 7,
      vacancyRatePercentage: regionalData?.medianRent ? 4 : 5,
      
      // Economic data from FRED
      appreciationRate: Math.max(2, economicData.housingIndexChange || 3),
      rentGrowthRate: Math.max(2, economicData.inflationRate || 3),
      inflationRate: economicData.inflationRate || 2.5,
      
      // Tax and insurance estimates (will enhance in Phase 2)
      propertyTaxRate: this.getRegionalPropertyTaxRate(zipCode),
      insuranceRate: this.getRegionalInsuranceRate(zipCode),
      
      dataSources: {
        economic: 'FRED',
        market: regionalData ? 'RentCast' : 'defaults',
        regional: 'estimates'
      },
      
      confidence: {
        economic: 95, // FRED data is highly reliable
        market: regionalData ? 80 : 60,
        regional: 70
      },
      
      lastUpdated: new Date()
    };

    return baseDefaults;
  }

  /**
   * Helper methods for regional estimates
   */
  private getRegionalManagementFee(zipCode: string): number {
    // Basic regional estimates - will enhance with real data in Phase 2
    const state = zipCode.substring(0, 2);
    const highCostStates = ['90', '94', '10', '11', '20', '02']; // CA, NY, DC, MA approximations
    return highCostStates.includes(state) ? 10 : 8;
  }

  private getRegionalPropertyTaxRate(zipCode: string): number {
    // Basic estimates by region - will enhance in Phase 2
    const state = zipCode.substring(0, 2);
    const highTaxStates = ['07', '60', '10']; // NJ, IL, NY approximations
    return highTaxStates.includes(state) ? 2.5 : 1.2;
  }

  private getRegionalInsuranceRate(zipCode: string): number {
    // Basic estimates - will enhance in Phase 2
    const state = zipCode.substring(0, 2);
    const highRiskStates = ['33', '34', '77', '32']; // FL, TX, LA approximations
    return highRiskStates.includes(state) ? 1.2 : 0.7;
  }

  /**
   * Market analysis helper methods
   */
  private determineMarketType(regionalData: any): 'Hot' | 'Balanced' | 'Cold' {
    if (!regionalData) return 'Balanced';
    
    const daysOnMarket = regionalData.daysOnMarket || 60;
    if (daysOnMarket < 30) return 'Hot';
    if (daysOnMarket > 90) return 'Cold';
    return 'Balanced';
  }

  private determineInvestmentTiming(economicData: any): 'Favorable' | 'Neutral' | 'Challenging' {
    const mortgageRateTrend = economicData.mortgageRateTrend || 'Stable';
    const inflationRate = economicData.inflationRate || 3;
    
    if (mortgageRateTrend === 'Falling' && inflationRate > 2) return 'Favorable';
    if (mortgageRateTrend === 'Rising' && inflationRate > 4) return 'Challenging';
    return 'Neutral';
  }

  private getKeyMarketFactors(economicData: any, regionalData: any): string[] {
    const factors = [];
    
    if (economicData.mortgageRateTrend === 'Rising') {
      factors.push('Rising interest rates may affect affordability');
    }
    
    if (regionalData?.daysOnMarket < 30) {
      factors.push('Fast-moving market with high demand');
    }
    
    if (economicData.inflationRate > 4) {
      factors.push('High inflation environment favors real assets');
    }
    
    return factors.length > 0 ? factors : ['Market conditions appear stable'];
  }

  /**
   * Fallback defaults when API data is unavailable
   */
  private getDefaultAssumptions(propertyType: 'SFR' | 'MF') {
    return {
      downPaymentPercentage: 25,
      closingCostPercentage: 2.5,
      currentMortgageRate: 7.5,
      managementFeePercentage: 8,
      maintenanceReservePercentage: propertyType === 'SFR' ? 5 : 7,
      vacancyRatePercentage: 5,
      appreciationRate: 3,
      rentGrowthRate: 3,
      inflationRate: 2.5,
      propertyTaxRate: 1.2,
      insuranceRate: 0.7,
      dataSources: {
        economic: 'defaults',
        market: 'defaults', 
        regional: 'defaults'
      },
      confidence: {
        economic: 50,
        market: 50,
        regional: 50
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate actual property tax rate from RentCast data
   */
  private calculatePropertyTaxRateFromData(annualTaxAmount?: number, taxAssessedValue?: number): number | null {
    if (!annualTaxAmount || !taxAssessedValue || taxAssessedValue === 0) {
      return null; // Can't calculate without both values
    }
    
    // Calculate tax rate as percentage: (annual tax / assessed value) * 100
    const taxRate = (annualTaxAmount / taxAssessedValue) * 100;
    
    // Round to 2 decimal places and ensure reasonable bounds
    const roundedRate = Math.round(taxRate * 100) / 100;
    
    // Sanity check: tax rates should be between 0.1% and 10%
    if (roundedRate < 0.1 || roundedRate > 10) {
      logger.warn('Calculated tax rate seems unreasonable', {
        taxRate: roundedRate,
        annualTaxAmount,
        taxAssessedValue
      });
      return null;
    }
    
    logger.info('Real property tax rate calculated from RentCast data', {
      taxRate: roundedRate,
      annualTaxAmount,
      taxAssessedValue
    });
    
    return roundedRate;
  }

  /**
   * Calculate overall data quality score
   */
  private calculateDataQuality(response: PropertyLookupResponse): number {
    if (!response.propertyDetails?.dataConfidence) return 0;
    
    const confidenceScores = Object.values(response.propertyDetails.dataConfidence)
      .map(conf => conf.score)
      .filter(score => score > 0);
    
    if (confidenceScores.length === 0) return 0;
    
    return Math.round(confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length);
  }
}

// Export singleton instance
export const propertyDataAggregator = new PropertyDataAggregator();