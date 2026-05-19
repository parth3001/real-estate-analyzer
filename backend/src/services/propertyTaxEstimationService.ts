import { logger } from '../utils/logger';
import { rentcastService } from './rentcastService';
import { cacheService } from './cacheService';
import { assessmentRatioService } from './assessmentRatioService';

interface PropertyTaxEstimate {
  annualTaxAmount: number;
  effectiveTaxRate: number; // percentage
  confidence: {
    score: number; // 0-100
    source: string;
    reliability: 'high' | 'medium' | 'low';
    factors: string[];
  };
  breakdown: {
    purchasePrice: number;
    estimatedAssessmentRatio: number; // typical assessment to market value ratio
    estimatedAssessedValue: number;
    appliedTaxRate: number;
  };
  sourceData?: {
    address: string;
    taxAssessedValue: number;
    annualTaxAmount: number;
    calculatedRate: number;
  };
}

interface PropertyTaxRequest {
  address: string;
  purchasePrice: number;
  zipCode?: string;
  county?: string;
  state?: string;
}

export class PropertyTaxEstimationService {
  private static readonly CACHE_TTL = 120 * 24 * 60 * 60 * 1000; // 120 days
  private static readonly DEFAULT_TAX_RATE = 1.2; // 1.2% fallback
  
  // State-specific average effective tax rates (on market value)
  // Source: Tax Foundation, Lincoln Institute of Land Policy
  private static readonly STATE_AVG_TAX_RATES: Record<string, number> = {
    'AL': 0.41, 'AK': 1.19, 'AZ': 0.66, 'AR': 0.62, 'CA': 0.73,
    'CO': 0.51, 'CT': 2.14, 'DE': 0.57, 'FL': 0.89, 'GA': 0.92,
    'HI': 0.28, 'ID': 0.69, 'IL': 2.27, 'IN': 0.85, 'IA': 1.57,
    'KS': 1.41, 'KY': 0.86, 'LA': 0.55, 'ME': 1.36, 'MD': 1.09,
    'MA': 1.23, 'MI': 1.54, 'MN': 1.12, 'MS': 0.81, 'MO': 0.97,
    'MT': 0.84, 'NE': 1.73, 'NV': 0.60, 'NH': 2.18, 'NJ': 2.49,
    'NM': 0.80, 'NY': 1.72, 'NC': 0.84, 'ND': 0.98, 'OH': 1.56,
    'OK': 0.90, 'OR': 0.97, 'PA': 1.58, 'RI': 1.63, 'SC': 0.57,
    'SD': 1.31, 'TN': 0.71, 'TX': 1.80, 'UT': 0.63, 'VT': 1.90,
    'VA': 0.82, 'WA': 0.98, 'WV': 0.59, 'WI': 1.85, 'WY': 0.61
  };
  
  // Assessment ratios now come from database - this fallback is only used if DB is unavailable
  private static readonly FALLBACK_ASSESSMENT_RATIOS: Record<string, number> = {
    'DEFAULT': 1.0 // Most states assess at market value
  };

  /**
   * Generate intelligent property tax estimate using RentCast historical tax data
   */
  async generatePropertyTaxEstimate(
    request: PropertyTaxRequest
  ): Promise<PropertyTaxEstimate> {
    const cacheKey = `tax_estimate_${request.address}_${request.purchasePrice}`;
    
    try {
      // Check cache first
      const cached = await cacheService.get('rent', cacheKey);
      if (cached) {
        logger.info(`Property tax estimate cache hit for: ${request.address}`);
        return cached;
      }

      logger.info(`Generating property tax estimate for: ${request.address}`);
      
      const estimate = await this.calculateTaxEstimate(request);
      
      // Cache the result
      await cacheService.set('rent', cacheKey, estimate, {
        address: request.address,
        zipCode: request.zipCode,
        source: 'property_tax_estimation'
      });
      
      return estimate;
    } catch (error) {
      logger.error('Error generating property tax estimate:', error);
      return await this.getFallbackEstimate(request);
    }
  }

