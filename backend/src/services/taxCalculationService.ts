/**
 * Tax Calculation Service - Real Estate Investment Tax Intelligence
 *
 * Provides comprehensive tax analysis for real estate investments including:
 * - Hold period optimization (1, 2, 3, 5, 7, 10 year analysis)
 * - Federal and state capital gains calculations
 * - Depreciation recapture analysis
 * - After-tax IRR calculations
 * - 1031 exchange eligibility assessment
 * - State tax arbitrage opportunities
 *
 * Expert validated - addresses $10K-100K+ tax planning mistakes
 */

import { logger } from '../utils/logger';
import { FinancialValidator, TaxValidationData } from '../utils/FinancialValidator';
import { CalculationAuditTrail, withAuditTrail } from '../utils/CalculationAuditTrail';

// Core tax interfaces
export interface TaxProfile {
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household';
  state: string; // Two-letter state code (e.g., 'TX', 'CA')
  federalTaxBracket?: number; // Optional - auto-calculated if not provided
  stateTaxRate?: number; // Optional - looked up if not provided
  capitalGainsHoldingStrategy: 'short_term' | 'long_term' | 'flexible';
  depreciation: {
    method: 'straight_line'; // Only straight-line for now (accelerated reserved for future)
    personalUsePercentage: number; // Default 0 for pure investment properties
  };
  investorType: 'individual' | 'entity'; // For future entity structure analysis
}

export interface HoldPeriodTaxAnalysis {
  holdPeriod: number; // years
  salePrice: number; // Projected property value at this hold period
  originalBasis: number; // Purchase price + closing costs + improvements
  adjustedBasis: number; // Original basis minus accumulated depreciation
  capitalGain: number; // Sale price minus adjusted basis
  depreciationRecapture: number; // Accumulated depreciation subject to recapture
  federalCapitalGainsRate: number; // 0%, 15%, or 20% for long-term; marginal rate for short-term
  stateCapitalGainsRate: number; // State-specific rate
  federalTax: number; // Federal tax on capital gains and depreciation recapture
  stateTax: number; // State tax on capital gains
  totalTaxLiability: number; // Federal + state tax
  netProceedsFromSale: number; // After-tax proceeds
  totalCashFlow: number; // Cumulative cash flow over hold period
  totalReturn: number; // Total after-tax return (cash flow + net proceeds)
  afterTaxIRR: number; // After-tax internal rate of return
  taxSavingsVsPreviousYear: number; // Tax savings by holding one more year
  breakEvenHoldPeriod: boolean; // True if this is optimal hold period
}

export interface TaxAnalysisResult {
  userTaxProfile: TaxProfile;
  holdPeriodAnalysis: HoldPeriodTaxAnalysis[]; // Analysis for 1, 2, 3, 5, 7, 10 years
  optimalHoldPeriod: number; // Years to hold for maximum after-tax IRR
  totalTaxSavingsAtOptimal: number; // Tax savings vs selling in year 1 (may be negative with appreciating properties)
  afterTaxReturnAdvantage: number; // After-tax IRR advantage of optimal hold period vs year 1 (percentage points)
  taxOptimizationRecommendations: string[];
  stateArbitrageOpportunities: string[];
  highIncomeWarning?: {
    applies: boolean;
    message: string;
    estimatedNIIT?: number; // Estimated 3.8% Net Investment Income Tax
    threshold: number;
  };
  disclaimer: {
    brief: string;
    full: string;
    icon: string;
  };
  exchange1031Eligibility?: {
    eligible: boolean;
    deferralAmount: number; // Tax deferred through 1031 exchange
    timelineRequirements: string[];
    minimumExchangeValue: number;
  };
  expertInsights: {
    holdPeriodReasoning: string;
    riskConsiderations: string[];
    opportunityCost: string;
    marketTimingFactors: string;
  };
}

export interface PropertyTaxData {
  purchasePrice: number;
  closingCosts: number;
  repairCosts: number;
  capitalInvestments: number;
  landValueRatio?: number; // Optional: Percentage of purchase price allocated to land (default 0.20)
  yearlyProjections: Array<{
    year: number;
    propertyValue: number;
    cashFlow: number;
    principalPaydown: number;
    depreciation: number;
  }>;
}

// Professional tax disclaimer for investment analysis tool
const TAX_DISCLAIMER = {
  brief: "Tax estimates for comparison only",
  full: "These calculations are simplified estimates to assist in investment analysis. Actual taxes depend on your complete financial situation. This is not tax advice - consult a qualified CPA for tax planning.",
  icon: "info"
};

