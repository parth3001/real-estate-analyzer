import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { SFRAnalyzer, MultiFamilyAnalyzer } from '../analysis';
import { SFRData, MultiFamilyData } from '../types/propertyTypes';
import { getOpenAIClient } from '../services/openai';
import { getAIInsights } from '../services/aiService';
import { CensusService } from '../services/censusService';

/**
 * Convert wizard data format to standard analysis format
 */
function convertWizardToStandardFormat(wizardData: any): any {
  logger.info('=== WIZARD DATA CONVERSION ===');
  logger.info('Converting wizard data with:', {
    monthlyRent: wizardData.monthlyRent,
    maintenanceReservePercentage: wizardData.maintenanceReservePercentage,
    vacancyRate: wizardData.vacancyRate,
    insuranceRate: wizardData.insuranceRate
  });

  // Calculate maintenance cost from percentage
  let maintenanceCost = wizardData.maintenanceCost || 0;
  if (wizardData.maintenanceReservePercentage && wizardData.monthlyRent) {
    maintenanceCost = Math.round((wizardData.monthlyRent * wizardData.maintenanceReservePercentage / 100) * 12);
    logger.info('Calculated maintenance cost:', {
      monthlyRent: wizardData.monthlyRent,
      percentage: wizardData.maintenanceReservePercentage,
      annualCost: maintenanceCost,
      formula: `(${wizardData.monthlyRent} * ${wizardData.maintenanceReservePercentage} / 100) * 12 = ${maintenanceCost}`
    });
  }

  // Convert to standard format
  const standardData = {
    ...wizardData,
    maintenanceCost: maintenanceCost,
    longTermAssumptions: {
      ...wizardData.longTermAssumptions,
      vacancyRate: wizardData.vacancyRate || wizardData.longTermAssumptions?.vacancyRate || 5
    }
  };

  // Remove wizard-specific fields
  delete standardData.maintenanceReservePercentage;
  delete standardData.downPaymentPercentage;
  delete standardData.closingCostPercentage;
  delete standardData._isWizardData;

  logger.info('Conversion complete:', {
    originalMaintenanceReservePercentage: wizardData.maintenanceReservePercentage,
    convertedMaintenanceCost: standardData.maintenanceCost,
    originalVacancyRate: wizardData.vacancyRate,
    convertedVacancyRate: standardData.longTermAssumptions.vacancyRate
  });
  logger.info('=== END WIZARD DATA CONVERSION ===');

  return standardData;
}

const router = express.Router();

// Initialize census service
const censusService = new CensusService();

// Helper function to enrich analysis with census data
const enrichAnalysisWithCensusData = async (propertyData: SFRData | MultiFamilyData, analysisResults: any) => {
  try {
    // Extract location data from property address
    const propertyAddress = propertyData.propertyAddress;
    if (!propertyAddress) {
      logger.warn('Property address not available for census data enrichment');
      return analysisResults;
    }

    // Create census query parameters
    const censusParams = {
      zip: propertyAddress.zipCode,
      state: propertyAddress.state,
      city: propertyAddress.city
    };

    // Only attempt census lookup if we have location data
    let censusData = null;
    if (censusParams.zip || (censusParams.state && censusParams.city)) {
      logger.info('Fetching census data for location:', censusParams);
      
      // Fetch comprehensive census data
      censusData = await censusService.getComprehensiveCensusData(censusParams);
      
      if (censusData) {
        logger.info('Census data enrichment successful');
      } else {
        logger.warn('Census data not available for the specified location');
      }
    } else {
      logger.warn('Insufficient location data for census lookup');
    }

    // Add census data to analysis results
    return {
      ...analysisResults,
      censusData,
      marketContext: generateMarketContext(analysisResults, censusData, propertyData)
    };

  } catch (error) {
    logger.error('Error enriching analysis with census data:', error);
    // Return original analysis if census enrichment fails
    return analysisResults;
  }
};

// Helper function to generate market context insights
const generateMarketContext = (analysis: any, censusData: any, propertyData: SFRData | MultiFamilyData) => {
  if (!censusData) return null;

  try {
    const context = {
      marketPositioning: null as any,
      affordabilityAnalysis: null as any,
      investmentEnvironment: {
        marketDynamics: 'Analysis unavailable',
        competitivePosition: 'Analysis unavailable'
      }
    };

    // Market positioning analysis
    if (censusData.housing?.medianHomeValue && propertyData.purchasePrice) {
      const percentageDiff = ((propertyData.purchasePrice - censusData.housing.medianHomeValue) / censusData.housing.medianHomeValue) * 100;
      context.marketPositioning = {
        propertyValue: propertyData.purchasePrice,
        marketMedian: censusData.housing.medianHomeValue,
        percentageDiff,
        position: percentageDiff < -10 ? 'Significantly Below Market' :
                  percentageDiff < 0 ? 'Below Market' :
                  percentageDiff < 10 ? 'At Market' : 'Above Market'
      };
    }

    // Affordability analysis for SFR properties
    if (propertyData.propertyType === 'SFR' && 'monthlyRent' in propertyData && censusData.income?.medianHouseholdIncome) {
      const monthlyRent = (propertyData as SFRData).monthlyRent;
      const requiredIncome = monthlyRent * 12 * 3; // 3x rent rule
      const medianIncome = censusData.income.medianHouseholdIncome;
      const affordabilityRatio = medianIncome / requiredIncome;

      context.affordabilityAnalysis = {
        requiredIncome,
        medianIncome,
        affordabilityRatio,
        assessment: affordabilityRatio >= 1 ? 'Highly Affordable' : 
                    affordabilityRatio >= 0.8 ? 'Moderately Affordable' : 
                    affordabilityRatio >= 0.6 ? 'Challenging Affordability' : 'Above Market Rate'
      };
    }

    // Investment environment analysis
    if (censusData.housing?.vacancyRate !== undefined) {
      context.investmentEnvironment.marketDynamics = 
        censusData.housing.vacancyRate < 5 ? 'Tight rental market with low vacancy - strong demand' :
        censusData.housing.vacancyRate < 8 ? 'Balanced rental market with normal vacancy rates' :
        'Loose rental market with higher vacancy - competitive environment';
    }

    return context;
  } catch (error) {
    logger.error('Error generating market context:', error);
    return null;
  }
};

