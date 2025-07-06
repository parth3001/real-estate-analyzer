console.log('Deals controller loaded from file:', __filename);
import { Request, Response } from 'express';
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
    res.json(deal);
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
export const createDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const dealData = req.body;
    logger.info('Creating deal with data:', {
      propertyName: dealData.propertyName,
      propertyType: dealData.propertyType,
      hasAnalysis: !!dealData.analysis,
      bodyKeys: Object.keys(dealData)
    });
    
    // Log the full data for debugging
    logger.info('Full deal data:', JSON.stringify(dealData));
    
    const newDeal = await dealService.saveDeal(dealData);
    logger.info('Deal created successfully:', {
      id: newDeal._id,
      propertyName: newDeal.propertyName
    });
    
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
    const dealData = req.body;
    
    // Log detailed information about the request
    logger.info('Analyzing property:', {
      propertyType: dealData.propertyType,
      propertyAddress: dealData.propertyAddress,
      purchasePrice: dealData.purchasePrice,
      monthlyRent: dealData.propertyType === 'SFR' ? dealData.monthlyRent : 'Multiple units',
      downPayment: dealData.downPayment,
      interestRate: dealData.interestRate
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
    let analysis;
    if (dealData.propertyType === 'SFR') {
      logger.info('Analyzing SFR property');
      const analyzer = new SFRAnalyzer(dealData, assumptions);
      analysis = analyzer.analyze();
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
export const getSampleSFR = (req: Request, res: Response): void => {
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
export const getSampleMF = (req: Request, res: Response): void => {
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
