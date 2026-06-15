/**
 * Market Tier Service
 * 
 * Provides geographic market intelligence and tier-based analysis
 * Uses 80% static data approach for reliability and performance
 */

import { logger } from '../../utils/logger';

export interface MarketTier {
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  focusType: 'appreciation' | 'balanced' | 'cashflow';
  thresholds: MarketThresholds;
}

export interface MarketThresholds {
  rentToPriceMinimum: number;     // Minimum monthly rent / purchase price ratio
  capRatePremium: number;         // Additional cap rate requirement above baseline
  appreciationExpectation: number; // Expected annual appreciation %
  liquidityRisk: number;          // Liquidity adjustment factor
  managementComplexity: 'low' | 'medium' | 'high';
  typicalInvestorProfile: string;
}

export interface MarketContext {
  marketTier: MarketTier;
  cityName: string;
  stateName: string;
  marketMedianCapRate?: number;
  marketMedianRent?: number;
  marketMedianPrice?: number;
  relativePerformance?: {
    capRateVsMarket: number;
    rentVsMarket: number;
    priceVsMarket: number;
  };
}

/**
 * Market Tier Classification Service
 * 
 * Implements institutional-grade market intelligence using proven geographic tiers
 * Based on 20+ years of real estate investment analysis
 */
export class MarketTierService {
  
  // TIER 1 MARKETS: Premium Appreciation Markets
  // Characteristics: High appreciation, low cap rates, premium pricing, strong liquidity
  private static readonly TIER_1_MARKETS = new Set([
    // West Coast Major Markets
    'San Francisco', 'San Jose', 'Oakland', 'Los Angeles', 'San Diego', 'Santa Barbara',
    'Seattle', 'Portland', 'Bellevue', 'Palo Alto', 'Mountain View',
    
    // East Coast Major Markets  
    'New York', 'Manhattan', 'Brooklyn', 'Boston', 'Cambridge', 'Washington', 'Arlington',
    'Alexandria', 'Miami', 'Miami Beach', 'Fort Lauderdale',
    
    // Other Premium Markets
    'Honolulu', 'Aspen', 'Park City', 'Jackson', 'Nantucket'
  ]);

  // TIER 2 MARKETS: Growth and Balanced Markets
  // Characteristics: Moderate appreciation, balanced yields, growing job markets
  private static readonly TIER_2_MARKETS = new Set([
    // Texas Growth Markets
    'Austin', 'Dallas', 'Houston', 'San Antonio', 'Plano', 'Frisco', 'Richardson',
    'Irving', 'Addison', 'Carrollton', 'Sugar Land', 'The Woodlands',
    
    // Southeast Growth Markets
    'Atlanta', 'Charlotte', 'Raleigh', 'Durham', 'Nashville', 'Tampa', 'Orlando',
    'Jacksonville', 'Charleston', 'Savannah', 'Asheville',
    
    // Mountain West Growth
    'Denver', 'Boulder', 'Colorado Springs', 'Salt Lake City', 'Phoenix', 'Scottsdale',
    'Tempe', 'Mesa', 'Las Vegas', 'Henderson', 'Boise',
    
    // Midwest Growth Markets
    'Minneapolis', 'St. Paul', 'Madison', 'Columbus', 'Cincinnati', 'Indianapolis',
    'Grand Rapids', 'Kansas City', 'Des Moines',
    
    // Other Balanced Markets
    'Omaha', 'Richmond', 'Virginia Beach', 'Wilmington', 'Greenville'
  ]);

  // All other markets are TIER 3: Cash Flow Markets
  // Characteristics: Higher cap rates, lower appreciation, cash flow focus

  /**
   * Determine market tier for a given location
   */
  static getMarketTier(city: string, state: string): MarketTier {
    const normalizedCity = this.normalizeCity(city);
    
    if (this.TIER_1_MARKETS.has(normalizedCity)) {
      return this.getTier1Market();
    }
    
    if (this.TIER_2_MARKETS.has(normalizedCity)) {
      return this.getTier2Market();
    }
    
    return this.getTier3Market();
  }

