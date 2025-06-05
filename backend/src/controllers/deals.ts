console.log('Deals controller loaded from file:', __filename);
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { SFRAnalyzer } from '../analysis';
import { getOpenAIClient } from '../services/openai';
import { SFRData, DealData, MultiFamilyData } from '../types/propertyTypes';
import { MultiFamilyAnalyzer } from '../analysis/MultiFamilyAnalyzer';
import { sfrAnalysisPrompt, mfAnalysisPrompt } from '../prompts/aiPrompts';
import { generateAnalysis } from '../services/openai';

const DEALS_DIR = path.join(__dirname, '../../data/deals');
const DEALS_FILE = path.join(DEALS_DIR, 'deals.json');

interface Deal {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

// Ensure the deals directory exists
async function ensureDealsDirectory(): Promise<void> {
  try {
    await fs.access(DEALS_DIR);
  } catch {
    await fs.mkdir(DEALS_DIR, { recursive: true });
  }
}

// Load deals from file
async function loadDeals(): Promise<Deal[]> {
  try {
    await ensureDealsDirectory();
    const data = await fs.readFile(DEALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // If file doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

// Save deals to file
async function saveDeals(deals: Deal[]): Promise<void> {
  await ensureDealsDirectory();
  await fs.writeFile(DEALS_FILE, JSON.stringify(deals, null, 2));
}

// Utility function to get AI insights
const getAIInsights = async (dealData: SFRData | MultiFamilyData, analysis: any) => {
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
      dscr: analysis.metrics.dscr || 0,
      capRate: analysis.metrics.capRate || 0,
      cashOnCashReturn: analysis.metrics.cashOnCashReturn || 0,
      irr: analysis.metrics.irr || 0,
      purchasePrice: dealData.purchasePrice || 0,
      monthlyRent: dealData.propertyType === 'SFR' ? (dealData as SFRData).monthlyRent || 0 : 0,
      propertyType: dealData.propertyType || 'SFR'
    };

    console.log('Key metrics for AI analysis:', metrics);

    // Get the appropriate prompt without adding anything to it
    let prompt: string;
    if (dealData.propertyType === 'SFR') {
      prompt = sfrAnalysisPrompt(dealData, analysis);
    } else if (dealData.propertyType === 'MF') {
      prompt = mfAnalysisPrompt(dealData, analysis);
    } else {
      throw new Error('Unsupported propertyType for AI analysis');
    }

    console.log('Sending prompt to OpenAI:', prompt.substring(0, 200) + '...');

    // Use the generateAnalysis function from the openai service
    const aiResponse = await generateAnalysis(prompt);
    console.log('AI response parsed successfully:', Object.keys(aiResponse));
    
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
    console.error('Error getting AI insights:', error);
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
    const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const deals = await loadDeals();
    
    // Sort deals
    deals.sort((a: Deal, b: Deal) => {
      const aValue = a[sortBy as string];
      const bValue = b[sortBy as string];
      return sortOrder === 'desc' ? 
        (bValue > aValue ? 1 : -1) : 
        (aValue > bValue ? 1 : -1);
    });

    res.json(deals);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

// Get a single deal
export const getDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const deals = await loadDeals();
    const deal = deals.find(d => d.id === req.params.id);
    
    if (!deal) {
      res.status(404).json({ message: 'Deal not found' });
      return;
    }
    res.json(deal);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

// Create a deal
export const createDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const deals = await loadDeals();
    const newDeal: Deal = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    deals.push(newDeal);
    await saveDeals(deals);
    res.status(201).json(newDeal);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
};

// Update a deal
export const updateDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const deals = await loadDeals();
    const index = deals.findIndex(d => d.id === req.params.id);
    
    if (index === -1) {
      res.status(404).json({ message: 'Deal not found' });
      return;
    }

    deals[index] = {
      ...deals[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await saveDeals(deals);
    res.json(deals[index]);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
};

// Delete a deal
export const deleteDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const deals = await loadDeals();
    const filteredDeals = deals.filter(d => d.id !== req.params.id);
    
    if (filteredDeals.length === deals.length) {
      res.status(404).json({ message: 'Deal not found' });
      return;
    }

    await saveDeals(filteredDeals);
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

// Analyze a deal
export const analyzeDeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const dealData = req.body;
    console.log('Analyzing deal with data:', JSON.stringify(dealData, null, 2));

    let analysis;
    let aiInsights;

    if (!dealData.propertyType || !dealData.propertyData) {
      res.status(400).json({ message: 'Missing required fields: propertyType and propertyData' });
      return;
    }

    // Extract the property data from the request
    const propertyData = {
      ...dealData.propertyData,
      propertyType: dealData.propertyType // Ensure propertyType is at the top level
    };

    console.log('Extracted property data:', JSON.stringify(propertyData, null, 2));

    if (dealData.propertyType === 'SFR') {
      // SFR analysis logic
      const analyzer = new SFRAnalyzer(propertyData, {
        projectionYears: propertyData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: propertyData.longTermAssumptions?.annualRentIncrease || 2,
        annualExpenseIncrease: propertyData.longTermAssumptions?.inflationRate || 2,
        annualPropertyValueIncrease: propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: propertyData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: propertyData.longTermAssumptions?.vacancyRate || 5
      });
      analysis = analyzer.analyze();
      try {
        aiInsights = await getAIInsights(propertyData, analysis);
      } catch (error) {
        aiInsights = {
          summary: "Error generating AI insights. Please try again later.",
          strengths: [],
          weaknesses: [],
          recommendations: [],
          investmentScore: null
        };
      }
    } else if (dealData.propertyType === 'MF') {
      // MF analysis logic
      const analyzer = new MultiFamilyAnalyzer(propertyData, {
        projectionYears: propertyData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: propertyData.longTermAssumptions?.annualRentIncrease || 2,
        annualExpenseIncrease: propertyData.longTermAssumptions?.inflationRate || 2,
        annualPropertyValueIncrease: propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: propertyData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: propertyData.longTermAssumptions?.vacancyRate || 5
      });
      analysis = analyzer.analyze();
      aiInsights = null; // Optionally add MF AI logic here
    } else {
      res.status(400).json({ message: 'Invalid propertyType' });
      return;
    }

    // Create a proper response structure that the frontend expects
    const monthlyAnalysis = {
      income: {
        gross: propertyData.monthlyRent || 0,
        effective: (propertyData.monthlyRent || 0) * (1 - (propertyData.longTermAssumptions?.vacancyRate || 5) / 100)
      },
      expenses: {
        propertyTax: analysis.monthlyAnalysis.expenses.breakdown.propertyTax || 0,
        insurance: analysis.monthlyAnalysis.expenses.breakdown.insurance || 0,
        maintenance: analysis.monthlyAnalysis.expenses.breakdown.maintenance || 0,
        propertyManagement: analysis.monthlyAnalysis.expenses.breakdown.propertyManagement || 0,
        vacancy: analysis.monthlyAnalysis.expenses.breakdown.vacancy || 0,
        mortgage: {
          total: analysis.monthlyAnalysis.expenses.debt || 0,
          principal: 0, // Placeholder as this might not be in the analysis
          interest: 0, // Placeholder as this might not be in the analysis
        },
        total: analysis.monthlyAnalysis.expenses.total || 0
      },
      grossRentalIncome: propertyData.monthlyRent || 0,
      cashFlow: analysis.monthlyAnalysis.cashFlow || 0,
      cashFlowAfterTax: analysis.monthlyAnalysis.cashFlow || 0 // Placeholder as this might not be calculated
    };

    const annualAnalysis = {
      dscr: analysis.metrics.dscr || 0,
      cashOnCashReturn: analysis.metrics.cashOnCashReturn || 0,
      capRate: analysis.metrics.capRate || 0,
      totalInvestment: propertyData.downPayment + (propertyData.closingCosts || 0),
      annualNOI: analysis.annualAnalysis.noi || 0,
      noi: analysis.annualAnalysis.noi || 0,
      annualDebtService: analysis.annualAnalysis.debtService || 0,
      effectiveGrossIncome: analysis.annualAnalysis.income * (1 - (propertyData.longTermAssumptions?.vacancyRate || 5) / 100) || 0,
      income: analysis.annualAnalysis.income || 0
    };

    const longTermAnalysis = {
      yearlyProjections: analysis.projections || [],
      projectionYears: propertyData.longTermAssumptions?.projectionYears || 10,
      returns: {
        irr: analysis.metrics.irr || 0,
        totalCashFlow: analysis.projections?.reduce((sum, year) => sum + year.cashFlow, 0) || 0,
        totalAppreciation: analysis.projections?.[analysis.projections.length - 1]?.appreciation || 0,
        totalReturn: analysis.projections?.[analysis.projections.length - 1]?.totalReturn || 0
      },
      exitAnalysis: analysis.exitAnalysis || {
        projectedSalePrice: 0,
        sellingCosts: 0,
        mortgagePayoff: 0,
        netProceedsFromSale: 0
      }
    };

    // Include other key metrics from the analysis
    const keyMetrics = {
      pricePerSqFtAtPurchase: analysis.metrics.pricePerSqFt || 0,
      pricePerSqFtAtSale: analysis.exitAnalysis?.projectedSalePrice / propertyData.squareFootage || 0,
      avgRentPerSqFt: analysis.metrics.rentPerSqFt || 0,
      operatingExpenseRatio: analysis.metrics.operatingExpenseRatio || 0,
      grossRentMultiplier: analysis.metrics.grossRentMultiplier || 0,
      // Add any other metrics the frontend might expect
    };

    // Final response object
    const fullAnalysis = {
      monthlyAnalysis,
      annualAnalysis,
      longTermAnalysis,
      keyMetrics,
      aiInsights
    };

    // Log the analysis details before sending response
    console.log('==== ANALYSIS RESPONSE DETAILS ====');
    console.log('Monthly Analysis:', JSON.stringify(fullAnalysis.monthlyAnalysis, null, 2));
    console.log('Annual Analysis:', JSON.stringify(fullAnalysis.annualAnalysis, null, 2));
    console.log('Key Metrics:', JSON.stringify(fullAnalysis.keyMetrics, null, 2));
    console.log('Response Size:', JSON.stringify(fullAnalysis).length, 'bytes');
    console.log('=================================');

    res.json(fullAnalysis);
  } catch (error) {
    console.error('Error in analyzeDeal:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

// Add a note to a deal
export const addNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const deals = await loadDeals();
    const deal = deals.find(d => d.id === req.params.id);
    
    if (!deal) {
      res.status(404).json({ message: 'Deal not found' });
      return;
    }

    const note = {
      id: Date.now().toString(),
      content: req.body.note,
      createdAt: new Date().toISOString()
    };

    if (!deal.notes) deal.notes = [];
    deal.notes.push(note);
    
    await saveDeals(deals);
    res.status(201).json(note);
  } catch (error) {
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
    const deals = await loadDeals();
    const deal = deals.find(d => d.id === req.params.id);
    
    if (!deal) {
      res.status(404).json({ message: 'Deal not found' });
      return;
    }

    const document = {
      id: Date.now().toString(),
      title: req.body.title,
      url: req.body.url,
      type: req.body.type,
      uploadedAt: new Date().toISOString()
    };

    if (!deal.documents) deal.documents = [];
    deal.documents.push(document);
    
    await saveDeals(deals);
    res.status(201).json(document);
  } catch (error) {
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
    const deals = await loadDeals();
    const deal = deals.find(d => d.id === req.params.id);
    
    if (!deal) {
      res.status(404).json({ message: 'Deal not found' });
      return;
    }

    if (!deal.performanceMetrics) deal.performanceMetrics = [];
    deal.performanceMetrics.push({
      ...req.body,
      recordedAt: new Date()
    });

    await saveDeals(deals);
    res.json(deal.performanceMetrics[deal.performanceMetrics.length - 1]);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
};

// Sample SFR endpoint
export const getSampleSFR = async (req: Request, res: Response): Promise<void> => {
  console.log('getSampleSFR endpoint hit from file:', __filename);
  const sampleSFR = {
    propertyType: 'SFR',
    propertyData: {
      propertyType: 'SFR',
      propertyAddress: {
        street: '123 Main St',
        city: 'Sample City',
        state: 'CA',
        zipCode: '12345'
      },
      purchasePrice: 300000,
      downPayment: 60000,
      interestRate: 3.5,
      loanTerm: 30,
      monthlyRent: 2000,
      propertyTaxRate: 1.2,
      insuranceRate: 0.5,
      squareFootage: 1500,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2000,
      propertyManagementRate: 8,
      maintenanceCost: 100,
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCostsPercentage: 6,
        inflationRate: 2,
        vacancyRate: 5
      }
    }
  };
  res.json(sampleSFR);
};

// Sample MF endpoint
export const getSampleMF = async (req: Request, res: Response): Promise<void> => {
  console.log('getSampleMF endpoint hit from file:', __filename);
  const sampleMF = {
    propertyType: 'MF',
    propertyData: {
      propertyType: 'MF',
      propertyAddress: {
        street: '456 Oak Ave',
        city: 'Sample City',
        state: 'CA',
        zipCode: '12345'
      },
      purchasePrice: 1000000,
      downPayment: 200000,
      interestRate: 3.5,
      loanTerm: 30,
      propertyTaxRate: 1.2,
      insuranceRate: 0.5,
      totalUnits: 8,
      totalSqft: 8000,
      unitTypes: [
        { type: '1B1B', count: 4, sqft: 800, monthlyRent: 1200 },
        { type: '2B1B', count: 4, sqft: 1200, monthlyRent: 1800 }
      ],
      yearBuilt: 2000,
      propertyManagementRate: 8,
      utilities: 500,
      commonAreaElectricity: 100,
      landscaping: 50,
      propertyManagement: 200,
      waterSewer: 150,
      garbage: 50,
      marketingAndAdvertising: 100,
      repairsAndMaintenance: 200,
      capEx: 100,
      maintenanceCost: 300,
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCostsPercentage: 6,
        inflationRate: 2,
        vacancyRate: 5
      }
    }
  };
  res.json(sampleMF);
}; 