/**
 * QE Engineer: Proper Debug Test for Investment Decision Engine Data Extraction
 *
 * OBJECTIVE: Debug actual wizard flow and extract REAL engine output
 * APPROACH: Fill form fields correctly according to actual UI
 */

describe('QE: Debug Proper Investment Decision Engine Extraction', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should properly navigate wizard and extract REAL Investment Decision Engine data', () => {
    cy.log('🔬 QE ENGINEER: Debugging Proper Wizard Flow');
    cy.log('🎯 OBJECTIVE: Extract ACTUAL Investment Decision Engine Output');

    // Test Property Configuration
    const testProperty = {
      street: '1837 Walnut Way',
      city: 'Anna',
      state: 'TX',
      zip: '75409',
      purchasePrice: 245000,
      downPayment: 20,
      interestRate: 7.5,
      loanTerm: 30
    };

    cy.log(`📍 Property: ${testProperty.street}, ${testProperty.city}, ${testProperty.state} ${testProperty.zip}`);
    cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);

    // Navigate to Property Wizard
    cy.visit('/');
    cy.wait(2000);
    cy.screenshot('01-debug-dashboard');

    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // STEP 1: Property Address - FILL CORRECTLY
    cy.log('📍 STEP 1: Property Address - Filling separate fields correctly');

    // Fill Street Address
    cy.get('input').then($inputs => {
      const streetInput = Array.from($inputs).find(input =>
        input.placeholder?.toLowerCase().includes('street') ||
        input.placeholder?.toLowerCase().includes('address') ||
        !input.placeholder?.toLowerCase().includes('city') &&
        !input.placeholder?.toLowerCase().includes('state') &&
        !input.placeholder?.toLowerCase().includes('zip')
      );
      if (streetInput) {
        cy.wrap(streetInput).clear().type(testProperty.street);
        cy.log(`✅ Street Address: ${testProperty.street}`);
      }
    });

    // Fill City
    cy.get('input[placeholder*="City"], input[placeholder*="city"]').clear().type(testProperty.city);
    cy.log(`✅ City: ${testProperty.city}`);

    // Fill State
    cy.get('input[placeholder*="State"], input[placeholder*="state"]').clear().type(testProperty.state);
    cy.log(`✅ State: ${testProperty.state}`);

    // Fill ZIP
    cy.get('input[placeholder*="ZIP"], input[placeholder*="zip"]').clear().type(testProperty.zip);
    cy.log(`✅ ZIP: ${testProperty.zip}`);

    cy.wait(5000); // Wait for RentCast auto-population
    cy.screenshot('02-debug-step1-address');

    // Try Next button
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 2: Purchase & Financing
    cy.log('💰 STEP 2: Purchase & Financing');

    // Set Purchase Price
    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Purchase') ||
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
        cy.log(`✅ Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
      }
    });

    // Set Down Payment
    cy.get('input').then($inputs => {
      const downPaymentInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Down') ||
        input.getAttribute('aria-label')?.includes('Down')
      );
      if (downPaymentInput) {
        cy.wrap(downPaymentInput).clear().type(testProperty.downPayment.toString());
        cy.log(`✅ Down Payment: ${testProperty.downPayment}%`);
      }
    });

    // Set Interest Rate
    cy.get('input').then($inputs => {
      const interestRateInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Interest') ||
        input.getAttribute('aria-label')?.includes('Interest')
      );
      if (interestRateInput) {
        cy.wrap(interestRateInput).clear().type(testProperty.interestRate.toString());
        cy.log(`✅ Interest Rate: ${testProperty.interestRate}%`);
      }
    });

    // Set Loan Term
    cy.get('input').then($inputs => {
      const loanTermInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Loan') ||
        input.getAttribute('aria-label')?.includes('Loan')
      );
      if (loanTermInput) {
        cy.wrap(loanTermInput).clear().type(testProperty.loanTerm.toString());
        cy.log(`✅ Loan Term: ${testProperty.loanTerm} years`);
      }
    });

    cy.screenshot('03-debug-step2-financing');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 3: Rental Analysis
    cy.log('🏠 STEP 3: Rental Analysis');
    cy.screenshot('04-debug-step3-rental');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 4: Long-term Assumptions
    cy.log('📈 STEP 4: Long-term Assumptions');
    cy.screenshot('05-debug-step4-assumptions');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 5: Investment Strategy
    cy.log('🔥 STEP 5: Investment Strategy - Setting Aggressive Profile');

    // Set Risk Tolerance
    cy.get('body').then($body => {
      if ($body.find('button:contains("High")').length > 0) {
        cy.get('button:contains("High")').click();
        cy.log('✅ Risk Tolerance: High');
      }
    });

    // Set Investment Goal
    cy.get('body').then($body => {
      if ($body.find('button:contains("Wealth Building")').length > 0) {
        cy.get('button:contains("Wealth Building")').click();
        cy.log('✅ Investment Goal: Wealth Building');
      }
    });

    cy.screenshot('06-debug-step5-strategy');
    cy.wait(2000);

    // Complete Analysis - TRY ALL POSSIBLE BUTTONS
    cy.log('🚀 INITIATING ANALYSIS - Trying all completion buttons...');

    cy.get('button').then($buttons => {
      const buttons = Array.from($buttons);

      // Log all available buttons for debugging
      cy.log('📋 Available buttons:');
      buttons.forEach((btn, index) => {
        const text = btn.textContent || '';
        const disabled = btn.disabled;
        cy.log(`  ${index}: "${text}" (disabled: ${disabled})`);
      });

      // Try to find and click analyze button
      const analyzeBtn = buttons.find(btn => {
        const text = btn.textContent || '';
        return (text.includes('Analyze') ||
                text.includes('Complete') ||
                text.includes('Finish') ||
                text.includes('Submit')) &&
               !btn.disabled;
      });

      if (analyzeBtn) {
        cy.wrap(analyzeBtn).click({ force: true });
        cy.log(`🚀 Clicked: "${analyzeBtn.textContent}"`);
      } else {
        cy.log('❌ No enabled analyze button found');
        // Take screenshot of current state for debugging
        cy.screenshot('debug-no-analyze-button');
      }
    });

    // Wait for analysis
    cy.log('⏳ Waiting for Investment Decision Engine analysis...');
    cy.wait(20000);

    // Take screenshot of current state
    cy.screenshot('07-debug-after-analysis-attempt');

    // Check if we're on results page or still in wizard
    cy.get('body').then($body => {
      const bodyText = $body.text();

      cy.log('🔍 DEBUGGING CURRENT PAGE STATE:');

      if (bodyText.includes('Analysis Results')) {
        cy.log('✅ Found "Analysis Results" - we may be on results page');
        cy.get('button:contains("Analysis Results"), a:contains("Analysis Results")').click();
        cy.wait(5000);
      } else if (bodyText.includes('Property Analysis Wizard')) {
        cy.log('❌ Still in Property Analysis Wizard');
      } else if (bodyText.includes('Investment Decision')) {
        cy.log('✅ Found "Investment Decision" text');
      } else {
        cy.log('❓ Unknown page state');
      }

      // Log page indicators
      if (bodyText.includes('BUY')) cy.log('🎯 Found BUY verdict text');
      if (bodyText.includes('NEGOTIATE')) cy.log('🎯 Found NEGOTIATE verdict text');
      if (bodyText.includes('CAUTION')) cy.log('🎯 Found CAUTION verdict text');
      if (bodyText.includes('PASS')) cy.log('🎯 Found PASS verdict text');
      if (bodyText.includes('/100')) cy.log('🏆 Found score format');
      if (bodyText.includes('Cap Rate')) cy.log('📊 Found Cap Rate metric');
      if (bodyText.includes('Cash Flow')) cy.log('💰 Found Cash Flow metric');

      // Save current page state for analysis
      const debugData = {
        timestamp: new Date().toISOString(),
        pageState: 'debug_extraction',
        bodyTextSample: bodyText.substring(0, 5000),
        hasAnalysisResults: bodyText.includes('Analysis Results'),
        hasInvestmentDecision: bodyText.includes('Investment Decision'),
        hasVerdict: bodyText.includes('BUY') || bodyText.includes('NEGOTIATE') || bodyText.includes('CAUTION') || bodyText.includes('PASS'),
        hasScore: bodyText.includes('/100'),
        hasMetrics: bodyText.includes('Cap Rate') || bodyText.includes('Cash Flow')
      };

      cy.writeFile('cypress/fixtures/debug-page-state.json', debugData);
      cy.log('💾 Debug data saved to cypress/fixtures/debug-page-state.json');
    });

    cy.log('🔬 QE DEBUG COMPLETE - Check debug-page-state.json for analysis');
  });
});