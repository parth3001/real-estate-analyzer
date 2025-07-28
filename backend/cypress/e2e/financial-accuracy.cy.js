/// <reference types="cypress" />

describe('Financial Accuracy E2E Tests', () => {
  let referenceProperty;
  let comparisonProperties;

  before(() => {
    cy.fixture('reference-property').then((data) => {
      referenceProperty = data.nashville_sfr_2024;
      comparisonProperties = data.comparison_properties;
    });
  });

  beforeEach(() => {
    // Set up test user
    const userData = {
      email: 'analyst@example.com',
      password: 'FinancialTest123!',
      firstName: 'Financial',
      lastName: 'Analyst'
    };

    cy.register(userData).then(() => {
      cy.login(userData.email, userData.password);
    });

    cy.visit('/');
  });

  describe('Reference Property Financial Validation', () => {
    it('should calculate key metrics accurately for Nashville reference property', () => {
      const property = referenceProperty.propertyData;
      const expected = referenceProperty.expectedCalculations;

      // Navigate to SFR analysis
      cy.get('[data-testid="sfr-analysis-link"]').click();

      // Fill in property details
      cy.fillPropertyForm(property);

      // Submit analysis
      cy.submitAnalysis();

      // Validate key financial metrics
      cy.verifyFinancialMetrics({
        capRate: expected.keyMetrics.capRate,
        monthlyOutline: expected.monthlyAnalysis.cashFlow,
        cashOnCashReturn: expected.keyMetrics.cashOnCashReturn,
        dscr: expected.keyMetrics.debtServiceCoverageRatio
      });

      // Take screenshot for manual review
      cy.takeFinancialScreenshot('nashville-reference-property');

      // Validate detailed monthly breakdown
      cy.get('[data-testid="monthly-analysis"]').within(() => {
        // Gross Income
        cy.get('[data-testid="gross-income"]')
          .should('contain', expected.monthlyAnalysis.grossIncome.toFixed(0));

        // Property Tax
        cy.get('[data-testid="property-tax"]')
          .should('contain', expected.monthlyAnalysis.propertyTax.toFixed(0));

        // Insurance  
        cy.get('[data-testid="insurance"]')
          .should('contain', expected.monthlyAnalysis.insurance.toFixed(0));

        // NOI
        cy.get('[data-testid="noi"]')
          .should('contain', expected.monthlyAnalysis.netOperatingIncome.toFixed(0));

        // Cash Flow
        cy.get('[data-testid="cash-flow"]')
          .should('contain', expected.monthly Analysis.cashFlow.toFixed(0));
      });

      // Validate investment classification
      cy.get('[data-testid="investment-classification"]')
        .should('contain', referenceProperty.expectedCalculations.investmentClassification);
    });

    it('should handle edge case: interest rate sensitivity', () => {
      const edgeCase = referenceProperty.edgeCaseTests.find(
        test => test.scenario === 'interest_rate_change'
      );

      // Use reference property but modify interest rate
      const modifiedProperty = {
        ...referenceProperty.propertyData,
        ...edgeCase.modification
      };

      cy.fillPropertyForm(modifiedProperty);
      cy.submitAnalysis();

      // Validate that cash flow became more negative
      cy.get('[data-testid="monthly-cash-flow"]').then(($el) => {
        const actualCashFlow = parseFloat($el.text().replace(/[^0-9.-]/g, ''));
        const originalCashFlow = referenceProperty.expectedCalculations.monthlyAnalysis.cashFlow;
        
        // Should be more negative (lower) than original
        expect(actualCashFlow).to.be.lessThan(originalCashFlow);
      });

      // DSCR should be further below 1.0
      cy.get('[data-testid="dscr"]').then(($el) => {
        const actualDSCR = parseFloat($el.text());
        expect(actualDSCR).to.be.lessThan(0.96); // Original DSCR was 0.96
      });

      cy.takeFinancialScreenshot('interest-rate-sensitivity');
    });

    it('should handle edge case: rent increase scenario', () => {
      const edgeCase = referenceProperty.edgeCaseTests.find(
        test => test.scenario === 'rent_increase'
      );

      const modifiedProperty = {
        ...referenceProperty.propertyData,
        ...edgeCase.modification
      };

      cy.fillPropertyForm(modifiedProperty);
      cy.submitAnalysis();

      // Should now have positive cash flow
      cy.get('[data-testid="monthly-cash-flow"]').then(($el) => {
        const actualCashFlow = parseFloat($el.text().replace(/[^0-9.-]/g, ''));
        expect(actualCashFlow).to.be.greaterThan(0);
      });

      // Cap rate should increase
      cy.get('[data-testid="cap-rate"]').then(($el) => {
        const actualCapRate = parseFloat($el.text());
        expect(actualCapRate).to.be.greaterThan(4.43); // Original cap rate
      });

      // Investment classification should improve
      cy.get('[data-testid="investment-classification"]')
        .should('not.contain', 'Cash Flow Negative');

      cy.takeFinancialScreenshot('rent-increase-scenario');
    });
  });

  describe('Comparative Property Analysis', () => {
    it('should rank properties correctly by investment quality', () => {
      const properties = [
        referenceProperty.propertyData,
        ...comparisonProperties.map(p => p.propertyData)
      ];

      const results = [];

      // Analyze each property
      properties.forEach((property, index) => {
        cy.visit('/sfr-analysis');
        cy.fillPropertyForm(property);
        cy.submitAnalysis();

        // Capture key metrics
        cy.get('[data-testid="cash-on-cash-return"]').then(($cocr) => {
          cy.get('[data-testid="monthly-cash-flow"]').then(($cf) => {
            cy.get('[data-testid="cap-rate"]').then(($cap) => {
              const cocrValue = parseFloat($cocr.text().replace(/[^0-9.-]/g, ''));
              const cashFlowValue = parseFloat($cf.text().replace(/[^0-9.-]/g, ''));
              const capRateValue = parseFloat($cap.text().replace(/[^0-9.-]/g, ''));

              results.push({
                name: property.propertyName,
                cashOnCashReturn: cocrValue,
                monthlyCashFlow: cashFlowValue,
                capRate: capRateValue
              });

              cy.takeFinancialScreenshot(`property-${index}-${property.propertyName.replace(/\s+/g, '-')}`);
            });
          });
        });
      });

      // After analyzing all properties, validate ranking
      cy.then(() => {
        // Sort by cash-on-cash return
        results.sort((a, b) => b.cashOnCashReturn - a.cashOnCashReturn);

        // High cash flow property should rank first
        expect(results[0].name).to.contain('Cash Flow Winner');
        expect(results[0].monthlyCashFlow).to.be.greaterThan(200);

        // Nashville reference property should be last (negative cash flow)
        expect(results[results.length - 1].name).to.contain('Nashville Reference');
        expect(results[results.length - 1].monthlyCashFlow).to.be.lessThan(0);

        // Log results for manual review
        cy.task('log', 'Property Ranking Results:');
        results.forEach((result, index) => {
          cy.task('log', `${index + 1}. ${result.name}: CoC ${result.cashOnCashReturn.toFixed(2)}%, Cash Flow $${result.monthlyCashFlow.toFixed(0)}`);
        });
      });
    });

    it('should validate 1% rule compliance across properties', () => {
      comparisonProperties.forEach((property) => {
        cy.visit('/sfr-analysis');
        cy.fillPropertyForm(property.propertyData);
        cy.submitAnalysis();

        // Calculate 1% rule
        const onePercentValue = (property.propertyData.monthlyRent / property.propertyData.purchasePrice) * 100;

        cy.get('[data-testid="one-percent-rule"]').then(($el) => {
          const displayedValue = parseFloat($el.text());
          expect(displayedValue).to.be.closeTo(onePercentValue, 0.01);
        });

        // Properties meeting 1% rule should generally have positive cash flow
        if (onePercentValue >= 1.0) {
          cy.get('[data-testid="monthly-cash-flow"]').then(($cf) => {
            const cashFlow = parseFloat($cf.text().replace(/[^0-9.-]/g, ''));
            expect(cashFlow).to.be.greaterThan(-100); // Allow some variance
          });
        }
      });
    });
  });

  describe('Mode-Specific Financial Display', () => {
    it('should show appropriate detail level in novice mode', () => {
      cy.visit('/sfr-analysis');
      
      // Ensure in novice mode
      cy.get('[data-testid="mode-toggle"]').then(($toggle) => {
        if (!$toggle.text().includes('novice')) {
          cy.get('[data-testid="mode-toggle"]').click();
        }
      });

      cy.fillPropertyForm(referenceProperty.propertyData);
      cy.submitAnalysis();

      // Should show educational tooltips
      cy.get('[data-testid="cap-rate-tooltip"]').should('be.visible');
      cy.get('[data-testid="dscr-tooltip"]').should('be.visible');

      // Should show simplified explanations
      cy.get('[data-testid="investment-explanation"]')
        .should('contain', 'This means')
        .should('contain', 'because');

      cy.takeFinancialScreenshot('novice-mode-display');
    });

    it('should show condensed information in pro mode', () => {
      cy.visit('/sfr-analysis');
      
      // Switch to pro mode
      cy.get('[data-testid="mode-toggle"]').click();
      cy.verifyModeToggle('pro');

      cy.fillPropertyForm(referenceProperty.propertyData);
      cy.submitAnalysis();

      // Should not show educational tooltips
      cy.get('[data-testid="cap-rate-tooltip"]').should('not.exist');
      
      // Should show more technical metrics
      cy.get('[data-testid="gross-rent-multiplier"]').should('be.visible');
      cy.get('[data-testid="operating-expense-ratio"]').should('be.visible');

      // Should show raw numbers without excessive explanation
      cy.get('[data-testid="metrics-table"]').should('be.visible');

      cy.takeFinancialScreenshot('pro-mode-display');
    });
  });

  describe('Long-term Projection Accuracy', () => {
    it('should project realistic property appreciation over 10 years', () => {
      cy.visit('/sfr-analysis');
      cy.fillPropertyForm(referenceProperty.propertyData);
      cy.submitAnalysis();

      // Navigate to long-term projections
      cy.get('[data-testid="long-term-tab"]').click();

      // Validate year 10 property value
      const initialValue = referenceProperty.propertyData.purchasePrice;
      const appreciationRate = referenceProperty.propertyData.longTermAssumptions.annualPropertyValueIncrease / 100;
      const expectedYear10Value = initialValue * Math.pow(1 + appreciationRate, 10);

      cy.get('[data-testid="year-10-property-value"]').then(($el) => {
        const actualValue = parseFloat($el.text().replace(/[^0-9.-]/g, ''));
        expect(actualValue).to.be.closeTo(expectedYear10Value, expectedYear10Value * 0.02); // 2% tolerance
      });

      // Validate cumulative cash flow
      cy.get('[data-testid="cumulative-cash-flow-10"]').should('be.visible');

      // Validate IRR calculation
      cy.get('[data-testid="internal-rate-return"]').then(($irr) => {
        const irrValue = parseFloat($irr.text());
        expect(irrValue).to.be.greaterThan(-10); // Should be reasonable
        expect(irrValue).to.be.lessThan(20);
      });

      cy.takeFinancialScreenshot('long-term-projections');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle extreme property values gracefully', () => {
      const extremeProperty = {
        ...referenceProperty.propertyData,
        purchasePrice: 2000000, // Very expensive
        monthlyRent: 8000,
        downPayment: 400000
      };

      cy.visit('/sfr-analysis');
      cy.fillPropertyForm(extremeProperty);
      cy.submitAnalysis();

      // Should still calculate metrics without errors
      cy.get('[data-testid="analysis-results"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('not.exist');

      // Metrics should be reasonable
      cy.get('[data-testid="cap-rate"]').then(($el) => {
        const capRate = parseFloat($el.text());
        expect(capRate).to.be.greaterThan(0);
        expect(capRate).to.be.lessThan(50); // Sanity check
      });
    });

    it('should handle zero/negative inputs appropriately', () => {
      const invalidProperty = {
        ...referenceProperty.propertyData,
        monthlyRent: 0,
        maintenanceCost: -100
      };

      cy.visit('/sfr-analysis');
      cy.fillPropertyForm(invalidProperty);

      // Should show validation errors
      cy.get('[data-testid="analyze-button"]').click();
      cy.get('[data-testid="validation-error"]').should('be.visible');
    });
  });
});