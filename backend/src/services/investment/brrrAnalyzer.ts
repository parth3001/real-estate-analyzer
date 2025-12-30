/**
 * BRRRR Strategy Analyzer
 *
 * Implements Buy, Rehab, Rent, Refinance, Repeat strategy analysis
 *
 * Primary Metric: Capital Recovery Rate (40% weight)
 * - Measures % of initial investment recovered via refinance
 * - Infinite Return: 100%+ capital recovered
 *
 * Industry Standards:
 * - 70% Rule: Max purchase = (ARV * 0.70) - Rehab Budget
 * - Fannie Mae Seasoning: 12 months standard
 * - Refinance LTV: 65-80% (standard 75%)
 *
 * @author FSE from CLAUDE.md
 * @version 1.0.0
 * @date December 17, 2025
 */

import { FinancialCalculations } from '../../utils/financialCalculations';
import { BRRRRValidationError, BRRRRCalculationError } from '../../validation/brrrValidation';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface BRRRRInputs {
  // Purchase Phase
  purchasePrice: number;
  closingCosts: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;

  // Rehab Phase
  brrrr: {
    rehabBudget: number;
    afterRepairValue: number;
    refinanceLTV?: number; // Default 75%
    seasoningPeriod?: number; // Default 12 months
    estimatedRehabTime?: number; // Months
    arvAppraisalConfidence?: 'conservative' | 'moderate' | 'aggressive';
  };

  // Rental Phase
  monthlyRent: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  vacancyRate?: number; // Default 5%

  // Optional
  monthlyHOA?: number;
  monthlyUtilities?: number;
}

/**
 * Seasoning Period Holding Costs
 *
 * INDUSTRY STANDARD: Seasoning assumes tenant-occupied property
 * - Lenders require tenant occupancy for cash-out refinance
 * - Vacancy rate applies to POST-refinance projections only
 * - Management fees deducted from gross rental income
 */
export interface SeasoningCosts {
  mortgagePayments: number;
  propertyTax: number;
  insurance: number;
  utilities: number;
  maintenance: number;
  propertyManagement: number;
  totalHoldingCosts: number;
  grossRentalIncome: number;  // Total rent collected during seasoning
  netRentalIncome: number;    // Gross rent minus management fees
  netSeasoningCost: number;   // Positive = out of pocket, Negative = profit
  months: number;
}

export interface RefinanceResults {
  afterRepairValue: number;
  refinanceLTV: number;
  newLoanAmount: number;
  existingLoanBalance: number;
  cashOutProceeds: number;
  refinanceClosingCosts: number;
  netCashOut: number; // After closing costs
}

/**
 * Exit Scenario Analysis for BRRRR Tab 4
 * Represents a potential exit point (Year 3, 5, 7, 10, or 15)
 * Used to help investors discover optimal timing for selling and repeating BRRRR cycle
 */
export interface ExitScenario {
  year: number;
  salePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceeds: number;
  totalWealthCreated: number;
  breakdown: {
    capitalRecovered: number;      // From refinance cash-out (constant across scenarios)
    cumulativeCashFlow: number;    // Sum of cash flows from Year 1 to exit year
    appreciation: number;           // Property value at exit - ARV
    principalPaid: number;          // Initial loan amount - mortgage balance at exit
  };
  totalProfit: number;              // Net proceeds - capital remaining + cumulative cash flow
  totalReturn: number;              // (Total profit / total investment) * 100
  irr: number;                      // Internal rate of return
}

export interface CapitalRecovery {
  totalCapitalDeployed: number; // Investment + seasoning costs
  capitalRecovered: number; // From refinance
  capitalRemaining: number; // Still in deal
  capitalRecoveryRate: number; // Percentage recovered (PRIMARY METRIC)
  infiniteReturn: boolean; // 100%+ recovery
}

export interface PostRefinanceMetrics {
  newMonthlyPayment: number;
  monthlyRent: number;
  monthlyOperatingExpenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number; // On remaining capital
  annualNOI: number;
  postRefiDSCR: number;
}

