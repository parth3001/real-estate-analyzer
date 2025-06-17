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
    
    // RULE 6: Ensure keyMetrics are properly preserved and updated
    if (!adaptedAnalysis.keyMetrics) {
      adaptedAnalysis.keyMetrics = {};
    }
    
    // Ensure IRR is preserved from longTermAnalysis.returns if available
    if (adaptedAnalysis.longTermAnalysis?.returns?.irr && 
        (!adaptedAnalysis.keyMetrics.irr || adaptedAnalysis.keyMetrics.irr === 0)) {
      console.log('Preserving IRR from longTermAnalysis.returns:', adaptedAnalysis.longTermAnalysis.returns.irr);
      adaptedAnalysis.keyMetrics.irr = adaptedAnalysis.longTermAnalysis.returns.irr;
    }
    
    // Calculate Operating Expense Ratio if missing
    if (!adaptedAnalysis.keyMetrics.operatingExpenseRatio || adaptedAnalysis.keyMetrics.operatingExpenseRatio === 0) {
      console.log('Calculating Operating Expense Ratio for saved deal');
      
      // Get annual operating expenses and income
      const annualOperatingExpenses = adaptedAnalysis.annualAnalysis?.expenses || 0;
      const annualIncome = adaptedAnalysis.annualAnalysis?.income || 0;
      
      // Calculate the ratio
      if (annualIncome > 0) {
        adaptedAnalysis.keyMetrics.operatingExpenseRatio = (annualOperatingExpenses / annualIncome) * 100;
        console.log('Calculated Operating Expense Ratio:', adaptedAnalysis.keyMetrics.operatingExpenseRatio);
      }
    }
    
    // Ensure all key metrics are properly set
    console.log('Final keyMetrics:', {
      irr: adaptedAnalysis.keyMetrics.irr,
      operatingExpenseRatio: adaptedAnalysis.keyMetrics.operatingExpenseRatio,
      capRate: adaptedAnalysis.keyMetrics.capRate,
      cashOnCashReturn: adaptedAnalysis.keyMetrics.cashOnCashReturn,
      dscr: adaptedAnalysis.keyMetrics.dscr
    });
    
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
    console.log('\n\n========== ADAPTER PROJECTIONS CALCULATION ==========');
    
    // Extract property data
    const propertyData = adaptedAnalysis.propertyData || {};
    
    // Extract key values with defaults
    const purchasePrice = propertyData.purchasePrice || 0;
    const monthlyRent = propertyData.monthlyRent || 0;
    const downPayment = propertyData.downPayment || 0;
    const interestRate = propertyData.interestRate || 0;
    const loanTermYears = propertyData.loanTerm || 30;
    const propertyTaxRate = propertyData.propertyTaxRate || 1.2;
    const insuranceRate = propertyData.insuranceRate || 0.5;
    const maintenanceCost = propertyData.maintenanceCost || (monthlyRent * 0.1 * 12); // Default to 10% of rent
    const propertyManagementRate = propertyData.propertyManagementRate || 8;
    const capitalInvestments = propertyData.capitalInvestments || 0;
    
    // Extract long term assumptions
    const longTermAssumptions = propertyData.longTermAssumptions || {};
    const years = longTermAssumptions.projectionYears || 10;
    const annualRentIncrease = longTermAssumptions.annualRentIncrease || 2;
    const annualPropertyValueIncrease = longTermAssumptions.annualPropertyValueIncrease || 3;
    const annualExpenseGrowth = longTermAssumptions.inflationRate || 2;
    const vacancyRate = longTermAssumptions.vacancyRate || 5;
    
    // Calculate loan amount and monthly payment
    const loanAmount = purchasePrice - downPayment;
    const monthlyInterestRate = interestRate / 12 / 100;
    let mortgagePayment = 0;
    
    if (monthlyInterestRate > 0) {
      const numPayments = loanTermYears * 12;
      mortgagePayment = (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numPayments)) / 
                       (Math.pow(1 + monthlyInterestRate, numPayments) - 1);
    } else {
      mortgagePayment = loanAmount / (loanTermYears * 12);
    }
    
    const annualMortgage = mortgagePayment * 12;
    
    console.log('ADAPTER PROJECTIONS - Base Values:', {
      purchasePrice,
      monthlyRent,
      annualRent: monthlyRent * 12,
      downPayment,
      interestRate,
      loanTermYears,
      loanAmount,
      monthlyMortgage: mortgagePayment,
      annualMortgage,
      propertyTaxRate,
      insuranceRate,
      maintenanceCost,
      propertyManagementRate,
      capitalInvestments,
      annualRentIncrease,
      annualPropertyValueIncrease,
      annualExpenseGrowth,
      vacancyRate
    });
    
    // Generate projections for each year
    const projections = Array.from({length: years}, (_, i) => {
      const year = i + 1;
      
      // Calculate property value with appreciation
      const propertyValue = purchasePrice * Math.pow(1 + annualPropertyValueIncrease / 100, i);
      
      // Calculate rent with annual increase
      const rentGrowthFactor = Math.pow(1 + annualRentIncrease / 100, i);
      const grossRent = monthlyRent * 12 * rentGrowthFactor;
      
      // Calculate expenses with inflation
      const expenseGrowthFactor = Math.pow(1 + annualExpenseGrowth / 100, i);
      
      // Calculate property tax (based on property value)
      const propertyTax = propertyValue * (propertyTaxRate / 100);
      
      // Calculate insurance (based on property value)
      const insurance = propertyValue * (insuranceRate / 100);
      
      // Calculate maintenance (with inflation)
      const maintenance = maintenanceCost * expenseGrowthFactor;
      
      // Calculate property management (based on rent)
      const propertyManagement = grossRent * (propertyManagementRate / 100);
      
      // Calculate vacancy (based on rent)
      const vacancy = grossRent * (vacancyRate / 100);
      
      // Calculate tenant turnover costs based on a more realistic turnover model
      // Industry standard: Average tenant stays 2-3 years, so annual turnover probability is 33-50%
      // We'll use the configured turnoverFrequency or default to 2 years (50% annual turnover)
      const prepFees = propertyData.tenantTurnoverFees?.prepFees || 500;
      const realtorCommission = propertyData.tenantTurnoverFees?.realtorCommission || 0.5;
      const monthlyRentForYear = grossRent / 12;
      const inflatedPrepFees = prepFees * expenseGrowthFactor;
      
      // Get turnover frequency in years (default: 2 years)
      const turnoverFrequency = propertyData.longTermAssumptions?.turnoverFrequency || 2;
      // Calculate base turnover rate as 1/frequency (e.g., 1/2 = 50% annual turnover)
      const baseTurnoverRate = 1 / turnoverFrequency;
      
      // Adjust based on vacancy rate: higher vacancy = higher turnover
      // Vacancy rate adjustment factor: normalize around 5% vacancy
      const vacancyAdjustment = vacancyRate / 5;
      const turnoverRate = Math.min(0.9, baseTurnoverRate * vacancyAdjustment); // Cap at 90%
      
      // Calculate total turnover costs for the year
      // Each turnover costs: prep fees + (monthly rent * realtor commission)
      const turnoverCosts = (inflatedPrepFees + (monthlyRentForYear * realtorCommission)) * turnoverRate;
      
      // Capital improvements (only in year 1)
      const capitalImprovements = year === 1 ? capitalInvestments : 0;
      
      // Calculate effective gross income (rent minus vacancy)
      const effectiveGrossIncome = grossRent - vacancy;
      
      // Calculate operating expenses (total of all expenses except mortgage)
      // Note: Capital improvements are NOT included in operating expenses
      const operatingExpenses = propertyTax + insurance + maintenance + propertyManagement + vacancy + turnoverCosts;
      
      // Calculate NOI (effective gross income minus operating expenses except vacancy)
      const noi = effectiveGrossIncome - (propertyTax + insurance + maintenance + propertyManagement + turnoverCosts);
      
      // Debt service stays constant for fixed-rate mortgage
      const debtService = annualMortgage;
      
      // Calculate cash flow (NOI minus debt service)
      // Note: Capital improvements are treated as a separate cash outflow, not part of NOI
      const cashFlow = noi - debtService - capitalImprovements;
      
      console.log(`Year ${year} Detailed Calculation:`, {
        propertyValue: propertyValue.toFixed(2),
        grossRent: grossRent.toFixed(2),
        effectiveGrossIncome: effectiveGrossIncome.toFixed(2),
        expenses: {
          propertyTax: propertyTax.toFixed(2),
          insurance: insurance.toFixed(2),
          maintenance: maintenance.toFixed(2),
          propertyManagement: propertyManagement.toFixed(2),
          vacancy: vacancy.toFixed(2),
          turnoverCosts: turnoverCosts.toFixed(2),
          capitalImprovements: capitalImprovements.toFixed(2)
        },
        operatingExpenses: operatingExpenses.toFixed(2),
        noi: noi.toFixed(2),
        debtService: debtService.toFixed(2),
        cashFlow: cashFlow.toFixed(2)
      });
      
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
      const appreciation = i === 0 ? 0 : propertyValue - (purchasePrice * Math.pow(1 + annualPropertyValueIncrease / 100, i-1));
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
        turnoverCosts,
        capitalImprovements,
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
      turnoverCosts: 0,
      capitalImprovements: i === 0 ? 0 : 0,
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
        capitalInvestments: adaptedAnalysis.capitalInvestments || 0,
        longTermAssumptions: adaptedAnalysis.longTermAssumptions || {
          sellingCostsPercentage: 6
        }
      };
    }
    
    // Log the property data we're using
    logger.info('Updating exit analysis with property data:', {
      purchasePrice: propertyData.purchasePrice,
      downPayment: propertyData.downPayment,
      closingCosts: propertyData.closingCosts || 0,
      capitalInvestments: propertyData.capitalInvestments || 0,
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
    const totalInvestment = propertyData.downPayment + 
                          (propertyData.closingCosts || 0) + 
                          (propertyData.capitalInvestments || 0);
    
    console.log('Total Investment Components:', {
      downPayment: propertyData.downPayment,
      closingCosts: propertyData.closingCosts || 0,
      capitalInvestments: propertyData.capitalInvestments || 0,
      total: totalInvestment
    });
    
    // Calculate total cash flow with detailed logging
    let totalCashFlow = 0;
    console.log('Year-by-Year Cash Flow Breakdown:');
    projections.forEach((year, index) => {
      console.log(`Year ${year.year}: Cash Flow = ${year.cashFlow} (includes turnover: ${year.turnoverCosts || 0}, capex: ${year.capitalImprovements || 0})`);
      totalCashFlow += year.cashFlow;
    });
    console.log('Total Cash Flow (sum of all years):', totalCashFlow);
    
    const totalAppreciation = finalYear.propertyValue - propertyData.purchasePrice;
    const totalProfit = netProceedsFromSale;
    const returnOnInvestment = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    const totalReturn = totalCashFlow + netProceedsFromSale - totalInvestment;
    
    console.log('Final Return Calculations:', {
      totalCashFlow,
      netProceedsFromSale,
      totalInvestment,
      totalReturn,
      returnOnInvestment
    });
    
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
    
    // Calculate IRR using cash flows
    const cashFlows = [
      -totalInvestment,
      ...projections.map(year => year.cashFlow),
      netProceedsFromSale
    ];
    
    // Make sure we preserve the IRR value in longTermAnalysis.returns
    if (!adaptedAnalysis.longTermAnalysis.returns.irr || adaptedAnalysis.longTermAnalysis.returns.irr === 0) {
      console.log('Calculating IRR from cash flows for saved deal');
      // Import FinancialCalculations if needed
      try {
        const { FinancialCalculations } = require('../utils/financialCalculations');
        adaptedAnalysis.longTermAnalysis.returns.irr = FinancialCalculations.calculateIRR(cashFlows);
        console.log('Calculated IRR:', adaptedAnalysis.longTermAnalysis.returns.irr);
      } catch (error) {
        console.error('Error calculating IRR:', error);
        // If we can't calculate it, try to preserve the original value
        if (adaptedAnalysis.keyMetrics && adaptedAnalysis.keyMetrics.irr) {
          adaptedAnalysis.longTermAnalysis.returns.irr = adaptedAnalysis.keyMetrics.irr;
          console.log('Preserved original IRR value:', adaptedAnalysis.keyMetrics.irr);
        }
      }
    }
    
    // Validate consistency between calculated values
    validateAnalysisConsistency(adaptedAnalysis);
    
    logger.info('Updated exit analysis and returns based on projections');
  } catch (error) {
    logger.error('Error updating exit analysis and returns:', error);
  }
}

