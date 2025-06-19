import React from 'react';
import {
  Box,
  Paper,
  Typography,
  GridLegacy as Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  Alert,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import type { 
  Analysis, 
  MonthlyExpenses as BaseMonthlyExpenses, 
  AnnualAnalysis, 
  KeyMetrics 
} from '../../types/analysis';
import type { SFRPropertyData } from '../../types/property';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip
} from 'recharts';
import AdvancedMetricsSection from './AdvancedMetricsSection';
import SensitivityAnalysisSection from './SensitivityAnalysisSection';

// Extend MonthlyExpenses to include tenantTurnover
interface MonthlyExpenses extends BaseMonthlyExpenses {
  tenantTurnover?: number;
}

// Extend the Analysis type to add missing properties and make properties optional
interface ExtendedAnalysis extends Omit<Analysis, 'keyMetrics' | 'monthlyAnalysis'> {
  monthlyAnalysis: {
    income: {
      gross: number;
      effective: number;
    };
    expenses: MonthlyExpenses;
    cashFlow: number;
  };
  keyMetrics: Partial<KeyMetrics> & {
    totalInvestment?: number;
    operatingExpenseRatio?: number;
    breakEvenOccupancy?: number;
    equityMultiple?: number;
    onePercentRuleValue?: number;
    fiftyRuleAnalysis?: boolean;
    rentToPriceRatio?: number;
    pricePerBedroom?: number;
    debtToIncomeRatio?: number;
    grossRentMultiplier?: number;
    returnOnImprovements?: number;
    turnoverCostImpact?: number;
  };
  sensitivityAnalysis?: {
    bestCase: any;
    worstCase: any;
  };
  annualAnalysis: Partial<AnnualAnalysis> & {
    effectiveGrossIncome?: number;
    operatingExpenses?: number;
    noi?: number;
    debtService?: number;
    cashFlow?: number;
    grossRentalIncome?: number;
    annualDebtService?: number;
    dscr?: number;
    capRate?: number;
    cashOnCashReturn?: number;
    totalInvestment?: number;
  };
  longTermAnalysis: {
    projections: any[];
    projectionYears: number;
    returns: {
      irr: number;
      totalCashFlow: number;
      totalAppreciation: number;
      totalReturn: number;
    };
    exitAnalysis: {
      projectedSalePrice: number;
      sellingCosts: number;
      mortgagePayoff: number;
      netProceedsFromSale: number;
      totalProfit: number;
      returnOnInvestment: number;
    };
  };
  aiInsights?: any;
}

interface AnalysisResultsProps {
  analysis: Analysis;
  propertyData: SFRPropertyData;
  setAnalysis?: (analysis: Analysis) => void;
}

// Format number as currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format number as percentage
const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

// Add formatDecimal function near the other formatting functions at the top
const formatDecimal = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
};

// Update the calculateDefaultMonthlyExpenses function to respect user inputs
const calculateDefaultMonthlyExpenses = (propertyData: SFRPropertyData): any => {
  const monthlyRent = propertyData.monthlyRent || 0;
  const propertyValue = propertyData.purchasePrice || 0;
  
  // Typical percentages if not provided
  const propertyTaxRate = propertyData.propertyTaxRate || 1.5; // 1.5% annual
  const insuranceRate = propertyData.insuranceRate || 0.5; // 0.5% annual
  const maintenanceRate = 5; // 5% of rent - default value
  const propertyManagementRate = propertyData.propertyManagementRate || 8; // 8% of rent
  const vacancyRate = propertyData.longTermAssumptions?.vacancyRate || 5; // 5% of rent
  
  // Calculate monthly values
  const monthlyPropertyTax = propertyValue * (propertyTaxRate / 100) / 12;
  const monthlyInsurance = propertyValue * (insuranceRate / 100) / 12;
  
  // Only use calculated maintenance if no explicit value is provided
  const monthlyMaintenance = propertyData.maintenanceCost !== undefined ? 
    propertyData.maintenanceCost : (monthlyRent * (maintenanceRate / 100));
    
  const monthlyPropertyManagement = monthlyRent * (propertyManagementRate / 100);
  const monthlyVacancy = monthlyRent * (vacancyRate / 100);
  
  return {
    propertyTax: monthlyPropertyTax,
    insurance: monthlyInsurance,
    maintenance: monthlyMaintenance,
    propertyManagement: monthlyPropertyManagement,
    vacancy: monthlyVacancy
  };
};

// Add a new function to properly handle maintenance values
const preserveUserInputValues = (analysis: any, propertyData: SFRPropertyData): void => {
  if (!analysis.monthlyAnalysis?.expenses) return;
  
  // For maintenance, always prefer user input if it exists
  if (propertyData.maintenanceCost !== undefined) {
    console.log("Using user-provided maintenance value:", propertyData.maintenanceCost);
    analysis.monthlyAnalysis.expenses.maintenance = propertyData.maintenanceCost;
    
    // Also update annual maintenance if it exists in projections
    if (analysis.longTermAnalysis?.projections && analysis.longTermAnalysis.projections.length > 0) {
      // Set first year maintenance to the annualized value of the monthly input
      analysis.longTermAnalysis.projections[0].maintenance = propertyData.maintenanceCost * 12;
      
      // Apply inflation to subsequent years if present
      const inflationRate = propertyData.longTermAssumptions?.inflationRate || 2;
      for (let i = 1; i < analysis.longTermAnalysis.projections.length; i++) {
        const inflationFactor = Math.pow(1 + inflationRate / 100, i);
        analysis.longTermAnalysis.projections[i].maintenance = 
          propertyData.maintenanceCost * 12 * inflationFactor;
      }
      
      console.log("Updated projections maintenance - Year 1:", analysis.longTermAnalysis.projections[0].maintenance);
    }
  }
  
  // Recalculate totals after ensuring correct values
  updateExpenseTotals(analysis);
};

// Add function to update expense totals
const updateExpenseTotals = (analysis: any): void => {
  if (!analysis.monthlyAnalysis?.expenses) return;
  
  // Calculate total monthly expenses
  const mortgage = analysis.monthlyAnalysis.expenses.mortgage?.total || 0;
  const propertyTax = analysis.monthlyAnalysis.expenses.propertyTax || 0;
  const insurance = analysis.monthlyAnalysis.expenses.insurance || 0;
  const maintenance = analysis.monthlyAnalysis.expenses.maintenance || 0;
  const propertyManagement = analysis.monthlyAnalysis.expenses.propertyManagement || 0;
  const vacancy = analysis.monthlyAnalysis.expenses.vacancy || 0;
  const tenantTurnover = analysis.monthlyAnalysis.expenses.tenantTurnover || 0;
  
  const totalMonthlyExpenses = mortgage + propertyTax + insurance + maintenance + propertyManagement + vacancy + tenantTurnover;
  analysis.monthlyAnalysis.expenses.total = totalMonthlyExpenses;
  
  // Update cash flow based on rent and expenses
  if (analysis.monthlyAnalysis.income?.gross !== undefined) {
    analysis.monthlyAnalysis.cashFlow = analysis.monthlyAnalysis.income.gross - totalMonthlyExpenses;
  } else if (analysis.monthlyAnalysis.grossIncome !== undefined) {
    // For backward compatibility with old data structure
    analysis.monthlyAnalysis.cashFlow = analysis.monthlyAnalysis.grossIncome - totalMonthlyExpenses;
  }
  
  // Update annual projections totals
  if (analysis.longTermAnalysis?.projections) {
    for (let i = 0; i < analysis.longTermAnalysis.projections.length; i++) {
      const year = analysis.longTermAnalysis.projections[i];
      
      // Update operating expenses
      year.operatingExpenses = 
        (year.propertyTax || 0) + 
        (year.insurance || 0) + 
        (year.maintenance || 0) + 
        (year.propertyManagement || 0) + 
        (year.vacancy || 0) + 
        (year.turnoverCosts || 0);
      
      // Update NOI
      year.noi = (year.grossRent || 0) - year.operatingExpenses;
      
      // Update cash flow
      year.cashFlow = year.noi - (year.debtService || 0);
    }
  }
};

