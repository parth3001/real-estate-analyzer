import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import type { Analysis } from '../../types/analysis';
import type { SFRPropertyData } from '../../types/property';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Extend the Analysis type to add missing properties
interface ExtendedAnalysis extends Analysis {
  annualAnalysis: {
    effectiveGrossIncome?: number;
    operatingExpenses?: number;
    noi?: number;
    debtService?: number;
    cashFlow?: number;
  }
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
const preserveUserInputValues = (analysis: Analysis, propertyData: SFRPropertyData): void => {
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
const updateExpenseTotals = (analysis: Analysis): void => {
  if (!analysis.monthlyAnalysis?.expenses) return;
  
  // Calculate total monthly expenses
  const mortgage = analysis.monthlyAnalysis.expenses.mortgage?.total || 0;
  const propertyTax = analysis.monthlyAnalysis.expenses.propertyTax || 0;
  const insurance = analysis.monthlyAnalysis.expenses.insurance || 0;
  const maintenance = analysis.monthlyAnalysis.expenses.maintenance || 0;
  const propertyManagement = analysis.monthlyAnalysis.expenses.propertyManagement || 0;
  const vacancy = analysis.monthlyAnalysis.expenses.vacancy || 0;
  
  const totalMonthlyExpenses = mortgage + propertyTax + insurance + maintenance + propertyManagement + vacancy;
  analysis.monthlyAnalysis.expenses.total = totalMonthlyExpenses;
  
  // Update cash flow based on rent and expenses
  if (analysis.monthlyAnalysis.grossIncome !== undefined) {
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
        (year.vacancy || 0);
      
      // Update NOI
      year.noi = (year.grossRent || 0) - year.operatingExpenses;
      
      // Update cash flow
      year.cashFlow = year.noi - (year.debtService || 0);
    }
  }
};

// Update the ensureMortgageAndDebtService function to handle the correct mortgage type
const ensureMortgageAndDebtService = (analysis: ExtendedAnalysis, propertyData: SFRPropertyData): void => {
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
const fixLongTermReturns = (analysis: ExtendedAnalysis, propertyData: SFRPropertyData): void => {
  // Check if IRR or ROI is missing or zero
  if (!analysis.longTermAnalysis?.returns?.irr || analysis.longTermAnalysis.returns.irr === 0 ||
      !analysis.longTermAnalysis?.exitAnalysis?.returnOnInvestment || analysis.longTermAnalysis.exitAnalysis.returnOnInvestment === 0) {
    
    console.log("FIXING: IRR or ROI is missing or zero - recalculating");
    
    // Ensure projections exist
    if (!analysis.longTermAnalysis.projections || analysis.longTermAnalysis.projections.length === 0) {
      return; // Can't fix without projections
    }
    
    // Get total investment
    const totalInvestment = propertyData.downPayment + (propertyData.closingCosts || 0);
    
    // Calculate total cash flow from projections
    const totalCashFlow = analysis.longTermAnalysis.projections.reduce((sum, year) => sum + (year.cashFlow || 0), 0);
    
    // Get exit value (net proceeds from sale)
    const netProceedsFromSale = analysis.longTermAnalysis.exitAnalysis.netProceedsFromSale || 
      analysis.longTermAnalysis.projections[analysis.longTermAnalysis.projections.length - 1].propertyValue * 0.9; // Rough estimate
    
    // Calculate total return
    const totalReturn = totalCashFlow + netProceedsFromSale - totalInvestment;
    
    // Calculate ROI
    const roi = (totalReturn / totalInvestment) * 100;
    
    // Set the values
    if (!analysis.longTermAnalysis.returns) {
      analysis.longTermAnalysis.returns = {
        totalCashFlow: totalCashFlow,
        totalAppreciation: netProceedsFromSale - propertyData.purchasePrice,
        totalReturn: totalReturn,
        irr: 0 // Will calculate below
      };
    } else {
      analysis.longTermAnalysis.returns.totalCashFlow = totalCashFlow;
      analysis.longTermAnalysis.returns.totalAppreciation = netProceedsFromSale - propertyData.purchasePrice;
      analysis.longTermAnalysis.returns.totalReturn = totalReturn;
    }
    
    // Set ROI
    if (analysis.longTermAnalysis.exitAnalysis) {
      analysis.longTermAnalysis.exitAnalysis.returnOnInvestment = roi;
    }
    
    // Simple IRR approximation (for more accurate IRR, a proper financial calculator would be needed)
    // This is a simplified approach - for simplicity we're using a rough approximation
    const years = analysis.longTermAnalysis.projections.length;
    const approximateIRR = Math.pow((totalInvestment + totalReturn) / totalInvestment, 1/years) - 1;
    analysis.longTermAnalysis.returns.irr = approximateIRR * 100;
    
    console.log("FIXED: ROI recalculated to:", roi);
    console.log("FIXED: IRR approximated to:", approximateIRR * 100);
  }
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, propertyData, setAnalysis = () => {} }) => {
  // Cast analysis to ExtendedAnalysis to use the extended properties
  const extendedAnalysis = analysis as ExtendedAnalysis;
  const [tabIndex, setTabIndex] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  
  // Get default expenses if needed
  let defaultExpenses = React.useMemo(() => calculateDefaultMonthlyExpenses(propertyData), [propertyData]);
  
  // Update the useEffect validation to include fixes for missing mortgage and ROI/IRR
  React.useEffect(() => {
    try {
      // Verify required data exists
      if (!analysis || !propertyData) {
        setError('Analysis or property data is missing');
        return;
      }
      
      // Ensure basic structures exist
      if (!analysis.monthlyAnalysis) {
        analysis.monthlyAnalysis = {
          grossIncome: propertyData.monthlyRent,
          expenses: {},
          cashFlow: 0
        };
      }
      
      // Check for expenses
      if (!analysis.monthlyAnalysis.expenses) {
        analysis.monthlyAnalysis.expenses = {};
        console.error('Created empty expenses object in monthlyAnalysis');
      }
      
      // Initialize structures for annual analysis if needed
      if (!analysis.annualAnalysis) {
        analysis.annualAnalysis = {
          grossRentalIncome: propertyData.monthlyRent * 12,
          effectiveGrossIncome: propertyData.monthlyRent * 12 * (1 - (propertyData.longTermAssumptions?.vacancyRate || 5) / 100),
          operatingExpenses: 0,
          noi: 0,
          cashFlow: 0,
          capRate: 0,
          cashOnCashReturn: 0,
          dscr: 0,
          annualDebtService: 0
        };
      }
      
      // First, preserve any user input values from propertyData
      preserveUserInputValues(analysis, propertyData);
      
      // Then, ensure mortgage and debt service are properly calculated
      ensureMortgageAndDebtService(extendedAnalysis, propertyData);
      
      // Check for longTermAnalysis
      if (!analysis.longTermAnalysis) {
        setError('Long-term analysis data is missing');
        return;
      }
      
      // Check for projections - CREATE DEFAULT PROJECTIONS IF MISSING instead of showing error
      if (!analysis.longTermAnalysis.projections) {
        console.warn('longTermAnalysis.projections is missing completely - creating default array');
        // Create a minimal projections array to prevent errors
        analysis.longTermAnalysis.projections = Array.from({length: 10}, (_, i) => ({
          year: i + 1,
          propertyValue: propertyData.purchasePrice * Math.pow(1 + (propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3) / 100, i),
          grossRent: propertyData.monthlyRent * 12 * Math.pow(1 + (propertyData.longTermAssumptions?.annualRentIncrease || 2) / 100, i),
          cashFlow: propertyData.monthlyRent * 9, // Rough estimate (75% of monthly rent × 12 months)
          noi: propertyData.monthlyRent * 12 * 0.8, // Rough NOI estimate
          equity: propertyData.purchasePrice * 0.5 + i * (propertyData.purchasePrice * 0.05), // Rough equity growth
          operatingExpenses: propertyData.monthlyRent * 12 * 0.4, // Rough operating expense estimate
          mortgageBalance: propertyData.purchasePrice * (1 - propertyData.downPayment / propertyData.purchasePrice) * (1 - i/30),
          grossIncome: propertyData.monthlyRent * 12 * Math.pow(1 + (propertyData.longTermAssumptions?.annualRentIncrease || 2) / 100, i),
          propertyTax: propertyData.purchasePrice * (propertyData.propertyTaxRate || 1.5) / 100,
          insurance: propertyData.purchasePrice * (propertyData.insuranceRate || 0.5) / 100,
          maintenance: (propertyData.maintenanceCost || propertyData.monthlyRent * 0.08) * 12, // Use user value or 8% of rent
          propertyManagement: propertyData.monthlyRent * 12 * (propertyData.propertyManagementRate || 8) / 100,
          vacancy: propertyData.monthlyRent * 12 * (propertyData.longTermAssumptions?.vacancyRate || 5) / 100,
          debtService: (analysis.monthlyAnalysis?.expenses?.mortgage?.total || 0) * 12 || propertyData.monthlyRent * 12 * 0.5,
          appreciation: i === 0 ? 0 : propertyData.purchasePrice * (propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3) / 100,
          totalReturn: propertyData.monthlyRent * 9 + propertyData.purchasePrice * (propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3) / 100
        }));
      } else if (!Array.isArray(analysis.longTermAnalysis.projections)) {
        console.error('longTermAnalysis.projections is not an array:', analysis.longTermAnalysis.projections);
        setError('Long-term projections data is invalid (not an array)');
        return;
      }
      
      if (analysis.longTermAnalysis.projections.length === 0) {
        console.error('longTermAnalysis.projections array is empty - creating default projections');
        // Create a minimal projections array to prevent errors
        analysis.longTermAnalysis.projections = Array.from({length: 10}, (_, i) => ({
          year: i + 1,
          propertyValue: propertyData.purchasePrice * Math.pow(1 + (propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3) / 100, i),
          grossRent: propertyData.monthlyRent * 12 * Math.pow(1 + (propertyData.longTermAssumptions?.annualRentIncrease || 2) / 100, i),
          cashFlow: propertyData.monthlyRent * 9, // Rough estimate (75% of monthly rent × 12 months)
          noi: propertyData.monthlyRent * 12 * 0.8, // Rough NOI estimate
          equity: propertyData.purchasePrice * 0.5 + i * (propertyData.purchasePrice * 0.05), // Rough equity growth
          operatingExpenses: propertyData.monthlyRent * 12 * 0.4, // Rough operating expense estimate
          mortgageBalance: propertyData.purchasePrice * (1 - propertyData.downPayment / propertyData.purchasePrice) * (1 - i/30),
          grossIncome: propertyData.monthlyRent * 12 * Math.pow(1 + (propertyData.longTermAssumptions?.annualRentIncrease || 2) / 100, i),
          propertyTax: propertyData.purchasePrice * (propertyData.propertyTaxRate || 1.5) / 100,
          insurance: propertyData.purchasePrice * (propertyData.insuranceRate || 0.5) / 100,
          maintenance: (propertyData.maintenanceCost || propertyData.monthlyRent * 0.08) * 12, // Use user value or 8% of rent
          propertyManagement: propertyData.monthlyRent * 12 * (propertyData.propertyManagementRate || 8) / 100,
          vacancy: propertyData.monthlyRent * 12 * (propertyData.longTermAssumptions?.vacancyRate || 5) / 100,
          debtService: (analysis.monthlyAnalysis?.expenses?.mortgage?.total || 0) * 12 || propertyData.monthlyRent * 12 * 0.5,
          appreciation: i === 0 ? 0 : propertyData.purchasePrice * (propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3) / 100,
          totalReturn: propertyData.monthlyRent * 9 + propertyData.purchasePrice * (propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3) / 100
        }));
      }
      
      // Fix IRR and ROI calculations
      fixLongTermReturns(extendedAnalysis, propertyData);
      
      // Check for keyMetrics
      if (!analysis.keyMetrics) {
        setError('Key metrics data is missing');
        return;
      }
      
      // Update key metrics with corrected values
      if (analysis.annualAnalysis && analysis.keyMetrics) {
        // Ensure totalInvestment is set
        analysis.keyMetrics.totalInvestment = propertyData.downPayment + (propertyData.closingCosts || 0);
        
        // Update other metrics if needed
        if (analysis.annualAnalysis.noi && propertyData.purchasePrice) {
          analysis.keyMetrics.capRate = (analysis.annualAnalysis.noi / propertyData.purchasePrice) * 100;
        }
        
        if (analysis.annualAnalysis.cashFlow && analysis.keyMetrics.totalInvestment) {
          analysis.keyMetrics.cashOnCashReturn = (analysis.annualAnalysis.cashFlow / analysis.keyMetrics.totalInvestment) * 100;
        }
        
        if (analysis.annualAnalysis.noi && analysis.annualAnalysis.annualDebtService) {
          analysis.keyMetrics.dscr = analysis.annualAnalysis.noi / analysis.annualAnalysis.annualDebtService;
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error validating analysis data:', err);
      setError('Error processing analysis data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [analysis, propertyData]);
  
  // After the main validation useEffect, add this new useLayoutEffect
  React.useLayoutEffect(() => {
    // Skip if there's an error or missing data
    if (error || !analysis || !propertyData) return;

    // If mortgage payment is missing or zero, fix it immediately
    if (!analysis.monthlyAnalysis?.expenses?.mortgage?.total || analysis.monthlyAnalysis.expenses.mortgage.total === 0) {
      console.log("LAYOUT EFFECT: Fixing missing mortgage payment for immediate render");
      
      // Calculate mortgage payment
      const principal = propertyData.purchasePrice * (1 - propertyData.downPayment / propertyData.purchasePrice);
      const monthlyRate = propertyData.interestRate / 12 / 100;
      const payments = propertyData.loanTerm * 12;
      let monthlyMortgage = 0;
      
      if (monthlyRate > 0 && payments > 0) {
        monthlyMortgage = (principal * monthlyRate * Math.pow(1 + monthlyRate, payments)) / 
                        (Math.pow(1 + monthlyRate, payments) - 1);
      }
      
      // Ensure expenses object exists
      if (!analysis.monthlyAnalysis) {
        analysis.monthlyAnalysis = {
          grossIncome: propertyData.monthlyRent,
          expenses: {},
          cashFlow: 0
        };
      }
      
      if (!analysis.monthlyAnalysis.expenses) {
        analysis.monthlyAnalysis.expenses = {};
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
      
      // Force a re-render by making a shallow copy of the analysis object
      // This is important to ensure the component re-renders with the updated values
      setAnalysis({...analysis});
    }
  }, [analysis, propertyData, error, setAnalysis]);
  
  // Safely prepare expense breakdown data
  let expenseBreakdownData: Array<{ name: string; value: number }> = [];
  try {
    expenseBreakdownData = [
      { name: 'Mortgage', value: analysis?.monthlyAnalysis?.expenses?.mortgage?.total || 0 },
      { name: 'Property Tax', value: analysis?.monthlyAnalysis?.expenses?.propertyTax || 0 },
      { name: 'Insurance', value: analysis?.monthlyAnalysis?.expenses?.insurance || 0 },
      { name: 'Maintenance', value: analysis?.monthlyAnalysis?.expenses?.maintenance || 0 },
      { name: 'Property Management', value: analysis?.monthlyAnalysis?.expenses?.propertyManagement || 0 },
      { name: 'Vacancy', value: analysis?.monthlyAnalysis?.expenses?.vacancy || 0 }
    ].filter(item => item.value > 0);
  } catch (err) {
    console.error('Error preparing expense breakdown data:', err);
    expenseBreakdownData = [];
  }
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];
  
  // Safely prepare cash flow chart data
  let cashFlowData: Array<{ name: string; cashFlow: number; propertyValue: number }> = [];
  try {
    if (Array.isArray(analysis.longTermAnalysis.projections)) {
      cashFlowData = analysis.longTermAnalysis.projections.map(year => ({
        name: `Year ${year.year}`,
        cashFlow: year.cashFlow,
        propertyValue: year.propertyValue
      }));
    }
  } catch (err) {
    console.error('Error preparing cash flow data:', err);
    cashFlowData = [];
  }

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
  const monthlyRent = propertyData?.monthlyRent || 0;
  const vacancyRate = propertyData?.longTermAssumptions?.vacancyRate || 5;
  const vacancyLoss = monthlyRent * (vacancyRate / 100);
  const effectiveRentalIncome = monthlyRent - vacancyLoss;

  // CRITICAL FIX: Immediately fix projections if they're flat (no inflation)
  // Force this to happen BEFORE first render
  if (analysis.longTermAnalysis?.projections && 
      Array.isArray(analysis.longTermAnalysis.projections) && 
      analysis.longTermAnalysis.projections.length > 0) {
    
    const firstYear = analysis.longTermAnalysis.projections[0];
    const lastYear = analysis.longTermAnalysis.projections[analysis.longTermAnalysis.projections.length - 1];
    
    // Check if expenses are flat across years (no inflation applied)
    if (firstYear && lastYear && 
        Math.abs((firstYear.propertyTax || 0) - (lastYear.propertyTax || 0)) < 1) {
      
      console.log('DIRECT FRONTEND FIX: Forcing inflation on flat projections');
      
      // Get inflation rate
      const inflationRate = propertyData.longTermAssumptions?.inflationRate || 2;
      
      // Fix projections in place
      analysis.longTermAnalysis.projections = analysis.longTermAnalysis.projections.map((year, index) => {
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
      console.log('DIRECT FIX - After - Year 1 PropertyTax:', analysis.longTermAnalysis.projections[0].propertyTax);
      console.log('DIRECT FIX - After - Year 10 PropertyTax:', analysis.longTermAnalysis.projections[analysis.longTermAnalysis.projections.length-1].propertyTax);
    }
  }

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
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
          
          <Grid container item xs={6} sm={4} md={2}>
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
                        {expenseBreakdownData.map((entry, index) => (
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
                      analysis?.annualAnalysis?.effectiveGrossIncome - analysis?.annualAnalysis?.operatingExpenses ||
                      ((monthlyRent * (1 - (vacancyRate / 100)) - propertyTax - insurance - maintenance - propertyManagement) * 12) || 0)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Annual Debt Service</TableCell>
                    <TableCell align="right">-{formatCurrency(analysis?.annualAnalysis?.annualDebtService || mortgagePayment * 12 || 0)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ fontWeight: 'bold' }}>
                    <TableCell><strong>Annual Cash Flow</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(analysis?.annualAnalysis?.cashFlow || analysis?.monthlyAnalysis?.cashFlow * 12 || 0)}</strong></TableCell>
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
            
            <Box sx={{ bgcolor: 'info.main', color: 'info.contrastText', p: 1, mb: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2">Inflation Rate: {propertyData.longTermAssumptions?.inflationRate || 0}%</Typography>
              <Typography variant="caption">
                Debug: PropertyTax Year 1: {formatCurrency(analysis.longTermAnalysis.projections[0]?.propertyTax || 0)} vs 
                Year 10: {formatCurrency(analysis.longTermAnalysis.projections[9]?.propertyTax || 0)} | 
                Ratio: {((analysis.longTermAnalysis.projections[9]?.propertyTax || 0) / 
                       (analysis.longTermAnalysis.projections[0]?.propertyTax || 1)).toFixed(2)}x
              </Typography>
              <Typography variant="caption" display="block">
                Debug: Insurance Year 1: {formatCurrency(analysis.longTermAnalysis.projections[0]?.insurance || 0)} vs 
                Year 10: {formatCurrency(analysis.longTermAnalysis.projections[9]?.insurance || 0)} | 
                Ratio: {((analysis.longTermAnalysis.projections[9]?.insurance || 0) / 
                       (analysis.longTermAnalysis.projections[0]?.insurance || 1)).toFixed(2)}x
              </Typography>
              <Typography variant="caption" display="block">
                Expected Inflation Factor: {Math.pow(1 + (propertyData.longTermAssumptions?.inflationRate || 2) / 100, 9).toFixed(2)}x
              </Typography>
              <Typography variant="caption" display="block">
                Raw Data (Check Console): {JSON.stringify(analysis.longTermAnalysis.projections.map(p => ({ 
                  year: p.year, 
                  pTax: p.propertyTax, 
                  ins: p.insurance,
                  maint: p.maintenance
                }))).substring(0, 100) + "..."}
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
                    <TableCell align="right">Total Expenses</TableCell>
                    <TableCell align="right">NOI</TableCell>
                    <TableCell align="right">Debt Service</TableCell>
                    <TableCell align="right">Cash Flow</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analysis.longTermAnalysis.projections.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell>{year.year}</TableCell>
                      <TableCell align="right">{formatCurrency(year.propertyValue)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.grossRent || year.grossIncome)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.propertyTax)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.insurance)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.maintenance)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.propertyManagement)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.vacancy)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.operatingExpenses)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.noi)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.debtService)}</TableCell>
                      <TableCell align="right" sx={{ color: year.cashFlow < 0 ? 'error.main' : 'success.main' }}>
                        {year.cashFlow < 0 ? '-' : ''}{formatCurrency(Math.abs(year.cashFlow))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Exit Analysis Tab */}
        {tabIndex === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Exit Analysis</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Projected Sale Price (Year {propertyData.longTermAssumptions.projectionYears})</TableCell>
                    <TableCell align="right">{formatCurrency(analysis.longTermAnalysis.exitAnalysis.projectedSalePrice)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Selling Costs ({formatPercent(propertyData.longTermAssumptions.sellingCostsPercentage)})</TableCell>
                    <TableCell align="right">-{formatCurrency(analysis.longTermAnalysis.exitAnalysis.sellingCosts)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mortgage Payoff</TableCell>
                    <TableCell align="right">-{formatCurrency(analysis.longTermAnalysis.exitAnalysis.mortgagePayoff)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Net Proceeds from Sale</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(analysis.longTermAnalysis.exitAnalysis.netProceedsFromSale)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Cash Flow (All Years)</TableCell>
                    <TableCell align="right">{formatCurrency(analysis.longTermAnalysis.returns.totalCashFlow)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Appreciation</TableCell>
                    <TableCell align="right">{formatCurrency(analysis.longTermAnalysis.returns.totalAppreciation)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Total Return</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(analysis.longTermAnalysis.returns.totalReturn)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>IRR (Internal Rate of Return)</strong></TableCell>
                    <TableCell align="right"><strong>{formatPercent(analysis.longTermAnalysis.returns.irr)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* AI Insights Tab */}
        {tabIndex === 4 && analysis.aiInsights && (
          <Box>
            <Typography variant="h6" gutterBottom>AI Analysis Summary</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="body1">{analysis.aiInsights.summary}</Typography>
            </Paper>
            
            <Grid container spacing={3}>
              <Grid container item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Investment Strengths</Typography>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  {Array.isArray(analysis.aiInsights.strengths) && analysis.aiInsights.strengths.map((strength, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      • {strength}
                    </Typography>
                  ))}
                  {(!Array.isArray(analysis.aiInsights.strengths) || analysis.aiInsights.strengths.length === 0) && (
                    <Typography variant="body2">No strengths available</Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid container item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Investment Weaknesses</Typography>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  {Array.isArray(analysis.aiInsights.weaknesses) && analysis.aiInsights.weaknesses.map((weakness, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      • {weakness}
                    </Typography>
                  ))}
                  {(!Array.isArray(analysis.aiInsights.weaknesses) || analysis.aiInsights.weaknesses.length === 0) && (
                    <Typography variant="body2">No weaknesses available</Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Recommendations</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {Array.isArray(analysis.aiInsights.recommendations) && analysis.aiInsights.recommendations.map((rec, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      • {rec}
                    </Typography>
                  ))}
                  {(!Array.isArray(analysis.aiInsights.recommendations) || analysis.aiInsights.recommendations.length === 0) && (
                    <Typography variant="body2">No recommendations available</Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid container item xs={12} md={6}>
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
                <Grid container item xs={12} md={6}>
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
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AnalysisResults; 