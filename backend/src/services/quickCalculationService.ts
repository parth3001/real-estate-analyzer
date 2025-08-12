import { SFRData } from '../types/propertyTypes';
import { FinancialCalculations } from '../utils/financialCalculations';

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
    
    // Monthly income
    const grossMonthlyIncome = monthlyRent;
    const vacancyLoss = (grossMonthlyIncome * vacancyRate) / 100;
    const effectiveMonthlyIncome = grossMonthlyIncome - vacancyLoss;
    
    // Monthly expenses
    const monthlyPropertyTax = (purchasePrice * propertyTaxRate / 100) / 12;
    const monthlyInsurance = (purchasePrice * insuranceRate / 100) / 12;
    const monthlyMaintenance = maintenanceCost / 12;
    const monthlyManagement = (grossMonthlyIncome * propertyManagementRate) / 100;
    
    const totalOperatingExpenses = 
      monthlyPropertyTax + 
      monthlyInsurance + 
      monthlyMaintenance + 
      monthlyManagement + 
      vacancyLoss;
    
    const totalExpenses = totalOperatingExpenses + monthlyPayment;
    const monthlyCashFlow = effectiveMonthlyIncome - totalExpenses;
    
    // Annual calculations
    const annualNOI = (effectiveMonthlyIncome - totalOperatingExpenses) * 12;
    const annualDebtService = monthlyPayment * 12;
    const annualCashFlow = monthlyCashFlow * 12;
    
    // Key metrics
    const totalInvestment = downPayment + (closingCosts || 0) + (capitalInvestments || 0);
    const capRate = purchasePrice > 0 ? (annualNOI / purchasePrice) : 0;
    const cashOnCashReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) : 0;
    const dscr = annualDebtService > 0 ? annualNOI / annualDebtService : Infinity;
    
    // New metrics for enhanced calculation accuracy
    const debtYield = loanAmount > 0 ? (annualNOI / loanAmount) : 0;
    const grossYield = purchasePrice > 0 ? ((monthlyRent * 12) / purchasePrice) : 0;
    const operatingExpenseRatio = effectiveMonthlyIncome > 0 ? (totalOperatingExpenses / effectiveMonthlyIncome) : 0;
    
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