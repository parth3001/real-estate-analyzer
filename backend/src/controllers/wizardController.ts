/**
 * Property Wizard Controller
 *
 * Handles wizard-specific business logic and validation
 * Coordinates with PropertyDataAggregator for data orchestration
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { propertyDataAggregator } from '../services/propertyDataAggregator';
import { rentEstimationService } from '../services/rentEstimationService';
import { propertyTaxEstimationService } from '../services/propertyTaxEstimationService';
import { analyticsService } from '../services/analyticsService';
import { SFRData } from '../types/propertyTypes';
import { WizardEnhancedSFRData } from '../types/wizardTypes';
import { AuthenticatedRequest } from '../middleware/auth';

// Default insurance rate from STATIC_ANALYSIS_DEFAULTS (0.35% rule)
// Matches /shared/constants/analysisDefaults.ts:34
const DEFAULT_INSURANCE_RATE_PERCENTAGE = 0.35;

/**
 * Convert wizard data to standard SFR analysis format
 * Ensures compatibility with existing analysis pipeline
 */
export const convertWizardToSFRData = async (req: Request, res: Response) => {
  try {
    const wizardData = req.body;
    
    logger.info('Converting wizard data to SFR format', {
      hasPropertyData: !!wizardData.propertyData,
      hasWizardMetadata: !!wizardData.wizardData,
      autoPopulatedFields: wizardData.wizardData?.dataEnrichment?.autoPopulatedFields?.length || 0
    });

    // Validate required wizard data
    if (!wizardData.propertyData) {
      return res.status(400).json({
        error: 'Property data is required'
      });
    }

    // Convert wizard format to standard SFRData format
    const sfrData: WizardEnhancedSFRData = {
      // Standard SFR fields
      propertyType: 'SFR',
      purchasePrice: wizardData.propertyData.purchasePrice || 0,
      downPayment: wizardData.propertyData.downPayment || 0,
      interestRate: wizardData.propertyData.interestRate || 7.5,
      loanTerm: wizardData.propertyData.loanTerm || 30,
      propertyTaxRate: wizardData.propertyData.actualPropertyTaxRate || wizardData.propertyData.propertyTaxRate || 1.2,
      insuranceRate: wizardData.propertyData.insuranceRate || DEFAULT_INSURANCE_RATE_PERCENTAGE, // FIX Issue #27: Changed from 0.7 to 0.35
      maintenanceCost: calculateMaintenanceCost(
        wizardData.propertyData.monthlyRent,
        wizardData.propertyData.maintenanceReservePercentage
      ) || wizardData.propertyData.maintenanceCost || 0,
      propertyManagementRate: wizardData.propertyData.propertyManagementRate || 8,
      propertyAddress: wizardData.propertyData.propertyAddress || {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      closingCosts: wizardData.propertyData.closingCosts || 0,
      capitalInvestments: wizardData.propertyData.capitalInvestments || 0,
      tenantTurnoverFees: wizardData.propertyData.tenantTurnoverFees || {
        prepFees: 500,
        realtorCommission: 0.5
      },

      // SFR-specific fields
      monthlyRent: wizardData.propertyData.monthlyRent || 0,
      squareFootage: wizardData.propertyData.squareFootage || 0,
      bedrooms: wizardData.propertyData.bedrooms || 3,
      bathrooms: wizardData.propertyData.bathrooms || 2,
      yearBuilt: wizardData.propertyData.yearBuilt || new Date().getFullYear() - 20,
      longTermAssumptions: {
        projectionYears: wizardData.propertyData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: wizardData.propertyData.longTermAssumptions?.annualRentIncrease || 3,
        annualPropertyValueIncrease: wizardData.propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCostsPercentage: wizardData.propertyData.longTermAssumptions?.sellingCostsPercentage || 6,
        inflationRate: wizardData.propertyData.longTermAssumptions?.inflationRate || 2.5,
        vacancyRate: wizardData.propertyData.vacancyRate || wizardData.propertyData.longTermAssumptions?.vacancyRate || 5,
        turnoverFrequency: wizardData.propertyData.longTermAssumptions?.turnoverFrequency || 2
      },

      // Wizard-specific metadata
      wizardData: wizardData.wizardData
    };

    // Log conversion success
    logger.info('Wizard data conversion completed', {
      purchasePrice: sfrData.purchasePrice,
      monthlyRent: sfrData.monthlyRent,
      hasWizardMetadata: !!sfrData.wizardData,
      autoPopulatedFieldCount: sfrData.wizardData?.dataEnrichment?.autoPopulatedFields?.length || 0
    });

    res.status(200).json({
      success: true,
      sfrData,
      message: 'Wizard data successfully converted to SFR format'
    });

  } catch (error) {
    logger.error('Wizard data conversion failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to convert wizard data'
    });
  }
};