  /**
   * Get market tier by tier number (for testing)
   */
  static getMarketTierByNumber(tier: 1 | 2 | 3): MarketTier {
    switch (tier) {
      case 1: return this.getTier1Market();
      case 2: return this.getTier2Market();
      case 3: return this.getTier3Market();
    }
  }

  /**
   * Calculate market-relative thresholds based on investor strategy and experience
   */
  static calculateAdaptiveThresholds(
    baseTier: MarketTier,
    investmentStrategy: 'cashflow' | 'appreciation' | 'balanced',
    experienceLevel: 'novice' | 'intermediate' | 'expert',
    holdPeriod: number
  ): MarketThresholds {
    
    let adjustedThresholds = { ...baseTier.thresholds };
    
    // Strategy adjustments
    if (investmentStrategy === 'cashflow') {
      adjustedThresholds.rentToPriceMinimum += 0.001; // +0.1% minimum for income focus
      adjustedThresholds.capRatePremium -= 0.005;     // -50bps (accept lower cap for cash flow)
    } else if (investmentStrategy === 'appreciation') {
      adjustedThresholds.capRatePremium += 0.005;     // +50bps quality premium
      adjustedThresholds.rentToPriceMinimum -= 0.0005; // -0.05% (acceptable for growth)
    }
    
    // Experience adjustments
    if (experienceLevel === 'novice') {
      adjustedThresholds.capRatePremium += 0.01;      // +100bps safety margin
      adjustedThresholds.rentToPriceMinimum += 0.001; // +0.1% minimum
    } else if (experienceLevel === 'expert') {
      adjustedThresholds.capRatePremium -= 0.005;     // -50bps (can handle complexity)
    }
    
    // Hold period adjustments
    if (holdPeriod <= 3) {
      adjustedThresholds.capRatePremium += 0.02;      // +200bps short-term premium
    } else if (holdPeriod >= 8) {
      adjustedThresholds.capRatePremium -= 0.005;     // -50bps long-term discount
    }
    
    return adjustedThresholds;
  }

  /**
   * Generate market intelligence insights
   */
  static generateMarketInsights(
    marketContext: MarketContext,
    propertyCapRate: number,
    propertyRentToPriceRatio: number
  ): string[] {
    const insights: string[] = [];
    const tier = marketContext.marketTier;
    
    // Cap rate relative performance
    if (marketContext.marketMedianCapRate) {
      const capRateDiff = propertyCapRate - marketContext.marketMedianCapRate;
      
      if (capRateDiff > 0.01) {
        insights.push(`Exceptional ${propertyCapRate.toFixed(1)}% cap rate vs ${marketContext.marketMedianCapRate.toFixed(1)}% market median in ${marketContext.cityName}`);
      } else if (capRateDiff < -0.01) {
        insights.push(`Below-market ${propertyCapRate.toFixed(1)}% cap rate vs ${marketContext.marketMedianCapRate.toFixed(1)}% ${marketContext.cityName} average`);
      } else {
        insights.push(`Market-rate ${propertyCapRate.toFixed(1)}% cap rate aligns with ${marketContext.cityName} median`);
      }
    }
    
    // Rent-to-price ratio analysis
    if (propertyRentToPriceRatio < tier.thresholds.rentToPriceMinimum) {
      const shortfall = ((tier.thresholds.rentToPriceMinimum - propertyRentToPriceRatio) * 100).toFixed(2);
      insights.push(`Rent-to-price ratio ${shortfall}% below ${tier.name} market minimum - pricing may be stretched`);
    } else {
      insights.push(`Healthy rent-to-price ratio for ${tier.name} market standards`);
    }
    
    // Market-specific insights
    switch (tier.tier) {
      case 1:
        insights.push(`${tier.name} market: Focus on appreciation potential and premium tenant quality`);
        break;
      case 2:
        insights.push(`${tier.name} market: Balanced opportunity for both income and growth`);
        break;
      case 3:
        insights.push(`${tier.name} market: Prioritize cash flow and stable rental income`);
        break;
    }
    
    return insights;
  }

