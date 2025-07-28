/// <reference types="cypress" />

/**
 * Automatic Metric Validation Test
 * 
 * This test automatically discovers and validates ALL metrics displayed in the UI
 * against backend calculations without hardcoding specific field names.
 * It adapts as metrics are added, removed, or rearranged.
 */

describe('Automatic Backend-Frontend Metric Validation', () => {
  let testProperty;

  before(() => {
    testProperty = {
      propertyType: "SFR",
      propertyName: "Metric Validation Test Property",
      propertyAddress: {
        street: "456 Validation Drive",
        city: "Nashville",
        state: "TN", 
        zipCode: "37204"
      },
      purchasePrice: 375000,
      downPayment: 75000,
      interestRate: 6.75,
      loanTerm: 30,
      propertyTaxRate: 1.15,
      insuranceRate: 0.45,
      propertyManagementRate: 8,
      yearBuilt: 2018,
      monthlyRent: 2650,
      squareFootage: 1950,
      bedrooms: 3,
      bathrooms: 2.5,
      maintenanceCost: 265,
      longTermAssumptions: {
        projectionYears: 30,
        annualRentIncrease: 3.0,
        annualPropertyValueIncrease: 3.0,
        sellingCostsPercentage: 6,
        inflationRate: 2.5,
        vacancyRate: 5.0,
        turnoverFrequency: 2.5
      }
    };
  });

  beforeEach(() => {
    const userData = {
      email: 'autotest@example.com',
      password: 'AutoTest123!',
      firstName: 'Auto',
      lastName: 'Tester'
    };

    cy.register(userData).then(() => {
      cy.login(userData.email, userData.password);
    });

    cy.visit('/');
  });

  it('should automatically validate all displayed metrics against backend values', () => {
    // First get the backend response
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/deals/analyze`,
      headers: {
        'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
      },
      body: testProperty
    }).then((backendResponse) => {
      const backendData = backendResponse.body;
      
      // Log backend structure for debugging
      cy.log('📊 Backend Data Structure:');
      console.log(JSON.stringify(backendData, null, 2));

      // Navigate to analysis page
      cy.get('[data-testid="sfr-analysis-link"]').click();
      cy.fillPropertyForm(testProperty);
      cy.submitAnalysis();

      // Wait for results to load
      cy.get('[data-testid="analysis-results"]').should('be.visible');

      // Automatically find all displayed metrics
      cy.get('[data-testid*="-metric"], [data-testid*="-value"], [data-testid*="-score"], [data-testid*="-rate"], [data-testid*="-return"], [data-testid*="-flow"], [data-testid*="-ratio"]')
        .each(($element) => {
          const testId = $element.attr('data-testid');
          const displayedText = $element.text().trim();
          
          // Skip empty elements
          if (!displayedText || displayedText === '-' || displayedText === 'N/A') {
            return;
          }

          // Extract numeric value from displayed text
          const numericPattern = /-?\d+\.?\d*/;
          const match = displayedText.match(numericPattern);
          
          if (match) {
            const displayedValue = parseFloat(match[0]);
            cy.log(`Found metric: ${testId} = ${displayedValue} (from "${displayedText}")`);

            // Try to find corresponding backend value
            const backendValue = findBackendValue(backendData, testId);
            
            if (backendValue !== null) {
              // Validate the values match
              validateMetricMatch(testId, backendValue, displayedValue, displayedText);
            }
          }
        });

      // Also validate specific high-risk areas
      validateCriticalMetrics(backendData);
    });
  });

  it('should detect value truncation in any numeric field', () => {
    // Test with values that should produce 2+ digit results
    const truncationTestProperty = {
      ...testProperty,
      monthlyRent: 5500, // Should produce higher scores/metrics
      purchasePrice: 275000 // Better ratio
    };

    cy.request({
      method: 'POST', 
      url: `${Cypress.env('apiUrl')}/deals/analyze`,
      headers: {
        'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
      },
      body: truncationTestProperty
    }).then((response) => {
      const backendData = response.body;
      
      cy.get('[data-testid="sfr-analysis-link"]').click();
      cy.fillPropertyForm(truncationTestProperty);
      cy.submitAnalysis();

      // Check all numeric displays
      cy.get('[data-testid="analysis-results"]').within(() => {
        // Find all elements that display numbers
        cy.get('*').each(($el) => {
          const text = $el.text().trim();
          const testId = $el.attr('data-testid') || 'unknown';
          
          // Look for patterns that suggest truncation
          if (/^\d$/.test(text)) { // Single digit
            // Check if this corresponds to a backend value > 10
            const backendValue = findBackendValue(backendData, testId);
            
            if (backendValue && backendValue >= 10) {
              throw new Error(`
🚨 TRUNCATION DETECTED: ${testId}
Backend: ${backendValue}
Frontend: ${text}
              `);
            }
          }
        });
      });
    });
  });

  it('should validate data consistency across different UI modes', () => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/deals/analyze`,
      headers: {
        'Authorization': `Bearer ${window.localStorage.getItem('authToken')}`
      },
      body: testProperty
    }).then((response) => {
      const backendData = response.body;
      const metricsInNovice = {};
      const metricsInPro = {};

      // Test in novice mode
      cy.get('[data-testid="sfr-analysis-link"]').click();
      
      // Ensure novice mode
      cy.get('[data-testid="mode-toggle"]').then(($toggle) => {
        if (!$toggle.text().includes('novice')) {
          cy.get('[data-testid="mode-toggle"]').click();
        }
      });

      cy.fillPropertyForm(testProperty);
      cy.submitAnalysis();

      // Capture all metrics in novice mode
      captureAllMetrics().then((noviceMetrics) => {
        Object.assign(metricsInNovice, noviceMetrics);
        
        // Switch to pro mode
        cy.get('[data-testid="mode-toggle"]').click();
        
        // Capture all metrics in pro mode
        captureAllMetrics().then((proMetrics) => {
          Object.assign(metricsInPro, proMetrics);
          
          // Compare core metrics between modes
          Object.keys(metricsInNovice).forEach(metricKey => {
            if (metricsInPro[metricKey] !== undefined) {
              const noviceValue = parseFloat(metricsInNovice[metricKey]);
              const proValue = parseFloat(metricsInPro[metricKey]);
              
              if (!isNaN(noviceValue) && !isNaN(proValue)) {
                expect(noviceValue).to.be.closeTo(proValue, 0.01,
                  `Metric ${metricKey} differs between modes: Novice=${noviceValue}, Pro=${proValue}`
                );
              }
            }
          });
          
          // Validate against backend
          Object.keys(metricsInPro).forEach(metricKey => {
            const backendValue = findBackendValue(backendData, metricKey);
            if (backendValue !== null) {
              const displayedValue = parseFloat(metricsInPro[metricKey]);
              validateMetricMatch(metricKey, backendValue, displayedValue, metricsInPro[metricKey]);
            }
          });
        });
      });
    });
  });
});

