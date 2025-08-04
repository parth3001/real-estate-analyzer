import { logger } from '../utils/logger';
import { rentcastService } from './rentcastService';
import { censusService } from './censusService';
import { cacheService } from './cacheService';

interface RentEstimate {
  value: number;
  confidence: {
    score: number;
    source: string;
    reliability: 'high' | 'medium' | 'low';
  };
  range: {
    low: number;
    high: number;
  };
  breakdown: {
    baseRentPerSqft: number;
    adjustments: {
      bedrooms: number;
      yearBuilt: number;
      marketFactor: number;
    };
    capByValueRule: number;
  };
}

interface PropertyDetails {
  address: string;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  zipCode?: string;
}

export class RentEstimationService {
  private static readonly CACHE_TTL = 120 * 24 * 60 * 60 * 1000; // 120 days
  private static readonly DEFAULT_RENT_PER_SQFT = 1.2;
  private static readonly DEFAULT_AVG_SQFT = 1500;

  /**
   * Generate smart rent estimate using RentCast + Census data
   */
  async generateSmartRentEstimate(
    propertyDetails: PropertyDetails
  ): Promise<RentEstimate> {
    const cacheKey = `rent_estimate_${propertyDetails.address}_${propertyDetails.squareFootage}`;
    
    try {
      // Check cache first
      const cached = await cacheService.get('rent', cacheKey);
      if (cached) {
        logger.info(`Rent estimate cache hit for: ${propertyDetails.address}`);
        return cached;
      }

      logger.info(`Generating rent estimate for: ${propertyDetails.address}`);
      
      const estimate = await this.calculateRentEstimate(propertyDetails);
      
      // Cache the result
      await cacheService.set('rent', cacheKey, estimate, {
        address: propertyDetails.address,
        zipCode: propertyDetails.zipCode,
        source: 'rent_estimation'
      });
      
      return estimate;
    } catch (error) {
      logger.error('Error generating rent estimate:', error);
      return this.getFallbackEstimate(propertyDetails);
    }
  }

  private async calculateRentEstimate(propertyDetails: PropertyDetails): Promise<RentEstimate> {
    const breakdown = {
      baseRentPerSqft: RentEstimationService.DEFAULT_RENT_PER_SQFT,
      adjustments: {
        bedrooms: 0,
        yearBuilt: 0,
        marketFactor: 0
      },
      capByValueRule: 0
    };

    // Step 1: Get base rent per sqft from multiple sources
    const baseRentPerSqft = await this.getBaseRentPerSqft(propertyDetails);
    breakdown.baseRentPerSqft = baseRentPerSqft;

    // Step 2: Calculate base rent
    const squareFootage = propertyDetails.squareFootage || RentEstimationService.DEFAULT_AVG_SQFT;
    let estimatedRent = squareFootage * baseRentPerSqft;

    // Step 3: Apply bedroom adjustment
    if (propertyDetails.bedrooms && propertyDetails.bedrooms > 3) {
      const bedroomBonus = (propertyDetails.bedrooms - 3) * 150;
      breakdown.adjustments.bedrooms = bedroomBonus;
      estimatedRent += bedroomBonus;
    }

    // Step 4: Apply year built adjustment
    if (propertyDetails.yearBuilt) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - propertyDetails.yearBuilt;
      
      if (age < 10) {
        // New construction premium
        const premium = estimatedRent * 0.05;
        breakdown.adjustments.yearBuilt = premium;
        estimatedRent += premium;
      } else if (age > 40) {
        // Older property discount
        const discount = estimatedRent * -0.05;
        breakdown.adjustments.yearBuilt = discount;
        estimatedRent += discount;
      }
    }

    // Step 5: Apply market factor from RentCast comparables
    const marketFactor = await this.getMarketFactor(propertyDetails);
    if (marketFactor !== 1) {
      const adjustment = estimatedRent * (marketFactor - 1);
      breakdown.adjustments.marketFactor = adjustment;
      estimatedRent += adjustment;
    }

    // Step 6: Apply 1% rule cap (rent shouldn't exceed 1% of property value monthly)
    const propertyValue = await this.getPropertyValue(propertyDetails);
    if (propertyValue) {
      const onePercentRule = propertyValue * 0.01;
      if (estimatedRent > onePercentRule) {
        breakdown.capByValueRule = onePercentRule - estimatedRent;
        estimatedRent = onePercentRule;
      }
    }

    // Step 7: Calculate confidence score
    const confidence = this.calculateConfidence(propertyDetails, propertyValue !== null);

    // Step 8: Generate range (±10%)
    const range = {
      low: Math.round(estimatedRent * 0.9),
      high: Math.round(estimatedRent * 1.1)
    };

