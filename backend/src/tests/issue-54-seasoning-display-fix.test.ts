/**
 * Issue #54 Regression Test: BRRRR Seasoning Period Calculation Fix
 *
 * PROBLEM: Seasoning period showed BACKWARDS results - profit displayed as cost
 * FIX: Added seasoningNetCashFlow field with clear sign convention
 */

import { BRRRRAnalyzer } from '../services/investment/brrrAnalyzer';
import type { BRRRRInputs } from '../services/investment/brrrAnalyzer';

describe('Issue #54: Seasoning Period Display Fix', () => {
  const dallasProperty: BRRRRInputs = {
    purchasePrice: 150000,
    downPayment: 30000,
    closingCosts: 3000,
    interestRate: 7.5,
    loanTerm: 30,
    brrrr: {
      rehabBudget: 40000,
      afterRepairValue: 230000,
      refinanceLTV: 75,
      seasoningPeriod: 12,
      arvAppraisalConfidence: 'moderate'
    },
    monthlyRent: 2100,
    propertyTaxRate: 1.5,
    insuranceRate: 0.6,
    maintenanceCost: 1500,
    propertyManagementRate: 8,
    vacancyRate: 5
  };

  test('Profitable property shows POSITIVE seasoningNetCashFlow', async () => {
    const analyzer = new BRRRRAnalyzer();
    const seasoningCosts = analyzer.calculateSeasoningCosts(dallasProperty);

    // NEW FIELD: seasoningNetCashFlow (positive = profit, negative = loss)
    expect(seasoningCosts.seasoningNetCashFlow).toBeGreaterThan(0);
    expect(seasoningCosts.seasoningNetCashFlow).toBeGreaterThan(6000);
    expect(seasoningCosts.seasoningNetCashFlow).toBeLessThan(7000);
  });

  test('Deprecated netSeasoningCost maintains backward compatibility', async () => {
    const analyzer = new BRRRRAnalyzer();
    const seasoningCosts = analyzer.calculateSeasoningCosts(dallasProperty);

    // DEPRECATED FIELD: negative = profit (confusing!)
    expect(seasoningCosts.netSeasoningCost).toBeLessThan(0);
    
    // Verify relationship: netSeasoningCost = -seasoningNetCashFlow
    expect(seasoningCosts.netSeasoningCost).toBeCloseTo(-seasoningCosts.seasoningNetCashFlow, 2);
  });

  test('Break-even property shows near-zero seasoning cash flow', async () => {
    const breakEvenProperty: BRRRRInputs = {
      ...dallasProperty,
      monthlyRent: 1550,
    };

    const analyzer = new BRRRRAnalyzer();
    const seasoningCosts = analyzer.calculateSeasoningCosts(breakEvenProperty);

    expect(Math.abs(seasoningCosts.seasoningNetCashFlow)).toBeLessThan(1000);
  });

  test('Negative cash flow property shows LOSS during seasoning', async () => {
    const lossProperty: BRRRRInputs = {
      ...dallasProperty,
      monthlyRent: 1000,
    };

    const analyzer = new BRRRRAnalyzer();
    const seasoningCosts = analyzer.calculateSeasoningCosts(lossProperty);

    expect(seasoningCosts.seasoningNetCashFlow).toBeLessThan(0);
    expect(seasoningCosts.netSeasoningCost).toBeGreaterThan(0);
  });

  test('Capital recovery uses seasoningNetCashFlow (not deprecated field)', async () => {
    const analyzer = new BRRRRAnalyzer();
    const result = await analyzer.analyze(dallasProperty);

    // Seasoning profit should REDUCE capital deployed
    const totalInvestment = 193000; // 150k + 3k + 40k
    expect(result.capitalRecovery.totalCapitalDeployed).toBeLessThan(totalInvestment);
    
    // Verify it's using seasoningNetCashFlow (positive profit reduces capital)
    expect(result.seasoningCosts.seasoningNetCashFlow).toBeGreaterThan(0);
  });
});
