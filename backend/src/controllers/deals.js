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
    const prompt = `Analyze this real estate deal:
    Property: ${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}, ${dealData.propertyAddress.state}
    Type: Single Family Residential
    Purchase Price: $${dealData.purchasePrice}
    Monthly Rent: $${dealData.monthlyRent}
    Key Metrics:
    - IRR: ${analysis.irr}%
    - Cash on Cash Return: ${analysis.cashOnCash}%
    - Cap Rate: ${analysis.capRate}%
    - Monthly Cash Flow: $${analysis.monthlyCashFlow}

    Provide a brief analysis of this deal's strengths, weaknesses, and recommendations. Focus on the financial viability and potential risks.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a real estate investment expert. Analyze deals and provide concise, actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return 'AI insights currently unavailable';
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
    let aiInsights = 'AI insights currently unavailable';
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_ope************here') {
      try {
        aiInsights = await getAIInsights(dealData, analysis);
      } catch (error) {
        console.error('Error getting AI insights:', error);
        aiInsights = 'AI insights currently unavailable';
      }
    }
    
    // Combine analysis with AI insights
    const fullAnalysis = {
      ...analysis,
      aiInsights
    };

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