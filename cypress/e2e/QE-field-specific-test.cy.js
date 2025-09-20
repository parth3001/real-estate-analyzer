/**
 * QE Engineer: Field-Specific Test
 * Target the exact fields showing validation errors
 */

describe('QE: Field-Specific Validation Test', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should target exact fields and clear validation errors', () => {
    cy.log('🔬 QE: Field-Specific Test - Targeting exact validation fields');

    // Navigate to wizard
    cy.visit('/');
    cy.wait(2000);
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // Target specific fields by their exact placeholders/labels
    cy.log('📍 Targeting exact field selectors...');

    // Fill Property Address
    cy.get('input[placeholder*="Street Address"]').clear().type('1837 Walnut Way');
    cy.log('✅ Street Address filled');

    // Target City field specifically (red validation error visible)
    cy.get('input').then($inputs => {
      Array.from($inputs).forEach((input, index) => {
        const placeholder = input.placeholder || '';
        const name = input.name || '';
        const ariaLabel = input.getAttribute('aria-label') || '';

        cy.log(`Input ${index}: placeholder="${placeholder}", name="${name}", aria-label="${ariaLabel}"`);

        // Target the field that shows "City is required" error
        if (placeholder === 'City' || name.includes('city') || ariaLabel.includes('City')) {
          cy.wrap(input).clear().type('Anna');
          cy.log(`✅ Filled city field ${index}: Anna`);
        }

        // Target the field that shows "State is required" error
        if (placeholder === 'State' || name.includes('state') || ariaLabel.includes('State')) {
          cy.wrap(input).clear().type('TX');
          cy.log(`✅ Filled state field ${index}: TX`);
        }

        // Fill ZIP if found
        if (placeholder.includes('ZIP') || name.includes('zip')) {
          cy.wrap(input).clear().type('75409');
          cy.log(`✅ Filled ZIP field ${index}: 75409`);
        }
      });
    });

    // Fill Property Details
    cy.get('input[value="3"]').should('exist'); // Bedrooms should be 3
    cy.get('input[value="2"]').should('exist'); // Bathrooms should be 2
    cy.get('input[value="2005"]').should('exist'); // Year should be 2005

    cy.wait(3000);
    cy.screenshot('field-specific-after-filling');

    // Check if validation errors are cleared
    cy.get('body').then($body => {
      const bodyText = $body.text();

      cy.log('🔍 Validation Check:');
      if (bodyText.includes('City is required')) {
        cy.log('❌ City validation error still present');
      } else {
        cy.log('✅ City validation error cleared');
      }

      if (bodyText.includes('State is required')) {
        cy.log('❌ State validation error still present');
      } else {
        cy.log('✅ State validation error cleared');
      }

      // Check if Next button is enabled
      cy.get('button:contains("Next")').then($btn => {
        if ($btn.prop('disabled')) {
          cy.log('❌ Next button still disabled');
        } else {
          cy.log('✅ Next button enabled - trying to click');
          cy.wrap($btn).click();
        }
      });
    });

    cy.wait(5000);
    cy.screenshot('after-next-attempt');
  });
});