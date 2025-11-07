console.log('Deals controller loaded from file:', __filename);
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SFRAnalyzer } from '../analysis';
import { SFRData, MultiFamilyData } from '../types/propertyTypes';
import { MultiFamilyAnalyzer } from '../analysis/MultiFamilyAnalyzer';
import { DealService } from '../services/dealService';
import { logger } from '../utils/logger';
import { AnalysisAssumptions } from '../analysis/BasePropertyAnalyzer';
// Removed unused propertyEnrichmentService imports

// Initialize the deal service
const dealService = new DealService();

// Import our enhanced AI service and caching
import { getAIInsights, getFastAIPredictions } from '../services/aiService';
import { AIInsightsCacheService } from '../services/aiInsightsCacheService';

// Import Investment Decision Engine
import { InvestmentDecisionEngine } from '../services/investment/investmentDecisionEngine';
import { MFDecisionEngine } from '../services/investment/MFDecisionEngine';

// Import AI Goal Analysis
import { analyzeInvestmentGoals, EnhancedGoalContext } from '../services/aiService';

/**
 * Generate portfolio context for investment decision enhancement
 * SAFE: This is an optional enhancement that doesn't affect core analysis
 */
async function generatePortfolioContext(portfolioId: string, analysis: any) {
  try {
    logger.info('generatePortfolioContext: Starting with portfolioId:', portfolioId);
    
    // Import services dynamically to avoid circular dependencies
    const { portfolioService } = require('../services/portfolio/portfolioService');
    const { portfolioAnalyticsService } = require('../services/portfolio/portfolioAnalyticsService');
    
    logger.info('generatePortfolioContext: Services imported successfully');
    
    // Fetch portfolio details
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    logger.info('generatePortfolioContext: Portfolio lookup result:', {
      portfolioFound: !!portfolio,
      portfolioName: portfolio?.name,
      portfolioGoal: portfolio?.goals?.primaryGoal
    });
    
    if (!portfolio) {
      logger.warn('Portfolio not found for ID:', portfolioId);
      return null;
    }
    
    // Get current portfolio analytics
    const analytics = await portfolioAnalyticsService.calculatePortfolioAnalytics(portfolioId);
    
    logger.info('generatePortfolioContext: Portfolio analytics calculated:', {
      portfolioId,
      analyticsExists: !!analytics,
      hasSummary: !!analytics?.summary,
      totalProperties: analytics?.summary?.totalProperties || 0,
      monthlyNetCashFlow: analytics?.summary?.monthlyNetCashFlow || 0,
      totalValue: analytics?.summary?.totalValue || 0
    });
    
    // Extract property cash flow for smart messaging
    const monthlyCashFlow = analysis?.monthlyAnalysis?.cashFlow || 0;
    const portfolioGoal = portfolio.goals?.primaryGoal || 'BALANCED';
    
    // Generate smart impact summary based on portfolio goal and property cash flow
    let impactSummary = '';
    const capRate = analysis?.keyMetrics?.capRate || 0;
    const cashOnCashReturn = analysis?.keyMetrics?.cashOnCashReturn || 0;
    const totalInvestment = analysis?.financing?.totalInvestment || 0;
    
    if (portfolioGoal === 'CASH_FLOW') {
      if (monthlyCashFlow > 500) {
        impactSummary = `Excellent addition! This property generates $${Math.round(monthlyCashFlow)}/month, significantly boosting your portfolio's cash flow.`;
      } else if (monthlyCashFlow > 0) {
        impactSummary = `Supports your cash flow objectives with $${Math.round(monthlyCashFlow)}/month in positive returns.`;
      } else if (monthlyCashFlow > -200) {
        impactSummary = `Minor negative cash flow of $${Math.round(Math.abs(monthlyCashFlow))}/month. Consider negotiating price or exploring expense reductions.`;
      } else {
        impactSummary = `Warning: Negative cash flow of $${Math.round(Math.abs(monthlyCashFlow))}/month conflicts with your cash flow goals. This property may drain your portfolio.`;
      }
    } else if (portfolioGoal === 'WEALTH_BUILDING') {
      if (capRate > 8) {
        impactSummary = `Strong wealth builder with ${capRate.toFixed(1)}% cap rate. Excellent appreciation and income combination.`;
      } else {
        impactSummary = `Contributes to wealth building with ${capRate.toFixed(1)}% cap rate and long-term appreciation potential.`;
      }
    } else if (portfolioGoal === 'ESTATE_BUILDING') {
      impactSummary = `Adds to your estate portfolio. With ${cashOnCashReturn.toFixed(1)}% cash-on-cash return, this property builds generational wealth.`;
    } else if (portfolioGoal === 'TAX_BENEFITS') {
      impactSummary = `Provides depreciation and expense deductions. Initial investment of $${(totalInvestment/1000).toFixed(0)}K offers substantial tax advantages.`;
    } else if (portfolioGoal === 'HOUSE_HACKING') {
      if (monthlyCashFlow > 0) {
        impactSummary = `Perfect for house hacking! Living here while renting other units generates $${Math.round(monthlyCashFlow)}/month.`;
      } else {
        impactSummary = `House hacking opportunity: Live for reduced cost while building equity. Net cost: $${Math.round(Math.abs(monthlyCashFlow))}/month.`;
      }
    } else if (portfolioGoal === 'GEOGRAPHIC_DIVERSIFICATION') {
      impactSummary = `Expands your geographic footprint, reducing market concentration risk while generating ${monthlyCashFlow > 0 ? '$' + Math.round(monthlyCashFlow) + '/month' : 'long-term appreciation'}.`;
    } else {
      // BALANCED or fallback
      if (monthlyCashFlow > 0 && capRate > 6) {
        impactSummary = `Well-balanced addition with $${Math.round(monthlyCashFlow)}/month cash flow and ${capRate.toFixed(1)}% cap rate.`;
      } else {
        impactSummary = `Adds diversification to your portfolio. Consider your overall strategy alignment.`;
      }
    }
    
    // Generate fitAnalysis based on actual property metrics
    let fitAnalysis = '';
    const currentPortfolioSize = analytics?.summary?.totalProperties || 0;
    
    if (currentPortfolioSize === 0) {
      fitAnalysis = 'This would be your first property - a great start to building your real estate portfolio!';
    } else if (monthlyCashFlow > 0 && capRate > 7) {
      fitAnalysis = `Strong performer that enhances your portfolio with ${capRate.toFixed(1)}% cap rate and positive cash flow.`;
    } else if (monthlyCashFlow > 0) {
      const roundedCashFlow = Math.round(monthlyCashFlow * 100) / 100;
      fitAnalysis = `Cash flow positive addition generating $${roundedCashFlow.toFixed(2)}/month that complements your existing ${currentPortfolioSize} propert${currentPortfolioSize === 1 ? 'y' : 'ies'}.`;
    } else if (capRate > 8) {
      fitAnalysis = `High-yield opportunity with ${capRate.toFixed(1)}% cap rate, despite initial negative cash flow.`;
    } else {
      fitAnalysis = `Adds geographic and asset diversity to your portfolio of ${currentPortfolioSize} propert${currentPortfolioSize === 1 ? 'y' : 'ies'}.`;
    }
    
    // Create portfolio context object following Data Dictionary structure
    const portfolioContext = {
      portfolioName: portfolio.name,
      portfolioGoal: portfolioGoal,
      currentProperties: analytics?.summary?.totalProperties || 0,
      monthlyNetCashFlow: analytics?.summary?.monthlyNetCashFlow || 0,
      totalValue: analytics?.summary?.totalValue || 0,
      fitAnalysis: fitAnalysis,
      impactSummary: impactSummary
    };
    
    logger.info('generatePortfolioContext: Generated final context:', {
      portfolioId,
      portfolioName: portfolio.name,
      currentProperties: portfolioContext.currentProperties,
      monthlyNetCashFlow: portfolioContext.monthlyNetCashFlow,
      portfolioGoal,
      monthlyCashFlow,
      fitAnalysis: portfolioContext.fitAnalysis,
      impactSummary: portfolioContext.impactSummary,
      fullContext: portfolioContext
    });
    
    return portfolioContext;
    
  } catch (error) {
    logger.error('Error generating portfolio context:', error);
    return null;
  }
}

