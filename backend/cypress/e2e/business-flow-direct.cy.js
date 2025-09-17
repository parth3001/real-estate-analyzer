/// <reference types="cypress" />

/**
 * BUSINESS FLOW TEST - Direct URL Approach
 * Senior Test Engineer Solution - Bypass baseUrl issues
 */

describe('Business Flow - Direct Testing', () => {
  beforeEach(() => {
    // Use session-based auth without visiting baseUrl first
    cy.loginWithSession('test@example.com', 'TestPassword123!');
  });

  it('Should complete SFR property analysis flow', () => {
    // Direct visit to SFR analysis page
    cy.visit('http://localhost:3000/sfr-analysis');
    cy.assertLoggedIn();
    
    // Test property data that should work
    const testProperty = {
      purchasePrice: 150000,
      monthlyRent: 1200,
      downPayment: 30000,
      interestRate: 7.0
    };
    
    // Fill form and submit
    cy.fillPropertyForm(testProperty);
    cy.submitAnalysis();
    
    // Validate analysis results appear
    cy.waitForAnalysisResults();
    
    // Check for key analysis components
    cy.get('body').should('contain.text', 'Cash Flow');
    
    // Validate investment verdict exists
    cy.get('body').then($body => {
      const verdicts = ['BUY', 'NEGOTIATE', 'CAUTION', 'PASS'];
      const hasVerdict = verdicts.some(verdict => $body.text().includes(verdict));
      expect(hasVerdict).to.be.true;
    });
    
    cy.log('✅ Business flow working - property analysis complete');
  });

  it('Should handle different property scenarios', () => {
    const scenarios = [
      { name: 'Good Deal', price: 120000, rent: 1200 },
      { name: 'Marginal Deal', price: 180000, rent: 1200 },
      { name: 'Bad Deal', price: 250000, rent: 1200 }
    ];
    
    scenarios.forEach(scenario => {
      cy.visit('http://localhost:3000/sfr-analysis');
      
      cy.fillPropertyForm({
        purchasePrice: scenario.price,
        monthlyRent: scenario.rent,
        downPayment: scenario.price * 0.2
      });
      
      cy.submitAnalysis();
      cy.waitForAnalysisResults();
      
      // Should get some verdict
      cy.get('body').then($body => {
        const verdicts = ['BUY', 'NEGOTIATE', 'CAUTION', 'PASS'];
        const hasVerdict = verdicts.some(verdict => $body.text().includes(verdict));
        expect(hasVerdict).to.be.true;
      });
      
      cy.log(`✅ ${scenario.name} analysis complete`);
    });
  });

  it('Should validate auth persists across page navigation', () => {
    // Test navigation to key pages
    const pages = [
      'http://localhost:3000/sfr-analysis',
      'http://localhost:3000/dashboard'
    ];
    
    pages.forEach(page => {
      cy.visit(page);
      cy.assertLoggedIn();
      cy.log(`✅ Auth working on ${page}`);
    });
  });
});