/**
 * Validates consistency between calculated values in the analysis
 * and fixes any inconsistencies found
 */
function validateAnalysisConsistency(analysis: any): void {
  try {
    if (!analysis.longTermAnalysis?.projections || 
        !Array.isArray(analysis.longTermAnalysis.projections) || 
        analysis.longTermAnalysis.projections.length === 0) {
      logger.warn('Cannot validate analysis consistency: projections missing or empty');
      return;
    }

    // Validate total cash flow
    const sumOfYearlyCashFlows = analysis.longTermAnalysis.projections.reduce(
      (sum: number, year: any) => sum + (year.cashFlow || 0), 0
    );
    
    if (analysis.longTermAnalysis.returns) {
      const totalCashFlowDiff = Math.abs(
        sumOfYearlyCashFlows - (analysis.longTermAnalysis.returns.totalCashFlow || 0)
      );
      
      if (totalCashFlowDiff > 1) { // Allow for small rounding differences
        logger.warn('Total cash flow inconsistency detected:', {
          sumOfYearlyCashFlows,
          reportedTotalCashFlow: analysis.longTermAnalysis.returns.totalCashFlow,
          difference: totalCashFlowDiff
        });
        
        // Fix the inconsistency
        analysis.longTermAnalysis.returns.totalCashFlow = sumOfYearlyCashFlows;
        logger.info('Fixed total cash flow inconsistency');
      }
    }

    // Validate property value appreciation
    const firstYear = analysis.longTermAnalysis.projections[0];
    const lastYear = analysis.longTermAnalysis.projections[analysis.longTermAnalysis.projections.length - 1];
    
    if (firstYear && lastYear && analysis.longTermAnalysis.returns) {
      const calculatedAppreciation = (lastYear.propertyValue || 0) - (firstYear.propertyValue || 0);
      const reportedAppreciation = analysis.longTermAnalysis.returns.totalAppreciation || 0;
      const appreciationDiff = Math.abs(calculatedAppreciation - reportedAppreciation);
      
      if (appreciationDiff > 1) { // Allow for small rounding differences
        logger.warn('Total appreciation inconsistency detected:', {
          calculatedAppreciation,
          reportedAppreciation,
          difference: appreciationDiff
        });
        
        // Fix the inconsistency
        analysis.longTermAnalysis.returns.totalAppreciation = calculatedAppreciation;
        logger.info('Fixed total appreciation inconsistency');
      }
    }
    
    // Validate total return calculation
    if (analysis.longTermAnalysis.returns && analysis.longTermAnalysis.exitAnalysis) {
      const propertyData = analysis.propertyData || {};
      const totalInvestment = (propertyData.downPayment || 0) + 
                             (propertyData.closingCosts || 0) + 
                             (propertyData.capitalInvestments || 0);
                             
      const totalCashFlow = analysis.longTermAnalysis.returns.totalCashFlow || 0;
      const netProceedsFromSale = analysis.longTermAnalysis.exitAnalysis.netProceedsFromSale || 0;
      const calculatedTotalReturn = totalCashFlow + netProceedsFromSale - totalInvestment;
      const reportedTotalReturn = analysis.longTermAnalysis.returns.totalReturn || 0;
      const totalReturnDiff = Math.abs(calculatedTotalReturn - reportedTotalReturn);
      
      if (totalReturnDiff > 1) { // Allow for small rounding differences
        logger.warn('Total return inconsistency detected:', {
          calculatedTotalReturn,
          reportedTotalReturn,
          difference: totalReturnDiff,
          components: {
            totalCashFlow,
            netProceedsFromSale,
            totalInvestment
          }
        });
        
        // Fix the inconsistency
        analysis.longTermAnalysis.returns.totalReturn = calculatedTotalReturn;
        logger.info('Fixed total return inconsistency');
      }
    }
  } catch (error) {
    logger.error('Error validating analysis consistency:', error);
  }
} 