// Helper function to convert wizard data to standard format
const convertWizardData = (dealData: any): any => {
  // Check if this is wizard data and convert it
  const isWizardData = dealData._isWizardData || 
                      dealData.maintenanceReservePercentage !== undefined || 
                      dealData.vacancyRate !== undefined ||
                      dealData.downPaymentPercentage !== undefined;
  
  if (!isWizardData) {
    logger.info('Data is not wizard format, returning as-is');
    return dealData;
  }

  logger.info('=== WIZARD DATA CONVERSION ===');
  logger.info('Detected wizard data, converting to standard format');
  logger.info('Full incoming dealData keys:', Object.keys(dealData));
  
  const wizardDataInfo = {
    maintenanceReservePercentage: dealData.maintenanceReservePercentage,
    vacancyRate: dealData.vacancyRate,
    monthlyRent: dealData.monthlyRent,
    _isWizardData: dealData._isWizardData,
    existingMaintenanceCost: dealData.maintenanceCost
  };
  logger.info('Wizard data received:', JSON.stringify(wizardDataInfo, null, 2));
  
  // Calculate maintenance cost from percentage
  let maintenanceCost = dealData.maintenanceCost || 0;
  logger.info('Initial maintenanceCost value:', maintenanceCost);
  
  if (dealData.maintenanceReservePercentage && dealData.monthlyRent) {
    const calculatedCost = Math.round((dealData.monthlyRent * dealData.maintenanceReservePercentage / 100) * 12);
    logger.info('Maintenance calculation:', {
      hasPercentage: !!dealData.maintenanceReservePercentage,
      hasMonthlyRent: !!dealData.monthlyRent,
      monthlyRent: dealData.monthlyRent,
      percentage: dealData.maintenanceReservePercentage,
      rawCalculation: (dealData.monthlyRent * dealData.maintenanceReservePercentage / 100) * 12,
      roundedCalculation: calculatedCost,
      formula: `(${dealData.monthlyRent} * ${dealData.maintenanceReservePercentage} / 100) * 12 = ${calculatedCost}`
    });
    maintenanceCost = calculatedCost;
  } else {
    logger.warn('Cannot calculate maintenance cost:', {
      hasPercentage: !!dealData.maintenanceReservePercentage,
      hasMonthlyRent: !!dealData.monthlyRent,
      percentageValue: dealData.maintenanceReservePercentage,
      monthlyRentValue: dealData.monthlyRent
    });
  }
  
  logger.info('Final maintenanceCost before assignment:', maintenanceCost);
  
  // Convert wizard data to standard format
  const convertedData = {
    ...dealData,
    maintenanceCost: maintenanceCost,
    longTermAssumptions: {
      ...dealData.longTermAssumptions,
      vacancyRate: dealData.vacancyRate || dealData.longTermAssumptions?.vacancyRate || 5
    },
    // Add metadata to track data source
    _dataSource: {
      isWizardData: true,
      calculatedFields: ['maintenanceCost'],
      userFields: Object.keys(dealData).filter(key => 
        !['maintenanceReservePercentage', 'downPaymentPercentage', 'closingCostPercentage', '_isWizardData'].includes(key)
      )
    }
  };
  
  logger.info('After data conversion:', {
    maintenanceCost: convertedData.maintenanceCost,
    maintenanceCostType: typeof convertedData.maintenanceCost,
    dataSource: convertedData._dataSource
  });
  
  // Remove wizard-specific fields
  delete convertedData.maintenanceReservePercentage;
  delete convertedData.downPaymentPercentage;
  delete convertedData.closingCostPercentage;
  delete convertedData._isWizardData;
  
  logger.info('Wizard data converted successfully');
  logger.info('=== END WIZARD DATA CONVERSION ===');
  
  return convertedData;
};

// Utility function to get AI insights - now using enhanced service
const generateAIInsights = async (dealData: SFRData | MultiFamilyData, analysis: any) => {
  const startTime = Date.now();
  
  try {
    // Layer 2: Check for cached AI insights first
    logger.info('Checking AI insights cache...');
    const cached = await AIInsightsCacheService.getCachedInsights(dealData);
    
    if (cached) {
      const cacheAge = (Date.now() - cached.timestamp) / (1000 * 60); // minutes
      logger.info('Using cached AI insights', {
        cacheAge: `${cacheAge.toFixed(1)} minutes`,
        originalGenerationTime: cached.performanceMetrics.generationTime,
        modelUsed: cached.performanceMetrics.modelUsed,
        retrievalTime: Date.now() - startTime
      });
      return cached.insights;
    }

    // Generate fresh AI insights
    logger.info('Generating fresh AI insights...');
    const insights = await getAIInsights(dealData, analysis);
    const generationTime = Date.now() - startTime;

    // Cache the results for future use
    await AIInsightsCacheService.cacheInsights(dealData, insights, {
      generationTime,
      modelUsed: 'gpt-4o-mini', // or detect from aiService
      tokensUsed: undefined // would need to be returned from aiService
    });

    logger.info('AI insights generated and cached', {
      generationTime,
      insightsLength: JSON.stringify(insights).length
    });

    return insights;
  } catch (error) {
    logger.error('Error getting AI insights:', error);
    return {
      summary: "Error generating AI insights. Please try again later.",
      strengths: [],
      weaknesses: [],
      recommendations: [],
      investmentScore: 0
    };
  }
};

