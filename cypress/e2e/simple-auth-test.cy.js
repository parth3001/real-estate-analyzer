/// <reference types="cypress" />

/**
 * SIMPLE AUTHENTICATION TEST
 * 
 * Sr QE Debug: Test authentication with admin credentials
 */

describe('Simple Authentication Test', () => {
  
  it('should login with admin credentials', () => {
    cy.log('🧪 Testing authentication with admin credentials');
    
    // Navigate directly to login
    cy.visit('/login');
    
    // Wait for page to load
    cy.wait(2000);
    
    // Take screenshot of login page
    cy.screenshot('login-page');
    
    // Fill in admin credentials
    cy.get('input[type="email"]')
      .should('be.visible')
      .type('admin@realestateanalyzer.com');
      
    cy.get('input[type="password"]')
      .should('be.visible')
      .type('Spring@2025');
      
    // Submit login
    cy.get('button[type="submit"]')
      .should('be.visible')
      .should('not.be.disabled')
      .click();
      
    // Check for successful login
    cy.url().should('not.include', '/login');
    
    // Take screenshot after login
    cy.screenshot('after-login');
    
    cy.log('✅ Authentication test completed');
  });
  
  it('should navigate to SFR analysis page', () => {
    // Login first
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@realestateanalyzer.com');
    cy.get('input[type="password"]').type('Spring@2025');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
    
    // Navigate to SFR page
    cy.visit('/sfr');
    cy.wait(3000);
    
    // Take screenshot of SFR page
    cy.screenshot('sfr-page');
    
    // Check for any wizard-related elements
    cy.get('body').then($body => {
      if ($body.find('[data-cy=property-wizard], .property-wizard, [data-cy=wizard-step-1], .wizard-step-1').length) {
        cy.log('✅ Property Wizard found on SFR page');
      } else {
        cy.log('⚠️ Property Wizard not immediately visible - checking for mode buttons');
        
        // Look for wizard/manual toggle buttons
        if ($body.find('button:contains("Wizard"), button:contains("Property Wizard")').length) {
          cy.get('button:contains("Wizard"), button:contains("Property Wizard")').first().click();
          cy.wait(2000);
          cy.log('✅ Clicked wizard mode button');
        }
      }
    });
    
    cy.log('✅ SFR page navigation test completed');
  });
});