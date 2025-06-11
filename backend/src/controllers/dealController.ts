import { Request, Response } from 'express';
import { dealService } from '../services/dealService';
import { logger } from '../utils/logger';
import { IDeal } from '../models/Deal';
// import { analyzeSFRProperty, analyzeMFProperty } from '../services/analysisService';
import { adaptAnalysisForFrontend } from '../utils/analysisAdapter';

// Mock implementations until proper TypeScript versions are created
// These will be replaced by actual implementations in the future
const analyzeSFRProperty = async (data: any) => {
  logger.info('Mock SFR analysis for data:', data);
  return { /* mock analysis structure */ };
};

const analyzeMFProperty = async (data: any) => {
  logger.info('Mock MF analysis for data:', data);
  return { /* mock analysis structure */ };
};

// Add user type extension for Request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Get all deals
 */
export const getAllDeals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user ID from auth middleware if available
    const userId = req.user?.id;
    const deals = await dealService.getAllDeals(userId);
    
    // Adapt analysis for each deal
    deals.forEach(deal => {
      if (deal.analysis) {
        deal.analysis = adaptAnalysisForFrontend(deal.analysis);
      }
    });
    
    logger.info(`Adapted analysis structures for ${deals.length} deals`);
    
    res.json(deals);
  } catch (error) {
    logger.error('Error getting all deals:', error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
};

/**
 * Get a specific deal by ID
 */
export const getDealById = async (req: Request, res: Response) => {
  try {
    console.log('\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('DEAL CONTROLLER: getDealById FUNCTION CALLED');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    const { id } = req.params;
    const deal = await dealService.getDealById(id);
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    logger.info('Deal loaded from database:', {
      id: deal._id,
      propertyName: deal.propertyName,
      hasAnalysis: !!deal.analysis
    });
    
    // Extract the deal as an object
    const dealObj = deal.toObject();
    
    // Assemble property data from the deal
    const propertyData = {
      purchasePrice: dealObj.purchasePrice,
      monthlyRent: dealObj.monthlyRent,
      downPayment: dealObj.downPayment,
      interestRate: dealObj.interestRate,
      loanTerm: dealObj.loanTerm,
      propertyTaxRate: dealObj.propertyTaxRate,
      insuranceRate: dealObj.insuranceRate,
      maintenanceCost: dealObj.maintenanceCost,
      propertyManagementRate: dealObj.propertyManagementRate,
      squareFootage: dealObj.squareFootage,
      closingCosts: dealObj.closingCosts,
      propertyType: dealObj.propertyType,
      propertyName: dealObj.propertyName,
      propertyAddress: dealObj.propertyAddress,
      longTermAssumptions: dealObj.longTermAssumptions || {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualPropertyValueIncrease: 3,
        inflationRate: 2,
        vacancyRate: 5,
        sellingCostsPercentage: 6
      }
    };
    
    // Extract key monthly analysis data if it exists
    let monthlyAnalysis = null;
    if (dealObj.analysis && dealObj.analysis.monthlyAnalysis) {
      const ma = dealObj.analysis.monthlyAnalysis;
      
      // Normalize expenses structure
      const expenses = ma.expenses || {};
      const mortgage = expenses.mortgage?.total || 0;
      const propertyTax = expenses.propertyTax || 0;
      const insurance = expenses.insurance || 0;
      const maintenance = expenses.maintenance || 0;
      const propertyManagement = expenses.propertyManagement || 0;
      const vacancy = expenses.vacancy || 0;
      
      // Calculate totals
      const totalExpenses = mortgage + propertyTax + insurance + maintenance + propertyManagement + vacancy;
      const cashFlow = (ma.income?.gross || dealObj.monthlyRent) - totalExpenses;
      
      monthlyAnalysis = {
        income: {
          gross: ma.income?.gross || dealObj.monthlyRent,
          effective: ma.income?.effective || dealObj.monthlyRent * (1 - (propertyData.longTermAssumptions.vacancyRate / 100))
        },
        expenses: {
          mortgage: { total: mortgage },
          propertyTax,
          insurance,
          maintenance,
          propertyManagement,
          vacancy,
          total: totalExpenses
        },
        cashFlow
      };
    } else {
      // Generate basic monthly analysis if missing
      const monthlyRent = dealObj.monthlyRent;
      const loanAmount = dealObj.purchasePrice - dealObj.downPayment;
      const interestRate = dealObj.interestRate / 100 / 12; // Monthly rate
      const totalPayments = dealObj.loanTerm * 12;
      
      // Calculate mortgage payment - P * r * (1+r)^n / ((1+r)^n - 1)
      let mortgage = 0;
      if (interestRate > 0) {
        mortgage = loanAmount * interestRate * Math.pow(1 + interestRate, totalPayments) / 
                  (Math.pow(1 + interestRate, totalPayments) - 1);
      } else {
        mortgage = loanAmount / totalPayments;
      }
      
      // Calculate other expenses
      const propertyTax = (dealObj.propertyTaxRate / 100) * dealObj.purchasePrice / 12;
      const insurance = (dealObj.insuranceRate / 100) * dealObj.purchasePrice / 12;
      const maintenance = dealObj.maintenanceCost || (monthlyRent * 0.05);
      const propertyManagement = monthlyRent * (dealObj.propertyManagementRate / 100);
      const vacancy = monthlyRent * (propertyData.longTermAssumptions.vacancyRate / 100);
      
      const totalExpenses = mortgage + propertyTax + insurance + maintenance + propertyManagement + vacancy;
      const cashFlow = monthlyRent - totalExpenses;
      
      monthlyAnalysis = {
        income: {
          gross: monthlyRent,
          effective: monthlyRent * (1 - (propertyData.longTermAssumptions.vacancyRate / 100))
        },
        expenses: {
          mortgage: { total: mortgage },
          propertyTax,
          insurance,
          maintenance,
          propertyManagement,
          vacancy,
          total: totalExpenses
        },
        cashFlow
      };
    }
    
    // Generate annual analysis
    const annualRent = monthlyAnalysis.income.gross * 12;
    const vacancyRate = propertyData.longTermAssumptions.vacancyRate / 100;
    const effectiveIncome = annualRent * (1 - vacancyRate);
    const annualOperatingExpenses = 
      (monthlyAnalysis.expenses.propertyTax + 
       monthlyAnalysis.expenses.insurance + 
       monthlyAnalysis.expenses.maintenance + 
       monthlyAnalysis.expenses.propertyManagement) * 12;
    
    // NOI is the effective income minus operating expenses (excluding mortgage)
    const annualNOI = effectiveIncome - annualOperatingExpenses;
    const annualDebtService = monthlyAnalysis.expenses.mortgage.total * 12;
    const annualCashFlow = annualNOI - annualDebtService;
    
    // Calculate metrics
    const totalInvestment = dealObj.downPayment + (dealObj.closingCosts || 0);
    const capRate = (annualNOI / dealObj.purchasePrice) * 100;
    const cashOnCash = (annualCashFlow / totalInvestment) * 100;
    const dscr = annualNOI / annualDebtService;
    
    const annualAnalysis = {
      income: annualRent,
      effectiveIncome: effectiveIncome,
      expenses: annualOperatingExpenses,
      noi: annualNOI,
      debtService: annualDebtService,
      cashFlow: annualCashFlow
    };
    
    const keyMetrics = {
      capRate,
      cashOnCash,
      dscr,
      totalInvestment,
      irr: dealObj.analysis?.keyMetrics?.irr || 0
    };
    
    // Generate projections from scratch, ignoring any existing projection data
    console.log('Completely regenerating projections for saved deal...');
    const years = propertyData.longTermAssumptions.projectionYears;
    const appreciationRate = propertyData.longTermAssumptions.annualPropertyValueIncrease;
    const rentGrowthRate = propertyData.longTermAssumptions.annualRentIncrease;
    const expenseGrowthRate = propertyData.longTermAssumptions.inflationRate;
    const purchasePrice = dealObj.purchasePrice;
    const loanAmount = purchasePrice - dealObj.downPayment;
    const interestRate = dealObj.interestRate;
    const loanTermYears = dealObj.loanTerm;
    
    // Log the property data we're using
    logger.info('Getting deal by ID:', id);
    
    // VERY CLEAR DEBUG OUTPUT FOR INFLATION ISSUE
    console.log('\n\n========== DEAL INFLATION DEBUG START ==========');
    console.log('Loading deal ID:', id);
    console.log('INFLATION RATE:', propertyData.longTermAssumptions.inflationRate, '%');
    
    // Print the beginning of the projections calculation
    // Generate projections
    const projections = Array.from({length: years}, (_, i) => {
      const year = i + 1;
      const appreciationFactor = Math.pow(1 + appreciationRate / 100, i);
      const rentGrowthFactor = Math.pow(1 + rentGrowthRate / 100, i);
      const expenseGrowthFactor = Math.pow(1 + expenseGrowthRate / 100, i);
      
      // Show debug output
      console.log(`### CONTROLLER: Year ${year} inflation factors:`, {
        appreciationFactor,
        rentGrowthFactor,
        expenseGrowthFactor
      });
      
      // Calculate property value with appreciation
      const propertyValue = purchasePrice * appreciationFactor;
      
      // Calculate rent with growth
      const grossRent = annualRent * rentGrowthFactor;
      
      // CRITICAL FIX: DIRECTLY CALCULATE EXPENSES WITH INFLATION
      const yearlyPropertyTax = year === 1 ? monthlyAnalysis.expenses.propertyTax * 12 :
        monthlyAnalysis.expenses.propertyTax * 12 * expenseGrowthFactor;
      
      const yearlyInsurance = year === 1 ? monthlyAnalysis.expenses.insurance * 12 :
        monthlyAnalysis.expenses.insurance * 12 * expenseGrowthFactor;
      
      const yearlyMaintenance = year === 1 ? monthlyAnalysis.expenses.maintenance * 12 :
        monthlyAnalysis.expenses.maintenance * 12 * expenseGrowthFactor;
      
      console.log(`### CONTROLLER: Year ${year} expenses:`, {
        propertyTax: yearlyPropertyTax,
        insurance: yearlyInsurance,
        maintenance: yearlyMaintenance,
        expenseGrowthFactor
      });
      
      // Property management and vacancy scale with rent (these are percentages of rent)
      const propertyManagement = grossRent * (dealObj.propertyManagementRate / 100);
      const vacancy = grossRent * (propertyData.longTermAssumptions.vacancyRate / 100);
      
      // Calculate operating expenses
      const operatingExpenses = yearlyPropertyTax + yearlyInsurance + yearlyMaintenance + propertyManagement + vacancy;
      
      // Calculate effective gross income (rent minus vacancy)
      const effectiveGrossIncome = grossRent - vacancy;
      
      // Calculate NOI (effective gross income minus operating expenses excluding vacancy)
      const noi = effectiveGrossIncome - (yearlyPropertyTax + yearlyInsurance + yearlyMaintenance + propertyManagement);
      
      // Debt service stays constant (fixed rate mortgage)
      const debtService = annualDebtService;
      
      // Calculate cash flow
      const cashFlow = noi - debtService;
      
      // Calculate mortgage balance
      const monthlyInterestRate = interestRate / 100 / 12;
      const totalPayments = loanTermYears * 12;
      const monthlyPayment = monthlyAnalysis.expenses.mortgage.total;
      
      let mortgageBalance = 0;
      if (i < loanTermYears) {
        const monthsPaid = i * 12;
        const remainingPayments = totalPayments - monthsPaid;
        
        if (monthlyInterestRate > 0) {
          mortgageBalance = monthlyPayment * (1 - Math.pow(1 + monthlyInterestRate, -remainingPayments)) / monthlyInterestRate;
        } else {
          mortgageBalance = monthlyPayment * remainingPayments;
        }
      }
      
      // Calculate equity
      const equity = propertyValue - mortgageBalance;
      
      // Calculate appreciation for this year
      const appreciation = i === 0 ? 0 : propertyValue - (purchasePrice * Math.pow(1 + appreciationRate / 100, i-1));
      
      // Calculate total return
      const totalReturn = cashFlow + appreciation;
      
      return {
        year,
        propertyValue,
        grossRent,
        grossIncome: grossRent,
        propertyTax: yearlyPropertyTax,
        insurance: yearlyInsurance,
        maintenance: yearlyMaintenance,
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
    
    // Calculate exit analysis
    const finalYear = projections[years-1];
    const sellingCostsPercent = propertyData.longTermAssumptions.sellingCostsPercentage;
    const projectedSalePrice = finalYear.propertyValue;
    const sellingCosts = projectedSalePrice * (sellingCostsPercent / 100);
    const mortgagePayoff = finalYear.mortgageBalance;
    const netProceedsFromSale = projectedSalePrice - sellingCosts - mortgagePayoff;
    
    // Calculate returns
    const totalCashFlow = projections.reduce((sum, year) => sum + year.cashFlow, 0);
    const totalAppreciation = finalYear.propertyValue - purchasePrice;
    const totalReturn = totalCashFlow + netProceedsFromSale - totalInvestment;
    const returnOnInvestment = (totalReturn / totalInvestment) * 100;
    
    // Calculate IRR
    // (This is a simplified approximation - for a real IRR calculation, we'd use the Newton-Raphson method)
    const irr = keyMetrics.irr || 0; // Using existing IRR or 0
    
    const exitAnalysis = {
      projectedSalePrice,
      sellingCosts,
      mortgagePayoff,
      netProceedsFromSale,
      totalProfit: netProceedsFromSale - totalInvestment,
      returnOnInvestment
    };
    
    const returns = {
      irr,
      totalCashFlow,
      totalAppreciation,
      totalReturn
    };
    
    // Assemble complete analysis
    const completeAnalysis = {
      monthlyAnalysis,
      annualAnalysis,
      keyMetrics,
      longTermAnalysis: {
        projections: JSON.parse(JSON.stringify(projections)), // Deep copy to prevent references
        projectionYears: years,
        returns,
        exitAnalysis
      },
      aiInsights: dealObj.analysis?.aiInsights || null
    };
    
    // Return the complete deal with recalculated analysis
    const responseDeal = {
      ...dealObj,
      analysis: completeAnalysis
    };
    
    // CRITICAL FIX: Ensure projections are not overwritten by storing a safe copy
    const originalProjections = JSON.parse(JSON.stringify(projections));
    
    // One final adaptation to ensure all calculations are consistent
    // This step is critical - use the adapter to ensure consistent inflation calculations
    const finalAdaptedAnalysis = adaptAnalysisForFrontend(responseDeal);
    
    // FINAL DATA CHECK - make sure projections haven't been overwritten
    if (finalAdaptedAnalysis.analysis?.longTermAnalysis?.projections) {
      const firstYear = finalAdaptedAnalysis.analysis.longTermAnalysis.projections[0];
      const lastYear = finalAdaptedAnalysis.analysis.longTermAnalysis.projections[9];
      
      // If projections look wrong (not inflated), restore from original
      if (Math.abs(firstYear.propertyTax - lastYear.propertyTax) < 1) {
        console.log('ERROR: PROJECTIONS INFLATION LOST - RESTORING FROM ORIGINAL CALCULATIONS');
        finalAdaptedAnalysis.analysis.longTermAnalysis.projections = originalProjections;
      }
    }
    
    // Simple, direct inflation check
    if (finalAdaptedAnalysis.analysis?.longTermAnalysis?.projections?.length > 0) {
      const year1 = finalAdaptedAnalysis.analysis.longTermAnalysis.projections[0];
      const year10 = finalAdaptedAnalysis.analysis.longTermAnalysis.projections[9];
      
      console.log('\n\n===== INFLATION CHECK =====');
      console.log('Inflation Rate:', propertyData.longTermAssumptions.inflationRate, '%');
      console.log('Year 1 PropertyTax:', year1.propertyTax);
      console.log('Year 10 PropertyTax:', year10.propertyTax);
      console.log('Inflation correctly applied?', year10.propertyTax > year1.propertyTax);
      console.log('Year 1 Insurance:', year1.insurance);
      console.log('Year 10 Insurance:', year10.insurance);
      console.log('Inflation correctly applied to insurance?', year10.insurance > year1.insurance);
      console.log('===========================\n\n');
    }
    
    logger.info('Returning deal with adapted analysis', {
      hasProjections: !!finalAdaptedAnalysis.analysis.longTermAnalysis.projections,
      projectionCount: finalAdaptedAnalysis.analysis.longTermAnalysis.projections.length,
      firstYearPropertyTax: finalAdaptedAnalysis.analysis.longTermAnalysis.projections[0]?.propertyTax,
      lastYearPropertyTax: finalAdaptedAnalysis.analysis.longTermAnalysis.projections[9]?.propertyTax,
      inflationRate: finalAdaptedAnalysis.longTermAssumptions?.inflationRate || 'unknown'
    });
    
    res.json(finalAdaptedAnalysis);
  } catch (error) {
    logger.error(`Error getting deal ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get deal' });
  }
};

/**
 * Get deals by property type
 */
export const getDealsByType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.params;
    
    if (type !== 'SFR' && type !== 'MF') {
      return res.status(400).json({ error: 'Invalid property type. Must be "SFR" or "MF"' });
    }
    
    // Get user ID from auth middleware if available
    const userId = req.user?.id;
    const deals = await dealService.getDealsByType(type, userId);
    res.json(deals);
  } catch (error) {
    logger.error(`Error getting ${req.params.type} deals:`, error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
};

/**
 * Create a new deal
 */
export const createDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Add user ID from auth middleware if available
    const dealData: Partial<IDeal> = {
      ...req.body,
      userId: req.user?.id
    };
    
    const deal = await dealService.saveDeal(dealData);
    res.status(201).json(deal);
  } catch (error) {
    logger.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
};

/**
 * Update an existing deal
 */
export const updateDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Add user ID and ID from params
    const dealData: Partial<IDeal> = {
      ...req.body,
      _id: id,
      userId: req.user?.id
    };
    
    const deal = await dealService.saveDeal(dealData);
    res.json(deal);
  } catch (error) {
    logger.error(`Error updating deal ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await dealService.deleteDeal(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting deal ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
};

/**
 * Analyze a deal without saving
 */
export const analyzeDeal = async (req: Request, res: Response) => {
  try {
    const { propertyType, ...dealData } = req.body;
    
    if (propertyType !== 'SFR' && propertyType !== 'MF') {
      return res.status(400).json({ error: 'Invalid property type. Must be "SFR" or "MF"' });
    }
    
    let analysis;
    if (propertyType === 'SFR') {
      analysis = await analyzeSFRProperty(dealData);
    } else {
      analysis = await analyzeMFProperty(dealData);
    }
    
    // Adapt the analysis to the frontend-expected format
    const adaptedAnalysis = adaptAnalysisForFrontend(analysis);
    
    // Log the adaptation
    logger.info('Analysis structure adapted for frontend compatibility');
    
    res.json(adaptedAnalysis);
  } catch (error) {
    logger.error('Error analyzing deal:', error);
    res.status(500).json({ error: 'Failed to analyze deal' });
  }
}; 