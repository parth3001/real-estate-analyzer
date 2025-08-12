/**
 * Property Classification Service (Phase 2B)
 * 
 * Classifies properties into A/B/C classes based on:
 * - Property age and condition
 * - Price relative to market median
 * - Market tier context
 * - Construction quality indicators
 * 
 * Provides risk adjustments and management complexity assessment
 */

import { logger } from '../../utils/logger';
import { MarketTier } from './marketTierService';

export type PropertyClass = 'A' | 'B' | 'C';

export interface PropertyClassification {
  propertyClass: PropertyClass;
  classDescription: string;
  confidence: number; // 0-100 confidence in classification
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  managementIntensity: 'low' | 'medium' | 'high';
  targetTenantProfile: string;
  typicalInvestorProfile: string;
}

export interface PropertyClassRiskAdjustments {
  capRatePremium: number;        // Additional cap rate requirement (bps)
  maintenanceMultiplier: number; // Multiply maintenance reserves by this factor
  confidenceBoost: number;       // Adjustment to investment confidence (-/+ points)
  vacancyPremium: number;        // Additional vacancy allowance (%)
  managementFeeAdjustment: number; // Additional management complexity (%)
  expectedAppreciation: number;   // Annual appreciation expectation (%)
}

export interface PropertyQualityMetrics {
  ageScore: number;           // 0-100 (100 = newest)
  conditionScore: number;     // 0-100 (estimated from data)
  locationScore: number;      // 0-100 (based on market tier)
  pricePositioning: number;   // 0-100 (relative to market)
  overallQuality: number;     // 0-100 composite score
}

/**
 * Property Classification Service
 * 
 * Implements institutional-grade property classification methodology
 * based on 20+ years of real estate investment analysis
 */
export class PropertyClassificationService {

  /**
   * Classify property into A/B/C class
   */
  static classifyProperty(
    yearBuilt: number,
    purchasePrice: number,
    marketMedianPrice: number,
    marketTier: MarketTier,
    sqft?: number,
    lotSize?: number,
    hasUpdates?: boolean
  ): PropertyClassification {
    
    const currentYear = new Date().getFullYear();
    const propertyAge = currentYear - yearBuilt;
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(
      yearBuilt,
      purchasePrice,
      marketMedianPrice,
      marketTier,
      sqft,
      lotSize,
      hasUpdates
    );
    
    logger.info('Property Classification Analysis', {
      yearBuilt,
      propertyAge,
      purchasePrice,
      marketMedianPrice,
      marketTier: marketTier.tier,
      qualityMetrics
    });
    
    // Determine property class based on composite scoring
    const { propertyClass, confidence } = this.determinePropertyClass(
      qualityMetrics,
      propertyAge,
      marketTier
    );
    
    // Get class-specific characteristics
    const classCharacteristics = this.getClassCharacteristics(propertyClass, marketTier);
    
    return {
      propertyClass,
      classDescription: classCharacteristics.description,
      confidence,
      riskLevel: classCharacteristics.riskLevel,
      managementIntensity: classCharacteristics.managementIntensity,
      targetTenantProfile: classCharacteristics.targetTenantProfile,
      typicalInvestorProfile: classCharacteristics.typicalInvestorProfile
    };
  }

  /**
   * Get risk adjustments based on property class
   */
  static getPropertyClassRiskAdjustments(
    propertyClass: PropertyClass,
    marketTier: MarketTier
  ): PropertyClassRiskAdjustments {
    
    const baseAdjustments = this.getBaseRiskAdjustments(propertyClass);
    
    // Adjust based on market tier
    const tierAdjustment = this.getMarketTierAdjustment(marketTier.tier);
    
    return {
      capRatePremium: baseAdjustments.capRatePremium + tierAdjustment.capRateModifier,
      maintenanceMultiplier: baseAdjustments.maintenanceMultiplier * tierAdjustment.maintenanceModifier,
      confidenceBoost: baseAdjustments.confidenceBoost + tierAdjustment.confidenceModifier,
      vacancyPremium: baseAdjustments.vacancyPremium + tierAdjustment.vacancyModifier,
      managementFeeAdjustment: baseAdjustments.managementFeeAdjustment,
      expectedAppreciation: baseAdjustments.expectedAppreciation * tierAdjustment.appreciationModifier
    };
  }

