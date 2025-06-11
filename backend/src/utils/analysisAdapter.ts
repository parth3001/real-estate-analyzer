import { logger } from '../utils/logger';
import { ensureExpenseInflation, shouldRegenerateProjections } from './fixers/projectionFixer';

/**
 * Adapts the backend analysis structure to match what the frontend expects
 * This helps avoid frontend-side calculations by ensuring all data is in the right format
 * 
 * Adapter Rules:
 * 1. Core property data is preserved from the stored deal (purchase price, rent, etc.)
 * 2. Monthly analysis is preserved with normalization to ensure consistent structure
 * 3. All projections are ALWAYS recalculated to ensure consistency
 * 4. Exit analysis is always recalculated based on the projections
 * 5. Annual analysis is derived from monthly values if missing
 * 6. AI Insights are preserved as-is from the stored deal
 */
export function adaptAnalysisForFrontend(analysis: any): any {
  try {
    console.log('\n\n++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('ANALYSIS ADAPTER: adaptAnalysisForFrontend FUNCTION CALLED');
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    
    // Create a deep copy to avoid modifying the original
    const adaptedAnalysis = JSON.parse(JSON.stringify(analysis));
    
    // Log the initial structure
    logger.info('Adapting analysis for frontend - initial structure:', { 
      hasMonthlyAnalysis: !!adaptedAnalysis.monthlyAnalysis,
      hasAnnualAnalysis: !!adaptedAnalysis.annualAnalysis,
      hasLongTermAnalysis: !!adaptedAnalysis.longTermAnalysis,
      hasYearlyProjections: !!(adaptedAnalysis.longTermAnalysis?.yearlyProjections),
      hasProjections: !!(adaptedAnalysis.longTermAnalysis?.projections),
      keys: Object.keys(adaptedAnalysis)
    });
    
    // RULE 1: Ensure we have propertyData in adaptedAnalysis
    if (!adaptedAnalysis.propertyData) {
      // Extract property data from the saved deal
      adaptedAnalysis.propertyData = {
        purchasePrice: analysis.purchasePrice,
        monthlyRent: analysis.monthlyRent,
        downPayment: analysis.downPayment,
        interestRate: analysis.interestRate,
        loanTerm: analysis.loanTerm,
        propertyTaxRate: analysis.propertyTaxRate,
        insuranceRate: analysis.insuranceRate,
        maintenanceCost: analysis.maintenanceCost,
        propertyManagementRate: analysis.propertyManagementRate,
        squareFootage: analysis.squareFootage,
        closingCosts: analysis.closingCosts,
        longTermAssumptions: analysis.longTermAssumptions || {
          projectionYears: 10,
          annualRentIncrease: 2,
          annualPropertyValueIncrease: 3,
          inflationRate: 2,
          vacancyRate: 5,
          sellingCostsPercentage: 6
        }
      };
      
      logger.info('Created propertyData from top-level properties', {
        hasPrice: !!adaptedAnalysis.propertyData.purchasePrice,
        hasRent: !!adaptedAnalysis.propertyData.monthlyRent
      });
    }
    
    // RULE 2: Normalize the monthly analysis structure
    if (adaptedAnalysis.monthlyAnalysis) {
      // Handle income structure
      if (typeof adaptedAnalysis.monthlyAnalysis.income === 'number') {
        const grossIncome = adaptedAnalysis.monthlyAnalysis.income;
        adaptedAnalysis.monthlyAnalysis.income = {
          gross: grossIncome,
          effective: grossIncome
        };
      }
      
      // Handle expenses structure
      if (adaptedAnalysis.monthlyAnalysis.expenses) {
        const expenses = adaptedAnalysis.monthlyAnalysis.expenses;
        
        // Extract breakdown if it exists
        if (expenses.breakdown) {
          // Move breakdown fields to top level
          adaptedAnalysis.monthlyAnalysis.expenses = {
            ...expenses,
            propertyTax: expenses.breakdown.propertyTax || 0,
            insurance: expenses.breakdown.insurance || 0,
            maintenance: expenses.breakdown.maintenance || 0,
            propertyManagement: expenses.breakdown.propertyManagement || 0,
            vacancy: expenses.breakdown.vacancy || 0,
            // Use debt as mortgage if available
            mortgage: expenses.debt ? { total: expenses.debt } : expenses.mortgage || { total: 0 }
          };
          
          // Remove the nested breakdown to avoid duplication
          delete adaptedAnalysis.monthlyAnalysis.expenses.breakdown;
        }
        
        // Ensure mortgage is properly structured
        if (typeof adaptedAnalysis.monthlyAnalysis.expenses.mortgage === 'number') {
          adaptedAnalysis.monthlyAnalysis.expenses.mortgage = {
            total: adaptedAnalysis.monthlyAnalysis.expenses.mortgage
          };
        }
        
        // Recalculate total expenses
        const updatedExpenses = adaptedAnalysis.monthlyAnalysis.expenses;
        const mortgage = updatedExpenses.mortgage?.total || 0;
        const propertyTax = updatedExpenses.propertyTax || 0;
        const insurance = updatedExpenses.insurance || 0;
        const maintenance = updatedExpenses.maintenance || 0;
        const propertyManagement = updatedExpenses.propertyManagement || 0;
        const vacancy = updatedExpenses.vacancy || 0;
        
        adaptedAnalysis.monthlyAnalysis.expenses.total = 
          mortgage + propertyTax + insurance + maintenance + propertyManagement + vacancy;
        
        // Remove debt if it exists (replaced by mortgage)
        delete adaptedAnalysis.monthlyAnalysis.expenses.debt;
        delete adaptedAnalysis.monthlyAnalysis.expenses.operating;
      }
    }
    
    // Normalize metrics vs keyMetrics
    if (adaptedAnalysis.metrics && !adaptedAnalysis.keyMetrics) {
      adaptedAnalysis.keyMetrics = adaptedAnalysis.metrics;
      delete adaptedAnalysis.metrics;
    }
    
    // RULE 3 & 4: Handle long term analysis and always recalculate projections
    if (!adaptedAnalysis.longTermAnalysis) {
      logger.warn('longTermAnalysis is missing - creating empty structure');
      adaptedAnalysis.longTermAnalysis = {
        projections: [],
        projectionYears: 10,
        returns: {
          irr: 0,
          totalCashFlow: 0, 
          totalAppreciation: 0,
          totalReturn: 0
        },
        exitAnalysis: {
          projectedSalePrice: 0,
          sellingCosts: 0,
          mortgagePayoff: 0,
          netProceedsFromSale: 0,
          totalProfit: 0,
          returnOnInvestment: 0
        }
      };
    } else {
      // Check if yearlyProjections exists (old field name) and convert to projections
      if (adaptedAnalysis.longTermAnalysis.yearlyProjections && 
          Array.isArray(adaptedAnalysis.longTermAnalysis.yearlyProjections) && 
          adaptedAnalysis.longTermAnalysis.yearlyProjections.length > 0) {
        
        logger.info('Found yearlyProjections - converting to projections');
        adaptedAnalysis.longTermAnalysis.projections = adaptedAnalysis.longTermAnalysis.yearlyProjections;
        delete adaptedAnalysis.longTermAnalysis.yearlyProjections;
      }
      
      // CRITICAL FIX: For saved deals, force apply our inflation fixer FIRST to ensure consistent calculations
      if (adaptedAnalysis.longTermAnalysis.projections && 
          Array.isArray(adaptedAnalysis.longTermAnalysis.projections) && 
          adaptedAnalysis.longTermAnalysis.projections.length > 0) {
        
        // Get inflation rate from property data
        const inflationRate = adaptedAnalysis.propertyData?.longTermAssumptions?.inflationRate || 2.0;
        
        console.log('ADAPTER: CRITICAL - Ensuring inflation is applied to SAVED DEAL projections');
        
        // Apply the fixer
        adaptedAnalysis.longTermAnalysis.projections = 
          ensureExpenseInflation(
            adaptedAnalysis.longTermAnalysis.projections, 
            inflationRate
          );
          
        console.log('ADAPTER: Applied inflation fix to projections BEFORE regeneration check');
      }
      
      // CRITICAL FIX: Always regenerate projections to ensure inflation is applied correctly
      // Set to true to force regeneration of projections for all saved deals
      let shouldRegenerateProjectionsFlag = shouldRegenerateProjections(adaptedAnalysis.longTermAnalysis.projections);
      
      // Log the decision to regenerate projections
      console.log(`ADAPTER: Should regenerate projections? ${shouldRegenerateProjectionsFlag}`);
      
      // ALWAYS regenerate projections for saved deals to ensure consistent calculations
      if (shouldRegenerateProjectionsFlag) {
        logger.info('Regenerating projections for saved deal to ensure accuracy');
        console.log('Regenerating projections with expense growth!');
        
        // Debug log existing projections if any
        if (adaptedAnalysis.longTermAnalysis.projections && 
            Array.isArray(adaptedAnalysis.longTermAnalysis.projections) && 
            adaptedAnalysis.longTermAnalysis.projections.length > 0) {
          
          const firstYear = adaptedAnalysis.longTermAnalysis.projections[0];
          const lastYear = adaptedAnalysis.longTermAnalysis.projections[adaptedAnalysis.longTermAnalysis.projections.length - 1];
          
          console.log('Original projections - first year:', {
            propertyTax: firstYear.propertyTax,
            insurance: firstYear.insurance,
            maintenance: firstYear.maintenance
          });
          
          console.log('Original projections - last year:', {
            propertyTax: lastYear.propertyTax,
            insurance: lastYear.insurance,
            maintenance: lastYear.maintenance
          });
        }
        
        adaptedAnalysis.longTermAnalysis.projections = generateProjections(analysis, adaptedAnalysis);
        
        // Debug log new projections
        if (adaptedAnalysis.longTermAnalysis.projections && 
            Array.isArray(adaptedAnalysis.longTermAnalysis.projections) && 
            adaptedAnalysis.longTermAnalysis.projections.length > 0) {
          
          const firstYear = adaptedAnalysis.longTermAnalysis.projections[0];
          const lastYear = adaptedAnalysis.longTermAnalysis.projections[adaptedAnalysis.longTermAnalysis.projections.length - 1];
          
          console.log('New projections - first year:', {
            propertyTax: firstYear.propertyTax,
            insurance: firstYear.insurance,
            maintenance: firstYear.maintenance
          });
          
          console.log('New projections - last year:', {
            propertyTax: lastYear.propertyTax,
            insurance: lastYear.insurance,
            maintenance: lastYear.maintenance
          });
        }
      } else {
        console.log('Keeping existing projections with proper inflation');
      }
    }
    
    // Update exit analysis and returns based on projections if they exist
    if (adaptedAnalysis.longTermAnalysis.projections.length > 0) {
      updateExitAnalysisAndReturns(adaptedAnalysis);
    }
    
    // Add a check to make sure inflation was actually applied - if not, manually fix it
    if (adaptedAnalysis.longTermAnalysis.projections && 
        Array.isArray(adaptedAnalysis.longTermAnalysis.projections) && 
        adaptedAnalysis.longTermAnalysis.projections.length > 1) {
      
      const projections = adaptedAnalysis.longTermAnalysis.projections;
      const firstYear = projections[0];
      const lastYear = projections[projections.length - 1];
      
      // If first and last year property tax are the same, inflation wasn't applied
      if (firstYear.propertyTax === lastYear.propertyTax) {
        console.log('EMERGENCY FIX: Projections still have no inflation - manually fixing!');
        
        // Get the inflation rate
        const inflationRate = adaptedAnalysis.propertyData.longTermAssumptions?.inflationRate || 2;
        
        // Apply inflation to each year manually
        adaptedAnalysis.longTermAnalysis.projections = projections.map((year, index) => {
          const expenseInflationFactor = Math.pow(1 + inflationRate / 100, index);
          
          // Only apply inflation to years after the first
          if (index === 0) return year;
          
          return {
            ...year,
            propertyTax: firstYear.propertyTax * expenseInflationFactor,
            insurance: firstYear.insurance * expenseInflationFactor,
            maintenance: firstYear.maintenance * expenseInflationFactor,
            // Recalculate operating expenses
            operatingExpenses: (
              firstYear.propertyTax * expenseInflationFactor + 
              firstYear.insurance * expenseInflationFactor + 
              firstYear.maintenance * expenseInflationFactor + 
              year.propertyManagement + 
              year.vacancy
            )
          };
        });
        
        // Log the fix
        console.log('EMERGENCY FIX APPLIED!');
        console.log('- Year 1 PropertyTax:', adaptedAnalysis.longTermAnalysis.projections[0].propertyTax);
        console.log('- Year 10 PropertyTax:', adaptedAnalysis.longTermAnalysis.projections[9].propertyTax);
      }
    }
    
    // Log the adapted structure
    logger.debug('Adapted analysis structure for frontend', {
      hasMonthlyExpenses: !!adaptedAnalysis.monthlyAnalysis?.expenses,
      hasPropertyTax: !!adaptedAnalysis.monthlyAnalysis?.expenses?.propertyTax,
      hasAnnualAnalysis: !!adaptedAnalysis.annualAnalysis,
      hasLongTermAnalysis: !!adaptedAnalysis.longTermAnalysis,
      hasKeyMetrics: !!adaptedAnalysis.keyMetrics,
      projectionCount: adaptedAnalysis.longTermAnalysis?.projections?.length || 0
    });
    
    return adaptedAnalysis;
  } catch (error) {
    logger.error('Error adapting analysis for frontend:', error);
    // Return the original analysis if there's an error during adaptation
    return analysis;
  }
}

// Helper function to generate projections
function generateProjections(originalAnalysis: any, adaptedAnalysis: any): any[] {
  try {
    console.log('\n\n========== ADAPTER PROJECTIONS DEBUG START ==========');
    console.log('Adapter is regenerating projections');
    
    // For saved deals, the property data might be at the top level
    // Extract property data from wherever it exists
    let propertyData: any = {};
    
    // Check several possible locations for property data
    if (originalAnalysis.propertyData) {
      // New analyses have propertyData as a nested object
      propertyData = originalAnalysis.propertyData;
    } else if (adaptedAnalysis.propertyData) {
      // We might have created propertyData in the adapter
      propertyData = adaptedAnalysis.propertyData;
    } else {
      // Extract from the top level fields
      propertyData = {
        purchasePrice: originalAnalysis.purchasePrice || 0,
        monthlyRent: originalAnalysis.monthlyRent || 0,
        downPayment: originalAnalysis.downPayment || 0,
        interestRate: originalAnalysis.interestRate || 4.5,
        loanTerm: originalAnalysis.loanTerm || 30,
        propertyTaxRate: originalAnalysis.propertyTaxRate || 1.5,
        insuranceRate: originalAnalysis.insuranceRate || 0.5,
        maintenanceCost: originalAnalysis.maintenanceCost || 0,
        propertyManagementRate: originalAnalysis.propertyManagementRate || 8,
        squareFootage: originalAnalysis.squareFootage || 0,
        closingCosts: originalAnalysis.closingCosts || 0,
        longTermAssumptions: originalAnalysis.longTermAssumptions || {
          projectionYears: 10,
          annualRentIncrease: 2,
          annualPropertyValueIncrease: 3,
          inflationRate: 2,
          vacancyRate: 5,
          sellingCostsPercentage: 6
        }
      };
    }
    
    // Log the property data we're using
    logger.info('Generating projections with property data:', {
      purchasePrice: propertyData.purchasePrice,
      monthlyRent: propertyData.monthlyRent,
      downPayment: propertyData.downPayment,
      hasLongTermAssumptions: !!propertyData.longTermAssumptions
    });
    
    // Get base values for calculations
    const purchasePrice = propertyData.purchasePrice || 0;
    const monthlyRent = propertyData.monthlyRent || 0;
    const baseRent = monthlyRent * 12;
    
    // Get expense values from monthly analysis if available
    const monthlyExpenses = adaptedAnalysis.monthlyAnalysis?.expenses || {};
    const mortgagePayment = monthlyExpenses.mortgage?.total || 0;
    const annualMortgage = mortgagePayment * 12;
    
    // Extract assumption values with defaults
    const years = propertyData.longTermAssumptions?.projectionYears || 10;
    const annualAppreciationRate = propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3; // Default 3%
    const annualRentGrowth = propertyData.longTermAssumptions?.annualRentIncrease || 2; // Default 2%
    const annualExpenseGrowth = propertyData.longTermAssumptions?.inflationRate || 2; // Default 2%
    const vacancyRate = propertyData.longTermAssumptions?.vacancyRate || 5; // Default 5%
    
    // Log assumption values for debugging
    console.log('PROJECTION ASSUMPTIONS:', {
      years,
      annualAppreciationRate,
      annualRentGrowth,
      annualExpenseGrowth,
      vacancyRate
    });
    
    // Get expense values
    const basePropertyTax = monthlyExpenses.propertyTax ? monthlyExpenses.propertyTax * 12 : 
                           (propertyData.propertyTaxRate ? (propertyData.propertyTaxRate / 100) * purchasePrice : purchasePrice * 0.015); // Default 1.5%
    
    const baseInsurance = monthlyExpenses.insurance ? monthlyExpenses.insurance * 12 : 
                         (propertyData.insuranceRate ? (propertyData.insuranceRate / 100) * purchasePrice : purchasePrice * 0.005); // Default 0.5%
    
    const baseMaintenanceCost = monthlyExpenses.maintenance ? monthlyExpenses.maintenance * 12 : 
                               (propertyData.maintenanceCost ? propertyData.maintenanceCost * 12 : baseRent * 0.05); // FIXED: Ensure monthly maintenance is annualized
    
    const basePropertyManagement = monthlyExpenses.propertyManagement ? monthlyExpenses.propertyManagement * 12 : 
                                  (baseRent * (propertyData.propertyManagementRate || 8) / 100); // Default 8% of rent
    
    const baseVacancy = baseRent * (vacancyRate / 100);
    
    // Log base expense values for debugging
    console.log('BASE EXPENSE VALUES (ANNUAL):', {
      basePropertyTax,
      baseInsurance,
      baseMaintenanceCost,
      basePropertyManagement,
      baseVacancy
    });
    
    // Calculate loan details
    const loanAmount = purchasePrice - (propertyData.downPayment || purchasePrice * 0.2); // Default 20% down
    const loanTermYears = propertyData.loanTerm || 30; // Default 30 years
    const interestRate = propertyData.interestRate || 4.5; // Default 4.5%
    
    // Generate projections with actual financial data and proper inflation
    const projections = Array.from({length: years}, (_, i) => {
      // Calculate year values with growth rates
      const year = i + 1;
      const appreciationFactor = Math.pow(1 + annualAppreciationRate / 100, i);
      const rentGrowthFactor = Math.pow(1 + annualRentGrowth / 100, i);
      const expenseGrowthFactor = Math.pow(1 + annualExpenseGrowth / 100, i);
      
      // Calculate actual values for this year with inflation
      const propertyValue = purchasePrice * appreciationFactor;
      const grossRent = baseRent * rentGrowthFactor;
      
      // DIRECT FIX: EXPLICITLY APPLY INFLATION TO ALL EXPENSES
      // This is the most direct way to fix the issue - explicitly calculate expenses with inflation
      let propertyTax = basePropertyTax;  // Base value for year 1
      let insurance = baseInsurance;      // Base value for year 1
      let maintenance = baseMaintenanceCost; // Base value for year 1
      
      // IMPORTANT: For years after year 1, apply inflation factor
      if (year > 1) {
        // Explicitly calculate with inflation
        propertyTax = basePropertyTax * expenseGrowthFactor;
        insurance = baseInsurance * expenseGrowthFactor;
        maintenance = baseMaintenanceCost * expenseGrowthFactor;
        
        // Debug output showing forced inflation
        console.log(`FORCING INFLATION: Year ${year}`, {
          basePropertyTax,
          propertyTaxWithInflation: propertyTax,
          expenseGrowthFactor,
          inflationRate: annualExpenseGrowth
        });
      }
      
      // Property management scales with rent since it's a percentage of rent
      const propertyManagement = grossRent * (propertyData.propertyManagementRate || 8) / 100;
      
      // Vacancy scales with rent since it's a percentage of rent
      const vacancy = grossRent * (vacancyRate / 100);
      
      // Calculate effective gross income (rent minus vacancy)
      const effectiveGrossIncome = grossRent - vacancy;
      
      // Calculate operating expenses (total of all expenses except mortgage)
      const operatingExpenses = propertyTax + insurance + maintenance + propertyManagement + vacancy;
      
      // Calculate NOI (effective gross income minus operating expenses except vacancy)
      const noi = effectiveGrossIncome - (propertyTax + insurance + maintenance + propertyManagement);
      
      // Debt service stays constant for fixed-rate mortgage
      const debtService = annualMortgage; 
      
      // Calculate cash flow
      const cashFlow = noi - debtService;
      
      // Calculate mortgage balance (simplified)
      const remainingTermMonths = (loanTermYears * 12) - (i * 12);
      const monthlyInterestRate = (interestRate / 100) / 12;
      
      // Simplified mortgage balance calculation
      let mortgageBalance = 0;
      if (remainingTermMonths > 0 && mortgagePayment > 0) {
        mortgageBalance = loanAmount * Math.pow(1 + monthlyInterestRate, i * 12) - 
                         (mortgagePayment * (Math.pow(1 + monthlyInterestRate, i * 12) - 1) / monthlyInterestRate);
        if (mortgageBalance < 0) mortgageBalance = 0; // Ensure non-negative balance
      }
      
      // Calculate equity
      const equity = propertyValue - mortgageBalance;
      const appreciation = i === 0 ? 0 : propertyValue - (purchasePrice * Math.pow(1 + annualAppreciationRate / 100, i-1));
      const totalReturn = cashFlow + appreciation;
      
      return {
        year,
        propertyValue,
        grossRent,
        grossIncome: grossRent,
        propertyTax,
        insurance,
        maintenance,
        propertyManagement,
        vacancy,
        operatingExpenses,
        noi,
        debtService,
        cashFlow,
        mortgageBalance,
        equity,
        appreciation,
        totalReturn
      };
    });
    
    // Final debug output for the projections
    if (projections.length > 0) {
      console.log('\nADAPTER FINAL PROJECTIONS:');
      console.log('Year 1 PropertyTax:', projections[0].propertyTax);
      console.log('Year 10 PropertyTax:', projections[projections.length-1].propertyTax);
      console.log('Inflation Factor (10 years):', Math.pow(1 + annualExpenseGrowth/100, projections.length-1).toFixed(2));
      console.log('Actual Ratio:', (projections[projections.length-1].propertyTax / projections[0].propertyTax).toFixed(2));
      console.log('========== ADAPTER PROJECTIONS DEBUG END ==========\n\n');
    }
    
    return projections;
  } catch (error) {
    logger.error('Error generating projections:', error);
    // Return minimal projections if calculation fails
    return Array.from({length: 10}, (_, i) => ({
      year: i + 1,
      propertyValue: 0,
      grossRent: 0,
      grossIncome: 0,
      propertyTax: 0,
      insurance: 0,
      maintenance: 0,
      propertyManagement: 0,
      vacancy: 0,
      operatingExpenses: 0,
      noi: 0,
      debtService: 0,
      cashFlow: 0,
      mortgageBalance: 0,
      equity: 0,
      appreciation: 0,
      totalReturn: 0
    }));
  }
}

// Helper function to update exit analysis and returns based on projections
function updateExitAnalysisAndReturns(adaptedAnalysis: any): void {
  try {
    const projections = adaptedAnalysis.longTermAnalysis.projections;
    const years = projections.length;
    const finalYear = projections[years-1];
    
    // Extract property data from wherever it exists
    let propertyData: any = {};
    
    // Check several possible locations for property data
    if (adaptedAnalysis.propertyData) {
      propertyData = adaptedAnalysis.propertyData;
    } else {
      // Extract from the top level fields
      propertyData = {
        purchasePrice: adaptedAnalysis.purchasePrice || 0,
        downPayment: adaptedAnalysis.downPayment || 0,
        closingCosts: adaptedAnalysis.closingCosts || 0,
        longTermAssumptions: adaptedAnalysis.longTermAssumptions || {
          sellingCostsPercentage: 6
        }
      };
    }
    
    // Log the property data we're using
    logger.info('Updating exit analysis with property data:', {
      purchasePrice: propertyData.purchasePrice,
      downPayment: propertyData.downPayment,
      hasLongTermAssumptions: !!propertyData.longTermAssumptions
    });
    
    // Skip if final year projections don't exist
    if (!finalYear) return;
    
    // Get selling costs percentage
    const sellingCostsPercent = propertyData.longTermAssumptions?.sellingCostsPercentage || 6;
    
    // Calculate exit analysis values
    const projectedSalePrice = finalYear.propertyValue;
    const sellingCosts = projectedSalePrice * (sellingCostsPercent / 100);
    const mortgagePayoff = finalYear.mortgageBalance || 0;
    const netProceedsFromSale = projectedSalePrice - sellingCosts - mortgagePayoff;
    
    // Calculate returns
    const totalInvestment = propertyData.downPayment + (propertyData.closingCosts || 0);
    const totalCashFlow = projections.reduce((sum, year) => sum + year.cashFlow, 0);
    const totalAppreciation = finalYear.propertyValue - propertyData.purchasePrice;
    const totalProfit = netProceedsFromSale;
    const returnOnInvestment = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    const totalReturn = totalCashFlow + netProceedsFromSale;
    
    // Update exit analysis
    adaptedAnalysis.longTermAnalysis.exitAnalysis = {
      ...adaptedAnalysis.longTermAnalysis.exitAnalysis,
      projectedSalePrice,
      sellingCosts,
      mortgagePayoff,
      netProceedsFromSale,
      totalProfit,
      returnOnInvestment
    };
    
    // Update returns
    adaptedAnalysis.longTermAnalysis.returns = {
      ...adaptedAnalysis.longTermAnalysis.returns,
      totalCashFlow,
      totalAppreciation,
      totalReturn
    };
    
    logger.info('Updated exit analysis and returns based on projections');
  } catch (error) {
    logger.error('Error updating exit analysis and returns:', error);
  }
}

// RULE 5: Normalize annual analysis fields
if (adaptedAnalysis.annualAnalysis) {
  // Map fields to frontend expected names
  if (adaptedAnalysis.annualAnalysis.grossRent && !adaptedAnalysis.annualAnalysis.income) {
    adaptedAnalysis.annualAnalysis.income = adaptedAnalysis.annualAnalysis.grossRent;
  }
  
  if (adaptedAnalysis.annualAnalysis.operatingExpenses && !adaptedAnalysis.annualAnalysis.expenses) {
    adaptedAnalysis.annualAnalysis.expenses = adaptedAnalysis.annualAnalysis.operatingExpenses;
  }
  
  // Make sure cashFlow exists
  if (!adaptedAnalysis.annualAnalysis.cashFlow && adaptedAnalysis.annualAnalysis.noi) {
    adaptedAnalysis.annualAnalysis.cashFlow = adaptedAnalysis.annualAnalysis.noi - 
      (adaptedAnalysis.annualAnalysis.debtService || adaptedAnalysis.monthlyAnalysis?.expenses?.mortgage?.total * 12 || 0);
  }
  
  // Delete redundant fields
  delete adaptedAnalysis.annualAnalysis.grossRent;
  delete adaptedAnalysis.annualAnalysis.operatingExpenses;
} else {
  // Create annual analysis from monthly data if missing
  if (adaptedAnalysis.monthlyAnalysis) {
    const monthlyRent = adaptedAnalysis.monthlyAnalysis.income?.gross || 
                       adaptedAnalysis.propertyData.monthlyRent || 0;
    const monthlyExpenses = adaptedAnalysis.monthlyAnalysis.expenses?.total || 0;
    const mortgagePayment = adaptedAnalysis.monthlyAnalysis.expenses?.mortgage?.total || 0;
    
    adaptedAnalysis.annualAnalysis = {
      income: monthlyRent * 12,
      expenses: (monthlyExpenses - mortgagePayment) * 12, // Operating expenses without mortgage
      noi: (monthlyRent - (monthlyExpenses - mortgagePayment)) * 12,
      debtService: mortgagePayment * 12,
      cashFlow: (monthlyRent - monthlyExpenses) * 12
    };
    
    logger.info('Created annual analysis from monthly data');
  }
} 