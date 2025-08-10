/**
 * Investment Decision Engine Consistency Tests
 * 
 * These tests verify that the enhanced Investment Decision Engine correctly:
 * 1. Uses main analysis cash flow (not leverage optimizer)
 * 2. Provides appropriate verdicts for positive vs negative cash flow
 * 3. Applies market-relative logic instead of fixed thresholds
 */

import { InvestmentDecisionEngine } from '../../services/investment/investmentDecisionEngine';
import { SFRData } from '../../types/propertyTypes';

describe('Investment Decision Engine - Cash Flow Consistency', () => {
  let decisionEngine: InvestmentDecisionEngine;

  beforeEach(() => {
    decisionEngine = new InvestmentDecisionEngine();
  });

  test('should give NEGOTIATE for positive cash flow below hurdle rate', async () => {
    // Real property data similar to user's 7354 Sterling Dr, Anna, TX case
    const propertyData: SFRData = {
      propertyType: 'SFR',
      purchasePrice: 415000,
      downPayment: 83000,
      interestRate: 0.0663, // 6.63% from user's case
      loanTerm: 30,
      propertyTaxRate: 0.0183, // Anna, TX property tax rate
      insuranceRate: 0.004,
      maintenanceCost: 2400,
      propertyManagementRate: 0.08,
      monthlyRent: 3500, // $3,500/month rent = 1.01% rent-to-price ratio
      squareFootage: 2800,
      bedrooms: 4,
      bathrooms: 3,
      yearBuilt: 2018,
      propertyAddress: {
        street: '7354 Sterling Dr',
        city: 'Anna',
        state: 'TX',
        zipCode: '75409'
      },
      exitStrategy: {
        primaryExitStrategy: '1031exchange',
        portfolioStrategy: 'cashflow'
      },
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 0.03,
        annualPropertyValueIncrease: 0.04,
        inflationRate: 0.025,
        vacancyRate: 0.05,
        sellingCostsPercentage: 0.08
      }
    };

    // Analysis showing positive cash flow (the issue we're testing)
    const analysis = {
      monthlyAnalysis: {
        cashFlow: 983, // $983/month positive cash flow - should NOT be PASS
        totalExpenses: 2517,
        netOperatingIncome: 2983
      },
      keyMetrics: {
        capRate: 0.0862, // 8.62% cap rate - actually quite good
        cashOnCashReturn: 0.0284, // 2.84% CoC - below 5.5% hurdle for 1031
        dscr: 1.45,
        operatingExpenseRatio: 0.28 // 28% - reasonable
      },
      totalInvestment: 85000
    };

    const marketIntelligence = {
      medianCapRate: 0.075, // 7.5% market median
      currentMortgageRate: 0.0663,
      inflation: 0.0267,
      unemployment: 4.2
    };

    const userContext = {
      availableCash: 415000,
      experienceLevel: 'intermediate' as const,
      riskTolerance: 'moderate' as const,
      investmentGoals: 'cash_flow' as const
    };

    const decision = await decisionEngine.generateInvestmentDecision(
      propertyData,
      analysis,
      null, // No predictions
      marketIntelligence,
      userContext
    );

    // Critical test: Should be NEGOTIATE (not PASS) because cash flow is positive
    // The bug was showing PASS for positive cash flow properties
    expect(decision.verdict).toBe('NEGOTIATE');
    expect(decision.confidence).toBeGreaterThan(40);
    expect(decision.primaryReason).toContain('positive cash flow');
    
    // Should acknowledge the positive cash flow in reasoning  
    expect(decision.primaryReason.toLowerCase()).not.toContain('negative');
    expect(decision.primaryReason.toLowerCase()).not.toContain('insufficient');
    
    // Should mention 1031 exchange benefits for this strategy
    const mentionsTaxBenefits = decision.primaryReason.toLowerCase().includes('tax') ||
      decision.secondaryReasons.some(reason => reason.toLowerCase().includes('1031'));
    expect(mentionsTaxBenefits).toBe(true);
  });

  test('should give BUY for excellent positive cash flow above hurdle rate', async () => {
    const propertyData: SFRData = {
      propertyType: 'SFR',
      purchasePrice: 150000,
      downPayment: 30000,
      interestRate: 0.07,
      loanTerm: 30,
      propertyTaxRate: 0.015,
      insuranceRate: 0.004,
      maintenanceCost: 1200,
      propertyManagementRate: 0.08,
      monthlyRent: 2000, // $2,000/month rent = 1.6% rent-to-price ratio - excellent
      squareFootage: 1400,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2015,
      propertyAddress: {
        street: '789 Winner Ave',
        city: 'Memphis',
        state: 'TN',
        zipCode: '38101'
      },
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 0.03,
        annualPropertyValueIncrease: 0.04,
        inflationRate: 0.025,
        vacancyRate: 0.05,
        sellingCostsPercentage: 0.08
      }
    };

    const analysis = {
      monthlyAnalysis: {
        cashFlow: 900, // Excellent positive cash flow
        totalExpenses: 1100,
        netOperatingIncome: 1760
      },
      keyMetrics: {
        capRate: 0.1408, // 14.08% cap rate - excellent
        cashOnCashReturn: 0.144, // 14.4% CoC - well above any hurdle rate
        dscr: 2.1,
        operatingExpenseRatio: 0.275 // 27.5% - very good
      },
      totalInvestment: 31200
    };

    const marketIntelligence = {
      medianCapRate: 0.09, // Market median 9%
      currentMortgageRate: 0.07
    };

    const userContext = {
      availableCash: 200000,
      experienceLevel: 'intermediate' as const,
      riskTolerance: 'moderate' as const,
      investmentGoals: 'cash_flow' as const
    };

    const decision = await decisionEngine.generateInvestmentDecision(
      propertyData,
      analysis,
      null,
      marketIntelligence,
      userContext
    );

    expect(decision.verdict).toBe('BUY');
    expect(decision.confidence).toBeGreaterThan(70);
  });

  test('should give PASS for negative cash flow', async () => {
    const propertyData: SFRData = {
      propertyType: 'SFR',
      purchasePrice: 500000,
      downPayment: 100000,
      interestRate: 0.07,
      loanTerm: 30,
      propertyTaxRate: 0.013,
      insuranceRate: 0.004,
      maintenanceCost: 3000,
      propertyManagementRate: 0.08,
      monthlyRent: 3000, // $3,000/month rent = 0.72% ratio - marginal
      squareFootage: 2200,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2010,
      propertyAddress: {
        street: '999 Expensive St',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210'
      },
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 0.03,
        annualPropertyValueIncrease: 0.04,
        inflationRate: 0.025,
        vacancyRate: 0.05,
        sellingCostsPercentage: 0.08
      }
    };

    const analysis = {
      monthlyAnalysis: {
        cashFlow: -350, // Negative cash flow - clear fail
        totalExpenses: 3350,
        netOperatingIncome: 2640
      },
      keyMetrics: {
        capRate: 0.0634, // 6.34% cap rate - decent but not enough
        cashOnCashReturn: -0.042, // -4.2% CoC - clearly negative
        dscr: 0.89, // Below 1.0 - dangerous
        operatingExpenseRatio: 0.45 // 45% - high but acceptable
      },
      totalInvestment: 103000
    };

    const userContext = {
      availableCash: 200000,
      experienceLevel: 'novice' as const,
      riskTolerance: 'conservative' as const,
      investmentGoals: 'balanced' as const
    };

    const decision = await decisionEngine.generateInvestmentDecision(
      propertyData,
      analysis,
      null,
      {},
      userContext
    );

    expect(decision.verdict).toBe('PASS');
    expect(decision.primaryReason.toLowerCase()).toContain('negative');
  });
});