  /**
   * Calculate fair market value based on market-appropriate cap rate
   */
  static calculateFairMarketValue(
    netOperatingIncome: number,
    marketTier: MarketTier,
    marketMedianCapRate?: number
  ): { fairValue: number; targetCapRate: number; reasoning: string } {
    
    // Use market median if available, otherwise use tier-appropriate target.
    // All cap rates handled here are in DECIMAL form (0.07 = 7%), matching
    // the engine's representation and getTierTargetCapRate's return values.
    let targetCapRate = marketMedianCapRate || this.getTierTargetCapRate(marketTier.tier);

    // Apply tier-specific adjustments (also decimal — see Tier 1-3 defs below)
    targetCapRate += marketTier.thresholds.capRatePremium;

    // Income approach: fair value = NOI / cap rate.
    //
    // Pre-2026-06-14: this formula had a spurious `/100` that produced a
    // 100× inflated value. The function had been written assuming
    // targetCapRate was a percentage (e.g., 7), but every caller passes
    // it as a decimal (0.07). For a $250K rental, the bug produced
    // fairValue of $12.5M–$18.5M, silently flagging EVERY property as
    // "not overpriced" in investmentDecisionEngine.ts:347's `overpriced`
    // check. Locked in by financialMathContracts.test.ts.
    const fairValue = netOperatingIncome / targetCapRate;

    // Format for display: multiply by 100 since targetCapRate is decimal.
    const targetCapRatePct = (targetCapRate * 100).toFixed(1);
    const marketMedianPct = marketMedianCapRate
      ? (marketMedianCapRate * 100).toFixed(1)
      : '';
    const reasoning = marketMedianCapRate
      ? `Based on ${targetCapRatePct}% target cap rate (${marketMedianPct}% market median + ${(marketTier.thresholds.capRatePremium * 100).toFixed(0)}bps premium)`
      : `Based on ${targetCapRatePct}% target cap rate for ${marketTier.name} markets`;
    
    return {
      fairValue: Math.round(fairValue),
      targetCapRate,
      reasoning
    };
  }

  // Private helper methods

  private static normalizeCity(city: string): string {
    return city.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private static getTier1Market(): MarketTier {
    return {
      tier: 1,
      name: 'Tier 1 - Premium Appreciation Market',
      description: 'High-demand urban markets with strong job growth and limited supply',
      focusType: 'appreciation',
      thresholds: {
        rentToPriceMinimum: 0.0025,   // 0.25% minimum (premium markets)
        capRatePremium: 0.02,         // +200bps requirement
        appreciationExpectation: 0.05, // 5% annually
        liquidityRisk: -0.005,        // -50bps (easy to sell)
        managementComplexity: 'low',   // Quality tenants
        typicalInvestorProfile: 'Sophisticated investors seeking appreciation and portfolio diversification'
      }
    };
  }

  private static getTier2Market(): MarketTier {
    return {
      tier: 2,
      name: 'Tier 2 - Balanced Growth Market',
      description: 'Growing secondary markets with job diversification and population growth',
      focusType: 'balanced',
      thresholds: {
        rentToPriceMinimum: 0.004,    // 0.40% minimum
        capRatePremium: 0.01,         // +100bps requirement
        appreciationExpectation: 0.04, // 4% annually
        liquidityRisk: 0.0,           // Baseline
        managementComplexity: 'medium', // Standard management
        typicalInvestorProfile: 'Balanced investors seeking both income and growth'
      }
    };
  }

  private static getTier3Market(): MarketTier {
    return {
      tier: 3,
      name: 'Tier 3 - Cash Flow Market',
      description: 'Value markets with higher yields and income focus',
      focusType: 'cashflow',
      thresholds: {
        rentToPriceMinimum: 0.007,    // 0.70% minimum (income focus)
        capRatePremium: 0.0,          // Baseline requirement
        appreciationExpectation: 0.02, // 2% annually
        liquidityRisk: 0.01,          // +100bps (longer marketing time)
        managementComplexity: 'medium', // Active management beneficial
        typicalInvestorProfile: 'Income-focused investors and cash flow builders'
      }
    };
  }

  private static getTierTargetCapRate(tier: 1 | 2 | 3): number {
    // Conservative baseline cap rates by tier (can be overridden by market data)
    switch (tier) {
      case 1: return 0.04;  // 4% for premium markets
      case 2: return 0.05;  // 5% for balanced markets  
      case 3: return 0.07;  // 7% for cash flow markets
    }
  }
}

export default MarketTierService;