import { BasePropertyAnalyzer, AnalysisAssumptions } from './BasePropertyAnalyzer';
import { FinancialCalculations, SFRCalculationEngine } from '../utils/financialCalculations';
import { SFRData } from '../types/propertyTypes';
import { ExpenseBreakdown, AnalysisResult, MonthlyAnalysis, ExitAnalysis, SensitivityAnalysis, SFRMetrics } from '../types/analysis';
import { marketIntelligenceService } from '../services/marketIntelligenceService';
import { MarketDataResponse, MarketInsight, InvestmentTimingAnalysis } from '../types/marketData';
import { logger } from '../utils/logger';

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
    console.log('==== SFR UNIFIED CALCULATION ENGINE ====');
    console.log('Monthly Mortgage:', monthlyMortgage);
    console.log('Annual Debt Service:', annualDebtService);
    console.log('Gross Income:', grossIncome);
    console.log('Effective Income (after ' + this.assumptions.vacancyRate + '% vacancy):', effectiveIncome);
    console.log('Operating Expenses (NO vacancy in expenses):', operatingExpenses);
    console.log('NOI (effective income - operating expenses):', noi);
    console.log('Cash Flow:', cashFlow);
    console.log('Total Investment:', totalInvestment);
    console.log('=======================================');

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
    console.log('==== FIXED OPERATING EXPENSE RATIO ====');
    console.log('Operating Expenses (NO vacancy):', operatingExpenses);
    console.log('Effective Income:', effectiveIncome);
    console.log('Operating Expense Ratio (vs effective income):', operatingExpenses > 0 && effectiveIncome > 0 ? 
      (operatingExpenses / effectiveIncome) * 100 : 0);
    console.log('Operating Expense Breakdown (CORRECTED):', {
      propertyTax: this.data.purchasePrice * (this.data.propertyTaxRate / 100),
      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100),
      maintenance: this.data.maintenanceCost,
      propertyManagement: grossIncome * (this.data.propertyManagementRate / 100),
      turnoverCosts: turnoverCosts,
      vacancy: 'REMOVED - handled as income reduction'
    });
    
    // Debug return on improvements and turnover cost impact calculations
    console.log('==== RETURN ON IMPROVEMENTS DEBUG ====');
    console.log('Capital Investments:', capitalInvestments);
    console.log('Estimated NOI Boost from Improvements:', estimatedNOIBoost);
    console.log('Base NOI (without improvements):', baseNOI);
    console.log('NOI (with improvements):', noi);
    console.log('NOI Increase:', estimatedNOIBoost);
    
    // Calculate return on improvements
    const returnOnImprovements = capitalInvestments > 0 ? 
      (estimatedNOIBoost / capitalInvestments) * 100 : 0;
    
    console.log('Return on Improvements Calculation:', {
      estimatedNOIBoost,
      capitalInvestments,
      returnOnImprovements: returnOnImprovements + '%'
    });
    
    console.log('==== TURNOVER COST IMPACT DEBUG ====');
    console.log('Turnover Costs:', turnoverCosts);
    console.log('Gross Income:', grossIncome);
    console.log('Turnover Cost Impact:', (turnoverCosts / grossIncome) * 100);
    console.log('=====================================');

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
    console.log('==== SFR METRICS ====');
    console.log('NOI:', metrics.noi);
    console.log('Cap Rate:', metrics.capRate);
    console.log('Cash on Cash Return:', metrics.cashOnCashReturn);
    console.log('DSCR:', metrics.dscr);
    console.log('Debt Yield:', commonMetrics.debtYield);
    console.log('Gross Yield:', commonMetrics.grossYield);
    console.log('Price Per SqFt:', metrics.pricePerSqFt);
    console.log('Reserves Analysis:', {
      recommended: reservesAnalysis.recommendedReserves,
      months: reservesAnalysis.breakdown.baseMonths + reservesAnalysis.breakdown.ageAdjustment + reservesAnalysis.breakdown.marketAdjustment
    });
    console.log('Rent Per SqFt:', metrics.rentPerSqFt);
    console.log('Break-Even Occupancy:', metrics.breakEvenOccupancy);
    console.log('Equity Multiple:', metrics.equityMultiple);
    console.log('One Percent Rule Value:', metrics.onePercentRuleValue);
    console.log('Fifty Rule Analysis:', metrics.fiftyRuleAnalysis);
    console.log('Rent-to-Price Ratio:', metrics.rentToPriceRatio);
    console.log('Price Per Bedroom:', metrics.pricePerBedroom);
    console.log('Debt-to-Income Ratio:', metrics.debtToIncomeRatio);
    console.log('Return on Improvements:', metrics.returnOnImprovements);
    console.log('Turnover Cost Impact:', metrics.turnoverCostImpact);
    console.log('=====================');

    // Add rehab metrics if applicable
    if (this.data.afterRepairValue && this.data.renovationCosts) {
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
    
    console.log('==== SENSITIVITY ANALYSIS DEBUG ====');
    console.log('Base values:');
    console.log('Gross Income:', grossIncome);
    console.log('Operating Expenses:', operatingExpenses);
    console.log('Annual Debt Service:', annualDebtService);
    console.log('NOI:', noi);
    console.log('Cash Flow:', cashFlow);
    console.log('Total Investment:', totalInvestment);
    
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
    
    console.log('Best case scenario:');
    console.log('Income:', bestCaseIncome);
    console.log('Expenses:', bestCaseExpenses);
    console.log('Vacancy Rate:', bestCaseVacancy);
    console.log('Interest Rate:', bestCaseInterestRate);
    console.log('NOI:', bestCaseNOI);
    console.log('Cash Flow:', bestCaseCashFlow);
    console.log('Cash on Cash Return:', bestCaseCashOnCash);
    console.log('DSCR:', bestCaseDSCR);
    console.log('Total Return:', bestCaseTotalReturn);
    
    console.log('Worst case scenario:');
    console.log('Income:', worstCaseIncome);
    console.log('Expenses:', worstCaseExpenses);
    console.log('Vacancy Rate:', worstCaseVacancy);
    console.log('Interest Rate:', worstCaseInterestRate);
    console.log('NOI:', worstCaseNOI);
    console.log('Cash Flow:', worstCaseCashFlow);
    console.log('Cash on Cash Return:', worstCaseCashOnCash);
    console.log('DSCR:', worstCaseDSCR);
    console.log('Total Return:', worstCaseTotalReturn);
    console.log('==================================');
    
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

    return {
      propertyTax: Math.round((this.data.purchasePrice * (this.data.propertyTaxRate / 100) / 12) * 100) / 100,
      insurance: Math.round((this.data.purchasePrice * (this.data.insuranceRate / 100) / 12) * 100) / 100,
      maintenance: Math.round((this.data.maintenanceCost / 12) * 100) / 100,
      propertyManagement: Math.round((grossIncome * (this.data.propertyManagementRate / 100) / 12) * 100) / 100,
      vacancy: 0, // FIXED - Vacancy reduces income, not an expense
      tenantTurnover: Math.round(monthlyTurnoverCost * 100) / 100,
      utilities: 0,
      commonAreaElectricity: 0,
      landscaping: 0,
      waterSewer: 0,
      garbage: 0,
      marketingAndAdvertising: 0,
      repairsAndMaintenance: 0, // REMOVED - was unauthorized 5% default
      capEx: 0, // REMOVED - was unauthorized 5% default
      other: 0
    };
  }

  private getIRRCashFlows(): number[] {
    const projections = this.calculateProjections();
    const exitAnalysis = this.calculateExitAnalysis(projections);
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);

    const cashFlows = [
      -totalInvestment,
      ...projections.map(year => year.cashFlow),
      exitAnalysis.netProceedsFromSale
    ];
    
    // Debug IRR calculation inputs
    console.log('==== IRR CALCULATION DEBUG ====');
    console.log('Initial Investment:', totalInvestment);
    console.log('Annual Cash Flows:', projections.map(year => year.cashFlow));
    console.log('Exit Proceeds:', exitAnalysis.netProceedsFromSale);
    console.log('Complete Cash Flow Array:', cashFlows);
    console.log('=============================');
    
    return cashFlows;
  }

  // Add a new method to normalize the output structure to match frontend expectations
  private normalizeOutput(result: AnalysisResult<SFRMetrics>): AnalysisResult<SFRMetrics> {
    // First, create a copy of the result to avoid modifying the original
    const normalized = JSON.parse(JSON.stringify(result)) as AnalysisResult<SFRMetrics>;

    // Move expense breakdown items to the expenses object directly for monthly analysis
    if (normalized.monthlyAnalysis?.expenses?.breakdown) {
      const breakdown = normalized.monthlyAnalysis.expenses.breakdown;
      
      // Use type assertion to allow adding properties to expenses object
      normalized.monthlyAnalysis.expenses = {
        ...normalized.monthlyAnalysis.expenses,
        propertyTax: breakdown.propertyTax,
        insurance: breakdown.insurance,
        maintenance: breakdown.maintenance,
        propertyManagement: breakdown.propertyManagement,
        vacancy: breakdown.vacancy,
        mortgage: normalized.monthlyAnalysis.expenses.debt 
          ? { total: normalized.monthlyAnalysis.expenses.debt }
          : (normalized.monthlyAnalysis.expenses as any).mortgage || { total: 0 }
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
    console.log('Normalized analysis structure for frontend:', {
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