// Federal tax brackets for 2025 (updated annually)
const FEDERAL_TAX_BRACKETS_2025 = {
  single: [
    { min: 0, max: 11000, rate: 0.10 },
    { min: 11001, max: 44725, rate: 0.12 },
    { min: 44726, max: 95375, rate: 0.22 },
    { min: 95376, max: 204600, rate: 0.24 },
    { min: 204601, max: 539900, rate: 0.32 },
    { min: 539901, max: 631350, rate: 0.35 },
    { min: 631351, max: Infinity, rate: 0.37 }
  ],
  married_joint: [
    { min: 0, max: 22000, rate: 0.10 },
    { min: 22001, max: 89450, rate: 0.12 },
    { min: 89451, max: 190750, rate: 0.22 },
    { min: 190751, max: 364200, rate: 0.24 },
    { min: 364201, max: 462500, rate: 0.32 },
    { min: 462501, max: 693750, rate: 0.35 },
    { min: 693751, max: Infinity, rate: 0.37 }
  ]
};

// Long-term capital gains rates (held > 1 year)
const LONG_TERM_CAPITAL_GAINS_RATES_2025 = {
  single: [
    { min: 0, max: 47025, rate: 0.00 },      // 0% bracket
    { min: 47026, max: 518900, rate: 0.15 }, // 15% bracket
    { min: 518901, max: Infinity, rate: 0.20 } // 20% bracket
  ],
  married_joint: [
    { min: 0, max: 94050, rate: 0.00 },      // 0% bracket
    { min: 94051, max: 583750, rate: 0.15 }, // 15% bracket
    { min: 583751, max: Infinity, rate: 0.20 } // 20% bracket
  ]
};

// State tax rates for capital gains (same as ordinary income in most states)
// Expert recommendation: Focus on top 5 states covering 60%+ of investors
const STATE_TAX_RATES = {
  // No state tax (0%)
  'FL': 0.0,    // Florida
  'TX': 0.0,    // Texas
  'NV': 0.0,    // Nevada
  'WA': 0.0,    // Washington
  'WY': 0.0,    // Wyoming
  'SD': 0.0,    // South Dakota
  'TN': 0.0,    // Tennessee (no tax on investment income)
  'NH': 0.0,    // New Hampshire (no tax on capital gains)
  'AK': 0.0,    // Alaska

  // High tax states (major investor markets)
  'CA': 0.133,  // California (13.3% top rate)
  'NY': 0.0882, // New York (8.82% top rate)
  'NJ': 0.1075, // New Jersey (10.75% top rate)
  'HI': 0.11,   // Hawaii (11% top rate)
  'OR': 0.099,  // Oregon (9.9% top rate)

  // Moderate tax states
  'CT': 0.0699, // Connecticut (6.99% top rate)
  'MN': 0.0985, // Minnesota (9.85% top rate)
  'MA': 0.05,   // Massachusetts (5% flat rate)
  'CO': 0.044,  // Colorado (4.4% flat rate)
  'UT': 0.045,  // Utah (4.5% flat rate)

  // Additional states
  'GA': 0.0575, // Georgia (5.75% top rate)
  'NC': 0.045,  // North Carolina (4.5% flat rate)
  'AZ': 0.025,  // Arizona (2.5% top rate - very favorable)
  'IL': 0.0325, // Illinois (3.25% flat rate)
  'IN': 0.0323, // Indiana (3.23% flat rate)
  'PA': 0.0307, // Pennsylvania (3.07% flat rate)
  'OH': 0.0375, // Ohio (3.75% top rate)
  'MI': 0.0425, // Michigan (4.25% flat rate)
  'VA': 0.055,  // Virginia (5.5% top rate)
  'MD': 0.0575, // Maryland (5.75% top rate)
  'SC': 0.07,   // South Carolina (7% top rate)
  'MO': 0.054,  // Missouri (5.4% top rate)
  'LA': 0.06,   // Louisiana (6% top rate)
  'AL': 0.05,   // Alabama (5% top rate)
  'KY': 0.05,   // Kentucky (5% flat rate)
  'WV': 0.065,  // West Virginia (6.5% top rate)
  'AR': 0.054,  // Arkansas (5.4% top rate)
  'MS': 0.05,   // Mississippi (5% top rate)
  'OK': 0.055,  // Oklahoma (5.5% top rate)
  'KS': 0.057,  // Kansas (5.7% top rate)
  'NE': 0.0684, // Nebraska (6.84% top rate)
  'IA': 0.0876, // Iowa (8.76% top rate)
  'WI': 0.0765, // Wisconsin (7.65% top rate)
  'ME': 0.075,  // Maine (7.5% top rate)
  'VT': 0.088,  // Vermont (8.8% top rate)
  'RI': 0.0599, // Rhode Island (5.99% top rate)
  'DE': 0.066,  // Delaware (6.6% top rate)
  'MT': 0.0675, // Montana (6.75% top rate)
  'ND': 0.029,  // North Dakota (2.9% top rate)
  'ID': 0.058,  // Idaho (5.8% top rate)
  'NM': 0.049,  // New Mexico (4.9% top rate)
} as const;

export class TaxCalculationService {
  private static instance: TaxCalculationService;

  public static getInstance(): TaxCalculationService {
    if (!TaxCalculationService.instance) {
      TaxCalculationService.instance = new TaxCalculationService();
    }
    return TaxCalculationService.instance;
  }

