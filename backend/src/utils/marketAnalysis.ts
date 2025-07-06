/**
 * Market Analysis Utility Functions
 * Provides standardized market analysis calculations and insights
 * following the established architecture principles
 */

import { logger } from './logger';

// Type definitions for market analysis
export interface MarketPositioning {
  propertyValue: number;
  marketMedian: number;
  percentageDiff: number;
  position: 'Significantly Below Market' | 'Below Market' | 'At Market' | 'Above Market' | 'Significantly Above Market';
  competitiveAdvantage: string;
}

export interface AffordabilityAnalysis {
  requiredIncome: number;
  medianIncome: number;
  affordabilityRatio: number;
  assessment: 'Highly Affordable' | 'Moderately Affordable' | 'Challenging Affordability' | 'Above Market Rate';
  tenantPoolSize: 'Large' | 'Moderate' | 'Limited' | 'Very Limited';
}

export interface MarketDynamics {
  vacancyRate: number;
  marketCondition: 'Tight' | 'Balanced' | 'Loose';
  demandLevel: 'High' | 'Moderate' | 'Low';
  competitiveEnvironment: string;
  investmentTiming: 'Favorable' | 'Neutral' | 'Challenging';
}

export interface DemographicInsights {
  populationTrend: 'Growing' | 'Stable' | 'Declining';
  ageProfile: 'Young' | 'Mixed' | 'Mature';
  incomeStability: 'High' | 'Moderate' | 'Variable';
  marketPotential: 'Excellent' | 'Good' | 'Fair' | 'Limited';
}

/**
 * Calculate property positioning relative to local market
 * @param propertyPrice Property purchase price
 * @param marketMedianValue Median home value from census data
 * @returns MarketPositioning analysis
 */
export const calculateMarketPositioning = (
  propertyPrice: number, 
  marketMedianValue: number
): MarketPositioning => {
  try {
    const percentageDiff = ((propertyPrice - marketMedianValue) / marketMedianValue) * 100;
    
    let position: MarketPositioning['position'];
    let competitiveAdvantage: string;

    if (percentageDiff < -20) {
      position = 'Significantly Below Market';
      competitiveAdvantage = 'Exceptional value opportunity with significant built-in equity potential';
    } else if (percentageDiff < -10) {
      position = 'Significantly Below Market';
      competitiveAdvantage = 'Strong value position with good equity upside potential';
    } else if (percentageDiff < 0) {
      position = 'Below Market';
      competitiveAdvantage = 'Favorable pricing provides cushion against market volatility';
    } else if (percentageDiff < 10) {
      position = 'At Market';
      competitiveAdvantage = 'Market-rate pricing requires strong fundamentals for success';
    } else if (percentageDiff < 20) {
      position = 'Above Market';
      competitiveAdvantage = 'Premium pricing must be justified by superior location or features';
    } else {
      position = 'Significantly Above Market';
      competitiveAdvantage = 'High-risk premium positioning requires exceptional property characteristics';
    }

    return {
      propertyValue: propertyPrice,
      marketMedian: marketMedianValue,
      percentageDiff,
      position,
      competitiveAdvantage
    };
  } catch (error) {
    logger.error('Error calculating market positioning:', error);
    throw new Error('Failed to calculate market positioning');
  }
};

/**
 * Analyze rental affordability for target demographics
 * @param monthlyRent Property monthly rent
 * @param medianHouseholdIncome Area median household income
 * @param incomeMultiplier Income requirement multiplier (default 3x)
 * @returns AffordabilityAnalysis
 */
export const calculateAffordabilityAnalysis = (
  monthlyRent: number,
  medianHouseholdIncome: number,
  incomeMultiplier: number = 3
): AffordabilityAnalysis => {
  try {
    const requiredIncome = monthlyRent * 12 * incomeMultiplier;
    const affordabilityRatio = medianHouseholdIncome / requiredIncome;

    let assessment: AffordabilityAnalysis['assessment'];
    let tenantPoolSize: AffordabilityAnalysis['tenantPoolSize'];

    if (affordabilityRatio >= 1.2) {
      assessment = 'Highly Affordable';
      tenantPoolSize = 'Large';
    } else if (affordabilityRatio >= 1.0) {
      assessment = 'Highly Affordable';
      tenantPoolSize = 'Large';
    } else if (affordabilityRatio >= 0.8) {
      assessment = 'Moderately Affordable';
      tenantPoolSize = 'Moderate';
    } else if (affordabilityRatio >= 0.6) {
      assessment = 'Challenging Affordability';
      tenantPoolSize = 'Limited';
    } else {
      assessment = 'Above Market Rate';
      tenantPoolSize = 'Very Limited';
    }

    return {
      requiredIncome,
      medianIncome: medianHouseholdIncome,
      affordabilityRatio,
      assessment,
      tenantPoolSize
    };
  } catch (error) {
    logger.error('Error calculating affordability analysis:', error);
    throw new Error('Failed to calculate affordability analysis');
  }
};

