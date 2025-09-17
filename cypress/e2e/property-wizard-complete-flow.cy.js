/// <reference types="cypress" />

/**
 * PROPERTY WIZARD - COMPLETE E2E FLOW TEST
 * 
 * Sr QE Implementation: Tests the actual 5-step Property Wizard UI
 * including Investment Goals & Strategy step that was missing from API tests
 * 
 * This is the critical test for beta launch - validates the complete
 * user journey through the Property Wizard with real UI interaction.
 */

describe('Property Wizard - Complete 5-Step Flow', () => {
  
  beforeEach(() => {
    // Ensure we start with a clean state
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Navigate to home page
    cy.visit('/');
  });

  describe('🧙‍♂️ Complete Property Wizard Journey', () => {
    
    it('should complete full 5-step wizard with Jersey City property', () => {
      cy.log('🚀 Testing Complete Property Wizard with Jersey City Property');
      
      // Test data - Jersey City property from our validation tests
      const propertyData = {
        address: '16 Belvidere Ave APT 3F, Jersey City, NJ 07304',
        purchasePrice: 255000,
        monthlyRent: 2620  // RentCast estimate from our API tests
      };
      
      const strategyData = {
        exitStrategy: 'flexible',
        portfolioStrategy: 'balanced', 
        riskApproach: 'balanced',
        holdPeriod: 7
      };
      
      // Step 1: Navigate to Property Wizard
      cy.log('📍 Opening Property Wizard');
      cy.openPropertyWizard();
      
      // Step 2: Complete Step 1 - Property Address
      cy.log('🏠 Step 1: Property Address');
      cy.completeWizardStep1(propertyData);
      
      // Validate Step 1 completion - should show data auto-population
      cy.get('[data-cy=wizard-step-1-complete], .step-complete')
        .should('be.visible');
      
      // Step 3: Complete Step 2 - Purchase & Financing  
      cy.log('💰 Step 2: Purchase & Financing');
      cy.completeWizardStep2(propertyData);
      
      // Validate Step 2 completion - should show financing calculations
      cy.get('[data-cy=wizard-step-2-complete], .step-complete')
        .should('be.visible');
      
      // Step 4: Complete Step 3 - Rental Analysis
      cy.log('🏠 Step 3: Rental Analysis');
      cy.completeWizardStep3(propertyData);
      
      // Validate Step 3 completion - should show rent estimates
      cy.get('[data-cy=wizard-step-3-complete], .step-complete')
        .should('be.visible');
      
      // Step 5: Complete Step 4 - Long-term Assumptions
      cy.log('📈 Step 4: Long-term Assumptions');
      cy.completeWizardStep4(propertyData);
      
      // Validate Step 4 completion - should show growth projections
      cy.get('[data-cy=wizard-step-4-complete], .step-complete')
        .should('be.visible');
      
      // Step 6: Complete Step 5 - Investment Goals & Strategy (CRITICAL MISSING STEP)
      cy.log('🎯 Step 5: Investment Goals & Strategy');
      cy.completeWizardStep5(strategyData);
      
      // Step 7: Wait for analysis to complete
      cy.log('⏳ Waiting for analysis completion...');
      
      // Intercept the analysis API call to verify it includes strategy data
      cy.intercept('POST', '**/api/deals/analyze').as('analysisRequest');
      
      // Wait for analysis API call
      cy.wait('@analysisRequest', { timeout: 30000 }).then((interception) => {
        // Validate that strategy data is included in the API call
        expect(interception.request.body).to.have.property('exitStrategy');
        expect(interception.request.body.exitStrategy).to.have.property('portfolioStrategy');
        
        cy.log('✅ Strategy data included in analysis request');
      });
      
      // Step 8: Validate analysis results are displayed
      cy.log('📊 Validating analysis results');
      cy.validateAnalysisResults();
      
      // Step 9: Verify Investment Decision is shown
      cy.get('[data-cy=investment-verdict], .investment-decision')
        .should('be.visible')
        .should('contain.text', /(BUY|NEGOTIATE|CAUTION|PASS)/);
      
      // Step 10: Verify key financial metrics
      cy.get('[data-cy=monthly-cash-flow], .monthly-cash-flow, .cash-flow')
        .should('be.visible')
        .should('contain.text', /\$[\d,.-]+/); // Should contain dollar amount
      
      cy.get('[data-cy=cap-rate], .cap-rate')
        .should('be.visible')
        .should('contain.text', /\d+\.?\d*%/); // Should contain percentage
      
      // Step 11: Verify Investment Goals impact is shown
      cy.get('body').then($body => {
        if ($body.find('[data-cy=strategy-impact], .strategy-analysis, .investment-goals').length) {
          cy.get('[data-cy=strategy-impact], .strategy-analysis, .investment-goals')
            .should('be.visible');
          cy.log('✅ Investment Goals & Strategy impact displayed');
        }
      });
      
      // Step 12: Take comprehensive screenshot for validation
      cy.takeScreenshot('property-wizard-complete-jersey-city', {
        property: propertyData.address,
        price: propertyData.purchasePrice,
        strategy: strategyData.portfolioStrategy
      });
      
      cy.log('🎉 Property Wizard complete flow test PASSED');
    });
    
    it('should complete wizard with Tampa property for comparison', () => {
      cy.log('🚀 Testing Tampa Property (Different Market)');
      
      // Tampa property from our validation tests
      const propertyData = {
        address: '9476 Forest Hills Pl, Tampa, FL 33612',
        purchasePrice: 259000,
        monthlyRent: 2010  // RentCast estimate
      };
      
      const strategyData = {
        exitStrategy: 'sale',
        portfolioStrategy: 'cashflow', 
        riskApproach: 'aggressive',
        holdPeriod: 5
      };
      
      // Complete full wizard flow
      cy.completePropertyWizard(propertyData, strategyData);
      
      // Validate results show different strategy impact
      cy.validateAnalysisResults();
      
      // Take screenshot for comparison
      cy.takeScreenshot('property-wizard-complete-tampa', {
        property: propertyData.address,
        price: propertyData.purchasePrice,
        strategy: strategyData.portfolioStrategy
      });
      
      cy.log('🎉 Tampa property wizard test PASSED');
    });
    
    it('should complete wizard with Anna TX property (conservative strategy)', () => {
      cy.log('🚀 Testing Anna TX Property (Conservative Strategy)');
      
      // Anna TX property from our validation tests  
      const propertyData = {
        address: '1837 Walnut Way, Anna, TX 75409',
        purchasePrice: 255000,
        monthlyRent: 1870  // RentCast estimate
      };
      
      const strategyData = {
        exitStrategy: 'estate',
        portfolioStrategy: 'appreciation', 
        riskApproach: 'conservative',
        holdPeriod: 15
      };
      
      // Complete full wizard flow
      cy.completePropertyWizard(propertyData, strategyData);
      
      // Validate results
      cy.validateAnalysisResults();
      
      // Verify conservative strategy shows different analysis
      cy.get('body').should('contain.text', /(conservative|long.term|estate)/i);
      
      // Take screenshot 
      cy.takeScreenshot('property-wizard-complete-anna-tx', {
        property: propertyData.address,
        price: propertyData.purchasePrice,
        strategy: strategyData.portfolioStrategy
      });
      
      cy.log('🎉 Anna TX conservative strategy test PASSED');
    });
  });
  
  describe('🔍 Property Wizard Validation Tests', () => {
    
    it('should validate all 5 wizard steps are accessible', () => {
      cy.log('🧪 Validating Wizard Step Structure');
      
      cy.openPropertyWizard();
      
      // Verify all 5 steps are present in the wizard
      const expectedSteps = [
        'Property Address',
        'Purchase & Financing', 
        'Rental Analysis',
        'Long-term Assumptions',
        'Investment Goals & Strategy'
      ];
      
      expectedSteps.forEach((stepName, index) => {
        const stepNumber = index + 1;
        cy.get(`[data-cy=wizard-step-${stepNumber}], .wizard-step-${stepNumber}, .step-${stepNumber}`)
          .should('exist');
          
        // Look for step labels/titles
        cy.get('body').should('contain.text', stepName);
      });
      
      cy.log('✅ All 5 wizard steps validated');
    });
    
    it('should show data quality indicator from image', () => {
      cy.log('🎯 Validating Data Quality Indicator');
      
      cy.openPropertyWizard();
      
      // The image shows "0% Data Quality" - verify this indicator exists
      cy.get('[data-cy=data-quality], .data-quality, [class*="data-quality"]')
        .should('be.visible');
      
      // Should show percentage
      cy.get('body').should('contain.text', /\d+%.*[Dd]ata.*[Qq]uality|\d+%.*[Qq]uality/);
      
      cy.log('✅ Data Quality indicator found');
    });
    
    it('should show time estimate from image', () => {
      cy.log('⏱️ Validating Time Estimate');
      
      cy.openPropertyWizard();
      
      // The image shows "~13 min remaining" - verify time estimate exists
      cy.get('[data-cy=time-estimate], .time-estimate, [class*="time"]')
        .should('be.visible');
      
      // Should show time remaining  
      cy.get('body').should('contain.text', /\d+\s*min.*remaining|\d+\s*minutes?.*left/);
      
      cy.log('✅ Time estimate indicator found');
    });
  });
});

/**
 * Property Wizard Error Handling Tests
 */
describe('Property Wizard - Error Handling', () => {
  
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('should handle invalid property address gracefully', () => {
    cy.log('🚨 Testing Invalid Address Handling');
    
    cy.openPropertyWizard();
    
    const invalidData = {
      address: 'Invalid Address 123 Fake Street, Nowhere, XX 00000'
    };
    
    // Try to complete step 1 with invalid address
    cy.get('[data-cy=property-address-input], input[placeholder*="address"]')
      .type(invalidData.address);
    
    cy.get('[data-cy=wizard-next-button], button:contains("Next")')
      .click();
    
    // Should show error or remain on step 1
    cy.get('body').should('contain.text', /(error|invalid|not found)/i);
    
    cy.log('✅ Invalid address handling validated');
  });
  
  it('should validate required fields', () => {
    cy.log('✅ Testing Required Field Validation');
    
    cy.openPropertyWizard();
    
    // Try to proceed without filling required fields
    cy.get('[data-cy=wizard-next-button], button:contains("Next")')
      .click();
    
    // Should remain on current step or show validation error
    cy.get('[data-cy=wizard-step-1], .wizard-step-1')
      .should('be.visible');
    
    cy.log('✅ Required field validation working');
  });
});