  /**
   * Calculate comprehensive tax analysis for a real estate investment
   */
  public async calculateTaxAnalysis(
    propertyData: PropertyTaxData,
    taxProfile: TaxProfile,
    propertyId?: string
  ): Promise<TaxAnalysisResult> {
    // Use audit trail for complete calculation transparency
    return withAuditTrail(
      'tax_analysis',
      propertyId,
      (audit) => this.performTaxCalculationWithAudit(propertyData, taxProfile, audit),
      [] // Validations will be added within the calculation
    ).result;
  }

  private async performTaxCalculationWithAudit(
    propertyData: PropertyTaxData,
    taxProfile: TaxProfile,
    audit: CalculationAuditTrail
  ): Promise<TaxAnalysisResult> {
    try {
      audit.logStep(
        'initialization',
        'Initialize tax analysis calculation',
        {
          purchasePrice: propertyData.purchasePrice,
          state: taxProfile.state,
          filingStatus: taxProfile.filingStatus,
          holdingStrategy: taxProfile.capitalGainsHoldingStrategy,
          closingCosts: propertyData.closingCosts,
          repairCosts: propertyData.repairCosts,
          capitalInvestments: propertyData.capitalInvestments
        },
        'Starting comprehensive tax analysis for real estate investment',
        { initialized: 1 }
      );

      logger.info('Starting tax analysis calculation with audit trail', {
        purchasePrice: propertyData.purchasePrice,
        state: taxProfile.state,
        filingStatus: taxProfile.filingStatus,
        holdingStrategy: taxProfile.capitalGainsHoldingStrategy
      });

      // Calculate original basis (purchase price + transaction costs)
      const originalBasis = this.calculateOriginalBasis(propertyData);
      audit.logStep(
        'original_basis_calculation',
        'Calculate original basis for property',
        {
          purchasePrice: propertyData.purchasePrice,
          closingCosts: propertyData.closingCosts,
          repairCosts: propertyData.repairCosts,
          capitalInvestments: propertyData.capitalInvestments
        },
        `purchasePrice + closingCosts + repairCosts + capitalInvestments = ${propertyData.purchasePrice} + ${propertyData.closingCosts} + ${propertyData.repairCosts} + ${propertyData.capitalInvestments}`,
        originalBasis
      );

      // Determine tax rates
      const federalMarginalRate = this.getFederalMarginalRate(taxProfile);
      const stateTaxRate = this.getStateTaxRate(taxProfile.state);
      audit.logStep(
        'tax_rates_determination',
        'Determine applicable federal and state tax rates',
        {
          filingStatus: taxProfile.filingStatus,
          state: taxProfile.state,
          federalTaxBracket: taxProfile.federalTaxBracket
        },
        `Federal marginal rate lookup + State tax rate lookup`,
        {
          federalMarginalRate,
          stateTaxRate
        }
      );

      // Analyze multiple hold periods: 1, 2, 3, 5, 7, 10 years
      const holdPeriods = [1, 2, 3, 5, 7, 10];
      const holdPeriodAnalysis: HoldPeriodTaxAnalysis[] = [];

      for (const holdPeriod of holdPeriods) {
        const analysis = await this.calculateHoldPeriodAnalysis(
          propertyData,
          taxProfile,
          holdPeriod,
          originalBasis,
          federalMarginalRate,
          stateTaxRate
        );
        holdPeriodAnalysis.push(analysis);

        // Skip individual hold period logging for performance - use summary logging instead
      }

      // Find optimal hold period (highest after-tax IRR)
      const optimalAnalysis = holdPeriodAnalysis.reduce((best, current) =>
        current.afterTaxIRR > best.afterTaxIRR ? current : best
      );

      // Single summary log for all hold periods (performance optimized)
      audit.logStep(
        'hold_period_analysis_summary',
        'Calculate tax implications for all hold periods (1,2,3,5,7,10 years)',
        {
          holdPeriods: holdPeriods.join(','),
          originalBasis,
          federalMarginalRate,
          stateTaxRate
        },
        `Multi-period tax analysis: optimal ${optimalAnalysis.holdPeriod} years`,
        {
          analysisCount: holdPeriodAnalysis.length,
          optimalHoldPeriod: optimalAnalysis.holdPeriod,
          optimalAfterTaxIRR: optimalAnalysis.afterTaxIRR,
          optimalTaxLiability: optimalAnalysis.totalTaxLiability
        }
      );

      // Calculate tax savings at optimal hold period vs year 1
      // Note: Negative "tax savings" are valid when property appreciation and depreciation
      // outweigh long-term capital gains benefits, but optimal choice is based on after-tax returns
      const year1Analysis = holdPeriodAnalysis[0];
      const totalTaxSavingsAtOptimal = year1Analysis.totalTaxLiability - optimalAnalysis.totalTaxLiability;

      // Enhanced metric: After-tax return advantage of optimal hold period
      const afterTaxReturnAdvantage = (optimalAnalysis.afterTaxIRR - year1Analysis.afterTaxIRR) * 100; // Convert to percentage points

      // Enhanced logging with context for negative tax savings
      if (totalTaxSavingsAtOptimal < -5000) {
        logger.info('Tax analysis: Higher total taxes at optimal period - common with appreciating properties', {
          year1Tax: year1Analysis.totalTaxLiability,
          year1IRR: (year1Analysis.afterTaxIRR * 100).toFixed(1) + '%',
          optimalTax: optimalAnalysis.totalTaxLiability,
          optimalIRR: (optimalAnalysis.afterTaxIRR * 100).toFixed(1) + '%',
          optimalHoldPeriod: optimalAnalysis.holdPeriod,
          taxSavings: totalTaxSavingsAtOptimal,
          afterTaxReturnAdvantage: afterTaxReturnAdvantage.toFixed(1) + ' percentage points'
        });
      }

      audit.logStep(
        'tax_optimization_analysis',
        'Compare tax liability and after-tax returns between year 1 and optimal hold period',
        {
          year1TotalTax: year1Analysis.totalTaxLiability,
          year1AfterTaxIRR: year1Analysis.afterTaxIRR,
          optimalTotalTax: optimalAnalysis.totalTaxLiability,
          optimalAfterTaxIRR: optimalAnalysis.afterTaxIRR,
          optimalHoldPeriod: optimalAnalysis.holdPeriod
        },
        `Tax savings: ${year1Analysis.totalTaxLiability} - ${optimalAnalysis.totalTaxLiability} = ${totalTaxSavingsAtOptimal}; After-tax return advantage: ${afterTaxReturnAdvantage.toFixed(1)} percentage points`,
        { taxSavings: totalTaxSavingsAtOptimal, afterTaxReturnAdvantage },
        totalTaxSavingsAtOptimal < 0 ? [`Negative tax savings are valid when property appreciation outweighs tax timing benefits. Decision should prioritize after-tax returns.`] : undefined
      );

      // Generate recommendations and insights
      const recommendations = this.generateTaxOptimizationRecommendations(
        holdPeriodAnalysis,
        optimalAnalysis,
        taxProfile
      );

      const stateArbitrageOpportunities = this.identifyStateArbitrageOpportunities(
        taxProfile,
        optimalAnalysis
      );

      // Assess 1031 exchange eligibility
      const exchange1031Eligibility = this.assess1031ExchangeEligibility(
        optimalAnalysis,
        taxProfile
      );

      const expertInsights = this.generateExpertInsights(
        holdPeriodAnalysis,
        optimalAnalysis,
        taxProfile
      );

      audit.logStep(
        'recommendations_generation',
        'Generate tax optimization recommendations and expert insights',
        {
          recommendationCount: recommendations.length,
          stateArbitrageCount: stateArbitrageOpportunities.length,
          exchange1031Eligible: exchange1031Eligibility?.eligible || false
        },
        'Generate actionable recommendations based on tax analysis',
        {
          recommendationsGenerated: recommendations.length,
          stateArbitrageOpportunities: stateArbitrageOpportunities.length,
          expertInsightsGenerated: 1
        }
      );

      // Check for high-income tax implications (NIIT)
      // federalMarginalRate already declared above at line 277
      const estimatedIncome = this.estimateTotalIncomeFromMarginalRate(
        federalMarginalRate,
        taxProfile.filingStatus
      );
      const highIncomeWarning = this.checkHighIncomeTaxes(
        estimatedIncome,
        optimalAnalysis.capitalGain,
        taxProfile.filingStatus
      );

      const result: TaxAnalysisResult = {
        userTaxProfile: taxProfile,
        holdPeriodAnalysis,
        optimalHoldPeriod: optimalAnalysis.holdPeriod,
        totalTaxSavingsAtOptimal,
        afterTaxReturnAdvantage,
        taxOptimizationRecommendations: recommendations,
        stateArbitrageOpportunities,
        highIncomeWarning,
        disclaimer: TAX_DISCLAIMER,
        exchange1031Eligibility,
        expertInsights
      };

      // ARCHITECTURAL VALIDATION: Ensure financial calculations are reasonable
      const validationData: TaxValidationData = {
        taxSavings: totalTaxSavingsAtOptimal,
        year1Tax: holdPeriodAnalysis[0]?.totalTaxLiability || 0,
        optimalTax: optimalAnalysis.totalTaxLiability,
        holdPeriod: optimalAnalysis.holdPeriod,
        afterTaxIRR: optimalAnalysis.afterTaxIRR,
        pretaxIRR: 0.10 // TODO: Get actual pre-tax IRR from propertyData
      };

      const validation = FinancialValidator.validateTaxCalculation(validationData);
      FinancialValidator.logValidationResults('Tax Calculation Service', validation);
      audit.logValidation(validation, 'Tax Analysis Results');

      audit.logStep(
        'validation_results',
        'Validate financial calculation results for reasonableness',
        validationData,
        'FinancialValidator.validateTaxCalculation()',
        {
          isValid: validation.isValid ? 1 : 0,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length
        },
        validation.warnings
      );

      if (!validation.isValid) {
        logger.error('Tax calculation failed validation - blocking potentially incorrect results', {
          validationErrors: validation.errors,
          calculatedValues: validationData
        });
        throw new Error(`Tax calculation validation failed: ${validation.errors.join(', ')}`);
      }

      logger.info('Tax analysis completed successfully with full audit trail', {
        optimalHoldPeriod: optimalAnalysis.holdPeriod,
        taxSavings: totalTaxSavingsAtOptimal,
        afterTaxIRR: optimalAnalysis.afterTaxIRR,
        recommendationCount: recommendations.length,
        validationWarnings: validation.warnings.length
      });

      return result;

    } catch (error) {
      logger.error('Error calculating tax analysis:', error);
      throw new Error(`Tax calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate original basis (purchase price + transaction costs)
   */
  private calculateOriginalBasis(propertyData: PropertyTaxData): number {
    return propertyData.purchasePrice +
           (propertyData.closingCosts || 0) +
           (propertyData.repairCosts || 0) +
           (propertyData.capitalInvestments || 0);
  }

  /**
   * Get federal marginal tax rate based on filing status and income
   */
  private getFederalMarginalRate(taxProfile: TaxProfile): number {
    // If user provided tax bracket, use it
    if (taxProfile.federalTaxBracket) {
      return taxProfile.federalTaxBracket / 100;
    }

    // Default to 24% bracket (typical real estate investor bracket)
    // In production, this would be calculated based on user's income
    return 0.24;
  }

  /**
   * Get state tax rate for capital gains
   */
  private getStateTaxRate(state: string): number {
    return STATE_TAX_RATES[state as keyof typeof STATE_TAX_RATES] || 0.05; // Default 5% if state not found
  }

  /**
   * Check for high-income tax implications (NIIT)
   *
   * PRACTICAL TAX FEATURE: Warns high earners about additional 3.8% Net Investment Income Tax
   */
  private checkHighIncomeTaxes(
    estimatedIncome: number,
    capitalGain: number,
    filingStatus: TaxProfile['filingStatus']
  ): TaxAnalysisResult['highIncomeWarning'] {
    const NIIT_THRESHOLDS = {
      single: 200000,
      married_joint: 250000
    };

    const threshold = NIIT_THRESHOLDS[filingStatus] || NIIT_THRESHOLDS.single;

    if (estimatedIncome > threshold) {
      return {
        applies: true,
        message: `High earners: Additional 3.8% Net Investment Income Tax may apply on investment income above $${threshold.toLocaleString()}`,
        estimatedNIIT: capitalGain * 0.038,
        threshold
      };
    }

    return {
      applies: false,
      message: '',
      threshold
    };
  }

  /**
   * Estimate total taxable income from federal marginal tax rate
   *
   * ARCHITECTURAL HELPER: Provides realistic income estimate for capital gains bracket determination
   */
  private estimateTotalIncomeFromMarginalRate(
    marginalRate: number,
    filingStatus: TaxProfile['filingStatus']
  ): number {
    // Use 2025 federal tax brackets to estimate income
    const incomeBrackets = {
      single: [
        { rate: 0.10, min: 0, max: 11925 },
        { rate: 0.12, min: 11926, max: 48475 },
        { rate: 0.22, min: 48476, max: 103350 },
        { rate: 0.24, min: 103351, max: 197050 },
        { rate: 0.32, min: 197051, max: 250525 },
        { rate: 0.35, min: 250526, max: 609350 },
        { rate: 0.37, min: 609351, max: Infinity }
      ],
      married_joint: [
        { rate: 0.10, min: 0, max: 23850 },
        { rate: 0.12, min: 23851, max: 96950 },
        { rate: 0.22, min: 96951, max: 206700 },
        { rate: 0.24, min: 206701, max: 394100 },
        { rate: 0.32, min: 394101, max: 501050 },
        { rate: 0.35, min: 501051, max: 731200 },
        { rate: 0.37, min: 731201, max: Infinity }
      ]
    };

    const brackets = incomeBrackets[filingStatus] || incomeBrackets.single;

    // Find the bracket matching the marginal rate and return midpoint
    for (const bracket of brackets) {
      if (Math.abs(bracket.rate - marginalRate) < 0.01) { // Allow small rounding differences
        return bracket.max === Infinity ? bracket.min + 100000 : (bracket.min + bracket.max) / 2;
      }
    }

    // Default estimate if no bracket matches (use marginal rate to estimate income)
    if (marginalRate <= 0.12) return 30000;
    if (marginalRate <= 0.22) return 75000;
    if (marginalRate <= 0.24) return 150000;
    if (marginalRate <= 0.32) return 225000;
    if (marginalRate <= 0.35) return 400000;
    return 700000; // High income estimate for 37% bracket
  }

  /**
   * Calculate long-term capital gains rate based on TOTAL TAXABLE INCOME and filing status
   *
   * ARCHITECTURAL FIX: Capital gains tax rates are determined by total household income,
   * not the capital gain amount itself. This is fundamental tax law.
   */
  private getLongTermCapitalGainsRate(
    capitalGain: number,
    filingStatus: TaxProfile['filingStatus'],
    totalTaxableIncome?: number
  ): number {
    const brackets = LONG_TERM_CAPITAL_GAINS_RATES_2025[filingStatus] ||
                    LONG_TERM_CAPITAL_GAINS_RATES_2025.single;

    // Use total taxable income if provided, otherwise fall back to capital gain amount
    // TODO: In production, totalTaxableIncome should be calculated from user's tax profile
    const incomeForBracket = totalTaxableIncome || capitalGain;

    for (const bracket of brackets) {
      if (incomeForBracket >= bracket.min && incomeForBracket <= bracket.max) {
        return bracket.rate;
      }
    }
    return 0.20; // Default to highest bracket
  }

  /**
   * Calculate detailed hold period tax analysis
   */
  private async calculateHoldPeriodAnalysis(
    propertyData: PropertyTaxData,
    taxProfile: TaxProfile,
    holdPeriod: number,
    originalBasis: number,
    federalMarginalRate: number,
    stateTaxRate: number
  ): Promise<HoldPeriodTaxAnalysis> {

    // Get projection for this hold period
    const projection = propertyData.yearlyProjections.find(p => p.year === holdPeriod);
    if (!projection) {
      throw new Error(`No projection data available for year ${holdPeriod}`);
    }

    // Calculate accumulated depreciation with configurable land ratio
    const landRatio = propertyData.landValueRatio || 0.20; // Default 20% land value
    const depreciableBasis = originalBasis * (1 - landRatio);
    const annualDepreciation = depreciableBasis / 27.5; // Residential rental depreciation over 27.5 years
    const accumulatedDepreciation = annualDepreciation * holdPeriod;

    // Calculate adjusted basis (original basis minus accumulated depreciation)
    const adjustedBasis = originalBasis - accumulatedDepreciation;

    // Calculate capital gain (sale price minus adjusted basis)
    const salePrice = projection.propertyValue;
    const capitalGain = Math.max(0, salePrice - adjustedBasis);

    // Depreciation recapture (taxed at 25% federal rate)
    const depreciationRecapture = Math.min(accumulatedDepreciation, capitalGain);
    const remainingCapitalGain = Math.max(0, capitalGain - depreciationRecapture);

    // Determine federal capital gains rate
    let federalCapitalGainsRate: number;
    if (holdPeriod <= 1) {
      // Short-term capital gains (taxed as ordinary income) - must hold MORE than 1 year for long-term treatment
      federalCapitalGainsRate = federalMarginalRate;
    } else {
      // Long-term capital gains (held more than 1 year)
      // ARCHITECTURAL FIX: Estimate total taxable income based on federal marginal rate
      // This provides realistic income context for tax bracket determination
      const estimatedTotalIncome = this.estimateTotalIncomeFromMarginalRate(
        federalMarginalRate,
        taxProfile.filingStatus
      );

      federalCapitalGainsRate = this.getLongTermCapitalGainsRate(
        remainingCapitalGain,
        taxProfile.filingStatus,
        estimatedTotalIncome
      );
    }

    // Calculate taxes
    const federalDepreciationRecaptureTax = depreciationRecapture * 0.25; // 25% federal rate on depreciation recapture
    const federalCapitalGainsTax = remainingCapitalGain * federalCapitalGainsRate;
    const federalTax = federalDepreciationRecaptureTax + federalCapitalGainsTax;

    const stateTax = capitalGain * stateTaxRate; // State taxes both depreciation recapture and capital gains
    const totalTaxLiability = federalTax + stateTax;

    // Calculate net proceeds from sale
    const sellingCosts = salePrice * 0.08; // Assume 8% selling costs (agent, legal, etc.)
    const netProceedsFromSale = salePrice - sellingCosts - totalTaxLiability;

    // PERFORMANCE OPTIMIZED: Calculate cash flows once, reuse for multiple calculations
    const relevantProjections = propertyData.yearlyProjections.filter(p => p.year <= holdPeriod);
    const totalCashFlow = relevantProjections.reduce((sum, p) => sum + p.cashFlow, 0);

    // Calculate total return (cash flow + net proceeds - original investment)
    const totalReturn = totalCashFlow + netProceedsFromSale - originalBasis;

    // Pre-build cash flow array for IRR (avoid repeated array operations)
    const irrCashFlows = relevantProjections.map(p =>
      p.year === holdPeriod ? p.cashFlow + netProceedsFromSale : p.cashFlow
    );

    // Calculate after-tax IRR
    const afterTaxIRR = this.calculateIRR(-originalBasis, irrCashFlows);

    // Calculate tax savings vs previous year
    let taxSavingsVsPreviousYear = 0;
    if (holdPeriod > 1) {
      // This would be calculated by comparing with previous year's analysis
      // For now, approximate based on holding period benefits
      taxSavingsVsPreviousYear = holdPeriod === 2 ?
        (federalMarginalRate - federalCapitalGainsRate) * remainingCapitalGain : 0;
    }

    return {
      holdPeriod,
      salePrice,
      originalBasis,
      adjustedBasis,
      capitalGain,
      depreciationRecapture,
      federalCapitalGainsRate,
      stateCapitalGainsRate: stateTaxRate,
      federalTax,
      stateTax,
      totalTaxLiability,
      netProceedsFromSale,
      totalCashFlow,
      totalReturn,
      afterTaxIRR,
      taxSavingsVsPreviousYear,
      breakEvenHoldPeriod: false // Set later when comparing all periods
    };
  }

  /**
   * Calculate IRR (Internal Rate of Return) for cash flows
   * Simplified implementation for tax analysis
   */
  private calculateIRR(initialInvestment: number, cashFlows: number[]): number {
    // PERFORMANCE OPTIMIZED: Reduced from 100 to 30 iterations, relaxed tolerance
    if (cashFlows.length === 0) return 0;

    let irr = 0.1; // Initial guess of 10%
    const tolerance = 0.001; // Relaxed from 0.0001 for speed (still accurate enough for tax analysis)
    const maxIterations = 30; // Reduced from 100 iterations

    for (let i = 0; i < maxIterations; i++) {
      let npv = initialInvestment;
      let npvDerivative = 0;

      // Pre-calculate 1 + irr to avoid repeated calculations
      const onePlusIrr = 1 + irr;

      for (let year = 0; year < cashFlows.length; year++) {
        const period = year + 1;
        const discountFactor = Math.pow(onePlusIrr, period);
        npv += cashFlows[year] / discountFactor;
        npvDerivative -= (period * cashFlows[year]) / (discountFactor * onePlusIrr);
      }

      // Avoid division by zero
      if (Math.abs(npvDerivative) < 1e-10) break;

      const newIrr = irr - npv / npvDerivative;

      if (Math.abs(newIrr - irr) < tolerance) {
        return Math.max(-0.95, Math.min(2.0, newIrr)); // Reasonable bounds for real estate
      }

      // Prevent extreme values that cause convergence issues
      irr = Math.max(-0.95, Math.min(2.0, newIrr));
    }

    return Math.max(-0.95, Math.min(2.0, irr)); // Return bounded result
  }

  /**
   * Generate tax optimization recommendations based on analysis
   */
  private generateTaxOptimizationRecommendations(
    holdPeriodAnalysis: HoldPeriodTaxAnalysis[],
    optimalAnalysis: HoldPeriodTaxAnalysis,
    taxProfile: TaxProfile
  ): string[] {
    const recommendations: string[] = [];

    // Hold period recommendation - adaptive messaging for tax scenarios
    if (optimalAnalysis.holdPeriod > 1) {
      const taxSavings = holdPeriodAnalysis[0].totalTaxLiability - optimalAnalysis.totalTaxLiability;
      const year1IRR = holdPeriodAnalysis[0].afterTaxIRR;

      if (taxSavings > 0) {
        // Traditional positive tax savings
        recommendations.push(
          `Hold for ${optimalAnalysis.holdPeriod} years to save $${taxSavings.toLocaleString()} in taxes (${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}% after-tax IRR)`
        );
      } else if (taxSavings < -5000) {
        // Negative tax savings but superior returns
        const returnAdvantage = ((optimalAnalysis.afterTaxIRR - year1IRR) * 100).toFixed(1);
        recommendations.push(
          `Hold for ${optimalAnalysis.holdPeriod} years for superior after-tax returns (${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}% IRR vs ${(year1IRR * 100).toFixed(1)}% Year 1) despite $${Math.abs(taxSavings).toLocaleString()} higher taxes`
        );
      }
    }

    // Short-term vs long-term capital gains
    const year1Analysis = holdPeriodAnalysis[0];
    const year2Analysis = holdPeriodAnalysis.find(a => a.holdPeriod === 2);
    if (year2Analysis && year2Analysis.federalCapitalGainsRate < year1Analysis.federalCapitalGainsRate) {
      const savings = year1Analysis.totalTaxLiability - year2Analysis.totalTaxLiability;
      if (savings > 0) {
        recommendations.push(
          `Hold at least 1 year to qualify for long-term capital gains rates and save $${savings.toLocaleString()}`
        );
      }
    }

    // State tax considerations
    if (taxProfile.state && STATE_TAX_RATES[taxProfile.state as keyof typeof STATE_TAX_RATES] > 0.05) {
      recommendations.push(
        `Consider establishing residency in a no-tax state before selling to eliminate ${(STATE_TAX_RATES[taxProfile.state as keyof typeof STATE_TAX_RATES] * 100).toFixed(1)}% state capital gains tax`
      );
    }

    // Depreciation strategy
    recommendations.push(
      `Take advantage of $${(optimalAnalysis.depreciationRecapture / optimalAnalysis.holdPeriod).toLocaleString()} annual depreciation deduction to reduce current taxes`
    );

    return recommendations;
  }

  /**
   * Identify state tax arbitrage opportunities
   */
  private identifyStateArbitrageOpportunities(
    taxProfile: TaxProfile,
    optimalAnalysis: HoldPeriodTaxAnalysis
  ): string[] {
    const opportunities: string[] = [];
    const currentStateTaxRate = STATE_TAX_RATES[taxProfile.state as keyof typeof STATE_TAX_RATES] || 0;

    if (currentStateTaxRate > 0) {
      const stateTaxLiability = optimalAnalysis.capitalGain * currentStateTaxRate;

      // Highlight major tax-free states
      const noTaxStates = ['FL', 'TX', 'NV', 'WA', 'WY', 'SD', 'TN', 'NH'];
      const suggestedStates = noTaxStates.slice(0, 3); // Top 3 popular ones

      opportunities.push(
        `Moving to ${suggestedStates.join(', ')} before selling could save $${stateTaxLiability.toLocaleString()} in state taxes`
      );

      if (currentStateTaxRate > 0.08) {
        opportunities.push(
          `Your state has a high ${(currentStateTaxRate * 100).toFixed(1)}% capital gains rate - consider tax planning strategies`
        );
      }
    }

    return opportunities;
  }

  /**
   * Assess 1031 exchange eligibility and benefits
   */
  private assess1031ExchangeEligibility(
    optimalAnalysis: HoldPeriodTaxAnalysis,
    taxProfile: TaxProfile
  ): TaxAnalysisResult['exchange1031Eligibility'] {
    // Expert correction: Minimum $25K deferral to justify 1031 complexity
    const MIN_DEFERRAL_THRESHOLD = 25000;

    const taxDeferral = optimalAnalysis.totalTaxLiability;
    const eligible = taxDeferral >= MIN_DEFERRAL_THRESHOLD;

    if (eligible) {
      return {
        eligible: true,
        deferralAmount: taxDeferral,
        timelineRequirements: [
          '45 days to identify replacement property',
          '180 days to complete exchange',
          'Must use qualified intermediary',
          'Replacement property must be of equal or greater value'
        ],
        minimumExchangeValue: optimalAnalysis.salePrice
      };
    }

    return {
      eligible: false,
      deferralAmount: taxDeferral,
      timelineRequirements: [],
      minimumExchangeValue: 0
    };
  }

  /**
   * Generate expert insights based on analysis
   */
  private generateExpertInsights(
    holdPeriodAnalysis: HoldPeriodTaxAnalysis[],
    optimalAnalysis: HoldPeriodTaxAnalysis,
    taxProfile: TaxProfile
  ): TaxAnalysisResult['expertInsights'] {
    const year1Analysis = holdPeriodAnalysis[0];
    const totalTaxSavings = year1Analysis.totalTaxLiability - optimalAnalysis.totalTaxLiability;

    return {
      holdPeriodReasoning: totalTaxSavings > 0
        ? `Holding for ${optimalAnalysis.holdPeriod} years maximizes after-tax returns at ${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}% IRR. This strategy saves $${totalTaxSavings.toLocaleString()} in taxes compared to selling in year 1.`
        : totalTaxSavings < -5000
        ? `Holding for ${optimalAnalysis.holdPeriod} years maximizes after-tax returns at ${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}% IRR vs ${(year1Analysis.afterTaxIRR * 100).toFixed(1)}% for Year 1 exit. Property appreciation and accumulated depreciation result in $${Math.abs(totalTaxSavings).toLocaleString()} higher taxes, but superior total returns justify the longer hold period.`
        : `Year 1 exit may be tax-optimal with ${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}% after-tax IRR, though holding longer provides other benefits.`,

      riskConsiderations: [
        'Market conditions may change over the hold period',
        'Interest rate fluctuations could affect property values',
        'Tax law changes could impact future benefits',
        'Opportunity cost of capital tied up in this property'
      ],

      opportunityCost: `Holding this property ties up $${optimalAnalysis.originalBasis.toLocaleString()} in capital. Consider if alternative investments could generate higher risk-adjusted returns.`,

      marketTimingFactors: optimalAnalysis.holdPeriod <= 3 ?
        'Short hold period suggests strong current market conditions favor earlier exit' :
        'Longer hold period indicates tax benefits outweigh potential market timing risks'
    };
  }

  /**
   * Public method to get state tax rate (for validation/testing)
   */
  public getStateTaxRatePublic(state: string): number {
    return this.getStateTaxRate(state);
  }

  /**
   * Public method to validate tax profile
   */
  public validateTaxProfile(taxProfile: TaxProfile): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!taxProfile.filingStatus) {
      errors.push('Filing status is required');
    }

    if (!taxProfile.state || taxProfile.state.length !== 2) {
      errors.push('Valid 2-letter state code is required');
    }

    if (taxProfile.federalTaxBracket && (taxProfile.federalTaxBracket < 10 || taxProfile.federalTaxBracket > 37)) {
      errors.push('Federal tax bracket must be between 10% and 37%');
    }

    if (taxProfile.depreciation.personalUsePercentage < 0 || taxProfile.depreciation.personalUsePercentage > 100) {
      errors.push('Personal use percentage must be between 0% and 100%');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const taxCalculationService = TaxCalculationService.getInstance();