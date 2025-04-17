const express = require('express');
const router = express.Router();
const dealsController = require('../controllers/deals');

// Utility functions for calculations
const calculateMonthlyPayment = (principal, annualRate, years) => {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
};

const calculateCashFlow = (monthlyRent, monthlyExpenses, monthlyMortgage) => {
  return monthlyRent - monthlyExpenses - monthlyMortgage;
};

const calculateCapRate = (annualNOI, purchasePrice) => {
  return (annualNOI / purchasePrice) * 100;
};

const calculateCashOnCashReturn = (annualCashFlow, downPayment) => {
  return (annualCashFlow / downPayment) * 100;
};

const calculateIRR = (cashFlows, initialInvestment) => {
  // Simple IRR calculation - in real world, use a financial library
  const rate = 0.1; // 10% estimate
  const npv = cashFlows.reduce((acc, cf, i) => {
    return acc + cf / Math.pow(1 + rate, i + 1);
  }, -initialInvestment);
  
  return rate * 100; // Return as percentage
};

// Get all deals with optional sorting
router.get('/', dealsController.getAllDeals);

// Get a single deal by ID
router.get('/:id', dealsController.getDeal);

// Create a new deal
router.post('/', dealsController.createDeal);

// Update a deal
router.put('/:id', dealsController.updateDeal);

// Delete a deal
router.delete('/:id', dealsController.deleteDeal);

// Analyze a deal
router.post('/analyze', dealsController.analyzeDeal);

// Add a note to a deal
router.post('/:id/notes', dealsController.addNote);

// Add a document to a deal
router.post('/:id/documents', dealsController.addDocument);

// Add performance metrics to a deal
router.post('/:id/performance', dealsController.addPerformanceMetrics);

module.exports = router; 