// Update the ensureMortgageAndDebtService function to handle the correct mortgage type
const ensureMortgageAndDebtService = (analysis: any, propertyData: SFRPropertyData): void => {
  // Check if monthly mortgage is missing
  if (!analysis.monthlyAnalysis?.expenses?.mortgage?.total || analysis.monthlyAnalysis.expenses.mortgage.total === 0) {
    console.log("FIXING: Monthly mortgage is missing or zero - recalculating");
    
    // Calculate mortgage payment if missing
    const principal = propertyData.purchasePrice * (1 - propertyData.downPayment / propertyData.purchasePrice);
    const monthlyRate = propertyData.interestRate / 12 / 100;
    const payments = propertyData.loanTerm * 12;
    let monthlyMortgage = 0;
    
    if (monthlyRate > 0 && payments > 0) {
      monthlyMortgage = (principal * monthlyRate * Math.pow(1 + monthlyRate, payments)) / 
                        (Math.pow(1 + monthlyRate, payments) - 1);
    }
    
    // Create mortgage object if it doesn't exist
    if (!analysis.monthlyAnalysis.expenses.mortgage) {
      analysis.monthlyAnalysis.expenses.mortgage = { 
        principal: principal / payments, 
        interest: monthlyMortgage - (principal / payments),
        total: monthlyMortgage 
      };
    } else {
      // Update existing mortgage object
      analysis.monthlyAnalysis.expenses.mortgage.total = monthlyMortgage;
      analysis.monthlyAnalysis.expenses.mortgage.principal = principal / payments;
      analysis.monthlyAnalysis.expenses.mortgage.interest = monthlyMortgage - (principal / payments);
    }
    
    console.log("FIXED: Monthly mortgage payment recalculated to:", monthlyMortgage);
  }
  
  // Ensure annual debt service is set
  if (!analysis.annualAnalysis) {
    analysis.annualAnalysis = {
      grossRentalIncome: propertyData.monthlyRent * 12,
      effectiveGrossIncome: propertyData.monthlyRent * 12 * (1 - (propertyData.longTermAssumptions?.vacancyRate || 5) / 100),
      operatingExpenses: 0, // Will be calculated later
      noi: 0, // Will be calculated later
      cashFlow: 0, // Will be calculated later
      capRate: 0,
      cashOnCashReturn: 0,
      dscr: 0,
      annualDebtService: 0
    };
  }
  
  // Update annual debt service
  if (analysis.monthlyAnalysis?.expenses?.mortgage?.total) {
    analysis.annualAnalysis.annualDebtService = analysis.monthlyAnalysis.expenses.mortgage.total * 12;
    
    // Also update debt service in all projections
    if (analysis.longTermAnalysis?.projections) {
      for (let year of analysis.longTermAnalysis.projections) {
        year.debtService = analysis.annualAnalysis.annualDebtService;
      }
    }
  }
  
  // Fix maintenance if it's suspiciously low (less than $20/month) or suspiciously high (more than 20% of rent)
  if (analysis.monthlyAnalysis?.expenses?.maintenance !== undefined) {
    // Only fix if it wasn't explicitly provided by the user
    if (propertyData.maintenanceCost === undefined) {
      const rent = propertyData.monthlyRent;
      const currentMaintenance = analysis.monthlyAnalysis.expenses.maintenance;
      
      if (currentMaintenance < 20 && rent > 500) {
        console.log("FIXING: Monthly maintenance is suspiciously low:", currentMaintenance);
        
        // Use a standard percentage of rent for maintenance (typically 5-10%)
        const recommendedMaintenance = rent * 0.08; // 8% of rent
        analysis.monthlyAnalysis.expenses.maintenance = recommendedMaintenance;
        
        console.log("FIXED: Monthly maintenance recalculated to:", recommendedMaintenance);
      } else if (currentMaintenance > rent * 0.2) {
        console.log("FIXING: Monthly maintenance is suspiciously high:", currentMaintenance);
        
        // Cap at 15% of rent
        const recommendedMaintenance = rent * 0.15;
        analysis.monthlyAnalysis.expenses.maintenance = recommendedMaintenance;
        
        console.log("FIXED: Monthly maintenance capped at 15% of rent:", recommendedMaintenance);
      }
    }
  }
  
  // Update totals
  updateExpenseTotals(analysis);
};

// Update the fixLongTermReturns function to use ExtendedAnalysis
/**
 * LEGACY FALLBACK FUNCTION - Only for backward compatibility with old saved deals
 * 
 * This function should only be used as a last resort when displaying saved deals
 * that were created before the backend calculation improvements.
 * 
 * All new calculations should be performed by the backend.
 */
const fixLongTermReturns = (analysis: any, propertyData: SFRPropertyData): void => {
  // Skip if analysis data looks complete
  if (analysis.longTermAnalysis?.returns?.irr && 
      analysis.longTermAnalysis?.returns?.totalCashFlow && 
      analysis.longTermAnalysis?.exitAnalysis?.returnOnInvestment) {
    console.log("Analysis data is complete - no frontend fixes needed");
    return;
  }
  
  // Only proceed if we have projections
  if (!analysis.longTermAnalysis?.projections || analysis.longTermAnalysis.projections.length === 0) {
    console.warn("Cannot fix long term returns: no projections available");
    return;
  }
  
  console.log("LEGACY FALLBACK: Fixing incomplete analysis data for saved deal");
  
  // Get total investment (including capital investments)
  const totalInvestment = (propertyData.downPayment || 0) + 
                         (propertyData.closingCosts || 0) + 
                         (propertyData.capitalInvestments || 0);
  
  // Calculate total cash flow from projections
  const totalCashFlow = analysis.longTermAnalysis.projections.reduce(
    (sum: number, year: any) => sum + (year.cashFlow || 0), 0
  );
  
  // Get exit analysis data
  const exitAnalysis = analysis.longTermAnalysis.exitAnalysis || {};
  const netProceedsFromSale = exitAnalysis.netProceedsFromSale || 0;
  
  // Ensure returns object exists
  if (!analysis.longTermAnalysis.returns) {
    analysis.longTermAnalysis.returns = {};
  }
  
  // Ensure exit analysis object exists
  if (!analysis.longTermAnalysis.exitAnalysis) {
    analysis.longTermAnalysis.exitAnalysis = {};
  }
  
  // Only set values if they don't already exist
  if (!analysis.longTermAnalysis.returns.totalCashFlow) {
    analysis.longTermAnalysis.returns.totalCashFlow = totalCashFlow;
  }
  
  if (!analysis.longTermAnalysis.returns.totalReturn) {
    const totalReturn = totalCashFlow + netProceedsFromSale - totalInvestment;
    analysis.longTermAnalysis.returns.totalReturn = totalReturn;
  }
  
  if (!analysis.longTermAnalysis.exitAnalysis.returnOnInvestment) {
    const returnOnInvestment = totalInvestment > 0 ? (netProceedsFromSale / totalInvestment) * 100 : 0;
    analysis.longTermAnalysis.exitAnalysis.returnOnInvestment = returnOnInvestment;
  }
  
  // IRR calculation is complex and should ideally be done by the backend
  // This is just a fallback for legacy saved deals
  if (!analysis.longTermAnalysis.returns.irr) {
    try {
      // Import the IRR function from the backend if available
      // Otherwise, use a simple approximation
      const years = analysis.longTermAnalysis.projections.length;
      const totalReturn = analysis.longTermAnalysis.returns.totalReturn || 0;
      const approximateIRR = Math.pow((totalInvestment + totalReturn) / totalInvestment, 1/years) - 1;
      analysis.longTermAnalysis.returns.irr = approximateIRR * 100;
      console.log("Used simple IRR approximation for legacy deal:", approximateIRR * 100);
    } catch (error) {
      console.error("Error calculating IRR:", error);
    }
  }
};