export interface Rule70Check {
  afterRepairValue: number;
  rehabBudget: number;
  maxAllowablePurchase: number; // (ARV * 0.70) - Rehab
  actualPurchase: number;
  meets70Rule: boolean;
  margin: number; // Positive = good deal, Negative = overpaid
  marginPercent: number; // % of ARV
}

export interface ScenarioResults {
  arv: number;
  rehabBudget: number;
  capitalRecoveryRate: number;
  monthlyCashFlow: number;
  infiniteReturn: boolean;
}

export interface ARVSensitivity {
  pessimistic: ScenarioResults; // -10% ARV
  moderate: ScenarioResults; // Base case
  optimistic: ScenarioResults; // +10% ARV
}

export interface RehabSensitivity {
  onBudget: ScenarioResults;
  overBudget10: ScenarioResults; // +10%
  overBudget20: ScenarioResults; // +20%
}

export interface BRRRRAnalysis {
  // Phase 1: Investment
  totalInvestment: number;
  downPayment: number;
  loanAmount: number;
  rehabBudget: number;
  closingCosts: number;

  // Phase 2: Stabilization
  seasoningCosts: SeasoningCosts;

  // Phase 3: Refinance
  refinanceResults: RefinanceResults;
  capitalRecovery: CapitalRecovery;

  // Phase 4: Post-Refinance
  postRefinanceMetrics: PostRefinanceMetrics;

  // Scoring
  scores: {
    capitalRecovery: number; // 0-100 (40% weight)
    arvReliability: number; // 0-100 (20% weight)
    rehabExecution: number; // 0-100 (15% weight)
  };

  // Sensitivity Analysis
  sensitivity: {
    arv: ARVSensitivity;
    rehab: RehabSensitivity;
  };

  // 70% Rule
  rule70Check: Rule70Check;

  // Exit Scenarios (for Tab 4 - Long-Term Projections)
  exitScenarios?: ExitScenario[];  // Optional - calculated when projections available
}

// =============================================================================
// BRRRR ANALYZER CLASS
// =============================================================================

export class BRRRRAnalyzer {

  // ====================================
  // 1. Total Investment Calculation
  // ====================================

  /**
   * Calculate total capital invested by the investor (cash out of pocket)
   *
   * BRRRR Capital Calculation:
   * - Down Payment: Cash paid at purchase
   * - Closing Costs: Cash paid at closing
   * - Rehab Budget: Cash spent on renovations
   *
   * NOTE: Purchase price is NOT included because the mortgage portion
   * is leveraged capital (bank's money), not investor's cash.
   *
   * Example: $200K purchase with 20% down
   * - Investor's capital: $40K (down) + $4K (closing) + $40K (rehab) = $84K
   * - NOT: $200K (purchase) + $4K + $40K = $244K
   *
   * @param inputs - BRRRR strategy inputs
   * @returns Total cash invested by investor
   */
  calculateTotalInvestment(inputs: BRRRRInputs): number {
    return inputs.downPayment +
           inputs.closingCosts +
           inputs.brrrr.rehabBudget;
  }

  // ====================================
  // 2. Seasoning Period Costs
  // ====================================

