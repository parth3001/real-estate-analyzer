const express = require('express');
const router = express.Router();
const Joi = require('joi');
const DealContext = require('../contexts/DealContext');
const Deal = require('../models/Deal');
const logger = require('../utils/logger');
const storage = require('../utils/storage');

// Validation schemas
const dealSchema = Joi.object({
  propertyAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('USA')
  }).required(),
  propertyType: Joi.string().valid('single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'land').required(),
  purchasePrice: Joi.number().positive().required(),
  downPayment: Joi.number().positive().required(),
  interestRate: Joi.number().positive().required(),
  loanTerm: Joi.number().positive().required(),
  monthlyRent: Joi.number().positive().required(),
  propertyTax: Joi.number().positive().required(),
  insurance: Joi.number().positive().required(),
  maintenance: Joi.number().positive().required(),
  category: Joi.string().valid('residential', 'commercial', 'mixed_use', 'development', 'other').required(),
  tags: Joi.array().items(Joi.string())
});

const performanceSchema = Joi.object({
  actualRent: Joi.number().min(0).required(),
  actualExpenses: Joi.number().min(0).required(),
  occupancyRate: Joi.number().min(0).max(100).required(),
  appreciationRate: Joi.number().required()
});

const noteSchema = Joi.object({
  content: Joi.string().required(),
  category: Joi.string().valid('general', 'financial', 'property', 'tenant', 'maintenance', 'other').default('general')
});

const documentSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('contract', 'inspection', 'appraisal', 'tax', 'insurance', 'other').required(),
  url: Joi.string().uri().required(),
  description: Joi.string()
});

// Create and analyze a new deal
router.post('/analyze', async (req, res) => {
  try {
    const { error, value } = dealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const analyzedDeal = await storage.analyzeDeal(value);
    res.status(201).json(analyzedDeal);
  } catch (error) {
    logger.error('Error in deal analysis:', error);
    res.status(500).json({ error: 'Failed to analyze deal' });
  }
});

