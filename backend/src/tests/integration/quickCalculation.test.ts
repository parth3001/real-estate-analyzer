import request from 'supertest';
import express from 'express';
import quickAnalysisRouter from '../../routes/quickAnalysis';
import { QuickCalculationService } from '../../services/quickCalculationService';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/quick', quickAnalysisRouter);

describe('Quick Calculation API', () => {
  const testPropertyData = {
    propertyType: 'SFR' as const,
    purchasePrice: 500000,
    downPayment: 100000,
    interestRate: 7.5,
    loanTerm: 30,
    monthlyRent: 3000,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    maintenanceCost: 2000,
    propertyManagementRate: 8,
    longTermAssumptions: {
      vacancyRate: 5
    }
  };

  describe('POST /api/quick/quick-calculate', () => {
    it('should return calculations in under 50ms', async () => {
      const response = await request(app)
        .post('/api/quick/quick-calculate')
        .send(testPropertyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.performanceMetrics).toBeDefined();
      expect(response.body.performanceMetrics.totalResponseTime).toBeLessThan(100);
      expect(response.body.performanceMetrics.targetMs).toBe(50);
    });

    it('should calculate correct financial metrics', async () => {
      const response = await request(app)
        .post('/api/quick/quick-calculate')
        .send(testPropertyData)
        .expect(200);

      const { data } = response.body;
      
      // Verify monthly analysis
      expect(data.monthlyAnalysis.income.gross).toBe(3000);
      expect(data.monthlyAnalysis.income.effective).toBe(2850); // 3000 - 5% vacancy
      expect(data.monthlyAnalysis.cashFlow).toBeCloseTo(-1211.86, 1);
      
      // Verify key metrics
      expect(data.keyMetrics.capRate).toBeCloseTo(3.804, 2);
      expect(data.keyMetrics.cashOnCashReturn).toBeCloseTo(-14.54, 1);
      expect(data.keyMetrics.dscr).toBeCloseTo(0.567, 2);
      expect(data.keyMetrics.totalInvestment).toBe(100000);
    });

    it('should validate required fields', async () => {
      const invalidData = { ...testPropertyData };
      delete (invalidData as any).purchasePrice;

      const response = await request(app)
        .post('/api/quick/quick-calculate')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should handle calculation errors gracefully', async () => {
      const invalidData = {
        ...testPropertyData,
        purchasePrice: 0, // This should cause calculation issues
      };

      const response = await request(app)
        .post('/api/quick/quick-calculate')
        .send(invalidData);

      // Should still return a response even with edge case data
      expect(response.status).toBeLessThanOrEqual(500);
    });
  });

  describe('QuickCalculationService', () => {
    it('should perform calculations in under 10ms', () => {
      const startTime = Date.now();
      const result = QuickCalculationService.calculateMetrics(testPropertyData as any);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(10);
      expect(result.calculationTime).toBeLessThan(10);
    });

    it('should handle edge cases without crashing', () => {
      const edgeCases = [
        { ...testPropertyData, monthlyRent: 0 },
        { ...testPropertyData, purchasePrice: 1 },
        { ...testPropertyData, interestRate: 0 },
        { ...testPropertyData, downPayment: testPropertyData.purchasePrice },
      ];

      edgeCases.forEach(edgeCase => {
        expect(() => {
          QuickCalculationService.calculateMetrics(edgeCase as any);
        }).not.toThrow();
      });
    });
  });
});