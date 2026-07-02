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
import { logger } from '../../utils/logger';

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
    refinanceInterestRate?: number; // Issue #51: Cash-out refi rate (typically +2-5% above initial)
  };

  // Rental Phase
  monthlyRent: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  vacancyRate?: number; // Default 5%

  // ✅ NEW: Operating Expenses (Jan 2026 - Josh's feature request)
  monthlyHOA?: number;       // Monthly HOA fees
  monthlyUtilities?: number; // Landlord-paid utilities
  monthlyCapEx?: number;     // Capital expenditure reserve (NEW universal field)

  /**
   * @deprecated Use monthlyCapEx instead (will be removed in v4.0)
   * Kept for backward compatibility with existing BRRRR analyses
   */
  capExReserveRate?: number; // Percentage of rent (OLD - backward compat)
  capExReserveFixed?: number; // Fixed dollar amount (OLD - backward compat)

  // Issue #51: Turnover costs (for Post-Refinance calculations)
  tenantTurnoverFees?: {
    prepFees?: number; // Default 500
    realtorCommission?: number; // Default 0.5 (half month rent)
  };

  // Issue #51: Long-term assumptions (for turnover frequency)
  longTermAssumptions?: {
    projectionYears?: number;
    annualRentIncrease?: number;
    annualPropertyValueIncrease?: number;
    inflationRate?: number;
    vacancyRate?: number;
    sellingCostsPercentage?: number;
    turnoverFrequency?: number; // Default 2 years
  };
}

