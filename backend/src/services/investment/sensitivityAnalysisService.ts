/**
 * Sensitivity Analysis Service
 * 
 * Shows how deal scores change with different assumptions (price, rent, rates)
 * Provides negotiation intelligence without contradicting V3.0 market-aware scoring
 */

import { logger } from '../../utils/logger';
import { SFRData } from '../../types/propertyTypes';

export interface SensitivityScenario {
  parameter: 'price' | 'rent' | 'interestRate' | 'downPayment';
  currentValue: number;
  newValue: number;
  change: number;
  changePercent: number;
  newDealQuality: number;
  newVerdict: 'BUY' | 'NEGOTIATE' | 'PASS';
  scoreImprovement: number;
  description: string;
}

export interface SensitivityAnalysis {
  currentScore: number;
  currentVerdict: 'BUY' | 'NEGOTIATE' | 'PASS';
  buyThreshold: number; // Score needed for BUY
  
  priceScenarios: SensitivityScenario[];
  rentScenarios: SensitivityScenario[];
  interestRateScenarios: SensitivityScenario[];
  
  // Key insights
  pathToBuy: {
    easiest: SensitivityScenario;
    mostRealistic: SensitivityScenario;
    alternatives: SensitivityScenario[];
  };
  
  // Negotiation intelligence
  negotiationGuidance: {
    focus: 'price' | 'rent' | 'financing' | 'terms';
    rationale: string;
    specificTargets: string[];
  };
}

class SensitivityAnalysisService {
  constructor() {
    // No dependencies to avoid circular imports
  }