/**
 * Enhanced property analysis that includes wizard metadata
 * Extends existing analysis with wizard-specific insights
 */
export const analyzePropertyFromWizard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wizardData = req.body;
    
    logger.info('Starting wizard-enhanced property analysis', {
      address: wizardData.propertyData?.propertyAddress?.street,
      purchasePrice: wizardData.propertyData?.purchasePrice,
      monthlyRent: wizardData.propertyData?.monthlyRent,
      maintenanceReservePercentage: wizardData.propertyData?.maintenanceReservePercentage,
      vacancyRate: wizardData.propertyData?.vacancyRate,
      hasWizardMetadata: !!wizardData.wizardData
    });

    // First convert wizard data to standard format
    const maintenanceCost = calculateMaintenanceCost(
      wizardData.propertyData.monthlyRent,
      wizardData.propertyData.maintenanceReservePercentage
    );

    const sfrData: SFRData = {
      propertyType: 'SFR',
      purchasePrice: wizardData.propertyData.purchasePrice || 0,
      downPayment: wizardData.propertyData.downPayment || 0,
      interestRate: wizardData.propertyData.interestRate || 7.5,
      loanTerm: wizardData.propertyData.loanTerm || 30,
      propertyTaxRate: wizardData.propertyData.actualPropertyTaxRate || wizardData.propertyData.propertyTaxRate || 1.2,
      insuranceRate: wizardData.propertyData.insuranceRate || DEFAULT_INSURANCE_RATE_PERCENTAGE, // FIX Issue #27: Changed from 0.7 to 0.35
      maintenanceCost: maintenanceCost || wizardData.propertyData.maintenanceCost || 0,
      propertyManagementRate: wizardData.propertyData.propertyManagementRate || 8,
      propertyAddress: wizardData.propertyData.propertyAddress,
      monthlyRent: wizardData.propertyData.monthlyRent || 0,
      squareFootage: wizardData.propertyData.squareFootage || 0,
      bedrooms: wizardData.propertyData.bedrooms || 3,
      bathrooms: wizardData.propertyData.bathrooms || 2,
      yearBuilt: wizardData.propertyData.yearBuilt || new Date().getFullYear() - 20,
      longTermAssumptions: {
        projectionYears: wizardData.propertyData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: wizardData.propertyData.longTermAssumptions?.annualRentIncrease || 3,
        annualPropertyValueIncrease: wizardData.propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCostsPercentage: wizardData.propertyData.longTermAssumptions?.sellingCostsPercentage || 6,
        inflationRate: wizardData.propertyData.longTermAssumptions?.inflationRate || 2.5,
        vacancyRate: wizardData.propertyData.vacancyRate || wizardData.propertyData.longTermAssumptions?.vacancyRate || 5,
        turnoverFrequency: wizardData.propertyData.longTermAssumptions?.turnoverFrequency || 2
      },
      closingCosts: wizardData.propertyData.closingCosts || 0,
      capitalInvestments: wizardData.propertyData.capitalInvestments || 0,
      tenantTurnoverFees: wizardData.propertyData.tenantTurnoverFees || {
        prepFees: 500,
        realtorCommission: 0.5
      }
    };

    logger.info('Converted wizard data for analysis', {
      purchasePrice: sfrData.purchasePrice,
      maintenanceCost: sfrData.maintenanceCost,
      vacancyRate: sfrData.longTermAssumptions.vacancyRate,
      insuranceRate: sfrData.insuranceRate,
      propertyTaxRate: sfrData.propertyTaxRate,
      monthlyRent: sfrData.monthlyRent,
      rawMaintenanceReservePercentage: wizardData.propertyData.maintenanceReservePercentage,
      rawInsuranceRate: wizardData.propertyData.insuranceRate,
      expectedMonthlyInsurance: sfrData.purchasePrice * (sfrData.insuranceRate / 100) / 12,
      expectedMonthlyMaintenance: sfrData.maintenanceCost / 12
    });

    // Use the SFR analyzer directly instead of going through dealController
    const { SFRAnalyzer } = await import('../analysis/SFRAnalyzer');
    
    // Create assumptions from the data (matching dealController format)
    const assumptions = {
      projectionYears: sfrData.longTermAssumptions.projectionYears || 10,
      annualRentIncrease: sfrData.longTermAssumptions.annualRentIncrease || 2,
      annualExpenseIncrease: sfrData.longTermAssumptions.inflationRate || 2,
      annualPropertyValueIncrease: sfrData.longTermAssumptions.annualPropertyValueIncrease || 3,
      sellingCosts: sfrData.longTermAssumptions.sellingCostsPercentage || 6,
      vacancyRate: sfrData.longTermAssumptions.vacancyRate || 5
    };
    
    const analyzer = new SFRAnalyzer(sfrData, assumptions);
    const analysis = analyzer.analyze();

    logger.info('Wizard analysis completed successfully', {
      hasAnalysis: !!analysis,
      maintenanceInExpenses: analysis.monthlyAnalysis?.expenses?.breakdown?.maintenance,
      vacancyInExpenses: analysis.monthlyAnalysis?.expenses?.breakdown?.vacancy
    });

    // Track wizard completion for analytics dashboard
    analyticsService.trackWizardCompleted({
      strategy: wizardData.propertyData?.investmentStrategy || 'buy-hold',
      dealScore: analysis.investmentDecision?.professionalAssessment?.dealQuality,
      userId: req.user?.id
    }).catch(error => {
      // Log but don't break user flow if analytics tracking fails
      logger.error('[ANALYTICS] Wizard tracking failed (non-blocking):', error);
    });

    res.status(200).json(analysis);

  } catch (error) {
    logger.error('Wizard-enhanced analysis failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      error: 'Failed to complete wizard-enhanced property analysis'
    });
  }
};

