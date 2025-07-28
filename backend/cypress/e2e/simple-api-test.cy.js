/// <reference types="cypress" />

/**
 * Simple API-focused E2E Tests
 * Bypasses UI complexity while validating core functionality
 */

describe('Real Estate Analysis API Tests', () => {
  let authToken;
  
  before(() => {
    // Create test user and get auth token
    const testUser = {
      email: 'api.test@example.com',
      password: 'ApiTest123!',
      firstName: 'API',
      lastName: 'Tester'
    };
    
    // Register user first
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/register`,
      body: testUser,
      failOnStatusCode: false
    }).then(() => {
      // Login to get token
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: {
          email: testUser.email,
          password: testUser.password
        }
      }).then((response) => {
        authToken = response.body.token;
        cy.log('✅ Authentication token obtained');
      });
    });
  });
  
  beforeEach(() => {
    cy.task('clearDatabase');
  });

  it('should analyze property via API successfully', () => {
    // Test the core analysis API directly
    const propertyData = {
      purchasePrice: 400000,
      monthlyRent: 2800,
      downPayment: 80000,
      interestRate: 6.5,
      propertyName: 'API Test Property'
    };

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/deals/analyze`,
      body: propertyData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    }).then((response) => {
      // Verify successful response
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('analysis');
      
      // Verify key financial metrics exist
      const analysis = response.body.analysis;
      expect(analysis).to.have.property('monthlyAnalysis');
      expect(analysis).to.have.property('keyMetrics');
      
      // Verify no truncation bugs (the original issue we fixed)
      if (analysis.aiInsights && analysis.aiInsights.investmentScore) {
        expect(analysis.aiInsights.investmentScore).to.be.within(0, 100);
        expect(analysis.aiInsights.investmentScore).to.be.greaterThan(10); // Not truncated
      }
      
      cy.log('✅ API analysis completed successfully');
      cy.log(`Investment Score: ${analysis.aiInsights?.investmentScore || 'N/A'}`);
    });
  });

  it('should handle invalid data gracefully', () => {
    const invalidData = {
      purchasePrice: -100000, // Invalid negative price
      monthlyRent: 'invalid'   // Invalid string for number
    };

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/deals/analyze`,
      body: invalidData,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      failOnStatusCode: false
    }).then((response) => {
      // Should handle gracefully with validation error
      expect(response.status).to.be.oneOf([400, 422]); // Bad request or validation error
      cy.log('✅ Invalid data handled gracefully');
    });
  });

  it('should return consistent results for same input', () => {
    const propertyData = {
      purchasePrice: 500000,
      monthlyRent: 3500,
      downPayment: 100000,
      interestRate: 7.0
    };

    // First analysis
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/deals/analyze`,
      body: propertyData,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }).then((firstResponse) => {
        const firstAnalysis = firstResponse.body.analysis;
        
        // Second analysis with same data
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/deals/analyze`,
          body: propertyData,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }).then((secondResponse) => {
            const secondAnalysis = secondResponse.body.analysis;
            
            // Results should be consistent
            expect(firstAnalysis.keyMetrics.capRate)
              .to.equal(secondAnalysis.keyMetrics.capRate);
            expect(firstAnalysis.monthlyAnalysis.cashFlow)
              .to.equal(secondAnalysis.monthlyAnalysis.cashFlow);
              
            cy.log('✅ Consistent results verified');
          });
      });
  });
});