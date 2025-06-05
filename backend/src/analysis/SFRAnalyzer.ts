import { BasePropertyAnalyzer, AnalysisAssumptions } from './BasePropertyAnalyzer';
import { FinancialCalculations } from '../utils/financialCalculations';
import { SFRData, SFRMetrics } from '../types/propertyTypes';
import { ExpenseBreakdown } from '../types/analysis';

export class SFRAnalyzer extends BasePropertyAnalyzer<SFRData, SFRMetrics> {
  protected calculateGrossIncome(year: number): number {
    return this.data.monthlyRent * 12 * 
      Math.pow(1 + this.assumptions.annualRentIncrease / 100, year - 1);
  }

  protected calculateOperatingExpenses(grossIncome: number): number {
    const { purchasePrice, propertyTaxRate, insuranceRate } = this.data;
    
    // Calculate base expenses
    const propertyTax = purchasePrice * (propertyTaxRate / 100);
    const insurance = purchasePrice * (insuranceRate / 100);
    const maintenance = grossIncome * 0.05; // 5% of gross income for maintenance
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
} 