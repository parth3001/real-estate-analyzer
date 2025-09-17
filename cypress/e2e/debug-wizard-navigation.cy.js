/// <reference types="cypress" />

/**
 * DEBUG WIZARD NAVIGATION
 * 
 * Sr QE Debug: See exactly what happens after clicking Start SFR Analysis
 */

describe('Debug Wizard Navigation', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@realestateanalyzer.com');
    cy.get('input[type="password"]').type('Spring@2025');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });
  
  it('should debug what happens after clicking Start SFR Analysis', () => {
    cy.log('🔍 Debugging wizard navigation flow');
    
    // Navigate to SFR page
    cy.visit('/sfr');
    cy.wait(3000);
    
    // Take screenshot before clicking
    cy.screenshot('before-start-sfr-analysis');
    
    // Click Start SFR Analysis button
    cy.get('button:contains("Start SFR Analysis")')
      .should('be.visible')
      .click();
    
    // Wait for any navigation/loading
    cy.wait(5000);
    
    // Take screenshot after clicking
    cy.screenshot('after-start-sfr-analysis');
    
    // Log current URL
    cy.url().then(url => {
      cy.log(`Current URL after clicking: ${url}`);
    });
    
    // Check what elements are visible on the page
    cy.get('body').then($body => {
      const bodyText = $body.text();
      cy.log(`Page contains: ${bodyText.substring(0, 200)}...`);
      
      // Look for any wizard-related text
      if (bodyText.includes('wizard') || bodyText.includes('Wizard')) {
        cy.log('✅ Found wizard-related text on page');
      }
      
      if (bodyText.includes('step') || bodyText.includes('Step')) {
        cy.log('✅ Found step-related text on page');
      }
      
      if (bodyText.includes('address') || bodyText.includes('Address')) {
        cy.log('✅ Found address-related text on page');
      }
    });
    
    // Try to find any form inputs
    cy.get('input').then($inputs => {
      cy.log(`Found ${$inputs.length} input fields on page`);
      $inputs.each((index, input) => {
        const placeholder = input.placeholder || '';
        const type = input.type || '';
        const name = input.name || '';
        cy.log(`Input ${index}: type=${type}, placeholder="${placeholder}", name="${name}"`);
      });
    });
    
    // Try to find any buttons
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons on page`);
      $buttons.each((index, button) => {
        const text = button.textContent || '';
        cy.log(`Button ${index}: "${text}"`);
      });
    });
    
    cy.log('🔍 Debug navigation completed');
  });
});