/// <reference types="cypress" />

/**
 * DEBUG TEST: Capture actual field selectors from Property Wizard
 * Purpose: Understand the real DOM structure and field names
 */

describe('Debug Property Wizard Field Selectors', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@realestateanalyzer.com');
    cy.get('input[type="password"]').type('Spring@2025');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('should capture and log all input field selectors in Property Wizard', () => {
    cy.log('🔍 DEBUGGING: Capturing all Property Wizard field selectors');
    
    // Navigate to SFR page and start wizard
    cy.visit('/sfr');
    cy.wait(3000);
    
    // Click Start SFR Analysis button
    cy.get('button:contains("Start SFR Analysis")')
      .should('be.visible')
      .click();
    
    // Wait for wizard to load
    cy.wait(3000);
    
    // Take initial screenshot
    cy.screenshot('wizard-step-1-debug');
    
    // Log all input elements and their attributes
    cy.get('input').each(($input, index) => {
      const element = $input[0];
      const info = {
        index,
        type: element.type,
        name: element.name,
        placeholder: element.placeholder,
        id: element.id,
        className: element.className,
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value
      };
      cy.log(`Input ${index}:`, JSON.stringify(info, null, 2));
    });
    
    // Log all label elements
    cy.get('label').each(($label, index) => {
      const text = $label.text();
      const htmlFor = $label.attr('for');
      cy.log(`Label ${index}: "${text}" (for: ${htmlFor})`);
    });
    
    // Enter test address to trigger auto-population and see what happens
    cy.get('input[placeholder*="Main Street"], input[placeholder*="Street"]')
      .first()
      .clear()
      .type('9476 Forest Hills Pl, Tampa, FL 33612');
    
    // Wait for auto-population
    cy.wait(8000);
    
    // Take screenshot after auto-population
    cy.screenshot('wizard-after-auto-population');
    
    // Log all input values after auto-population
    cy.get('input').each(($input, index) => {
      const element = $input[0];
      if (element.value) {
        cy.log(`Input ${index} has value: "${element.value}"`);
      }
    });
    
    // Find all buttons and their text
    cy.get('button').each(($button, index) => {
      const text = $button.text();
      const disabled = $button.prop('disabled');
      cy.log(`Button ${index}: "${text}" (disabled: ${disabled})`);
    });
    
    cy.log('✅ Debug information captured');
  });
});