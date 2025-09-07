import { SFRData } from '../types/propertyTypes';
import { FinancialCalculations } from '../utils/financialCalculations';

// Precision utilities for clean calculations
const roundCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const roundPercent = (value: number, decimals: number = 2): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

interface QuickMetrics {
  monthlyAnalysis: {
    income: { gross: number; effective: number };
    expenses: { 
      operating: number; 
      debt: number; 
      total: number;
      breakdown: any;
    };
    cashFlow: number;
  };
  keyMetrics: {
    noi: number;
    capRate: number;
    cashOnCashReturn: number;
    dscr: number;
    totalInvestment: number;
    debtYield: number;
    grossYield: number;
    operatingExpenseRatio: number;
  };
  calculationTime: number;
}

/**
 * Lightning-fast financial calculations without AI or external APIs
 * Target: <50ms response time
 * 
 * Used for real-time parameter updates in Interactive Analysis
 * Decoupled from AI analysis for optimal performance
 */
export class QuickCalculationService {
  static calculateMetrics(propertyData: SFRData): QuickMetrics {
    const startTime = Date.now();
    
    // Extract data
    const {
      purchasePrice,
      downPayment,
      interestRate,
      loanTerm = 30,
      monthlyRent,
      propertyTaxRate = 1.2,
      insuranceRate = 0.5,
      maintenanceCost = 0,
      propertyManagementRate = 0,
      closingCosts = 0,
      capitalInvestments = 0
    } = propertyData;

    const vacancyRate = propertyData.longTermAssumptions?.vacancyRate || 5;
    
    // Calculate loan details
    const loanAmount = purchasePrice - downPayment;
    const monthlyPayment = FinancialCalculations.calculateMortgage(loanAmount, interestRate, loanTerm);
    
    // Monthly income (with precision)
    const grossMonthlyIncome = roundCurrency(monthlyRent);
    const vacancyLoss = roundCurrency((grossMonthlyIncome * vacancyRate) / 100);
    const effectiveMonthlyIncome = roundCurrency(grossMonthlyIncome - vacancyLoss);
    
    // Monthly expenses (with precision)
    const monthlyPropertyTax = roundCurrency((purchasePrice * propertyTaxRate / 100) / 12);
    const monthlyInsurance = roundCurrency((purchasePrice * insuranceRate / 100) / 12);
    const monthlyMaintenance = roundCurrency(maintenanceCost / 12);
    const monthlyManagement = roundCurrency((grossMonthlyIncome * propertyManagementRate) / 100);
    
    const totalOperatingExpenses = roundCurrency(
      monthlyPropertyTax + 
      monthlyInsurance + 
      monthlyMaintenance + 
      monthlyManagement + 
      vacancyLoss
    );
    
    const totalExpenses = roundCurrency(totalOperatingExpenses + monthlyPayment);
    const monthlyCashFlow = roundCurrency(effectiveMonthlyIncome - totalExpenses);
    
    // Annual calculations (with precision)
    const annualNOI = roundCurrency((effectiveMonthlyIncome - totalOperatingExpenses) * 12);
    const annualDebtService = roundCurrency(monthlyPayment * 12);
    const annualCashFlow = roundCurrency(monthlyCashFlow * 12);
    
    // Key metrics (consistent percentage format with FinancialCalculations.ts)
    const totalInvestment = roundCurrency(downPayment + (closingCosts || 0) + (capitalInvestments || 0));
    const capRate = purchasePrice > 0 ? roundPercent((annualNOI / purchasePrice) * 100) : 0;
    const cashOnCashReturn = totalInvestment > 0 ? roundPercent((annualCashFlow / totalInvestment) * 100) : 0;
    const dscr = annualDebtService > 0 ? Math.round((annualNOI / annualDebtService) * 100) / 100 : 0; // DSCR is a ratio (e.g., 1.25), not percentage
    
    // New metrics for enhanced calculation accuracy (all as percentages with precision)
    const debtYield = loanAmount > 0 ? roundPercent((annualNOI / loanAmount) * 100) : 0;
    const grossYield = purchasePrice > 0 ? roundPercent(((monthlyRent * 12) / purchasePrice) * 100) : 0;
    const operatingExpenseRatio = effectiveMonthlyIncome > 0 ? roundPercent((totalOperatingExpenses / effectiveMonthlyIncome) * 100) : 0;
    
    return {
      monthlyAnalysis: {
        income: {
          gross: grossMonthlyIncome,
          effective: effectiveMonthlyIncome
        },
        expenses: {
          operating: totalOperatingExpenses,
          debt: monthlyPayment,
          total: totalExpenses,
          breakdown: {
            propertyTax: monthlyPropertyTax,
            insurance: monthlyInsurance,
            maintenance: monthlyMaintenance,
            propertyManagement: monthlyManagement,
            vacancy: vacancyLoss,
            utilities: 0,
            commonAreaElectricity: 0,
            landscaping: 0,
            waterSewer: 0,
            garbage: 0,
            marketingAndAdvertising: 0,
            repairsAndMaintenance: 0,
            capEx: 0
          }
        },
        cashFlow: monthlyCashFlow
      },
      keyMetrics: {
        noi: annualNOI,
        capRate,
        cashOnCashReturn,
        dscr,
        totalInvestment,
        debtYield,
        grossYield,
        operatingExpenseRatio
      },
      calculationTime: Date.now() - startTime
    };
  }
}