console.log('Deals router loaded from file:', __filename);
import express, { Router } from 'express';
import * as dealsController from '../controllers/deals';

const router: Router = express.Router();

// Utility functions for calculations
const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
};

const calculateCashFlow = (monthlyRent: number, monthlyExpenses: number, monthlyMortgage: number): number => {
  return monthlyRent - monthlyExpenses - monthlyMortgage;
};

const calculateCapRate = (annualNOI: number, purchasePrice: number): number => {
  return (annualNOI / purchasePrice) * 100;
};

const calculateCashOnCashReturn = (annualCashFlow: number, downPayment: number): number => {
  return (annualCashFlow / downPayment) * 100;
};

const calculateIRR = (cashFlows: number[], initialInvestment: number): number => {
  // Simple IRR calculation - in real world, use a financial library
  const rate = 0.1; // 10% estimate
  const npv = cashFlows.reduce((acc, cf, i) => {
    return acc + cf / Math.pow(1 + rate, i + 1);
  }, -initialInvestment);
  
  return rate * 100; // Return as percentage
};

// Sample SFR and MF endpoints
router.get('/sample-sfr', dealsController.getSampleSFR);
router.get('/sample-mf', dealsController.getSampleMF);

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

export default router; 