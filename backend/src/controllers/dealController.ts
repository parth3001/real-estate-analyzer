import { Request, Response } from 'express';
import { dealService } from '../services/dealService';
import { logger } from '../utils/logger';
import { IDeal } from '../models/Deal';
// import { analyzeSFRProperty, analyzeMFProperty } from '../services/analysisService';
import { adaptAnalysisForFrontend } from '../utils/analysisAdapter';
import { enrichPropertyWithCensusData, analyzePropertyWithCensusContext } from '../services/propertyEnrichmentService';
import { SFRAnalyzer } from '../analysis';
import { getAIInsights } from '../services/aiService';
import { AnalysisAssumptions } from '../analysis/BasePropertyAnalyzer';

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

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Get all deals for the current user
 */
export const getAllDeals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user ID from auth middleware if available
    const userId = req.user?.id;
    const deals = await dealService.getAllDeals(userId);
    res.json(deals);
  } catch (error) {
    logger.error('Error getting all deals:', error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
};

/**
 * Get a specific deal by ID with enhanced market intelligence analysis
 */
export const getDealById = async (req: Request, res: Response) => {
  try {
    logger.info('Loading deal with market intelligence:', req.params.id);
    
    const { id } = req.params;
    const deal = await dealService.getDealById(id);
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    logger.info('Deal loaded from database:', {
      id: deal._id,
      propertyName: deal.propertyName,
      hasAnalysis: !!deal.analysis,
      hasMarketData: !!(deal.analysis as any)?.marketData
    });
    
    // Extract the deal as an object
    const dealObj = deal.toObject();
    
    // Check if we have cached market intelligence data in the deal
    const hasStoredMarketData = (dealObj.analysis as any)?.marketData || 
                               (dealObj.analysis as any)?.marketInsights || 
                               (dealObj.analysis as any)?.investmentTiming;
    
    let analysisResult: any;
    
    if (dealObj.propertyType === 'SFR') {
      // Prepare deal data for SFR analysis
      const sfrData = {
        propertyName: dealObj.propertyName,
        propertyType: dealObj.propertyType,
        propertyAddress: dealObj.propertyAddress,
        purchasePrice: dealObj.purchasePrice,
        downPayment: dealObj.downPayment,
        interestRate: dealObj.interestRate,
        loanTerm: dealObj.loanTerm,
        monthlyRent: (dealObj as any).monthlyRent,
        squareFootage: (dealObj as any).squareFootage,
        bedrooms: (dealObj as any).bedrooms,
        bathrooms: (dealObj as any).bathrooms,
        yearBuilt: dealObj.yearBuilt,
        propertyTaxRate: dealObj.propertyTaxRate,
        insuranceRate: dealObj.insuranceRate,
        maintenanceCost: (dealObj as any).maintenanceCost,
        propertyManagementRate: dealObj.propertyManagementRate,
        closingCosts: dealObj.closingCosts,
        repairCosts: dealObj.repairCosts,
        capitalInvestments: dealObj.capitalInvestments,
        tenantTurnoverFees: dealObj.tenantTurnoverFees,
        longTermAssumptions: dealObj.longTermAssumptions || {
          projectionYears: 10,
          annualRentIncrease: 2,
          annualPropertyValueIncrease: 3,
          inflationRate: 2,
          vacancyRate: 5,
          sellingCostsPercentage: 6
        }
      };
      
      // Extract analysis assumptions
      const assumptions: AnalysisAssumptions = {
        projectionYears: sfrData.longTermAssumptions.projectionYears || 10,
        annualRentIncrease: sfrData.longTermAssumptions.annualRentIncrease || 2,
        annualExpenseIncrease: sfrData.longTermAssumptions.inflationRate || 2,
        annualPropertyValueIncrease: sfrData.longTermAssumptions.annualPropertyValueIncrease || 3,
        sellingCosts: sfrData.longTermAssumptions.sellingCostsPercentage || 6,
        vacancyRate: sfrData.longTermAssumptions.vacancyRate || 5
      };
      
      // Use the enhanced SFR analyzer with market intelligence
      logger.info('Re-analyzing SFR deal with market intelligence');
      const analyzer = new SFRAnalyzer(sfrData, assumptions);
      analysisResult = await analyzer.analyzeWithMarketIntelligence();
      
      // If we have stored market data and fresh analysis doesn't have it, preserve the stored data
      if (hasStoredMarketData && !analysisResult.marketData) {
        logger.info('Preserving stored market intelligence data');
        analysisResult.marketData = (dealObj.analysis as any).marketData;
        analysisResult.marketInsights = (dealObj.analysis as any).marketInsights;
        analysisResult.investmentTiming = (dealObj.analysis as any).investmentTiming;
      }
      
      // Generate fresh AI insights with market intelligence
      try {
        logger.info('Generating fresh AI insights with market intelligence');
        analysisResult.aiInsights = await getAIInsights(sfrData, analysisResult);
      } catch (aiError) {
        logger.error('Error generating AI insights for saved deal:', aiError);
        // Fall back to stored AI insights if generation fails
        analysisResult.aiInsights = dealObj.analysis?.aiInsights || {
          summary: "AI insights are not available at this time.",
          strengths: [],
          weaknesses: [],
          recommendations: [],
          investmentScore: null
        };
      }
      
    } else {
      // For non-SFR deals, fall back to stored analysis for now
      logger.warn('Market intelligence not yet implemented for property type:', dealObj.propertyType);
      analysisResult = dealObj.analysis;
    }
    
    // Return the deal with enhanced analysis
    const responseDeal = {
      ...dealObj,
      analysis: analysisResult
    };
    
    // Adapt for frontend consistency
    const finalAdaptedAnalysis = adaptAnalysisForFrontend(responseDeal);
    
    logger.info('Returning deal with market intelligence analysis', {
      hasMarketData: !!(finalAdaptedAnalysis.analysis as any)?.marketData,
      hasMarketInsights: !!(finalAdaptedAnalysis.analysis as any)?.marketInsights,
      hasInvestmentTiming: !!(finalAdaptedAnalysis.analysis as any)?.investmentTiming,
      hasAIInsights: !!finalAdaptedAnalysis.analysis?.aiInsights,
      investmentScore: finalAdaptedAnalysis.analysis?.aiInsights?.investmentScore
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

    const newDeal = await dealService.saveDeal(dealData);
    res.status(201).json(newDeal);
  } catch (error) {
    logger.error('Error creating deal:', error);
    res.status(400).json({ error: 'Failed to create deal' });
  }
};

/**
 * Update an existing deal
 */
export const updateDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const dealData = req.body;
    
    const updatedDeal = await dealService.saveDeal({ _id: id, ...dealData });
    res.json(updatedDeal);
  } catch (error) {
    logger.error(`Error updating deal ${req.params.id}:`, error);
    res.status(400).json({ error: 'Failed to update deal' });
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dealService.deleteDeal(id);
    res.status(204).end();
  } catch (error) {
    logger.error(`Error deleting deal ${req.params.id}:`, error);
    res.status(400).json({ error: 'Failed to delete deal' });
  }
};

/**
 * Analyze a deal property
 */
export const analyzeDeal = async (req: Request, res: Response) => {
  try {
    const dealData = req.body;
    logger.info('Analyzing deal:', { propertyType: dealData.propertyType });

    let analysis;
    
    if (dealData.propertyType === 'SFR') {
      analysis = await analyzeSFRProperty(dealData);
    } else if (dealData.propertyType === 'MF') {
      analysis = await analyzeMFProperty(dealData);
    } else {
      throw new Error(`Unsupported property type: ${dealData.propertyType}`);
    }
    
    // Enrich with census data if possible
    try {
      const enrichedDeal = await enrichPropertyWithCensusData(dealData);
      const enrichedAnalysis = await analyzePropertyWithCensusContext(enrichedDeal);
      
      // Merge the enriched analysis with the original
      analysis = {
        ...analysis,
        ...enrichedAnalysis,
        censusData: enrichedDeal.censusData,
        censusInsights: enrichedDeal.censusInsights
      };
    } catch (enrichmentError) {
      logger.warn('Could not enrich property with census data:', enrichmentError);
    }
    
    res.json(analysis);
  } catch (error) {
    logger.error('Error analyzing deal:', error);
    res.status(400).json({ error: 'Failed to analyze deal' });
  }
};