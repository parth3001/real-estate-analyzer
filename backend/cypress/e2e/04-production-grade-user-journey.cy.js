/// <reference types="cypress" />

/**
 * Production-Grade User Journey Tests
 * 
 * Complete end-to-end user journeys that validate the entire application
 * workflow from a business perspective, as would be done at Amazon.
 */

describe('Complete User Journey - Property Analysis', () => {
  let testUser;
  
  before(() => {
    // Create test user once for all tests
    cy.createTestUser({
      email: 'production.test@example.com',
      password: 'ProductionTest123!',
      firstName: 'Production',
      lastName: 'Tester'
    }).then((user) => {
      testUser = user;
    });
  });
  
  beforeEach(() => {
    cy.task('clearDatabase');
    
    // Ensure user is logged in before each test
    cy.loginAs(testUser);
    
    // Visit the SFR analysis page directly
    cy.visit('/sfr-analysis');
    
    // Wait for page to load
    cy.get('body').should('be.visible');
  });

  describe('Learning Mode User Journey', () => {
    it('should guide learning user through complete property analysis', () => {
      // Step 1: Switch to Learning mode
      cy.switchToMode('learning');
      
      // Step 2: Verify we're in Learning mode
      cy.verifyModeToggle('learning');
      
      // Step 3: Complete property analysis with guided experience
      const noviceProperty = {
        propertyAddress: {
          street: '123 Learning Street',
          city: 'Austin',
          state: 'TX',
          zipCode: '78704'
        },
        purchasePrice: 350000,
        downPayment: 70000,
        monthlyRent: 2600,
        propertyName: 'Learning Mode Test Property'
      };
      
      // Fill property form using updated command
      cy.fillPropertyForm(noviceProperty);
      
      // Step 4: Submit analysis
      cy.intercept('POST', '**/deals/analyze').as('analyzeProperty');
      cy.submitAnalysis();
      
      // Step 5: Wait for analysis completion
      cy.waitForApiCall('@analyzeProperty', 30000);
      cy.waitForAnalysisResults();
      
      // Step 6: Validate learning-friendly results
      cy.get('body').should('contain', 'Cash Flow');
      cy.get('body').should('contain', 'Return');
      
      // Step 7: Verify AI insights are present
      cy.get('body').should('contain.text', 'Investment');
      
      // Take screenshot for verification
      cy.takeAnalysisScreenshot('learning-mode-complete', {
        propertyPrice: noviceProperty.purchasePrice,
        expectedCashFlow: 500 // approximate expected value
      });
    });
  });

  describe('Pro Mode User Journey', () => {
    it('should provide professional user with advanced analysis', () => {
      // Step 1: Switch to Pro mode
      cy.switchToMode('pro');
      
      // Step 2: Verify we're in Pro mode
      cy.verifyModeToggle('pro');
      
      // Step 3: Complete comprehensive analysis
      const professionalProperty = {
        propertyAddress: {
          street: '456 Professional Blvd',
          city: 'Austin', 
          state: 'TX',
          zipCode: '78705'
        },
        propertyName: 'Pro Mode Test Property',
        purchasePrice: 750000,
        downPayment: 150000,
        interestRate: 6.8,
        monthlyRent: 4200,
        propertyTaxes: 15000,
        insurance: 2000,
        maintenance: 4500,
        vacancy: 6,
        capEx: 3000,
        management: 8
      };
      
      // Fill comprehensive property data using updated command
      cy.fillPropertyForm(professionalProperty);
      
      // Step 4: Submit analysis
      cy.intercept('POST', '**/deals/analyze').as('analyzeProfessionalProperty');
      cy.submitAnalysis();
      
      // Step 5: Wait for analysis completion
      cy.waitForApiCall('@analyzeProfessionalProperty', 30000);
      cy.waitForAnalysisResults();
      
      // Step 6: Validate professional-level results
      cy.get('body').should('contain', 'Cap Rate');
      cy.get('body').should('contain', 'Cash on Cash');
      cy.get('body').should('contain', 'DSCR');
      
      // Should show detailed financial projections
      cy.get('body').should('contain.text', 'Projection');
      
      // Step 7: Validate all key professional metrics are calculated
      cy.get('body').then(($body) => {
        const text = $body.text();
        
        // Professional should see precise calculations
        expect(text).to.match(/\d+\.\d+%/, 'Should show percentage calculations');
        expect(text).to.match(/\$[\d,]+/, 'Should show dollar amounts');
      });
      
      // Take screenshot for verification
      cy.takeAnalysisScreenshot('pro-mode-complete', {
        propertyPrice: professionalProperty.purchasePrice,
        expectedCashFlow: 1200 // approximate expected value
      });
    });
  });

  describe('Data Accuracy Validation', () => {
    it('should maintain calculation accuracy across all user interactions', () => {
      const testProperty = {
        propertyAddress: {
          street: '789 Accuracy Ave',
          city: 'Austin',
          state: 'TX',
          zipCode: '78706'
        },
        propertyName: 'Accuracy Test Property',
        purchasePrice: 400000,
        downPayment: 80000,
        interestRate: 7.25,
        monthlyRent: 3200,
        propertyTaxes: 8800,
        insurance: 1600
      };
      
      // Fill property data using updated command
      cy.fillPropertyForm(testProperty);
      
      // First analysis
      cy.intercept('POST', '**/deals/analyze').as('firstAnalysis');
      cy.submitAnalysis();
      cy.waitForApiCall('@firstAnalysis', 30000);
      cy.waitForAnalysisResults();
      
      // Capture first set of results
      cy.get('body').then(($firstResults) => {
        const firstText = $firstResults.text();
        
        // Navigate back to input (if needed)
        cy.get('body').then($body => {
          if ($body.find('button:contains("Property Input"), [role="tab"]:contains("Property")').length > 0) {
            cy.get('button:contains("Property Input"), [role="tab"]:contains("Property")').first().click();
          }
        });
        
        // Modify one input slightly
        cy.fillField('monthlyRent', '3300'); // Increase rent by $100
        
        // Re-analyze
        cy.intercept('POST', '**/deals/analyze').as('secondAnalysis');
        cy.submitAnalysis();
        cy.waitForApiCall('@secondAnalysis', 30000);
        cy.waitForAnalysisResults();
        
        // Results should change appropriately
        cy.get('body').then(($secondResults) => {
          const secondText = $secondResults.text();
          
          // Results should be different (higher rent should improve metrics)
          expect(firstText).to.not.equal(secondText, 'Results should change when inputs change');
          
          // Specific validation: higher rent should improve cash flow
          const firstCashFlow = extractNumberFromText(firstText, /cash\s*flow[:\s]*\$?(-?\d+(?:,\d{3})*(?:\.\d{2})?)/i);
          const secondCashFlow = extractNumberFromText(secondText, /cash\s*flow[:\s]*\$?(-?\d+(?:,\d{3})*(?:\.\d{2})?)/i);
          
          if (firstCashFlow !== null && secondCashFlow !== null) {
            expect(secondCashFlow).to.be.greaterThan(firstCashFlow, 
              'Higher rent should result in higher cash flow');
          }
          
          // Take screenshot of final results
          cy.takeAnalysisScreenshot('accuracy-validation-complete');
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid inputs gracefully', () => {
      // Try to analyze without required fields first
      cy.get('body').then($body => {
        // Look for analyze button (might be disabled)
        if ($body.find('button:contains("Analyze Property")').length > 0) {
          cy.get('button:contains("Analyze Property")').then($button => {
            if (!$button.is(':disabled')) {
              $button.click();
            }
          });
        }
      });
      
      // Should show validation errors or remain stable, not crash
      cy.get('body').should('not.contain', 'Error 500');
      cy.get('body').should('not.contain', 'Something went wrong');
      cy.get('#root').should('exist'); // App should still be mounted
      
      // Add invalid data to test validation
      cy.fillField('purchasePrice', '-100000'); // Negative price
      cy.fillField('monthlyRent', 'abc'); // Non-numeric rent
      
      // Try to submit with invalid data
      cy.get('body').then($body => {
        if ($body.find('button:contains("Analyze Property")').length > 0) {
          cy.get('button:contains("Analyze Property")').then($button => {
            if (!$button.is(':disabled')) {
              $button.click();
            }
          });
        }
      });
      
      cy.wait(2000);
      
      // Application should handle gracefully without crashing
      cy.get('#root').should('exist');
      cy.get('body').should('not.contain', 'Uncaught');
      cy.get('body').should('not.contain', 'TypeError');
      
      // Take screenshot of error handling
      cy.takeAnalysisScreenshot('error-handling-test');
    });
    
    it('should handle extremely high and low values', () => {
      const extremeProperty = {
        propertyAddress: {
          street: '999 Extreme Values St',
          city: 'Austin',
          state: 'TX', 
          zipCode: '78707'
        },
        propertyName: 'Extreme Values Test Property',
        purchasePrice: 10000000, // $10M
        monthlyRent: 50000, // $50K/month
        downPayment: 2000000 // $2M
      };
      
      // Fill extreme values using updated command
      cy.fillPropertyForm(extremeProperty);
      
      // Submit analysis
      cy.intercept('POST', '**/deals/analyze').as('extremeAnalysis');
      cy.submitAnalysis();
      
      // Wait for analysis with longer timeout for extreme values
      cy.waitForApiCall('@extremeAnalysis', 45000);
      cy.waitForAnalysisResults(45000);
      
      // Should handle extreme values without crashing or showing errors
      cy.get('body').should('not.contain', 'NaN');
      cy.get('body').should('not.contain', 'Infinity');
      cy.get('body').should('not.contain', 'Error');
      cy.get('#root').should('exist');
      
      // Verify we got some reasonable results
      cy.get('body').should('contain.text', '$');
      cy.get('body').should('contain.text', '%');
      
      // Take screenshot of extreme values handling
      cy.takeAnalysisScreenshot('extreme-values-test', {
        propertyPrice: extremeProperty.purchasePrice,
        monthlyRent: extremeProperty.monthlyRent
      });
    });
  })
})

/**
 * Extract numeric value from text using regex
 */
function extractNumberFromText(text, regex) {
  const match = text.match(regex);
  if (match && match[1]) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return null;
}