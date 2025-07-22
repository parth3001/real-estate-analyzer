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

// Import our enhanced AI service
import { getAIInsights } from '../services/aiService';

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
  try {
    // Use our enhanced AI service which includes scoreBreakdown and market analysis
    return await getAIInsights(dealData, analysis);
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
export const getAllDeals = async (req: Request, res: Response): Promise<void> => {
  try {
    const deals = await dealService.getAllDeals();
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
export const getDealById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deal = await dealService.getDealById(id);
    
    if (!deal) {
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
      aiScore: dealData.analysis?.aiInsights?.investmentScore,
      dataSource: dealData._dataSource || 'legacy',
      hasTotalInvestment: !!dealData.analysis?.keyMetrics?.totalInvestment
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
    
    const dealData = convertWizardData(rawDealData);

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
    
    const newDeal = await dealService.saveDeal(dealData);
    logger.info('Deal created successfully:', {
      id: newDeal._id,
      propertyName: newDeal.propertyName
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
export const updateDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dealData = req.body;
    
    logger.info(`Updating deal ${id} with data:`, {
      propertyName: dealData.propertyName,
      propertyType: dealData.propertyType,
      hasAnalysis: !!dealData.analysis,
      bodyKeys: Object.keys(dealData)
    });
    
    // Log the full data for debugging
    logger.info('Full update data:', JSON.stringify(dealData));
    
    // Add id to the deal data
    dealData._id = id;
    const updatedDeal = await dealService.saveDeal(dealData);
    
    logger.info('Deal updated successfully:', {
      id: updatedDeal._id,
      propertyName: updatedDeal.propertyName
    });
    
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
export const deleteDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await dealService.deleteDeal(id);
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
export const analyzeDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    let dealData = req.body;
    
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
    
    // Add AI insights if possible
    try {
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
    
    // Return real analysis
    res.json(analysis);
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