// Get all deals
export const getAllDeals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const deals = await dealService.getAllDeals(userId);
    res.json(deals);
  } catch (error) {
    logger.error('Error getting all deals:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

// Get a single deal by ID
export const getDealById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const { id } = req.params;
    logger.info(`getDealById: Looking for deal ${id} for user ${userId}`);
    
    const deal = await dealService.getDealById(id);
    
    // Log deal details for debugging
    if (deal) {
      logger.info(`getDealById: Found deal ${id}`, {
        dealId: deal._id,
        dealUserId: deal.userId?.toString(),
        requestUserId: userId,
        dealProperty: deal.propertyName || 'No name',
        ownershipMatch: deal.userId?.toString() === userId
      });
    } else {
      logger.warn(`getDealById: No deal found with ID ${id}`);
    }
    
    // Verify ownership
    if (!deal || deal.userId?.toString() !== userId) {
      logger.warn(`getDealById: Access denied for deal ${id}`, {
        dealExists: !!deal,
        dealUserId: deal?.userId?.toString(),
        requestUserId: userId
      });
      res.status(404).json({ error: 'Deal not found' });
      return;
    }
    
    logger.info(`Loading deal ${id} - returning saved data with complete analysis`);
    
    // Return the complete saved deal (data should be complete after Phase 1 fix)
    const dealData = deal.toObject();
    
    // Validate that saved deal has complete analysis structure
    if (!dealData.analysis) {
      logger.error(`Deal ${id} missing analysis data - may need regeneration`);
      res.status(422).json({ 
        error: 'Deal missing analysis data. Please regenerate this deal.',
        needsRegeneration: true 
      });
      return;
    }
    
    // Log what we're returning for debugging
    logger.info(`Deal ${id} loaded successfully:`, {
      hasAnalysis: !!dealData.analysis,
      hasMonthlyAnalysis: !!dealData.analysis?.monthlyAnalysis,
      hasAnnualAnalysis: !!dealData.analysis?.annualAnalysis,
      hasKeyMetrics: !!dealData.analysis?.keyMetrics,
      hasLongTermAnalysis: !!dealData.analysis?.longTermAnalysis,
      hasInvestmentDecision: !!dealData.analysis?.investmentDecision,
      hasPortfolioContext: !!dealData.analysis?.investmentDecision?.portfolioContext,
      portfolioContextData: dealData.analysis?.investmentDecision?.portfolioContext,
      aiScore: dealData.analysis?.aiInsights?.investmentScore,
      dataSource: dealData._dataSource || 'legacy',
      hasTotalInvestment: !!dealData.analysis?.keyMetrics?.totalInvestment,
      // TAX INTELLIGENCE DEBUGGING
      hasTaxAnalysis: !!(dealData.analysis as any)?.investmentDecision?.taxAnalysis,
      taxAnalysisKeys: (dealData.analysis as any)?.investmentDecision?.taxAnalysis ? Object.keys((dealData.analysis as any).investmentDecision.taxAnalysis) : [],
      optimalHoldPeriod: (dealData.analysis as any)?.investmentDecision?.taxAnalysis?.optimalHoldPeriod,
      taxSavings: (dealData.analysis as any)?.investmentDecision?.taxAnalysis?.totalTaxSavingsAtOptimal,
      holdPeriodAnalysisCount: (dealData.analysis as any)?.investmentDecision?.taxAnalysis?.holdPeriodAnalysis?.length || 0
    });
    
    res.json(dealData);
  } catch (error) {
    logger.error(`Error getting deal ${req.params.id}:`, error);
    if (error instanceof Error) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

// Create a new deal
export const createDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user?.id) {
      logger.error('[CreateDeal] No user ID found - authentication required');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Convert wizard data to standard format before saving
    const rawDealData = {
      ...req.body,
      userId: req.user.id // Add userId from authenticated user
    };
    
    // Extract portfolioId from either top level or from analysis object
    const portfolioId = rawDealData.portfolioId || rawDealData.analysis?.portfolioId || null;
    
    const dealData = convertWizardData(rawDealData);
    
    // Ensure portfolioId is at the top level of dealData
    if (portfolioId) {
      dealData.portfolioId = portfolioId;
      logger.info('Including portfolioId in deal:', portfolioId);
    }

    // Auto-generate property name if empty (common with wizard flow)
    if (!dealData.propertyName || dealData.propertyName.trim() === '') {
      if (dealData.propertyAddress) {
        // Extract street number from address (e.g., "123" from "123 Main St")
        const streetNumber = dealData.propertyAddress.street.split(' ')[0];
        dealData.propertyName = `${streetNumber} ${dealData.propertyAddress.city}`;
      } else {
        dealData.propertyName = `${dealData.propertyType} Property - ${new Date().toLocaleDateString()}`;
      }
      logger.info('Auto-generated property name:', dealData.propertyName);
    }

    logger.info('Creating deal with data:', {
      propertyName: dealData.propertyName,
      propertyType: dealData.propertyType,
      hasAnalysis: !!dealData.analysis,
      userId: dealData.userId,
      portfolioId: dealData.portfolioId,
      hasPortfolioId: !!dealData.portfolioId,
      bodyKeys: Object.keys(dealData)
    });
    
    // Log the full data for debugging
    logger.info('Full deal data:', JSON.stringify(dealData));
    
    // Log investment score specifically
    if (dealData.analysis?.aiInsights) {
      logger.info('Investment score being saved:', {
        investmentScore: dealData.analysis.aiInsights.investmentScore,
        hasScore: typeof dealData.analysis.aiInsights.investmentScore === 'number',
        scoreType: typeof dealData.analysis.aiInsights.investmentScore,
        isZero: dealData.analysis.aiInsights.investmentScore === 0,
        isNull: dealData.analysis.aiInsights.investmentScore === null,
        isUndefined: dealData.analysis.aiInsights.investmentScore === undefined,
        aiInsightsKeys: Object.keys(dealData.analysis.aiInsights)
      });
    } else {
      logger.warn('No aiInsights found in analysis during save');
    }

    // TAX INTELLIGENCE SAVE DEBUGGING
    const saveTaxAnalysis = (dealData.analysis as any)?.investmentDecision?.taxAnalysis;
    if (saveTaxAnalysis) {
      logger.info('🔍 TAX SAVE DEBUG - Tax analysis being saved:', {
        hasTaxAnalysis: true,
        optimalHoldPeriod: saveTaxAnalysis.optimalHoldPeriod,
        taxSavings: saveTaxAnalysis.totalTaxSavingsAtOptimal,
        holdPeriodCount: saveTaxAnalysis.holdPeriodAnalysis?.length || 0,
        userState: saveTaxAnalysis.userTaxProfile?.state,
        taxAnalysisKeys: Object.keys(saveTaxAnalysis)
      });
    } else {
      logger.warn('🔍 TAX SAVE DEBUG - No tax analysis found in deal data being saved');
      logger.info('🔍 TAX SAVE DEBUG - Available analysis keys:', {
        hasAnalysis: !!dealData.analysis,
        hasInvestmentDecision: !!(dealData.analysis as any)?.investmentDecision,
        investmentDecisionKeys: (dealData.analysis as any)?.investmentDecision ? Object.keys((dealData.analysis as any).investmentDecision) : []
      });
    }
    
    const newDeal = await dealService.saveDeal(dealData);
    logger.info('Deal created successfully:', {
      id: newDeal._id,
      propertyName: newDeal.propertyName,
      portfolioId: newDeal.portfolioId,
      hasPortfolioId: !!newDeal.portfolioId
    });
    
    // Log what investment score was actually saved to the database
    if (newDeal.analysis?.aiInsights) {
      logger.info('Investment score actually saved to DB:', {
        investmentScore: newDeal.analysis.aiInsights.investmentScore,
        hasScore: typeof newDeal.analysis.aiInsights.investmentScore === 'number',
        scoreType: typeof newDeal.analysis.aiInsights.investmentScore
      });
    } else {
      logger.warn('No aiInsights found in saved deal');
    }

    // TAX INTELLIGENCE POST-SAVE VERIFICATION
    const taxAnalysis = (newDeal.analysis as any)?.investmentDecision?.taxAnalysis;
    if (taxAnalysis) {
      logger.info('🔍 TAX SAVE VERIFY - Tax analysis successfully saved to DB:', {
        hasTaxAnalysis: true,
        optimalHoldPeriod: taxAnalysis.optimalHoldPeriod,
        taxSavings: taxAnalysis.totalTaxSavingsAtOptimal,
        holdPeriodCount: taxAnalysis.holdPeriodAnalysis?.length || 0,
        taxAnalysisKeys: Object.keys(taxAnalysis),
        dealId: newDeal._id
      });
    } else {
      logger.error('🔍 TAX SAVE VERIFY - Tax analysis NOT found in saved deal!', {
        dealId: newDeal._id,
        hasAnalysis: !!newDeal.analysis,
        hasInvestmentDecision: !!(newDeal.analysis as any)?.investmentDecision,
        investmentDecisionKeys: (newDeal.analysis as any)?.investmentDecision ? Object.keys((newDeal.analysis as any).investmentDecision) : []
      });
    }
    
    res.status(201).json(newDeal);
  } catch (error) {
    logger.error('Error creating deal:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

// Update an existing deal
export const updateDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const { id } = req.params;
    
    logger.info(`🔍 UPDATE DEAL REQUEST for ID: ${id}`);
    logger.info(`🔍 Request body preview:`, {
      hasAnalysis: !!req.body.analysis,
      propertyName: req.body.propertyName,
      purchasePrice: req.body.purchasePrice,
      bodyKeysCount: Object.keys(req.body).length
    });
    
    // Check if deal exists in Deal collection
    const existingDeal = await dealService.getDealById(id);
    
    // If not found in Deal collection, check Pipeline collection
    let isPipelineDeal = false;
    let existingPipelineDeal = null;
    
    if (!existingDeal) {
      // Try to find in Pipeline collection
      const pipelineService = require('../services/pipeline/pipelineService').pipelineService;
      try {
        existingPipelineDeal = await pipelineService.getDealById(userId, id);
        if (existingPipelineDeal) {
          isPipelineDeal = true;
          logger.info(`🎯 Found Pipeline deal ${id}, will update Pipeline collection`);
        } else {
          logger.info(`❌ Deal ${id} not found in Pipeline collection either`);
        }
      } catch (err) {
        logger.error(`Error checking Pipeline collection for deal ${id}:`, err);
        // Pipeline deal not found either
      }
    }
    
    // If neither exists, create new deal
    if (!existingDeal && !existingPipelineDeal) {
      logger.warn(`Deal ${id} not found in either collection, creating new deal instead`);
      const dealData = {
        ...req.body,
        userId,
        _id: undefined // Remove the ID so it gets a new one
      };
      
      const newDeal = await dealService.saveDeal(dealData);
      logger.info('Deal created successfully:', {
        id: newDeal._id,
        propertyName: newDeal.propertyName
      });
      
      res.json(newDeal);
      return;
    }
    
    // Verify ownership
    const dealForVerification = existingDeal || existingPipelineDeal;
    if (dealForVerification?.userId?.toString() !== userId) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }
    
    const dealData = req.body;
    
    // Preserve portfolioId if it exists (from either top level or analysis object)
    const portfolioId = dealData.portfolioId || dealData.analysis?.portfolioId || dealForVerification?.portfolioId || null;
    if (portfolioId) {
      dealData.portfolioId = portfolioId;
    }
    
    // Debug: Check what data we're receiving
    logger.info(`🔍 Deal update debug:`, {
      dealId: id,
      hasAnalysis: !!dealData.analysis,
      hasInvestmentDecision: !!dealData.analysis?.investmentDecision,
      analysisKeys: dealData.analysis ? Object.keys(dealData.analysis) : 'no analysis',
      bodyKeys: Object.keys(dealData)
    });

    // If this deal has analysis results, update Pipeline-specific fields
    if (dealData.analysis && dealData.analysis.investmentDecision) {
      const analysis = dealData.analysis;
      
      // Extract input values from the original deal data (not analysis results)
      // Following DATA_MAPPING.md guidelines for proper field extraction
      const extractedInputs = {
        monthlyRent: dealData.monthlyRent || dealData.rentalIncome || 0,
        monthlyExpenses: dealData.totalMonthlyExpenses || 
                        (dealData.propertyTaxRate + dealData.insuranceRate + dealData.maintenanceCost + dealData.propertyManagementRate) / 12 || 
                        dealData.monthlyOperatingExpenses || 0,
        downPayment: dealData.downPayment || 0,
        interestRate: dealData.interestRate || 7.0,
        loanTermYears: dealData.loanTerm || 30
      };
      
      logger.info(`📊 Extracting input values for Skinny Calculator:`, {
        monthlyRent: extractedInputs.monthlyRent,
        monthlyExpenses: extractedInputs.monthlyExpenses,
        downPayment: extractedInputs.downPayment,
        interestRate: extractedInputs.interestRate,
        loanTermYears: extractedInputs.loanTermYears,
        purchasePrice: dealData.purchasePrice,
        askingPrice: dealData.askingPrice
      });
      
      // Update Pipeline quick metrics from analysis results
      dealData.quickMetrics = {
        dealQuality: analysis.investmentDecision.professionalAssessment?.dealQuality,
        verdict: analysis.investmentDecision.verdict,
        monthlyCashFlow: analysis.cashFlow?.monthlyCashFlow,
        monthlyIncome: analysis.rentalIncome?.monthly,
        capRate: analysis.keyMetrics?.capRate,
        cashOnCashReturn: analysis.keyMetrics?.cashOnCashReturn,
        inputValues: extractedInputs
      };
      
      // Update analysis status
      dealData.analysisStatus = 'COMPLETE';
      dealData.analysisId = dealData._id || id;
      
      // Update confidence to level 3 for complete analysis
      dealData.confidence = {
        level: 3,
        lastUpdated: new Date().toISOString(),
        dataSource: 'FULL_ANALYSIS',
        calculationMethod: 'FULL_SFR'
      };
      
      // Update asking price if purchase price was changed
      if (dealData.purchasePrice) {
        dealData.askingPrice = dealData.purchasePrice;
      }
      
      logger.info(`🎯 Updated Pipeline quick metrics:`, {
        dealId: id,
        dealQuality: dealData.quickMetrics.dealQuality,
        verdict: dealData.quickMetrics.verdict,
        monthlyCashFlow: dealData.quickMetrics.monthlyCashFlow,
        analysisStatus: dealData.analysisStatus,
        askingPrice: dealData.askingPrice,
        confidenceLevel: dealData.confidence.level,
        confidenceSource: dealData.confidence.dataSource,
        updatedAt: new Date().toISOString()
      });
    } else {
      logger.warn(`⚠️ No analysis data found to update Pipeline fields for deal ${id}`);
      
      // Check if we can still update basic fields like asking price
      if (dealData.purchasePrice) {
        dealData.askingPrice = dealData.purchasePrice;
        logger.info(`📝 Updated asking price to ${dealData.purchasePrice}`);
      }
    }

    logger.info(`Updating deal ${id} with data:`, {
      propertyName: dealData.propertyName,
      propertyType: dealData.propertyType,
      hasAnalysis: !!dealData.analysis,
      portfolioId: dealData.portfolioId,
      hasPortfolioId: !!dealData.portfolioId,
      bodyKeys: Object.keys(dealData),
      hasQuickMetrics: !!dealData.quickMetrics,
      analysisStatus: dealData.analysisStatus
    });
    
    // Log the full data for debugging
    logger.info('Full update data:', JSON.stringify(dealData));
    
    // Update the deal using appropriate service
    let updatedDeal;
    
    if (isPipelineDeal) {
      // Update Pipeline deal
      const pipelineService = require('../services/pipeline/pipelineService').pipelineService;
      updatedDeal = await pipelineService.updateDeal(userId, id, dealData);
      logger.info('Pipeline deal updated successfully:', {
        id: updatedDeal._id,
        propertyName: updatedDeal.dealName || updatedDeal.propertyName,
        askingPrice: updatedDeal.askingPrice,
        analysisStatus: updatedDeal.analysisStatus
      });
    } else {
      // Update regular deal
      dealData._id = id;
      updatedDeal = await dealService.saveDeal(dealData);
      logger.info('Deal updated successfully:', {
        id: updatedDeal._id,
        propertyName: updatedDeal.propertyName
      });
    }
    
    res.json(updatedDeal);
  } catch (error) {
    logger.error(`Error updating deal ${req.params.id}:`, error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

// Delete a deal
export const deleteDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const { id } = req.params;
    
    // Verify ownership before deleting
    const existingDeal = await dealService.getDealById(id);
    if (!existingDeal || existingDeal.userId?.toString() !== userId) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }
    
    logger.info(`Starting cascade deletion for deal ${id}`);
    
    // CASCADE DELETE: Clean up related records
    try {
      // 1. Remove from any portfolios that contain this property
      const portfolioService = require('../services/portfolio/portfolioService').portfolioService;
      await portfolioService.removePropertyFromAllPortfolios(userId, id);
      logger.info(`Removed deal ${id} from all portfolios`);
    } catch (error) {
      logger.warn(`Failed to remove deal ${id} from portfolios:`, error);
      // Continue with deletion even if portfolio cleanup fails
    }
    
    try {
      // 2. Unlink or delete pipeline deals that reference this analysis
      const pipelineService = require('../services/pipeline/pipelineService').pipelineService;
      await pipelineService.unlinkAnalysisFromAllDeals(userId, id);
      logger.info(`Unlinked analysis ${id} from all pipeline deals`);
    } catch (error) {
      logger.warn(`Failed to unlink analysis ${id} from pipeline deals:`, error);
      // Continue with deletion even if pipeline cleanup fails
    }
    
    // 3. Delete the main deal record
    await dealService.deleteDeal(id);
    logger.info(`Successfully deleted deal ${id} with cascade cleanup`);
    
    res.status(204).end();
  } catch (error) {
    logger.error(`Error deleting deal ${req.params.id}:`, error);
    if (error instanceof Error) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

// Analyze a deal
export const analyzeDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let dealData = req.body;
    
    // DEBUG: Log the incoming request data
    logger.info('ANALYZE REQUEST DEBUG:', {
      hasPortfolioId: !!dealData.portfolioId,
      portfolioId: dealData.portfolioId,
      propertyName: dealData.propertyName,
      requestKeys: Object.keys(dealData)
    });
    
    // Convert wizard data to standard format using shared helper function
    dealData = convertWizardData(dealData);
    
    // Log detailed information about the request
    logger.info('Analyzing property:', {
      propertyType: dealData.propertyType,
      propertyAddress: dealData.propertyAddress,
      purchasePrice: dealData.purchasePrice,
      monthlyRent: dealData.propertyType === 'SFR' ? dealData.monthlyRent : 'Multiple units',
      downPayment: dealData.downPayment,
      interestRate: dealData.interestRate,
      maintenanceCost: dealData.maintenanceCost,
      maintenanceCostType: typeof dealData.maintenanceCost,
      isMaintenanceCostZero: dealData.maintenanceCost === 0,
      isMaintenanceCostFalsy: !dealData.maintenanceCost
    });
    
    // Validate deal data
    if (!dealData.propertyType) {
      logger.warn('Analysis request missing property type');
      res.status(400).json({ error: 'Property type is required' });
      return;
    }
    
    // Extract assumptions from the dealData
    const assumptions: AnalysisAssumptions = {
      projectionYears: dealData.longTermAssumptions?.projectionYears || 10,
      annualRentIncrease: dealData.longTermAssumptions?.annualRentIncrease || 2,
      annualExpenseIncrease: dealData.longTermAssumptions?.annualExpenseIncrease || 2,
      annualPropertyValueIncrease: dealData.longTermAssumptions?.annualPropertyValueIncrease || 3,
      sellingCosts: dealData.longTermAssumptions?.sellingCostsPercentage || 6,
      vacancyRate: dealData.longTermAssumptions?.vacancyRate || 5
    };
    
    // Use the appropriate analysis service directly
    let analysis: any;
    if (dealData.propertyType === 'SFR') {
      logger.info('Analyzing SFR property with market intelligence');
      const analyzer = new SFRAnalyzer(dealData, assumptions);
      analysis = await analyzer.analyzeWithMarketIntelligence();
    } else if (dealData.propertyType === 'MF') {
      logger.info('Analyzing Multi-Family property');
      const analyzer = new MultiFamilyAnalyzer(dealData, assumptions);
      analysis = analyzer.analyze();
    } else {
      throw new Error(`Unsupported property type: ${dealData.propertyType}`);
    }
    
    if (!analysis) {
      throw new Error('Analysis failed to produce results');
    }
    
    // Add AI insights with smart caching (Layer 2) - unless skipAI is requested
    if (dealData.skipAI) {
      logger.info('Skipping AI insights generation due to skipAI flag');
      analysis.aiInsights = {
        summary: "AI insights skipped for faster processing.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: 0
      };
    } else {
      try {
        // Check if this is a parameter change scenario (re-analysis)
        // In a real implementation, you'd compare against previous data from session/request context
        // For now, the AIInsightsCacheService handles cache invalidation internally
        
        analysis.aiInsights = await generateAIInsights(dealData, analysis);
      } catch (aiError) {
        logger.error('Error getting AI insights:', aiError);
        // Continue without AI insights
        analysis.aiInsights = {
          summary: "AI insights are not available at this time.",
          strengths: [],
          weaknesses: [],
          recommendations: [],
          investmentScore: 0
        };
      }
    }
    
    // Generate Professional Investment Decision (Investment Decision Engine)
    // Story 2.4: Property-type-aware routing
    if (!dealData.skipAI) {
      try {
        logger.info('Generating professional investment decision...', {
          propertyType: dealData.propertyType
        });

        // Use 'any' to avoid type conflicts between legacy and new engine APIs
        let investmentDecision: any;

        if (dealData.propertyType === 'MF') {
          // ===== MULTI-FAMILY: NEW SIMPLIFIED API (80% CORE + 20% AI) =====
          logger.info('🏢 Using MFDecisionEngine for Multi-Family property');

          const marketData = analysis.marketData;

          // ===== STORY 2.5: AI CONTEXT (SAME AS SFR) =====
          // Enhanced user context - use enhanced goals from Step 5 or fallback to defaults
          const enhancedGoals = dealData.enhancedGoals || {};

          logger.info('Enhanced goals received:', {
            hasEnhancedGoals: !!dealData.enhancedGoals,
            exitStrategy: enhancedGoals.exitStrategy,
            portfolioStrategy: enhancedGoals.portfolioStrategy,
            experienceLevel: enhancedGoals.experienceLevel,
            riskTolerance: enhancedGoals.riskTolerance
          });

          // Map portfolio strategy to investment goals for backward compatibility
          let investmentGoals: 'cash_flow' | 'appreciation' | 'balanced' = 'balanced';
          if (enhancedGoals.portfolioStrategy === 'cashflow') investmentGoals = 'cash_flow';
          else if (enhancedGoals.portfolioStrategy === 'appreciation') investmentGoals = 'appreciation';

          const userContext = {
            availableCash: dealData.totalInvestment || dealData.purchasePrice,
            experienceLevel: enhancedGoals.experienceLevel || 'intermediate' as const,
            riskTolerance: enhancedGoals.riskTolerance || 'moderate' as const,
            investmentGoals
          };

          // Get predictions from AI insights if available
          const predictions = analysis.aiInsights?.boldPredictions || null;

          // Normalize MF analysis structure: keyMetrics → metrics
          // MF analyzer returns keyMetrics, but BaseDecisionEngine expects metrics
          const normalizedAnalysis = {
            ...analysis,
            metrics: analysis.keyMetrics // Map keyMetrics to metrics for consistency
          };

          const mfEngine = new MFDecisionEngine(
            normalizedAnalysis,      // AnalysisResult<MultiFamilyMetrics> (normalized)
            dealData as MultiFamilyData,      // MultiFamilyData
            marketData,    // MarketDataResponse | undefined
            predictions,   // AI predictions (Story 2.5)
            userContext,   // User context (Story 2.5)
            enhancedGoals  // Enhanced goals (Story 2.5)
          );

          // NEW ASYNC API WITH AI ENHANCEMENT (80% core + 20% AI)
          investmentDecision = await mfEngine.generateDecisionWithAI();

          logger.info('✅ MF investment decision generated (100% - Core + AI):', {
            verdict: investmentDecision.verdict,
            dealQuality: investmentDecision.professionalAssessment?.dealQuality,
            walkAwayPrice: investmentDecision.marketPosition?.walkAwayPrice,
            capRateScore: investmentDecision.professionalAssessment?.capRateScore,
            dscrScore: investmentDecision.professionalAssessment?.debtStructureScore,
            hasAIContent: !!investmentDecision.aiEnhancedContent,
            hasGoalReasoning: !!investmentDecision.goalBasedReasoning
          });

        } else {
          // ===== SFR: LEGACY API (100% UNCHANGED - FULL 80% + 20% AI) =====
          logger.info('🏠 Using legacy InvestmentDecisionEngine for SFR property');

          const decisionEngine = new InvestmentDecisionEngine();

          // Enhanced user context - use enhanced goals from Step 5 or fallback to defaults
          const enhancedGoals = dealData.enhancedGoals || {};

          logger.info('Enhanced goals received:', {
            hasEnhancedGoals: !!dealData.enhancedGoals,
            exitStrategy: enhancedGoals.exitStrategy,
            portfolioStrategy: enhancedGoals.portfolioStrategy,
            experienceLevel: enhancedGoals.experienceLevel,
            riskTolerance: enhancedGoals.riskTolerance,
            hasFreeTextStrategy: !!enhancedGoals.freeTextStrategy,
            processingMethod: enhancedGoals.processingMethod
          });

          // Map portfolio strategy to investment goals for backward compatibility
          let investmentGoals: 'cash_flow' | 'appreciation' | 'balanced' = 'balanced';
          if (enhancedGoals.portfolioStrategy === 'cashflow') investmentGoals = 'cash_flow';
          else if (enhancedGoals.portfolioStrategy === 'appreciation') investmentGoals = 'appreciation';

          const userContext = {
            availableCash: dealData.totalInvestment || dealData.purchasePrice,
            experienceLevel: enhancedGoals.experienceLevel || 'intermediate' as const,
            riskTolerance: enhancedGoals.riskTolerance || 'moderate' as const,
            investmentGoals
          };

          // Get predictions from AI insights if available
          const predictions = analysis.aiInsights?.boldPredictions || null;

          // Pass market intelligence from analysis instead of null
          const marketIntelligence = {
            marketData: analysis.marketData,
            marketInsights: analysis.marketInsights,
            investmentTiming: analysis.investmentTiming
          };

          // OLD API - 6 PARAMETERS (UNCHANGED)
          investmentDecision = await decisionEngine.generateInvestmentDecision(
            dealData,
            analysis,
            predictions,
            marketIntelligence,
            userContext,
            enhancedGoals
          );

          logger.info('✅ SFR investment decision generated (FULL 100%):', {
            verdict: investmentDecision.verdict,
            confidence: investmentDecision.confidence,
            score: investmentDecision.score,
            aiEnhancement: 'FULL AI + GOAL INTEGRATION'
          });
        }

        // Assign decision to analysis (common for both paths)
        analysis.investmentDecision = investmentDecision;
        
        // SAFE: Add portfolio context if portfolioId is provided (optional enhancement)
        logger.info('Checking for portfolio context:', {
          hasPortfolioId: !!dealData.portfolioId,
          portfolioId: dealData.portfolioId,
          hasInvestmentDecision: !!analysis.investmentDecision
        });
        
        if (dealData.portfolioId && analysis.investmentDecision) {
          try {
            logger.info('Enhancing investment decision with portfolio context:', dealData.portfolioId);
            const portfolioContext = await generatePortfolioContext(dealData.portfolioId, analysis);
            if (portfolioContext) {
              analysis.investmentDecision.portfolioContext = portfolioContext;
              logger.info('Portfolio context added successfully:', portfolioContext);
            } else {
              logger.warn('Portfolio context generation returned null');
            }
          } catch (portfolioError) {
            logger.warn('Portfolio context generation failed (non-critical):', portfolioError);
            // Continue without portfolio context - this is optional enhancement
          }
        }
        
        logger.info('Investment decision generated:', {
          verdict: analysis.investmentDecision.verdict,
          confidence: analysis.investmentDecision.confidence,
          score: analysis.investmentDecision.score,
          scoreType: typeof analysis.investmentDecision.score,
          scoreUndefined: analysis.investmentDecision.score === undefined,
          scoreNull: analysis.investmentDecision.score === null,
          primaryReason: analysis.investmentDecision.primaryReason
        });
        
      } catch (decisionError) {
        logger.error('Error generating investment decision:', decisionError);
        // Continue without investment decision - not critical for basic analysis
        analysis.investmentDecision = null;
      }
    } else {
      analysis.investmentDecision = null;
    }
    
    // Add portfolio context regardless of AI/investmentDecision status
    if (dealData.portfolioId) {
      try {
        logger.info('Generating portfolio context for portfolioId:', dealData.portfolioId);
        const portfolioContext = await generatePortfolioContext(dealData.portfolioId, analysis);
        logger.info('Generated portfolio context result:', {
          portfolioContextExists: !!portfolioContext,
          portfolioContext: portfolioContext
        });
        
        if (portfolioContext) {
          // Create investmentDecision object if it doesn't exist
          if (!analysis.investmentDecision) {
            analysis.investmentDecision = {
              verdict: 'ANALYZE',
              confidence: 0,
              primaryReason: 'Portfolio context analysis',
              warnings: [],
              opportunities: []
            };
          }
          analysis.investmentDecision.portfolioContext = portfolioContext;
          logger.info('Portfolio context added successfully to investmentDecision');
        } else {
          logger.warn('generatePortfolioContext returned null/undefined');
        }
      } catch (portfolioError) {
        logger.error('Portfolio context generation failed:', portfolioError);
      }
    }
    
    logger.info('Calculated analysis metrics:', {
      purchasePrice: dealData.purchasePrice,
      monthlyRent: dealData.propertyType === 'SFR' ? dealData.monthlyRent : 'Multiple units',
      noi: analysis.keyMetrics?.noi,
      cashFlow: analysis.monthlyAnalysis?.cashFlow,
      capRate: analysis.keyMetrics?.capRate,
      cashOnCash: analysis.keyMetrics?.cashOnCashReturn,
      dscr: analysis.keyMetrics?.dscr
    });
    
    logger.info('Analysis complete - checking projections maintenance values');
    logger.info('Analysis result structure:', {
      hasLongTermAnalysis: !!analysis.longTermAnalysis,
      hasProjections: !!analysis.longTermAnalysis?.projections,
      projectionsLength: analysis.longTermAnalysis?.projections?.length || 0,
      projectionsIsArray: Array.isArray(analysis.longTermAnalysis?.projections)
    });
    
    // Log maintenance values in projections before any field mapping
    if (analysis.longTermAnalysis?.projections && analysis.longTermAnalysis.projections.length > 0) {
      const firstProjection = analysis.longTermAnalysis.projections[0];
      logger.info('First projection sample:', {
        year: firstProjection.year,
        maintenance: firstProjection.maintenance,
        maintenanceCost: firstProjection.maintenanceCost,
        hasMaintenanceField: 'maintenance' in firstProjection,
        hasMaintenanceCostField: 'maintenanceCost' in firstProjection,
        allKeys: Object.keys(firstProjection)
      });
    } else {
      logger.warn('No projections found or projections array is empty!');
    }
    
    // Fix field name mapping for projections (ensure maintenance field is correctly named)
    if (analysis.longTermAnalysis?.projections) {
      analysis.longTermAnalysis.projections.forEach((year: any) => {
        // Ensure maintenance field exists with correct name for frontend
        if (year.maintenanceCost !== undefined && year.maintenance === undefined) {
          logger.info(`Mapping maintenanceCost to maintenance for year ${year.year}:`, {
            maintenanceCost: year.maintenanceCost,
            maintenance: year.maintenance
          });
          year.maintenance = year.maintenanceCost;
          delete year.maintenanceCost;
        }
      });
      
      // Log maintenance values after field mapping
      const maintenanceValuesAfter = analysis.longTermAnalysis.projections.map((year: any) => ({
        year: year.year,
        maintenance: year.maintenance,
        maintenanceCost: year.maintenanceCost,
        hasMaintenanceField: 'maintenance' in year,
        hasMaintenanceCostField: 'maintenanceCost' in year
      }));
      logger.info('Projections maintenance values after field mapping:');
      logger.info(JSON.stringify(maintenanceValuesAfter, null, 2));
    }
    
    logger.info('Analysis complete - returning results');
    
    // Include portfolioId in the response so it can be saved with the deal
    const responseData = {
      ...analysis,
      portfolioId: dealData.portfolioId || null // Include portfolioId from original request
    };
    
    logger.info('Returning analysis with portfolioId:', {
      hasPortfolioId: !!dealData.portfolioId,
      portfolioId: dealData.portfolioId
    });
    
    // Debug: Check if portfolio context and tax analysis are in response
    logger.info('🔍 RESPONSE DEBUG - Investment Decision check:', {
      hasInvestmentDecision: !!responseData.investmentDecision,
      hasPortfolioContext: !!responseData.investmentDecision?.portfolioContext,
      portfolioContext: responseData.investmentDecision?.portfolioContext,
      // TAX INTELLIGENCE DEBUGGING
      hasTaxAnalysis: !!(responseData.investmentDecision as any)?.taxAnalysis,
      taxAnalysisKeys: (responseData.investmentDecision as any)?.taxAnalysis ? Object.keys((responseData.investmentDecision as any).taxAnalysis) : [],
      optimalHoldPeriod: (responseData.investmentDecision as any)?.taxAnalysis?.optimalHoldPeriod,
      taxSavings: (responseData.investmentDecision as any)?.taxAnalysis?.totalTaxSavingsAtOptimal
    });
    
    // Return analysis with portfolioId
    res.json(responseData);
  } catch (error) {
    logger.error('Error analyzing deal:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'An unknown error occurred' });
    }
  }
};

