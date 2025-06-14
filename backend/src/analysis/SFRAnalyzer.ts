import { BasePropertyAnalyzer, AnalysisAssumptions } from './BasePropertyAnalyzer';
import { FinancialCalculations } from '../utils/financialCalculations';
import { SFRData } from '../types/propertyTypes';
import { ExpenseBreakdown, AnalysisResult, MonthlyAnalysis, ExitAnalysis, SensitivityAnalysis, SFRMetrics } from '../types/analysis';

export class SFRAnalyzer extends BasePropertyAnalyzer<SFRData, SFRMetrics> {
  protected calculateGrossIncome(year: number): number {
    return this.data.monthlyRent * 12 * 
      Math.pow(1 + this.assumptions.annualRentIncrease / 100, year - 1);
  }

  protected calculateOperatingExpenses(grossIncome: number): number {
    const { purchasePrice, propertyTaxRate, insuranceRate, maintenanceCost } = this.data;
    
    // Calculate base expenses
    const propertyTax = purchasePrice * (propertyTaxRate / 100);
    const insurance = purchasePrice * (insuranceRate / 100);
    const maintenance = maintenanceCost || grossIncome * 0.05; // Use provided maintenanceCost or default to 5% of gross income
    const propertyManagement = grossIncome * (this.data.propertyManagementRate / 100);
    const vacancy = grossIncome * (this.assumptions.vacancyRate / 100);
    const capEx = grossIncome * 0.05; // 5% for capital expenditures

    return propertyTax + insurance + maintenance + propertyManagement + vacancy + capEx;
  }

  protected calculatePropertySpecificMetrics(): SFRMetrics {
    const monthlyMortgage = this.calculateMonthlyMortgage();
    const annualDebtService = monthlyMortgage * 12;
    const grossIncome = this.calculateGrossIncome(1);
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    const noi = this.calculateNOI(grossIncome, operatingExpenses);
    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);

    // Log calculation details
    console.log('==== SFR CALCULATION DETAILS ====');
    console.log('Monthly Mortgage:', monthlyMortgage);
    console.log('Annual Debt Service:', annualDebtService);
    console.log('Gross Income:', grossIncome);
    console.log('Operating Expenses:', operatingExpenses);
    console.log('NOI:', noi);
    console.log('Cash Flow:', cashFlow);
    console.log('Total Investment:', totalInvestment);
    console.log('================================');

    // Calculate long-term returns for equity multiple
    const projections = this.calculateProjections();
    const exitAnalysis = this.calculateExitAnalysis(projections);
    const totalCashFlow = projections.reduce((sum, year) => sum + year.cashFlow, 0);
    const totalReturn = totalCashFlow + exitAnalysis.netProceedsFromSale - totalInvestment;

    // Debug operating expense ratio calculation
    console.log('==== OPERATING EXPENSE RATIO DEBUG ====');
    console.log('Operating Expenses:', operatingExpenses);
    console.log('Gross Income:', grossIncome);
    console.log('Operating Expense Ratio:', operatingExpenses > 0 && grossIncome > 0 ? 
      (operatingExpenses / grossIncome) * 100 : 0);
    console.log('Operating Expense Breakdown:', {
      propertyTax: this.data.purchasePrice * (this.data.propertyTaxRate / 100),
      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100),
      maintenance: this.data.maintenanceCost,
      propertyManagement: grossIncome * (this.data.propertyManagementRate / 100),
      vacancy: grossIncome * (this.assumptions.vacancyRate / 100)
    });
    console.log('=====================================');

    const metrics: SFRMetrics = {
      noi,
      capRate: this.calculateCapRate(noi),
      cashOnCashReturn: this.calculateCashOnCashReturn(cashFlow, totalInvestment),
      irr: FinancialCalculations.calculateIRR(this.getIRRCashFlows()),
      dscr: this.calculateDSCR(noi, annualDebtService),
      operatingExpenseRatio: FinancialCalculations.calculateOperatingExpenseRatio(
        operatingExpenses,
        grossIncome
      ),
      
      // SFR-specific metrics
      pricePerSqFt: FinancialCalculations.calculatePricePerSqFt(
        this.data.purchasePrice,
        this.data.squareFootage
      ),
      rentPerSqFt: (this.data.monthlyRent * 12) / this.data.squareFootage,
      grossRentMultiplier: FinancialCalculations.calculateGRM(
        this.data.purchasePrice,
        this.data.monthlyRent * 12
      ),
      
      // New metrics
      breakEvenOccupancy: FinancialCalculations.calculateBreakEvenOccupancy(
        operatingExpenses,
        annualDebtService,
        grossIncome
      ),
      equityMultiple: FinancialCalculations.calculateEquityMultiple(
        totalReturn,
        totalInvestment
      ),
      onePercentRuleValue: FinancialCalculations.calculateOnePercentRuleValue(
        this.data.monthlyRent,
        this.data.purchasePrice
      ),
      fiftyRuleAnalysis: FinancialCalculations.checkFiftyPercentRule(
        operatingExpenses,
        grossIncome
      ),
      rentToPriceRatio: FinancialCalculations.calculateRentToPriceRatio(
        this.data.monthlyRent,
        this.data.purchasePrice
      ),
      pricePerBedroom: FinancialCalculations.calculatePricePerBedroom(
        this.data.purchasePrice,
        this.data.bedrooms
      ),
      debtToIncomeRatio: FinancialCalculations.calculateDebtToIncomeRatio(
        annualDebtService,
        grossIncome
      )
    };

    // Log calculated metrics
    console.log('==== SFR METRICS ====');
    console.log('NOI:', metrics.noi);
    console.log('Cap Rate:', metrics.capRate);
    console.log('Cash on Cash Return:', metrics.cashOnCashReturn);
    console.log('DSCR:', metrics.dscr);
    console.log('Price Per SqFt:', metrics.pricePerSqFt);
    console.log('Rent Per SqFt:', metrics.rentPerSqFt);
    console.log('Break-Even Occupancy:', metrics.breakEvenOccupancy);
    console.log('Equity Multiple:', metrics.equityMultiple);
    console.log('One Percent Rule Value:', metrics.onePercentRuleValue);
    console.log('Fifty Rule Analysis:', metrics.fiftyRuleAnalysis);
    console.log('Rent-to-Price Ratio:', metrics.rentToPriceRatio);
    console.log('Price Per Bedroom:', metrics.pricePerBedroom);
    console.log('Debt-to-Income Ratio:', metrics.debtToIncomeRatio);
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
    return {
      propertyTax: this.data.purchasePrice * (this.data.propertyTaxRate / 100) / 12,
      insurance: this.data.purchasePrice * (this.data.insuranceRate / 100) / 12,
      maintenance: this.data.maintenanceCost / 12,
      propertyManagement: grossIncome * (this.data.propertyManagementRate / 100) / 12,
      vacancy: grossIncome * (this.assumptions.vacancyRate / 100) / 12,
      utilities: 0,
      commonAreaElectricity: 0,
      landscaping: 0,
      waterSewer: 0,
      garbage: 0,
      marketingAndAdvertising: 0,
      repairsAndMaintenance: grossIncome * 0.05 / 12, // 5% of gross income for repairs
      capEx: grossIncome * 0.05 / 12, // 5% for capital expenditures
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
          totalReturn: 0
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

  // Modify the analyze method to normalize the output
  public analyze(): AnalysisResult<SFRMetrics> {
    const result = super.analyze();
    return this.normalizeOutput(result);
  }
} 