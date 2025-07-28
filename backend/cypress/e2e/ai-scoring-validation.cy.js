/// <reference types="cypress" />

/**
 * AI Scoring Logic Validation Tests
 * Tests the critical fix for AI scoring giving high scores to poor investments
 */

describe('AI Scoring Logic Validation', () => {
  let authToken;
  
  before(() => {
    // Create test user and get auth token
    const testUser = {
      email: 'scoring.test@example.com',
      password: 'ScoringTest123!',
      firstName: 'Scoring',
      lastName: 'Tester'
    };
    
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/register`,
      body: testUser,
      failOnStatusCode: false
    }).then(() => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: {
          email: testUser.email,
          password: testUser.password
        }
      }).then((response) => {
        authToken = response.body.token;
        cy.log('✅ Authentication token obtained for AI scoring tests');
      });
    });
  });

  beforeEach(() => {
    cy.task('clearDatabase');
  });

  it('should correctly identify poor investment with negative cash flow, negative returns, and poor DSCR', () => {
    // This is the exact scenario that was giving 55/100 - it should now give much lower
    const poorProperty = {
      propertyName: 'Poor Investment Test Property',
      purchasePrice: 400000,
      downPayment: 80000, // 20% down
      interestRate: 7.25,
      monthlyRent: 2200, // Low rent relative to purchase price
      propertyTaxRate: 1.8, // High property taxes
      insuranceRate: 1.2, // High insurance
      propertyManagementRate: 8, // High management fees
      maintenanceCost: 6000, // High maintenance
      vacancyRate: 8, // High vacancy
      
      // This should result in:
      // - Negative cash flow (~-$247/month)
      // - Negative cash-on-cash return (~-1.23%)
      // - DSCR below 1.0 (~0.82)
    };

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/deals/analyze`,
      body: poorProperty,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('analysis');
      
      const analysis = response.body.analysis;
      
      // Verify the financial metrics are indeed poor
      expect(analysis.monthlyAnalysis.cashFlow).to.be.lessThan(0);
      expect(analysis.keyMetrics.cashOnCashReturn).to.be.lessThan(0);
      expect(analysis.keyMetrics.dscr).to.be.lessThan(1.0);
      
      cy.log(`Cash Flow: $${analysis.monthlyAnalysis.cashFlow.toFixed(0)}/month`);
      cy.log(`Cash-on-Cash Return: ${analysis.keyMetrics.cashOnCashReturn.toFixed(2)}%`);
      cy.log(`DSCR: ${analysis.keyMetrics.dscr.toFixed(2)}`);
      
      // THE CRITICAL TEST: AI investment score should be LOW (≤25) for such poor metrics
      if (analysis.aiInsights && analysis.aiInsights.investmentScore) {
        const aiScore = analysis.aiInsights.investmentScore;
        cy.log(`AI Investment Score: ${aiScore}/100`);
        
        // This is the fix - score should be 25 or lower for triple red flag
        expect(aiScore).to.be.at.most(25, 
          `AI should give low score for negative cash flow (${analysis.monthlyAnalysis.cashFlow.toFixed(0)}), ` +
          `negative returns (${analysis.keyMetrics.cashOnCashReturn.toFixed(2)}%), ` +
          `and poor DSCR (${analysis.keyMetrics.dscr.toFixed(2)})`
        );
        
        // Verify it's not in "Good Investment" category
        expect(aiScore).to.be.lessThan(55, 'Should not be classified as "Good Investment"');
        
        cy.log('✅ AI correctly identified this as a poor investment');
      } else {
        throw new Error('AI insights or investment score not found in response');
      }
      
      // Verify score breakdown includes deal killer analysis
      if (analysis.aiInsights.scoreBreakdown) {
        const breakdown = analysis.aiInsights.scoreBreakdown;
        
        // Cash flow score should be very low
        if (breakdown.cashFlow) {
          expect(breakdown.cashFlow.score).to.be.at.most(25, 'Cash flow score should be low for negative cash flow');
          expect(breakdown.cashFlow.reason).to.include('NEGATIVE', 'Should mention negative cash flow');
        }
        
        // Should have deal killer analysis
        if (breakdown.dealKillers) {
          expect(breakdown.dealKillers.reason).to.include('CRITICAL ISSUES', 'Should identify critical issues');
        }
        
        cy.log('✅ Score breakdown correctly identifies critical issues');
      }
    });
  });

  it('should give reasonable score to actually good investment', () => {
    // Control test - good property should still get good score
    const goodProperty = {
      propertyName: 'Good Investment Test Property',
      purchasePrice: 250000,
      downPayment: 50000, // 20% down
      interestRate: 6.5,
      monthlyRent: 2800, // High rent relative to purchase price
      propertyTaxRate: 1.2, // Reasonable property taxes
      insuranceRate: 0.8, // Reasonable insurance
      propertyManagementRate: 6, // Reasonable management
      maintenanceCost: 2000, // Low maintenance
      vacancyRate: 4, // Low vacancy
    };

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/deals/analyze`,
      body: goodProperty,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }).then((response) => {
      expect(response.status).to.equal(200);
      
      const analysis = response.body.analysis;
      
      // Verify this is actually a good investment
      expect(analysis.monthlyAnalysis.cashFlow).to.be.greaterThan(200);
      expect(analysis.keyMetrics.cashOnCashReturn).to.be.greaterThan(5);
      expect(analysis.keyMetrics.dscr).to.be.greaterThan(1.2);
      
      // Good property should get good score
      if (analysis.aiInsights && analysis.aiInsights.investmentScore) {
        const aiScore = analysis.aiInsights.investmentScore;
        cy.log(`Good Property AI Score: ${aiScore}/100`);
        
        expect(aiScore).to.be.at.least(50, 'Good property should get decent score');
        
        cy.log('✅ AI correctly identified this as a reasonable investment');
      }
    });
  });

  it('should give moderate score to break-even investment', () => {
    // Edge case - break-even property should get moderate score
    const breakEvenProperty = {
      propertyName: 'Break-Even Test Property',
      purchasePrice: 300000,
      downPayment: 60000,
      interestRate: 7.0,
      monthlyRent: 2350, // Just enough to break even
      propertyTaxRate: 1.4,
      insuranceRate: 0.9,
      propertyManagementRate: 7,
      maintenanceCost: 3000,
      vacancyRate: 5,
    };

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/deals/analyze`,
      body: breakEvenProperty,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }).then((response) => {
      expect(response.status).to.equal(200);
      
      const analysis = response.body.analysis;
      
      // Should be roughly break-even
      expect(analysis.monthlyAnalysis.cashFlow).to.be.within(-50, 100);
      
      if (analysis.aiInsights && analysis.aiInsights.investmentScore) {
        const aiScore = analysis.aiInsights.investmentScore;
        cy.log(`Break-Even Property AI Score: ${aiScore}/100`);
        
        // Break-even should get moderate score (40-70 range)
        expect(aiScore).to.be.within(35, 70, 'Break-even property should get moderate score');
        
        cy.log('✅ AI correctly identified this as a moderate investment');
      }
    });
  });
});