// Add a note to a deal
export const addNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const { note } = req.body;
    
    // Get the current deal
    const deal = await dealService.getDealById(dealId);
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }
    
    // Prepare updated data - with correct typing
    const updatedData = {
      ...deal.toObject(),
      _id: dealId,
      notes: [...(deal.notes || []), {
        text: note.text,
        createdAt: new Date(),
        author: note.author || 'Anonymous'
      }]
    };
    
    // Update deal with new notes
    const updatedDeal = await dealService.saveDeal(updatedData);
    
    res.json(updatedDeal);
  } catch (error) {
    logger.error('Error adding note to deal:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'An unknown error occurred' });
    }
  }
};

// Add a document to a deal
export const addDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const { document } = req.body;
    
    // Get the current deal
    const deal = await dealService.getDealById(dealId);
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }
    
    // Prepare updated data - with correct typing
    const updatedData = {
      ...deal.toObject(),
      _id: dealId,
      documents: [...(deal.documents || []), {
        name: document.name,
        url: document.url,
        type: document.type,
        uploadedAt: new Date()
      }]
    };
    
    // Update deal with new documents
    const updatedDeal = await dealService.saveDeal(updatedData);
    
    res.json(updatedDeal);
  } catch (error) {
    logger.error('Error adding document to deal:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'An unknown error occurred' });
    }
  }
};