  /**
   * Generate property class insights
   */
  static generatePropertyClassInsights(
    classification: PropertyClassification,
    yearBuilt: number,
    purchasePrice: number,
    riskAdjustments: PropertyClassRiskAdjustments
  ): string[] {
    const insights: string[] = [];
    const currentYear = new Date().getFullYear();
    const propertyAge = currentYear - yearBuilt;
    
    // Age-based insights
    if (propertyAge <= 5) {
      insights.push(`New construction (${yearBuilt}) offers modern amenities and lower maintenance risk`);
    } else if (propertyAge <= 15) {
      insights.push(`Well-maintained property (${yearBuilt}) with modern systems and finishes`);
    } else if (propertyAge <= 30) {
      insights.push(`Mature property (${yearBuilt}) may require capital improvements within 5-10 years`);
    } else {
      insights.push(`Older property (${yearBuilt}) requires active management and higher maintenance reserves`);
    }
    
    // Class-specific insights
    switch (classification.propertyClass) {
      case 'A':
        insights.push('Premium property attracts high-quality tenants with lower turnover risk');
        if (riskAdjustments.capRatePremium < 0) {
          insights.push('Class A properties may have lower cap rates but offer appreciation potential');
        }
        break;
        
      case 'B':
        insights.push('Solid investment-grade property with balanced risk-return profile');
        insights.push('Appeals to middle-income tenants with reasonable management complexity');
        break;
        
      case 'C':
        insights.push('Value property requires active management but offers higher cash flow potential');
        insights.push(`Recommend $${Math.round(purchasePrice * riskAdjustments.maintenanceMultiplier * 0.01)}/month maintenance reserve`);
        break;
    }
    
    // Management insights
    if (classification.managementIntensity === 'high') {
      insights.push('Consider property management company or budget additional time for tenant relations');
    }
    
    // Risk insights
    if (classification.riskLevel === 'high' || classification.riskLevel === 'very_high') {
      insights.push('Higher risk profile requires experienced investor or professional guidance');
    }
    
    return insights;
  }

  // Private helper methods

  private static calculateQualityMetrics(
    yearBuilt: number,
    purchasePrice: number,
    marketMedianPrice: number,
    marketTier: MarketTier,
    sqft?: number,
    lotSize?: number,
    hasUpdates?: boolean
  ): PropertyQualityMetrics {
    
    const currentYear = new Date().getFullYear();
    const propertyAge = currentYear - yearBuilt;
    
    // Age score (0-100, 100 = newest)
    let ageScore = 100;
    if (propertyAge <= 5) ageScore = 100;
    else if (propertyAge <= 10) ageScore = 90;
    else if (propertyAge <= 20) ageScore = 75;
    else if (propertyAge <= 30) ageScore = 60;
    else if (propertyAge <= 50) ageScore = 40;
    else ageScore = 20;
    
    // Condition score (estimated from available data)
    let conditionScore = ageScore; // Base on age
    if (hasUpdates) conditionScore = Math.min(100, conditionScore + 15); // Boost for updates
    if (purchasePrice > marketMedianPrice * 1.2) conditionScore += 10; // Premium pricing suggests condition
    
    // Location score (based on market tier)
    const locationScore = marketTier.tier === 1 ? 85 : marketTier.tier === 2 ? 70 : 55;
    
    // Price positioning (relative to market)
    const priceRatio = purchasePrice / marketMedianPrice;
    let pricePositioning = 50; // Base score
    if (priceRatio > 1.3) pricePositioning = 85;      // Premium
    else if (priceRatio > 1.1) pricePositioning = 70;  // Above market
    else if (priceRatio > 0.9) pricePositioning = 50;  // Market rate
    else if (priceRatio > 0.7) pricePositioning = 35;  // Below market
    else pricePositioning = 20; // Significantly below market
    
    // Size adjustments
    if (sqft && sqft > 2000) pricePositioning += 5; // Larger homes premium
    if (lotSize && lotSize > 8000) pricePositioning += 5; // Larger lots premium
    
    // Overall quality composite
    const overallQuality = Math.round(
      (ageScore * 0.35) + 
      (conditionScore * 0.25) + 
      (locationScore * 0.25) + 
      (pricePositioning * 0.15)
    );
    
    return {
      ageScore,
      conditionScore,
      locationScore,
      pricePositioning,
      overallQuality: Math.max(0, Math.min(100, overallQuality))
    };
  }

  private static determinePropertyClass(
    qualityMetrics: PropertyQualityMetrics,
    propertyAge: number,
    marketTier: MarketTier
  ): { propertyClass: PropertyClass; confidence: number } {
    
    const { overallQuality, ageScore, conditionScore, pricePositioning } = qualityMetrics;
    
    // Tier 1 markets: Higher standards for Class A/B
    // Tier 2 markets: Balanced standards
    // Tier 3 markets: Focus on cash flow, lower standards
    
    const tierAdjustment = marketTier.tier === 1 ? 10 : marketTier.tier === 2 ? 0 : -5;
    const adjustedQuality = overallQuality + tierAdjustment;
    
    let propertyClass: PropertyClass;
    let confidence = 80; // Base confidence
    
    // Class A: Premium properties
    if (adjustedQuality >= 80 && ageScore >= 80 && pricePositioning >= 70) {
      propertyClass = 'A';
      confidence = Math.min(95, 80 + (adjustedQuality - 80) / 2);
    }
    // Class C: Value properties requiring management
    else if (adjustedQuality <= 45 || ageScore <= 40 || (propertyAge > 40 && conditionScore <= 60)) {
      propertyClass = 'C';
      confidence = Math.min(95, 80 + (45 - adjustedQuality) / 2);
    }
    // Class B: Standard investment-grade (everything else)
    else {
      propertyClass = 'B';
      // Lower confidence for borderline properties
      if (adjustedQuality > 70 || adjustedQuality < 55) {
        confidence = 70; // Borderline cases
      }
    }
    
    // Confidence adjustments
    if (propertyAge > 50) confidence -= 10; // Very old properties harder to classify
    if (Math.abs(pricePositioning - 50) > 30) confidence += 5; // Clear pricing signals
    
    return {
      propertyClass,
      confidence: Math.max(50, Math.min(95, Math.round(confidence)))
    };
  }

