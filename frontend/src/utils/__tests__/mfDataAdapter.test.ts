/**
 * MFDataAdapter Unit Tests
 *
 * Purpose: Validate critical field name mappings that prevent null metrics bugs
 *
 * Critical Test Coverage:
 * - Insurance: insurancePerUnit ($) → insuranceRate (%)
 * - Maintenance: maintenanceCostPerUnit (monthly) → maintenanceCost
 * - Property Management: propertyManagementRate (correct field name)
 * - Unit count validation
 * - Data round-trip (wizard → backend → wizard)
 */

import {
  transformMFWizardDataToBackend,
  transformBackendToWizardData,
  validateMFWizardData,
  calculateTotalMonthlyRent,
  calculateAnnualGrossIncome,
  formatInsuranceDisplay,
  type MFWizardFormData
} from '../mfDataAdapter';

describe('MFDataAdapter', () => {
  // Test fixture: Valid MF wizard data
  const validWizardData: MFWizardFormData = {
    propertyName: 'Test 8-Plex',
    propertyAddress: {
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701'
    },
    totalUnits: 8,
    totalSqft: 6400,
    yearBuilt: 2010,
    buildingType: 'STACKED',
    purchasePrice: 1200000,
    downPayment: 300000,
    downPaymentPercentage: 25,
    interestRate: 7.5,
    loanTerm: 30,
    closingCosts: 36000,
    propertyTaxRate: 2.0,
    insurancePerUnit: 600, // CRITICAL: Dollar amount per unit
    propertyManagementRate: 10, // CRITICAL: Correct field name
    maintenanceCostPerUnit: 100, // CRITICAL: Per unit per month
    commonAreaUtilities: {
      electric: 150,
      water: 120,
      gas: 80,
      trash: 60
    },
    unitTypes: [
      {
        type: '2BR/1BA',
        count: 8,
        sqft: 800,
        monthlyRent: 1200,
        occupied: 7
      }
    ],
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3,
      annualPropertyValueIncrease: 4,
      sellingCostsPercentage: 7,
      inflationRate: 2.5,
      vacancyRate: 5,
      capitalExpenditureRate: 6,
      commonAreaMaintenanceRate: 2
    }
  };

  describe('validateMFWizardData', () => {
    it('should validate correct wizard data', () => {
      const result = validateMFWizardData(validWizardData);

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should reject data with totalUnits < 2', () => {
      const invalidData = { ...validWizardData, totalUnits: 1 };
      const result = validateMFWizardData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'totalUnits',
          severity: 'error'
        })
      );
    });

    it('should warn if totalUnits > 32', () => {
      const warnData = { ...validWizardData, totalUnits: 40 };
      const result = validateMFWizardData(warnData);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'totalUnits'
        })
      );
    });

    it('should reject data without unit types', () => {
      const invalidData = { ...validWizardData, unitTypes: [] };
      const result = validateMFWizardData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'unitTypes',
          severity: 'error'
        })
      );
    });

    it('should reject data where unit count mismatch', () => {
      const invalidData = {
        ...validWizardData,
        totalUnits: 10, // Says 10 units
        unitTypes: [
          { type: '2BR/1BA', count: 8, sqft: 800, monthlyRent: 1200, occupied: 7 } // But only 8 units configured
        ]
      };
      const result = validateMFWizardData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'unitTypes',
          message: expect.stringContaining("doesn't match total units")
        })
      );
    });
  });

  describe('transformMFWizardDataToBackend - CRITICAL FIELD MAPPINGS', () => {
    it('should correctly map insurancePerUnit ($) to insuranceRate (%)', () => {
      const wizardData = {
        ...validWizardData,
        insurancePerUnit: 600, // $600/unit/year
        insuranceRate: undefined
      };

      const backendData = transformMFWizardDataToBackend(wizardData);

      // Calculation: (600 × 8 units) / 1,200,000 × 100 = 0.4%
      expect(backendData.insuranceRate).toBeCloseTo(0.4, 2);
      expect(backendData.propertyType).toBe('MF');
    });

    it('should use insuranceRate if provided (override insurancePerUnit)', () => {
      const wizardData = {
        ...validWizardData,
        insuranceRate: 0.5, // Explicitly set
        insurancePerUnit: 600 // Should be ignored
      };

      const backendData = transformMFWizardDataToBackend(wizardData);

      expect(backendData.insuranceRate).toBe(0.5);
    });

    it('should correctly map maintenanceCostPerUnit field name', () => {
      const wizardData = {
        ...validWizardData,
        maintenanceCostPerUnit: 150 // $150/unit/month
      };

      const backendData = transformMFWizardDataToBackend(wizardData);

      // CRITICAL: Backend expects maintenanceCostPerUnit (per unit per month)
      expect(backendData.maintenanceCostPerUnit).toBe(150);
    });

    it('should use default maintenanceCost if not provided', () => {
      const wizardData = {
        ...validWizardData,
        maintenanceCostPerUnit: undefined
      };

      const backendData = transformMFWizardDataToBackend(wizardData);

      // Default: $100/unit/month
      expect(backendData.maintenanceCostPerUnit).toBe(100);
    });

    it('should correctly use propertyManagementRate field name', () => {
      const wizardData = {
        ...validWizardData,
        propertyManagementRate: 12
      };

      const backendData = transformMFWizardDataToBackend(wizardData);

      // CRITICAL: Correct field name (not propertyManagementPercent)
      expect(backendData.propertyManagementRate).toBe(12);
    });

    it('should calculate downPayment from percentage if not provided', () => {
      const wizardData = {
        ...validWizardData,
        downPayment: 0,
        downPaymentPercentage: 20
      };

      // Remove downPayment to test calculation
      const { downPayment: _, ...wizardDataNoDownPayment } = wizardData;
      const backendData = transformMFWizardDataToBackend(wizardDataNoDownPayment as MFWizardFormData);

      // 20% of $1,200,000 = $240,000
      expect(backendData.downPayment).toBe(240000);
    });

    it('should use default 25% down payment if neither provided', () => {
      const { downPayment: _, downPaymentPercentage: __, ...wizardDataNoDp } = validWizardData;
      const backendData = transformMFWizardDataToBackend(wizardDataNoDp as MFWizardFormData);

      // 25% of $1,200,000 = $300,000
      expect(backendData.downPayment).toBe(300000);
    });

    it('should preserve all unit types correctly', () => {
      const wizardData = {
        ...validWizardData,
        unitTypes: [
          { type: '1BR/1BA', count: 4, sqft: 650, monthlyRent: 1000, occupied: 4 },
          { type: '2BR/1BA', count: 4, sqft: 800, monthlyRent: 1200, occupied: 3 }
        ]
      };

      const backendData = transformMFWizardDataToBackend(wizardData);

      expect(backendData.unitTypes).toHaveLength(2);
      expect(backendData.unitTypes[0].count).toBe(4);
      expect(backendData.unitTypes[1].count).toBe(4);
    });

    it('should preserve common area utilities', () => {
      const backendData = transformMFWizardDataToBackend(validWizardData);

      expect(backendData.commonAreaUtilities).toEqual({
        electric: 150,
        water: 120,
        gas: 80,
        trash: 60
      });
    });

    it('should throw error if validation fails', () => {
      const invalidData = {
        ...validWizardData,
        totalUnits: 1 // Invalid: less than 2
      };

      expect(() => {
        transformMFWizardDataToBackend(invalidData);
      }).toThrow('MF Data Validation Failed');
    });
  });

  describe('transformBackendToWizardData - Round Trip', () => {
    it('should correctly reverse transform backend data to wizard format', () => {
      // Transform to backend
      const backendData = transformMFWizardDataToBackend(validWizardData);

      // Transform back to wizard
      const wizardDataRoundTrip = transformBackendToWizardData(backendData);

      // Check critical fields match
      expect(wizardDataRoundTrip.totalUnits).toBe(validWizardData.totalUnits);
      expect(wizardDataRoundTrip.propertyManagementRate).toBe(validWizardData.propertyManagementRate);
      expect(wizardDataRoundTrip.maintenanceCostPerUnit).toBe(validWizardData.maintenanceCostPerUnit);

      // Insurance should be converted back to per-unit
      // (600 × 8) / 1,200,000 × 100 = 0.4% → back to $600/unit
      expect(wizardDataRoundTrip.insurancePerUnit).toBeCloseTo(600, 0);
    });

    it('should calculate downPaymentPercentage correctly', () => {
      const backendData = transformMFWizardDataToBackend(validWizardData);
      const wizardDataRoundTrip = transformBackendToWizardData(backendData);

      expect(wizardDataRoundTrip.downPaymentPercentage).toBeCloseTo(25, 1);
    });
  });

  describe('Utility Functions', () => {
    it('calculateTotalMonthlyRent should sum all unit rents', () => {
      const unitTypes = [
        { count: 4, monthlyRent: 1000, type: '1BR', sqft: 650, occupied: 4 },
        { count: 4, monthlyRent: 1200, type: '2BR', sqft: 800, occupied: 4 }
      ];

      const total = calculateTotalMonthlyRent(unitTypes);

      // (4 × $1,000) + (4 × $1,200) = $8,800
      expect(total).toBe(8800);
    });

    it('calculateAnnualGrossIncome should multiply monthly by 12', () => {
      const unitTypes = [
        { count: 8, monthlyRent: 1200, type: '2BR', sqft: 800, occupied: 7 }
      ];

      const annual = calculateAnnualGrossIncome(unitTypes);

      // (8 × $1,200) × 12 = $115,200
      expect(annual).toBe(115200);
    });

    it('formatInsuranceDisplay should format insurance correctly', () => {
      const result = formatInsuranceDisplay(
        0.4, // 0.4% insurance rate
        1200000, // $1.2M purchase price
        8 // 8 units
      );

      expect(result.annualTotal).toBeCloseTo(4800, 0); // 0.4% of $1.2M
      expect(result.perUnit).toBeCloseTo(600, 0); // $4,800 / 8 units
      expect(result.perUnitMonthly).toBeCloseTo(50, 0); // $600 / 12 months
      expect(result.displayText).toContain('$600/unit/year');
      expect(result.displayText).toContain('0.40%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero common area utilities', () => {
      const wizardData = {
        ...validWizardData,
        commonAreaUtilities: {
          electric: 0,
          water: 0,
          gas: 0,
          trash: 0
        }
      };

      const backendData = transformMFWizardDataToBackend(wizardData);

      expect(backendData.commonAreaUtilities).toEqual({
        electric: 0,
        water: 0,
        gas: 0,
        trash: 0
      });
    });

    it('should handle missing optional fields', () => {
      const minimalData: MFWizardFormData = {
        propertyName: 'Minimal Property',
        propertyAddress: {
          street: '123 Test',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701'
        },
        totalUnits: 4,
        totalSqft: 3200,
        yearBuilt: 2020,
        purchasePrice: 800000,
        downPayment: 200000,
        interestRate: 7.0,
        loanTerm: 30,
        propertyTaxRate: 2.0,
        propertyManagementRate: 8,
        commonAreaUtilities: {
          electric: 0,
          water: 0,
          gas: 0,
          trash: 0
        },
        unitTypes: [
          { type: '2BR/1BA', count: 4, sqft: 800, monthlyRent: 1500, occupied: 4 }
        ],
        longTermAssumptions: {
          projectionYears: 10,
          annualRentIncrease: 3,
          annualPropertyValueIncrease: 4,
          sellingCostsPercentage: 7,
          inflationRate: 2.5,
          vacancyRate: 5,
          capitalExpenditureRate: 6,
          commonAreaMaintenanceRate: 2
        }
      };

      // Should not throw
      const backendData = transformMFWizardDataToBackend(minimalData);

      expect(backendData.propertyType).toBe('MF');
      expect(backendData.totalUnits).toBe(4);
    });

    it('should handle very high insurance rate with warning', () => {
      const highInsuranceData = {
        ...validWizardData,
        insurancePerUnit: 5000 // Very high
      };

      const validation = validateMFWizardData(highInsuranceData);

      // Should still be valid but with warning
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.field === 'insurance')).toBe(true);
    });
  });
});