  /**
   * Calculate seasoning period holding costs
   *
   * INDUSTRY STANDARD: Seasoning assumes tenant-occupied property
   * - Lenders require 6-12 months of rental history for cash-out refinance
   * - Cannot refinance vacant properties (conventional lending requirement)
   * - Vacancy rate applies to POST-refinance projections only
   * - Management fees deducted from gross rental income
   *
   * @param inputs BRRRR strategy inputs
   * @returns Seasoning costs breakdown with rental income
   */
  calculateSeasoningCosts(inputs: BRRRRInputs): SeasoningCosts {
    const months = inputs.brrrr.seasoningPeriod || 12;

    // Calculate monthly holding expenses
    const loanAmount = inputs.purchasePrice - inputs.downPayment;
    const monthlyMortgage = FinancialCalculations.calculateMortgage(
      loanAmount,
      inputs.interestRate,
      inputs.loanTerm
    );

    const monthlyPropertyTax = (inputs.purchasePrice * inputs.propertyTaxRate / 100) / 12;
    const monthlyInsurance = (inputs.purchasePrice * inputs.insuranceRate / 100) / 12;
    const monthlyMaintenance = inputs.maintenanceCost / 12;
    const monthlyUtilities = inputs.monthlyUtilities || 0;
    const monthlyHOA = inputs.monthlyHOA || 0;

    // Management fee: Applied to gross rent collected during seasoning
    // Industry standard: 8-12% of gross rental income
    const managementRate = inputs.propertyManagementRate || 0;
    const monthlyManagementFee = (inputs.monthlyRent * managementRate) / 100;

    // Total holding costs for seasoning period
    const mortgagePayments = monthlyMortgage * months;
    const propertyTax = monthlyPropertyTax * months;
    const insurance = monthlyInsurance * months;
    const utilities = monthlyUtilities * months;
    const maintenance = monthlyMaintenance * months;
    const hoa = monthlyHOA * months;
    const propertyManagement = monthlyManagementFee * months;

    // CRITICAL: No vacancy during seasoning period
    // Property must be tenant-occupied to qualify for refinance
    // Vacancy rate is used for POST-refinance cash flow projections only
    const totalHoldingCosts = mortgagePayments + propertyTax + insurance +
                              utilities + maintenance + propertyManagement + hoa;

    // Rental income during seasoning period
    const grossRentalIncome = inputs.monthlyRent * months;
    const netRentalIncome = grossRentalIncome - propertyManagement;

    // Net seasoning cost
    // Positive = out of pocket during seasoning
    // Negative = property cash flows during seasoning (profit)
    const netSeasoningCost = totalHoldingCosts - netRentalIncome;

    return {
      mortgagePayments,
      propertyTax,
      insurance,
      utilities,
      maintenance,
      propertyManagement,
      totalHoldingCosts,
      grossRentalIncome,
      netRentalIncome,
      netSeasoningCost,
      months
    };
  }

  // ====================================
  // 3. Refinance Calculation
  // ====================================

  calculateRefinance(inputs: BRRRRInputs): RefinanceResults {
    const arv = inputs.brrrr.afterRepairValue;
    const ltv = inputs.brrrr.refinanceLTV || 75;

    const newLoanAmount = arv * (ltv / 100);

    // Calculate existing loan balance after seasoning period
    const existingLoanBalance = this.calculateLoanBalance(
      inputs.purchasePrice - inputs.downPayment,
      inputs.interestRate,
      inputs.loanTerm,
      inputs.brrrr.seasoningPeriod || 12
    );

    const cashOutProceeds = newLoanAmount - existingLoanBalance;
    const refinanceClosingCosts = newLoanAmount * 0.02; // 2% estimate
    const netCashOut = cashOutProceeds - refinanceClosingCosts;

    return {
      afterRepairValue: arv,
      refinanceLTV: ltv,
      newLoanAmount,
      existingLoanBalance,
      cashOutProceeds,
      refinanceClosingCosts,
      netCashOut
    };
  }

  /**
   * Calculate remaining loan balance after N months
   */
  private calculateLoanBalance(
    principal: number,
    annualRate: number,
    loanTermYears: number,
    monthsPaid: number
  ): number {
    const monthlyRate = annualRate / 12 / 100;
    const totalMonths = loanTermYears * 12;
    const monthlyPayment = FinancialCalculations.calculateMortgage(
      principal,
      annualRate,
      loanTermYears
    );

    if (monthlyRate === 0) {
      return principal - (monthlyPayment * monthsPaid);
    }

    // Calculate remaining balance using amortization formula
    const remainingMonths = totalMonths - monthsPaid;
    const balance = monthlyPayment *
                    ((Math.pow(1 + monthlyRate, remainingMonths) - 1) /
                     (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)));