  private static getClassCharacteristics(
    propertyClass: PropertyClass,
    marketTier: MarketTier
  ) {
    switch (propertyClass) {
      case 'A':
        return {
          description: `Class A - Premium ${marketTier.name.includes('Tier 1') ? 'luxury' : 'high-quality'} property`,
          riskLevel: 'low' as const,
          managementIntensity: 'low' as const,
          targetTenantProfile: 'High-income professionals, executives, stable long-term tenants',
          typicalInvestorProfile: 'Sophisticated investors seeking appreciation and premium tenant quality'
        };
        
      case 'B':
        return {
          description: `Class B - Standard investment-grade property`,
          riskLevel: 'moderate' as const,
          managementIntensity: 'medium' as const,
          targetTenantProfile: 'Middle-income families, working professionals, stable employment',
          typicalInvestorProfile: 'Most investors - balanced risk/return profile with moderate management'
        };
        
      case 'C':
        return {
          description: `Class C - Value property with higher cash flow potential`,
          riskLevel: 'high' as const,
          managementIntensity: 'high' as const,
          targetTenantProfile: 'Lower-income tenants, higher turnover risk, price-sensitive renters',
          typicalInvestorProfile: 'Experienced investors comfortable with active management and tenant issues'
        };
    }
  }

  private static getBaseRiskAdjustments(propertyClass: PropertyClass): PropertyClassRiskAdjustments {
    switch (propertyClass) {
      case 'A':
        return {
          capRatePremium: -0.005,      // -50bps (accept lower cap for quality)
          maintenanceMultiplier: 0.8,   // 20% lower maintenance
          confidenceBoost: 10,          // +10 confidence points
          vacancyPremium: -0.01,        // -1% vacancy (stable tenants)
          managementFeeAdjustment: 0.0, // No management premium
          expectedAppreciation: 0.04    // 4% annual appreciation
        };
        
      case 'B':
        return {
          capRatePremium: 0.0,          // Baseline requirement
          maintenanceMultiplier: 1.0,   // Standard maintenance
          confidenceBoost: 0,           // No confidence adjustment
          vacancyPremium: 0.0,          // Standard vacancy allowance
          managementFeeAdjustment: 0.01, // +1% for standard management
          expectedAppreciation: 0.03    // 3% annual appreciation
        };
        
      case 'C':
        return {
          capRatePremium: 0.01,         // +100bps for risk
          maintenanceMultiplier: 1.5,   // 50% higher maintenance
          confidenceBoost: -15,         // -15 confidence points
          vacancyPremium: 0.02,         // +2% vacancy risk
          managementFeeAdjustment: 0.03, // +3% for intensive management
          expectedAppreciation: 0.02    // 2% annual appreciation
        };
    }
  }

  private static getMarketTierAdjustment(tier: 1 | 2 | 3) {
    switch (tier) {
      case 1: // Premium markets
        return {
          capRateModifier: -0.005,      // -50bps (premium market discount)
          maintenanceModifier: 0.9,     // 10% lower maintenance (better contractors)
          confidenceModifier: 5,        // +5 confidence (stable market)
          vacancyModifier: -0.005,      // -0.5% vacancy (high demand)
          appreciationModifier: 1.2     // 20% higher appreciation
        };
        
      case 2: // Balanced markets
        return {
          capRateModifier: 0.0,         // No adjustment
          maintenanceModifier: 1.0,     // Standard
          confidenceModifier: 0,        // No adjustment
          vacancyModifier: 0.0,         // Standard
          appreciationModifier: 1.0     // Standard appreciation
        };
        
      case 3: // Cash flow markets
        return {
          capRateModifier: 0.005,       // +50bps (additional yield required)
          maintenanceModifier: 1.1,     // 10% higher maintenance (fewer contractors)
          confidenceModifier: -5,       // -5 confidence (market risk)
          vacancyModifier: 0.005,       // +0.5% vacancy risk
          appreciationModifier: 0.8     // 20% lower appreciation
        };
    }
  }
}

export default PropertyClassificationService;