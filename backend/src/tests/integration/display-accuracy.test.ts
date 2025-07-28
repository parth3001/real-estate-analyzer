import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDatabase';
import request from 'supertest';
import express, { Express } from 'express';
import { 
  mockUser, 
  mockDealData 
} from '../fixtures/testData';
import { User } from '../../models/User';
import bcrypt from 'bcryptjs';

describe('Display Accuracy Tests - Frontend Data Validation', () => {
  let app: Express;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await connectTestDB();
    
    // Create minimal express app for testing
    app = express();
    app.use(express.json());
    
    // Import routes
    const dealsRoutes = require('../../routes/deals').default;
    app.use('/api/deals', dealsRoutes);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Create authenticated user for tests
    const hashedPassword = await bcrypt.hash(mockUser.password, 10);
    const user = await User.create({
      ...mockUser,
      password: hashedPassword
    });
    userId = user._id.toString();
    
    // Get auth token (mock this for now)
    authToken = 'mock-token';
  });

  describe('AI Score Display Bug Detection', () => {
    it('should detect AI score truncation bug (55 showing as 5)', async () => {
      // Create a property that should generate AI score of 55
      const propertyWithHighScore = {
        ...mockDealData,
        userId: userId,
        // Properties that typically generate higher AI scores
        monthlyRent: 3500,
        purchasePrice: 350000, // Good rent-to-price ratio
        downPayment: 70000,
        interestRate: 6.0, // Lower interest rate
        propertyTaxRate: 0.8, // Lower property tax
        maintenanceCost: 150, // Lower maintenance
        propertyManagementRate: 0, // Self-managed
        longTermAssumptions: {
          projectionYears: 30,
          annualRentIncrease: 4.0,
          annualPropertyValueIncrease: 4.0,
          sellingCostsPercentage: 6,
          inflationRate: 2.5,
          vacancyRate: 3.0, // Low vacancy
          turnoverFrequency: 3
        }
      };

      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyWithHighScore)
        .expect(200);

      // Validate AI insights exist and have reasonable score
      expect(response.body.aiInsights).toBeDefined();
      expect(response.body.aiInsights.investmentScore).toBeDefined();

      const aiScore = response.body.aiInsights.investmentScore;
      
      // Log the actual score for debugging
      console.log('🔍 AI Score Analysis:');
      console.log(`  Raw AI Score: ${aiScore}`);
      console.log(`  Type: ${typeof aiScore}`);
      console.log(`  String representation: "${aiScore}"`);
      
      // Test for the specific bug: score truncation
      if (typeof aiScore === 'string') {
        const numericScore = parseFloat(aiScore);
        expect(numericScore).toBeGreaterThan(10); // Should be reasonable score, not truncated
        
        // Check if it looks like truncation happened (e.g., 55 became "5")
        if (aiScore.length === 1 && numericScore < 10) {
          throw new Error(`🚨 DISPLAY BUG DETECTED: AI Score appears truncated! 
            Expected: Two-digit score (e.g., 55)
            Actual: "${aiScore}" (${numericScore})
            This suggests frontend display truncation.`);
        }
      } else if (typeof aiScore === 'number') {
        expect(aiScore).toBeGreaterThan(10);
        expect(aiScore).toBeLessThan(100);
      }

      // Additional validation: Check if score makes sense for property quality
      const monthlySpread = response.body.monthlyAnalysis.cashFlow;
      const capRate = response.body.keyMetrics.capRate;
      
      // High-performing property should have higher AI score
      if (monthlySpread > 500 && capRate > 8) {
        expect(aiScore).toBeGreaterThan(40);
      }
    });

    it('should validate all numeric fields are properly formatted for frontend', async () => {
      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(200);

      const fieldsToCheck = [
        'keyMetrics.capRate',
        'keyMetrics.cashOnCashReturn', 
        'keyMetrics.debtServiceCoverageRatio',
        'keyMetrics.onePercentRuleValue',
        'monthlyAnalysis.cashFlow',
        'annualAnalysis.annualNOI',
        'aiInsights.investmentScore'
      ];

      fieldsToCheck.forEach(fieldPath => {
        const value = getNestedValue(response.body, fieldPath);
        
        if (value !== undefined && value !== null) {
          console.log(`📊 Checking field ${fieldPath}: ${value} (${typeof value})`);
          
          // Check for common display bugs
          if (typeof value === 'string') {
            // Check for truncation (string that should be longer)
            if (fieldPath.includes('Score') && value.length === 1) {
              throw new Error(`🚨 TRUNCATION BUG: ${fieldPath} = "${value}" appears truncated`);
            }
            
            // Check if numeric string is properly formatted
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              expect(numValue).not.toBe(NaN);
              
              // For percentages, should be reasonable range
              if (fieldPath.includes('Rate') || fieldPath.includes('Return')) {
                expect(Math.abs(numValue)).toBeLessThan(1000); // Sanity check
              }
            }
          }
          
          if (typeof value === 'number') {
            expect(value).not.toBe(NaN);
            expect(value).not.toBe(Infinity);
            expect(value).not.toBe(-Infinity);
          }
        }
      });
    });

    it('should detect decimal precision loss in financial calculations', async () => {
      // Test with property that should generate precise decimals
      const precisionTestProperty = {
        ...mockDealData,
        userId: userId,
        purchasePrice: 333333.33,
        monthlyRent: 2777.77,
        downPayment: 66666.66,
        maintenanceCost: 277.78
      };

      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(precisionTestProperty)
        .expect(200);

      // Check that decimal precision is maintained
      const capRate = response.body.keyMetrics.capRate;
      const cashFlow = response.body.monthlyAnalysis.cashFlow;
      
      console.log(`🎯 Precision Test Results:`);
      console.log(`  Cap Rate: ${capRate} (${typeof capRate})`);
      console.log(`  Cash Flow: ${cashFlow} (${typeof cashFlow})`);
      
      // Values should have reasonable precision (not rounded to whole numbers inappropriately)
      if (typeof capRate === 'number') {
        // Cap rate should have decimal precision for precise calculations
        const capRateStr = capRate.toString();
        if (capRateStr.includes('.')) {
          const decimalPlaces = capRateStr.split('.')[1].length;
          expect(decimalPlaces).toBeGreaterThan(0); // Should have decimal precision
        }
      }
      
      // Check that we're not losing precision in serialization
      if (typeof cashFlow === 'number') {
        expect(cashFlow.toString()).not.toBe('NaN');
        expect(isFinite(cashFlow)).toBe(true);
      }
    });

    it('should validate AI insights contain all expected fields', async () => {
      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(200);

      const aiInsights = response.body.aiInsights;
      expect(aiInsights).toBeDefined();

      // Check required AI fields
      const requiredFields = [
        'investmentScore',
        'summary', 
        'keyStrengths',
        'keyWeaknesses',
        'recommendation'
      ];

      requiredFields.forEach(field => {
        expect(aiInsights[field]).toBeDefined();
        console.log(`✅ AI Field ${field}: ${typeof aiInsights[field]} = ${JSON.stringify(aiInsights[field]).substring(0, 50)}...`);
      });

      // Specific validation for investment score
      const score = aiInsights.investmentScore;
      if (typeof score === 'string') {
        // Should be convertible to number
        const numScore = parseFloat(score);
        expect(numScore).not.toBe(NaN);
        expect(numScore).toBeGreaterThanOrEqual(0);
        expect(numScore).toBeLessThanOrEqual(100);
        
        // Check for common formatting issues
        expect(score).not.toMatch(/^0+$/); // Not all zeros
        expect(score.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Cross-field Validation', () => {
    it('should validate consistency between related fields', async () => {
      const response = await request(app)
        .post('/api/deals/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockDealData)
        .expect(200);

      // Monthly vs Annual consistency
      const monthly = response.body.monthlyAnalysis;
      const annual = response.body.annualAnalysis;

      if (monthly.cashFlow && annual.cashFlow) {
        const expectedAnnual = monthly.cashFlow * 12;
        const actualAnnual = annual.cashFlow;
        
        console.log(`🔄 Consistency Check:`);
        console.log(`  Monthly Cash Flow: ${monthly.cashFlow}`);
        console.log(`  Annual Cash Flow: ${actualAnnual}`);
        console.log(`  Expected Annual: ${expectedAnnual}`);
        
        // Allow for small rounding differences
        expect(Math.abs(actualAnnual - expectedAnnual)).toBeLessThan(100);
      }

      // Cap rate calculation consistency
      const capRate = response.body.keyMetrics.capRate;
      const noi = annual.annualNOI;
      const purchasePrice = mockDealData.purchasePrice;

      if (capRate && noi && purchasePrice) {
        const expectedCapRate = (noi / purchasePrice) * 100;
        console.log(`📊 Cap Rate Validation:`);
        console.log(`  Reported Cap Rate: ${capRate}%`);
        console.log(`  Calculated Cap Rate: ${expectedCapRate.toFixed(2)}%`);
        
        expect(Math.abs(capRate - expectedCapRate)).toBeLessThan(0.5); // Within 0.5%
      }
    });
  });
});

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}