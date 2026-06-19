import { BasePropertyAnalyzer, AnalysisAssumptions } from './BasePropertyAnalyzer';
import { FinancialCalculations, SFRCalculationEngine } from '../utils/financialCalculations';
import { SFRData } from '../types/propertyTypes';
import { ExpenseBreakdown, AnalysisResult, MonthlyAnalysis, ExitAnalysis, SensitivityAnalysis, SFRMetrics } from '../types/analysis';
import { marketIntelligenceService } from '../services/marketIntelligenceService';
import { MarketDataResponse, MarketInsight, InvestmentTimingAnalysis } from '../types/marketData';
import { logger } from '../utils/logger';

// Debug helper - only logs in development
// 🔍 ISSUE #53 DEBUG: Temporarily disabled to reduce noise
const debug = (...args: any[]) => {
  // TEMPORARILY DISABLED
  // if (process.env.NODE_ENV !== 'production') {
  //   console.log(...args);
  // }
};

export class SFRAnalyzer extends BasePropertyAnalyzer<SFRData, SFRMetrics> {
  protected calculateGrossIncome(year: number): number {
    return SFRCalculationEngine.calculateGrossIncome(this.data, year);
  }

  protected calculateOperatingExpenses(grossIncome: number): number {
    // FIXED: Use unified calculation engine - NO vacancy expense, NO unauthorized CapEx
    return SFRCalculationEngine.calculateOperatingExpenses(this.data, grossIncome, 1, this.assumptions);
  }

  protected calculatePropertySpecificMetrics(): SFRMetrics {
    const monthlyMortgage = this.calculateMonthlyMortgage();
    const annualDebtService = monthlyMortgage * 12;
    const grossIncome = this.calculateGrossIncome(1);
    
    // FIXED: Calculate effective income (after vacancy) BEFORE NOI
    const effectiveIncome = FinancialCalculations.calculateEffectiveIncome(grossIncome, this.assumptions.vacancyRate);
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    
    // FIXED: NOI = effective income - operating expenses (no vacancy in expenses!)
    const noi = FinancialCalculations.calculateNOI(effectiveIncome, operatingExpenses);
    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
    const totalInvestment = FinancialCalculations.calculateTotalInvestment(
      this.data.downPayment,
      this.data.closingCosts || 0,
      this.data.capitalInvestments || 0
    );

    // Log calculation details with FIXED calculations
    debug('==== SFR UNIFIED CALCULATION ENGINE ====');
    debug('Monthly Mortgage:', monthlyMortgage);
    debug('Annual Debt Service:', annualDebtService);
    debug('Gross Income:', grossIncome);
    debug('Effective Income (after ' + this.assumptions.vacancyRate + '% vacancy):', effectiveIncome);
    debug('Operating Expenses (NO vacancy in expenses):', operatingExpenses);
    debug('NOI (effective income - operating expenses):', noi);
    debug('Cash Flow:', cashFlow);
    debug('Total Investment:', totalInvestment);
    debug('=======================================');

    // Calculate long-term returns for equity multiple
    const projections = this.calculateProjections();
    const exitAnalysis = this.calculateExitAnalysis(projections);
    const totalCashFlow = projections.reduce((sum, year) => sum + year.cashFlow, 0);
    const totalReturn = totalCashFlow + exitAnalysis.netProceedsFromSale - totalInvestment;

    // Calculate NOI without capital improvements
    // Estimate the impact of capital improvements on NOI (typically 8-10% return)
    const capitalInvestments = this.data.capitalInvestments || 0;
    const estimatedNOIBoost = capitalInvestments * 0.08; // Assume 8% return on capital improvements
    const baseNOI = noi - estimatedNOIBoost;
    
    // Use unified calculation engine for turnover costs
    const turnoverCosts = FinancialCalculations.calculateTurnoverCosts({
      prepFees: this.data.tenantTurnoverFees?.prepFees || 500,
      monthlyRent: grossIncome / 12,
      realtorCommission: this.data.tenantTurnoverFees?.realtorCommission || 0.5,
      turnoverFrequency: this.assumptions.turnoverFrequency || 2,
      vacancyRate: this.assumptions.vacancyRate
    });

    // Debug operating expense ratio calculation - FIXED
    debug('==== FIXED OPERATING EXPENSE RATIO ====');
    debug('Operating Expenses (NO vacancy):', operatingExpenses);
    debug('Effective Income:', effectiveIncome);
    debug('Operating Expense Ratio (vs effective income):', operatingExpenses > 0 && effectiveIncome > 0 ? 
      (operatingExpenses / effectiveIncome) * 100 : 0);
    debug('Operating Expense Breakdown (CORRECTED):', {
      propertyTax: this.data.purchasePrice * (this.data.propertyTaxRate / 100),
      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100),
      maintenance: this.data.maintenanceCost,
      propertyManagement: grossIncome * (this.data.propertyManagementRate / 100),
      turnoverCosts: turnoverCosts,
      vacancy: 'REMOVED - handled as income reduction'
    });
    