// Add performance metrics to a deal
export const addPerformanceMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const { metrics } = req.body;
    
    // Get the current deal
    const deal = await dealService.getDealById(dealId);
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }
    
    // Prepare updated data - with correct typing
    const updatedData = {
      ...deal.toObject(),
      _id: dealId,
      performanceMetrics: {
        ...(deal.performanceMetrics || {}),
        ...metrics,
        updatedAt: new Date()
      }
    };
    
    // Update deal with new metrics
    const updatedDeal = await dealService.saveDeal(updatedData);
    
    res.json(updatedDeal);
  } catch (error) {
    logger.error('Error adding performance metrics to deal:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'An unknown error occurred' });
    }
  }
};

// Sample SFR data
export const getSampleSFR = (_req: Request, res: Response): void => {
  const sampleSFR = {
    propertyName: 'Sample SFR Property',
    propertyType: 'SFR',
    propertyAddress: {
      street: '123 Elm Street',
      city: 'Mountain View',
      state: 'CA',
      zipCode: '94043'
    },
    purchasePrice: 1500000,
    downPayment: 300000,
    interestRate: 4.5,
    loanTerm: 30,
    monthlyRent: 5000,
    squareFootage: 2200,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 2005,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    maintenanceCost: 250,
    propertyManagementRate: 8,
    capitalInvestments: 15000,
    tenantTurnoverFees: {
      prepFees: 1200,
      realtorCommission: 0.5
    },
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCostsPercentage: 6,
      inflationRate: 2,
      vacancyRate: 5
    }
  };
  
  res.json(sampleSFR);
};