    return {
      value: Math.round(estimatedRent),
      confidence,
      range,
      breakdown
    };
  }

  private async getBaseRentPerSqft(propertyDetails: PropertyDetails): Promise<number> {
    try {
      // Try to get census median rent for the area
      if (propertyDetails.zipCode) {
        const censusData = await censusService.getHousingData({ 
          zip: propertyDetails.zipCode 
        });
        
        if (censusData?.medianRent && censusData.medianRent > 0) {
          // Convert median rent to per sqft (assuming average unit size)
          const medianRentPerSqft = censusData.medianRent / RentEstimationService.DEFAULT_AVG_SQFT;
          logger.info(`Using Census median rent: $${censusData.medianRent} = $${medianRentPerSqft.toFixed(2)}/sqft`);
          return medianRentPerSqft;
        }
      }

      // Try to get RentCast market data
      try {
        const rentcastData = await rentcastService.getPropertyRentEstimate(propertyDetails.address);
        if (rentcastData?.rentEstimate && rentcastData.rentEstimate > 0) {
          const rentcastPerSqft = rentcastData.rentEstimate / RentEstimationService.DEFAULT_AVG_SQFT;
          logger.info(`Using RentCast estimate: $${rentcastData.rentEstimate} = $${rentcastPerSqft.toFixed(2)}/sqft`);
          return rentcastPerSqft;
        }
      } catch (error) {
        logger.warn('RentCast property estimate not available:', error);
      }

      logger.warn('No market data available, using default rent per sqft');
      return RentEstimationService.DEFAULT_RENT_PER_SQFT;
    } catch (error) {
      logger.error('Error getting base rent per sqft:', error);
      return RentEstimationService.DEFAULT_RENT_PER_SQFT;
    }
  }

  private async getMarketFactor(propertyDetails: PropertyDetails): Promise<number> {
    try {
      // Get comparable properties from RentCast
      const comparables = await rentcastService.getComparableProperties(propertyDetails.address);
      
      if (comparables && comparables.length > 0) {
        // Calculate average rent per sqft from comparables
        const validComps = comparables.filter(comp => {
          // Check if comparable has rent estimate and square footage
          return comp.rentEstimate && comp.sqft && comp.sqft > 0;
        });
        
        if (validComps.length > 0) {
          const avgCompRentPerSqft = validComps.reduce((sum, comp) => {
            return sum + (comp.rentEstimate! / comp.sqft);
          }, 0) / validComps.length;

          // Compare to our base calculation
          const currentRentPerSqft = RentEstimationService.DEFAULT_RENT_PER_SQFT;
          
          const marketFactor = avgCompRentPerSqft / currentRentPerSqft;
          logger.info(`Market factor from ${validComps.length} comparables: ${marketFactor.toFixed(2)}`);
          
          // Cap adjustment at ±25%
          return Math.max(0.75, Math.min(1.25, marketFactor));
        }
      }

      return 1; // No adjustment
    } catch (error) {
      logger.error('Error calculating market factor:', error);
      return 1;
    }
  }

  private async getPropertyValue(propertyDetails: PropertyDetails): Promise<number | null> {
    try {
      // Try to get property value from RentCast comparables
      const comparables = await rentcastService.getComparableProperties(propertyDetails.address);
      if (comparables && comparables.length > 0) {
        // Use average of comparable sales prices as estimate
        const validComps = comparables.filter(comp => comp.salePrice && comp.salePrice > 0);
        if (validComps.length > 0) {
          const avgPrice = validComps.reduce((sum, comp) => sum + comp.salePrice, 0) / validComps.length;
          logger.info(`Estimated property value from ${validComps.length} comparables: $${avgPrice}`);
          return avgPrice;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting property value:', error);
      return null;
    }
  }

  private calculateConfidence(propertyDetails: PropertyDetails, hasPropertyValue: boolean): {
    score: number;
    source: string;
    reliability: 'high' | 'medium' | 'low';
  } {
    let score = 50; // Base score
    let sources: string[] = [];

    // Increase confidence based on available data
    if (propertyDetails.squareFootage) {
      score += 15;
      sources.push('Square Footage');
    }
    
    if (propertyDetails.bedrooms) {
      score += 10;
      sources.push('Bedrooms');
    }
    
    if (propertyDetails.yearBuilt) {
      score += 10;
      sources.push('Year Built');
    }
    
    if (hasPropertyValue) {
      score += 15;
      sources.push('Property Value');
    }

    // Determine reliability
    let reliability: 'high' | 'medium' | 'low';
    if (score >= 80) {
      reliability = 'high';
    } else if (score >= 60) {
      reliability = 'medium';
    } else {
      reliability = 'low';
    }

    const source = sources.length > 0 
      ? `Market Analysis (${sources.join(', ')})` 
      : 'Regional Estimates';

    return { score, source, reliability };
  }

  private getFallbackEstimate(propertyDetails: PropertyDetails): RentEstimate {
    const squareFootage = propertyDetails.squareFootage || RentEstimationService.DEFAULT_AVG_SQFT;
    const fallbackRent = squareFootage * RentEstimationService.DEFAULT_RENT_PER_SQFT;

    return {
      value: Math.round(fallbackRent),
      confidence: {
        score: 30,
        source: 'Fallback Estimation',
        reliability: 'low'
      },
      range: {
        low: Math.round(fallbackRent * 0.8),
        high: Math.round(fallbackRent * 1.2)
      },
      breakdown: {
        baseRentPerSqft: RentEstimationService.DEFAULT_RENT_PER_SQFT,
        adjustments: {
          bedrooms: 0,
          yearBuilt: 0,
          marketFactor: 0
        },
        capByValueRule: 0
      }
    };
  }
}

// Export singleton instance
export const rentEstimationService = new RentEstimationService();