    return Math.max(0, balance);
  }

  // ====================================
  // 4. Capital Recovery (PRIMARY METRIC)
  // ====================================

  calculateCapitalRecovery(
    totalInvestment: number,
    seasoningCosts: SeasoningCosts,
    refinanceResults: RefinanceResults
  ): CapitalRecovery {
    const totalCapitalDeployed = totalInvestment + seasoningCosts.netSeasoningCost;

    // Use gross cash-out proceeds (industry standard)
    // Refinance closing costs are paid from loan proceeds, not additional out-of-pocket capital
    const capitalRecovered = refinanceResults.cashOutProceeds;
    const capitalRemaining = Math.max(0, totalCapitalDeployed - capitalRecovered);

    const capitalRecoveryRate = (capitalRecovered / totalCapitalDeployed) * 100;
    const infiniteReturn = capitalRecovered >= totalCapitalDeployed;

    return {
      totalCapitalDeployed,
      capitalRecovered,
      capitalRemaining,
      capitalRecoveryRate,
      infiniteReturn
    };
  }

  // ====================================
  // 5. Post-Refinance Metrics
  // ====================================

  calculatePostRefinanceMetrics(
    inputs: BRRRRInputs,
    refinanceResults: RefinanceResults,
    capitalRecovery: CapitalRecovery
  ): PostRefinanceMetrics {
    const newMonthlyPayment = FinancialCalculations.calculateMortgage(
      refinanceResults.newLoanAmount,
      inputs.interestRate,
      inputs.loanTerm
    );

    /**
     * CRITICAL FIX: Post-refinance tax/insurance based on ARV
     *
     * After refinance, property tax assessor reassesses at After Repair Value (ARV),
     * not original purchase price. Insurance also increases to cover higher property value.
     *
     * Real Example:
     * - Purchase Price: $100K → Tax: $1,800/year ($150/month @ 1.8%)
     * - ARV: $180K → Tax: $3,240/year ($270/month @ 1.8%)
     * - Underestimation if using purchase price: $120/month or $1,440/year
     *
     * Industry Standard: Tax assessors typically reassess within 6-12 months after
     * significant improvements (matching refinance seasoning period timeline).
     */
    const monthlyPropertyTax = (inputs.brrrr.afterRepairValue * inputs.propertyTaxRate / 100) / 12;
    const monthlyInsurance = (inputs.brrrr.afterRepairValue * inputs.insuranceRate / 100) / 12;
    const monthlyMaintenance = inputs.maintenanceCost / 12;
    const monthlyManagement = (inputs.monthlyRent * inputs.propertyManagementRate) / 100;
    const monthlyHOA = inputs.monthlyHOA || 0;
    const monthlyUtilities = inputs.monthlyUtilities || 0;

    const vacancyRate = inputs.vacancyRate || 5;
    const monthlyVacancy = (inputs.monthlyRent * vacancyRate) / 100;

    const monthlyOperatingExpenses = monthlyPropertyTax + monthlyInsurance +
                                      monthlyMaintenance + monthlyManagement +
                                      monthlyVacancy + monthlyHOA + monthlyUtilities;

    const monthlyCashFlow = inputs.monthlyRent - newMonthlyPayment - monthlyOperatingExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    // Cash-on-cash on REMAINING capital (if any)
    const cashOnCashReturn = capitalRecovery.capitalRemaining > 0
      ? (annualCashFlow / capitalRecovery.capitalRemaining) * 100
      : 0; // Infinite return scenario

    // NOI and DSCR
    const effectiveGrossIncome = inputs.monthlyRent - monthlyVacancy;
    const annualNOI = (effectiveGrossIncome - (monthlyOperatingExpenses - monthlyVacancy)) * 12;
    const annualDebtService = newMonthlyPayment * 12;
    const postRefiDSCR = FinancialCalculations.calculateDSCR(annualNOI, annualDebtService);

    return {
      newMonthlyPayment,
      monthlyRent: inputs.monthlyRent,
      monthlyOperatingExpenses,
      monthlyCashFlow,
      annualCashFlow,
      cashOnCashReturn,
      annualNOI,
      postRefiDSCR
    };
  }

  // ====================================
  // 6. Capital Recovery Score (0-100)
  // ====================================

  calculateCapitalRecoveryScore(capitalRecovery: CapitalRecovery): number {
    const rate = capitalRecovery.capitalRecoveryRate;

    // Infinite return = perfect score
    if (capitalRecovery.infiniteReturn) return 100;

    // Tiered scoring
    if (rate >= 80) return 90 + ((rate - 80) / 2);  // 80-100% → 90-100 score
    if (rate >= 60) return 70 + (rate - 60);        // 60-80% → 70-90 score
    if (rate >= 40) return 50 + (rate - 40);        // 40-60% → 50-70 score
    return Math.max(0, rate);                        // <40% → linear
  }

  // ====================================
  // 7. ARV Reliability Score (0-100)
  // ====================================

  calculateARVReliabilityScore(inputs: BRRRRInputs): number {
    const confidence = inputs.brrrr.arvAppraisalConfidence || 'moderate';
    const arvLift = ((inputs.brrrr.afterRepairValue - inputs.purchasePrice) /
                     inputs.purchasePrice) * 100;

    let baseScore = {
      'conservative': 90,
      'moderate': 70,
      'aggressive': 50
    }[confidence];

    // Penalize excessive ARV lift
    if (arvLift > 50) baseScore -= 20;
    if (arvLift > 75) baseScore -= 30;

    return Math.max(0, baseScore);
  }

  // ====================================
  // 8. Rehab Execution Score (0-100)
  // ====================================

  calculateRehabExecutionScore(inputs: BRRRRInputs): number {
    const rehabPercent = (inputs.brrrr.rehabBudget / inputs.purchasePrice) * 100;

    // Sweet spot: 15-30% of purchase price
    if (rehabPercent >= 15 && rehabPercent <= 30) return 90;
    if (rehabPercent >= 10 && rehabPercent < 15) return 75;
    if (rehabPercent >= 30 && rehabPercent <= 40) return 75;
    if (rehabPercent < 10) return 50;  // Too minor for meaningful BRRRR
    if (rehabPercent > 40) return 40;  // Risky overimprovement

    return 60; // Default
  }

  // ====================================
  // 9. 70% Rule Check
  // ====================================

  calculate70RuleCheck(inputs: BRRRRInputs): Rule70Check {
    const arv = inputs.brrrr.afterRepairValue;
    const rehabBudget = inputs.brrrr.rehabBudget;
    const purchasePrice = inputs.purchasePrice;

    const maxAllowablePurchase = (arv * 0.70) - rehabBudget;
    const actualPurchase = purchasePrice;
    const meets70Rule = actualPurchase <= maxAllowablePurchase;
    const margin = maxAllowablePurchase - actualPurchase;

    return {
      afterRepairValue: arv,
      rehabBudget,
      maxAllowablePurchase,
      actualPurchase,
      meets70Rule,
      margin,
      marginPercent: (margin / arv) * 100
    };
  }

  // ====================================
  // 10. ARV Sensitivity Analysis
  // ====================================

  calculateARVSensitivity(inputs: BRRRRInputs): ARVSensitivity {
    const baseARV = inputs.brrrr.afterRepairValue;

    return {
      pessimistic: this.calculateScenario(inputs, baseARV * 0.90, inputs.brrrr.rehabBudget),
      moderate: this.calculateScenario(inputs, baseARV, inputs.brrrr.rehabBudget),
      optimistic: this.calculateScenario(inputs, baseARV * 1.10, inputs.brrrr.rehabBudget)
    };
  }

  // ====================================
  // 11. Rehab Budget Sensitivity Analysis
  // ====================================

  calculateRehabSensitivity(inputs: BRRRRInputs): RehabSensitivity {
    const baseRehab = inputs.brrrr.rehabBudget;
    const arv = inputs.brrrr.afterRepairValue;

    return {
      onBudget: this.calculateScenario(inputs, arv, baseRehab),
      overBudget10: this.calculateScenario(inputs, arv, baseRehab * 1.10),
      overBudget20: this.calculateScenario(inputs, arv, baseRehab * 1.20)
    };
  }

  /**
   * Helper: Calculate scenario with different ARV/rehab values
   */
  private calculateScenario(
    inputs: BRRRRInputs,
    arv: number,
    rehabBudget: number
  ): ScenarioResults {
    // Create modified inputs
    const scenarioInputs: BRRRRInputs = {
      ...inputs,
      brrrr: {
        ...inputs.brrrr,
        afterRepairValue: arv,
        rehabBudget
      }
    };

    // Recalculate key metrics
    const totalInvestment = inputs.purchasePrice + inputs.closingCosts + rehabBudget;
    const seasoningCosts = this.calculateSeasoningCosts(scenarioInputs);
    const refinanceResults = this.calculateRefinance(scenarioInputs);
    const capitalRecovery = this.calculateCapitalRecovery(
      totalInvestment,
      seasoningCosts,
      refinanceResults
    );
    const postRefiMetrics = this.calculatePostRefinanceMetrics(
      scenarioInputs,
      refinanceResults,
      capitalRecovery
    );

    return {
      arv,
      rehabBudget,
      capitalRecoveryRate: capitalRecovery.capitalRecoveryRate,
      monthlyCashFlow: postRefiMetrics.monthlyCashFlow,
      infiniteReturn: capitalRecovery.infiniteReturn
    };
  }

  // ====================================
  // 11. Exit Scenarios Calculation (Tab 4)
  // ====================================

  /**
   * Calculate exit scenarios for BRRRR Tab 4 display
   * Generates exit analysis for years 3, 5, 7, 10, and 15
   *
   * IMPORTANT: Assumes refinance happened at month 15 for all scenarios
   * - capitalRecovered is constant (one-time refinance cash-out)
   * - cumulativeCashFlow varies by exit year
   * - appreciation varies by property value growth
   * - principalPaid varies by mortgage amortization
   *
   * @param inputs - BRRRR property inputs
   * @param projections - Yearly projections from BasePropertyAnalyzer
   * @param exitYears - Array of exit years to calculate (default: [3, 5, 7, 10, 15])
   * @returns Array of exit scenarios
   */
  calculateExitScenarios(
    inputs: BRRRRInputs,
    projections: any[],  // YearlyProjection[] from BasePropertyAnalyzer
    exitYears: number[] = [3, 5, 7, 10, 15]
  ): ExitScenario[] {

    // Calculate refinance metrics (same for all scenarios)
    const refinanceResults = this.calculateRefinance(inputs);
    const seasoningCosts = this.calculateSeasoningCosts(inputs);
    const totalInvestment = inputs.purchasePrice + inputs.closingCosts + inputs.brrrr.rehabBudget;
    const capitalRecovery = this.calculateCapitalRecovery(totalInvestment, seasoningCosts, refinanceResults);

    // Constants across all scenarios (refinance is one-time event)
    const capitalRecovered = capitalRecovery.capitalRecovered;
    const capitalRemaining = capitalRecovery.capitalRemaining;
    const afterRepairValue = inputs.brrrr.afterRepairValue;
    const sellingCostsPercentage = 6;  // 6% industry standard

    // Initial loan amount for principal calculation
    const downPaymentAmount = inputs.purchasePrice * (inputs.downPayment / 100);
    const initialLoanAmount = inputs.purchasePrice - downPaymentAmount;

    // Filter to available years (projections may be < 15 years)
    const availableExitYears = exitYears.filter(year => year <= projections.length);

    return availableExitYears.map(year => {
      const yearIndex = year - 1;
      const projection = projections[yearIndex];

      // 1. Sale Analysis
      const salePrice = projection.propertyValue;
      const sellingCosts = salePrice * (sellingCostsPercentage / 100);
      const mortgagePayoff = projection.mortgageBalance;
      const netProceeds = salePrice - sellingCosts - mortgagePayoff;

      // 2. Cumulative Cash Flow (sum from Year 1 to exit year)
      const cumulativeCashFlow = projections
        .slice(0, year)
        .reduce((sum, p) => sum + p.cashFlow, 0);

      // 3. Wealth Breakdown
      const appreciation = salePrice - afterRepairValue;
      const principalPaid = initialLoanAmount - mortgagePayoff;

      const totalWealthCreated =
        capitalRecovered +
        cumulativeCashFlow +
        appreciation +
        principalPaid;

      // 4. Profit Calculation
      const totalProfit = netProceeds - capitalRemaining + cumulativeCashFlow;
      const totalReturn = totalInvestment > 0
        ? (totalProfit / totalInvestment) * 100
        : 0;

      // 5. IRR Calculation
      const cashFlows: number[] = [-totalInvestment];

      // Add cash flows for years 1 through (year - 1)
      for (let i = 0; i < year - 1; i++) {
        cashFlows.push(projections[i].cashFlow);
      }

      // Add final year: annual cash flow + net proceeds
      const finalYearCashFlow = projections[year - 1].cashFlow;
      cashFlows.push(finalYearCashFlow + netProceeds);

      const irr = FinancialCalculations.calculateIRR(cashFlows);

      return {
        year,
        salePrice,
        sellingCosts,
        mortgagePayoff,
        netProceeds,
        totalWealthCreated,
        breakdown: {
          capitalRecovered,  // Constant across all scenarios
          cumulativeCashFlow,
          appreciation,
          principalPaid
        },
        totalProfit,
        totalReturn,
        irr
      };
    });
  }

  // ====================================
  // 12. Main Analysis Method
  // ====================================

  async analyze(inputs: BRRRRInputs): Promise<BRRRRAnalysis> {
    try {
      // Phase 1: Investment
      const totalInvestment = this.calculateTotalInvestment(inputs);
      const loanAmount = inputs.purchasePrice - inputs.downPayment;

      // Phase 2: Stabilization
      const seasoningCosts = this.calculateSeasoningCosts(inputs);

      // Phase 3: Refinance
      const refinanceResults = this.calculateRefinance(inputs);
      const capitalRecovery = this.calculateCapitalRecovery(
        totalInvestment,
        seasoningCosts,
        refinanceResults
      );

      // Phase 4: Post-Refinance
      const postRefinanceMetrics = this.calculatePostRefinanceMetrics(
        inputs,
        refinanceResults,
        capitalRecovery
      );

      // Phase 5: Scoring
      const capitalRecoveryScore = this.calculateCapitalRecoveryScore(capitalRecovery);
      const arvReliabilityScore = this.calculateARVReliabilityScore(inputs);
      const rehabExecutionScore = this.calculateRehabExecutionScore(inputs);

      // Phase 6: Sensitivity Analysis
      const arvSensitivity = this.calculateARVSensitivity(inputs);
      const rehabSensitivity = this.calculateRehabSensitivity(inputs);

      // Phase 7: 70% Rule Check
      const rule70Check = this.calculate70RuleCheck(inputs);

      return {
        // Phase 1
        totalInvestment,
        downPayment: inputs.downPayment,
        loanAmount,
        rehabBudget: inputs.brrrr.rehabBudget,
        closingCosts: inputs.closingCosts,

        // Phase 2
        seasoningCosts,

        // Phase 3
        refinanceResults,
        capitalRecovery,

        // Phase 4
        postRefinanceMetrics,

        // Scoring
        scores: {
          capitalRecovery: capitalRecoveryScore,
          arvReliability: arvReliabilityScore,
          rehabExecution: rehabExecutionScore
        },

        // Sensitivity
        sensitivity: {
          arv: arvSensitivity,
          rehab: rehabSensitivity
        },

        // 70% Rule
        rule70Check
      };

    } catch (error) {
      if (error instanceof BRRRRValidationError) {
        throw error;
      }

      throw new BRRRRCalculationError(
        `BRRRR analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'analyze',
        inputs
      );
    }
  }
}
