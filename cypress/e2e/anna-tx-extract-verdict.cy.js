/**
 * QE Engineer: Extract ACTUAL verdict from Investment Decision Engine
 * for Anna TX property with different investor profiles
 */

describe('Anna TX - Extract Actual Verdicts', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should extract actual verdict for Aggressive Investor', () => {
    const testProperty = {
      address: '1837 Walnut Way, Anna, TX 75409',
      purchasePrice: 245000,
      downPayment: 20,
      interestRate: 7.5,
      loanTerm: 30
    };

    cy.log('🔬 QE ENGINEER: Extracting ACTUAL verdict for Aggressive Investor');

    // Navigate to Property Wizard
    cy.visit('/');
    cy.wait(2000);

    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // Step 1: Property Address
    cy.get('input[placeholder*="address"], input[type="text"]').first()
      .clear()
      .type(testProperty.address);
    cy.wait(5000); // RentCast auto-population
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 2: Purchase & Financing
    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Purchase') ||
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
      }

      const downPaymentInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Down') ||
        input.getAttribute('aria-label')?.includes('Down')
      );
      if (downPaymentInput) {
        cy.wrap(downPaymentInput).clear().type(testProperty.downPayment.toString());
      }

      const interestRateInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Interest') ||
        input.getAttribute('aria-label')?.includes('Interest')
      );
      if (interestRateInput) {
        cy.wrap(interestRateInput).clear().type(testProperty.interestRate.toString());
      }

      const loanTermInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Loan') ||
        input.getAttribute('aria-label')?.includes('Loan')
      );
      if (loanTermInput) {
        cy.wrap(loanTermInput).clear().type(testProperty.loanTerm.toString());
      }
    });

    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 3: Rental Analysis
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 4: Long-term Assumptions
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 5: Investment Goals & Strategy - AGGRESSIVE PROFILE
    cy.get('body').then($body => {
      if ($body.find('button:contains("High")').length > 0) {
        cy.get('button:contains("High")').click();
        cy.log('🔥 Risk Tolerance: High (Aggressive)');
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Wealth Building")').length > 0) {
        cy.get('button:contains("Wealth Building")').click();
        cy.log('💎 Investment Goal: Wealth Building');
      }
    });

    // Complete Analysis
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn =>
        btn.textContent.includes('Complete') ||
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
      }
    });

    // Wait for results
    cy.wait(15000);

    // Extract the verdict and metrics
    cy.get('body').then($body => {
      const bodyText = $body.text();

      // Extract verdict
      let verdict = 'UNKNOWN';
      if (bodyText.includes('STRONG BUY')) {
        verdict = 'STRONG BUY';
      } else if (bodyText.includes('BUY') && !bodyText.includes('STRONG BUY')) {
        verdict = 'BUY';
      } else if (bodyText.includes('NEGOTIATE')) {
        verdict = 'NEGOTIATE';
      } else if (bodyText.includes('CAUTION')) {
        verdict = 'CAUTION';
      } else if (bodyText.includes('PASS')) {
        verdict = 'PASS';
      }

      // Extract score
      const scoreMatch = bodyText.match(/(\d{1,3})\/100/);
      const score = scoreMatch ? scoreMatch[1] : 'Unknown';

      // Extract cash flow
      const cashFlowMatch = bodyText.match(/Cash Flow[:\s]*\$?([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      const cashFlow = cashFlowMatch ? cashFlowMatch[1] : 'Unknown';

      // Extract cap rate
      const capRateMatch = bodyText.match(/Cap Rate[:\s]*([0-9]+\.?[0-9]*)%/i);
      const capRate = capRateMatch ? capRateMatch[1] : 'Unknown';

      cy.log('====================================');
      cy.log('🎯 ACTUAL VERDICT EXTRACTED');
      cy.log('====================================');
      cy.log(`📍 Property: ${testProperty.address}`);
      cy.log(`🔥 Investor: AGGRESSIVE`);
      cy.log(`💵 Monthly Cash Flow: $${cashFlow}`);
      cy.log(`📊 Cap Rate: ${capRate}%`);
      cy.log(`🏆 Deal Quality Score: ${score}/100`);
      cy.log(`🎯 VERDICT: ${verdict}`);
      cy.log('====================================');

      // Make assertions visible in test output
      cy.wrap(verdict).should('not.equal', 'UNKNOWN');
      cy.wrap(score).should('not.equal', 'Unknown');

      // Log for QE validation
      cy.task('log', `QE_VERDICT: Aggressive Investor = ${verdict} (Score: ${score}/100, Cash Flow: $${cashFlow})`);
    });
  });
});