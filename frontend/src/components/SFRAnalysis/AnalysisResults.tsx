import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { TrendingUp, Assessment, ShowChart, Home } from '@mui/icons-material';
import MetricCard, { CashFlowCard, CapRateCard, CoCReturnCard, ROICard } from '../ui/MetricCard';
import type { 
  Analysis, 
  MonthlyExpenses as BaseMonthlyExpenses, 
  AnnualAnalysis, 
  KeyMetrics 
} from '../../types/analysis';
import type { SFRPropertyData } from '../../types/property';
import type { CensusDataResponse, CensusQueryParams } from '../../types/censusData';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip
} from 'recharts';
import AdvancedMetricsSection from './AdvancedMetricsSection';
import SensitivityAnalysisSection from './SensitivityAnalysisSection';
import ComparablePropertiesSection from '../ComparablePropertiesSection';
import { MarketContextSection } from './MarketContextSection';
import { EnhancedAIAnalysis } from './EnhancedAIAnalysis';
import MarketIntelligenceSection from './MarketIntelligenceSection';
import * as censusService from '../../services/censusService';
import { COLORS } from './colors';

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

// Extend the PropertyAddress type to include zip and county
interface ExtendedPropertyAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
}

// Extend the SFRPropertyData type to use the extended PropertyAddress
interface ExtendedSFRPropertyData extends Omit<SFRPropertyData, 'propertyAddress'> {
  propertyAddress?: ExtendedPropertyAddress;
}

// Modify the AnalysisResultsProps interface
interface AnalysisResultsProps {
  analysis: Analysis;
  propertyData: SFRPropertyData; // Keep the original type in the interface
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
  
