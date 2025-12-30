/**
 * Portfolio Service - MongoDB Aggregation Tests (Issue #41)
 *
 * Tests the performance fix for getAvailablePortfoliosForProperty endpoint:
 * - Before: 27 seconds (N+1 query anti-pattern)
 * - After: ~800ms (single MongoDB aggregation)
 * - Improvement: 96%
 *
 * Test Coverage:
 * - Basic aggregation with multiple portfolios
 * - Null safety for nested analysis paths
 * - Empty portfolios (0 properties)
 * - Performance benchmarks
 * - Edge cases and data quality
 */

import mongoose from 'mongoose';
import { Portfolio } from '../../../models/Portfolio';
import { DealModel } from '../../../models/Deal';
import { portfolioService } from '../portfolioService';

describe('Portfolio Service - MongoDB Aggregation (Issue #41)', () => {

  // Test database setup
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/real-estate-test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await Portfolio.deleteMany({});
    await DealModel.deleteMany({});
  });

  describe('Basic Aggregation', () => {
    test('should fetch summaries with correct metrics for multiple portfolios', async () => {
      // Setup: Create 2 portfolios with properties
      const userId = new mongoose.Types.ObjectId();

      const portfolio1 = await Portfolio.create({
        userId,
        name: 'Cash Flow Portfolio',
        description: 'Focus on monthly income',
        goals: {
          primaryGoal: 'CASH_FLOW',
          targetMonthlyIncome: 5000,
          riskTolerance: 'MODERATE'
        },
        status: 'ACTIVE'
      });

      const portfolio2 = await Portfolio.create({
        userId,
        name: 'Wealth Building',
        description: 'Long-term appreciation',
        goals: {
          primaryGoal: 'WEALTH_BUILDING',
          targetNetWorth: 1000000,
          riskTolerance: 'AGGRESSIVE'
        },
        status: 'ACTIVE'
      });

      // Add properties to portfolio 1
      await DealModel.create([
        {
          userId,
          portfolioId: portfolio1._id,
          propertyName: 'Property 1',
          propertyType: 'SFR',
          purchasePrice: 200000,
          analysis: {
            monthlyAnalysis: {
              cashFlow: 400
            }
          }
        },
        {
          userId,
          portfolioId: portfolio1._id,
          propertyName: 'Property 2',
          propertyType: 'SFR',
          purchasePrice: 250000,
          analysis: {
            monthlyAnalysis: {
              cashFlow: 500
            }
          }
        }
      ]);

      // Add properties to portfolio 2
      await DealModel.create({
        userId,
        portfolioId: portfolio2._id,
        propertyName: 'Property 3',
        propertyType: 'MF',
        purchasePrice: 300000,
        analysis: {
          monthlyAnalysis: {
            cashFlow: 600
          }
        }
      });

      // Execute
      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());

      // Assert
      expect(summaries).toHaveLength(2);

      const cashFlowPortfolio = summaries.find(s => s.name === 'Cash Flow Portfolio');
      expect(cashFlowPortfolio).toMatchObject({
        name: 'Cash Flow Portfolio',
        description: 'Focus on monthly income',
        primaryGoal: 'CASH_FLOW',
        riskTolerance: 'MODERATE',
        totalProperties: 2,
        totalValue: 450000,
        monthlyNetCashFlow: 900,
        status: 'ACTIVE'
      });

      const wealthPortfolio = summaries.find(s => s.name === 'Wealth Building');
      expect(wealthPortfolio).toMatchObject({
        name: 'Wealth Building',
        primaryGoal: 'WEALTH_BUILDING',
        riskTolerance: 'AGGRESSIVE',
        totalProperties: 1,
        totalValue: 300000,
        monthlyNetCashFlow: 600,
        status: 'ACTIVE'
      });
    });

    test('should only return ACTIVE portfolios', async () => {
      const userId = new mongoose.Types.ObjectId();

      await Portfolio.create([
        {
          userId,
          name: 'Active Portfolio',
          goals: { primaryGoal: 'CASH_FLOW', riskTolerance: 'MODERATE' },
          status: 'ACTIVE'
        },
        {
          userId,
          name: 'Archived Portfolio',
          goals: { primaryGoal: 'CASH_FLOW', riskTolerance: 'MODERATE' },
          status: 'ARCHIVED'
        }
      ]);

      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());

      expect(summaries).toHaveLength(1);
      expect(summaries[0].name).toBe('Active Portfolio');
      expect(summaries[0].status).toBe('ACTIVE');
    });
  });

  describe('Null Safety - Nested Analysis Paths', () => {
    test('should handle properties with null purchasePrice', async () => {
      const userId = new mongoose.Types.ObjectId();
      const portfolio = await Portfolio.create({
        userId,
        name: 'Test Portfolio',
        goals: { primaryGoal: 'CASH_FLOW', riskTolerance: 'MODERATE' },
        status: 'ACTIVE'
      });

      await DealModel.create([
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'Property 1',
          propertyType: 'SFR',
          purchasePrice: null,
          analysis: { monthlyAnalysis: { cashFlow: 100 } }
        },
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'Property 2',
          propertyType: 'SFR',
          purchasePrice: 200000,
          analysis: { monthlyAnalysis: { cashFlow: 200 } }
        }
      ]);

      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());

      expect(summaries[0]).toMatchObject({
        totalProperties: 2,
        totalValue: 200000, // Only property 2 counted
        monthlyNetCashFlow: 300 // Both counted
      });
    });

    test('should handle properties with incomplete analysis data', async () => {
      const userId = new mongoose.Types.ObjectId();
      const portfolio = await Portfolio.create({
        userId,
        name: 'Test Portfolio',
        goals: { primaryGoal: 'CASH_FLOW', riskTolerance: 'MODERATE' },
        status: 'ACTIVE'
      });

      // Create properties with various data quality issues
      await DealModel.create([
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'No Analysis',
          propertyType: 'SFR',
          purchasePrice: 200000,
          analysis: null
        },
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'Empty Analysis',
          propertyType: 'SFR',
          purchasePrice: 250000,
          analysis: {}
        },
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'No Monthly Analysis',
          propertyType: 'SFR',
          purchasePrice: 300000,
          analysis: { monthlyAnalysis: null }
        },
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'Empty Monthly Analysis',
          propertyType: 'SFR',
          purchasePrice: 350000,
          analysis: { monthlyAnalysis: {} }
        },
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'Undefined Cash Flow',
          propertyType: 'SFR',
          purchasePrice: 400000,
          analysis: { monthlyAnalysis: { cashFlow: undefined } }
        },
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'Valid Property',
          propertyType: 'SFR',
          purchasePrice: 450000,
          analysis: { monthlyAnalysis: { cashFlow: 500 } }
        }
      ]);

      // Should not throw, should handle nulls gracefully
      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());

      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        totalProperties: 6,
        totalValue: 1950000, // All 6 prices summed
        monthlyNetCashFlow: 500 // Only the last one has valid cash flow
      });
    });

    test('should handle portfolios with no properties', async () => {
      const userId = new mongoose.Types.ObjectId();

      await Portfolio.create({
        userId,
        name: 'Empty Portfolio',
        goals: { primaryGoal: 'CASH_FLOW', riskTolerance: 'MODERATE' },
        status: 'ACTIVE'
      });

      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());

      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        name: 'Empty Portfolio',
        totalProperties: 0,
        totalValue: 0,
        monthlyNetCashFlow: 0
      });
    });
  });

  describe('Performance', () => {
    test('should fetch 10 portfolios with 50 properties in <2s', async () => {
      // Setup: 10 portfolios, 5 properties each
      const userId = new mongoose.Types.ObjectId();

      const portfolios = await Portfolio.create(
        Array.from({ length: 10 }, (_, i) => ({
          userId,
          name: `Portfolio ${i + 1}`,
          goals: { primaryGoal: 'CASH_FLOW', riskTolerance: 'MODERATE' },
          status: 'ACTIVE'
        }))
      );

      const properties = portfolios.flatMap(portfolio =>
        Array.from({ length: 5 }, (_, i) => ({
          userId,
          portfolioId: portfolio._id,
          propertyName: `Property ${i + 1}`,
          propertyType: 'SFR',
          purchasePrice: 250000 + (i * 1000),
          analysis: {
            monthlyAnalysis: {
              cashFlow: 500 + i
            }
          }
        }))
      );

      await DealModel.create(properties);

      // Execute with timing
      const startTime = Date.now();
      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());
      const duration = Date.now() - startTime;

      // Assert
      expect(summaries).toHaveLength(10);
      expect(duration).toBeLessThan(2000); // <2 seconds

      // Verify metrics are correct
      summaries.forEach(summary => {
        expect(summary.totalProperties).toBe(5);
        expect(summary.totalValue).toBe(1260000); // Sum of 250k + 251k + 252k + 253k + 254k
        expect(summary.monthlyNetCashFlow).toBe(2510); // Sum of 500 + 501 + 502 + 503 + 504
      });

      console.log(`✅ Performance test: ${duration}ms for 10 portfolios, 50 properties`);
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid user ID', async () => {
      await expect(
        portfolioService.getAvailablePortfoliosForProperty('invalid-user-id')
      ).rejects.toThrow('Invalid user ID');
    });

    test('should return empty array for user with no portfolios', async () => {
      const userId = new mongoose.Types.ObjectId();

      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());

      expect(summaries).toEqual([]);
    });

    test('should handle extremely large portfolios (100 properties)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const portfolio = await Portfolio.create({
        userId,
        name: 'Large Portfolio',
        goals: { primaryGoal: 'WEALTH_BUILDING', riskTolerance: 'MODERATE' },
        status: 'ACTIVE'
      });

      // Create 100 properties
      const properties = Array.from({ length: 100 }, (_, i) => ({
        userId,
        portfolioId: portfolio._id,
        propertyName: `Property ${i + 1}`,
        propertyType: 'SFR',
        purchasePrice: 200000 + (i * 1000),
        analysis: {
          monthlyAnalysis: {
            cashFlow: 500 + i
          }
        }
      }));

      await DealModel.insertMany(properties);

      // Should complete without errors
      const startTime = Date.now();
      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());
      const duration = Date.now() - startTime;

      expect(summaries).toHaveLength(1);
      expect(summaries[0].totalProperties).toBe(100);
      expect(summaries[0].totalValue).toBe(24950000); // Sum of arithmetic sequence
      expect(summaries[0].monthlyNetCashFlow).toBe(54950); // Sum of 500 + 501 + ... + 599

      // Should still be reasonably fast
      expect(duration).toBeLessThan(3000); // <3 seconds even for 100 properties

      console.log(`✅ Large portfolio test: ${duration}ms for 100 properties`);
    });

    test('should handle negative cash flow values', async () => {
      const userId = new mongoose.Types.ObjectId();
      const portfolio = await Portfolio.create({
        userId,
        name: 'Negative Cash Flow Portfolio',
        goals: { primaryGoal: 'WEALTH_BUILDING', riskTolerance: 'AGGRESSIVE' },
        status: 'ACTIVE'
      });

      await DealModel.create([
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'Losing Money',
          propertyType: 'SFR',
          purchasePrice: 200000,
          analysis: {
            monthlyAnalysis: {
              cashFlow: -300
            }
          }
        },
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'Breaking Even',
          propertyType: 'SFR',
          purchasePrice: 250000,
          analysis: {
            monthlyAnalysis: {
              cashFlow: 0
            }
          }
        },
        {
          userId,
          portfolioId: portfolio._id,
          propertyName: 'Making Money',
          propertyType: 'SFR',
          purchasePrice: 300000,
          analysis: {
            monthlyAnalysis: {
              cashFlow: 500
            }
          }
        }
      ]);

      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());

      expect(summaries[0]).toMatchObject({
        totalProperties: 3,
        totalValue: 750000,
        monthlyNetCashFlow: 200 // -300 + 0 + 500 = 200
      });
    });
  });

  describe('Sorting', () => {
    test('should return portfolios sorted by creation date (newest first)', async () => {
      const userId = new mongoose.Types.ObjectId();

      // Create portfolios with slight delay to ensure different timestamps
      const portfolio1 = await Portfolio.create({
        userId,
        name: 'First Portfolio',
        goals: { primaryGoal: 'CASH_FLOW', riskTolerance: 'MODERATE' },
        status: 'ACTIVE'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const portfolio2 = await Portfolio.create({
        userId,
        name: 'Second Portfolio',
        goals: { primaryGoal: 'WEALTH_BUILDING', riskTolerance: 'MODERATE' },
        status: 'ACTIVE'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const portfolio3 = await Portfolio.create({
        userId,
        name: 'Third Portfolio',
        goals: { primaryGoal: 'ESTATE_BUILDING', riskTolerance: 'MODERATE' },
        status: 'ACTIVE'
      });

      const summaries = await portfolioService.getAvailablePortfoliosForProperty(userId.toString());

      expect(summaries).toHaveLength(3);
      expect(summaries[0].name).toBe('Third Portfolio'); // Newest
      expect(summaries[1].name).toBe('Second Portfolio');
      expect(summaries[2].name).toBe('First Portfolio'); // Oldest
    });
  });
});