/**
 * Helper functions for wizard enhancement
 */

function calculateDataQuality(wizardData: any): number {
  if (!wizardData?.dataEnrichment) return 0;
  
  const autoFields = wizardData.dataEnrichment.autoPopulatedFields?.length || 0;
  const totalFields = 15; // Approximate total number of auto-populatable fields
  const coverage = (autoFields / totalFields) * 100;
  
  const confidenceScores = Object.values(wizardData.dataEnrichment.dataConfidence || {})
    .map((conf: any) => conf || 0)
    .filter(score => score > 0);
  
  const avgConfidence = confidenceScores.length > 0 
    ? confidenceScores.reduce((sum: number, score: number) => sum + score, 0) / confidenceScores.length 
    : 0;
  
  return Math.round((coverage * 0.4) + (avgConfidence * 0.6));
}

function getAutoPopulationSummary(wizardData: any) {
  const enrichment = wizardData?.dataEnrichment;
  if (!enrichment) return null;

  return {
    totalFieldsAutoPopulated: enrichment.autoPopulatedFields?.length || 0,
    apiSourcesUsed: Object.keys(enrichment.apiSources || {}).length,
    averageConfidence: calculateAverageConfidence(enrichment.dataConfidence || {}),
    manualOverrides: Object.keys(enrichment.manualOverrides || {}).length,
    apiCallsSummary: enrichment.apiCallsSummary || {
      total: 0,
      successful: 0,
      failed: 0,
      cached: 0
    }
  };
}

function getUserJourneyInsights(wizardData: any) {
  const journey = wizardData?.userJourney;
  if (!journey) return null;

  return {
    totalCompletionTime: journey.totalWizardTime || 0,
    averageTimePerStep: journey.stepCompletionTimes 
      ? journey.stepCompletionTimes.reduce((sum: number, time: number) => sum + time, 0) / journey.stepCompletionTimes.length
      : 0,
    fieldsManuallyModified: journey.fieldsManuallyModified?.length || 0,
    apiFailuresEncountered: journey.apiFailures?.length || 0,
    userEngagement: calculateUserEngagement(journey)
  };
}

function getConfidenceMetrics(wizardData: any) {
  const confidence = wizardData?.dataEnrichment?.dataConfidence || {};
  
  return {
    highConfidenceFields: Object.entries(confidence).filter(([_, conf]: [string, any]) => conf >= 80).length,
    mediumConfidenceFields: Object.entries(confidence).filter(([_, conf]: [string, any]) => conf >= 60 && conf < 80).length,
    lowConfidenceFields: Object.entries(confidence).filter(([_, conf]: [string, any]) => conf < 60).length,
    averageConfidence: calculateAverageConfidence(confidence)
  };
}

function calculateAverageConfidence(confidence: Record<string, any>): number {
  const scores = Object.values(confidence).filter(score => typeof score === 'number' && score > 0);
  return scores.length > 0 
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
}