  private async calculateTaxEstimate(request: PropertyTaxRequest): Promise<PropertyTaxEstimate> {
    let confidence = {
      score: 40, // Base confidence
      source: 'Regional Estimate',
      reliability: 'low' as 'high' | 'medium' | 'low',
      factors: [] as string[]
    };

    // Step 1: Try to get tax data from RentCast for the exact property
    const propertyTaxData = await this.getPropertyTaxData(request.address);

    // Day 11c (2026-05-18) — Issue B fix: when nothing better is found,
    // FALL BACK TO THE STATE AVERAGE (not the national 1.2%). Texas
    // is 1.80%, NJ 2.49%, IL 2.27%, etc. — the national default
    // materially underestimated cash flow for high-tax states.
    // Detail: a user testing in Anna TX saw 1.2% in their analysis;
    // actual TX average is 1.80%. Difference = ~$160/month on a
    // $275K property, which can flip a deal's cash-flow signal.
    const stateAvgRate =
      (request.state &&
        PropertyTaxEstimationService.STATE_AVG_TAX_RATES[
          request.state.toUpperCase()
        ]) ||
      PropertyTaxEstimationService.DEFAULT_TAX_RATE;
    let effectiveTaxRate = stateAvgRate;
    let sourceData: PropertyTaxEstimate['sourceData'] | undefined;

    // Track that we started with state-avg so downstream confidence
    // reasoning can reflect the source. If a more-specific data source
    // (RentCast property tax, regional comps, official assessment
    // ratio) overrides this, that source's confidence will be set
    // explicitly below.
    if (
      request.state &&
      PropertyTaxEstimationService.STATE_AVG_TAX_RATES[
        request.state.toUpperCase()
      ]
    ) {
      confidence.source = `State Average (${request.state.toUpperCase()})`;
      confidence.factors.push(
        `State-average tax rate for ${request.state.toUpperCase()}: ${stateAvgRate.toFixed(2)}%`
      );
    }

    if (propertyTaxData) {
      // We have actual tax data for this property!
      effectiveTaxRate = propertyTaxData.calculatedRate;
      sourceData = propertyTaxData;
      confidence.score = 85;
      confidence.source = 'Property-Specific Tax Records';
      confidence.reliability = 'high';
      confidence.factors.push('Exact property tax history available');
      
      logger.info('Using property-specific tax data', {
        address: request.address,
        assessedValue: propertyTaxData.taxAssessedValue,
        annualTax: propertyTaxData.annualTaxAmount,
        calculatedRate: propertyTaxData.calculatedRate
      });
    } else {
      // Step 2: Try to get regional data from nearby comparable properties
      const regionalRate = await this.getRegionalTaxRate(request);
      if (regionalRate) {
        effectiveTaxRate = regionalRate.rate;
        confidence.score = 65;
        confidence.source = `Regional Analysis (${regionalRate.sampleSize} properties)`;
        confidence.reliability = 'medium';
        confidence.factors.push(`Based on ${regionalRate.sampleSize} comparable properties`);
      } else {
        confidence.factors.push('No local tax data available');
      }
    }

    // Step 3: Get assessment ratio using three-tier logic (property → county → state)
    const assessmentRatioResult = await this.getAssessmentRatio(request);
    
    // Step 4: Use hybrid validation tax rate if available (takes priority over regional analysis)
    if (assessmentRatioResult.taxRate) {
      effectiveTaxRate = assessmentRatioResult.taxRate;
      
      // Update confidence based on hybrid validation source
      if (assessmentRatioResult.source === 'county-validated' || assessmentRatioResult.source === 'state-validated') {
        confidence.score = Math.max(confidence.score, 85);
        confidence.source = 'Hybrid Validation (Official Ratio + RentCast Data)';
        confidence.reliability = 'high';
        confidence.factors.push(`Official ${assessmentRatioResult.source.includes('county') ? 'county' : 'state'} assessment ratio validated with property tax data`);
      } else if (assessmentRatioResult.source === 'county-official' || assessmentRatioResult.source === 'state-official') {
        confidence.score = Math.max(confidence.score, 75);
        confidence.source = `Official ${assessmentRatioResult.source.includes('county') ? 'County' : 'State'} Assessment Ratio`;
        confidence.reliability = 'high';
        confidence.factors.push(`Official ${assessmentRatioResult.source.includes('county') ? 'county' : 'state'} assessment ratio: ${Math.round(assessmentRatioResult.ratio * 100)}%`);
      }
      
      logger.info('Using hybrid validation tax rate', {
        source: assessmentRatioResult.source,
        taxRate: effectiveTaxRate,
        confidence: confidence.score
      });
    } else {
      // Fallback to updating confidence based on assessment ratio source only
      if (assessmentRatioResult.source === 'county-official') {
        confidence.score += 10;
        confidence.factors.push(`County-specific assessment ratio: ${Math.round(assessmentRatioResult.ratio * 100)}%`);
      } else if (assessmentRatioResult.source === 'state-official') {
        confidence.score += 5;
        confidence.factors.push(`Official state assessment ratio: ${Math.round(assessmentRatioResult.ratio * 100)}%`);
      } else {
        confidence.factors.push(`Using fallback assessment ratio: ${Math.round(assessmentRatioResult.ratio * 100)}%`);
      }
    }
    
    const estimatedAssessedValue = request.purchasePrice * assessmentRatioResult.ratio;
    const annualTaxAmount = estimatedAssessedValue * (effectiveTaxRate / 100);

    const breakdown = {
      purchasePrice: request.purchasePrice,
      estimatedAssessmentRatio: assessmentRatioResult.ratio,
      estimatedAssessedValue,
      appliedTaxRate: effectiveTaxRate
    };

    // Step 4: Adjust confidence based on data quality
    if (request.county) {
      confidence.score += 5;
      confidence.factors.push('County specified for better regional accuracy');
    }

    return {
      annualTaxAmount: Math.round(annualTaxAmount),
      effectiveTaxRate,
      confidence,
      breakdown,
      sourceData
    };
  }

