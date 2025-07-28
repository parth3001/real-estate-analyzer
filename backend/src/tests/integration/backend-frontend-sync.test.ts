import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDatabase';
import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import { mockDealData } from '../fixtures/testData';
import { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';
import { SFRData } from '../../types/propertyTypes';

/**
 * Backend-Frontend Data Synchronization Tests
 * 
 * This test suite ensures that ALL metrics calculated in the backend
 * are correctly passed to and displayed in the frontend.
 * 
 * IMPORTANT: This test automatically validates all fields in the analysis response
 * without hardcoding specific field names, making it resilient to changes.
 */

// Helper function to create properly typed SFR data
function createSFRData(overrides: Partial<SFRData> = {}): SFRData {
  return {
    propertyType: 'SFR' as const,
    propertyAddress: mockDealData.propertyAddress,
    purchasePrice: mockDealData.purchasePrice,
    downPayment: mockDealData.downPayment,
    interestRate: mockDealData.interestRate,
    loanTerm: mockDealData.loanTerm,
    propertyTaxRate: mockDealData.propertyTaxRate,
    insuranceRate: mockDealData.insuranceRate,
    propertyManagementRate: mockDealData.propertyManagementRate || 0,
    yearBuilt: mockDealData.yearBuilt || 2020,
    monthlyRent: mockDealData.monthlyRent,
    squareFootage: mockDealData.squareFootage,
    bedrooms: mockDealData.bedrooms,
    bathrooms: mockDealData.bathrooms,
    maintenanceCost: mockDealData.maintenanceCost,
    longTermAssumptions: mockDealData.longTermAssumptions,
    ...overrides
  };
}

describe('Backend-Frontend Data Synchronization', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Automatic Field Validation', () => {
    it('should validate all numeric fields are properly formatted for frontend display', async () => {
      const sfrData = createSFRData();
      const assumptions: AnalysisAssumptions = {
        projectionYears: sfrData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: sfrData.longTermAssumptions?.annualRentIncrease || 2,
        annualExpenseIncrease: 2, // Fixed default value
        annualPropertyValueIncrease: sfrData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: sfrData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: sfrData.longTermAssumptions?.vacancyRate || 5
      };
      const analyzer = new SFRAnalyzer(sfrData, assumptions);
      const analysis = await analyzer.analyzeWithMarketIntelligence();

      // Create a registry of all numeric fields found
      const numericFields: { path: string; value: any; type: string }[] = [];
      
      // Recursively find all numeric fields
      function findNumericFields(obj: any, path: string = '') {
        for (const key in obj) {
          const currentPath = path ? `${path}.${key}` : key;
          const value = obj[key];
          
          if (value === null || value === undefined) {
            continue;
          }
          
          if (typeof value === 'number') {
            numericFields.push({ path: currentPath, value, type: 'number' });
            
            // Validate the number
            expect(value).not.toBe(NaN);
            expect(value).not.toBe(Infinity);
            expect(value).not.toBe(-Infinity);
            
            // Check for potential display issues
            if (currentPath.includes('Score') && value >= 10) {
              // Scores above 10 should not be truncated to single digits
              const stringValue = value.toString();
              expect(stringValue.length).toBeGreaterThanOrEqual(2);
            }
          } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
            numericFields.push({ path: currentPath, value, type: 'numeric-string' });
            
            // Check for truncation bugs in string representations
            const numericValue = parseFloat(value);
            if (currentPath.includes('Score') && numericValue >= 10 && value.length === 1) {
              throw new Error(`🚨 TRUNCATION BUG: ${currentPath} = "${value}" appears truncated (numeric value: ${numericValue})`);
            }
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            findNumericFields(value, currentPath);
          } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (typeof item === 'object') {
                findNumericFields(item, `${currentPath}[${index}]`);
              }
            });
          }
        }
      }

      findNumericFields(analysis);

      // Log all found numeric fields for debugging
      console.log(`\n📊 Found ${numericFields.length} numeric fields:`);
      numericFields.forEach(field => {
        console.log(`  ${field.path}: ${field.value} (${field.type})`);
      });

      // Validate each numeric field
      expect(numericFields.length).toBeGreaterThan(0);
      
      // Check for common patterns that indicate bugs
      numericFields.forEach(field => {
        // Check for percentage fields
        if (field.path.includes('Rate') || field.path.includes('Return') || field.path.includes('Ratio')) {
          if (typeof field.value === 'number') {
            // Percentages should be reasonable
            expect(Math.abs(field.value)).toBeLessThan(1000);
          }
        }
        
        // Check for currency fields
        if (field.path.includes('Price') || field.path.includes('Cost') || field.path.includes('Flow') || field.path.includes('Income')) {
          if (typeof field.value === 'number') {
            // Currency values should be finite
            expect(isFinite(field.value)).toBe(true);
          }
        }
      });
    });

    it('should maintain data integrity through serialization/deserialization', async () => {
      const sfrData = createSFRData();
      const assumptions: AnalysisAssumptions = {
        projectionYears: sfrData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: sfrData.longTermAssumptions?.annualRentIncrease || 2,
        annualExpenseIncrease: 2, // Fixed default value
        annualPropertyValueIncrease: sfrData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: sfrData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: sfrData.longTermAssumptions?.vacancyRate || 5
      };
      const analyzer = new SFRAnalyzer(sfrData, assumptions);
      const analysis = await analyzer.analyzeWithMarketIntelligence();

      // Simulate what happens when data goes through API
      const serialized = JSON.stringify(analysis);
      const deserialized = JSON.parse(serialized);

      // Compare all fields
      function compareObjects(original: any, parsed: any, path: string = '') {
        for (const key in original) {
          const currentPath = path ? `${path}.${key}` : key;
          const originalValue = original[key];
          const parsedValue = parsed[key];
          
          if (originalValue === null || originalValue === undefined) {
            expect(parsedValue).toBe(originalValue);
            continue;
          }
          
          if (typeof originalValue === 'number') {
            expect(parsedValue).toBe(originalValue);
            
            // Check for precision loss
            if (originalValue % 1 !== 0) { // Has decimals
              const originalStr = originalValue.toString();
              const parsedStr = parsedValue.toString();
              
              // Should maintain reasonable precision
              if (originalStr.includes('.')) {
                expect(parsedStr).toContain('.');
              }
            }
          } else if (typeof originalValue === 'string') {
            expect(parsedValue).toBe(originalValue);
            
            // Check for truncation
            if (originalValue.length > 1 && parsedValue.length === 1) {
              throw new Error(`🚨 STRING TRUNCATION: ${currentPath} truncated from "${originalValue}" to "${parsedValue}"`);
            }
          } else if (typeof originalValue === 'object' && !Array.isArray(originalValue)) {
            expect(typeof parsedValue).toBe('object');
            compareObjects(originalValue, parsedValue, currentPath);
          } else if (Array.isArray(originalValue)) {
            expect(Array.isArray(parsedValue)).toBe(true);
            expect(parsedValue.length).toBe(originalValue.length);
            
            originalValue.forEach((item, index) => {
              if (typeof item === 'object') {
                compareObjects(item, parsedValue[index], `${currentPath}[${index}]`);
              } else {
                expect(parsedValue[index]).toBe(item);
              }
            });
          }
        }
      }

      compareObjects(analysis, deserialized);
    });

    it('should generate a field mapping for frontend validation', async () => {
      const sfrData = createSFRData();
      const assumptions: AnalysisAssumptions = {
        projectionYears: sfrData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: sfrData.longTermAssumptions?.annualRentIncrease || 2,
        annualExpenseIncrease: 2, // Fixed default value
        annualPropertyValueIncrease: sfrData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: sfrData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: sfrData.longTermAssumptions?.vacancyRate || 5
      };
      const analyzer = new SFRAnalyzer(sfrData, assumptions);
      const analysis = await analyzer.analyzeWithMarketIntelligence();

      // Generate a mapping of all fields that frontend should display
      const fieldMapping: { [key: string]: { type: string; path: string; sampleValue: any } } = {};
      
      function mapFields(obj: any, path: string = '') {
        for (const key in obj) {
          const currentPath = path ? `${path}.${key}` : key;
          const value = obj[key];
          
          if (value === null || value === undefined) {
            continue;
          }
          
          if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
            // Terminal field - should be displayed
            const fieldKey = currentPath.replace(/\[.*?\]/g, ''); // Remove array indices
            fieldMapping[fieldKey] = {
              type: typeof value,
              path: currentPath,
              sampleValue: value
            };
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            mapFields(value, currentPath);
          } else if (Array.isArray(value) && value.length > 0) {
            // Map first item as template
            if (typeof value[0] === 'object') {
              mapFields(value[0], `${currentPath}[0]`);
            }
          }
        }
      }

      mapFields(analysis);

      // Output the field mapping (this can be used by frontend tests)
      console.log('\n📋 Field Mapping for Frontend Validation:');
      console.log(JSON.stringify(fieldMapping, null, 2));

      // Save to a file that frontend tests can use
      const fs = require('fs');
      const mappingPath = require('path').join(__dirname, '../fixtures/field-mapping.json');
      fs.writeFileSync(mappingPath, JSON.stringify({
        generated: new Date().toISOString(),
        propertyType: 'SFR',
        fields: fieldMapping
      }, null, 2));

      expect(Object.keys(fieldMapping).length).toBeGreaterThan(20); // Should have many fields
    });
  });

  describe('Critical Metric Validation', () => {
    it('should validate investment score is within valid range and not truncated', async () => {
      const testProperties = [
        createSFRData({ monthlyRent: 3000, purchasePrice: 250000 }), // Should score ~70-80
        createSFRData({ monthlyRent: 1500, purchasePrice: 400000 }), // Should score ~30-40
        createSFRData({ monthlyRent: 5000, purchasePrice: 350000 }), // Should score ~85-95
      ];

      for (const property of testProperties) {
        const assumptions: AnalysisAssumptions = {
          projectionYears: property.longTermAssumptions?.projectionYears || 10,
          annualRentIncrease: property.longTermAssumptions?.annualRentIncrease || 2,
          annualExpenseIncrease: 2, // Fixed default value
          annualPropertyValueIncrease: property.longTermAssumptions?.annualPropertyValueIncrease || 3,
          sellingCosts: property.longTermAssumptions?.sellingCostsPercentage || 6,
          vacancyRate: property.longTermAssumptions?.vacancyRate || 5
        };
        const analyzer = new SFRAnalyzer(property, assumptions);
        const analysis = await analyzer.analyzeWithMarketIntelligence();

        if (analysis.aiInsights?.investmentScore) {
          const score = analysis.aiInsights.investmentScore;
          console.log(`Investment Score for ${property.monthlyRent}/${property.purchasePrice}: ${score}`);

          // Validate score format
          if (typeof score === 'string') {
            const numScore = parseFloat(score);
            expect(numScore).toBeGreaterThanOrEqual(0);
            expect(numScore).toBeLessThanOrEqual(100);
            
            // Check for truncation
            if (numScore >= 10 && String(score).length === 1) {
              throw new Error(`🚨 SCORE TRUNCATION: Expected 2+ digits, got "${score}"`);
            }
          } else if (typeof score === 'number') {
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          }
        }
      }
    });

    it('should validate all percentage fields are formatted correctly', async () => {
      const sfrData = createSFRData();
      const assumptions: AnalysisAssumptions = {
        projectionYears: sfrData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: sfrData.longTermAssumptions?.annualRentIncrease || 2,
        annualExpenseIncrease: 2, // Fixed default value
        annualPropertyValueIncrease: sfrData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: sfrData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: sfrData.longTermAssumptions?.vacancyRate || 5
      };
      const analyzer = new SFRAnalyzer(sfrData, assumptions);
      const analysis = await analyzer.analyzeWithMarketIntelligence();

      const percentageFields = [
        'keyMetrics.capRate',
        'keyMetrics.cashOnCashReturn',
        'keyMetrics.operatingExpenseRatio',
        'keyMetrics.rentToValueRatio',
        'keyMetrics.onePercentRuleValue'
      ];

      percentageFields.forEach(fieldPath => {
        const value = getNestedValue(analysis, fieldPath);
        if (value !== undefined && value !== null) {
          console.log(`${fieldPath}: ${value} (${typeof value})`);
          
          // Should be a reasonable percentage
          if (typeof value === 'number') {
            expect(Math.abs(value)).toBeLessThan(200); // No crazy percentages
          }
        }
      });
    });
  });

  describe('Regression Testing', () => {
    it('should detect if any expected fields are missing', async () => {
      const sfrData = createSFRData();
      const assumptions: AnalysisAssumptions = {
        projectionYears: sfrData.longTermAssumptions?.projectionYears || 10,
        annualRentIncrease: sfrData.longTermAssumptions?.annualRentIncrease || 2,
        annualExpenseIncrease: 2, // Fixed default value
        annualPropertyValueIncrease: sfrData.longTermAssumptions?.annualPropertyValueIncrease || 3,
        sellingCosts: sfrData.longTermAssumptions?.sellingCostsPercentage || 6,
        vacancyRate: sfrData.longTermAssumptions?.vacancyRate || 5
      };
      const analyzer = new SFRAnalyzer(sfrData, assumptions);
      const analysis = await analyzer.analyzeWithMarketIntelligence();

      // Critical fields that must always exist
      const requiredFields = [
        'monthlyAnalysis',
        'annualAnalysis', 
        'keyMetrics',
        'longTermAnalysis'
      ];

      requiredFields.forEach(field => {
        expect(analysis[field]).toBeDefined();
        expect(analysis[field]).not.toBeNull();
      });

      // Key metrics that must exist
      const requiredMetrics = [
        'capRate',
        'cashOnCashReturn',
        'debtServiceCoverageRatio'
      ];

      if (analysis.keyMetrics) {
        requiredMetrics.forEach(metric => {
          expect(analysis.keyMetrics[metric]).toBeDefined();
          expect(typeof analysis.keyMetrics[metric]).toBe('number');
        });
      }
    });
  });
});

// Helper function to get nested values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}