import { FinancialCalculations } from '../utils/financialCalculations';
import type { BasePropertyData } from '../types/propertyTypes';
import type {
  CommonMetrics,
  AnalysisResult,
  YearlyProjection,
  ExitAnalysis,
  ExpenseBreakdown
} from '../types/analysis';

// Debug helper - only logs in development
// 🔍 ISSUE #53 DEBUG: Temporarily disabled to reduce noise
const debug = (...args: any[]) => {
  // TEMPORARILY DISABLED
  // if (process.env.NODE_ENV !== 'production') {
  //   console.log(...args);
  // }
};

export interface AnalysisAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualExpenseIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCosts: number;
  vacancyRate: number;
  turnoverFrequency?: number; // Average tenant stay in years (default: 2)
}

export abstract class BasePropertyAnalyzer<T extends BasePropertyData, U extends CommonMetrics> {
  protected data: T;
  protected assumptions: AnalysisAssumptions;

  constructor(data: T, assumptions: AnalysisAssumptions) {
    this.data = data;
    this.assumptions = assumptions;

    // DEBUG Issue #29: Log data received by analyzer
    console.log('🔍 ISSUE #29 DEBUG - Analyzer received data:', {
      purchasePrice: data.purchasePrice,
      downPayment: data.downPayment,
      closingCosts: data.closingCosts,
      loanAmount: data.purchasePrice - data.downPayment,
      totalInvestment: data.downPayment + (data.closingCosts || 0)
    });
  }

  protected calculateMonthlyMortgage(): number {
    const loanAmount = FinancialCalculations.calculateLoanAmount(
      this.data.purchasePrice,
      this.data.downPayment
    );
    return FinancialCalculations.calculateMortgage(
      loanAmount,
      this.data.interestRate,
      this.data.loanTerm
    );
  }

  protected calculateOperatingExpenses(grossIncome: number): number {
    const baseExpenses = {
      propertyTax: this.data.purchasePrice * (this.data.propertyTaxRate / 100),
      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100),
      maintenance: this.data.maintenanceCost,
      propertyManagement: grossIncome * (this.data.propertyManagementRate / 100)
      // REMOVED vacancy - it should reduce income, not be an expense
    };

    const totalBaseExpenses = Object.values(baseExpenses).reduce((sum, expense) => sum + expense, 0);

    // ✅ NEW: SFR-SPECIFIC expenses (Josh's feature - Jan 2026)
    // Only applied for SFR properties to prevent Multi-Family double-counting
    // Multi-Family calculates CapEx separately (6% EGI) and has commonAreaUtilities
    if (this.data.propertyType === 'SFR') {
      const hoa = (this.data.monthlyHOA ?? 0) * 12;
      const utilities = (this.data.monthlyUtilities ?? 0) * 12;
      const capEx = (this.data.monthlyCapEx ?? 0) * 12;
      return totalBaseExpenses + hoa + utilities + capEx;
    }