  /**
   * Get assessment ratio using enhanced validation logic:
   * 1. Get official ratio (county → state → fallback)
   * 2. Cross-validate with RentCast data
   * 3. Use most reliable source
   */
  private async getAssessmentRatio(request: PropertyTaxRequest): Promise<{
    ratio: number;
    source: 'county-validated' | 'state-validated' | 'county-official' | 'state-official' | 'rentcast-fallback' | 'fallback';
    confidence: number;
    taxRate?: number;
  }> {
    try {
      const state = request.state?.toUpperCase();
      const county = request.county;

      if (!state) {
        return {
          ratio: PropertyTaxEstimationService.FALLBACK_ASSESSMENT_RATIOS['DEFAULT'],
          source: 'fallback',
          confidence: 30
        };
      }

      // Get RentCast property tax data for validation
      const rentcastTaxData = await this.getPropertyTaxData(request.address);
      
      logger.info('RentCast tax data availability', {
        address: request.address,
        hasRentCastData: !!rentcastTaxData,
        taxData: rentcastTaxData ? {
          assessedValue: rentcastTaxData.taxAssessedValue,
          annualTax: rentcastTaxData.annualTaxAmount,
          calculatedRate: rentcastTaxData.calculatedRate
        } : null
      });

      // Step 1: Get official assessment ratio (county → state → fallback)
      let officialRatio: { ratio: number; source: string; confidence: number } | null = null;

      // Try county-specific first
      if (county) {
        const countyRatio = await assessmentRatioService.getAssessmentRatio({
          state,
          county
        });

        if (countyRatio && countyRatio.confidence.score >= 70) {
          officialRatio = {
            ratio: countyRatio.ratio,
            source: 'county',
            confidence: countyRatio.confidence.score
          };
        }
      }

      // Try state-level if no county data
      if (!officialRatio) {
        const stateRatio = await assessmentRatioService.getAssessmentRatio({
          state
        });

        if (stateRatio && stateRatio.confidence.score >= 60) {
          officialRatio = {
            ratio: stateRatio.ratio,
            source: 'state',
            confidence: stateRatio.confidence.score
          };
        }
      }

      // Step 2: Cross-validate with RentCast data if available
      if (officialRatio && rentcastTaxData && request.purchasePrice) {
        const validationResult = await this.validateWithRentCast(
          officialRatio,
          rentcastTaxData,
          request.purchasePrice
        );

        if (validationResult.isValid) {
          logger.info('Official ratio validated with RentCast data', {
            state,
            county,
            officialRatio: officialRatio.ratio,
            impliedTaxRate: validationResult.taxRate,
            confidence: validationResult.confidence
          });

          return {
            ratio: officialRatio.ratio,
            source: `${officialRatio.source}-validated` as any,
            confidence: validationResult.confidence,
            taxRate: validationResult.taxRate
          };
        } else {
          // Official ratio doesn't match RentCast data, use RentCast fallback
          logger.warn('Official ratio validation failed, using RentCast fallback', {
            state,
            county,
            officialRatio: officialRatio.ratio,
            rentcastImpliedRatio: validationResult.impliedRatio,
            reason: validationResult.reason
          });

          return {
            ratio: validationResult.impliedRatio,
            source: 'rentcast-fallback',
            confidence: 65,
            taxRate: validationResult.taxRate
          };
        }
      }

      // Step 3: Use official ratio without validation if no RentCast data
      if (officialRatio) {
        logger.info('Using official assessment ratio (no RentCast validation)', {
          state,
          county,
          ratio: officialRatio.ratio,
          source: officialRatio.source
        });

        // When we have official ratio but no RentCast data for validation,
        // we can still estimate a reasonable tax rate using state-specific averages + official ratio
        // This gives us better accuracy than pure regional fallback
        
        // Get state-specific average tax rate, or use default
        const stateAvgRate = PropertyTaxEstimationService.STATE_AVG_TAX_RATES[state] || 
                           PropertyTaxEstimationService.DEFAULT_TAX_RATE;
        
        // The state average rate assumes market value assessment
        // If the state uses a different assessment ratio, we don't need to adjust
        // because the average effective rate already accounts for the assessment practice
        let estimatedTaxRate = stateAvgRate;
        
        // Only apply small variation for local differences (±15%)
        // This accounts for county/city variations within the state
        const localVariation = 1.0; // Could be enhanced with county data later
        estimatedTaxRate = estimatedTaxRate * localVariation;
        
        // Cap the rate at reasonable bounds (0.2% - 3.5%)
        estimatedTaxRate = Math.max(0.2, Math.min(3.5, estimatedTaxRate));
        
        logger.info('Calculated tax rate using official assessment ratio', {
          state,
          county,
          assessmentRatio: officialRatio.ratio,
          stateAvgRate,
          estimatedTaxRate
        });
        
        return {
          ratio: officialRatio.ratio,
          source: `${officialRatio.source}-official` as any,
          confidence: Math.max(65, officialRatio.confidence),
          taxRate: estimatedTaxRate
        };
      }

      // Step 4: Final fallback
      logger.warn('No official assessment ratio found, using fallback', {
        state,
        county
      });

      return {
        ratio: PropertyTaxEstimationService.FALLBACK_ASSESSMENT_RATIOS['DEFAULT'],
        source: 'fallback',
        confidence: 30
      };

    } catch (error) {
      logger.error('Error getting assessment ratio:', error);
      
      return {
        ratio: PropertyTaxEstimationService.FALLBACK_ASSESSMENT_RATIOS['DEFAULT'],
        source: 'fallback',
        confidence: 20
      };
    }
  }