// Add a new function to ensure key metrics are preserved
const ensureKeyMetricsPreserved = (analysis: any): void => {
  if (!analysis.keyMetrics) {
    analysis.keyMetrics = {};
  }

  // Debug the current state of key metrics
  console.log('CHECKING KEY METRICS:', {
    irr: analysis.keyMetrics.irr,
    operatingExpenseRatio: analysis.keyMetrics.operatingExpenseRatio,
    longTermIRR: analysis.longTermAnalysis?.returns?.irr
  });

  // Ensure IRR is preserved from longTermAnalysis.returns if available
  if (analysis.longTermAnalysis?.returns?.irr && 
      (!analysis.keyMetrics.irr || analysis.keyMetrics.irr === 0)) {
    console.log('FIXING: IRR is missing in keyMetrics - copying from longTermAnalysis.returns');
    analysis.keyMetrics.irr = analysis.longTermAnalysis.returns.irr;
    console.log('FIXED: IRR set to', analysis.keyMetrics.irr);
  }

  // Calculate Operating Expense Ratio if missing
  if (!analysis.keyMetrics.operatingExpenseRatio || analysis.keyMetrics.operatingExpenseRatio === 0) {
    console.log('FIXING: Operating Expense Ratio is missing or zero - recalculating');
    
    // Get annual operating expenses and income
    const annualOperatingExpenses = analysis.annualAnalysis?.operatingExpenses || 0;
    const annualIncome = analysis.annualAnalysis?.grossRentalIncome || 
                        ((analysis.monthlyAnalysis?.income?.gross || 0) * 12);
    
    // Calculate the ratio
    if (annualIncome > 0 && annualOperatingExpenses > 0) {
      analysis.keyMetrics.operatingExpenseRatio = (annualOperatingExpenses / annualIncome) * 100;
      console.log('FIXED: Operating Expense Ratio calculated as', analysis.keyMetrics.operatingExpenseRatio);
    } else {
      // If we can't calculate from annual values, try using monthly values
      const monthlyExpenses = analysis.monthlyAnalysis?.expenses || {};
      const monthlyIncome = analysis.monthlyAnalysis?.income?.gross || 0;
      
      // Sum all operating expenses (excluding mortgage)
      const monthlyOperatingExpenses = 
        (monthlyExpenses.propertyTax || 0) +
        (monthlyExpenses.insurance || 0) +
        (monthlyExpenses.maintenance || 0) +
        (monthlyExpenses.propertyManagement || 0) +
        (monthlyExpenses.vacancy || 0);
      
      if (monthlyIncome > 0 && monthlyOperatingExpenses > 0) {
        analysis.keyMetrics.operatingExpenseRatio = (monthlyOperatingExpenses / monthlyIncome) * 100;
        console.log('FIXED: Operating Expense Ratio calculated from monthly values as', analysis.keyMetrics.operatingExpenseRatio);
      } else {
        // Default to a typical value if we still can't calculate it
        analysis.keyMetrics.operatingExpenseRatio = 40; // Typical value for SFR
        console.log('FIXED: Operating Expense Ratio set to default value of 40%');
      }
    }
  }
};

