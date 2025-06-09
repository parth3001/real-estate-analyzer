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
    const { purchasePrice, propertyTaxRate, insuranceRate, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;
    
    // Calculate base expenses
    const propertyTax = purchasePrice * (propertyTaxRate / 100);
    const insurance = purchasePrice * (insuranceRate / 100);
    const propertyManagement = grossIncome * (propertyManagementRate / 100);
    const vacancy = grossIncome * (this.assumptions.vacancyRate / 100);
    
    // Calculate maintenance based on per-unit cost
    const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;
    
    // Common area expenses from commonAreaUtilities if present
    let commonAreaTotal = 0;
    if (this.data.commonAreaUtilities) {
      commonAreaTotal = 
        (this.data.commonAreaUtilities.electric || 0) +
        (this.data.commonAreaUtilities.water || 0) +
        (this.data.commonAreaUtilities.gas || 0) +
        (this.data.commonAreaUtilities.trash || 0);
    }
    
    // Use a default cap expenditure rate if not provided
    const capExRate = 0.05; // 5% of gross income as default
    const capEx = grossIncome * capExRate;

    return propertyTax + insurance + propertyManagement + vacancy + maintenance + commonAreaTotal + capEx;
  }

  protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
    const monthlyMortgage = this.calculateMonthlyMortgage();
    const annualDebtService = monthlyMortgage * 12;
    const grossIncome = this.calculateGrossIncome(1);
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    const noi = this.calculateNOI(grossIncome, operatingExpenses);
    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
    const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0);

    // Calculate IRR or use a default if calculation fails
    let irr = -99;
    try {
      irr = FinancialCalculations.calculateIRR(this.getIRRCashFlows());
    } catch (error) {
      console.error('Error calculating IRR:', error);
    }

    const metrics: MultiFamilyMetrics = {
      noi,
      capRate: this.calculateCapRate(noi),
      cashOnCashReturn: this.calculateCashOnCashReturn(cashFlow, totalInvestment),
      irr: irr,
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
    const { purchasePrice, propertyTaxRate, insuranceRate, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;
    
    // Calculate monthly expenses
    const propertyTax = (purchasePrice * (propertyTaxRate / 100)) / 12;
    const insurance = (purchasePrice * (insuranceRate / 100)) / 12;
    const propertyManagement = (grossIncome * (propertyManagementRate / 100)) / 12;
    const vacancy = (grossIncome * (this.assumptions.vacancyRate / 100)) / 12;
    const maintenance = ((maintenanceCostPerUnit || 100) * totalUnits);
    
    // Common area utilities
    let utilities = 0;
    let commonAreaElectricity = 0;
    let waterSewer = 0;
    let garbage = 0;
    
    if (this.data.commonAreaUtilities) {
      commonAreaElectricity = this.data.commonAreaUtilities.electric || 0;
      waterSewer = this.data.commonAreaUtilities.water || 0;
      utilities = this.data.commonAreaUtilities.gas || 0;
      garbage = this.data.commonAreaUtilities.trash || 0;
    }
    
    // CapEx - default to 5% of monthly gross income
    const capEx = (grossIncome / 12) * 0.05;
    
    return {
      propertyTax,
      insurance,
      maintenance,
      propertyManagement,
      vacancy,
      utilities,
      commonAreaElectricity,
      landscaping: 0,
      waterSewer,
      garbage,
      marketingAndAdvertising: 0,
      repairsAndMaintenance: maintenance,
      capEx,
      other: 0
    };
  }

  private calculateCommonAreaExpenseRatio(): number {
    if (!this.data.commonAreaUtilities || !this.data.totalSqft) return 0;
    
    const commonAreaExpenses = 
      (this.data.commonAreaUtilities.electric || 0) +
      (this.data.commonAreaUtilities.water || 0) +
      (this.data.commonAreaUtilities.gas || 0) +
      (this.data.commonAreaUtilities.trash || 0);
      
    return this.data.totalSqft > 0 ? (commonAreaExpenses / this.data.totalSqft) * 100 : 0;
  }

  private calculateUnitMixEfficiency(): number {
    const totalRentPotential = this.data.unitTypes.reduce((total, unit) => {
      return total + (unit.monthlyRent * unit.count * 12);
    }, 0);
    
    return this.data.totalSqft > 0 ? (totalRentPotential / this.data.totalSqft) * 100 : 0;
  }

  private calculateEconomicVacancyRate(grossIncome: number): number {
    const potentialIncome = this.data.unitTypes.reduce((total, unit) => {
      return total + (unit.monthlyRent * unit.count * 12);
    }, 0);
    
    return potentialIncome > 0 ? ((potentialIncome - grossIncome) / potentialIncome) * 100 : 0;
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