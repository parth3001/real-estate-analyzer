console.log('Deals controller loaded from file:', __filename);
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { SFRAnalyzer } from '../analysis';
import { getOpenAIClient } from '../services/openai';
import { SFRData, DealData, MultiFamilyData } from '../types/propertyTypes';
import { MultiFamilyAnalyzer } from '../analysis/MultiFamilyAnalyzer';

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
const getAIInsights = async (dealData: SFRData, analysis: any) => {
  try {
    const openai = getOpenAIClient();
    // If no OpenAI client, return placeholder message
    if (!openai) {
      return {
        summary: "AI insights are not available. Please check your OpenAI API key.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: null
      };
    }

    // Calculate some additional metrics to enrich the prompt
    const downPaymentPercent = (dealData.downPayment / dealData.purchasePrice) * 100;
    const monthlyMortgage = analysis?.monthlyAnalysis?.expenses?.mortgage?.total ?? 0;
    const monthlyNOI = (analysis?.monthlyAnalysis?.cashFlow ?? 0) + monthlyMortgage;
    const dscr = monthlyMortgage !== 0 ? monthlyNOI / monthlyMortgage : 0;

    const prompt = `Analyze this single-family rental property investment:
    Purchase Price: $${dealData.purchasePrice}
    Down Payment: ${downPaymentPercent.toFixed(1)}%
    Monthly Rent: $${dealData.monthlyRent}
    Monthly NOI: $${monthlyNOI}
    DSCR: ${dscr.toFixed(2)}
    Cap Rate: ${analysis.annualAnalysis?.capRate?.toFixed(2) ?? 'N/A'}%
    Cash on Cash Return: ${analysis.annualAnalysis?.cashOnCashReturn?.toFixed(2) ?? 'N/A'}%
    
    Provide a concise analysis with:
    1. A 2-3 sentence summary
    2. 3 key strengths
    3. 3 potential weaknesses
    4. 3 specific recommendations
    5. An investment score from 0-100 based on the metrics`;

    const completion = await openai.completions.create({
      model: "text-davinci-003",
      prompt,
      max_tokens: 500,
      temperature: 0.7
    });
    const response = completion.choices[0].text?.trim() || '';
    
    // Parse the response
    const sections = response.split('\n\n');
    const summary = sections[0]?.replace('Summary:', '').trim();
    const strengths = sections[1]?.split('\n').filter(s => s.startsWith('-')).map(s => s.replace('-', '').trim()) || [];
    const weaknesses = sections[2]?.split('\n').filter(s => s.startsWith('-')).map(s => s.replace('-', '').trim()) || [];
    const recommendations = sections[3]?.split('\n').filter(s => s.startsWith('-')).map(s => s.replace('-', '').trim()) || [];
    const scoreMatch = sections[4]?.match(/\d+/);
    const investmentScore = scoreMatch ? parseInt(scoreMatch[0]) : null;

    return {
      summary,
      strengths,
      weaknesses,
      recommendations,
      investmentScore
    };
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return {
      summary: "Error generating AI insights. Please try again later.",
      strengths: [],
      weaknesses: [],
      recommendations: [],
      investmentScore: null
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
    const dealData = req.body as DealData;
    console.log('Analyzing deal with data:', JSON.stringify(dealData, null, 2));

    let analysis;
    let aiInsights;

    if (dealData.propertyType === 'SFR') {
      // SFR analysis logic
      const analyzer = new SFRAnalyzer(dealData, {
        projectionYears: dealData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: dealData.longTermAssumptions?.annualRentIncrease || 2,
        annualExpenseIncrease: dealData.longTermAssumptions?.inflationRate || 2,
        annualPropertyValueIncrease: dealData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: dealData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: dealData.longTermAssumptions?.vacancyRate || 5
      });
      analysis = analyzer.analyze();
      try {
        aiInsights = await getAIInsights(dealData, analysis);
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
      const analyzer = new MultiFamilyAnalyzer(dealData, {
        projectionYears: dealData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: dealData.longTermAssumptions?.annualRentIncrease || 2,
        annualExpenseIncrease: dealData.longTermAssumptions?.inflationRate || 2,
        annualPropertyValueIncrease: dealData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: dealData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: dealData.longTermAssumptions?.vacancyRate || 5
      });
      analysis = analyzer.analyze();
      aiInsights = null; // Optionally add MF AI logic here
    } else {
      res.status(400).json({ message: 'Invalid propertyType' });
      return;
    }

    // Ensure all required fields are present
    const fullAnalysis = {
      monthlyAnalysis: analysis.monthlyAnalysis ?? {},
      annualAnalysis: analysis.annualAnalysis ?? {},
      longTermAnalysis: analysis.longTermAnalysis ?? {},
      keyMetrics: analysis.keyMetrics ?? {},
      aiInsights
    };

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
  const sampleSFR: SFRData = {
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
  };
  res.json(sampleSFR);
};

// Sample MF endpoint
export const getSampleMF = async (req: Request, res: Response): Promise<void> => {
  console.log('getSampleMF endpoint hit from file:', __filename);
  const sampleMF: MultiFamilyData = {
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
  };
  res.json(sampleMF);
}; 