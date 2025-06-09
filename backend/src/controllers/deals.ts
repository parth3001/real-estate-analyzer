console.log('Deals controller loaded from file:', __filename);
import { Request, Response } from 'express';
import { SFRAnalyzer } from '../analysis';
import { getOpenAIClient } from '../services/openai';
import { SFRData, MultiFamilyData } from '../types/propertyTypes';
import { MultiFamilyAnalyzer } from '../analysis/MultiFamilyAnalyzer';
import { sfrAnalysisPrompt, mfAnalysisPrompt } from '../prompts/aiPrompts';
import { generateAnalysis } from '../services/openai';
import { DealService } from '../services/dealService';
import { logger } from '../utils/logger';
import { AnalysisAssumptions } from '../analysis/BasePropertyAnalyzer';

// Initialize the deal service
const dealService = new DealService();

// Utility function to get AI insights
const generateAIInsights = async (dealData: SFRData | MultiFamilyData, analysis: any) => {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return {
        summary: "AI insights are not available. Please check your OpenAI API key.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: 0
      };
    }

    // Extract key metrics for logging purposes only
    const metrics = {
      cashFlow: analysis.monthlyAnalysis.cashFlow || 0,
      annualCashFlow: (analysis.monthlyAnalysis.cashFlow || 0) * 12,
      dscr: analysis.keyMetrics.dscr || 0,
      capRate: analysis.keyMetrics.capRate || 0,
      cashOnCashReturn: analysis.keyMetrics.cashOnCashReturn || 0,
      irr: analysis.keyMetrics.irr || 0,
      purchasePrice: dealData.purchasePrice || 0,
      monthlyRent: dealData.propertyType === 'SFR' ? (dealData as SFRData).monthlyRent || 0 : 0,
      propertyType: dealData.propertyType || 'SFR'
    };

    logger.info('Key metrics for AI analysis:', metrics);

    // Get the appropriate prompt without adding anything to it
    let prompt: string;
    if (dealData.propertyType === 'SFR') {
      prompt = sfrAnalysisPrompt(dealData, analysis);
    } else if (dealData.propertyType === 'MF') {
      prompt = mfAnalysisPrompt(dealData, analysis);
    } else {
      throw new Error('Unsupported propertyType for AI analysis');
    }

    logger.info('Sending prompt to OpenAI:', prompt.substring(0, 200) + '...');

    // Use the generateAnalysis function from the openai service
    const aiResponse = await generateAnalysis(prompt);
    logger.info('AI response parsed successfully:', Object.keys(aiResponse));
    
    // Ensure investmentScore is included and is a number
    const investmentScore = typeof aiResponse.investmentScore === 'number' 
      ? aiResponse.investmentScore 
      : (parseFloat(aiResponse.investmentScore) || 0);
    
    return {
      summary: aiResponse.summary || "No summary provided",
      strengths: Array.isArray(aiResponse.strengths) ? aiResponse.strengths : [],
      weaknesses: Array.isArray(aiResponse.weaknesses) ? aiResponse.weaknesses : [],
      recommendations: Array.isArray(aiResponse.recommendations) ? aiResponse.recommendations : [],
      investmentScore: investmentScore,
      // Add additional MF fields if they exist in the response
      ...(aiResponse.unitMixAnalysis && { unitMixAnalysis: aiResponse.unitMixAnalysis }),
      ...(aiResponse.marketPositionAnalysis && { marketPositionAnalysis: aiResponse.marketPositionAnalysis }),
      ...(aiResponse.valueAddOpportunities && { valueAddOpportunities: aiResponse.valueAddOpportunities }),
      ...(aiResponse.recommendedHoldPeriod && { recommendedHoldPeriod: aiResponse.recommendedHoldPeriod })
    };
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
    logger.info('Analyzing deal with data:', dealData.propertyName || 'Unnamed property');

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
    
    // Debug log the final analysis structure
    logger.info('Final analysis structure check:');
    logger.info('- monthlyAnalysis present:', !!analysis.monthlyAnalysis);
    logger.info('- annualAnalysis present:', !!analysis.annualAnalysis);
    logger.info('- longTermAnalysis present:', !!analysis.longTermAnalysis);
    
    if (analysis.longTermAnalysis) {
      logger.info('- longTermAnalysis keys:', Object.keys(analysis.longTermAnalysis));
      logger.info('- projections present:', !!analysis.longTermAnalysis.projections);
      logger.info('- projections is array:', Array.isArray(analysis.longTermAnalysis.projections));
      logger.info('- projections length:', analysis.longTermAnalysis.projections?.length || 0);
      
      // Ensure the structure is correct
      if (!analysis.longTermAnalysis.projections) {
        logger.error('projections is missing, adding empty array');
        analysis.longTermAnalysis.projections = [];
      }
      
      if (!analysis.longTermAnalysis.returns) {
        logger.error('returns is missing, adding default object');
        analysis.longTermAnalysis.returns = {
          irr: 0,
          totalCashFlow: 0,
          totalAppreciation: 0,
          totalReturn: 0
        };
      }
      
      if (!analysis.longTermAnalysis.exitAnalysis) {
        logger.error('exitAnalysis is missing, adding default object');
        analysis.longTermAnalysis.exitAnalysis = {
          projectedSalePrice: 0,
          sellingCosts: 0,
          mortgagePayoff: 0,
          netProceedsFromSale: 0,
          totalProfit: 0,
          returnOnInvestment: 0
        };
      }
    } else {
      logger.error('longTermAnalysis is missing, creating with default values');
      analysis.longTermAnalysis = {
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
    }
    
    logger.info('Analysis completed successfully');
    res.json(analysis);
  } catch (error) {
    logger.error('Error analyzing deal:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'An unknown error occurred during analysis' });
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
      res.status(404).json({ message: 'Deal not found' });
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
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
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
      res.status(404).json({ message: 'Deal not found' });
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
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
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
      res.status(404).json({ message: 'Deal not found' });
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
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
};

// Sample SFR data
export const getSampleSFR = (req: Request, res: Response): void => {
  const sampleSFR = {
    propertyName: 'Sample SFR Property',
    propertyType: 'SFR',
    propertyAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345'
    },
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 4.5,
    loanTerm: 30,
    monthlyRent: 2500,
    squareFootage: 1500,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 1995,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    maintenanceCost: 150,
    propertyManagementRate: 8,
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
      street: '456 Apartment Blvd',
      city: 'Metroville',
      state: 'NY',
      zipCode: '54321'
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
  
  res.json(sampleMF);
}; 