// Helper function to find backend value based on testId
function findBackendValue(backendData, testId) {
  // Map common test IDs to backend paths
  const mappings = {
    'cap-rate': 'keyMetrics.capRate',
    'cash-on-cash-return': 'keyMetrics.cashOnCashReturn',
    'monthly-cash-flow': 'monthlyAnalysis.cashFlow',
    'dscr': 'keyMetrics.debtServiceCoverageRatio',
    'debt-service-coverage-ratio': 'keyMetrics.debtServiceCoverageRatio',
    'one-percent-rule': 'keyMetrics.onePercentRuleValue',
    'ai-investment-score': 'aiInsights.investmentScore',
    'ai-score': 'aiInsights.investmentScore',
    'monthly-noi': 'monthlyAnalysis.income.effective',
    'annual-noi': 'annualAnalysis.annualNOI',
    'gross-rent-multiplier': 'keyMetrics.grossRentMultiplier',
    'operating-expense-ratio': 'keyMetrics.operatingExpenseRatio',
    'price-per-sqft': 'keyMetrics.pricePerSquareFoot',
    'rent-to-value': 'keyMetrics.rentToValueRatio',
    'break-even-occupancy': 'keyMetrics.breakEvenOccupancy'
  };

  // Try direct mapping first
  const path = mappings[testId];
  if (path) {
    return getNestedValue(backendData, path);
  }

  // Try to find by partial match
  const searchKey = testId.replace(/-/g, '').toLowerCase();
  return searchInObject(backendData, searchKey);
}