// Sample Multi-Family data
export const getSampleMF = (_req: Request, res: Response): void => {
  const sampleMF = {
    propertyName: 'Sample Multi-Family Property',
    propertyType: 'MF',
    propertyAddress: {
      street: '250 W 34th Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    purchasePrice: 1200000,
    downPayment: 240000,
    interestRate: 5,
    loanTerm: 30,
    totalUnits: 8,
    totalSqft: 7500,
    yearBuilt: 1980,
    propertyTaxRate: 1.5,
    insuranceRate: 0.6,
    maintenanceCost: 800,
    maintenanceCostPerUnit: 100,
    propertyManagementRate: 10,
    unitTypes: [
      {
        type: '1 bed, 1 bath',
        count: 4,
        sqft: 650,
        monthlyRent: 1100,
        occupied: 4
      },
      {
        type: '2 bed, 2 bath',
        count: 4,
        sqft: 950,
        monthlyRent: 1500,
        occupied: 3
      }
    ],
    commonAreaUtilities: {
      electric: 350,
      water: 250,
      gas: 200,
      trash: 150
    },
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 2.5,
      annualPropertyValueIncrease: 3,
      sellingCostsPercentage: 6,
      inflationRate: 2,
      vacancyRate: 7
    }
  };
  
  logger.info("Returning sample MF data with Manhattan, NY ZIP code 10001");
  res.json(sampleMF);
};

