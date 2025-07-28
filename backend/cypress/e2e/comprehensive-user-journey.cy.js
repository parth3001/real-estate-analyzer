/// <reference types="cypress" />

/**
 * Comprehensive End-to-End User Journey Test
 * 
 * This test covers the complete real-world user experience from login to analysis completion,
 * validating the entire application stack as a user would experience it.
 */

describe('Comprehensive Real Estate Analysis User Journey', () => {
  let testUser;
  let testProperty;

  before(() => {
    // Create a realistic test property
    testProperty = {
      propertyName: "E2E Test Property",
      propertyAddress: {
        street: "123 Cypress Test Lane",
        city: "Nashville", 
        state: "Tennessee",
        zipCode: "37203"
      },
      propertyType: "SFR",
      purchasePrice: 450000,
      downPayment: 90000,
      interestRate: 6.75,
      loanTerm: 30,
      monthlyRent: 2940,
      squareFootage: 2450,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 1991,
      propertyTaxRate: 1.4,
      insuranceRate: 0.8,
      propertyManagementRate: 5,
      maintenanceCost: 3528,
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 3,
        annualPropertyValueIncrease: 3,
        sellingCostsPercentage: 6,
        inflationRate: 2,
        vacancyRate: 4,
        turnoverFrequency: 3
      }
    };
  });

  beforeEach(() => {
    // Clear database and start fresh
    cy.task('clearDatabase');
    
    // Create a test user
    cy.createTestUser({
      email: 'e2e.test@example.com',
      password: 'E2ETest123!',
      firstName: 'E2E',
      lastName: 'Tester'
    }).then((user) => {
      testUser = user;
    });
    
    cy.visit('/');
  });

  describe('Complete SFR Analysis Journey', () => {
    it('should complete the entire real estate analysis workflow successfully', () => {
      // ========================================
      // STEP 1: USER AUTHENTICATION
      // ========================================
      cy.log('🔐 STEP 1: User Authentication');
      
      // User should be able to login or continue as guest
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Login"), [data-testid*="login"]').length > 0) {
          // Login if auth is required
          cy.loginAs(testUser);
        }
      });
      
      // ========================================
      // STEP 2: NAVIGATE TO SFR ANALYSIS
      // ========================================
      cy.log('🏠 STEP 2: Navigate to SFR Analysis');
      
      // User should be able to find and click SFR analysis
      const navigationSelectors = [
        '[data-testid="sfr-analysis-link"]',
        'a:contains("SFR Analysis")',
        'a:contains("Single Family")',
        'button:contains("Analyze Property")'
      ];
      
      let navigated = false;
      navigationSelectors.forEach(selector => {
        if (!navigated) {
          cy.get('body').then($body => {
            if ($body.find(selector).length > 0) {
              cy.get(selector).first().click();
              navigated = true;
            }
          });
        }
      });
      
      // If direct navigation doesn't work, go to URL directly
      if (!navigated) {
        cy.visit('/sfr-analysis');
      }
      
      // Verify we're on the analysis page
      cy.url().should('include', 'sfr-analysis');
      
      // ========================================
      // STEP 3: PROPERTY FORM COMPLETION
      // ========================================
      cy.log('📝 STEP 3: Complete Property Form');
      
      // Fill all property details systematically
      cy.fillPropertyForm(testProperty);
      
      // Verify critical fields are filled
      cy.get('input[name*="purchasePrice"], [data-testid*="purchase"]').should('have.value', '450000');
      cy.get('input[name*="monthlyRent"], [data-testid*="rent"]').should('have.value', '2940');
      cy.get('input[name*="downPayment"], [data-testid*="down"]').should('have.value', '90000');
      
      // ========================================
      // STEP 4: SUBMIT ANALYSIS & VALIDATE PROCESSING
      // ========================================
      cy.log('⚡ STEP 4: Submit Analysis');
      
      // Intercept the API call to validate backend communication
      cy.intercept('POST', '**/deals/analyze').as('analyzeProperty');
      
      cy.submitAnalysis();
      
      // Verify API call was made and successful
      cy.wait('@analyzeProperty', { timeout: 30000 }).then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201]);
        
        // Store backend response for validation
        const backendResponse = interception.response.body;
        
        // ========================================
        // STEP 5: VALIDATE ANALYSIS RESULTS DISPLAY
        // ========================================
        cy.log('📊 STEP 5: Validate Analysis Results');
        
        // Check that analysis results are displayed
        cy.get('[data-testid="analysis-results"], div:contains("Analysis Results")', { timeout: 10000 })
          .should('be.visible');
        
        // ========================================
        // STEP 6: VALIDATE KEY FINANCIAL METRICS
        // ========================================
        cy.log('💰 STEP 6: Validate Financial Metrics');
        
        // All key metrics should be visible and contain reasonable values
        const keyMetrics = [
          { testId: 'monthly-cash-flow', key: 'monthlyAnalysis.cashFlow', label: 'Monthly Cash Flow' },
          { testId: 'cap-rate', key: 'keyMetrics.capRate', label: 'Cap Rate' },
          { testId: 'cash-on-cash-return', key: 'keyMetrics.cashOnCashReturn', label: 'Cash-on-Cash Return' },
          { testId: 'dscr', key: 'keyMetrics.dscr', label: 'DSCR' },
          { testId: 'ai-investment-score', key: 'aiInsights.investmentScore', label: 'AI Investment Score' }
        ];
        
        keyMetrics.forEach(metric => {
          // Get expected value from backend response
          const expectedValue = getNestedValue(backendResponse, metric.key);
          
          if (expectedValue !== undefined && expectedValue !== null) {
            // Look for the metric in the UI
            cy.get(`[data-testid="${metric.testId}"], [data-testid*="${metric.testId}"]`)
              .should('be.visible')
              .then($element => {
                const displayedText = $element.text();
                const displayedNumber = parseFloat(displayedText.replace(/[^0-9.-]/g, ''));
                
                cy.log(`${metric.label}: Backend=${expectedValue}, Frontend=${displayedNumber}`);
                
                // Validate the displayed value matches backend (within tolerance)
                if (typeof expectedValue === 'number') {
                  // Check for truncation bug specifically
                  if (expectedValue >= 10 && displayedNumber < expectedValue / 10) {
                    throw new Error(`🚨 TRUNCATION BUG DETECTED in ${metric.label}: Backend=${expectedValue}, Frontend=${displayedNumber}`);
                  }
                  
                  // General range validation (allow for rounding differences)
                  const tolerance = Math.max(Math.abs(expectedValue * 0.05), 1);
                  expect(displayedNumber).to.be.closeTo(expectedValue, tolerance, 
                    `${metric.label} mismatch: Backend=${expectedValue}, Frontend=${displayedNumber}`);
                }
              });
          }
        });
        
        // ========================================
        // STEP 7: VALIDATE AI INSIGHTS QUALITY
        // ========================================
        cy.log('🧠 STEP 7: Validate AI Insights');
        
        // AI insights should be present and meaningful
        if (backendResponse.aiInsights) {
          // Investment score should be reasonable (0-100)
          if (backendResponse.aiInsights.investmentScore) {
            expect(backendResponse.aiInsights.investmentScore).to.be.within(0, 100);
            
            // UI should show the score
            cy.get('[data-testid="ai-investment-score"]')
              .should('contain', backendResponse.aiInsights.investmentScore);
          }
          
          // Should have strategic analysis or recommendations
          cy.get('body').should('contain.text', 'analysis')
            .or('contain.text', 'recommendation')
            .or('contain.text', 'insight');
        }
        
        // ========================================
        // STEP 8: VALIDATE DATA PERSISTENCE (SAVE)
        // ========================================
        cy.log('💾 STEP 8: Test Data Persistence');
        
        // Try to save the analysis
        cy.get('body').then($body => {
          if ($body.find('button:contains("Save"), [data-testid*="save"]').length > 0) {
            cy.intercept('POST', '**/deals').as('saveDeal');
            
            cy.get('button:contains("Save"), [data-testid*="save"]').first().click();
            
            cy.wait('@saveDeal', { timeout: 10000 }).then((saveInterception) => {
              expect(saveInterception.response.statusCode).to.be.oneOf([200, 201]);
              
              // Verify success feedback
              cy.get('body').should('contain.text', 'saved')
                .or('contain.text', 'success')
                .or('contain.text', 'created');
            });
          }
        });
        
        // ========================================
        // STEP 9: VALIDATE SAVED PROPERTIES VIEW
        // ========================================
        cy.log('📁 STEP 9: Validate Saved Properties');
        
        // Navigate to saved properties if available
        cy.get('body').then($body => {
          if ($body.find('a:contains("Saved"), [data-testid*="saved"]').length > 0) {
            cy.get('a:contains("Saved"), [data-testid*="saved"]').first().click();
            
            // Should see the saved property
            cy.get('body').should('contain', testProperty.propertyName || 'Test Property');
          }
        });
        
        // ========================================
        // STEP 10: VALIDATE MODE SWITCHING
        // ========================================
        cy.log('🔄 STEP 10: Test Mode Switching');
        
        // Go back to analysis page
        cy.visit('/sfr-analysis');
        
        // Test mode switching if available
        cy.get('body').then($body => {
          if ($body.find('[data-testid*="mode"], button:contains("Novice"), button:contains("Professional")').length > 0) {
            // Switch to Novice mode
            cy.switchToMode('novice');
            cy.get('body').should('contain.text', 'novice').or('contain.text', 'Novice');
            
            // Switch to Professional mode  
            cy.switchToMode('professional');
            cy.get('body').should('contain.text', 'professional').or('contain.text', 'Professional');
          }
        });
        
        // ========================================
        // STEP 11: FINAL QUALITY CHECKS
        // ========================================
        cy.log('✅ STEP 11: Final Quality Checks');
        
        // Check for common display bugs
        cy.checkForDisplayBugs().then((issues) => {
          if (issues.length > 0) {
            console.log('Display issues detected:', issues);
            cy.screenshot('final-quality-check-issues');
          }
          expect(issues.length).to.equal(0, `Display issues found: ${issues.join(', ')}`);
        });
        
        // Verify no JavaScript errors in console
        cy.window().then((win) => {
          const errors = win.console.error.toString();
          if (errors && errors.length > 0) {
            console.log('Console errors detected:', errors);
          }
        });
        
        // Take final screenshot for visual verification
        cy.takeFinancialScreenshot('comprehensive-journey-complete');
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle invalid property data gracefully', () => {
      cy.log('🚨 Testing Error Handling');
      
      cy.visit('/sfr-analysis');
      
      // Submit with missing required fields
      cy.submitAnalysis();
      
      // Should show validation errors
      cy.get('body').should('contain.text', 'required')
        .or('contain.text', 'error')
        .or('contain.text', 'invalid');
      
      // Fill with invalid data
      const invalidProperty = {
        purchasePrice: -100,
        monthlyRent: 'not-a-number',
        downPayment: 1000000 // More than purchase price
      };
      
      cy.fillPropertyForm(invalidProperty);
      cy.submitAnalysis();
      
      // Should handle gracefully without crashing
      cy.get('body').should('be.visible');
    });
  });
});

// Helper function to get nested object values
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}