  /**
   * Validate official assessment ratio against RentCast data
   */
  private async validateWithRentCast(
    officialRatio: { ratio: number; source: string; confidence: number },
    rentcastTaxData: { taxAssessedValue: number; annualTaxAmount: number },
    purchasePrice: number
  ): Promise<{
    isValid: boolean;
    taxRate: number;
    impliedRatio: number;
    confidence: number;
    reason?: string;
  }> {
    try {
      // Calculate implied market value using official ratio
      const impliedMarketValue = rentcastTaxData.taxAssessedValue / officialRatio.ratio;
      
      // Calculate tax rate based on implied market value
      const impliedTaxRate = (rentcastTaxData.annualTaxAmount / impliedMarketValue) * 100;
      
      // Calculate what assessment ratio RentCast data implies
      const rentcastImpliedRatio = rentcastTaxData.taxAssessedValue / purchasePrice;
      
      // Validation checks
      const isReasonableTaxRate = impliedTaxRate >= 0.3 && impliedTaxRate <= 6.0;
      const isReasonableRatio = rentcastImpliedRatio >= 0.05 && rentcastImpliedRatio <= 1.2;
      
      if (isReasonableTaxRate && isReasonableRatio) {
        // Official ratio validates well with RentCast data
        return {
          isValid: true,
          taxRate: impliedTaxRate,
          impliedRatio: rentcastImpliedRatio,
          confidence: Math.min(officialRatio.confidence + 15, 95) // Boost confidence
        };
      } else {
        // Official ratio creates unrealistic results
        const fallbackTaxRate = (rentcastTaxData.annualTaxAmount / purchasePrice) * 100;
        
        return {
          isValid: false,
          taxRate: fallbackTaxRate,
          impliedRatio: rentcastImpliedRatio,
          confidence: 65,
          reason: !isReasonableTaxRate ? 
            `Implied tax rate ${impliedTaxRate.toFixed(2)}% outside reasonable range` :
            `Implied assessment ratio ${(rentcastImpliedRatio * 100).toFixed(1)}% seems unrealistic`
        };
      }
      
    } catch (error) {
      logger.error('RentCast validation failed:', error);
      
      return {
        isValid: false,
        taxRate: PropertyTaxEstimationService.DEFAULT_TAX_RATE,
        impliedRatio: officialRatio.ratio,
        confidence: 40,
        reason: 'Validation calculation error'
      };
    }
  }

