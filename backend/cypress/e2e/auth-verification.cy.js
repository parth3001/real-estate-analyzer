/// <reference types="cypress" />

/**
 * CYPRESS AUTHENTICATION VERIFICATION TEST
 * Quick validation that session-based auth fix is working
 */

describe('Auth Verification - Session Fix Validation', () => {
  it('Should maintain auth state across navigation with cy.session()', () => {
    // Test the new session-based authentication
    cy.loginWithSession(
      Cypress.env('TEST_USER_EMAIL'), 
      Cypress.env('TEST_USER_PASSWORD')
    );
    
    // Navigate to different pages and verify auth persists
    cy.visit('/dashboard');
    cy.assertLoggedIn();
    
    cy.visit('/sfr-analysis'); 
    cy.assertLoggedIn();
    
    cy.visit('/pipeline');
    cy.assertLoggedIn();
    
    cy.visit('/portfolio');
    cy.assertLoggedIn();
    
    // Verify user-specific data loads
    cy.visit('/dashboard');
    cy.get('body').should('contain.text', 'Test'); // Should show user data
    
    cy.log('✅ Session-based authentication working correctly');
  });

  it('Should use cached session for faster subsequent logins', () => {
    const startTime = Date.now();
    
    // First login (will create session)
    cy.loginWithSession(
      Cypress.env('TEST_USER_EMAIL'),
      Cypress.env('TEST_USER_PASSWORD')
    );
    
    const firstLoginTime = Date.now() - startTime;
    cy.log(`First login time: ${firstLoginTime}ms`);
    
    // Navigate away and back
    cy.visit('/sfr-analysis');
    cy.visit('/dashboard');
    
    // Second login should use cached session (much faster)
    const secondStartTime = Date.now();
    cy.loginWithSession(
      Cypress.env('TEST_USER_EMAIL'),
      Cypress.env('TEST_USER_PASSWORD')
    );
    
    const secondLoginTime = Date.now() - secondStartTime;
    cy.log(`Second login time: ${secondLoginTime}ms`);
    
    // Session should be faster (cached)
    expect(secondLoginTime).to.be.lessThan(firstLoginTime);
    
    cy.log('✅ Session caching working correctly');
  });

  it('Should handle multiple test users correctly', () => {
    // Test user 1
    cy.loginAsTestUser(1);
    cy.visit('/dashboard');
    cy.assertLoggedIn();
    
    // Clear session and test user 2  
    cy.resetAuthState();
    cy.loginAsTestUser(2);
    cy.visit('/dashboard');
    cy.assertLoggedIn();
    
    // Clear session and test user 3
    cy.resetAuthState();
    cy.loginAsTestUser(3);
    cy.visit('/dashboard');
    cy.assertLoggedIn();
    
    cy.log('✅ Multiple test users working correctly');
  });
});