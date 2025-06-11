import { BasePropertyAnalyzer, AnalysisAssumptions } from './BasePropertyAnalyzer';
import { FinancialCalculations } from '../utils/financialCalculations';
import { SFRData, SFRMetrics } from '../types/propertyTypes';
import { ExpenseBreakdown, AnalysisResult, MonthlyAnalysis, ExitAnalysis } from '../types/analysis';

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
    console.log('=====================');

    // Add rehab metrics if applicable
    if (this.data.afterRepairValue && this.data.renovationCosts) {
      metrics.afterRepairValueRatio = this.data.afterRepairValue / this.data.purchasePrice;
      metrics.rehabROI = ((this.data.afterRepairValue - this.data.purchasePrice) / 
                         this.data.renovationCosts) * 100;
    }

    return metrics;
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

    return [
      -totalInvestment,
      ...projections.map(year => year.cashFlow),
      exitAnalysis.netProceedsFromSale
    ];
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

    // Log the normalized structure
    console.log('Normalized analysis structure for frontend:', {
      hasMonthlyExpenses: !!normalized.monthlyAnalysis?.expenses,
      hasExpenseBreakdown: !!normalized.monthlyAnalysis?.expenses?.breakdown,
      hasPropertyTax: !!(normalized.monthlyAnalysis?.expenses as any)?.propertyTax,
      hasAnnualAnalysis: !!normalized.annualAnalysis,
      hasLongTermAnalysis: !!normalized.longTermAnalysis,
      hasKeyMetrics: !!normalized.keyMetrics
    });

    return normalized;
  }

  // Modify the analyze method to normalize the output
  public analyze(): AnalysisResult<SFRMetrics> {
    const result = super.analyze();
    return this.normalizeOutput(result);
  }
} 