/**
 * Analyze market dynamics and investment environment
 * @param vacancyRate Market vacancy rate (as percentage)
 * @param populationGrowth Optional population growth rate
 * @returns MarketDynamics analysis
 */
export const analyzeMarketDynamics = (
  vacancyRate: number,
  populationGrowth?: number
): MarketDynamics => {
  try {
    let marketCondition: MarketDynamics['marketCondition'];
    let demandLevel: MarketDynamics['demandLevel'];
    let competitiveEnvironment: string;
    let investmentTiming: MarketDynamics['investmentTiming'];

    // Analyze vacancy rate
    if (vacancyRate < 3) {
      marketCondition = 'Tight';
      demandLevel = 'High';
      competitiveEnvironment = 'Landlord-favorable market with strong pricing power';
      investmentTiming = 'Favorable';
    } else if (vacancyRate < 6) {
      marketCondition = 'Balanced';
      demandLevel = 'Moderate';
      competitiveEnvironment = 'Balanced market requiring competitive positioning';
      investmentTiming = 'Neutral';
    } else if (vacancyRate < 10) {
      marketCondition = 'Loose';
      demandLevel = 'Low';
      competitiveEnvironment = 'Tenant-favorable market requiring aggressive marketing';
      investmentTiming = 'Challenging';
    } else {
      marketCondition = 'Loose';
      demandLevel = 'Low';
      competitiveEnvironment = 'Highly competitive market with pricing pressure';
      investmentTiming = 'Challenging';
    }

    // Adjust for population growth if available
    if (populationGrowth !== undefined) {
      if (populationGrowth > 2 && investmentTiming === 'Challenging') {
        investmentTiming = 'Neutral';
        competitiveEnvironment += ' (offset by strong population growth)';
      } else if (populationGrowth < 0 && investmentTiming === 'Favorable') {
        investmentTiming = 'Neutral';
        competitiveEnvironment += ' (tempered by population decline)';
      }
    }

    return {
      vacancyRate,
      marketCondition,
      demandLevel,
      competitiveEnvironment,
      investmentTiming
    };
  } catch (error) {
    logger.error('Error analyzing market dynamics:', error);
    throw new Error('Failed to analyze market dynamics');
  }
};

/**
 * Generate demographic insights for investment analysis
 * @param medianAge Area median age
 * @param populationGrowth Population growth rate (optional)
 * @param medianIncome Median household income
 * @param nationalMedianIncome National median income for comparison
 * @returns DemographicInsights
 */
export const generateDemographicInsights = (
  medianAge: number,
  populationGrowth?: number,
  medianIncome?: number,
  nationalMedianIncome: number = 70000 // Default US median household income
): DemographicInsights => {
  try {
    let populationTrend: DemographicInsights['populationTrend'] = 'Stable';
    let ageProfile: DemographicInsights['ageProfile'];
    let incomeStability: DemographicInsights['incomeStability'] = 'Moderate';
    let marketPotential: DemographicInsights['marketPotential'];

    // Analyze population trend
    if (populationGrowth !== undefined) {
      if (populationGrowth > 1.5) {
        populationTrend = 'Growing';
      } else if (populationGrowth < -0.5) {
        populationTrend = 'Declining';
      }
    }

    // Analyze age profile
    if (medianAge < 35) {
      ageProfile = 'Young';
    } else if (medianAge < 45) {
      ageProfile = 'Mixed';
    } else {
      ageProfile = 'Mature';
    }

    // Analyze income stability
    if (medianIncome !== undefined) {
      const incomeRatio = medianIncome / nationalMedianIncome;
      if (incomeRatio > 1.2) {
        incomeStability = 'High';
      } else if (incomeRatio < 0.8) {
        incomeStability = 'Variable';
      }
    }

    // Determine market potential
    const positiveFactors = [
      populationTrend === 'Growing',
      ageProfile === 'Young' || ageProfile === 'Mixed',
      incomeStability === 'High'
    ].filter(Boolean).length;

    if (positiveFactors >= 3) {
      marketPotential = 'Excellent';
    } else if (positiveFactors >= 2) {
      marketPotential = 'Good';
    } else if (positiveFactors >= 1) {
      marketPotential = 'Fair';
    } else {
      marketPotential = 'Limited';
    }

    return {
      populationTrend,
      ageProfile,
      incomeStability,
      marketPotential
    };
  } catch (error) {
    logger.error('Error generating demographic insights:', error);
    throw new Error('Failed to generate demographic insights');
  }
};

