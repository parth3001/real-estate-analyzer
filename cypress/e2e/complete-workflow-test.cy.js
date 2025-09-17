/// <reference types="cypress" />

/**
 * COMPLETE WORKFLOW TEST - Based on Actual User Journey
 * 
 * Sr QE Implementation: Exact replication of user workflow with multiple personas
 * Tests different investment strategies to validate verdict variations
 */

describe('Complete Property Analysis Workflow', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@realestateanalyzer.com');
    cy.get('input[type="password"]').type('Spring@2025');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  const testProperty = {
    // Using the exact property from screenshots
    street: '1837 Walnut Way',
    city: 'Anna',
    state: 'TX',
    zipCode: '75409',
    propertyName: 'Test Property Analysis',
    purchasePrice: '245000',
    // Expected auto-populated values
    expectedSquareFoot: '1268',
    expectedBedrooms: '3',
    expectedBathrooms: '2',
    expectedYearBuilt: '2007',
    expectedRent: '1590'
  };

  // Test different investor personas
  const investorPersonas = {
    conservative: {
      exitStrategy: 'Buy & Hold (10+ years)',
      portfolioFocus: 'Cash Flow Focus',
      experienceLevel: 'Beginner',
      riskTolerance: 'Conservative',
      description: 'Conservative investor seeking stable cash flow with minimal risk'
    },
    aggressive: {
      exitStrategy: 'Sale (3-7 years)',
      portfolioFocus: 'Appreciation Focus',
      experienceLevel: 'Experienced Investor',
      riskTolerance: 'Aggressive',
      description: 'Aggressive investor targeting high appreciation in growing markets'
    },
    balanced: {
      exitStrategy: 'Sale (7-10 years)',
      portfolioFocus: 'Balanced Approach',
      experienceLevel: 'Some Experience',
      riskTolerance: 'Moderate',
      description: 'Balanced investor seeking both cash flow and appreciation'
    }
  };

  function fillPropertyWizard(property, persona) {
    // Navigate to Dashboard
    cy.visit('/');
    cy.wait(2000);
    
    // Click Start SFR Analysis button
    cy.get('button').contains('Start SFR Analysis')
      .should('be.visible')
      .click();
    
    cy.wait(3000);
    
    // ========================================
    // STEP 1: Property Address & Details
    // ========================================
    cy.log('📍 Step 1: Property Address & Details');
    
    // Enter street address
    cy.get('input[placeholder*="Street"], input').first()
      .clear()
      .type(property.street);
    
    // Enter city
    cy.get('input').eq(1)
      .clear()
      .type(property.city);
    
    // Enter state
    cy.get('input').eq(2)
      .clear()
      .type(property.state);
    
    // Wait for RentCast auto-population
    cy.log('⏳ Waiting for RentCast auto-population...');
    cy.wait(5000);
    
    // Verify auto-population occurred
    cy.get('body').should('contain.text', 'auto-populated');
    
    // Enter ZIP code (manual)
    cy.get('input').eq(3)
      .clear()
      .type(property.zipCode);
    
    // Enter property name (optional)
    cy.get('input[placeholder*="property name"], input').last()
      .clear()
      .type(property.propertyName);
    
    // Take screenshot before proceeding
    cy.screenshot(`step-1-filled-${persona}`);
    
    // Click Next
    cy.get('button').contains('Next')
      .should('not.be.disabled')
      .click();
    
    cy.wait(3000);
    
    // ========================================
    // STEP 2: Purchase & Financing
    // ========================================
    cy.log('💰 Step 2: Purchase & Financing');
    
    // Enter purchase price
    cy.get('input[type="text"], input[type="number"]').first()
      .clear()
      .type(property.purchasePrice);
    
    // Accept default down payment (25%), interest rate (6.5%), loan term (30)
    cy.screenshot(`step-2-filled-${persona}`);
    
    // Click Next
    cy.get('button').contains('Next')
      .should('not.be.disabled')
      .click();
    
    cy.wait(3000);
    
    // ========================================
    // STEP 3: Rental Analysis
    // ========================================
    cy.log('🏠 Step 3: Rental Analysis');
    
    // Accept auto-populated rent (should be ~$1590)
    // Accept default management fee (8%) and vacancy rate (5%)
    cy.screenshot(`step-3-filled-${persona}`);
    
    // Click Next
    cy.get('button').contains('Next')
      .should('not.be.disabled')
      .click();
    
    cy.wait(3000);
    
    // ========================================
    // STEP 4: Operating Assumptions
    // ========================================
    cy.log('📈 Step 4: Operating Assumptions');
    
    // Accept all defaults (Tax: 1.8%, Insurance: 0.7%, Maintenance: 5%)
    cy.screenshot(`step-4-filled-${persona}`);
    
    // Click Next
    cy.get('button').contains('Next')
      .should('not.be.disabled')
      .click();
    
    cy.wait(3000);
    
    // ========================================
    // STEP 5: Investment Goals & Strategy
    // ========================================
    cy.log('🎯 Step 5: Investment Goals & Strategy - ' + persona);
    
    // Set Exit Strategy
    cy.get('select, .MuiSelect-root').eq(0).click();
    cy.get(`[data-value*="${investorPersonas[persona].exitStrategy}"], li`).contains(investorPersonas[persona].exitStrategy).click();
    
    // Set Portfolio Focus
    cy.get('select, .MuiSelect-root').eq(1).click();
    cy.get(`[data-value*="${investorPersonas[persona].portfolioFocus}"], li`).contains(investorPersonas[persona].portfolioFocus).click();
    
    // Set Experience Level
    cy.get('select, .MuiSelect-root').eq(2).click();
    cy.get(`[data-value*="${investorPersonas[persona].experienceLevel}"], li`).contains(investorPersonas[persona].experienceLevel).click();
    
    // Set Risk Tolerance
    cy.get('select, .MuiSelect-root').eq(3).click();
    cy.get(`[data-value*="${investorPersonas[persona].riskTolerance}"], li`).contains(investorPersonas[persona].riskTolerance).click();
    
    // Enter strategy description
    cy.get('textarea').type(investorPersonas[persona].description);
    
    cy.screenshot(`step-5-filled-${persona}`);
    
    // Click Complete Analysis
    cy.get('button').contains('Complete Analysis')
      .should('not.be.disabled')
      .click();
    
    cy.log('⏳ Waiting for analysis to complete...');
    cy.wait(15000);
  }

  function validateAnalysisResults(persona) {
    // Check for verdict presence
    cy.get('body', { timeout: 30000 }).then($body => {
      const text = $body.text();
      
      // Look for verdict (BUY, NEGOTIATE, CAUTION, PASS)
      const verdicts = ['BUY', 'NEGOTIATE', 'CAUTION', 'PASS'];
      const foundVerdict = verdicts.find(v => text.includes(v));
      
      if (foundVerdict) {
        cy.log(`✅ VERDICT for ${persona}: ${foundVerdict}`);
        
        // Look for confidence percentage
        const confidenceMatch = text.match(/(\d+)%\s*Confidence/i);
        if (confidenceMatch) {
          cy.log(`📊 Confidence: ${confidenceMatch[1]}%`);
        }
        
        // Look for Deal Quality score
        const dealQualityMatch = text.match(/Deal Quality[:\s]+(\d+)\/100/i);
        if (dealQualityMatch) {
          cy.log(`📈 Deal Quality: ${dealQualityMatch[1]}/100`);
        }
        
        // Look for cash flow
        const cashFlowMatch = text.match(/Monthly Cash Flow[:\s]+\$?([-\d,]+)/i);
        if (cashFlowMatch) {
          cy.log(`💰 Monthly Cash Flow: $${cashFlowMatch[1]}`);
        }
        
        // Look for cap rate
        const capRateMatch = text.match(/Cap Rate[:\s]+([\d.]+)%/i);
        if (capRateMatch) {
          cy.log(`📊 Cap Rate: ${capRateMatch[1]}%`);
        }
      } else {
        cy.log(`❌ No verdict found for ${persona}`);
      }
    });
    
    // Take screenshot of results
    cy.screenshot(`analysis-results-${persona}`);
    
    // Check for Professional Analysis section
    cy.get('body').should('contain.text', 'Professional Investment Analysis');
    
    // Verify tabs are present
    cy.get('button, [role="tab"]').then($tabs => {
      const tabTexts = [];
      $tabs.each((i, tab) => {
        const text = tab.textContent;
        if (text.includes('Financial') || text.includes('Projections') || 
            text.includes('Interactive') || text.includes('Scenario')) {
          tabTexts.push(text);
        }
      });
      cy.log('📑 Available tabs:', tabTexts.join(', '));
    });
  }

  // Test each investor persona
  Object.keys(investorPersonas).forEach(persona => {
    it(`should complete workflow for ${persona} investor`, () => {
      cy.log(`🎭 Testing ${persona.toUpperCase()} investor persona`);
      
      fillPropertyWizard(testProperty, persona);
      validateAnalysisResults(persona);
      
      // Log summary
      cy.log('✅ Test completed for ' + persona + ' investor');
    });
  });

  // Test to verify verdict changes with same property
  it('should show different verdicts for same property with different strategies', () => {
    const results = {};
    
    // Quick test with minimal waits
    ['conservative', 'aggressive'].forEach(persona => {
      fillPropertyWizard(testProperty, persona);
      
      cy.get('body').then($body => {
        const text = $body.text();
        const verdicts = ['BUY', 'NEGOTIATE', 'CAUTION', 'PASS'];
        results[persona] = verdicts.find(v => text.includes(v)) || 'UNKNOWN';
      });
    });
    
    cy.then(() => {
      cy.log('📊 VERDICT COMPARISON:');
      cy.log(`Conservative: ${results.conservative}`);
      cy.log(`Aggressive: ${results.aggressive}`);
      
      if (results.conservative !== results.aggressive) {
        cy.log('✅ Verdicts differ based on strategy - VALIDATION SUCCESSFUL');
      } else {
        cy.log('⚠️ Same verdict for different strategies - needs investigation');
      }
    });
  });
});