/**
 * Seasoning Period Holding Costs
 *
 * INDUSTRY STANDARD: Seasoning assumes tenant-occupied property
 * - Lenders require tenant occupancy for cash-out refinance
 * - Vacancy rate applies to POST-refinance projections only
 * - Management fees deducted from gross rental income
 *
 * ✅ ISSUE #54 FIX: Added seasoningNetCashFlow for clear sign convention
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

  /**
   * Net cash flow during seasoning period
   * @description Positive = profit, Negative = loss (out of pocket)
   * @example +$7,983 = property generated profit during seasoning
   * @example -$2,000 = investor paid $2,000 out of pocket during seasoning
   * @since Issue #54 fix (2026-01-07)
   */
  seasoningNetCashFlow: number;

  /**
   * @deprecated Use seasoningNetCashFlow instead. This field uses confusing sign convention.
   * @description Positive = loss, Negative = profit (backward from intuition)
   * @remove Will be removed in v3.0
   */
  netSeasoningCost: number;

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
  postRefiBreakEvenOccupancy: number; // Issue #80 fix - BEO using post-refi mortgage
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
    const totalInvestment = inputs.downPayment +
           inputs.closingCosts +
           inputs.brrrr.rehabBudget;

    // 🔍 DIAGNOSTIC LOGGING - Debug anonymous vs authenticated input mapping
    logger.debug('🔍 BRRRR Total Investment Calculation:', {
      downPayment: inputs.downPayment,
      closingCosts: inputs.closingCosts,
      rehabBudget: inputs.brrrr.rehabBudget,
      totalInvestment,
      purchasePrice: inputs.purchasePrice // For reference
    });

    return totalInvestment;
  }

  // ====================================
  // 2. Seasoning Period Costs
  // ====================================

  /**
   * Calculate Seasoning Period Costs (Initial Hold Period)
   *
   * CRITICAL BRRRR MECHANICS:
   * - Seasoning = 6-12 month period with tenant in place
   * - Lender requires continuous occupancy for refinance approval
   * - NO TURNOVER COSTS during this period (tenant must stay)
   * - NO VACANCY during this period (lender requirement)
   *
   * Operating Expenses During Seasoning:
   * ✅ Property Tax (purchase price-based, pre-assessment)
   * ✅ Insurance (purchase price-based)
   * ✅ Maintenance (normal wear and tear)
   * ✅ Property Management (8% typical)
   * ✅ Utilities (if owner-paid)
   * ❌ Vacancy (not allowed during seasoning)
   * ❌ Turnover Costs (no tenant turnover allowed)
   *
   * POST-REFINANCE PERIOD INCLUDES:
   * ✅ All above expenses
   * ✅ Vacancy (5% standard)
   * ✅ Turnover Costs (normal operations resume)
   *
   * See: /docs/BRRRR_BUSINESS_EXPERT_VALIDATION.md Section 3.2
   *
   * @param inputs BRRRR strategy inputs
   * @returns Seasoning costs breakdown with rental income
   */
  calculateSeasoningCosts(inputs: BRRRRInputs): SeasoningCosts {
    // ✅ ISSUE #53 FIX: Use ?? operator to preserve zero values
    const months = inputs.brrrr.seasoningPeriod ?? 12;

    // Issue #210 (2026-06-30) — removed diagnostic log that fired 6-8x
    // per analysis (base case + each sensitivity/exit scenario). The
    // original bug it was added to diagnose (11,353% vs 65.81%
    // discrepancy) has been fixed. Same information is captured in
    // the single "BRRRR Analysis Complete" log line at the end.

    // Calculate monthly holding expenses
    const loanAmount = inputs.purchasePrice - inputs.downPayment;
    const monthlyMortgage = FinancialCalculations.calculateMortgage(
      loanAmount,
      inputs.interestRate,
      inputs.loanTerm
    );

    const monthlyPropertyTax = (inputs.purchasePrice * inputs.propertyTaxRate / 100) / 12;
    // User Decision (2026-01-12): Use whatever user provides for insurance input
    const monthlyInsurance = (inputs.purchasePrice * inputs.insuranceRate / 100) / 12;
    const monthlyMaintenance = inputs.maintenanceCost / 12;
    const monthlyUtilities = inputs.monthlyUtilities ?? 0;
    const monthlyHOA = inputs.monthlyHOA ?? 0;

    // Management fee: Applied to gross rent collected during seasoning
    // Industry standard: 8-12% of gross rental income
    const managementRate = inputs.propertyManagementRate ?? 0;
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
    //
    // P0 FIX (2026-01-12): Remove propertyManagement from holding costs
    // Management fee is "above the line" - deducted from gross rent (line 352)
    // Including it here causes double-counting (BiggerPockets validation)
    const totalHoldingCosts = mortgagePayments + propertyTax + insurance +
                              utilities + maintenance + hoa;

    // Rental income during seasoning period
    const grossRentalIncome = inputs.monthlyRent * months;
    const netRentalIncome = grossRentalIncome - propertyManagement;

    // ✅ ISSUE #54 FIX: Calculate seasoningNetCashFlow with clear sign convention
    // Positive = profit (property generates cash during seasoning)
    // Negative = loss (investor pays out of pocket during seasoning)
    const seasoningNetCashFlow = netRentalIncome - totalHoldingCosts;

    // Deprecated field (backward compatibility - will be removed in v3.0)
    // Old sign convention: Positive = loss, Negative = profit (confusing!)
    const netSeasoningCost = -seasoningNetCashFlow;

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
      seasoningNetCashFlow,  // NEW: Clear sign convention
      netSeasoningCost,      // DEPRECATED: Kept for backward compatibility
      months
    };
  }

  // ====================================
  // 3. Refinance Calculation
  // ====================================

  calculateRefinance(inputs: BRRRRInputs): RefinanceResults {
    const arv = inputs.brrrr.afterRepairValue;
    // ✅ ISSUE #53 FIX: Use ?? operator to preserve zero values
    const ltv = inputs.brrrr.refinanceLTV ?? 75;

    const newLoanAmount = arv * (ltv / 100);

    // Calculate existing loan balance after seasoning period
    const existingLoanBalance = this.calculateLoanBalance(
      inputs.purchasePrice - inputs.downPayment,
      inputs.interestRate,
      inputs.loanTerm,
      inputs.brrrr.seasoningPeriod ?? 12
    );

    const cashOutProceeds = newLoanAmount - existingLoanBalance;
    // P0 FIX (2026-01-12): BiggerPockets standard is 2.5%, not 2%
    const refinanceClosingCosts = newLoanAmount * 0.025; // 2.5% BiggerPockets standard
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
    /**
     * ✅ ISSUE #54 FIX: Use seasoningNetCashFlow instead of deprecated netSeasoningCost
     *
     * Old logic (confusing):
     *   totalCapitalDeployed = totalInvestment + netSeasoningCost
     *   When netSeasoningCost = -$7,983 (profit), capital deployed DECREASED
     *
     * New logic (clear):
     *   totalCapitalDeployed = totalInvestment - seasoningNetCashFlow
     *   When seasoningNetCashFlow = +$7,983 (profit), capital deployed DECREASES
     *
     * Example: $52,000 investment, $7,983 seasoning profit
     *   totalCapitalDeployed = $52,000 - $7,983 = $44,017 (net capital at risk)
     */
    const totalCapitalDeployed = totalInvestment - seasoningCosts.seasoningNetCashFlow;

    // Use gross cash-out proceeds (industry standard)
    // Refinance closing costs are paid from loan proceeds, not additional out-of-pocket capital
    const capitalRecovered = refinanceResults.cashOutProceeds;
    const capitalRemaining = Math.max(0, totalCapitalDeployed - capitalRecovered);

    const capitalRecoveryRate = (capitalRecovered / totalCapitalDeployed) * 100;
    const infiniteReturn = capitalRecovered >= totalCapitalDeployed;

    // Issue #210 (2026-06-30) — removed diagnostic log that fired 6-8x
    // per analysis (base case + each sensitivity/exit scenario). The
    // original bug it was added to diagnose (11,353% vs 65.81%
    // discrepancy) has been fixed. Same information is captured in
    // the "BRRRR Analysis Complete" log line at the end (single-fire).

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
    /**
     * ✅ ISSUE #51 FIX: Use separate refinance interest rate
     *
     * Cash-out refinances typically carry 2-5% higher interest rates than purchase loans
     * due to higher lender risk (equity extraction). This is a CRITICAL calculation difference.
     *
     * Defaults to initial rate if not specified (backward compatibility)
     *
     * REFERENCE: /docs/ISSUE_51_IMPLEMENTATION_PLAN.md
     */
    // ✅ ISSUE #53 FIX: Use ?? operator to preserve zero values
    // - OLD BUG: refinanceInterestRate: 0 || 6.5 = 6.5 (user wanted 0% promo rate)
    // - NEW FIX: refinanceInterestRate: 0 ?? 6.5 = 0 (preserves user's zero)

    // Issue #53 Fix: Use nullish coalescing to preserve 0 values
    const refinanceRate = inputs.brrrr.refinanceInterestRate ?? inputs.interestRate;

    // Only log when using fallback (helps debug user issues)
    if (inputs.brrrr.refinanceInterestRate === undefined || inputs.brrrr.refinanceInterestRate === null) {
      console.warn(`⚠️ [BRRRR Analyzer] Using fallback refinance rate: ${inputs.interestRate}% (user did not specify refinanceInterestRate)`);
    }

    const newMonthlyPayment = FinancialCalculations.calculateMortgage(
      refinanceResults.newLoanAmount,
      refinanceRate,  // Use refinance-specific rate (not initial rate)
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
    const monthlyHOA = inputs.monthlyHOA ?? 0;
    const monthlyUtilities = inputs.monthlyUtilities ?? 0;

    // ✅ ISSUE #53 FIX: Trust controller to provide enriched data, use ?? operator
    // Controller's convertWizardData guarantees vacancyRate exists (defaults to 5 if not provided)
    const vacancyRate = inputs.vacancyRate ?? 5;
    const monthlyVacancy = (inputs.monthlyRent * vacancyRate) / 100;

    /**
     * ✅ ISSUE #55 FIX: Add Capital Expenditure Reserve
     *
     * WHY MISSING?
     * - CapEx was completely missing from post-refinance operating expenses
     * - This caused $156/month understatement of expenses ($1,872/year)
     *
     * INDUSTRY STANDARD:
     * - Single-family rentals: 5-10% of monthly rent
     * - Conservative default: 5% (BiggerPockets, Fannie Mae guidelines)
     *
     * WHAT IS CAPEX?
     * - Major repairs: HVAC replacement, roof, appliances, water heater
     * - NOT routine maintenance (that's separate maintenanceCost field)
     *
     * IMPLEMENTATION (JAN 2026 - Backward Compatibility):
     * - NEW: monthlyCapEx (universal field from BasePropertyData)
     * - OLD: capExReserveFixed, capExReserveRate (kept for backward compat)
     * - Fallback chain: monthlyCapEx → capExReserveFixed → capExReserveRate → 5% default
     */
    let monthlyCapEx: number;
    if (inputs.monthlyCapEx !== undefined && inputs.monthlyCapEx !== null) {
      monthlyCapEx = inputs.monthlyCapEx; // NEW universal field
    } else if (inputs.capExReserveFixed !== undefined) {
      monthlyCapEx = inputs.capExReserveFixed; // OLD fixed value (backward compat)
    } else if (inputs.capExReserveRate !== undefined) {
      monthlyCapEx = (inputs.monthlyRent * inputs.capExReserveRate) / 100; // OLD percentage (backward compat)
    } else {
      monthlyCapEx = (inputs.monthlyRent * 5) / 100; // DEFAULT 5% of rent
    }

    // Issue #63 fix - Diagnostic logging for CapEx source verification.
    // Issue #210 (2026-06-30) — demoted from info → debug since this
    // fires ~6x per BRRRR analysis (base case + sensitivity scenarios
    // + exit scenarios) and clutters production logs. Debug level
    // keeps it available when tracing a specific issue.
    logger.debug('BRRRR Operating Expenses - CapEx Calculation:', {
      monthlyCapExSource: inputs.monthlyCapEx !== undefined && inputs.monthlyCapEx !== null
        ? 'user-provided'
        : inputs.capExReserveFixed !== undefined
          ? 'fixed-value-fallback'
          : inputs.capExReserveRate !== undefined
            ? 'percentage-fallback'
            : 'default-5-percent',
      monthlyCapExValue: monthlyCapEx,
      userProvidedValue: inputs.monthlyCapEx ?? null,
      monthlyRent: inputs.monthlyRent
    });

    /**
     * ✅ ISSUE #51 FIX: Add turnover costs to Post-Refinance operating expenses
     *
     * WHY NOT IN SEASONING PERIOD?
     * - Lender requires tenant in place (no turnover) during 6-12 month seasoning
     * - This is a BRRRR-specific requirement, NOT an oversight
     *
     * WHY INCLUDED POST-REFINANCE?
     * - Normal operations resume after refinance closes
     * - Turnover is expected expense in long-term rental operations
     * - Formula: (prepFees + realtorCommission) / turnoverFrequency
     *
     * REFERENCE: /docs/ISSUE_51_IMPLEMENTATION_PLAN.md
     */
    // ✅ ISSUE #53 FIX: Use ?? operator to preserve zero values
    const annualTurnoverCosts = FinancialCalculations.calculateTurnoverCosts({
      prepFees: inputs.tenantTurnoverFees?.prepFees ?? 500,
      monthlyRent: inputs.monthlyRent,
      realtorCommission: inputs.tenantTurnoverFees?.realtorCommission ?? 0.5,
      turnoverFrequency: inputs.longTermAssumptions?.turnoverFrequency ?? 2,
      vacancyRate: vacancyRate
    });
    const monthlyTurnoverCosts = annualTurnoverCosts / 12;

    /**
     * ✅ ISSUE #67 FIX: NOI Calculation - Industry Standard Accounting Treatment
     *
     * Following Fannie Mae Form 1007, GAAP Real Estate Accounting, and USPAP standards:
     *
     * Effective Gross Income (EGI):
     *   Gross Rental Income: $X
     *   - Vacancy Loss (economic vacancy)
     *   - Property Management Fee (8% of gross rent) ← "Above the line" deduction
     *   = Effective Gross Income
     *
     * Net Operating Income (NOI):
     *   Effective Gross Income
     *   - Operating Expenses (taxes, insurance, maintenance, CapEx, utilities, HOA, turnover)
     *   = Net Operating Income
     *
     * Key Principle: Management fees are deducted from REVENUE ("above the line"),
     * NOT included in operating expenses ("below the line").
     *
     * This ensures:
     * 1. Lender underwriting compliance (Fannie Mae/Freddie Mac)
     * 2. GAAP real estate accounting standards
     * 3. Appraisal reporting compliance (USPAP)
     * 4. Industry-standard NOI methodology
     *
     * @see BRRRR_BUSINESS_REQUIREMENTS.md - Rule 4: Management Fee Treatment
     * @see BRRRR_ARCHITECTURE_VALIDATION.md - Formula Validation Matrix
     * @see Issue #67: NOI accounting method compliance fix
     *
     * Note: CapEx added in Issue #55 fix (was missing $156/month)
     */
    // P1 FIX (2026-01-12): Remove monthlyVacancy from operating expenses
    // Vacancy is "above the line" EGI adjustment, NOT an operating expense
    // This matches Issue #67 fix (management fee removal) and BiggerPockets methodology
    const monthlyOperatingExpenses = monthlyPropertyTax + monthlyInsurance +
                                      monthlyMaintenance + // Management fee removed (Issue #67)
                                      monthlyCapEx +  // ← ADDED for Issue #55
                                      monthlyHOA + monthlyUtilities +
                                      monthlyTurnoverCosts;

    const monthlyCashFlow = inputs.monthlyRent - newMonthlyPayment - monthlyOperatingExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    // Cash-on-cash on REMAINING capital (if any)
    const cashOnCashReturn = capitalRecovery.capitalRemaining > 0
      ? (annualCashFlow / capitalRecovery.capitalRemaining) * 100
      : null; // Infinite return scenario - let frontend display ∞%

    // NOI and DSCR (Industry Standard: EGI deducts vacancy + management "above the line")
    const effectiveGrossIncome = inputs.monthlyRent - monthlyVacancy - monthlyManagement;
    // P1 FIX (2026-01-12): Simplified NOI formula (vacancy no longer in operating expenses)
    const annualNOI = (effectiveGrossIncome - monthlyOperatingExpenses) * 12;
    const annualDebtService = newMonthlyPayment * 12;
    const postRefiDSCR = FinancialCalculations.calculateDSCR(annualNOI, annualDebtService);

    /**
     * ✅ ISSUE #80 FIX: Post-Refinance Break-Even Occupancy
     *
     * BUSINESS REQUIREMENT:
     * - Investors need to see BEO for the ONGOING hold period (post-refinance)
     * - Initial BEO (50.35%) uses initial low mortgage ($499/mo) - temporary period
     * - Post-Refi BEO (81.0%) uses post-refi high mortgage ($1,418/mo) - long-term reality
     *
     * METHODOLOGY:
     * - BEO = (Operating Expenses + Debt Service) / Gross Potential Rent * 100
     * - Uses POST-REFINANCE mortgage payment (higher than initial)
     * - Uses same operating expenses as post-refi cash flow calculation
     * - Critical for BRRRR risk assessment: Capital recovery increases BEO
     *
     * RISK THRESHOLDS:
     * - <75%: Low Risk (Green)
     * - 75-85%: Moderate Risk (Orange)
     * - >85%: High Risk (Red)
     *
     * @see /docs/ISSUE_TRACKER.md Issue #80
     * @see /docs/MF_METRICS_REFERENCE.md for BEO definition
     */
    const postRefiBreakEvenOccupancy = FinancialCalculations.calculateBreakEvenOccupancy(
      monthlyOperatingExpenses * 12,  // Annual operating expenses
      newMonthlyPayment * 12,         // Annual post-refi debt service
      inputs.monthlyRent * 12         // Annual gross potential rent
    );

    return {
      newMonthlyPayment,
      monthlyRent: inputs.monthlyRent,
      monthlyOperatingExpenses,
      monthlyCashFlow,
      annualCashFlow,
      cashOnCashReturn,
      annualNOI,
      postRefiDSCR,
      postRefiBreakEvenOccupancy  // Issue #80 fix
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

    // BRRRR refinance loan amount (used for long-term projections)
    // This is the NEW loan amount after refinancing based on ARV
    // Used to calculate principal paid down over time
    const refinanceLoanAmount = refinanceResults.newLoanAmount;

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
      const principalPaid = refinanceLoanAmount - mortgagePayoff;

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
