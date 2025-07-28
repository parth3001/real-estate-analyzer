/// <reference types="cypress" />

describe('Display Bug Detection - Frontend vs Backend Validation', () => {
  let testProperty;

  before(() => {
    // Property designed to generate AI score around 55
    testProperty = {
      propertyType: "SFR",
      propertyName: "AI Score Test Property",
      propertyAddress: {
        street: "123 Score Test Lane",
        city: "Nashville", 
        state: "TN",
        zipCode: "37203"
      },
      purchasePrice: 300000,
      downPayment: 60000,
      interestRate: 6.0,
      loanTerm: 30,
      propertyTaxRate: 1.0,
      insuranceRate: 0.4,
      propertyManagementRate: 0, // Self-managed for better score
      yearBuilt: 2020,
      monthlyRent: 2800, // Good rent ratio
      squareFootage: 1800,
      bedrooms: 3,
      bathrooms: 2,
      maintenanceCost: 200,
      longTermAssumptions: {
        projectionYears: 30,
        annualRentIncrease: 3.5,
        annualPropertyValueIncrease: 3.5,
        sellingCostsPercentage: 6,
        inflationRate: 2.4,
        vacancyRate: 4.0, // Low vacancy for better score
        turnoverFrequency: 3
      }
    };
  });

  beforeEach(() => {
    // Set up test user
    const userData = {
      email: 'displaytest@example.com',
      password: 'DisplayTest123!',
      firstName: 'Display',
      lastName: 'Tester'
    };

    // Try to register, if user exists, just login
    cy.register(userData).then((response) => {
      // Login regardless of registration result
      cy.login(userData.email, userData.password);
    });

    cy.visit('/');
  });

  describe('AI Score Display Validation', () => {
    it('should detect AI score truncation bug (Backend vs Frontend)', () => {
      // First, get the backend response directly
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/deals/analyze`,
        headers: {
          'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
        },
        body: testProperty
      }).then((backendResponse) => {
        const backendAIScore = backendResponse.body.aiInsights?.investmentScore;
        
        cy.log(`🔍 Backend AI Score: ${backendAIScore} (${typeof backendAIScore})`);
        
        // Now test through the UI
        cy.get('[data-testid="sfr-analysis-link"]').click();
        cy.fillPropertyForm(testProperty);
        cy.submitAnalysis();

        // Get the displayed AI score from frontend
        cy.get('[data-testid="ai-investment-score"]').should('be.visible').then(($scoreElement) => {
          const displayedScore = $scoreElement.text().replace(/[^0-9.-]/g, '');
          const frontendScore = parseFloat(displayedScore);
          
          cy.log(`🖥️  Frontend Displayed Score: ${displayedScore} (parsed: ${frontendScore})`);
          
          // Convert backend score to number for comparison
          let expectedScore;
          if (typeof backendAIScore === 'string') {
            expectedScore = parseFloat(backendAIScore);
          } else {
            expectedScore = backendAIScore;
          }
          
          cy.log(`📊 Comparison: Backend=${expectedScore}, Frontend=${frontendScore}`);
          
          // Detect specific truncation bugs
          if (expectedScore >= 50 && frontendScore < 10) {
            throw new Error(`
🚨 DISPLAY BUG DETECTED: AI Score Truncation!
Backend Score: ${expectedScore}
Frontend Score: ${frontendScore}
Issue: Appears to be truncated (e.g., 55 → 5)
            `);
          }
          
          // Validate scores match within reasonable tolerance
          expect(frontendScore).to.be.closeTo(expectedScore, 2, 
            `AI Score mismatch: Backend=${expectedScore}, Frontend=${frontendScore}`);
          
          // Additional validations
          expect(frontendScore).to.be.greaterThan(0);
          expect(frontendScore).to.be.lessThan(101);
          expect(frontendScore).not.to.be.NaN;
        });

        // Take screenshot for manual verification
        cy.takeFinancialScreenshot('ai-score-validation');
      });
    });

    it('should validate all key metrics display correctly', () => {
      // Get backend response first
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/deals/analyze`,
        headers: {
          'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
        },
        body: testProperty
      }).then((response) => {
        const backend = response.body;
        
        // Now test through UI
        cy.get('[data-testid="sfr-analysis-link"]').click();
        cy.fillPropertyForm(testProperty);
        cy.submitAnalysis();

        // Validate each key metric
        const metricsToCheck = [
          {
            testId: 'cap-rate',
            backendValue: backend.keyMetrics?.capRate,
            label: 'Cap Rate',
            suffix: '%'
          },
          {
            testId: 'cash-on-cash-return', 
            backendValue: backend.keyMetrics?.cashOnCashReturn,
            label: 'Cash-on-Cash Return',
            suffix: '%'
          },
          {
            testId: 'monthly-cash-flow',
            backendValue: backend.monthlyAnalysis?.cashFlow,
            label: 'Monthly Cash Flow',
            prefix: '$'
          },
          {
            testId: 'dscr',
            backendValue: backend.keyMetrics?.debtServiceCoverageRatio,
            label: 'DSCR'
          },
          {
            testId: 'one-percent-rule',
            backendValue: backend.keyMetrics?.onePercentRuleValue,
            label: '1% Rule',
            suffix: '%'
          }
        ];

        metricsToCheck.forEach((metric) => {
          if (metric.backendValue !== undefined && metric.backendValue !== null) {
            cy.get(`[data-testid="${metric.testId}"]`).should('be.visible').then(($el) => {
              let displayText = $el.text();
              
              // Clean up the displayed text to get just the number
              let cleanText = displayText;
              if (metric.prefix) cleanText = cleanText.replace(metric.prefix, '');
              if (metric.suffix) cleanText = cleanText.replace(metric.suffix, '');
              cleanText = cleanText.replace(/[^0-9.-]/g, '');
              
              const frontendValue = parseFloat(cleanText);
              const backendValue = parseFloat(metric.backendValue);
              
              cy.log(`${metric.label}: Backend=${backendValue}, Frontend=${frontendValue}`);
              
              // Check for display bugs
              if (backendValue >= 10 && frontendValue < 1) {
                throw new Error(`
🚨 DISPLAY BUG: ${metric.label} Truncation
Backend: ${backendValue}
Frontend: ${frontendValue}
Original Text: "${displayText}"
                `);
              }
              
              // Validate within tolerance
              expect(frontendValue).to.be.closeTo(backendValue, Math.abs(backendValue * 0.05), 
                `${metric.label} mismatch: Backend=${backendValue}, Frontend=${frontendValue}`);
            });
          }
        });
      });
    });

    it('should detect decimal precision loss', () => {
      // Property with values that should produce decimal results
      const precisionProperty = {
        ...testProperty,
        purchasePrice: 333333.33,
        monthlyRent: 2777.77,
        downPayment: 66666.67
      };

      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/deals/analyze`,
        headers: {
          'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
        },
        body: precisionProperty
      }).then((response) => {
        const backendCapRate = response.body.keyMetrics?.capRate;
        
        cy.get('[data-testid="sfr-analysis-link"]').click();
        cy.fillPropertyForm(precisionProperty);
        cy.submitAnalysis();

        cy.get('[data-testid="cap-rate"]').then(($el) => {
          const displayText = $el.text();
          const frontendCapRate = parseFloat(displayText.replace(/[^0-9.-]/g, ''));
          
          cy.log(`Precision Test - Cap Rate: Backend=${backendCapRate}, Frontend=${frontendCapRate}`);
          
          // Check that we maintain reasonable precision
          if (typeof backendCapRate === 'number' && backendCapRate % 1 !== 0) {
            // Backend has decimals, frontend should too
            expect(frontendCapRate % 1).not.to.equal(0, 
              'Frontend lost decimal precision');
          }
          
          expect(frontendCapRate).to.be.closeTo(backendCapRate, 0.1);
        });
      });
    });
  });

  describe('Mode-Specific Display Testing', () => {
    it('should show different detail levels without display bugs', () => {
      cy.get('[data-testid="sfr-analysis-link"]').click();
      
      // Test in novice mode first
      cy.get('[data-testid="mode-toggle"]').then(($toggle) => {
        if (!$toggle.text().includes('novice')) {
          cy.get('[data-testid="mode-toggle"]').click();
        }
      });

      cy.fillPropertyForm(testProperty);
      cy.submitAnalysis();

      // Capture novice mode display
      cy.get('[data-testid="ai-investment-score"]').then(($noviceScore) => {
        const noviceScoreText = $noviceScore.text();
        
        // Switch to pro mode
        cy.get('[data-testid="mode-toggle"]').click();
        cy.verifyModeToggle('pro');

        // Check that the same score displays in pro mode
        cy.get('[data-testid="ai-investment-score"]').then(($proScore) => {
          const proScoreText = $proScore.text();
          
          cy.log(`Novice Mode Score: ${noviceScoreText}`);
          cy.log(`Pro Mode Score: ${proScoreText}`);
          
          // Core number should be the same, just formatting might differ
          const noviceNum = parseFloat(noviceScoreText.replace(/[^0-9.-]/g, ''));
          const proNum = parseFloat(proScoreText.replace(/[^0-9.-]/g, ''));
          
          expect(noviceNum).to.equal(proNum, 
            'AI Score should be consistent between modes');
        });
      });
    });
  });

  describe('Edge Case Display Testing', () => {
    it('should handle very high and very low values without truncation', () => {
      const extremeProperties = [
        {
          name: 'Very High Value Property',
          data: { ...testProperty, purchasePrice: 2000000, monthlyRent: 8000 }
        },
        {
          name: 'Very Low Value Property', 
          data: { ...testProperty, purchasePrice: 50000, monthlyRent: 800 }
        },
        {
          name: 'High Rent Property',
          data: { ...testProperty, monthlyRent: 15000 }
        }
      ];

      extremeProperties.forEach((property) => {
        cy.log(`Testing ${property.name}`);
        
        cy.visit('/sfr-analysis');
        cy.fillPropertyForm(property.data);
        cy.submitAnalysis();

        // Check that all values display without truncation
        cy.get('[data-testid="analysis-results"]').within(() => {
          cy.get('[data-testid="cap-rate"]').should('be.visible').and('not.be.empty');
          cy.get('[data-testid="monthly-cash-flow"]').should('be.visible').and('not.be.empty');
          cy.get('[data-testid="ai-investment-score"]').should('be.visible').then(($score) => {
            const scoreText = $score.text();
            const score = parseFloat(scoreText.replace(/[^0-9.-]/g, ''));
            
            expect(score).to.be.greaterThan(0);
            expect(score).to.be.lessThan(101);
            expect(score).not.to.be.NaN;
            
            // Log for manual verification
            cy.log(`${property.name} AI Score: ${scoreText} (${score})`);
          });
        });

        cy.takeFinancialScreenshot(`extreme-case-${property.name.replace(/\s+/g, '-')}`);
      });
    });

    it('should handle negative values correctly', () => {
      // Property designed to have negative cash flow
      const negativeProperty = {
        ...testProperty,
        purchasePrice: 500000,
        monthlyRent: 2000, // Low rent for price
        interestRate: 8.0 // High interest rate
      };

      cy.get('[data-testid="sfr-analysis-link"]').click();
      cy.fillPropertyForm(negativeProperty);
      cy.submitAnalysis();

      cy.get('[data-testid="monthly-cash-flow"]').then(($cashFlow) => {
        const cashFlowText = $cashFlow.text();
        cy.log(`Negative Cash Flow Test: ${cashFlowText}`);
        
        // Should show negative sign
        expect(cashFlowText).to.include('-');
        
        const value = parseFloat(cashFlowText.replace(/[^0-9.-]/g, ''));
        expect(value).to.be.lessThan(0);
      });
    });
  });
});