function calculateUserEngagement(journey: any): 'high' | 'medium' | 'low' {
  const manualModifications = journey.fieldsManuallyModified?.length || 0;
  const totalTime = journey.totalWizardTime || 0;
  
  // High engagement: user made modifications and spent reasonable time
  if (manualModifications >= 3 && totalTime > 300000) return 'high'; // > 5 minutes
  
  // Medium engagement: some interaction
  if (manualModifications >= 1 || totalTime > 120000) return 'medium'; // > 2 minutes
  
  // Low engagement: minimal interaction
  return 'low';
}

/**
 * Calculate maintenance cost from percentage and monthly rent
 */
function calculateMaintenanceCost(monthlyRent?: number, maintenanceReservePercentage?: number): number {
  logger.info('=== MAINTENANCE CALCULATION DEBUG ===');
  logger.info('calculateMaintenanceCost called with:', {
    monthlyRent,
    maintenanceReservePercentage,
    monthlyRentType: typeof monthlyRent,
    maintenanceReservePercentageType: typeof maintenanceReservePercentage
  });
  
  if (!monthlyRent || !maintenanceReservePercentage) {
    logger.error('calculateMaintenanceCost: Missing required parameters', {
      monthlyRent,
      maintenanceReservePercentage,
      monthlyRentExists: !!monthlyRent,
      maintenanceReservePercentageExists: !!maintenanceReservePercentage
    });
    return 0;
  }
  
  // Calculate monthly maintenance reserve: (monthly rent * percentage) / 100
  const monthlyMaintenanceReserve = (monthlyRent * maintenanceReservePercentage) / 100;
  
  // Return annual maintenance cost
  const annualMaintenanceCost = monthlyMaintenanceReserve * 12;
  
  logger.info('SUCCESS: Calculated maintenance cost from wizard data', {
    monthlyRent,
    maintenanceReservePercentage,
    monthlyMaintenanceReserve,
    annualMaintenanceCost,
    formula: `(${monthlyRent} * ${maintenanceReservePercentage} / 100) * 12 = ${annualMaintenanceCost}`
  });
  logger.info('=== END MAINTENANCE CALCULATION ===');
  
  return Math.round(annualMaintenanceCost);
}

/**
 * Generate smart rent estimate using real market data
 */
export const getRentEstimate = async (req: Request, res: Response) => {
  try {
    const { address, squareFootage, bedrooms, bathrooms, yearBuilt, zipCode } = req.body;

    logger.info('Generating rent estimate for property', {
      address,
      squareFootage,
      bedrooms,
      bathrooms,
      yearBuilt
    });

    // Validate required fields
    if (!address) {
      return res.status(400).json({
        error: 'Property address is required'
      });
    }

    // Prepare property details
    const propertyDetails = {
      address,
      squareFootage: squareFootage ? Number(squareFootage) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
      zipCode
    };

    // Generate rent estimate
    const rentEstimate = await rentEstimationService.generateSmartRentEstimate(propertyDetails);

    logger.info('Successfully generated rent estimate', {
      address,
      estimatedRent: rentEstimate.value,
      confidence: rentEstimate.confidence.score,
      source: rentEstimate.confidence.source
    });

    res.json({
      success: true,
      data: rentEstimate
    });

  } catch (error) {
    logger.error('Error generating rent estimate:', error);
    res.status(500).json({
      error: 'Failed to generate rent estimate',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate smart property tax estimate using RentCast historical tax data
 */
export const getPropertyTaxEstimate = async (req: Request, res: Response) => {
  try {
    const { address, purchasePrice, zipCode, county, state } = req.body;

    logger.info('Generating property tax estimate for property', {
      address,
      purchasePrice,
      zipCode,
      county,
      state
    });

    // Validate required fields
    if (!address || !purchasePrice) {
      return res.status(400).json({
        error: 'Property address and purchase price are required'
      });
    }

    if (purchasePrice <= 0) {
      return res.status(400).json({
        error: 'Purchase price must be greater than 0'
      });
    }

    // Prepare property tax request
    const taxRequest = {
      address,
      purchasePrice: Number(purchasePrice),
      zipCode,
      county,
      state
    };

    // Generate property tax estimate
    const taxEstimate = await propertyTaxEstimationService.generatePropertyTaxEstimate(taxRequest);

    logger.info('Successfully generated property tax estimate', {
      address,
      purchasePrice,
      effectiveTaxRate: taxEstimate.effectiveTaxRate,
      annualTaxAmount: taxEstimate.annualTaxAmount,
      confidence: taxEstimate.confidence.score,
      source: taxEstimate.confidence.source
    });

    res.json({
      success: true,
      data: taxEstimate
    });

  } catch (error) {
    logger.error('Error generating property tax estimate:', error);
    res.status(500).json({
      error: 'Failed to generate property tax estimate',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

