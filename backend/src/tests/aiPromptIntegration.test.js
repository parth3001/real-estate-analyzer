const { sfrAnalysisPrompt, mfAnalysisPrompt } = require('../prompts/aiPrompts');
const { getAIInsights } = require('../services/aiService');
const { DealContext } = require('../contexts/DealContext');
const { beforeEach, describe, expect, it, jest } = require('@jest/globals');

// Mock the OpenAI client to avoid making actual API calls during tests
jest.mock('../services/openai', () => ({
  getOpenAIClient: jest.fn().mockReturnValue({
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            text: JSON.stringify({
              summary: 'Test summary',
              strengths: ['Strength 1', 'Strength 2'],
              weaknesses: ['Weakness 1', 'Weakness 2'],
              recommendations: ['Recommendation 1', 'Recommendation 2'],
              investmentScore: 75
            })
          }
        ]
      })
    }
  })
}));

// Sample SFR deal data for testing
const sfrDealData = {
  propertyType: 'SFR',
  purchasePrice: 250000,
  downPayment: 50000,
  interestRate: 4.5,
  loanTerm: 30,
  monthlyRent: 2000,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  maintenanceCost: 200,
  propertyManagementRate: 8,
  propertyAddress: {
    street: '123 Test St',
    city: 'Testville',
    state: 'TX',
    zipCode: '12345'
  },
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1500,
  yearBuilt: 2000
};

// Sample MF deal data for testing
const mfDealData = {
  propertyType: 'MF',
  purchasePrice: 1000000,
  downPayment: 200000,
  interestRate: 4.5,
  loanTerm: 30,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  maintenanceCost: 500,
  propertyManagementRate: 8,
  propertyAddress: {
    street: '456 Test Ave',
    city: 'Testville',
    state: 'TX',
    zipCode: '12345'
  },
  totalUnits: 4,
  totalSqft: 4000,
  yearBuilt: 1990,
  unitTypes: [
    { type: '1BR', count: 2, sqft: 800, monthlyRent: 1000 },
    { type: '2BR', count: 2, sqft: 1200, monthlyRent: 1500 }
  ]
};

// Sample analysis results for testing
const sampleAnalysis = {
  monthlyAnalysis: {
    cashFlow: 500,
    expenses: {
      mortgage: { total: 1000 }
    }
  },
  annualAnalysis: {
    capRate: 6.5,
    cashOnCashReturn: 8.2
  }
};

describe('AI Prompt Integration', () => {
  describe('sfrAnalysisPrompt', () => {
    it('should generate a valid SFR prompt', () => {
      const prompt = sfrAnalysisPrompt(sfrDealData, sampleAnalysis);
      
      // Verify the prompt contains key expected elements
      expect(prompt).toContain('PROPERTY DETAILS');
      expect(prompt).toContain(`Purchase Price: $${sfrDealData.purchasePrice}`);
      expect(prompt).toContain(`Monthly Rent: $${sfrDealData.monthlyRent}`);
      expect(prompt).toContain('FINANCIAL METRICS');
    });
  });

  describe('mfAnalysisPrompt', () => {
    it('should generate a valid MF prompt', () => {
      const prompt = mfAnalysisPrompt(mfDealData, sampleAnalysis);
      
      // Verify the prompt contains key expected elements
      expect(prompt).toContain('PROPERTY DETAILS');
      expect(prompt).toContain(`Purchase Price: $${mfDealData.purchasePrice}`);
      expect(prompt).toContain('UNIT MIX');
      expect(prompt).toContain('FINANCIAL METRICS');
    });
  });

  describe('getAIInsights', () => {
    it('should return AI insights for SFR deals', async () => {
      const insights = await getAIInsights(sfrDealData, sampleAnalysis);
      
      // Verify structure of returned insights
      expect(insights).toHaveProperty('summary');
      expect(insights).toHaveProperty('strengths');
      expect(insights).toHaveProperty('weaknesses');
      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('investmentScore');
    });

    it('should return AI insights for MF deals', async () => {
      const insights = await getAIInsights(mfDealData, sampleAnalysis);
      
      // Verify structure of returned insights
      expect(insights).toHaveProperty('summary');
      expect(insights).toHaveProperty('strengths');
      expect(insights).toHaveProperty('weaknesses');
      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('investmentScore');
    });
  });
}); 