    // Debug return on improvements and turnover cost impact calculations
    debug('==== RETURN ON IMPROVEMENTS DEBUG ====');
    debug('Capital Investments:', capitalInvestments);
    debug('Estimated NOI Boost from Improvements:', estimatedNOIBoost);
    debug('Base NOI (without improvements):', baseNOI);
    debug('NOI (with improvements):', noi);
    debug('NOI Increase:', estimatedNOIBoost);
    
    // Calculate return on improvements
    const returnOnImprovements = capitalInvestments > 0 ? 
      (estimatedNOIBoost / capitalInvestments) * 100 : 0;
    
    debug('Return on Improvements Calculation:', {
      estimatedNOIBoost,
      capitalInvestments,
      returnOnImprovements: returnOnImprovements + '%'
    });
    
    debug('==== TURNOVER COST IMPACT DEBUG ====');
    debug('Turnover Costs:', turnoverCosts);
    debug('Gross Income:', grossIncome);
    debug('Turnover Cost Impact:', (turnoverCosts / grossIncome) * 100);
    debug('=====================================');

    // Calculate loan amount for debt yield calculation
    const loanAmount = this.data.purchasePrice - this.data.downPayment;
    
    // Use unified calculation engine for all metrics
    const commonMetrics = {
      noi,
      capRate: FinancialCalculations.calculateCapRate(noi, this.data.purchasePrice),
      cashOnCashReturn: FinancialCalculations.calculateCashOnCashReturn(cashFlow, totalInvestment),
      dscr: FinancialCalculations.calculateDSCR(noi, annualDebtService),
      operatingExpenseRatio: FinancialCalculations.calculateOperatingExpenseRatio(operatingExpenses, effectiveIncome),
      debtYield: FinancialCalculations.calculateDebtYield(noi, loanAmount),
      grossYield: FinancialCalculations.calculateGrossYield(grossIncome, this.data.purchasePrice),
      totalInvestment
    };
    
    // Calculate reserves analysis
    const monthlyExpenses = operatingExpenses / 12 + monthlyMortgage;
    const propertyAge = new Date().getFullYear() - (this.data.yearBuilt || 2000);
    const reservesAnalysis = FinancialCalculations.calculateRecommendedReserves({
      monthlyExpenses,
      propertyAge,
      marketVolatility: 'medium' // Default to medium, could be dynamic based on market data
    });

    // Get SFR-specific metrics from unified engine
    const sfrMetrics = SFRCalculationEngine.calculatePropertySpecificMetrics(this.data, commonMetrics, this.assumptions);
    