  // For maintenance, only preserve user input if it's not from wizard data and actually has a meaningful value
  // Don't override backend calculations when propertyData.maintenanceCost is 0 (which comes from wizard)
  if (propertyData.maintenanceCost !== undefined && propertyData.maintenanceCost > 0) {
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
  } else {
    console.log("Skipping maintenance override - using backend calculated values (propertyData.maintenanceCost:", propertyData.maintenanceCost, ")");
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
  // Cast propertyData to extended type
  const extendedPropertyData = propertyData as ExtendedSFRPropertyData;
  
  const [tabIndex, setTabIndex] = useState(0);
  const [censusData, setCensusData] = useState<CensusDataResponse | null>(null);
  const [, setCensusLoading] = useState<boolean>(false);
  
  // For TypeScript safety, cast to extended types
  const analysisExt = analysis as unknown as ExtendedAnalysis;
  
  // Set up error state
  const [error, setError] = useState<string | null>(null);
  
  // Debug log for projections
  useEffect(() => {
    if (analysis?.longTermAnalysis?.projections?.length > 0) {
      console.log('First Year Projection:', analysis.longTermAnalysis.projections[0]);
    }
  }, [analysis]);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  
  // Get default expenses for fallback
  const defaultExpenses = useMemo(() => calculateDefaultMonthlyExpenses(propertyData), [propertyData]);
  
  // Validate and fix analysis data
  useEffect(() => {
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
  useEffect(() => {
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
    ];
  } catch (err) {
    console.error('Error preparing expense breakdown data:', err);
  }


  // Fetch census data if we have location information
  useEffect(() => {
    const fetchCensusData = async () => {
      if (propertyData.propertyAddress?.zipCode || propertyData.propertyAddress?.state) {
        setCensusLoading(true);
        try {
          const params: CensusQueryParams = {
            // Send zipCode as zip for the backend
            zip: propertyData.propertyAddress?.zipCode,
            state: propertyData.propertyAddress?.state,
            // Only include county if it exists in the extended data
            ...(extendedPropertyData.propertyAddress?.county ? { county: extendedPropertyData.propertyAddress.county } : {})
          };
          
          const data = await censusService.getComprehensiveCensusData(params);
          setCensusData(data);
        } catch (error) {
          console.error('Error fetching census data:', error);
        } finally {
          setCensusLoading(false);
        }
      }
    };
    
    fetchCensusData();
  }, [propertyData.propertyAddress, extendedPropertyData.propertyAddress]);

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
          {propertyData.propertyAddress?.street}, {propertyData.propertyAddress?.city}, {propertyData.propertyAddress?.state} {propertyData.propertyAddress?.zipCode || extendedPropertyData.propertyAddress?.zip}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Key Metrics Section - Modernized with MetricCards */}
        <Typography variant="h6" gutterBottom>Key Metrics</Typography>
        
        {/* Hero Metrics Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <CashFlowCard
              value={formatCurrency(analysis.monthlyAnalysis?.cashFlow || 0)}
              subtitle="First year average"
              status={(analysis.monthlyAnalysis?.cashFlow || 0) >= 0 ? 'positive' : 'negative'}
              size="medium"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <CapRateCard
              value={formatPercent(analysis.keyMetrics.capRate)}
              subtitle="Based on purchase price"
              status={
                (analysis.keyMetrics.capRate || 0) >= 8 ? 'positive' : 
                (analysis.keyMetrics.capRate || 0) >= 6 ? 'neutral' : 'negative'
              }
              size="medium"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <CoCReturnCard
              value={formatPercent(analysis.keyMetrics.cashOnCashReturn)}
              subtitle="First year return"
              status={
                (analysis.keyMetrics.cashOnCashReturn || 0) >= 10 ? 'positive' : 
                (analysis.keyMetrics.cashOnCashReturn || 0) >= 7 ? 'neutral' : 'negative'
              }
              size="medium"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <ROICard
              value={formatPercent(analysis.longTermAnalysis.exitAnalysis.returnOnInvestment)}
              subtitle={`${propertyData.longTermAssumptions?.projectionYears || 10} year total`}
              status={
                (analysis.longTermAnalysis.exitAnalysis.returnOnInvestment || 0) >= 15 ? 'positive' : 
                (analysis.longTermAnalysis.exitAnalysis.returnOnInvestment || 0) >= 10 ? 'neutral' : 'negative'
              }
              trend="up"
              size="medium"
            />
          </Grid>
        </Grid>
        
        {/* Additional Metrics Row 1 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="DSCR"
              value={formatDecimal(analysis?.keyMetrics?.dscr || 0)}
              subtitle="Debt service coverage"
              status={
                (analysis?.keyMetrics?.dscr || 0) >= 1.25 ? 'positive' : 
                (analysis?.keyMetrics?.dscr || 0) >= 1.0 ? 'neutral' : 'negative'
              }
              icon={<Assessment />}
              tooltip="Net Operating Income / Annual Debt Service - Higher is better"
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title={`${propertyData.longTermAssumptions?.projectionYears || 10}-Year IRR`}
              value={formatPercent(analysis.keyMetrics.irr)}
              subtitle="Internal rate of return"
              status={
                (analysis.keyMetrics.irr || 0) >= 12 ? 'positive' : 
                (analysis.keyMetrics.irr || 0) >= 8 ? 'neutral' : 'negative'
              }
              icon={<ShowChart />}
              tooltip="Internal Rate of Return over the projection period"
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Price/SqFt"
              value={formatCurrency(propertyData.purchasePrice / (propertyData.squareFootage || 1))}
              subtitle="Initial purchase"
              status="neutral"
              icon={<Home />}
              tooltip="Purchase Price per Square Foot"
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Price/SqFt at Sale"
              value={formatCurrency(analysis.longTermAnalysis.exitAnalysis.projectedSalePrice / (propertyData.squareFootage || 1))}
              subtitle="Projected sale value"
              status="positive"
              icon={<TrendingUp />}
              tooltip="Projected Sale Price per Square Foot"
              trend="up"
              size="small"
            />
          </Grid>
        </Grid>

        {/* Additional Metrics Row 2 - Missing Production Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg Rent/SqFt"
              value={formatCurrency((propertyData.monthlyRent || 0) / (propertyData.squareFootage || 1))}
              subtitle="Monthly average"
              status="neutral"
              icon={<Home />}
              tooltip="Monthly Rent per Square Foot"
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Return"
              value={formatCurrency(analysis.longTermAnalysis?.returns?.totalReturn || 0)}
              subtitle={`${propertyData.longTermAssumptions?.projectionYears || 10} year projection`}
              status="positive"
              icon={<TrendingUp />}
              tooltip="Total cash flow plus appreciation over projection period"
              trend="up"
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Investment"
              value={formatCurrency(analysis.keyMetrics?.totalInvestment || ((propertyData.downPayment || 0) + (propertyData.closingCosts || 0)))}
              subtitle="Down payment + costs"
              status="neutral"
              icon={<Assessment />}
              tooltip="Total upfront investment required"
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="AI Investment Score"
              value={`${analysis.aiInsights?.investmentScore || 0}/100`}
              subtitle="AI recommendation"
              status={
                (analysis.aiInsights?.investmentScore || 0) >= 70 ? 'positive' : 
                (analysis.aiInsights?.investmentScore || 0) >= 50 ? 'neutral' : 'negative'
              }
              icon={<TrendingUp />}
              tooltip="AI-generated investment score based on comprehensive analysis"
              size="small"
            />
          </Grid>
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange}
            aria-label="analysis tabs"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'medium',
              },
              '& .Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }
            }}
          >
            {analysis.aiInsights && <Tab label="Enhanced AI Analysis" />}
            <Tab label="Monthly Analysis" />
            <Tab label="Annual Analysis" />
            <Tab label="Year-by-Year Projections" />
            <Tab label="Exit Analysis" />
            <Tab label="Market Intelligence" />
            <Tab label="Market Context" />
            <Tab label="Comparable Properties" />
          </Tabs>
        </Box>
        
        {/* Enhanced AI Analysis Tab */}
        {tabIndex === 0 && analysis.aiInsights && (
          <EnhancedAIAnalysis 
            aiInsights={analysis.aiInsights}
            propertyData={{
              propertyName: propertyData?.propertyName,
              propertyAddress: propertyData?.propertyAddress
            }}
          />
        )}

        {/* Monthly Analysis Tab */}
        {tabIndex === (analysis.aiInsights ? 1 : 0) && (
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
        {tabIndex === (analysis.aiInsights ? 2 : 1) && (
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
        {tabIndex === (analysis.aiInsights ? 3 : 2) && (
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
        {tabIndex === (analysis.aiInsights ? 4 : 3) && (
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

        {/* Market Intelligence Tab */}
        {tabIndex === (analysis.aiInsights ? 5 : 4) && (
          <Box>
            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Debug - Market Data: {analysis.marketData ? 'Available' : 'Missing'} | 
                Insights: {analysis.marketInsights?.length || 0} | 
                Timing: {analysis.investmentTiming ? 'Available' : 'Missing'}
              </Alert>
            )}
            <MarketIntelligenceSection
              marketData={analysis.marketData}
              marketInsights={analysis.marketInsights}
              investmentTiming={analysis.investmentTiming}
            />
          </Box>
        )}

        {/* Market Context Tab */}
        {tabIndex === (analysis.aiInsights ? 6 : 5) && (
          <Box>
            <MarketContextSection 
              analysis={analysis}
              censusData={censusData}
              propertyData={propertyData}
            />
          </Box>
        )}

        {/* Comparable Properties Tab */}
        {tabIndex === (analysis.aiInsights ? 7 : 6) && (
          <Box>
            <ComparablePropertiesSection 
              subjectProperty={{
                address: `${propertyData.propertyAddress.street}, ${propertyData.propertyAddress.city}, ${propertyData.propertyAddress.state}`,
                purchasePrice: propertyData.purchasePrice,
                squareFootage: propertyData.squareFootage,
                bedrooms: propertyData.bedrooms,
                bathrooms: propertyData.bathrooms,
                monthlyRent: propertyData.monthlyRent,
                yearBuilt: propertyData.yearBuilt
              }}
              comparableProperties={analysisExt?.marketData?.comparables || []}
              isLoading={false}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AnalysisResults; 