// Get all deals with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const deals = await storage.getAllDeals();
    res.json(deals);
  } catch (error) {
    logger.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Get a specific deal with full history
router.get('/:id', async (req, res) => {
  try {
    const deal = await storage.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (error) {
    logger.error('Error fetching deal:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

// Update deal performance metrics
router.post('/:id/performance', async (req, res) => {
  try {
    const { error, value } = performanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedDeal = await storage.updateDealPerformance(req.params.id, value);
    res.json(updatedDeal);
  } catch (error) {
    logger.error('Error updating performance:', error);
    res.status(500).json({ error: 'Failed to update performance metrics' });
  }
});

// Add a note to a deal
router.post('/:id/notes', async (req, res) => {
  try {
    const { error, value } = noteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedDeal = await storage.addNote(req.params.id, value);
    res.json(updatedDeal);
  } catch (error) {
    logger.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Add a document to a deal
router.post('/:id/documents', async (req, res) => {
  try {
    const { error, value } = documentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedDeal = await storage.addDocument(req.params.id, value);
    res.json(updatedDeal);
  } catch (error) {
    logger.error('Error adding document:', error);
    res.status(500).json({ error: 'Failed to add document' });
  }
});

// Compare multiple deals
router.post('/compare', async (req, res) => {
  try {
    const { dealIds } = req.body;
    if (!Array.isArray(dealIds) || dealIds.length < 2) {
      return res.status(400).json({ error: 'Please provide at least two deal IDs to compare' });
    }

    const comparison = await storage.compareDeals(dealIds);
    res.json(comparison);
  } catch (error) {
    logger.error('Error comparing deals:', error);
    res.status(500).json({ error: 'Failed to compare deals' });
  }
});

// Get deal history
router.get('/:id/history', async (req, res) => {
  try {
    const deal = await storage.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({
      history: deal.history,
      analysisHistory: deal.analysisHistory
    });
  } catch (error) {
    logger.error('Error fetching deal history:', error);
    res.status(500).json({ error: 'Failed to fetch deal history' });
  }
});

// Update deal tags
router.put('/:id/tags', async (req, res) => {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    const deal = await storage.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    deal.tags = tags;
    await storage.updateDeal(req.params.id, deal);
    res.json(deal);
  } catch (error) {
    logger.error('Error updating tags:', error);
    res.status(500).json({ error: 'Failed to update tags' });
  }
});

// Update a deal
router.put('/:id', async (req, res) => {
  try {
    const updatedDeal = await storage.updateDeal(req.params.id, req.body);
    if (!updatedDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(updatedDeal);
  } catch (error) {
    logger.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// Delete a deal
router.delete('/:id', async (req, res) => {
  try {
    const success = await storage.deleteDeal(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting deal:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

// Helper functions for analysis calculations
function calculateMonthlyAnalysis(dealData) {
  const {
    monthlyRent,
    propertyTax,
    insurance,
    maintenance,
    sfrDetails
  } = dealData;

  const monthlyPropertyTax = propertyTax / 12;
  const monthlyInsurance = insurance / 12;
  const monthlyMaintenance = maintenance || (monthlyRent * 0.05); // 5% of rent if not specified
  const managementFee = (monthlyRent * sfrDetails.propertyManagement.feePercentage) / 100;

  const expenses = {
    propertyTax: monthlyPropertyTax,
    insurance: monthlyInsurance,
    maintenance: monthlyMaintenance,
    managementFee,
    total: monthlyPropertyTax + monthlyInsurance + monthlyMaintenance + managementFee
  };

  return {
    income: {
      baseRent: monthlyRent,
      total: monthlyRent
    },
    expenses,
    cashFlow: monthlyRent - expenses.total
  };
}

function calculateAnnualAnalysis(dealData) {
  const {
    purchasePrice,
    downPayment,
    monthlyRent
  } = dealData;

  const monthlyAnalysis = calculateMonthlyAnalysis(dealData);
  const annualCashFlow = monthlyAnalysis.cashFlow * 12;
  const cashOnCashReturn = (annualCashFlow / downPayment) * 100;
  const capRate = ((annualCashFlow + (monthlyAnalysis.expenses.total * 12)) / purchasePrice) * 100;

  return {
    annualCashFlow,
    cashOnCashReturn,
    capRate
  };
}

function calculateLongTermAnalysis(dealData) {
  const {
    purchasePrice,
    sfrDetails
  } = dealData;

  const {
    annualRentIncrease,
    annualPropertyValueIncrease,
    sellingCostsPercentage,
    projectionYears
  } = sfrDetails.longTermAssumptions;

  const monthlyAnalysis = calculateMonthlyAnalysis(dealData);
  const yearlyProjections = [];
  let currentRent = monthlyAnalysis.income.baseRent;
  let currentValue = purchasePrice;
  let totalCashFlow = 0;

  for (let year = 1; year <= projectionYears; year++) {
    currentRent *= (1 + annualRentIncrease / 100);
    currentValue *= (1 + annualPropertyValueIncrease / 100);
    const yearCashFlow = currentRent * 12 - (monthlyAnalysis.expenses.total * 12);
    totalCashFlow += yearCashFlow;

    yearlyProjections.push({
      year,
      propertyValue: currentValue,
      cashFlow: yearCashFlow,
      equity: currentValue - (purchasePrice - dealData.downPayment)
    });
  }

  const exitAnalysis = {
    projectedSalePrice: currentValue,
    sellingCosts: currentValue * (sellingCostsPercentage / 100),
    mortgagePayoff: purchasePrice - dealData.downPayment,
    netProceedsFromSale: currentValue * (1 - sellingCostsPercentage / 100) - (purchasePrice - dealData.downPayment)
  };

  // Calculate IRR
  const cashFlows = [-dealData.downPayment];
  yearlyProjections.forEach(year => {
    cashFlows.push(year.cashFlow);
  });
  cashFlows[cashFlows.length - 1] += exitAnalysis.netProceedsFromSale;

  return {
    yearlyProjections,
    exitAnalysis,
    returns: {
      totalCashFlow,
      totalAppreciation: currentValue - purchasePrice,
      irr: calculateIRR(cashFlows) || 0,
      totalReturn: totalCashFlow + exitAnalysis.netProceedsFromSale
    }
  };
}

function calculateIRR(cashFlows, guess = 0.1) {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    const npv = cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
    if (Math.abs(npv) < tolerance) break;

    const derivativeNpv = cashFlows.reduce((acc, cf, t) => acc - t * cf / Math.pow(1 + rate, t + 1), 0);
    rate = rate - npv / derivativeNpv;
  }

  return rate * 100; // Convert to percentage
}

module.exports = router; 