/**
 * Calculate rent-to-income ratio for affordability assessment
 * @param monthlyRent Property monthly rent
 * @param monthlyIncome Tenant monthly income
 * @returns Rent-to-income ratio as percentage
 */
export const calculateRentToIncomeRatio = (
  monthlyRent: number,
  monthlyIncome: number
): number => {
  try {
    return (monthlyRent / monthlyIncome) * 100;
  } catch (error) {
    logger.error('Error calculating rent-to-income ratio:', error);
    throw new Error('Failed to calculate rent-to-income ratio');
  }
};

/**
 * Determine optimal rent pricing based on market conditions
 * @param baseRent Current/proposed rent
 * @param marketRent Area median rent
 * @param vacancyRate Local vacancy rate
 * @param propertyQuality Quality score (1-10)
 * @returns Recommended rent and justification
 */
export const optimizeRentPricing = (
  baseRent: number,
  marketRent: number,
  vacancyRate: number,
  propertyQuality: number = 5
): { recommendedRent: number; adjustment: number; justification: string } => {
  try {
    let adjustment = 0;
    let justification = '';

    // Base adjustment on vacancy rate
    if (vacancyRate < 3) {
      // Tight market - can charge premium
      adjustment += 0.05;
      justification += 'Tight market conditions support premium pricing. ';
    } else if (vacancyRate > 8) {
      // Loose market - may need to discount
      adjustment -= 0.03;
      justification += 'High vacancy rate suggests competitive pricing needed. ';
    }

    // Adjust for property quality
    const qualityAdjustment = (propertyQuality - 5) * 0.02;
    adjustment += qualityAdjustment;
    
    if (propertyQuality > 7) {
      justification += 'Superior property quality justifies premium. ';
    } else if (propertyQuality < 4) {
      justification += 'Property condition may require below-market pricing. ';
    }

    // Calculate recommended rent
    const marketBasedRent = marketRent * (1 + adjustment);
    const recommendedRent = Math.round(marketBasedRent / 25) * 25; // Round to nearest $25

    // Final justification
    const percentDiff = ((recommendedRent - baseRent) / baseRent) * 100;
    if (Math.abs(percentDiff) < 2) {
      justification += 'Current pricing is appropriate for market conditions.';
    } else if (percentDiff > 0) {
      justification += `Opportunity to increase rent by ${percentDiff.toFixed(1)}%.`;
    } else {
      justification += `Consider reducing rent by ${Math.abs(percentDiff).toFixed(1)}% to improve competitiveness.`;
    }

    return {
      recommendedRent,
      adjustment: percentDiff,
      justification: justification.trim()
    };
  } catch (error) {
    logger.error('Error optimizing rent pricing:', error);
    throw new Error('Failed to optimize rent pricing');
  }
};

/**
 * Comprehensive market analysis combining all metrics
 * @param params Market analysis parameters
 * @returns Complete market analysis object
 */