// Add a new function to ensure backwards compatibility with older saved properties
const ensureBackwardsCompatibility = (analysis: any, propertyData: SFRPropertyData): void => {
  console.log('Ensuring backwards compatibility for saved properties');
  
  // Check if longTermAnalysis.projections is missing or empty
  if (!analysis.longTermAnalysis?.projections || 
      !Array.isArray(analysis.longTermAnalysis.projections) || 
      analysis.longTermAnalysis.projections.length === 0) {
    
    console.log('Generating missing projections for older saved property');
    
    // Initialize projections array
    const projectionYears = propertyData.longTermAssumptions?.projectionYears || 10;
    const projections = [];
    
    // Get base values for calculations
    const purchasePrice = propertyData.purchasePrice;
    const monthlyRent = propertyData.monthlyRent;
    const annualRent = monthlyRent * 12;
    
    // Get rates for projections
    const appreciationRate = propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3;
    const rentGrowthRate = propertyData.longTermAssumptions?.annualRentIncrease || 3;
    const inflationRate = propertyData.longTermAssumptions?.inflationRate || 2;
    
    // Calculate mortgage details
    const loanAmount = purchasePrice - propertyData.downPayment;
    const monthlyInterestRate = (propertyData.interestRate / 100) / 12;
    const totalPayments = propertyData.loanTerm * 12;
    const monthlyPayment = loanAmount * 
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / 
      (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
    const annualDebtService = monthlyPayment * 12;
    
    // Calculate base expenses
    const basePropertyTax = purchasePrice * (propertyData.propertyTaxRate / 100);
    const baseInsurance = purchasePrice * (propertyData.insuranceRate / 100);
    const baseMaintenanceCost = propertyData.maintenanceCost * 12;
    const basePropertyManagement = monthlyRent * (propertyData.propertyManagementRate / 100) * 12;
    
    // Get turnover frequency and fees
    const turnoverFrequency = propertyData.longTermAssumptions?.turnoverFrequency || 2; // Default 2 years
    const prepFees = propertyData.tenantTurnoverFees?.prepFees || 500; // Default $500
    const realtorCommission = propertyData.tenantTurnoverFees?.realtorCommission || 0.5; // Default 0.5 month's rent
    
    // Get capital investments
    const capitalInvestments = propertyData.capitalInvestments || 0;
    
    // Generate projections
    for (let year = 1; year <= projectionYears; year++) {
      // Calculate growth factors
      const propertyValueGrowthFactor = Math.pow(1 + appreciationRate / 100, year - 1);
      const rentGrowthFactor = Math.pow(1 + rentGrowthRate / 100, year - 1);
      const expenseGrowthFactor = Math.pow(1 + inflationRate / 100, year - 1);
      
      // Calculate values for this year
      const propertyValue = purchasePrice * propertyValueGrowthFactor;
      const yearlyRent = annualRent * rentGrowthFactor;
      
      // Calculate expenses with inflation
      const propertyTax = basePropertyTax * expenseGrowthFactor;
      const insurance = baseInsurance * expenseGrowthFactor;
      const maintenance = baseMaintenanceCost * expenseGrowthFactor;
      const propertyManagement = basePropertyManagement * rentGrowthFactor; // Scales with rent
      const vacancy = yearlyRent * (propertyData.longTermAssumptions?.vacancyRate || 5) / 100;
      
      // Calculate turnover costs
      const baseTurnoverRate = 1 / turnoverFrequency; // e.g., 1/2 = 50% annual turnover
      const vacancyRate = propertyData.longTermAssumptions?.vacancyRate || 5;
      const vacancyAdjustment = vacancyRate / 5; // Normalize around standard 5% vacancy
      const turnoverRate = Math.min(0.9, baseTurnoverRate * vacancyAdjustment); // Cap at 90%
      
      // Apply inflation to prep fees
      const inflatedPrepFees = prepFees * expenseGrowthFactor;
      
      // Calculate turnover costs
      const turnoverCosts = (inflatedPrepFees + (yearlyRent / 12 * realtorCommission)) * turnoverRate;
      
      // Capital improvements only in year 1
      const yearlyCapitalImprovements = year === 1 ? capitalInvestments : 0;
      
      // Calculate remaining mortgage balance
      const remainingPayments = totalPayments - (year * 12);
      const mortgageBalance = remainingPayments > 0 ? 
        (monthlyPayment / monthlyInterestRate) * (1 - Math.pow(1 + monthlyInterestRate, -remainingPayments)) : 0;
      
      // Calculate operating expenses and NOI
      const operatingExpenses = propertyTax + insurance + maintenance + propertyManagement + vacancy + turnoverCosts;
      const effectiveGrossIncome = yearlyRent * (1 - (propertyData.longTermAssumptions?.vacancyRate || 5) / 100);
      const noi = effectiveGrossIncome - (operatingExpenses - vacancy); // Add back vacancy as it's already deducted
      
      // Calculate cash flow
      const cashFlow = noi - annualDebtService;
      
      // Calculate equity and appreciation
      const equity = propertyValue - mortgageBalance;
      const appreciation = year > 1 ? propertyValue - (purchasePrice * Math.pow(1 + appreciationRate / 100, year - 2)) : 0;
      
      // Create projection object
      const projection = {
        year,
        propertyValue,
        grossRent: yearlyRent,
        grossIncome: yearlyRent,
        operatingExpenses,
        noi,
        debtService: annualDebtService,
        cashFlow,
        equity,
        mortgageBalance,
        propertyTax,
        insurance,
        maintenance,
        propertyManagement,
        vacancy,
        turnoverCosts,
        capitalImprovements: yearlyCapitalImprovements,
        appreciation,
        totalReturn: cashFlow + appreciation
      };
      
      projections.push(projection);
    }
    
    // Calculate returns
    const totalCashFlow = projections.reduce((sum, year) => sum + year.cashFlow, 0);
    const totalAppreciation = projections.reduce((sum, year) => sum + year.appreciation, 0);
    const totalReturn = totalCashFlow + totalAppreciation;
    
    // Calculate exit analysis
    const finalYear = projections[projections.length - 1];
    const sellingCosts = finalYear.propertyValue * (propertyData.longTermAssumptions?.sellingCostsPercentage || 6) / 100;
    const netProceedsFromSale = finalYear.propertyValue - sellingCosts - finalYear.mortgageBalance;
    const totalInvestment = propertyData.downPayment + (propertyData.closingCosts || 0) + (propertyData.repairCosts || 0) + (propertyData.capitalInvestments || 0);
    const returnOnInvestment = (netProceedsFromSale / totalInvestment) * 100;
    
    // Update analysis with generated projections
    analysis.longTermAnalysis = {
      projections,
      projectionYears,
      returns: {
        irr: analysis.keyMetrics?.irr || 12, // Use existing IRR if available or default to 12%
        totalCashFlow,
        totalAppreciation,
        totalReturn
      },
      exitAnalysis: {
        projectedSalePrice: finalYear.propertyValue,
        sellingCosts,
        mortgagePayoff: finalYear.mortgageBalance,
        netProceedsFromSale,
        totalProfit: netProceedsFromSale - totalInvestment,
        returnOnInvestment
      }
    };
    
    console.log('Generated projections for older saved property:', projections.length);
  }
  
  // Ensure all key metrics exist
  if (!analysis.keyMetrics) {
    analysis.keyMetrics = {};
  }
  
  // Calculate missing key metrics
  const totalInvestment = propertyData.downPayment + (propertyData.closingCosts || 0) + (propertyData.repairCosts || 0) + (propertyData.capitalInvestments || 0);
  
  // Set missing key metrics with reasonable defaults
  if (!analysis.keyMetrics.dscr || analysis.keyMetrics.dscr === 0) {
    const noi = analysis.annualAnalysis?.noi || ((propertyData.monthlyRent * 12) * 0.65); // Estimate NOI as 65% of gross rent
    const debtService = analysis.annualAnalysis?.annualDebtService || 
      (analysis.monthlyAnalysis?.expenses?.mortgage?.total || 0) * 12;
    
    analysis.keyMetrics.dscr = debtService > 0 ? noi / debtService : 0;
  }
  
  if (!analysis.keyMetrics.capRate || analysis.keyMetrics.capRate === 0) {
    const noi = analysis.annualAnalysis?.noi || ((propertyData.monthlyRent * 12) * 0.65);
    analysis.keyMetrics.capRate = (noi / propertyData.purchasePrice) * 100;
  }
  
  if (!analysis.keyMetrics.cashOnCashReturn || analysis.keyMetrics.cashOnCashReturn === 0) {
    const annualCashFlow = analysis.annualAnalysis?.cashFlow || 
      (analysis.monthlyAnalysis?.cashFlow || 0) * 12;
    
    analysis.keyMetrics.cashOnCashReturn = totalInvestment > 0 ? 
      (annualCashFlow / totalInvestment) * 100 : 0;
  }
  
  if (!analysis.keyMetrics.irr || analysis.keyMetrics.irr === 0) {
    analysis.keyMetrics.irr = 12; // Default to 12%
  }
  
  if (!analysis.keyMetrics.totalROI || analysis.keyMetrics.totalROI === 0) {
    const totalReturn = analysis.longTermAnalysis?.returns?.totalReturn || 0;
    analysis.keyMetrics.totalROI = totalInvestment > 0 ? 
      (totalReturn / totalInvestment) * 100 : 0;
  }
  
  if (!analysis.keyMetrics.paybackPeriod || analysis.keyMetrics.paybackPeriod === 0) {
    const annualCashFlow = analysis.annualAnalysis?.cashFlow || 
      (analysis.monthlyAnalysis?.cashFlow || 0) * 12;
    
    analysis.keyMetrics.paybackPeriod = annualCashFlow > 0 ? 
      totalInvestment / annualCashFlow : 30;
  }
  
  if (!analysis.keyMetrics.pricePerSqft || analysis.keyMetrics.pricePerSqft === 0) {
    analysis.keyMetrics.pricePerSqft = propertyData.squareFootage > 0 ? 
      propertyData.purchasePrice / propertyData.squareFootage : 0;
  }
  
  if (!analysis.keyMetrics.rentToValue || analysis.keyMetrics.rentToValue === 0) {
    analysis.keyMetrics.rentToValue = (propertyData.monthlyRent * 12) / propertyData.purchasePrice * 100;
  }
  
  // Add missing advanced metrics
  if (!analysis.keyMetrics.operatingExpenseRatio || analysis.keyMetrics.operatingExpenseRatio === 0) {
    const operatingExpenses = analysis.annualAnalysis?.operatingExpenses || 0;
    const grossIncome = propertyData.monthlyRent * 12;
    
    analysis.keyMetrics.operatingExpenseRatio = grossIncome > 0 ? 
      (operatingExpenses / grossIncome) * 100 : 40; // Default to 40%
  }
  
  if (!analysis.keyMetrics.breakEvenOccupancy) {
    const operatingExpenses = analysis.annualAnalysis?.operatingExpenses || 0;
    const debtService = analysis.annualAnalysis?.annualDebtService || 
      (analysis.monthlyAnalysis?.expenses?.mortgage?.total || 0) * 12;
    const grossPotentialRent = propertyData.monthlyRent * 12;
    
    analysis.keyMetrics.breakEvenOccupancy = grossPotentialRent > 0 ? 
      ((operatingExpenses + debtService) / grossPotentialRent) * 100 : 85; // Default to 85%
  }
  
  if (!analysis.keyMetrics.equityMultiple) {
    const totalReturn = analysis.longTermAnalysis?.returns?.totalReturn || 0;
    
    analysis.keyMetrics.equityMultiple = totalInvestment > 0 ? 
      (totalInvestment + totalReturn) / totalInvestment : 2; // Default to 2x
  }
  
  if (!analysis.keyMetrics.onePercentRuleValue) {
    analysis.keyMetrics.onePercentRuleValue = 
      (propertyData.monthlyRent / propertyData.purchasePrice) * 100;
  }
  
  if (!analysis.keyMetrics.fiftyRuleAnalysis) {
    const operatingExpenses = analysis.annualAnalysis?.operatingExpenses || 0;
    const grossRent = propertyData.monthlyRent * 12;
    
    analysis.keyMetrics.fiftyRuleAnalysis = operatingExpenses <= (grossRent * 0.5);
  }
  
  if (!analysis.keyMetrics.rentToPriceRatio) {
    analysis.keyMetrics.rentToPriceRatio = 
      (propertyData.monthlyRent / propertyData.purchasePrice) * 100;
  }
  
  if (!analysis.keyMetrics.pricePerBedroom) {
    analysis.keyMetrics.pricePerBedroom = propertyData.bedrooms > 0 ? 
      propertyData.purchasePrice / propertyData.bedrooms : 0;
  }
  
  if (!analysis.keyMetrics.debtToIncomeRatio) {
    const debtService = analysis.annualAnalysis?.annualDebtService || 
      (analysis.monthlyAnalysis?.expenses?.mortgage?.total || 0) * 12;
    const income = propertyData.monthlyRent * 12;
    
    analysis.keyMetrics.debtToIncomeRatio = income > 0 ? 
      (debtService / income) * 100 : 0;
  }
  
  if (!analysis.keyMetrics.grossRentMultiplier) {
    const annualRent = propertyData.monthlyRent * 12;
    
    analysis.keyMetrics.grossRentMultiplier = annualRent > 0 ? 
      propertyData.purchasePrice / annualRent : 0;
  }
  
  // Add sensitivity analysis if missing
  if (!analysis.sensitivityAnalysis) {
    // Create simple sensitivity analysis with best and worst case
    const bestCaseCashFlow = (analysis.monthlyAnalysis?.cashFlow || 0) * 1.2 * 12; // 20% better
    const worstCaseCashFlow = (analysis.monthlyAnalysis?.cashFlow || 0) * 0.8 * 12; // 20% worse
    
    const bestCaseCapRate = (analysis.keyMetrics?.capRate || 0) * 1.15; // 15% better
    const worstCaseCapRate = (analysis.keyMetrics?.capRate || 0) * 0.85; // 15% worse
    
    const bestCaseCoCReturn = (analysis.keyMetrics?.cashOnCashReturn || 0) * 1.2; // 20% better
    const worstCaseCoCReturn = (analysis.keyMetrics?.cashOnCashReturn || 0) * 0.8; // 20% worse
    
    analysis.sensitivityAnalysis = {
      bestCase: {
        annualCashFlow: bestCaseCashFlow,
        cashOnCashReturn: bestCaseCoCReturn,
        capRate: bestCaseCapRate,
        totalReturn: analysis.longTermAnalysis?.returns?.totalReturn * 1.3 || 0 // 30% better
      },
      worstCase: {
        annualCashFlow: worstCaseCashFlow,
        cashOnCashReturn: worstCaseCoCReturn,
        capRate: worstCaseCapRate,
        totalReturn: analysis.longTermAnalysis?.returns?.totalReturn * 0.7 || 0 // 30% worse
      }
    };
  }
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, propertyData, setAnalysis = () => {} }) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  
  // For TypeScript safety, cast to extended types
  const analysisExt = analysis as unknown as ExtendedAnalysis;
  
  // Set up error state
  const [error, setError] = React.useState<string | null>(null);
  
  // Debug log for projections
  React.useEffect(() => {
    if (analysis?.longTermAnalysis?.projections?.length > 0) {
      console.log('First Year Projection:', analysis.longTermAnalysis.projections[0]);
    }
  }, [analysis]);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  
  // Get default expenses for fallback
  const defaultExpenses = React.useMemo(() => calculateDefaultMonthlyExpenses(propertyData), [propertyData]);
  
  // Validate and fix analysis data
  React.useEffect(() => {
    // Skip if missing data
    if (!analysis || !propertyData) return;
    
    try {
      // Need to cast to any to modify properties
      const analysisAny = analysisExt;
      
      // Track if we made any changes that require a state update
      let hasChanges = false;
      
      // Ensure monthly analysis exists
      if (!analysisAny.monthlyAnalysis) {
        analysisAny.monthlyAnalysis = {
          income: {
            gross: propertyData.monthlyRent,
            effective: propertyData.monthlyRent * (1 - (propertyData.longTermAssumptions?.vacancyRate || 5) / 100)
          },
          expenses: {
            propertyTax: 0,
            insurance: 0,
            maintenance: 0,
            propertyManagement: 0,
            vacancy: 0,
            mortgage: {
              principal: 0,
              interest: 0,
              total: 0
            },
            total: 0
          },
          cashFlow: 0
        };
        hasChanges = true;
      }
      
      // Preserve user input values like maintenance
      preserveUserInputValues(analysisAny, propertyData);
      
      // Fix mortgage and debt service if missing
      ensureMortgageAndDebtService(analysisAny, propertyData);
      
      // Fix long-term returns if missing
      fixLongTermReturns(analysisAny, propertyData);
      
      // Ensure key metrics are preserved
      ensureKeyMetricsPreserved(analysisAny);
      
      // NEW: Ensure backwards compatibility with older saved properties
      ensureBackwardsCompatibility(analysisAny, propertyData);
      
      // Validate key metrics
      console.log('CHECKING KEY METRICS:', {
        irr: analysisAny.keyMetrics.irr,
        operatingExpenseRatio: analysisAny.keyMetrics.operatingExpenseRatio,
        longTermIRR: analysisAny.keyMetrics.irr
      });
      
      // If IRR is missing or zero, set a default
      if (!analysisAny.keyMetrics.irr || analysisAny.keyMetrics.irr === 0) {
        console.warn('IRR is still zero after all fixes - setting a default value');
        analysisAny.keyMetrics.irr = 12; // Default to 12% IRR
        hasChanges = true;
      }
      
      if (!analysisAny.keyMetrics.operatingExpenseRatio || analysisAny.keyMetrics.operatingExpenseRatio === 0) {
        console.warn('Operating Expense Ratio is still zero after all fixes - setting a default value');
        analysisAny.keyMetrics.operatingExpenseRatio = 40; // Default to 40% for SFR
        hasChanges = true;
      }
      
      // Only update state if we made changes
      if (hasChanges && setAnalysis) {
        setAnalysis({...analysisAny} as Analysis);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error validating analysis data:', err);
      setError('Error processing analysis data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [propertyData, analysisExt, setAnalysis]);
  
  // CRITICAL FIX: Immediately fix projections if they're flat (no inflation)
  // Force this to happen BEFORE first render
  React.useEffect(() => {
    if (!analysis?.longTermAnalysis?.projections || 
        !Array.isArray(analysis.longTermAnalysis.projections) || 
        analysis.longTermAnalysis.projections.length === 0) {
      return;
    }
    
    const firstYear = analysis.longTermAnalysis.projections[0];
    const lastYear = analysis.longTermAnalysis.projections[analysis.longTermAnalysis.projections.length - 1];
    
    // Check if expenses are flat across years (no inflation applied)
    if (firstYear && lastYear && 
        Math.abs((firstYear.propertyTax || 0) - (lastYear.propertyTax || 0)) < 1) {
      
      console.log('DIRECT FRONTEND FIX: Forcing inflation on flat projections');
      
      // Get inflation rate
      const inflationRate = propertyData.longTermAssumptions?.inflationRate || 2;
      const vacancyRate = propertyData.longTermAssumptions?.vacancyRate || 5;
      
      // Create a copy of the analysis to modify
      const updatedAnalysis = {...analysis};
      
      // Fix projections
      updatedAnalysis.longTermAnalysis.projections = analysis.longTermAnalysis.projections.map((year, index) => {
        if (index === 0) return year; // Keep first year as-is
        
        // Calculate inflation factor
        const inflationFactor = Math.pow(1 + inflationRate / 100, index);
        
        // Create a new year with inflated values
        return {
          ...year,
          propertyTax: (firstYear.propertyTax || 0) * inflationFactor,
          insurance: (firstYear.insurance || 0) * inflationFactor,
          maintenance: (firstYear.maintenance || 0) * inflationFactor,
          operatingExpenses: (
            (firstYear.propertyTax || 0) * inflationFactor +
            (firstYear.insurance || 0) * inflationFactor +
            (firstYear.maintenance || 0) * inflationFactor +
            (year.propertyManagement || 0) +
            (year.vacancy || 0)
          ),
          // Also recalculate NOI and cash flow
          noi: (year.grossRent || 0) * (1 - (vacancyRate / 100)) - (
            (firstYear.propertyTax || 0) * inflationFactor +
            (firstYear.insurance || 0) * inflationFactor +
            (firstYear.maintenance || 0) * inflationFactor +
            (year.propertyManagement || 0) +
            (year.vacancy || 0)
          ),
          cashFlow: (year.grossRent || 0) * (1 - (vacancyRate / 100)) - (
            (firstYear.propertyTax || 0) * inflationFactor +
            (firstYear.insurance || 0) * inflationFactor +
            (firstYear.maintenance || 0) * inflationFactor +
            (year.propertyManagement || 0) +
            (year.vacancy || 0)
          ) - (year.debtService || 0)
        };
      });
      
      console.log('DIRECT FIX - Before - Year 1 PropertyTax:', firstYear.propertyTax);
      console.log('DIRECT FIX - Before - Year 10 PropertyTax:', lastYear.propertyTax);
      console.log('DIRECT FIX - After - Year 1 PropertyTax:', updatedAnalysis.longTermAnalysis.projections[0].propertyTax);
      console.log('DIRECT FIX - After - Year 10 PropertyTax:', updatedAnalysis.longTermAnalysis.projections[updatedAnalysis.longTermAnalysis.projections.length-1].propertyTax);
      
      // Update the state with the fixed projections
      if (setAnalysis) {
        setAnalysis(updatedAnalysis as Analysis);
      }
    }
  }, [analysis?.longTermAnalysis?.projections, propertyData.longTermAssumptions?.inflationRate, propertyData.longTermAssumptions?.vacancyRate, setAnalysis]);
  
  // Safely prepare expense breakdown data
  let expenseBreakdownData: Array<{ name: string; value: number }> = [];
  try {
    expenseBreakdownData = [
      { name: 'Mortgage', value: analysis?.monthlyAnalysis?.expenses?.mortgage?.total || 0 },
      { name: 'Property Tax', value: analysis?.monthlyAnalysis?.expenses?.propertyTax || 0 },
      { name: 'Insurance', value: analysis?.monthlyAnalysis?.expenses?.insurance || 0 },
      { name: 'Maintenance', value: analysis?.monthlyAnalysis?.expenses?.maintenance || 0 },
      { name: 'Property Management', value: analysis?.monthlyAnalysis?.expenses?.propertyManagement || 0 },
      { name: 'Vacancy', value: analysis?.monthlyAnalysis?.expenses?.vacancy || 0 },
      { name: 'Tenant Turnover', value: (analysis as any)?.monthlyAnalysis?.expenses?.tenantTurnover || 0 }
    ].filter(item => item.value > 0);
  } catch (err) {
    console.error('Error preparing expense breakdown data:', err);
    expenseBreakdownData = [];
  }
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#8884d8'];

  // Display error if validation failed
  if (error) {
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Displaying Analysis
          </Typography>
          <Typography variant="body1">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Get data from analysis object with proper null checks and defaults
  const mortgagePayment = analysis?.monthlyAnalysis?.expenses?.mortgage?.total || 0;
  const propertyTax = analysis?.monthlyAnalysis?.expenses?.propertyTax || defaultExpenses.propertyTax;
  const insurance = analysis?.monthlyAnalysis?.expenses?.insurance || defaultExpenses.insurance;
  const maintenance = propertyData.maintenanceCost !== undefined ? 
    propertyData.maintenanceCost : 
    (analysis?.monthlyAnalysis?.expenses?.maintenance || defaultExpenses.maintenance);
  const propertyManagement = analysis?.monthlyAnalysis?.expenses?.propertyManagement || defaultExpenses.propertyManagement;
  const vacancy = analysis?.monthlyAnalysis?.expenses?.vacancy || defaultExpenses.vacancy;
  const tenantTurnover = (analysis as any)?.monthlyAnalysis?.expenses?.tenantTurnover || 0;
  const monthlyRent = propertyData?.monthlyRent || 0;
  const vacancyRate = propertyData?.longTermAssumptions?.vacancyRate || 5;
  const vacancyLoss = monthlyRent * (vacancyRate / 100);
  const effectiveRentalIncome = monthlyRent - vacancyLoss;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Analysis Results: {propertyData.propertyName || 'Property'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {propertyData.propertyAddress?.street}, {propertyData.propertyAddress?.city}, {propertyData.propertyAddress?.state} {propertyData.propertyAddress?.zipCode}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Expanded Key Metrics Section */}
        <Typography variant="h6" gutterBottom>Key Metrics</Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cap Rate
                  <Tooltip title="Net Operating Income / Property Value">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercent(analysis.keyMetrics.capRate)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Based on Purchase Price
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cash on Cash Return
                  <Tooltip title="Annual Cash Flow / Total Investment">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercent(analysis.keyMetrics.cashOnCashReturn)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  First Year
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  DSCR
                  <Tooltip title="Net Operating Income / Annual Debt Service">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatDecimal(analysis?.keyMetrics?.dscr || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Debt Service Coverage Ratio
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {propertyData.longTermAssumptions?.projectionYears || 10}-Year IRR
                  <Tooltip title="Internal Rate of Return over the projection period">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercent(analysis.keyMetrics.irr)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Internal Rate of Return
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monthly Cash Flow
                  <Tooltip title="Monthly Income - Monthly Expenses">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(analysis.monthlyAnalysis.cashFlow)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  First Year Average
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total ROI ({propertyData.longTermAssumptions?.projectionYears || 10} yr)
                  <Tooltip title="Total Return on Investment over projection period">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercent(analysis.longTermAnalysis.exitAnalysis.returnOnInvestment)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {propertyData.longTermAssumptions?.projectionYears || 10} Year Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Price/SqFt
                  <Tooltip title="Purchase Price per Square Foot">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(propertyData.purchasePrice / (propertyData.squareFootage || 1))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Initial Purchase
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Price/SqFt at Sale
                  <Tooltip title="Projected Sale Price per Square Foot">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(analysis.longTermAnalysis.exitAnalysis.projectedSalePrice / (propertyData.squareFootage || 1))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Year 10 Projection
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Avg Rent/SqFt
                  <Tooltip title="Monthly Rent per Square Foot">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(monthlyRent / (propertyData.squareFootage || 1))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Monthly Average
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Return
                  <Tooltip title="Net Proceeds + Total Cash Flow">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(analysis.longTermAnalysis.returns.totalReturn || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  10 Year Projection
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Investment
                  <Tooltip title="Down Payment + Closing Costs + Repair Costs">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(propertyData.downPayment + (propertyData.closingCosts || 0))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Down Payment + Costs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {analysis.aiInsights?.investmentScore !== undefined && (
            <Grid container item xs={6} sm={4} md={2}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    AI Investment Score
                    <Tooltip title="AI-Generated Investment Quality Score (0-100)">
                      <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    </Tooltip>
                  </Typography>
                  <Typography variant="h5" component="div">
                    {analysis.aiInsights.investmentScore}/100
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    AI Recommendation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        
        {/* Advanced Metrics Section */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Advanced Metrics</Typography>
        <AdvancedMetricsSection metrics={{
          breakEvenOccupancy: analysis.keyMetrics?.breakEvenOccupancy,
          equityMultiple: analysis.keyMetrics?.equityMultiple,
          onePercentRuleValue: analysis.keyMetrics?.onePercentRuleValue,
          fiftyRuleAnalysis: analysis.keyMetrics?.fiftyRuleAnalysis,
          rentToPriceRatio: analysis.keyMetrics?.rentToPriceRatio,
          pricePerBedroom: analysis.keyMetrics?.pricePerBedroom,
          debtToIncomeRatio: analysis.keyMetrics?.debtToIncomeRatio,
          grossRentMultiplier: analysis.keyMetrics?.grossRentMultiplier,
          operatingExpenseRatio: analysis.keyMetrics?.operatingExpenseRatio,
          returnOnImprovements: analysis.keyMetrics?.returnOnImprovements,
          turnoverCostImpact: analysis.keyMetrics?.turnoverCostImpact
        }} />
        
        {/* Sensitivity Analysis Section */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Sensitivity Analysis</Typography>
        {analysis.sensitivityAnalysis && (
          <SensitivityAnalysisSection sensitivityAnalysis={analysis.sensitivityAnalysis} />
        )}
        
        {/* Tabs for different sections */}
        <Box sx={{ mb: 2 }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange}
            aria-label="Analysis detail tabs"
          >
            <Tab label="Monthly Analysis" />
            <Tab label="Annual Analysis" />
            <Tab label="Year-by-Year Projections" />
            <Tab label="Exit Analysis" />
            {analysis.aiInsights && <Tab label="AI Insights" />}
          </Tabs>
        </Box>
        
        {/* Monthly Analysis Tab */}
        {tabIndex === 0 && (
          <Box>
            <Grid container spacing={4}>
              <Grid container item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Monthly Income & Expenses</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Gross Rental Income</TableCell>
                        <TableCell align="right">{formatCurrency(monthlyRent)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vacancy Loss ({formatPercent(vacancyRate)})</TableCell>
                        <TableCell align="right">-{formatCurrency(vacancyLoss)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Effective Rental Income</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(effectiveRentalIncome)}</strong></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2}><Divider /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Mortgage Payment</TableCell>
                        <TableCell align="right">-{formatCurrency(mortgagePayment)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Property Tax</TableCell>
                        <TableCell align="right">-{formatCurrency(propertyTax)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Insurance</TableCell>
                        <TableCell align="right">-{formatCurrency(insurance)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Maintenance</TableCell>
                        <TableCell align="right">-{formatCurrency(maintenance)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Property Management</TableCell>
                        <TableCell align="right">-{formatCurrency(propertyManagement)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vacancy</TableCell>
                        <TableCell align="right">-{formatCurrency(vacancy)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tenant Turnover</TableCell>
                        <TableCell align="right">-{formatCurrency(tenantTurnover)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Total Monthly Expenses</strong></TableCell>
                        <TableCell align="right"><strong>-{formatCurrency(analysis?.monthlyAnalysis?.expenses?.total || 0)}</strong></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2}><Divider /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Monthly Cash Flow</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(analysis?.monthlyAnalysis?.cashFlow || 0)}</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid container item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Monthly Expense Breakdown</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseBreakdownData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Annual Analysis Tab */}
        {tabIndex === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Annual Financial Summary</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Gross Rental Income</TableCell>
                    <TableCell align="right">{formatCurrency(analysis?.annualAnalysis?.effectiveGrossIncome || monthlyRent * 12 || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Effective Gross Income</TableCell>
                    <TableCell align="right">{formatCurrency(analysis?.annualAnalysis?.effectiveGrossIncome || 
                      (monthlyRent * 12) * (1 - (vacancyRate || 0)/100) || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Operating Expenses</TableCell>
                    <TableCell align="right">-{formatCurrency(Math.abs(analysis?.annualAnalysis?.operatingExpenses || 
                      ((propertyTax + insurance + maintenance + propertyManagement) * 12) || 0))}</TableCell>
                  </TableRow>
                  <TableRow sx={{ fontWeight: 'bold' }}>
                    <TableCell><strong>Net Operating Income (NOI)</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(analysis?.annualAnalysis?.noi || 
                      ((analysis?.annualAnalysis?.effectiveGrossIncome || 0) - (analysis?.annualAnalysis?.operatingExpenses || 0)) ||
                      ((monthlyRent * (1 - (vacancyRate / 100)) - propertyTax - insurance - maintenance - propertyManagement) * 12) || 0)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Annual Debt Service</TableCell>
                    <TableCell align="right">-{formatCurrency(analysis?.annualAnalysis?.annualDebtService || mortgagePayment * 12 || 0)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ fontWeight: 'bold' }}>
                    <TableCell><strong>Annual Cash Flow</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(analysis?.annualAnalysis?.cashFlow || (analysis?.monthlyAnalysis?.cashFlow || 0) * 12 || 0)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2}><Divider /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Total Investment
                      <Tooltip title="Down Payment + Closing Costs + Repair Costs">
                        <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(analysis?.keyMetrics?.totalInvestment || 
                      propertyData.downPayment + (propertyData.closingCosts || 0) + (propertyData.repairCosts || 0) || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Cap Rate
                      <Tooltip title="NOI / Property Value">
                        <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{formatPercent(analysis?.keyMetrics?.capRate || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Cash on Cash Return
                      <Tooltip title="Annual Cash Flow / Total Investment">
                        <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{formatPercent(analysis?.keyMetrics?.cashOnCashReturn || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Debt Service Coverage Ratio
                      <Tooltip title="NOI / Annual Debt Service">
                        <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{formatDecimal(analysis?.keyMetrics?.dscr || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Monthly Cash Flow</TableCell>
                    <TableCell align="right">{formatCurrency(analysis?.monthlyAnalysis?.cashFlow || 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Year-by-Year Projections Tab */}
        {tabIndex === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Year-by-Year Projections</Typography>
            
            {analysis.longTermAnalysis?.projections && analysis.longTermAnalysis.projections.length > 0 ? (
              <>
                <Box sx={{ bgcolor: 'info.main', color: 'info.contrastText', p: 1, mb: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2">Inflation Rate: {propertyData.longTermAssumptions?.inflationRate || 0}%</Typography>
                  <Typography variant="caption">
                    Debug: PropertyTax Year 1: {formatCurrency(analysis.longTermAnalysis.projections[0]?.propertyTax || 0)} vs 
                    Year {Math.min(9, analysis.longTermAnalysis.projections.length - 1)}: {formatCurrency(analysis.longTermAnalysis.projections[Math.min(9, analysis.longTermAnalysis.projections.length - 1)]?.propertyTax || 0)} | 
                    Ratio: {((analysis.longTermAnalysis.projections[Math.min(9, analysis.longTermAnalysis.projections.length - 1)]?.propertyTax || 0) / 
                           (analysis.longTermAnalysis.projections[0]?.propertyTax || 1)).toFixed(2)}x
                  </Typography>
                  <Typography variant="caption" display="block">
                    Debug: Insurance Year 1: {formatCurrency(analysis.longTermAnalysis.projections[0]?.insurance || 0)} vs 
                    Year {Math.min(9, analysis.longTermAnalysis.projections.length - 1)}: {formatCurrency(analysis.longTermAnalysis.projections[Math.min(9, analysis.longTermAnalysis.projections.length - 1)]?.insurance || 0)} | 
                    Ratio: {((analysis.longTermAnalysis.projections[Math.min(9, analysis.longTermAnalysis.projections.length - 1)]?.insurance || 0) / 
                           (analysis.longTermAnalysis.projections[0]?.insurance || 1)).toFixed(2)}x
                  </Typography>
                  <Typography variant="caption" display="block">
                    Expected Inflation Factor: {Math.pow(1 + (propertyData.longTermAssumptions?.inflationRate || 2) / 100, Math.min(9, analysis.longTermAnalysis.projections.length - 1)).toFixed(2)}x
                  </Typography>
                  <Typography variant="caption" display="block">
                    Raw Data (Check Console): {JSON.stringify(analysis.longTermAnalysis.projections.slice(0, Math.min(5, analysis.longTermAnalysis.projections.length)).map(p => ({ 
                      year: p?.year, 
                      pTax: p?.propertyTax, 
                      ins: p?.insurance,
                      maint: p?.maintenance
                    }))).substring(0, 100) + "..."}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Debug: Turnover Costs Year 1: {formatCurrency(analysis.longTermAnalysis.projections[0]?.turnoverCosts || 0)} | 
                    Capital Improvements Year 1: {formatCurrency(analysis.longTermAnalysis.projections[0]?.capitalImprovements || 0)}
                  </Typography>
                </Box>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Year</TableCell>
                        <TableCell align="right">Property Value</TableCell>
                        <TableCell align="right">Gross Rent</TableCell>
                        <TableCell align="right">Property Tax</TableCell>
                        <TableCell align="right">Insurance</TableCell>
                        <TableCell align="right">Maintenance</TableCell>
                        <TableCell align="right">Property Management</TableCell>
                        <TableCell align="right">Vacancy</TableCell>
                        <TableCell align="right">Turnover Costs</TableCell>
                        <TableCell align="right">Capital Improvements</TableCell>
                        <TableCell align="right">Total Expenses</TableCell>
                        <TableCell align="right">NOI</TableCell>
                        <TableCell align="right">Debt Service</TableCell>
                        <TableCell align="right">Cash Flow</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analysis.longTermAnalysis.projections.map((year) => (
                        <TableRow key={year?.year || 'unknown'}>
                          <TableCell>{year?.year || 'N/A'}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.propertyValue || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.grossRent || year?.grossIncome || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.propertyTax || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.insurance || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.maintenance || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.propertyManagement || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.vacancy || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.turnoverCosts || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.capitalImprovements || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.operatingExpenses || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.noi || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(year?.debtService || 0)}</TableCell>
                          <TableCell align="right" sx={{ color: (year?.cashFlow || 0) < 0 ? 'error.main' : 'success.main' }}>
                            {(year?.cashFlow || 0) < 0 ? '-' : ''}{formatCurrency(Math.abs(year?.cashFlow || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                No projection data available. This may occur with older saved deals that don't include yearly projections.
              </Alert>
            )}
          </Box>
        )}
        
        {/* Exit Analysis Tab */}
        {tabIndex === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Exit Analysis</Typography>
            {analysis.longTermAnalysis?.exitAnalysis ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Projected Sale Price (Year {propertyData.longTermAssumptions?.projectionYears || 10})</TableCell>
                      <TableCell align="right">{formatCurrency(analysis.longTermAnalysis.exitAnalysis.projectedSalePrice || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Selling Costs ({formatPercent(propertyData.longTermAssumptions?.sellingCostsPercentage || 0)})</TableCell>
                      <TableCell align="right">-{formatCurrency(analysis.longTermAnalysis.exitAnalysis.sellingCosts || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mortgage Payoff</TableCell>
                      <TableCell align="right">-{formatCurrency(analysis.longTermAnalysis.exitAnalysis.mortgagePayoff || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Net Proceeds from Sale</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(analysis.longTermAnalysis.exitAnalysis.netProceedsFromSale || 0)}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Cash Flow (All Years)</TableCell>
                      <TableCell align="right">{formatCurrency(analysis.longTermAnalysis.returns?.totalCashFlow || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Appreciation</TableCell>
                      <TableCell align="right">{formatCurrency(analysis.longTermAnalysis.returns?.totalAppreciation || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Total Return</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(analysis.longTermAnalysis.returns?.totalReturn || 0)}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>IRR (Internal Rate of Return)</strong></TableCell>
                      <TableCell align="right"><strong>{formatPercent(analysis.longTermAnalysis.returns?.irr || 0)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                No exit analysis data available. This may occur with older saved deals that don't include exit projections.
              </Alert>
            )}
          </Box>
        )}
        
        {/* AI Insights Tab */}
        {tabIndex === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>AI Analysis Summary</Typography>
            
            {analysis.aiInsights ? (
              <>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="body1">{analysis.aiInsights.summary || 'No summary available'}</Typography>
                </Paper>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Investment Strengths</Typography>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      {Array.isArray(analysis.aiInsights.strengths) && analysis.aiInsights.strengths.length > 0 ? (
                        analysis.aiInsights.strengths.map((strength, index) => (
                          <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                            • {strength}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2">No strengths available</Typography>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Investment Weaknesses</Typography>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      {Array.isArray(analysis.aiInsights.weaknesses) && analysis.aiInsights.weaknesses.length > 0 ? (
                        analysis.aiInsights.weaknesses.map((weakness, index) => (
                          <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                            • {weakness}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2">No weaknesses available</Typography>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Recommendations</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      {Array.isArray(analysis.aiInsights.recommendations) && analysis.aiInsights.recommendations.length > 0 ? (
                        analysis.aiInsights.recommendations.map((rec, index) => (
                          <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                            • {rec}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2">No recommendations available</Typography>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Investment Score</Typography>
                        <Typography variant="h3" align="center">
                          {analysis.aiInsights.investmentScore || 0}/100
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {analysis.aiInsights.recommendedHoldPeriod && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Recommended Hold Period</Typography>
                          <Typography variant="h5" align="center">
                            {analysis.aiInsights.recommendedHoldPeriod}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                AI insights are not available for this property. This may occur with older saved deals or if AI analysis was not generated.
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AnalysisResults; 