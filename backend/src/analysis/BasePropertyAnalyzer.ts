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
  turnoverFrequency?: number; // Average tenant stay in years (default: 2)
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

    console.log('\n\n========== PROJECTIONS CALCULATION ==========');
    console.log('Initial Values:', {
      purchasePrice: this.data.purchasePrice,
      downPayment: this.data.downPayment,
      closingCosts: this.data.closingCosts || 0,
      capitalInvestments: this.data.capitalInvestments || 0,
      propertyTaxRate: this.data.propertyTaxRate,
      insuranceRate: this.data.insuranceRate,
      maintenanceCost: this.data.maintenanceCost,
      propertyManagementRate: this.data.propertyManagementRate
    });
    
    console.log('Assumptions:', {
      projectionYears: this.assumptions.projectionYears,
      annualRentIncrease: this.assumptions.annualRentIncrease,
      annualExpenseIncrease: this.assumptions.annualExpenseIncrease,
      annualPropertyValueIncrease: this.assumptions.annualPropertyValueIncrease,
      vacancyRate: this.assumptions.vacancyRate,
      turnoverFrequency: this.assumptions.turnoverFrequency || 2,
      sellingCosts: this.assumptions.sellingCosts
    });
    
    console.log('Mortgage Details:', {
      monthlyMortgage,
      annualDebtService,
      interestRate: this.data.interestRate,
      loanTerm: this.data.loanTerm,
      initialLoanBalance: currentLoanBalance
    });
    
    const basePropertyTaxForYear1 = this.data.purchasePrice * (this.data.propertyTaxRate / 100);
    const baseInsuranceForYear1 = this.data.purchasePrice * (this.data.insuranceRate / 100);
    
    console.log('Base expenses (Year 1):', {
      basePropertyTaxForYear1,
      baseInsuranceForYear1,
      maintenanceCost: this.data.maintenanceCost
    });

    // Log tenant turnover parameters
    const prepFees = this.data.tenantTurnoverFees?.prepFees || 500;
    const realtorCommission = this.data.tenantTurnoverFees?.realtorCommission || 0.5;
    const turnoverFrequency = this.assumptions.turnoverFrequency || 2;
    const baseTurnoverRate = 1 / turnoverFrequency;
    
    console.log('Tenant Turnover Parameters:', {
      prepFees,
      realtorCommission,
      turnoverFrequency,
      baseTurnoverRate
    });

    for (let year = 1; year <= this.assumptions.projectionYears; year++) {
      console.log(`\n--- YEAR ${year} CALCULATION ---`);
      
      const grossIncome = this.calculateGrossIncome(year);
      console.log(`Year ${year} Gross Income:`, grossIncome);
      
      const expenseInflationFactor = Math.pow(1 + this.assumptions.annualExpenseIncrease / 100, year - 1);
      console.log(`Year ${year} Expense Inflation Factor:`, expenseInflationFactor);
      
      const propertyTax = basePropertyTaxForYear1 * expenseInflationFactor;
      const insurance = baseInsuranceForYear1 * expenseInflationFactor;
      const maintenance = this.data.maintenanceCost * expenseInflationFactor;
      
      console.log(`Year ${year} Basic Expenses:`, {
        propertyTax,
        insurance,
        maintenance
      });
      
      const propertyManagement = grossIncome * (this.data.propertyManagementRate / 100);
      const vacancy = grossIncome * (this.assumptions.vacancyRate / 100);
      
      console.log(`Year ${year} Income-Based Expenses:`, {
        propertyManagement,
        vacancy
      });
      
      // Calculate tenant turnover costs
      const monthlyRentForYear = grossIncome / 12;
      const inflatedPrepFees = prepFees * expenseInflationFactor;
      
      // Adjust based on vacancy rate: higher vacancy = higher turnover
      const vacancyAdjustment = this.assumptions.vacancyRate / 5;
      const turnoverRate = Math.min(0.9, baseTurnoverRate * vacancyAdjustment); // Cap at 90%
      
      // Calculate total turnover costs for the year
      const turnoverCosts = (inflatedPrepFees + (monthlyRentForYear * realtorCommission)) * turnoverRate;
      
      console.log(`Year ${year} Turnover Calculation:`, {
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
      
      console.log(`Year ${year} Capital Improvements:`, capitalImprovements);
      
      const operatingExpenses = propertyTax + insurance + maintenance + propertyManagement + vacancy + turnoverCosts;
      
      const noi = this.calculateNOI(grossIncome, operatingExpenses);
      const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService) - capitalImprovements;

      console.log(`Year ${year} Cash Flow Calculation:`, {
        grossIncome,
        operatingExpenses,
        noi,
        annualDebtService,
        capitalImprovements,
        cashFlow,
        formula: `${noi} - ${annualDebtService} - ${capitalImprovements} = ${cashFlow}`
      });

      currentPropertyValue *= (1 + this.assumptions.annualPropertyValueIncrease / 100);

      const interestPaid = currentLoanBalance * (this.data.interestRate / 100);
      const principalPaid = annualDebtService - interestPaid;
      currentLoanBalance = Math.max(0, currentLoanBalance - principalPaid);

      const realtorBrokerageFee = grossIncome * 0.0833;
      const appreciation = currentPropertyValue - this.data.purchasePrice;

      console.log(`Year ${year} Property Value & Mortgage:`, {
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
        vacancy,
        realtorBrokerageFee,
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

    console.log('Exit Analysis Calculation:', {
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
    const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
    const noi = this.calculateNOI(grossIncome, operatingExpenses);
    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);

    // Calculate total investment including capital investments
    const totalInvestment = this.data.downPayment + 
                           (this.data.closingCosts || 0) + 
                           (this.data.capitalInvestments || 0);

    const projections = this.calculateProjections();
    const exitAnalysis = this.calculateExitAnalysis(projections);
    const propertyMetrics = this.calculatePropertySpecificMetrics();

    console.log('==== BASE ANALYZER CALCULATIONS ====');
    console.log('Monthly Mortgage:', monthlyMortgage);
    console.log('Annual Debt Service:', annualDebtService);
    console.log('Gross Income (Annual):', grossIncome);
    console.log('Monthly Gross Income:', grossIncome / 12);
    console.log('Operating Expenses (Annual):', operatingExpenses);
    console.log('NOI:', noi);
    console.log('Cash Flow (Annual):', cashFlow);
    console.log('Cash Flow (Monthly):', cashFlow / 12);
    console.log('Total Investment:', totalInvestment, {
      downPayment: this.data.downPayment,
      closingCosts: this.data.closingCosts || 0,
      capitalInvestments: this.data.capitalInvestments || 0
    });
    console.log('Property Metrics:', propertyMetrics);
    console.log('Projections Count:', projections.length);
    console.log('Exit Analysis:', exitAnalysis);
    console.log('===================================');

    // Calculate total cash flow from projections
    const totalCashFlow = projections.reduce((sum, p) => sum + p.cashFlow, 0);
    
    // Calculate total appreciation (final property value - purchase price)
    const totalAppreciation = projections[projections.length - 1]?.propertyValue - this.data.purchasePrice;
    
    // Calculate total return (cash flow + net proceeds from sale - total investment)
    const totalReturn = totalCashFlow + exitAnalysis.netProceedsFromSale - totalInvestment;

    console.log('==== RETURNS CALCULATION ====');
    console.log('Total Cash Flow:', totalCashFlow);
    console.log('Total Appreciation:', totalAppreciation);
    console.log('Net Proceeds from Sale:', exitAnalysis.netProceedsFromSale);
    console.log('Total Return:', totalReturn);
    console.log('============================');

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
        projections: projections,
        exitAnalysis: exitAnalysis,
        returns: {
          irr: propertyMetrics.irr || 0,
          totalCashFlow: totalCashFlow,
          totalAppreciation: totalAppreciation,
          totalReturn: totalReturn
        },
        projectionYears: this.assumptions.projectionYears
      }
    };

    console.log('==== FINAL ANALYSIS RESULT STRUCTURE ====');
    console.log('Monthly Analysis Keys:', Object.keys(result.monthlyAnalysis));
    console.log('Monthly Income:', result.monthlyAnalysis.income);
    console.log('Monthly Expenses:', result.monthlyAnalysis.expenses);
    console.log('Monthly Cash Flow:', result.monthlyAnalysis.cashFlow);
    console.log('Annual Analysis Keys:', Object.keys(result.annualAnalysis));
    console.log('Metrics Keys:', Object.keys(result.keyMetrics));
    console.log('Long Term Returns:', result.longTermAnalysis.returns);
    console.log('========================================');

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
      vacancy: grossIncome * (this.assumptions.vacancyRate / 100) / 12,
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