  private async getPropertyTaxData(address: string): Promise<{
    address: string;
    taxAssessedValue: number;
    annualTaxAmount: number;
    calculatedRate: number;
  } | null> {
    try {
      const propertyDetails = await rentcastService.getEnhancedPropertyDetails(address);
      
      if (propertyDetails?.financialData?.taxAssessedValue && 
          propertyDetails?.financialData?.annualTaxAmount) {
        
        const assessedValue = propertyDetails.financialData.taxAssessedValue;
        const annualTax = propertyDetails.financialData.annualTaxAmount;
        const calculatedRate = (annualTax / assessedValue) * 100;

        // Sanity check: tax rates should be between 0.1% and 5%
        if (calculatedRate > 0.1 && calculatedRate < 5.0) {
          return {
            address,
            taxAssessedValue: assessedValue,
            annualTaxAmount: annualTax,
            calculatedRate
          };
        } else {
          logger.warn('Calculated tax rate outside reasonable range', {
            address,
            calculatedRate,
            assessedValue,
            annualTax
          });
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting property tax data from RentCast:', error);
      return null;
    }
  }

  private async getRegionalTaxRate(request: PropertyTaxRequest): Promise<{
    rate: number;
    sampleSize: number;
  } | null> {
    try {
      // For Phase 2: This could be enhanced to get comparable properties
      // and calculate average tax rates from multiple nearby properties
      
      // For now, we can try to get comparable properties and extract tax rates
      const comparables = await rentcastService.getComparableProperties(request.address);
      
      if (comparables && comparables.length > 0) {
        // This would require getting detailed property data for each comparable
        // For now, return null to use fallback
        logger.info(`Found ${comparables.length} comparables for regional tax analysis`);
        // TODO: Implement comparative tax rate analysis
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting regional tax rate:', error);
      return null;
    }
  }

  private async getFallbackEstimate(request: PropertyTaxRequest): Promise<PropertyTaxEstimate> {
    // Try to get assessment ratio from database even in fallback mode
    const assessmentRatioResult = await this.getAssessmentRatio(request);

    // Day 11c (2026-05-18) — Issue B fix: use STATE-AVERAGE rate as
    // the fallback floor, not the national 1.2%. See the same fix in
    // calculateTaxEstimate above for the reasoning. The fallback path
    // is what fires when something upstream throws — should not
    // silently regress states with much-higher actual rates.
    const fallbackRate =
      (request.state &&
        PropertyTaxEstimationService.STATE_AVG_TAX_RATES[
          request.state.toUpperCase()
        ]) ||
      PropertyTaxEstimationService.DEFAULT_TAX_RATE;

    const estimatedAssessedValue = request.purchasePrice * assessmentRatioResult.ratio;
    const annualTaxAmount = estimatedAssessedValue * (fallbackRate / 100);

    return {
      annualTaxAmount: Math.round(annualTaxAmount),
      effectiveTaxRate: fallbackRate,
      confidence: {
        score: 30,
        source: request.state
          ? `Fallback — ${request.state.toUpperCase()} state average`
          : 'Fallback Regional Average',
        reliability: 'low',
        factors: [
          'No property-specific tax data available',
          `Using ${assessmentRatioResult.source} assessment ratio: ${Math.round(assessmentRatioResult.ratio * 100)}%`,
          `Applied tax rate: ${fallbackRate.toFixed(2)}%`
        ]
      },
      breakdown: {
        purchasePrice: request.purchasePrice,
        estimatedAssessmentRatio: assessmentRatioResult.ratio,
        estimatedAssessedValue,
        appliedTaxRate: PropertyTaxEstimationService.DEFAULT_TAX_RATE
      }
    };
  }
}

// Export singleton instance
export const propertyTaxEstimationService = new PropertyTaxEstimationService();