    const metrics: SFRMetrics = {
      ...sfrMetrics,
      ...commonMetrics, // Include debtYield and grossYield
      noi,
      irr: FinancialCalculations.calculateIRR(this.getIRRCashFlows()),
      
      // Additional metrics calculated here (unified engine handles the rest)
      equityMultiple: FinancialCalculations.calculateEquityMultiple(
        totalReturn,
        totalInvestment
      ),
      
      // Add return on improvements metric
      returnOnImprovements: returnOnImprovements,
      
      // Add turnover cost impact metric
      turnoverCostImpact: FinancialCalculations.calculateTurnoverCostImpact(
        turnoverCosts,
        grossIncome
      ),
      
      // Add reserves analysis
      reservesAnalysis
    };

    // Log calculated metrics with new additions
    debug('==== SFR METRICS ====');
    debug('NOI:', metrics.noi);
    debug('Cap Rate:', metrics.capRate);
    debug('Cash on Cash Return:', metrics.cashOnCashReturn);
    debug('DSCR:', metrics.dscr);
    debug('Debt Yield:', commonMetrics.debtYield);
    debug('Gross Yield:', commonMetrics.grossYield);
    debug('Price Per SqFt:', metrics.pricePerSqFt);
    debug('Reserves Analysis:', {
      recommended: reservesAnalysis.recommendedReserves,
      months: reservesAnalysis.breakdown.baseMonths + reservesAnalysis.breakdown.ageAdjustment + reservesAnalysis.breakdown.marketAdjustment
    });
    debug('Rent Per SqFt:', metrics.rentPerSqFt);
    debug('Break-Even Occupancy:', metrics.breakEvenOccupancy);
    debug('Equity Multiple:', metrics.equityMultiple);
    debug('One Percent Rule Value:', metrics.onePercentRuleValue);
    debug('Fifty Rule Analysis:', metrics.fiftyRuleAnalysis);
    debug('Rent-to-Price Ratio:', metrics.rentToPriceRatio);
    debug('Price Per Bedroom:', metrics.pricePerBedroom);
    debug('Debt-to-Income Ratio:', metrics.debtToIncomeRatio);
    debug('Return on Improvements:', metrics.returnOnImprovements);
    debug('Turnover Cost Impact:', metrics.turnoverCostImpact);
    debug('=====================');

    // Add rehab metrics ONLY for BRRRR strategy
    if ((this.data as any).investmentStrategy === 'brrrr' &&
        this.data.afterRepairValue &&
        this.data.renovationCosts) {
      metrics.afterRepairValueRatio = this.data.afterRepairValue / this.data.purchasePrice;
      metrics.rehabROI = ((this.data.afterRepairValue - this.data.purchasePrice) /
                         this.data.renovationCosts) * 100;
    }