  /**
   * Generate comprehensive sensitivity analysis using dependency injection
   */
  async generateSensitivityAnalysis(
    propertyData: SFRData,
    analysis: any,
    predictions: any,
    marketIntelligence: any,
    userContext: any,
    enhancedGoals: any,
    investmentEngine: any // Injected to avoid circular dependency
  ): Promise<SensitivityAnalysis> {
    try {

      // Get current baseline decision using injected engine (skip enhancements to prevent recursion)
      const baselineDecision = await investmentEngine.generateInvestmentDecision(
        propertyData, analysis, predictions, marketIntelligence, userContext, enhancedGoals, true
      );

      const currentScore = baselineDecision.professionalAssessment?.dealQuality || 0;
      const currentVerdict = baselineDecision.verdict;
      const buyThreshold = 65; // BUY threshold from V3.0

      // OPTIMIZATION 1A: Generate all scenario types in PARALLEL (Issue #40)
      // Parallel execution: ~3-5s vs 30s sequential (83% improvement)
      const [priceScenarios, rentScenarios, interestRateScenarios] = await Promise.all([
        this.generatePriceScenarios(
          propertyData, analysis, predictions, marketIntelligence, userContext, enhancedGoals, investmentEngine
        ),
        this.generateRentScenarios(
          propertyData, analysis, predictions, marketIntelligence, userContext, enhancedGoals, investmentEngine
        ),
        this.generateInterestRateScenarios(
          propertyData, analysis, predictions, marketIntelligence, userContext, enhancedGoals, investmentEngine
        )
      ]);

      // Determine path to BUY and negotiation guidance
      const allScenarios = [...priceScenarios, ...rentScenarios, ...interestRateScenarios];
      const pathToBuy = this.analyzePathToBuy(allScenarios, buyThreshold);
      const negotiationGuidance = this.generateNegotiationGuidance(
        allScenarios, propertyData, marketIntelligence, currentScore, buyThreshold
      );

      return {
        currentScore,
        currentVerdict,
        buyThreshold,
        priceScenarios,
        rentScenarios,
        interestRateScenarios,
        pathToBuy,
        negotiationGuidance
      };

    } catch (error) {
      logger.error('Sensitivity analysis generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate price reduction scenarios
   * ⚡ OPTIMIZATION 1B: Parallelize all 4 price scenarios
   */
  private async generatePriceScenarios(
    propertyData: SFRData,
    analysis: any,
    predictions: any,
    marketIntelligence: any,
    userContext: any,
    enhancedGoals: any,
    investmentEngine: any
  ): Promise<SensitivityScenario[]> {
    const currentPrice = propertyData.purchasePrice;
    const reductions = [10000, 25000, 50000, 75000]; // Test different price reductions

    // OPTIMIZATION 1B: Run all 4 price scenarios in PARALLEL
    const scenarioPromises = reductions.map(async (reduction) => {
      const newPrice = currentPrice - reduction;
      const modifiedPropertyData = { ...propertyData, purchasePrice: newPrice };

      try {
        // Re-run analysis with new price
        const modifiedAnalysis = await this.recalculateAnalysis(modifiedPropertyData, analysis);
        const newDecision = await investmentEngine.generateInvestmentDecision(
          modifiedPropertyData, modifiedAnalysis, predictions, marketIntelligence, userContext, enhancedGoals, true
        );

        const newScore = newDecision.professionalAssessment?.dealQuality || 0;
        const scoreImprovement = newScore - (analysis.baselineScore || 0);

        return {
          parameter: 'price' as const,
          currentValue: currentPrice,
          newValue: newPrice,
          change: -reduction,
          changePercent: -(reduction / currentPrice) * 100,
          newDealQuality: newScore,
          newVerdict: newDecision.verdict,
          scoreImprovement,
          description: `${reduction / 1000}k reduction: Score ${newScore}/100 (${newDecision.verdict})`
        };

      } catch (error) {
        logger.warn(`Failed to calculate price scenario for $${reduction} reduction:`, error);
        return null;
      }
    });

    return (await Promise.all(scenarioPromises)).filter(s => s !== null) as SensitivityScenario[];
  }

  /**
   * Generate rent increase scenarios
   * ⚡ OPTIMIZATION 1B: Parallelize all 4 rent scenarios
   */
  private async generateRentScenarios(
    propertyData: SFRData,
    analysis: any,
    predictions: any,
    marketIntelligence: any,
    userContext: any,
    enhancedGoals: any,
    investmentEngine: any
  ): Promise<SensitivityScenario[]> {
    const currentRent = propertyData.monthlyRent || 0;
    const increases = [100, 200, 350, 500]; // Test different rent increases

    // OPTIMIZATION 1B: Run all 4 rent scenarios in PARALLEL
    const scenarioPromises = increases.map(async (increase) => {
      const newRent = currentRent + increase;
      const modifiedPropertyData = { ...propertyData, monthlyRent: newRent };

      try {
        // Re-run analysis with new rent
        const modifiedAnalysis = await this.recalculateAnalysis(modifiedPropertyData, analysis);
        const newDecision = await investmentEngine.generateInvestmentDecision(
          modifiedPropertyData, modifiedAnalysis, predictions, marketIntelligence, userContext, enhancedGoals, true
        );

        const newScore = newDecision.professionalAssessment?.dealQuality || 0;
        const scoreImprovement = newScore - (analysis.baselineScore || 0);

        return {
          parameter: 'rent' as const,
          currentValue: currentRent,
          newValue: newRent,
          change: increase,
          changePercent: (increase / currentRent) * 100,
          newDealQuality: newScore,
          newVerdict: newDecision.verdict,
          scoreImprovement,
          description: `+$${increase}/month rent: Score ${newScore}/100 (${newDecision.verdict})`
        };

      } catch (error) {
        logger.warn(`Failed to calculate rent scenario for +$${increase}:`, error);
        return null;
      }
    });

    return (await Promise.all(scenarioPromises)).filter(s => s !== null) as SensitivityScenario[];
  }

  /**
   * Generate interest rate scenarios
   * OPTIMIZATION 1B: Parallelize all 4 interest rate scenarios
   */
  private async generateInterestRateScenarios(
    propertyData: SFRData,
    analysis: any,
    predictions: any,
    marketIntelligence: any,
    userContext: any,
    enhancedGoals: any,
    investmentEngine: any
  ): Promise<SensitivityScenario[]> {
    const currentRate = propertyData.interestRate || 7.0;
    const rates = [6.0, 6.5, 5.5, 8.0]; // Test different interest rates

    // OPTIMIZATION 1B: Run all 4 interest rate scenarios in PARALLEL
    const scenarioPromises = rates.map(async (rate) => {
      const modifiedPropertyData = { ...propertyData, interestRate: rate };

      try {
        // Re-run analysis with new rate
        const modifiedAnalysis = await this.recalculateAnalysis(modifiedPropertyData, analysis);
        const newDecision = await investmentEngine.generateInvestmentDecision(
          modifiedPropertyData, modifiedAnalysis, predictions, marketIntelligence, userContext, enhancedGoals, true
        );

        const newScore = newDecision.professionalAssessment?.dealQuality || 0;
        const scoreImprovement = newScore - (analysis.baselineScore || 0);

        return {
          parameter: 'interestRate' as const,
          currentValue: currentRate,
          newValue: rate,
          change: rate - currentRate,
          changePercent: ((rate - currentRate) / currentRate) * 100,
          newDealQuality: newScore,
          newVerdict: newDecision.verdict,
          scoreImprovement,
          description: `${rate}% interest rate: Score ${newScore}/100 (${newDecision.verdict})`
        };

      } catch (error) {
        logger.warn(`Failed to calculate rate scenario for ${rate}%:`, error);
        return null;
      }
    });

    return (await Promise.all(scenarioPromises)).filter(s => s !== null) as SensitivityScenario[];
  }

  /**
   * Analyze the most viable paths to BUY territory
   */
  private analyzePathToBuy(scenarios: SensitivityScenario[], buyThreshold: number) {
    const buyableScenarios = scenarios.filter(s => s.newDealQuality >= buyThreshold);
    
    if (buyableScenarios.length === 0) {
      return {
        easiest: scenarios.sort((a, b) => b.scoreImprovement - a.scoreImprovement)[0],
        mostRealistic: scenarios.sort((a, b) => b.scoreImprovement - a.scoreImprovement)[0],
        alternatives: []
      };
    }

    // Sort by smallest change required (easiest to achieve)
    const easiest = buyableScenarios.sort((a, b) => 
      Math.abs(a.changePercent) - Math.abs(b.changePercent)
    )[0];

    // Most realistic considers market feasibility
    const mostRealistic = this.selectMostRealistic(buyableScenarios);

    // Alternative paths
    const alternatives = buyableScenarios
      .filter(s => s !== easiest && s !== mostRealistic)
      .slice(0, 2);

    return { easiest, mostRealistic, alternatives };
  }

  /**
   * Select most realistic scenario based on market context
   */
  private selectMostRealistic(scenarios: SensitivityScenario[]): SensitivityScenario {
    // Prefer financing improvements over large price reductions
    const financingScenarios = scenarios.filter(s => s.parameter === 'interestRate');
    if (financingScenarios.length > 0) {
      return financingScenarios[0];
    }

    // Prefer modest rent increases over large price cuts
    const rentScenarios = scenarios.filter(s => s.parameter === 'rent' && Math.abs(s.changePercent) < 15);
    if (rentScenarios.length > 0) {
      return rentScenarios[0];
    }

    // Fall back to smallest price reduction
    const priceScenarios = scenarios.filter(s => s.parameter === 'price');
    return priceScenarios.sort((a, b) => Math.abs(a.changePercent) - Math.abs(b.changePercent))[0];
  }

  /**
   * Generate market-aware negotiation guidance
   */
  private generateNegotiationGuidance(
    scenarios: SensitivityScenario[],
    propertyData: SFRData,
    marketIntelligence: any,
    currentScore: number,
    buyThreshold: number
  ) {
    const scoreGap = buyThreshold - currentScore;
    
    // Determine market tier for context-aware guidance
    const marketTier = marketIntelligence?.marketTier || 2;
    
    if (marketTier === 1) {
      // Tier 1 markets: Focus on terms, not price
      return {
        focus: 'financing' as const,
        rationale: 'Tier 1 market - sellers resist price concessions, focus on financing terms',
        specificTargets: [
          'Request seller financing at 5.5-6.0%',
          'Ask for closing cost credits ($10-15k)',
          'Negotiate inspection/repair credits'
        ]
      };
    } else if (scoreGap > 15) {
      // Large gap: Multiple improvements needed
      return {
        focus: 'price' as const,
        rationale: 'Significant improvements needed - focus on price reduction',
        specificTargets: [
          `Target ${Math.round(scoreGap * 2000)} reduction`,
          'Consider walking away if seller inflexible',
          'Look for motivated seller situations'
        ]
      };
    } else {
      // Moderate gap: Multiple options available
      return {
        focus: 'terms' as const,
        rationale: 'Multiple negotiation paths available',
        specificTargets: [
          'Price reduction OR better financing',
          'Combination approach: modest price + better terms',
          'Focus on seller\'s primary motivation'
        ]
      };
    }
  }

  /**
   * Simplified analysis recalculation for scenarios
   */
  private async recalculateAnalysis(propertyData: SFRData, baseAnalysis: any): Promise<any> {
    // This would trigger a lightweight recalculation of key metrics
    // For now, we'll simulate the key changes that affect scoring
    
    const modifiedAnalysis = { ...baseAnalysis };
    
    // Update cash flow based on price/rent changes
    if (propertyData.purchasePrice !== baseAnalysis.propertyData?.purchasePrice) {
      // Recalculate monthly payment and cash flow
      // This is a simplified version - in reality we'd call the full analysis pipeline
      const priceDiff = propertyData.purchasePrice - (baseAnalysis.propertyData?.purchasePrice || 0);
      const monthlyPaymentDiff = (priceDiff * 0.8) * 0.007; // Rough approximation
      modifiedAnalysis.monthlyAnalysis = {
        ...modifiedAnalysis.monthlyAnalysis,
        cashFlow: (modifiedAnalysis.monthlyAnalysis?.cashFlow || 0) - monthlyPaymentDiff
      };
    }

    if (propertyData.monthlyRent !== baseAnalysis.propertyData?.monthlyRent) {
      const rentDiff = (propertyData.monthlyRent || 0) - (baseAnalysis.propertyData?.monthlyRent || 0);
      modifiedAnalysis.monthlyAnalysis = {
        ...modifiedAnalysis.monthlyAnalysis,
        cashFlow: (modifiedAnalysis.monthlyAnalysis?.cashFlow || 0) + rentDiff
      };
    }

    return modifiedAnalysis;
  }
}

export const sensitivityAnalysisService = new SensitivityAnalysisService();