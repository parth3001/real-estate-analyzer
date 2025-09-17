/// <reference types="cypress" />

describe('Debug Final Analysis Step', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@realestateanalyzer.com');
    cy.get('input[type="password"]').type('Spring@2025');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('should debug what happens when clicking Complete Analysis', () => {
    cy.log('🔍 DEBUG: Investigating final analysis step failure');
    
    // Quick path to Step 5
    cy.visit('/sfr');
    cy.wait(3000);
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);
    
    // Minimal data to get to Step 5
    cy.get('input[placeholder="123 Main Street"]').type('123 Test St');
    cy.get('input').eq(1).type('Test City');
    cy.get('input').eq(2).type('NJ');
    cy.get('input').eq(3).type('12345');
    cy.get('input').then($inputs => {
      Array.from($inputs).forEach((input, i) => {
        if (input.value === '1847') cy.wrap(input).clear().type('1200');
        if (input.value === '2005') cy.wrap(input).clear().type('1995');
      });
    });
    
    // Progress through steps quickly
    cy.get('button').contains(/next/i).click();
    cy.wait(2000);
    cy.get('.MuiSlider-root').first().click();
    cy.wait(2000);
    cy.get('button').contains(/next/i).click();
    cy.wait(2000);
    cy.get('button').contains(/next/i).click();
    cy.wait(2000);
    cy.get('button').contains(/next/i).click();
    cy.wait(2000);
    
    // Now at Step 5 - take screenshot
    cy.screenshot('debug-step-5-before-analysis');
    
    // Log all buttons available
    cy.get('button').each(($btn, index) => {
      const text = $btn.text();
      const disabled = $btn.prop('disabled');
      cy.log(`Button ${index}: "${text}" (disabled: ${disabled})`);
    });
    
    // Click Complete Analysis and debug what happens
    cy.get('button').then($buttons => {
      const analyzeBtn = Array.from($buttons).find(btn => 
        btn.textContent.includes('Complete Analysis') ||
        btn.textContent.includes('Analyze')
      );
      
      if (analyzeBtn) {
        cy.log(`🎯 Found analyze button: "${analyzeBtn.textContent}"`);
        cy.wrap(analyzeBtn).click();
        cy.log('✅ Clicked Complete Analysis button');
        
        // Wait shorter time and see what happens
        cy.wait(10000);
        cy.screenshot('debug-after-analysis-click');
        
        // Check what's on the page now
        cy.get('body').then($body => {
          const pageText = $body.text();
          cy.log('📄 Page content includes:', pageText.substring(0, 500));
          
          // Look for any loading indicators
          if (pageText.includes('Loading') || pageText.includes('Analyzing')) {
            cy.log('⏳ Analysis is in progress');
          }
          
          // Look for error messages
          if (pageText.includes('Error') || pageText.includes('Failed')) {
            cy.log('❌ Error detected in analysis');
          }
          
          // Look for investment verdict
          if (pageText.includes('BUY') || pageText.includes('NEGOTIATE') || 
              pageText.includes('CAUTION') || pageText.includes('PASS')) {
            cy.log('✅ Investment verdict found!');
          } else {
            cy.log('⚠️ No investment verdict found yet');
          }
        });
        
      } else {
        cy.log('❌ Complete Analysis button not found');
      }
    });
    
    cy.log('🔍 Debug analysis completed');
  });
});