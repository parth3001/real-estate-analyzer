const fs = require('fs').promises;
const path = require('path');
const { calculateSFRMetrics } = require('../utils/analysis');
const { OpenAI } = require('openai');

const DEALS_DIR = path.join(__dirname, '../../data/deals');
const DEALS_FILE = path.join(DEALS_DIR, 'deals.json');

// Ensure the deals directory exists
async function ensureDealsDirectory() {
  try {
    await fs.access(DEALS_DIR);
  } catch {
    await fs.mkdir(DEALS_DIR, { recursive: true });
  }
}

// Load deals from file
async function loadDeals() {
  try {
    await ensureDealsDirectory();
    const data = await fs.readFile(DEALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

// Save deals to file
async function saveDeals(deals) {
  await ensureDealsDirectory();
  await fs.writeFile(DEALS_FILE, JSON.stringify(deals, null, 2));
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Utility function to get AI insights
async function getAIInsights(dealData, analysis) {
  try {
    // If no OpenAI API key, return placeholder message
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_ope************here') {
      return {
        summary: "AI insights are not available. Please add your OpenAI API key to the .env file.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: null
      };
    }

    // Calculate some additional metrics to enrich the prompt
    const downPaymentPercent = ((dealData.downPayment / dealData.purchasePrice) * 100).toFixed(2);
    const grossRentMultiplier = (dealData.purchasePrice / (dealData.monthlyRent * 12)).toFixed(2);
    const onePercentRule = ((dealData.monthlyRent / dealData.purchasePrice) * 100).toFixed(2);
    
    // Access monthly expenses data from analysis instead of dealData
    const monthlyExpenses = analysis.monthlyAnalysis?.expenses?.operatingExpenses || 'N/A';
    
    const prompt = `
    Analyze this real estate investment deal with the following details:

    PROPERTY DETAILS:
    - Address: ${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}, ${dealData.propertyAddress.state} ${dealData.propertyAddress.zipCode || ''}
    - Type: Single Family Residential
    - Bedrooms: ${dealData.sfrDetails?.bedrooms || 'N/A'}
    - Bathrooms: ${dealData.sfrDetails?.bathrooms || 'N/A'}
    - Square Feet: ${dealData.sfrDetails?.squareFootage || 'N/A'}
    - Year Built: ${dealData.sfrDetails?.yearBuilt || 'N/A'}
    - Property Condition: ${dealData.sfrDetails?.condition || 'N/A'}

    FINANCIAL DETAILS:
    - Purchase Price: $${dealData.purchasePrice}
    - Down Payment: $${dealData.downPayment} (${downPaymentPercent}%)
    - Monthly Rent: $${dealData.monthlyRent}
    - Monthly Operating Expenses: $${monthlyExpenses}
    - Property Tax Rate: ${dealData.propertyTaxRate}%
    - Insurance Rate: ${dealData.insuranceRate}%
    - Maintenance: $${dealData.maintenance || 'N/A'}
    - Property Management Fee: ${dealData.sfrDetails?.propertyManagement?.feePercentage || 'N/A'}%
    - Loan Details: ${dealData.loanTerm || 30} years at ${dealData.interestRate || 'N/A'}% interest rate

    MONTHLY ANALYSIS:
    - Monthly Income: $${analysis.monthlyAnalysis?.income?.baseRent || 'N/A'}
    - Monthly Operating Expenses: $${analysis.monthlyAnalysis?.expenses?.operatingExpenses || 'N/A'}
    - Monthly Mortgage Payment: $${analysis.monthlyAnalysis?.expenses?.mortgage?.total || 'N/A'}
    - Monthly Cash Flow: $${analysis.monthlyAnalysis?.cashFlow || 'N/A'}

    ANNUAL & LONG-TERM METRICS:
    - Annual Cash Flow: $${analysis.annualAnalysis?.cashFlow || 'N/A'}
    - Cash on Cash Return: ${analysis.annualAnalysis?.cashOnCashReturn?.toFixed(2) || 'N/A'}%
    - Cap Rate: ${analysis.annualAnalysis?.capRate?.toFixed(2) || 'N/A'}%
    - Total Return (${analysis.longTermAnalysis?.projectionYears || 10} years): ${analysis.longTermAnalysis?.returns?.totalReturn?.toFixed(2) || 'N/A'}
    - IRR (${analysis.longTermAnalysis?.projectionYears || 10} years): ${analysis.longTermAnalysis?.returns?.irr?.toFixed(2) || 'N/A'}%
    - DSCR: ${analysis.annualAnalysis?.dscr?.toFixed(2) || 'N/A'}
    - Gross Rent Multiplier: ${grossRentMultiplier}
    - 1% Rule Percentage: ${onePercentRule}%

    ASSUMPTIONS:
    - Annual Rent Increase: ${dealData.sfrDetails?.longTermAssumptions?.annualRentIncrease || 2}%
    - Annual Property Value Increase: ${dealData.sfrDetails?.longTermAssumptions?.annualPropertyValueIncrease || 3}%
    - Inflation Rate: ${dealData.sfrDetails?.longTermAssumptions?.inflationRate || 2}%
    - Vacancy Rate: ${dealData.sfrDetails?.longTermAssumptions?.vacancyRate || 5}%
    - Projection Period: ${dealData.sfrDetails?.longTermAssumptions?.projectionYears || 10} years

    Please provide a detailed analysis in JSON format with the following structure:
    {
      "summary": "2-3 sentences overall summary of the investment",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2", "weakness3"],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
      "investmentScore": 0-100 score with 100 being excellent
    }

    The analysis should focus on the financial viability, potential risks, and opportunities for improvement. Be specific, data-driven, and actionable in your recommendations. Make sure your analysis takes into account all the provided metrics - do not mention any missing data as a weakness if the data is provided above.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can use gpt-4 for better analysis if available
      messages: [
        {
          role: "system",
          content: "You are a real estate investment expert and financial analyst. Your job is to analyze real estate deals and provide concise, actionable insights to investors. Your analysis should be data-driven, honest, and include specific recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    // Parse the JSON response
    const aiResponse = JSON.parse(response.choices[0].message.content);
    
    // Ensure all required fields are present
    return {
      summary: aiResponse.summary || "No summary provided",
      strengths: aiResponse.strengths || [],
      weaknesses: aiResponse.weaknesses || [],
      recommendations: aiResponse.recommendations || [],
      investmentScore: aiResponse.investmentScore || null
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
}

// Get all deals
exports.getAllDeals = async (req, res) => {
  try {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const deals = await loadDeals();
    
    // Sort deals
    deals.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'desc' ? 
        (bValue > aValue ? 1 : -1) : 
        (aValue > bValue ? 1 : -1);
    });

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single deal
exports.getDeal = async (req, res) => {
  try {
    const deals = await loadDeals();
    const deal = deals.find(d => d.id === req.params.id);
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a deal
exports.createDeal = async (req, res) => {
  try {
    const deals = await loadDeals();
    const newDeal = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    deals.push(newDeal);
    await saveDeals(deals);
    res.status(201).json(newDeal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a deal
exports.updateDeal = async (req, res) => {
  try {
    const deals = await loadDeals();
    const index = deals.findIndex(d => d.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    deals[index] = {
      ...deals[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await saveDeals(deals);
    res.json(deals[index]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a deal
exports.deleteDeal = async (req, res) => {
  try {
    const deals = await loadDeals();
    const filteredDeals = deals.filter(d => d.id !== req.params.id);
    
    if (filteredDeals.length === deals.length) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    await saveDeals(filteredDeals);
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Analyze a deal
exports.analyzeDeal = async (req, res) => {
  try {
    const dealData = req.body;
    
    // Perform core analysis
    const analysis = await calculateSFRMetrics(dealData);
    
    // Add AI insights if OpenAI API key is available
    let aiInsights;
    try {
      aiInsights = await getAIInsights(dealData, analysis);
    } catch (error) {
      console.error('Error getting AI insights:', error);
      aiInsights = {
        summary: "Error generating AI insights. Please try again later.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: null
      };
    }
    
    // Combine analysis with AI insights
    const fullAnalysis = {
      ...analysis,
      aiInsights
    };

    // Validate long term assumptions
    if (dealData.longTermAssumptions) {
      const { annualRentIncrease, annualPropertyValueIncrease, sellingCostsPercentage, inflationRate, vacancyRate, projectionYears } = dealData.longTermAssumptions;

      if (annualRentIncrease < 0 || annualRentIncrease > 100) {
        return res.status(400).json({ error: 'Annual rent increase must be between 0 and 100%' });
      }
      if (annualPropertyValueIncrease < 0 || annualPropertyValueIncrease > 100) {
        return res.status(400).json({ error: 'Annual property value increase must be between 0 and 100%' });
      }
      if (sellingCostsPercentage < 0 || sellingCostsPercentage > 100) {
        return res.status(400).json({ error: 'Selling costs percentage must be between 0 and 100%' });
      }
      if (inflationRate < 0 || inflationRate > 100) {
        return res.status(400).json({ error: 'Inflation rate must be between 0 and 100%' });
      }
      if (vacancyRate < 0 || vacancyRate > 100) {
        return res.status(400).json({ error: 'Vacancy rate must be between 0 and 100%' });
      }
      if (projectionYears < 1 || projectionYears > 30) {
        return res.status(400).json({ error: 'Projection years must be between 1 and 30' });
      }
    }

    res.json(fullAnalysis);
  } catch (error) {
    console.error('Error analyzing deal:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add a note to a deal
exports.addNote = async (req, res) => {
  try {
    const deals = await loadDeals();
    const deal = deals.find(d => d.id === req.params.id);
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
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
    res.status(400).json({ message: error.message });
  }
};

// Add a document to a deal
exports.addDocument = async (req, res) => {
  try {
    const deals = await loadDeals();
    const deal = deals.find(d => d.id === req.params.id);
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
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
    res.status(400).json({ message: error.message });
  }
};

// Add performance metrics to a deal
exports.addPerformanceMetrics = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    deal.performanceMetrics.push({
      ...req.body,
      recordedAt: new Date()
    });

    await deal.save();
    res.json(deal.performanceMetrics[deal.performanceMetrics.length - 1]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 