/**
 * NEW: Fast AI Predictions Endpoint
 * Provides 3-4 second response vs 76+ second mega-prompt
 */
export const getQuickPredictions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    let dealData = req.body;
    
    // Convert wizard data to standard format
    dealData = convertWizardData(dealData);
    
    logger.info('Quick predictions requested for:', {
      propertyType: dealData.propertyType,
      propertyAddress: dealData.propertyAddress,
      purchasePrice: dealData.purchasePrice
    });

    // Validate deal data
    if (!dealData.propertyType) {
      res.status(400).json({ error: 'Property type is required' });
      return;
    }

    // Extract assumptions
    const assumptions: AnalysisAssumptions = {
      projectionYears: dealData.longTermAssumptions?.projectionYears || 10,
      annualRentIncrease: dealData.longTermAssumptions?.annualRentIncrease || 2,
      annualExpenseIncrease: dealData.longTermAssumptions?.annualExpenseIncrease || 2,
      annualPropertyValueIncrease: dealData.longTermAssumptions?.annualPropertyValueIncrease || 3,
      sellingCosts: dealData.longTermAssumptions?.sellingCostsPercentage || 6,
      vacancyRate: dealData.longTermAssumptions?.vacancyRate || 5
    };

    // Quick analysis for predictions
    let quickAnalysis: any;
    if (dealData.propertyType === 'SFR') {
      const analyzer = new SFRAnalyzer(dealData, assumptions);
      quickAnalysis = analyzer.analyze(); // Skip market intelligence for speed
    } else if (dealData.propertyType === 'MF') {
      const analyzer = new MultiFamilyAnalyzer(dealData, assumptions);
      quickAnalysis = analyzer.analyze();
    } else {
      res.status(400).json({ error: `Unsupported property type: ${dealData.propertyType}` });
      return;
    }

    // Get fast AI predictions (parallel processing)
    const result = await getFastAIPredictions(dealData, quickAnalysis);
    
    const totalTime = Date.now() - startTime;
    
    logger.info('Quick predictions completed', {
      totalTime: `${totalTime}ms`,
      predictionsGenerated: result.predictions.failedPredictions.length === 0
    });

    res.json({
      success: true,
      data: {
        predictions: result.predictions,
        basicInsights: result.basicInsights,
        quickAnalysis: {
          keyMetrics: quickAnalysis.keyMetrics,
          monthlyAnalysis: quickAnalysis.monthlyAnalysis
        }
      },
      performance: {
        totalTime: `${totalTime}ms`,
        improvement: `${Math.round((76000 - totalTime) / 76000 * 100)}% faster than full analysis`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error('Error in quick predictions:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Quick predictions failed',
      performance: {
        totalTime: `${totalTime}ms`
      }
    });
  }
};

