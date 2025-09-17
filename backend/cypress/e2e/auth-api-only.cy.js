/// <reference types="cypress" />

/**
 * SIMPLE AUTH API TEST - No Frontend Required
 * Just test the authentication commands work
 */

describe('Auth API Test - Backend Only', () => {
  it('Should authenticate with session caching (API only)', () => {
    // Test the session-based login command
    cy.loginWithSession(
      'test@example.com', 
      'TestPassword123!'
    );
    
    // Verify localStorage was set (no page visit required)
    cy.window().then((win) => {
      expect(win.localStorage.getItem('authToken')).to.exist;
      expect(win.localStorage.getItem('user')).to.exist;
    });
    
    cy.log('✅ Session-based authentication working');
  });

  it('Should validate auth state', () => {
    // Login first
    cy.loginWithSession('test@example.com', 'TestPassword123!');
    
    // Test the assertLoggedIn command
    cy.assertLoggedIn();
    
    cy.log('✅ Auth state validation working');
  });

  it('Should logout properly', () => {
    // Login first
    cy.loginWithSession('test@example.com', 'TestPassword123!');
    cy.assertLoggedIn();
    
    // Test logout
    cy.logout();
    
    // Should be cleared
    cy.window().then((win) => {
      expect(win.localStorage.getItem('authToken')).to.be.null;
      expect(win.localStorage.getItem('user')).to.be.null;
    });
    
    cy.log('✅ Logout working correctly');
  });
});