// Generic property analysis endpoint
const analyzeHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyType = req.params.type.toLowerCase();
    let formData = req.body;
    
    logger.info(`Received ${propertyType} analysis request:`, { data: formData });
    
    // Log specific wizard fields to debug detection
    logger.info('Wizard field detection debug:', {
      hasMaintenanceReservePercentage: formData.maintenanceReservePercentage !== undefined,
      maintenanceReservePercentageValue: formData.maintenanceReservePercentage,
      hasVacancyRate: formData.vacancyRate !== undefined,
      vacancyRateValue: formData.vacancyRate,
      hasDownPaymentPercentage: formData.downPaymentPercentage !== undefined,
      downPaymentPercentageValue: formData.downPaymentPercentage,
      hasMaintenanceCost: formData.maintenanceCost !== undefined,
      maintenanceCostValue: formData.maintenanceCost,
      monthlyRent: formData.monthlyRent,
      allFieldNames: Object.keys(formData)
    });

    if (propertyType !== 'sfr' && propertyType !== 'mf') {
      res.status(400).json({ error: 'Invalid property type. Must be "sfr" or "mf".' });
      return;
    }

    // Detect if this is wizard data and convert to standard format
    const isWizardData = formData._isWizardData ||
                        formData.maintenanceReservePercentage !== undefined ||
                        formData.vacancyRate !== undefined ||
                        formData.downPaymentPercentage !== undefined;

    if (isWizardData) {
      // DEBUG Issue #29: Log wizard data BEFORE conversion
      logger.info('🔍 ISSUE #29 DEBUG - Wizard data received:', {
        purchasePrice: formData.purchasePrice,
        downPayment: formData.downPayment,
        downPaymentPercentage: formData.downPaymentPercentage,
        closingCosts: formData.closingCosts,
        loanAmount: (formData.purchasePrice || 0) - (formData.downPayment || 0),
        totalInvestment: (formData.downPayment || 0) + (formData.closingCosts || 0)
      });

      logger.info('Detected wizard data, converting to standard format');
      formData = convertWizardToStandardFormat(formData);

      // DEBUG Issue #29: Log wizard data AFTER conversion
      logger.info('🔍 ISSUE #29 DEBUG - After conversion:', {
        purchasePrice: formData.purchasePrice,
        downPayment: formData.downPayment,
        closingCosts: formData.closingCosts,
        loanAmount: (formData.purchasePrice || 0) - (formData.downPayment || 0),
        totalInvestment: (formData.downPayment || 0) + (formData.closingCosts || 0),
        maintenanceCost: formData.maintenanceCost,
        vacancyRate: formData.longTermAssumptions?.vacancyRate,
        insuranceRate: formData.insuranceRate
      });
    }

    // Create analyzer instance with default assumptions
    const assumptions = {
      projectionYears: formData.longTermAssumptions?.projectionYears || 5,
      annualRentIncrease: formData.longTermAssumptions?.annualRentIncrease || 3,
      annualExpenseIncrease: formData.longTermAssumptions?.inflationRate || 2,
      annualPropertyValueIncrease: formData.longTermAssumptions?.annualPropertyValueIncrease || 3,
      sellingCosts: formData.longTermAssumptions?.sellingCostsPercentage || 6,
      vacancyRate: formData.longTermAssumptions?.vacancyRate || 5
    };

    let analyzer;
    if (propertyType === 'sfr') {
      analyzer = new SFRAnalyzer(formData as SFRData, assumptions);
    } else {
      analyzer = new MultiFamilyAnalyzer(formData as MultiFamilyData, assumptions);
    }

    // Handle async analysis for SFR (includes market data) vs sync for MF
    let results: any;
    if (propertyType === 'sfr') {
      results = await (analyzer as SFRAnalyzer).analyzeWithMarketIntelligence();
    } else {
      results = analyzer.analyze();
    }
    
    // Enrich analysis with census data
    const enrichedResults = await enrichAnalysisWithCensusData(formData as SFRData | MultiFamilyData, results);
    
    // Get AI analysis if OpenAI is configured (now with census context)
    const openai = getOpenAIClient();
    if (openai) {
      try {
        const aiInsights = await getAIInsights(formData as SFRData | MultiFamilyData, enrichedResults);
        enrichedResults.aiInsights = aiInsights;
        logger.info(`AI analysis completed for ${propertyType} property`);
      } catch (error) {
        logger.error('Error getting AI analysis:', error);
        enrichedResults.aiInsights = {
          summary: "Error generating AI analysis. Please try again later.",
          strengths: [],
          weaknesses: [],
          recommendations: [],
          investmentScore: null
        };
      }
    } else {
      enrichedResults.aiInsights = {
        summary: "AI analysis not available. Please configure OpenAI API key.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: null
      };
    }
    
    logger.info(`${propertyType} analysis completed successfully with census enrichment`);
    res.json(enrichedResults);
  } catch (error) {
    logger.error(`Error in ${req.params.type} analysis:`, error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
};

router.post('/:type', analyzeHandler);

export default router; 