export const performComprehensiveMarketAnalysis = (params: {
  propertyPrice: number;
  monthlyRent: number;
  marketMedianValue: number;
  marketMedianRent: number;
  medianHouseholdIncome: number;
  vacancyRate: number;
  medianAge: number;
  populationGrowth?: number;
  propertyQuality?: number;
}) => {
  try {
    const {
      propertyPrice,
      monthlyRent,
      marketMedianValue,
      marketMedianRent,
      medianHouseholdIncome,
      vacancyRate,
      medianAge,
      populationGrowth,
      propertyQuality = 5
    } = params;

    // Calculate all market metrics
    const marketPositioning = calculateMarketPositioning(propertyPrice, marketMedianValue);
    const affordabilityAnalysis = calculateAffordabilityAnalysis(monthlyRent, medianHouseholdIncome);
    const marketDynamics = analyzeMarketDynamics(vacancyRate, populationGrowth);
    const demographicInsights = generateDemographicInsights(medianAge, populationGrowth, medianHouseholdIncome);
    const rentOptimization = optimizeRentPricing(monthlyRent, marketMedianRent, vacancyRate, propertyQuality);

    // Generate overall investment recommendation
    const investmentScore = calculateInvestmentScore({
      marketPositioning,
      affordabilityAnalysis,
      marketDynamics,
      demographicInsights
    });

    return {
      marketPositioning,
      affordabilityAnalysis,
      marketDynamics,
      demographicInsights,
      rentOptimization,
      investmentScore,
      summary: generateMarketSummary({
        marketPositioning,
        affordabilityAnalysis,
        marketDynamics,
        demographicInsights,
        investmentScore
      })
    };
  } catch (error) {
    logger.error('Error performing comprehensive market analysis:', error);
    throw new Error('Failed to perform comprehensive market analysis');
  }
};

/**
 * Calculate overall investment score based on market factors
 */
const calculateInvestmentScore = (factors: {
  marketPositioning: MarketPositioning;
  affordabilityAnalysis: AffordabilityAnalysis;
  marketDynamics: MarketDynamics;
  demographicInsights: DemographicInsights;
}): { score: number; grade: string; factors: string[] } => {
  let score = 50; // Base score
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];

  // Market positioning score
  if (factors.marketPositioning.percentageDiff < -10) {
    score += 15;
    positiveFactors.push('Excellent value positioning');
  } else if (factors.marketPositioning.percentageDiff < 0) {
    score += 10;
    positiveFactors.push('Good value positioning');
  } else if (factors.marketPositioning.percentageDiff > 20) {
    score -= 15;
    negativeFactors.push('Overpriced relative to market');
  }

  // Affordability score
  if (factors.affordabilityAnalysis.tenantPoolSize === 'Large') {
    score += 10;
    positiveFactors.push('Large tenant pool');
  } else if (factors.affordabilityAnalysis.tenantPoolSize === 'Very Limited') {
    score -= 10;
    negativeFactors.push('Limited tenant pool');
  }

  // Market dynamics score
  if (factors.marketDynamics.investmentTiming === 'Favorable') {
    score += 15;
    positiveFactors.push('Favorable market timing');
  } else if (factors.marketDynamics.investmentTiming === 'Challenging') {
    score -= 10;
    negativeFactors.push('Challenging market conditions');
  }

  // Demographics score
  if (factors.demographicInsights.marketPotential === 'Excellent') {
    score += 10;
    positiveFactors.push('Excellent demographic profile');
  } else if (factors.demographicInsights.marketPotential === 'Limited') {
    score -= 5;
    negativeFactors.push('Limited demographic upside');
  }

  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));

  let grade: string;
  if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 50) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    factors: [...positiveFactors, ...negativeFactors]
  };
};

/**
 * Generate market summary narrative
 */
const generateMarketSummary = (analysis: any): string => {
  const { marketPositioning, affordabilityAnalysis, marketDynamics, demographicInsights, investmentScore } = analysis;
  
  let summary = `This property is positioned ${marketPositioning.position.toLowerCase()} with a ${Math.abs(marketPositioning.percentageDiff).toFixed(1)}% ${marketPositioning.percentageDiff >= 0 ? 'premium' : 'discount'} to area median values. `;
  
  summary += `The rental rate is ${affordabilityAnalysis.assessment.toLowerCase()} for local demographics, creating a ${affordabilityAnalysis.tenantPoolSize.toLowerCase()} tenant pool. `;
  
  summary += `Market conditions are ${marketDynamics.marketCondition.toLowerCase()} with ${marketDynamics.demandLevel.toLowerCase()} demand levels. `;
  
  summary += `The area shows ${demographicInsights.marketPotential.toLowerCase()} market potential based on demographic trends. `;
  
  summary += `Overall investment score: ${investmentScore.score}/100 (Grade ${investmentScore.grade}).`;
  
  return summary;
};