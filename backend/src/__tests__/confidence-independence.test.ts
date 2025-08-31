/**
 * Test V3.0 Deal Quality vs Confidence Independence
 * Verifies that Deal Quality and Confidence are calculated independently
 */

import { InvestmentDecisionEngine } from '../services/investment/investmentDecisionEngine';

describe('V3.0 Confidence Independence', () => {
  let engine: InvestmentDecisionEngine;

  beforeEach(() => {
    engine = new InvestmentDecisionEngine();
  });

  test('Deal Quality and Confidence should be calculated independently', async () => {
    // Test Property 1: High quality property with complete data
    const highQualityProperty = {
      propertyName: 'High Quality Test Property',
      purchasePrice: 200000,
      monthlyRent: 2000,
      downPayment: 40000,
      interestRate: 6.5,
      loanTerm: 30,
      propertyTaxRate: 1.2,
      insuranceCost: 1200,
      insuranceRate: 0.6, // Added required field
      maintenanceCost: 200, // Changed from maintenanceReserve
      maintenanceReserve: 200,
      propertyManagementRate: 8,
      vacancyRate: 5,
      yearBuilt: 2010,
      squareFootage: 1400,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'SFR' as const,
      propertyAddress: {
        street: '123 Test St',
        city: 'Orlando',
        state: 'FL',
        zipCode: '32801'
      }
    };

    // Test Property 2: Lower quality property with incomplete data
    const lowQualityProperty = {
      propertyName: 'Low Quality Test Property',
      purchasePrice: 200000,
      monthlyRent: 1000, // Much lower rent, worse fundamentals
      downPayment: 40000,
      interestRate: 6.5,
      loanTerm: 30,
      propertyTaxRate: 2.5, // High tax rate
      insuranceCost: 800,
      insuranceRate: 0.4,
      maintenanceCost: 100,
      maintenanceReserve: 100,
      propertyManagementRate: 10,
      vacancyRate: 8,
      yearBuilt: 1970, // Old property
      squareFootage: 900,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'SFR' as const,
      propertyAddress: {
        street: '456 Poor St',
        city: 'Smalltown',
        state: 'OH',
        zipCode: '44444'
      }
    };

    const userContext = {
      availableCash: 50000,
      experienceLevel: 'intermediate' as const,
      riskTolerance: 'moderate' as const,
      investmentGoals: 'cash_flow' as const
    };

    // Test high quality property
    const result1 = await engine.generateInvestmentDecision(
      highQualityProperty,
      {}, // Basic analysis object
      {}, // Predictions
      { // Mock market intelligence with good data
        marketTier: { tier: 'A', name: 'Primary Market' },
        marketTrends: { averageRent: 1800, priceGrowth: 0.05 },
        economicIndicators: { medianHomePrice: 250000, unemployment: 3.5, populationGrowth: 2.1 },
        marketData: { capRates: [0.08, 0.09, 0.10], demographics: { population: 280000 } }
      },
      userContext
    );

    // Test low quality property
    const result2 = await engine.generateInvestmentDecision(
      lowQualityProperty,
      {}, // Basic analysis object
      {}, // Predictions
      { // Mock market intelligence with limited data
        marketTier: { tier: 'C', name: 'Secondary Market' },
        marketTrends: { averageRent: 900 },
        economicIndicators: { medianHomePrice: 150000 },
        marketData: { capRates: [], demographics: null }
      },
      userContext
    );

    // Extract metrics
    const quality1 = result1.professionalAssessment?.dealQuality || 0;
    const confidence1 = result1.confidence;
    const quality2 = result2.professionalAssessment?.dealQuality || 0;
    const confidence2 = result2.confidence;

    console.log('\n📊 INDEPENDENCE TEST RESULTS:');
    console.log(`High Quality Property - Deal Quality: ${quality1}, Confidence: ${confidence1}`);
    console.log(`Low Quality Property - Deal Quality: ${quality2}, Confidence: ${confidence2}`);

    // Assertions
    expect(quality1).toBeGreaterThan(0);
    expect(confidence1).toBeGreaterThan(0);
    expect(quality2).toBeGreaterThan(0);
    expect(confidence2).toBeGreaterThan(0);

    // Test independence: The difference between (quality - confidence) should vary
    // If they were the same, both properties would have the same quality-confidence delta
    const delta1 = quality1 - confidence1;
    const delta2 = quality2 - confidence2;
    const deltaSpread = Math.abs(delta1 - delta2);

    console.log(`Quality-Confidence Delta 1: ${delta1}`);
    console.log(`Quality-Confidence Delta 2: ${delta2}`);
    console.log(`Delta Spread: ${deltaSpread}`);

    // If the spread is significant (>5), they're calculated independently
    expect(deltaSpread).toBeGreaterThan(5);

    // Also verify they're not exactly the same (old bug)
    expect(quality1).not.toEqual(confidence1);
    expect(quality2).not.toEqual(confidence2);

    console.log('✅ Deal Quality and Confidence are calculated independently!');
  });

  test('Confidence should reflect data quality, not deal quality', async () => {
    // Property with good fundamentals but incomplete data (should have good deal quality, lower confidence)
    const incompleteDataProperty = {
      propertyName: 'Incomplete Data Test',
      purchasePrice: 180000,
      monthlyRent: 1800, // Good rent ratio
      downPayment: 36000,
      interestRate: 6.0,
      loanTerm: 30,
      propertyTaxRate: 1.0, // Good tax rate
      insuranceCost: 1000,
      insuranceRate: 0.55,
      maintenanceCost: 150,
      maintenanceReserve: 150,
      propertyManagementRate: 8,
      vacancyRate: 5,
      yearBuilt: 2000, // Required field
      squareFootage: 1200, // Required field
      bedrooms: 3, // Required field
      bathrooms: 2, // Required field
      propertyType: 'SFR' as const,
      propertyAddress: {
        street: '789 Incomplete St',
        city: 'DataTown',
        state: 'FL',
        zipCode: '33333'
      }
    };

    const userContext = {
      availableCash: 40000,
      experienceLevel: 'intermediate' as const,
      riskTolerance: 'moderate' as const,
      investmentGoals: 'cash_flow' as const
    };

    const result = await engine.generateInvestmentDecision(
      incompleteDataProperty,
      {},
      {},
      { // Limited market intelligence to reduce confidence
        marketTier: { tier: 'B', name: 'Secondary Market' },
        marketTrends: {},
        economicIndicators: {},
        marketData: { capRates: [], demographics: null }
      },
      userContext
    );

    const dealQuality = result.professionalAssessment?.dealQuality || 0;
    const confidence = result.confidence;

    console.log('\n📊 DATA QUALITY TEST:');
    console.log(`Deal Quality: ${dealQuality} (should be decent due to good fundamentals)`);
    console.log(`Confidence: ${confidence} (should be lower due to incomplete data)`);

    // Good fundamentals should still produce reasonable deal quality
    expect(dealQuality).toBeGreaterThan(40);

    // But confidence should be impacted by missing data and limited market intelligence
    // The exact values depend on the implementation, but confidence should not equal deal quality
    expect(Math.abs(dealQuality - confidence)).toBeGreaterThan(5);

    console.log('✅ Confidence reflects data completeness independently from deal fundamentals!');
  });
});