    return totalBaseExpenses;
  }

  protected calculateNOI(effectiveIncome: number, operatingExpenses: number): number {
    return FinancialCalculations.calculateNOI(effectiveIncome, operatingExpenses);
  }

  protected calculateCapRate(noi: number): number {
    return FinancialCalculations.calculateCapRate(noi, this.data.purchasePrice);
  }

  protected calculateCashOnCashReturn(cashFlow: number, totalInvestment: number): number {
    return FinancialCalculations.calculateCashOnCashReturn(cashFlow, totalInvestment);
  }

  protected calculateDSCR(noi: number, debtService: number): number {
    return FinancialCalculations.calculateDSCR(noi, debtService);
  }

  protected calculateProjections(): YearlyProjection[] {
    const monthlyMortgage = this.calculateMonthlyMortgage();
    const annualDebtService = monthlyMortgage * 12;
    const projections: YearlyProjection[] = [];

    // CRITICAL FIX: For BRRRR strategy, use After Repair Value (ARV) for long-term projections
    // Bug: Was using purchase price ($200K) instead of ARV ($320K) → 60% underestimation
    // Fix: Check NESTED brrrr.afterRepairValue first (Issue #42 - Dec 29, 2025)
    // ARV is stored at this.data.brrrr.afterRepairValue, not this.data.afterRepairValue
    const initialPropertyValue =
      (this.data as any).brrrr?.afterRepairValue ||  // Check nested BRRRR structure FIRST
      (this.data as any).afterRepairValue ||          // Then check top-level (backwards compatibility)
      this.data.purchasePrice;                        // Fallback to purchase price for Buy & Hold
    let currentPropertyValue = initialPropertyValue;
    let currentLoanBalance = this.data.purchasePrice - this.data.downPayment;

    debug('\n\n========== PROJECTIONS CALCULATION ==========');
    debug('Initial Values:', {
      purchasePrice: this.data.purchasePrice,
      arvNested: (this.data as any).brrrr?.afterRepairValue || 'N/A',
      arvTopLevel: (this.data as any).afterRepairValue || 'N/A',
      initialPropertyValue: initialPropertyValue,
      usingARV: !!(this.data as any).afterRepairValue,
      downPayment: this.data.downPayment,
      closingCosts: this.data.closingCosts || 0,
      capitalInvestments: this.data.capitalInvestments || 0,
      propertyTaxRate: this.data.propertyTaxRate,
      insuranceRate: this.data.insuranceRate,
      maintenanceCost: this.data.maintenanceCost,
      propertyManagementRate: this.data.propertyManagementRate
    });
    
    debug('Assumptions:', {
      projectionYears: this.assumptions.projectionYears,
      annualRentIncrease: this.assumptions.annualRentIncrease,
      annualExpenseIncrease: this.assumptions.annualExpenseIncrease,
      annualPropertyValueIncrease: this.assumptions.annualPropertyValueIncrease,
      vacancyRate: this.assumptions.vacancyRate,
      turnoverFrequency: this.assumptions.turnoverFrequency || 2,
      sellingCosts: this.assumptions.sellingCosts
    });
    
    debug('Mortgage Details:', {
      monthlyMortgage,
      annualDebtService,
      interestRate: this.data.interestRate,
      loanTerm: this.data.loanTerm,
      initialLoanBalance: currentLoanBalance
    });
    
    const basePropertyTaxForYear1 = this.data.purchasePrice * (this.data.propertyTaxRate / 100);
    const baseInsuranceForYear1 = this.data.purchasePrice * (this.data.insuranceRate / 100);
    
    debug('Base expenses (Year 1):', {
      basePropertyTaxForYear1,
      baseInsuranceForYear1,
      maintenanceCost: this.data.maintenanceCost
    });

    // Log tenant turnover parameters
    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
    const turnoverFrequency = this.assumptions.turnoverFrequency || 2;
    const baseTurnoverRate = 1 / turnoverFrequency;
    
    debug('Tenant Turnover Parameters:', {
      prepFees,
      realtorCommission,
      turnoverFrequency,
      baseTurnoverRate
    });

    // Strategy-aware projection years (BRRRR Tab 4 redesign)
    // BRRRR: Always 15 years (supports exit scenarios at 3, 5, 7, 10, 15 years)
    // Buy & Hold / Multi-Family: User input (modeling period / investment horizon)
    // Note: investmentStrategy is added at runtime by deals controller (line 274)
    const investmentStrategy = (this.data as any).investmentStrategy || 'buy-hold';
    const effectiveProjectionYears = investmentStrategy === 'brrrr'
      ? 15  // BRRRR: Fixed 15 years for multi-scenario analysis
      : this.assumptions.projectionYears;  // Buy & Hold/MF: User's modeling period

    debug('Projection Years Calculation:', {
      investmentStrategy,
      userInputYears: this.assumptions.projectionYears,
      effectiveYears: effectiveProjectionYears,
      reason: investmentStrategy === 'brrrr'
        ? 'BRRRR uses fixed 15 years for exit scenario analysis'
        : 'Using user input for modeling period'
    });

    for (let year = 1; year <= effectiveProjectionYears; year++) {
      debug(`\n--- YEAR ${year} CALCULATION ---`);
      
      const grossIncome = this.calculateGrossIncome(year);
      debug(`Year ${year} Gross Income:`, grossIncome);
      
      const expenseInflationFactor = Math.pow(1 + (this.assumptions.annualExpenseIncrease || 2.5) / 100, year - 1);
      debug(`Year ${year} Expense Inflation Factor:`, expenseInflationFactor);
      
      const propertyTax = basePropertyTaxForYear1 * expenseInflationFactor;
      const insurance = baseInsuranceForYear1 * expenseInflationFactor;
      const maintenance = this.data.maintenanceCost * expenseInflationFactor;
      
      debug(`Year ${year} Basic Expenses:`, {
        propertyTax,
        insurance,
        maintenance
      });
      
      const propertyManagement = grossIncome * (this.data.propertyManagementRate / 100);
      // Calculate effective income after vacancy
      const effectiveIncome = grossIncome * (1 - this.assumptions.vacancyRate / 100);
      
      debug(`Year ${year} Income-Based Expenses:`, {
        propertyManagement
      });
      debug(`Year ${year} Effective Income (after ${this.assumptions.vacancyRate}% vacancy):`, effectiveIncome);
      
      // Calculate tenant turnover costs
      const monthlyRentForYear = grossIncome / 12;
      const inflatedPrepFees = prepFees * expenseInflationFactor;
      
      // Adjust based on vacancy rate: higher vacancy = higher turnover
      const vacancyAdjustment = this.assumptions.vacancyRate / 5;
      const turnoverRate = Math.min(0.9, baseTurnoverRate * vacancyAdjustment); // Cap at 90%
      
      // Calculate total turnover costs for the year
      const turnoverCosts = (inflatedPrepFees + (monthlyRentForYear * realtorCommission)) * turnoverRate;
      
      debug(`Year ${year} Turnover Calculation:`, {
        monthlyRentForYear,
        inflatedPrepFees,
        vacancyAdjustment,
        turnoverRate,
        turnoverCosts,
        calculation: {
          prepFeesPart: inflatedPrepFees * turnoverRate,
          commissionPart: (monthlyRentForYear * realtorCommission) * turnoverRate
        }
      });
      
      // Capital improvements (only in year 1)
      const capitalImprovements = year === 1 ? (this.data.capitalInvestments || 0) : 0;

      debug(`Year ${year} Capital Improvements:`, capitalImprovements);

      // Base operating expenses
      let operatingExpenses = propertyTax + insurance + maintenance + propertyManagement + turnoverCosts;

      // ✅ OPTION A FIX: Add SFR-specific operating expenses to projections (Jan 2026)
      // This fixes the discrepancy where new expenses were in monthly analysis but missing from projections
      if (this.data.propertyType === 'SFR') {
        const hoa = (this.data.monthlyHOA ?? 0) * 12 * expenseInflationFactor;
        const utilities = (this.data.monthlyUtilities ?? 0) * 12 * expenseInflationFactor;
        const capEx = (this.data.monthlyCapEx ?? 0) * 12 * expenseInflationFactor;

        debug(`Year ${year} SFR-Specific Expenses:`, {
          hoa,
          utilities,
          capEx,
          total: hoa + utilities + capEx,
          inflationFactor: expenseInflationFactor
        });

        operatingExpenses += hoa + utilities + capEx;
      }

      const noi = FinancialCalculations.calculateNOI(effectiveIncome, operatingExpenses);
      const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService) - capitalImprovements;

      debug(`Year ${year} Cash Flow Calculation:`, {
        grossIncome,
        operatingExpenses,
        noi,
        annualDebtService,
        capitalImprovements,
        cashFlow,
        formula: `${noi} - ${annualDebtService} - ${capitalImprovements} = ${cashFlow}`
      });

      // NOTE: Appreciation timing issue documented in Issue #47 (deferred to Phase 2)
      // Currently applies appreciation BEFORE recording year value (Year 1 shows appreciation)
      // Should apply AFTER for mathematical correctness (Year 1 = starting value)
      currentPropertyValue *= (1 + this.assumptions.annualPropertyValueIncrease / 100);

      const interestPaid = currentLoanBalance * (this.data.interestRate / 100);
      const principalPaid = annualDebtService - interestPaid;
      currentLoanBalance = Math.max(0, currentLoanBalance - principalPaid);

      // Calculate vacancy amount for display (not an expense, but shows income reduction)
      const vacancyAmount = grossIncome * (this.assumptions.vacancyRate / 100);
      // BRRRR Fix: Calculate appreciation from initial property value (ARV for BRRRR, purchase price for Buy & Hold)
      const appreciation = currentPropertyValue - initialPropertyValue;

      debug(`Year ${year} Property Value & Mortgage:`, {
        currentPropertyValue,
        appreciation,
        interestPaid,
        principalPaid,
        currentLoanBalance
      });

      projections.push({
        year,
        propertyValue: currentPropertyValue,
        grossIncome,
        operatingExpenses,
        noi,
        debtService: annualDebtService,
        cashFlow,
        equity: currentPropertyValue - currentLoanBalance,
        mortgageBalance: currentLoanBalance,
        totalReturn: cashFlow + appreciation,
        propertyTax,
        insurance,
        maintenance,
        propertyManagement,
        vacancy: vacancyAmount, // Show actual vacancy amount for transparency
        realtorBrokerageFee: 0, // REMOVED - this was unauthorized expense
        grossRent: grossIncome,
        appreciation,
        turnoverCosts,
        capitalImprovements
      });
    }

    return projections;
  }

  protected calculateExitAnalysis(projections: YearlyProjection[]): ExitAnalysis {
    const lastProjection = projections[projections.length - 1];
    const totalInvestment = this.data.downPayment + 
                           (this.data.closingCosts || 0) + 
                           (this.data.capitalInvestments || 0);
    
    // Calculate total cash flow from projections
    // Note: Cash flow already includes capital improvements as an expense in year 1
    const cumulativeCashFlow = projections.reduce((sum, p) => sum + p.cashFlow, 0);

    debug('Exit Analysis Calculation:', {
      propertyValue: lastProjection.propertyValue,
      loanBalance: lastProjection.mortgageBalance,
      sellingCosts: this.assumptions.sellingCosts,
      totalInvestment,
      cumulativeCashFlow,
      components: {
        downPayment: this.data.downPayment,
        closingCosts: this.data.closingCosts || 0,
        capitalInvestments: this.data.capitalInvestments || 0
      }
    });

    return FinancialCalculations.calculateExitAnalysis({
      propertyValue: lastProjection.propertyValue,
      loanBalance: lastProjection.mortgageBalance,
      sellingCosts: this.assumptions.sellingCosts,
      totalInvestment,
      cumulativeCashFlow
    });
  }

  protected abstract calculateGrossIncome(year: number): number;
  protected abstract calculatePropertySpecificMetrics(): U;

  public analyze(): AnalysisResult<U> {
    const monthlyMortgage = this.calculateMonthlyMortgage();
    const annualDebtService = monthlyMortgage * 12;
    
    const grossIncome = this.calculateGrossIncome(1);
    // Calculate effective income after vacancy
    const effectiveIncome = grossIncome * (1 - this.assumptions.vacancyRate / 100);
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    // FIXED: NOI should be calculated on effective income, not gross
    const noi = FinancialCalculations.calculateNOI(effectiveIncome, operatingExpenses);
    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);

    // Calculate total investment including capital investments
    const totalInvestment = this.data.downPayment + 
                           (this.data.closingCosts || 0) + 
                           (this.data.capitalInvestments || 0);

    const projections = this.calculateProjections();
    const exitAnalysis = this.calculateExitAnalysis(projections);
    const propertyMetrics = this.calculatePropertySpecificMetrics();

    debug('==== BASE ANALYZER CALCULATIONS ====');
    debug('Monthly Mortgage:', monthlyMortgage);
    debug('Annual Debt Service:', annualDebtService);
    debug('Gross Income (Annual):', grossIncome);
    debug('Vacancy Rate:', this.assumptions.vacancyRate + '%');
    debug('Effective Income (Annual):', effectiveIncome);
    debug('Monthly Gross Income:', grossIncome / 12);
    debug('Monthly Effective Income:', effectiveIncome / 12);
    debug('Operating Expenses (Annual):', operatingExpenses);
    debug('NOI (from effective income):', noi);
    debug('Cash Flow (Annual):', cashFlow);
    debug('Cash Flow (Monthly):', cashFlow / 12);
    debug('Total Investment:', totalInvestment, {
      downPayment: this.data.downPayment,
      closingCosts: this.data.closingCosts || 0,
      capitalInvestments: this.data.capitalInvestments || 0
    });
    debug('Property Metrics:', propertyMetrics);
    debug('Projections Count:', projections.length);
    debug('Exit Analysis:', exitAnalysis);
    debug('===================================');

    // Calculate total cash flow from projections
    const totalCashFlow = projections.reduce((sum, p) => sum + p.cashFlow, 0);

    // BRRRR Fix: Calculate total appreciation from initial property value (ARV for BRRRR, purchase price for Buy & Hold)
    const initialPropertyValue = (this.data as any).afterRepairValue || this.data.purchasePrice;
    const totalAppreciation = projections[projections.length - 1]?.propertyValue - initialPropertyValue;
    
    // Calculate total return (cash flow + net proceeds from sale - total investment)
    const totalReturn = totalCashFlow + exitAnalysis.netProceedsFromSale - totalInvestment;

    debug('==== RETURNS CALCULATION ====');
    debug('Total Cash Flow:', totalCashFlow);
    debug('Total Appreciation:', totalAppreciation);
    debug('Net Proceeds from Sale:', exitAnalysis.netProceedsFromSale);
    debug('Total Return:', totalReturn);
    debug('============================');

    const result: AnalysisResult<U> = {
      monthlyAnalysis: {
        income: {
          gross: grossIncome / 12,
          effective: (grossIncome * (1 - this.assumptions.vacancyRate / 100)) / 12
        },
        expenses: {
          operating: operatingExpenses / 12,
          debt: monthlyMortgage,
          total: (operatingExpenses / 12) + monthlyMortgage,
          breakdown: this.getExpenseBreakdown(grossIncome)
        },
        cashFlow: cashFlow / 12
      },
      annualAnalysis: {
        income: grossIncome,
        expenses: operatingExpenses,
        noi,
        debtService: annualDebtService,
        cashFlow
      },
      keyMetrics: propertyMetrics,
      longTermAnalysis: {
        projections: projections, // Primary field name for consistency
        exitAnalysis: exitAnalysis,
        returns: {
          irr: propertyMetrics.irr !== null && propertyMetrics.irr !== undefined
            ? propertyMetrics.irr
            : 0, // Default to 0 if IRR calculation fails (prevents null type error)
          totalCashFlow: totalCashFlow,
          totalAppreciation: totalAppreciation,
          totalReturn: totalReturn,
          totalInvestment: totalInvestment,
          totalAdditionalInvestment: this.data.capitalInvestments || 0
        },
        projectionYears: this.assumptions.projectionYears
      }
    };

    debug('==== FINAL ANALYSIS RESULT STRUCTURE ====');
    debug('Monthly Analysis Keys:', Object.keys(result.monthlyAnalysis));
    debug('Monthly Income:', result.monthlyAnalysis.income);
    debug('Monthly Expenses:', result.monthlyAnalysis.expenses);
    debug('Monthly Cash Flow:', result.monthlyAnalysis.cashFlow);
    debug('Annual Analysis Keys:', Object.keys(result.annualAnalysis));
    debug('Metrics Keys:', Object.keys(result.keyMetrics));
    debug('Long Term Returns:', result.longTermAnalysis.returns);
    debug('========================================');

    return result;
  }

  protected getExpenseBreakdown(grossIncome: number): ExpenseBreakdown {
    // Calculate tenant turnover costs using the same model as in calculateProjections
    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
    const monthlyRent = grossIncome / 12;
    
    // Get turnover frequency in years (default: 2 years)
    const turnoverFrequency = this.assumptions.turnoverFrequency || 2;
    // Calculate base turnover rate as 1/frequency (e.g., 1/2 = 50% annual turnover)
    const baseTurnoverRate = 1 / turnoverFrequency;
    
    // Adjust based on vacancy rate: higher vacancy = higher turnover
    const vacancyAdjustment = this.assumptions.vacancyRate / 5;
    const turnoverRate = Math.min(0.9, baseTurnoverRate * vacancyAdjustment); // Cap at 90%
    
    // Calculate annual turnover cost and convert to monthly
    const annualTurnoverCost = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;
    const monthlyTurnoverCost = annualTurnoverCost / 12;

    return {
      propertyTax: this.data.purchasePrice * (this.data.propertyTaxRate / 100) / 12,
      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100) / 12,
      maintenance: this.data.maintenanceCost / 12,
      propertyManagement: grossIncome * (this.data.propertyManagementRate / 100) / 12,
      vacancy: 0, // Vacancy reduces income, not an expense - kept at 0 for type compatibility
      tenantTurnover: monthlyTurnoverCost,
      utilities: 0,
      commonAreaElectricity: 0,
      landscaping: 0,
      waterSewer: 0,
      garbage: 0,
      marketingAndAdvertising: 0,
      repairsAndMaintenance: 0,
      capEx: 0,
      other: 0
    };
  }
} 