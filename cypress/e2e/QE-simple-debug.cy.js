/**
 * QE Engineer: Simple Debug Test
 * Just navigate and log everything we see
 */

describe('QE: Simple Debug - What Actually Happens', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should navigate and log all interface elements', () => {
    cy.log('🔬 QE SIMPLE DEBUG: Logging actual interface');

    // Go to dashboard
    cy.visit('/');
    cy.wait(2000);

    // Look for SFR Analysis button
    cy.get('body').then($body => {
      cy.log('📍 Dashboard loaded, looking for SFR Analysis button...');

      if ($body.find('button:contains("Start SFR Analysis")').length > 0) {
        cy.log('✅ Found "Start SFR Analysis" button');
        cy.get('button:contains("Start SFR Analysis")').click();
        cy.wait(3000);

        // Log what we see after clicking
        cy.get('body').then($newBody => {
          const text = $newBody.text();
          cy.log('📋 After clicking Start SFR Analysis:');

          // Check for different possible interfaces
          if (text.includes('Property Address')) {
            cy.log('✅ Found Property Address interface');
          }
          if (text.includes('City is required')) {
            cy.log('⚠️ Found required field validation');
          }
          if (text.includes('Smart Wizard')) {
            cy.log('✅ Found Smart Wizard interface');
          }
          if (text.includes('Manual Form')) {
            cy.log('✅ Found Manual Form option');
          }

          // Log all input fields
          cy.get('input').then($inputs => {
            cy.log(`📝 Found ${$inputs.length} input fields:`);
            Array.from($inputs).forEach((input, index) => {
              const placeholder = input.placeholder || 'no placeholder';
              const name = input.name || 'no name';
              const type = input.type || 'no type';
              cy.log(`  ${index}: type="${type}", placeholder="${placeholder}", name="${name}"`);
            });
          });

          // Take screenshot of current state
          cy.screenshot('simple-debug-after-start-analysis');
        });
      } else {
        cy.log('❌ No "Start SFR Analysis" button found');
        cy.log('📋 Available buttons:');
        cy.get('button').each(($btn, index) => {
          cy.log(`  ${index}: "${$btn.text()}"`);
        });
      }
    });
  });
});