/**
 * NEW: Analyze Investment Goals with AI Enhancement
 * 
 * This endpoint processes both structured goals (dropdowns) and free-text strategy
 * to provide enhanced, personalized investment context beyond simple categories.
 * 
 * Features:
 * - Fast pattern matching for common strategies (BRRRR, house hacking, etc.)
 * - AI analysis for complex/unique strategies
 * - Hybrid processing combining both approaches
 * - Enhanced strategic insights and risk adjustments
 */
export const analyzeGoals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { structuredGoals, freeTextStrategy } = req.body;
    
    logger.info('Goal analysis request received', {
      hasStructuredGoals: !!structuredGoals,
      hasFreeText: !!freeTextStrategy,
      freeTextLength: freeTextStrategy?.length || 0,
      structuredGoalKeys: structuredGoals ? Object.keys(structuredGoals) : []
    });

    // Validate request
    if (!structuredGoals && !freeTextStrategy) {
      res.status(400).json({
        success: false,
        error: 'Either structured goals or free-text strategy is required'
      });
      return;
    }

    // Perform AI goal analysis
    const enhancedGoals: EnhancedGoalContext = await analyzeInvestmentGoals(
      structuredGoals || {},
      freeTextStrategy
    );

    const processingTime = Date.now() - startTime;

    logger.info('Goal analysis completed', {
      processingMethod: enhancedGoals.processingMethod,
      confidenceScore: enhancedGoals.confidenceScore,
      strategicInsightsCount: enhancedGoals.strategicInsights?.length || 0,
      riskAdjustmentsCount: enhancedGoals.riskAdjustments?.length || 0,
      processingTime: `${processingTime}ms`
    });

    res.json({
      success: true,
      data: {
        enhancedGoals,
        analysis: {
          processingMethod: enhancedGoals.processingMethod,
          confidenceScore: enhancedGoals.confidenceScore,
          strategicInsightsCount: enhancedGoals.strategicInsights?.length || 0,
          riskAdjustmentsCount: enhancedGoals.riskAdjustments?.length || 0,
          hasAiEnhancement: !!enhancedGoals.aiEnhancedStrategy
        }
      },
      performance: {
        processingTime: `${processingTime}ms`,
        efficiency: processingTime < 1000 ? 'excellent' : processingTime < 3000 ? 'good' : 'moderate'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Error in goal analysis:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Goal analysis failed',
      performance: {
        processingTime: `${processingTime}ms`
      },
      timestamp: new Date().toISOString()
    });
  }
};