    return metrics;
  }

  protected calculateSensitivityAnalysis(): SensitivityAnalysis {
    // Get base values
    const grossIncome = this.calculateGrossIncome(1);
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    const annualDebtService = this.calculateMonthlyMortgage() * 12;
    const noi = this.calculateNOI(grossIncome, operatingExpenses);
    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);
    const projections = this.calculateProjections();
    const exitAnalysis = this.calculateExitAnalysis(projections);
    
    debug('==== SENSITIVITY ANALYSIS DEBUG ====');
    debug('Base values:');
    debug('Gross Income:', grossIncome);
    debug('Operating Expenses:', operatingExpenses);
    debug('Annual Debt Service:', annualDebtService);
    debug('NOI:', noi);
    debug('Cash Flow:', cashFlow);
    debug('Total Investment:', totalInvestment);
    
    // Enhanced best case: Higher rent, lower expenses, lower vacancy, higher appreciation
    const bestCaseIncome = grossIncome * 1.05; // 5% higher income
    const bestCaseExpenses = operatingExpenses * 0.95; // 5% lower expenses
    const bestCaseVacancy = Math.max(1, this.assumptions.vacancyRate - 2); // 2% lower vacancy (min 1%)
    const bestCaseAppreciationRate = this.assumptions.annualPropertyValueIncrease * 1.2; // 20% higher appreciation
    const bestCaseInterestRate = Math.max(this.data.interestRate - 0.5, 0); // 0.5% lower interest rate (min 0%)
    
    // Calculate best case mortgage with lower interest rate
    const bestCaseLoanAmount = this.data.purchasePrice - this.data.downPayment;
    const bestCaseMonthlyMortgage = FinancialCalculations.calculateMortgage(
      bestCaseLoanAmount,
      bestCaseInterestRate,
      this.data.loanTerm
    );
    const bestCaseAnnualDebtService = bestCaseMonthlyMortgage * 12;
    
    // Calculate best case metrics
    const bestCaseNOI = bestCaseIncome * (1 - bestCaseVacancy / 100) - bestCaseExpenses;
    const bestCaseCashFlow = bestCaseNOI - bestCaseAnnualDebtService;
    const bestCaseCashOnCash = FinancialCalculations.calculateCashOnCashReturn(
      bestCaseCashFlow, 
      totalInvestment
    );
    const bestCaseDSCR = FinancialCalculations.calculateDSCR(bestCaseNOI, bestCaseAnnualDebtService);
    
    // For total return, use higher appreciation rate
    const bestCaseTotalReturn = bestCaseCashFlow * this.assumptions.projectionYears +
      (this.data.purchasePrice * Math.pow(1 + bestCaseAppreciationRate / 100, 
      this.assumptions.projectionYears) - this.data.purchasePrice);
    
    // Worst case calculations with expanded variables
    const worstCaseIncome = grossIncome * 0.95; // 5% lower income
    const worstCaseExpenses = operatingExpenses * 1.1; // 10% higher expenses
    const worstCaseVacancy = this.assumptions.vacancyRate + 3; // 3% higher vacancy
    const worstCaseAppreciationRate = this.assumptions.annualPropertyValueIncrease * 0.7; // 30% lower appreciation
    const worstCaseInterestRate = this.data.interestRate + 1.0; // 1% higher interest rate
    
    // Calculate worst case mortgage with higher interest rate
    const worstCaseLoanAmount = this.data.purchasePrice - this.data.downPayment;
    const worstCaseMonthlyMortgage = FinancialCalculations.calculateMortgage(
      worstCaseLoanAmount,
      worstCaseInterestRate,
      this.data.loanTerm
    );
    const worstCaseAnnualDebtService = worstCaseMonthlyMortgage * 12;
    
    // Calculate worst case metrics
    const worstCaseNOI = worstCaseIncome * (1 - worstCaseVacancy / 100) - worstCaseExpenses;
    const worstCaseCashFlow = worstCaseNOI - worstCaseAnnualDebtService;
    const worstCaseCashOnCash = FinancialCalculations.calculateCashOnCashReturn(
      worstCaseCashFlow, 
      totalInvestment
    );
    const worstCaseDSCR = FinancialCalculations.calculateDSCR(worstCaseNOI, worstCaseAnnualDebtService);
    
    // For total return, use lower appreciation rate
    const worstCaseTotalReturn = worstCaseCashFlow * this.assumptions.projectionYears +
      (this.data.purchasePrice * Math.pow(1 + worstCaseAppreciationRate / 100, 
      this.assumptions.projectionYears) - this.data.purchasePrice);
    
    debug('Best case scenario:');
    debug('Income:', bestCaseIncome);
    debug('Expenses:', bestCaseExpenses);
    debug('Vacancy Rate:', bestCaseVacancy);
    debug('Interest Rate:', bestCaseInterestRate);
    debug('NOI:', bestCaseNOI);
    debug('Cash Flow:', bestCaseCashFlow);
    debug('Cash on Cash Return:', bestCaseCashOnCash);
    debug('DSCR:', bestCaseDSCR);
    debug('Total Return:', bestCaseTotalReturn);
    
    debug('Worst case scenario:');
    debug('Income:', worstCaseIncome);
    debug('Expenses:', worstCaseExpenses);
    debug('Vacancy Rate:', worstCaseVacancy);
    debug('Interest Rate:', worstCaseInterestRate);
    debug('NOI:', worstCaseNOI);
    debug('Cash Flow:', worstCaseCashFlow);
    debug('Cash on Cash Return:', worstCaseCashOnCash);
    debug('DSCR:', worstCaseDSCR);
    debug('Total Return:', worstCaseTotalReturn);
    debug('==================================');
    
    return {
      bestCase: {
        cashFlow: bestCaseCashFlow,
        cashOnCashReturn: bestCaseCashOnCash,
        totalReturn: bestCaseTotalReturn,
        noi: bestCaseNOI,
        dscr: bestCaseDSCR,
        vacancyRate: bestCaseVacancy,
        interestRate: bestCaseInterestRate,
        appreciationRate: bestCaseAppreciationRate
      },
      worstCase: {
        cashFlow: worstCaseCashFlow,
        cashOnCashReturn: worstCaseCashOnCash,
        totalReturn: worstCaseTotalReturn,
        noi: worstCaseNOI,
        dscr: worstCaseDSCR,
        vacancyRate: worstCaseVacancy,
        interestRate: worstCaseInterestRate,
        appreciationRate: worstCaseAppreciationRate
      }
    };
  }

  protected getExpenseBreakdown(grossIncome: number): ExpenseBreakdown {
    // Calculate monthly turnover cost using unified engine
    const annualTurnoverCost = FinancialCalculations.calculateTurnoverCosts({
      prepFees: this.data.tenantTurnoverFees?.prepFees || 500,
      monthlyRent: grossIncome / 12,
      realtorCommission: this.data.tenantTurnoverFees?.realtorCommission || 0.5,
      turnoverFrequency: this.assumptions.turnoverFrequency || 2,
      vacancyRate: this.assumptions.vacancyRate
    });
    const monthlyTurnoverCost = annualTurnoverCost / 12;

    const breakdown = {
      propertyTax: Math.round((this.data.purchasePrice * (this.data.propertyTaxRate / 100) / 12) * 100) / 100,
      insurance: Math.round((this.data.purchasePrice * (this.data.insuranceRate / 100) / 12) * 100) / 100,
      maintenance: Math.round((this.data.maintenanceCost / 12) * 100) / 100,
      propertyManagement: Math.round((grossIncome * (this.data.propertyManagementRate / 100) / 12) * 100) / 100,
      vacancy: 0, // FIXED - Vacancy reduces income, not an expense
      tenantTurnover: Math.round(monthlyTurnoverCost * 100) / 100,

      // MF-specific expenses (keep at 0 for SFR)
      utilities: 0,
      commonAreaElectricity: 0,
      landscaping: 0,
      waterSewer: 0,
      garbage: 0,
      marketingAndAdvertising: 0,
      repairsAndMaintenance: 0, // REMOVED - was unauthorized 5% default
      capEx: 0, // REMOVED - was unauthorized 5% default
      other: 0,

      // ✅ NEW: SFR-specific operating expenses (Jan 2026 - Josh's feature)
      hoa: Math.round((this.data.monthlyHOA || 0) * 100) / 100,
      landlordUtilities: Math.round((this.data.monthlyUtilities || 0) * 100) / 100,
      sfrCapEx: Math.round((this.data.monthlyCapEx || 0) * 100) / 100
    };

    return breakdown;
  }

  private getIRRCashFlows(): number[] {
    const projections = this.calculateProjections();
    const exitAnalysis = this.calculateExitAnalysis(projections);
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);

    // Task #62 (2026-06-18): COMBINE exit proceeds into the LAST
    // projection year's cash flow rather than appending as a separate
    // element. The previous shape `[-init, Y1..Y10, sale]` had 12
    // elements which the IRR solver treats as 11 periods — sale was
    // being discounted as if it occurred at Y11, ONE YEAR after the
    // last operating year. That artificially LOWERED the reported IRR
    // (~85 bps off on a 10-yr hold). Verified on 1837 Walnut Way:
    // engine reported 8.04%, hand-calculated IRR with correct periods
    // is ~8.9%. The CoC denominator (down + closing) was correct all
    // along; the period count was the bug.
    //
    // Correct shape: `[-init, Y1..Y9, Y10_ops + sale]` = N+1 elements
    // for an N-year hold. IRR solver now sees the exit at the right
    // year and produces a value consistent with the Cash-on-Cash
    // denominator.
    const annualCashFlows = projections.map(year => year.cashFlow);
    if (annualCashFlows.length > 0) {
      annualCashFlows[annualCashFlows.length - 1] += exitAnalysis.netProceedsFromSale;
    }
    const cashFlows = [-totalInvestment, ...annualCashFlows];

    // Debug IRR calculation inputs
    debug('==== IRR CALCULATION DEBUG ====');
    debug('Initial Investment:', totalInvestment);
    debug('Annual Cash Flows:', projections.map(year => year.cashFlow));
    debug('Exit Proceeds (combined into last year):', exitAnalysis.netProceedsFromSale);
    debug('Complete Cash Flow Array:', cashFlows);
    debug('=============================');

    return cashFlows;
  }

  // Add a new method to normalize the output structure to match frontend expectations
  private normalizeOutput(result: AnalysisResult<SFRMetrics>): AnalysisResult<SFRMetrics> {
    // First, create a copy of the result to avoid modifying the original
    const normalized = JSON.parse(JSON.stringify(result)) as AnalysisResult<SFRMetrics>;

    // Move expense breakdown items to the expenses object directly for monthly analysis
    if (normalized.monthlyAnalysis?.expenses?.breakdown) {
      const breakdown = normalized.monthlyAnalysis.expenses.breakdown;

      // ✅ CRITICAL FIX (Issue #1 - Operating Expenses Persistence)
      // MUST explicitly preserve breakdown object when creating new expenses object
      // Previous code lost breakdown because it wasn't re-added after spread
      normalized.monthlyAnalysis.expenses = {
        ...normalized.monthlyAnalysis.expenses,
        propertyTax: breakdown.propertyTax,
        insurance: breakdown.insurance,
        maintenance: breakdown.maintenance,
        propertyManagement: breakdown.propertyManagement,
        vacancy: breakdown.vacancy,
        mortgage: normalized.monthlyAnalysis.expenses.debt
          ? { total: normalized.monthlyAnalysis.expenses.debt }
          : (normalized.monthlyAnalysis.expenses as any).mortgage || { total: 0 },
        // ✅ CRITICAL: Re-add breakdown object (was being lost!)
        breakdown: breakdown
      } as any; // Type assertion to avoid TypeScript errors
    }

    // Ensure key metrics are directly accessible
    if ((normalized as any).metrics && !normalized.keyMetrics) {
      normalized.keyMetrics = (normalized as any).metrics;
      delete (normalized as any).metrics;
    }

    // Ensure monthly expenses total is calculated
    if (normalized.monthlyAnalysis?.expenses) {
      const expenses = normalized.monthlyAnalysis.expenses as any; // Type assertion
      const mortgage = expenses.mortgage?.total || 0;
      const propertyTax = expenses.propertyTax || 0;
      const insurance = expenses.insurance || 0;
      const maintenance = expenses.maintenance || 0;
      const propertyManagement = expenses.propertyManagement || 0;
      const vacancy = expenses.vacancy || 0;
      
      normalized.monthlyAnalysis.expenses.total = 
        mortgage + propertyTax + insurance + maintenance + propertyManagement + vacancy;
    }

    // Convert monthly income if needed
    if (normalized.monthlyAnalysis?.income) {
      if (typeof normalized.monthlyAnalysis.income === 'number') {
        normalized.monthlyAnalysis.income = {
          gross: normalized.monthlyAnalysis.income,
          effective: normalized.monthlyAnalysis.income * (1 - (this.assumptions.vacancyRate / 100))
        };
      }
    }

    // Ensure all required properties exist
    if (!normalized.longTermAnalysis) {
      normalized.longTermAnalysis = {
        projections: [],
        projectionYears: this.assumptions.projectionYears,
        returns: {
          irr: 0,
          totalCashFlow: 0,
          totalAppreciation: 0,
          totalReturn: 0,
          totalInvestment: 0,
          totalAdditionalInvestment: 0
        },
        exitAnalysis: {
          projectedSalePrice: 0,
          sellingCosts: 0,
          mortgagePayoff: 0,
          netProceedsFromSale: 0
        } as any // Type assertion for additional properties
      };
    }
    
    // Add sensitivity analysis
    normalized.sensitivityAnalysis = this.calculateSensitivityAnalysis();

    // Log the normalized structure
    debug('Normalized analysis structure for frontend:', {
      hasMonthlyExpenses: !!normalized.monthlyAnalysis?.expenses,
      hasExpenseBreakdown: !!normalized.monthlyAnalysis?.expenses?.breakdown,
      hasPropertyTax: !!(normalized.monthlyAnalysis?.expenses as any)?.propertyTax,
      hasAnnualAnalysis: !!normalized.annualAnalysis,
      hasLongTermAnalysis: !!normalized.longTermAnalysis,
      hasKeyMetrics: !!normalized.keyMetrics,
      hasSensitivityAnalysis: !!normalized.sensitivityAnalysis
    });

    return normalized;
  }

  // Add market data fetching method
  private async fetchMarketData(): Promise<{
    marketData: MarketDataResponse | null;
    marketInsights: MarketInsight[];
    investmentTiming: InvestmentTimingAnalysis | null;
  }> {
    try {
      // Extract address information from SFR data
      const address = `${this.data.propertyAddress.street}, ${this.data.propertyAddress.city}, ${this.data.propertyAddress.state} ${this.data.propertyAddress.zipCode}`;
      
      logger.info(`Fetching market data for SFR property: ${address}`);

      // Fetch comprehensive market data
      const marketData = await marketIntelligenceService.getComprehensiveMarketData({
        address,
        zipCode: this.data.propertyAddress.zipCode,
        city: this.data.propertyAddress.city,
        state: this.data.propertyAddress.state,
        propertyType: 'SFR',
        includeEconomicData: true,
        maxComparables: 10,
        radius: 0.5
      });

      // Generate market insights based on property data
      const marketInsights = await marketIntelligenceService.generateMarketInsights(
        this.data,
        marketData
      );

      // Analyze investment timing
      const investmentTiming = await marketIntelligenceService.analyzeInvestmentTiming(marketData);

      logger.info(`Successfully fetched market intelligence: ${marketInsights.length} insights generated`);

      return {
        marketData,
        marketInsights,
        investmentTiming
      };
    } catch (error) {
      logger.error('Failed to fetch market data for SFR analysis:', error);
      
      // Return empty data to allow analysis to continue
      return {
        marketData: null,
        marketInsights: [],
        investmentTiming: null
      };
    }
  }

  // Keep the original analyze method for compatibility
  public analyze(): AnalysisResult<SFRMetrics> {
    const result = super.analyze();
    return this.normalizeOutput(result);
  }

  // New method for comprehensive analysis with market data
  public async analyzeWithMarketIntelligence(): Promise<AnalysisResult<SFRMetrics> & {
    marketData?: MarketDataResponse;
    marketInsights?: MarketInsight[];
    investmentTiming?: InvestmentTimingAnalysis;
  }> {
    // Perform base analysis
    const result = super.analyze();
    const normalizedResult = this.normalizeOutput(result);

    // Fetch market intelligence data
    const { marketData, marketInsights, investmentTiming } = await this.fetchMarketData();

    // Enhance the result with market intelligence
    const enhancedResult = {
      ...normalizedResult,
      ...(marketData && { marketData }),
      ...(marketInsights.length > 0 && { marketInsights }),
      ...(investmentTiming && { investmentTiming })
    };

    logger.info('SFR analysis completed with market intelligence enhancement');

    return enhancedResult;
  }
} 