// Helper to get nested values
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

// Helper to search for values in object
function searchInObject(obj, searchKey, visited = new Set()) {
  if (!obj || visited.has(obj)) return null;
  visited.add(obj);

  for (const key in obj) {
    const cleanKey = key.toLowerCase().replace(/[_\s]/g, '');
    if (cleanKey.includes(searchKey) || searchKey.includes(cleanKey)) {
      if (typeof obj[key] === 'number' || typeof obj[key] === 'string') {
        return obj[key];
      }
    }
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const found = searchInObject(obj[key], searchKey, visited);
      if (found !== null) return found;
    }
  }
  
  return null;
}

// Helper to validate metric matches
function validateMetricMatch(metricName, backendValue, frontendValue, originalText) {
  cy.log(`Validating ${metricName}: Backend=${backendValue}, Frontend=${frontendValue}`);
  
  // Handle different data types
  let expectedValue = backendValue;
  if (typeof backendValue === 'string') {
    expectedValue = parseFloat(backendValue);
  }
  
  // Check for truncation bug
  if (expectedValue >= 10 && frontendValue < 10 && originalText.length <= 2) {
    throw new Error(`
🚨 TRUNCATION BUG DETECTED: ${metricName}
Backend: ${expectedValue}
Frontend: ${frontendValue} (displayed as "${originalText}")
    `);
  }
  
  // Allow for reasonable tolerance (2% or 0.5, whichever is larger)
  const tolerance = Math.max(Math.abs(expectedValue * 0.02), 0.5);
  
  expect(frontendValue).to.be.closeTo(expectedValue, tolerance,
    `${metricName} mismatch: Backend=${expectedValue}, Frontend=${frontendValue}`
  );
}

// Helper to capture all displayed metrics
function captureAllMetrics() {
  const metrics = {};
  
  return cy.get('[data-testid]').then(($elements) => {
    $elements.each((index, element) => {
      const $el = Cypress.$(element);
      const testId = $el.attr('data-testid');
      const text = $el.text().trim();
      
      if (testId && text && /\d/.test(text)) {
        metrics[testId] = text;
      }
    });
    
    return metrics;
  });
}

// Helper to validate critical metrics
function validateCriticalMetrics(backendData) {
  // AI Score specific validation
  if (backendData.aiInsights?.investmentScore) {
    cy.get('[data-testid*="score"], [data-testid*="Score"]').each(($el) => {
      const text = $el.text();
      const testId = $el.attr('data-testid');
      
      if (testId && testId.toLowerCase().includes('ai') && testId.toLowerCase().includes('score')) {
        const displayedScore = parseFloat(text.replace(/[^0-9.-]/g, ''));
        const backendScore = parseFloat(backendData.aiInsights.investmentScore);
        
        cy.log(`🎯 AI Score Validation: Backend=${backendScore}, Frontend=${displayedScore}`);
        
        // Specific check for the reported bug
        if (backendScore >= 50 && displayedScore < 10) {
          throw new Error(`
🚨 AI SCORE BUG CONFIRMED: Score showing as ${displayedScore} instead of ${backendScore}
          `);
        }
        
        expect(displayedScore).to.be.closeTo(backendScore, 2);
      }
    });
  }
}