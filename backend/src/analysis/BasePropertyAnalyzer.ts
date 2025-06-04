import { FinancialCalculations } from '../utils/financialCalculations';
import { BasePropertyData } from '../types/propertyTypes';
import {
  CommonMetrics,
  AnalysisResult,
  YearlyProjection,
  ExitAnalysis,
  ExpenseBreakdown
} from '../types/analysis';

export interface AnalysisAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualExpenseIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCosts: number;
  vacancyRate: number;
}

export abstract class BasePropertyAnalyzer<T extends BasePropertyData, U extends CommonMetrics> {
  protected data: T;
  protected assumptions: AnalysisAssumptions;

  constructor(data: T, assumptions: AnalysisAssumptions) {
    this.data = data;
    this.assumptions = assumptions;
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
      propertyManagement: grossIncome * (this.data.propertyManagementRate / 100),
      vacancy: grossIncome * (this.assumptions.vacancyRate / 100)
    };

    return Object.values(baseExpenses).reduce((sum, expense) => sum + expense, 0);
  }

  protected calculateNOI(grossIncome: number, operatingExpenses: number): number {
    return FinancialCalculations.calculateNOI(grossIncome, operatingExpenses);
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
    let currentPropertyValue = this.data.purchasePrice;
    let currentLoanBalance = this.data.purchasePrice - this.data.downPayment;

    for (let year = 1; year <= this.assumptions.projectionYears; year++) {
      const grossIncome = this.calculateGrossIncome(year);
      const operatingExpenses = FinancialCalculations.calculateOperatingExpenses(
        this.calculateOperatingExpenses(grossIncome),
        this.assumptions.annualExpenseIncrease,
        year
      );
      const noi = this.calculateNOI(grossIncome, operatingExpenses);
      const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);

      currentPropertyValue *= (1 + this.assumptions.annualPropertyValueIncrease / 100);

      const interestPaid = currentLoanBalance * (this.data.interestRate / 100);
      const principalPaid = annualDebtService - interestPaid;
      currentLoanBalance = Math.max(0, currentLoanBalance - principalPaid);

      const propertyTax = this.data.purchasePrice * (this.data.propertyTaxRate / 100);
      const insurance = this.data.purchasePrice * (this.data.insuranceRate / 100);
      const maintenance = this.data.maintenanceCost;
      const propertyManagement = grossIncome * (this.data.propertyManagementRate / 100);
      const vacancy = grossIncome * (this.assumptions.vacancyRate / 100);
      const realtorBrokerageFee = grossIncome * 0.0833; // One month's rent
      const appreciation = currentPropertyValue - this.data.purchasePrice;

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
        vacancy,
        realtorBrokerageFee,
        grossRent: grossIncome,
        appreciation
      });
    }

    return projections;
  }

  protected calculateExitAnalysis(projections: YearlyProjection[]): ExitAnalysis {
    const lastProjection = projections[projections.length - 1];
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);
    const cumulativeCashFlow = projections.reduce((sum, p) => sum + p.cashFlow, 0);

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
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    const noi = this.calculateNOI(grossIncome, operatingExpenses);
    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);

    const projections = this.calculateProjections();
    const exitAnalysis = this.calculateExitAnalysis(projections);

    return {
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
      metrics: this.calculatePropertySpecificMetrics(),
      projections,
      exitAnalysis
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
      repairsAndMaintenance: 0,
      capEx: 0,
      other: 0
    };
  }
} 