import { BasePropertyAnalyzer, AnalysisAssumptions } from './BasePropertyAnalyzer';
import { FinancialCalculations } from '../utils/financialCalculations';
import { MultiFamilyData, MultiFamilyMetrics } from '../types/propertyTypes';
import { ExpenseBreakdown } from '../types/analysis';

export class MultiFamilyAnalyzer extends BasePropertyAnalyzer<MultiFamilyData, MultiFamilyMetrics> {
  protected calculateGrossIncome(year: number): number {
    const growthFactor = Math.pow(1 + this.assumptions.annualRentIncrease / 100, year - 1);
    return this.data.unitTypes.reduce((total, unit) => {
      return total + (unit.monthlyRent * unit.count * 12 * growthFactor);
    }, 0);
  }

  protected calculateOperatingExpenses(grossIncome: number): number {
    const { purchasePrice, propertyTaxRate, insuranceRate } = this.data;
    
    // Calculate base expenses
    const propertyTax = purchasePrice * (propertyTaxRate / 100);
    const insurance = purchasePrice * (insuranceRate / 100);
    const propertyManagement = grossIncome * (this.data.propertyManagement / 100);
    const vacancy = grossIncome * (this.assumptions.vacancyRate / 100);
    
    // Common area expenses - sum up all common area related expenses
    const commonAreaTotal = (
      (this.data.utilities || 0) +
      (this.data.commonAreaElectricity || 0) +
      (this.data.landscaping || 0) +
      (this.data.waterSewer || 0) +
      (this.data.garbage || 0) +
      (this.data.marketingAndAdvertising || 0)
    );
    
    // Repairs and maintenance
    const repairsAndMaintenance = this.data.repairsAndMaintenance || 0;
    
    // Capital expenditures
    const capEx = this.data.capEx || grossIncome * 0.07; // Use provided capEx or default to 7% of gross income

    return propertyTax + insurance + propertyManagement + vacancy + commonAreaTotal + repairsAndMaintenance + capEx;
  }

  protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
    const monthlyMortgage = this.calculateMonthlyMortgage();
    const annualDebtService = monthlyMortgage * 12;
    const grossIncome = this.calculateGrossIncome(1);
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    const noi = this.calculateNOI(grossIncome, operatingExpenses);
    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);

    const metrics: MultiFamilyMetrics = {
      noi,
      capRate: this.calculateCapRate(noi),
      cashOnCashReturn: this.calculateCashOnCashReturn(cashFlow, totalInvestment),
      irr: FinancialCalculations.calculateIRR(this.getIRRCashFlows()),
      dscr: this.calculateDSCR(noi, annualDebtService),
      operatingExpenseRatio: FinancialCalculations.calculateOperatingExpenseRatio(
        operatingExpenses,
        grossIncome
      ),
      
      // MF-specific metrics
      pricePerUnit: this.data.purchasePrice / this.data.totalUnits,
      pricePerSqft: FinancialCalculations.calculatePricePerSqFt(
        this.data.purchasePrice,
        this.data.totalSqft
      ),
      noiPerUnit: noi / this.data.totalUnits,
      averageRentPerUnit: grossIncome / (this.data.totalUnits * 12),
      operatingExpensePerUnit: operatingExpenses / this.data.totalUnits,
      commonAreaExpenseRatio: this.calculateCommonAreaExpenseRatio(),
      unitMixEfficiency: this.calculateUnitMixEfficiency(),
      economicVacancyRate: this.calculateEconomicVacancyRate(grossIncome)
    };

    return metrics;
  }

  protected getExpenseBreakdown(grossIncome: number): ExpenseBreakdown {
    const baseExpenses = super.getExpenseBreakdown(grossIncome);
    return {
      ...baseExpenses,
      utilities: (this.data.utilities || 0) / 12,
      commonAreaElectricity: (this.data.commonAreaElectricity || 0) / 12,
      landscaping: (this.data.landscaping || 0) / 12,
      waterSewer: (this.data.waterSewer || 0) / 12,
      garbage: (this.data.garbage || 0) / 12,
      marketingAndAdvertising: (this.data.marketingAndAdvertising || 0) / 12,
      repairsAndMaintenance: (this.data.repairsAndMaintenance || 0) / 12,
      capEx: (this.data.capEx || 0) / 12
    };
  }

  private calculateCommonAreaExpenseRatio(): number {
    const commonAreaExpenses = 
      (this.data.utilities || 0) +
      (this.data.commonAreaElectricity || 0) +
      (this.data.landscaping || 0) +
      (this.data.waterSewer || 0) +
      (this.data.garbage || 0);
    return (commonAreaExpenses / this.data.totalSqft) * 100;
  }

  private calculateUnitMixEfficiency(): number {
    const totalRentPotential = this.data.unitTypes.reduce((total, unit) => {
      return total + (unit.monthlyRent * unit.count * 12);
    }, 0);
    return (totalRentPotential / this.data.totalSqft) * 100;
  }

  private calculateEconomicVacancyRate(grossIncome: number): number {
    const potentialIncome = this.data.unitTypes.reduce((total, unit) => {
      return total + (unit.monthlyRent * unit.count * 12);
    }, 0);
    return ((potentialIncome - grossIncome) / potentialIncome) * 100;
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