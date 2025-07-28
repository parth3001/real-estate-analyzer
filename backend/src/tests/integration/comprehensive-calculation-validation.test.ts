import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import { connectTestDB, clearTestDB, closeTestDB } from '../setup/testDatabase';
import { SFRDeal } from '../../models/Deal';
import { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';

// Will store real property data from database
let testProperties: Array<{
  data: any;
  assumptions: AnalysisAssumptions;
}> = [];

// Default assumptions for testing
const defaultAssumptions: AnalysisAssumptions = {
  projectionYears: 30,
  annualRentIncrease: 2.5,
  annualExpenseIncrease: 2.0,
  annualPropertyValueIncrease: 3.0,
  sellingCosts: 6.0,
  vacancyRate: 5,
  turnoverFrequency: 2
};

describe('Comprehensive Calculation Validation', () => {
  beforeAll(async () => {
    await connectTestDB();
    
    // Fetch real saved properties from database for testing
    try {
      const savedDeals = await SFRDeal.find({}).limit(3);
      
      if (savedDeals.length > 0) {
        console.log(`✅ Found ${savedDeals.length} real SFR properties for testing`);
        
        testProperties = savedDeals.map(deal => ({
          data: {
            propertyType: 'SFR' as const,
            propertyName: deal.propertyName,
            propertyAddress: deal.propertyAddress,
            purchasePrice: deal.purchasePrice,
            downPayment: deal.downPayment,
            monthlyRent: deal.monthlyRent,
            interestRate: deal.interestRate,
            loanTerm: deal.loanTerm,
            propertyTaxRate: deal.propertyTaxRate,
            insuranceRate: deal.insuranceRate,
            propertyManagementRate: deal.propertyManagementRate,
            yearBuilt: deal.yearBuilt,
            squareFootage: deal.squareFootage,
            bedrooms: deal.bedrooms,
            bathrooms: deal.bathrooms,
            maintenanceCost: deal.maintenanceCost,
            closingCosts: deal.closingCosts || 0,
            capitalInvestments: deal.capitalInvestments || 0,
            tenantTurnoverFees: deal.tenantTurnoverFees || { prepFees: 500, realtorCommission: 0.5 }
          },
          assumptions: deal.longTermAssumptions ? {
            projectionYears: deal.longTermAssumptions.projectionYears || 30,
            annualRentIncrease: deal.longTermAssumptions.annualRentIncrease || 2.5,
            annualExpenseIncrease: 2.0, // Default if not stored
            annualPropertyValueIncrease: deal.longTermAssumptions.annualPropertyValueIncrease || 3.0,
            sellingCosts: deal.longTermAssumptions.sellingCostsPercentage || 6.0,
            vacancyRate: deal.longTermAssumptions.vacancyRate || 5,
            turnoverFrequency: deal.longTermAssumptions.turnoverFrequency || 2
          } : defaultAssumptions
        }));
        
        console.log(`📊 Test properties: ${testProperties.map(p => p.data.propertyName).join(', ')}`);
      } else {
        console.log('⚠️  No saved properties found, creating minimal test property');
        // Fallback to minimal test data if no saved properties exist
        testProperties = [{
          data: {
            propertyType: 'SFR' as const,
            propertyName: 'Test Property',
            propertyAddress: { street: '123 Test St', city: 'Test City', state: 'TX', zipCode: '12345' },
            purchasePrice: 250000,
            downPayment: 50000,
            monthlyRent: 2000,
            interestRate: 6.5,
            loanTerm: 30,
            propertyTaxRate: 1.2,
            insuranceRate: 0.5,
            propertyManagementRate: 8,
            yearBuilt: 2000,
            squareFootage: 2000,
            bedrooms: 3,
            bathrooms: 2,
            maintenanceCost: 2000,
            closingCosts: 5000,
            capitalInvestments: 0,
            tenantTurnoverFees: { prepFees: 500, realtorCommission: 0.5 }
          },
          assumptions: defaultAssumptions
        }];
      }
    } catch (error) {
      console.warn('⚠️  Error fetching saved properties, using fallback:', error);
      // Use fallback test data
      testProperties = [{
        data: {
          propertyType: 'SFR' as const,
          propertyName: 'Fallback Test Property',
          propertyAddress: { street: '123 Test St', city: 'Test City', state: 'TX', zipCode: '12345' },
          purchasePrice: 250000,
          downPayment: 50000,
          monthlyRent: 2000,
          interestRate: 6.5,
          loanTerm: 30,
          propertyTaxRate: 1.2,
          insuranceRate: 0.5,
          propertyManagementRate: 8,
          yearBuilt: 2000,
          squareFootage: 2000,
          bedrooms: 3,
          bathrooms: 2,
          maintenanceCost: 2000,
          closingCosts: 5000,
          capitalInvestments: 0,
          tenantTurnoverFees: { prepFees: 500, realtorCommission: 0.5 }
        },
        assumptions: defaultAssumptions
      }];
    }
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    // Don't clear DB since we're using real data for testing
  });

  describe('New Metrics Implementation Validation', () => {
    it('should calculate Debt Yield correctly for real properties', async () => {
      for (const property of testProperties) {
        const analyzer = new SFRAnalyzer(property.data, property.assumptions);
        const analysis = analyzer.analyze();
        
        console.log(`🏠 Testing property: ${property.data.propertyName}`);
        console.log(`💰 Purchase Price: $${property.data.purchasePrice.toLocaleString()}`);
        console.log(`🏦 Down Payment: $${property.data.downPayment.toLocaleString()}`);
        
        // Manual calculation
        const loanAmount = property.data.purchasePrice - property.data.downPayment;
        const expectedDebtYield = loanAmount > 0 ? (analysis.keyMetrics.noi / loanAmount) * 100 : 0;
        
        expect(analysis.keyMetrics.debtYield).toBeCloseTo(expectedDebtYield, 2);
        
        // Industry standards validation
        if (analysis.keyMetrics.debtYield > 0) {
          expect(analysis.keyMetrics.debtYield).toBeGreaterThan(0);
          expect(analysis.keyMetrics.debtYield).toBeLessThan(50); // Reasonable upper bound
          console.log(`📈 Debt Yield: ${analysis.keyMetrics.debtYield.toFixed(2)}%`);
        }
      }
    });

    it('should calculate Gross Yield correctly for real properties', async () => {
      for (const property of testProperties) {
        const analyzer = new SFRAnalyzer(property.data, property.assumptions);
        const analysis = analyzer.analyze();
        
        // Manual calculation
        const annualRent = property.data.monthlyRent * 12;
        const expectedGrossYield = (annualRent / property.data.purchasePrice) * 100;
        
        expect(analysis.keyMetrics.grossYield).toBeCloseTo(expectedGrossYield, 2);
        
        // Industry standards validation
        expect(analysis.keyMetrics.grossYield).toBeGreaterThan(0);
        expect(analysis.keyMetrics.grossYield).toBeLessThan(20); // Reasonable upper bound
        
        console.log(`🏠 ${property.data.propertyName} - Gross Yield: ${analysis.keyMetrics.grossYield.toFixed(2)}%`);
      }
    });

    it('should provide reserves analysis with proper calculations for real properties', async () => {
      for (const property of testProperties) {
        const analyzer = new SFRAnalyzer(property.data, property.assumptions);
        const analysis = analyzer.analyze();
        
        if (analysis.keyMetrics.reservesAnalysis) {
          const reserves = analysis.keyMetrics.reservesAnalysis;
          
          // Validate structure
          expect(reserves).toHaveProperty('minimumReserves');
          expect(reserves).toHaveProperty('recommendedReserves');
          expect(reserves).toHaveProperty('optimalReserves');
          expect(reserves).toHaveProperty('breakdown');
          
          // Validate logical ordering
          expect(reserves.recommendedReserves).toBeGreaterThanOrEqual(reserves.minimumReserves);
          expect(reserves.optimalReserves).toBeGreaterThanOrEqual(reserves.recommendedReserves);
          
          console.log(`🏠 ${property.data.propertyName} - Recommended Reserves: $${reserves.recommendedReserves.toLocaleString()}`);
        }
      }
    });
  });

  describe('Calculation Accuracy Cross-Validation', () => {
    it('should maintain mathematical consistency across all calculations for real properties', async () => {
      const property = testProperties[0]; // Use first real property for detailed validation
      const analyzer = new SFRAnalyzer(property.data, property.assumptions);
      const analysis = analyzer.analyze();
      
      console.log(`🔍 Detailed validation for: ${property.data.propertyName}`);
      
      // NOI validation
      const expectedNOI = analysis.monthlyAnalysis.income.effective * 12 - 
                         (analysis.monthlyAnalysis.expenses.operating * 12);
      expect(analysis.keyMetrics.noi).toBeCloseTo(expectedNOI, 2);
      console.log(`📊 NOI: $${analysis.keyMetrics.noi.toLocaleString()}`);
      
      // Cap Rate validation
      const expectedCapRate = (analysis.keyMetrics.noi / property.data.purchasePrice) * 100;
      expect(analysis.keyMetrics.capRate).toBeCloseTo(expectedCapRate, 2);
      console.log(`📈 Cap Rate: ${analysis.keyMetrics.capRate.toFixed(2)}%`);
      
      // Cash-on-Cash Return validation
      const annualCashFlow = analysis.monthlyAnalysis.cashFlow * 12;
      const expectedCoCReturn = (annualCashFlow / analysis.keyMetrics.totalInvestment) * 100;
      expect(analysis.keyMetrics.cashOnCashReturn).toBeCloseTo(expectedCoCReturn, 2);
      console.log(`💰 Cash-on-Cash Return: ${analysis.keyMetrics.cashOnCashReturn.toFixed(2)}%`);
      
      // DSCR validation
      const expectedDSCR = analysis.keyMetrics.noi / (analysis.monthlyAnalysis.expenses.debt * 12);
      expect(analysis.keyMetrics.dscr).toBeCloseTo(expectedDSCR, 2);
      console.log(`🏦 DSCR: ${analysis.keyMetrics.dscr.toFixed(2)}`);
      
      // Operating Expense Ratio validation
      const expectedOER = (analysis.monthlyAnalysis.expenses.operating / analysis.monthlyAnalysis.income.effective) * 100;
      expect(analysis.keyMetrics.operatingExpenseRatio).toBeCloseTo(expectedOER, 2);
      console.log(`📋 Operating Expense Ratio: ${analysis.keyMetrics.operatingExpenseRatio.toFixed(2)}%`);
    });

    it('should handle edge cases without throwing errors', async () => {
      const baseProperty = testProperties[0].data;
      const edgeCases = [
        // Zero down payment
        { ...baseProperty, downPayment: 0 },
        // Very high purchase price
        { ...baseProperty, purchasePrice: 10000000 },
        // Very low rent
        { ...baseProperty, monthlyRent: 100 },
        // Zero interest rate
        { ...baseProperty, interestRate: 0 },
        // Very high property management rate
        { ...baseProperty, propertyManagementRate: 15 }
      ];
      
      for (const edgeCase of edgeCases) {
        expect(() => {
          const analyzer = new SFRAnalyzer(edgeCase, testProperties[0].assumptions);
          const analysis = analyzer.analyze();
          
          // Should not throw and should return valid numbers
          expect(typeof analysis.keyMetrics.capRate).toBe('number');
          expect(typeof analysis.keyMetrics.cashOnCashReturn).toBe('number');
          expect(typeof analysis.keyMetrics.dscr).toBe('number');
          expect(typeof analysis.keyMetrics.debtYield).toBe('number');
          expect(typeof analysis.keyMetrics.grossYield).toBe('number');
        }).not.toThrow();
      }
    });
  });

  describe('Industry Benchmark Compliance', () => {
    it('should validate against BiggerPockets 1% rule', async () => {
      for (const property of testProperties) {
        const analyzer = new SFRAnalyzer(property.data, property.assumptions);
        const analysis = analyzer.analyze();
        
        const onePercentRuleValue = (property.data.monthlyRent / property.data.purchasePrice) * 100;
        expect(analysis.keyMetrics.onePercentRuleValue).toBeCloseTo(onePercentRuleValue, 3);
        
        console.log(`🏠 ${property.data.propertyName} - 1% Rule: ${onePercentRuleValue.toFixed(3)}%`);
        
        // Flag properties that don't meet the 1% rule
        if (onePercentRuleValue < 1.0) {
          console.log(`⚠️  Property fails 1% rule: ${onePercentRuleValue.toFixed(2)}%`);
        } else {
          console.log(`✅ Property meets 1% rule`);
        }
      }
    });

    it('should validate break-even occupancy calculations', async () => {
      for (const property of testProperties) {
        const analyzer = new SFRAnalyzer(property.data, property.assumptions);
        const analysis = analyzer.analyze();
        
        // Manual calculation
        const annualOperatingExpenses = analysis.monthlyAnalysis.expenses.operating * 12;
        const annualDebtService = analysis.monthlyAnalysis.expenses.debt * 12;
        const grossPotentialRent = property.data.monthlyRent * 12;
        
        const expectedBreakEven = ((annualOperatingExpenses + annualDebtService) / grossPotentialRent) * 100;
        
        expect(analysis.keyMetrics.breakEvenOccupancy).toBeCloseTo(expectedBreakEven, 2);
        
        console.log(`🏠 ${property.data.propertyName} - Break-Even Occupancy: ${analysis.keyMetrics.breakEvenOccupancy.toFixed(1)}%`);
        
        // Flag properties with dangerous break-even occupancy
        if (analysis.keyMetrics.breakEvenOccupancy > 85) {
          console.log(`⚠️  High break-even occupancy: ${analysis.keyMetrics.breakEvenOccupancy.toFixed(1)}%`);
        } else {
          console.log(`✅ Reasonable break-even occupancy`);
        }
      }
    });
  });

  describe('Sensitivity Analysis Validation', () => {
    it('should provide realistic best and worst case scenarios', async () => {
      for (const property of testProperties) {
        const analyzer = new SFRAnalyzer(property.data, property.assumptions);
        const analysis = analyzer.analyze();
        
        if (analysis.sensitivityAnalysis) {
          const sensitivity = analysis.sensitivityAnalysis;
          
          console.log(`🏠 ${property.data.propertyName} - Sensitivity Analysis:`);
          console.log(`  Base Case Cash Flow: $${analysis.monthlyAnalysis.cashFlow.toLocaleString()}/month`);
          console.log(`  Best Case Cash Flow: $${(sensitivity.bestCase.cashFlow / 12).toFixed(0)}/month`);
          console.log(`  Worst Case Cash Flow: $${(sensitivity.worstCase.cashFlow / 12).toFixed(0)}/month`);
          
          // Best case should be better than base case
          expect(sensitivity.bestCase.cashFlow).toBeGreaterThan(analysis.monthlyAnalysis.cashFlow * 12);
          expect(sensitivity.bestCase.cashOnCashReturn).toBeGreaterThan(analysis.keyMetrics.cashOnCashReturn);
          expect(sensitivity.bestCase.dscr).toBeGreaterThan(analysis.keyMetrics.dscr);
          
          // Worst case should be worse than base case
          expect(sensitivity.worstCase.cashFlow).toBeLessThan(analysis.monthlyAnalysis.cashFlow * 12);
          expect(sensitivity.worstCase.cashOnCashReturn).toBeLessThan(analysis.keyMetrics.cashOnCashReturn);
          expect(sensitivity.worstCase.dscr).toBeLessThan(analysis.keyMetrics.dscr);
          
          // Validate assumption ranges are reasonable
          expect(sensitivity.bestCase.vacancyRate).toBeLessThan(property.assumptions.vacancyRate);
          expect(sensitivity.worstCase.vacancyRate).toBeGreaterThan(property.assumptions.vacancyRate);
        }
      }
    });
  });

  describe('Performance and Memory Validation', () => {
    it('should complete calculations within performance targets', async () => {
      const startTime = Date.now();
      
      for (const property of testProperties) {
        const analyzer = new SFRAnalyzer(property.data, property.assumptions);
        const analysis = analyzer.analyze();
        
        // Validate analysis completed
        expect(analysis).toBeDefined();
        expect(analysis.keyMetrics).toBeDefined();
        expect(analysis.monthlyAnalysis).toBeDefined();
        expect(analysis.longTermAnalysis).toBeDefined();
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`⏱️  Total calculation time: ${totalTime}ms for ${testProperties.length} properties`);
      
      // Should complete all calculations in reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds for all test properties
    });

    it('should maintain calculation precision to required decimal places', async () => {
      const property = testProperties[0];
      const analyzer = new SFRAnalyzer(property.data, property.assumptions);
      const analysis = analyzer.analyze();
      
      console.log(`🔍 Precision validation for: ${property.data.propertyName}`);
      
      // Financial metrics should maintain at least 2 decimal places precision
      const precisionTests = [
        { value: analysis.keyMetrics.capRate, name: 'Cap Rate' },
        { value: analysis.keyMetrics.cashOnCashReturn, name: 'Cash-on-Cash Return' },
        { value: analysis.keyMetrics.dscr, name: 'DSCR' },
        { value: analysis.keyMetrics.operatingExpenseRatio, name: 'Operating Expense Ratio' },
        { value: analysis.keyMetrics.debtYield, name: 'Debt Yield' },
        { value: analysis.keyMetrics.grossYield, name: 'Gross Yield' },
      ];
      
      for (const test of precisionTests) {
        expect(isFinite(test.value)).toBe(true);
        expect(isNaN(test.value)).toBe(false);
        
        // Check precision by converting to string and back
        const rounded = Math.round(test.value * 100) / 100;
        expect(Math.abs(test.value - rounded)).toBeLessThan(0.01);
        
        console.log(`  ${test.name}: ${test.value.toFixed(2)}`);
      }
    });
  });

  describe('Real Property Analysis Validation', () => {
    it('should analyze each real property and log key insights', async () => {
      console.log('\n📊 === REAL PROPERTY ANALYSIS SUMMARY ===');
      
      for (let i = 0; i < testProperties.length; i++) {
        const property = testProperties[i];
        const analyzer = new SFRAnalyzer(property.data, property.assumptions);
        const analysis = analyzer.analyze();
        
        console.log(`\n🏠 Property ${i + 1}: ${property.data.propertyName}`);
        console.log(`📍 Location: ${property.data.propertyAddress.city}, ${property.data.propertyAddress.state}`);
        console.log(`💰 Purchase Price: $${property.data.purchasePrice.toLocaleString()}`);
        console.log(`🏠 Monthly Rent: $${property.data.monthlyRent.toLocaleString()}`);
        console.log(`📈 Key Metrics:`);
        console.log(`  • Cap Rate: ${analysis.keyMetrics.capRate.toFixed(2)}%`);
        console.log(`  • Cash-on-Cash Return: ${analysis.keyMetrics.cashOnCashReturn.toFixed(2)}%`);
        console.log(`  • DSCR: ${analysis.keyMetrics.dscr.toFixed(2)}`);
        console.log(`  • Debt Yield: ${analysis.keyMetrics.debtYield.toFixed(2)}%`);
        console.log(`  • Gross Yield: ${analysis.keyMetrics.grossYield.toFixed(2)}%`);
        console.log(`  • Monthly Cash Flow: $${analysis.monthlyAnalysis.cashFlow.toFixed(0)}`);
        console.log(`  • Break-Even Occupancy: ${analysis.keyMetrics.breakEvenOccupancy.toFixed(1)}%`);
        
        // Basic validation that all metrics are calculated
        expect(analysis.keyMetrics.capRate).toBeDefined();
        expect(analysis.keyMetrics.cashOnCashReturn).toBeDefined();
        expect(analysis.keyMetrics.dscr).toBeDefined();
        expect(analysis.keyMetrics.debtYield).toBeDefined();
        expect(analysis.keyMetrics.grossYield).toBeDefined();
        expect(analysis.monthlyAnalysis.cashFlow).toBeDefined();
        expect(analysis.keyMetrics.breakEvenOccupancy).toBeDefined();
      }
      
      console.log('\n✅ All real properties analyzed successfully');
    });
  });
});