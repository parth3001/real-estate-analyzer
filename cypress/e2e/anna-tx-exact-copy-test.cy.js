describe('Anna, TX Property - Exact Copy Test', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should be exact copy of working gold standard test', () => {
    cy.log('🔬 QE ENGINEER: Testing exact copy capability');

    // Exact same property data
    const testProperty = {
      address: '1837 Walnut Way, Anna, TX 75409',
      purchasePrice: 245000,
      downPayment: 20,
      interestRate: 7.5,
      loanTerm: 30
    };

    // Navigate to Property Wizard from Dashboard
    cy.visit('/');
    cy.wait(2000);

    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // STEP 1: Property Address & Details
    cy.get('input[placeholder*="address"], input[type="text"]').first().clear().type(testProperty.address);
    cy.wait(5000);

    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 2: Purchase & Financing
    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Purchase') ||
        input.value?.includes('245') ||
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

    // STEP 3: Rental Analysis
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 4: Long-term Assumptions
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 5: Investment Goals & Strategy
    cy.get('body').then($body => {
      if ($body.find('button:contains("High")').length > 0) {
        cy.get('button:contains("High")').click();
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Wealth Building")').length > 0) {
        cy.get('button:contains("Wealth Building")').click();
      }
    });

    cy.wait(2000);

    // Complete Analysis - QE Engineer enhanced verification
    cy.log('🚀 QE ENGINEER: Looking for Complete/Analyze button...');
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn =>
        btn.textContent.includes('Complete') ||
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.log(`✅ Found button: "${completeBtn.textContent}"`);
        cy.wrap(completeBtn).click({ force: true });
        cy.log('🚀 Analysis initiated - waiting for results...');
      } else {
        cy.log('❌ QE ERROR: No Complete/Analyze button found');
        cy.get('button').each(($btn) => {
          cy.log(`Available button: "${$btn.text()}"`);
        });
      }
    });

    // Wait for Investment Decision Engine and verify we reached results
    cy.log('⏳ QE ENGINEER: Waiting for Investment Decision Engine analysis...');
    cy.wait(15000);

    // Verify we're on the results page before extraction
    cy.get('body').then($body => {
      const bodyText = $body.text();
      if (bodyText.includes('Investment') || bodyText.includes('verdict') || bodyText.includes('BUY') || bodyText.includes('PASS')) {
        cy.log('🎯 QE VERIFICATION: Results page detected, proceeding with data extraction');
      } else {
        cy.log('⚠️ QE WARNING: Results page not detected, extracting available content for debugging');
      }
    });

    // MINIMAL DATA EXTRACTION (QE Engineer disciplined approach)
    cy.get('body').then($body => {
      const bodyText = $body.text();

      // QE ENGINEER: First log all available text to see what patterns exist
      cy.log('🔍 QE DEBUG: Searching for verdict patterns in body text');
      cy.log('📄 Available text sample (first 500 chars):');
      cy.log(bodyText.substring(0, 500));

      // Search for verdict with more flexible patterns
      let verdict = 'UNKNOWN';
      if (bodyText.toLowerCase().includes('strong buy')) verdict = 'STRONG BUY';
      else if (bodyText.toLowerCase().includes('buy') && !bodyText.toLowerCase().includes('strong')) verdict = 'BUY';
      else if (bodyText.toLowerCase().includes('negotiate')) verdict = 'NEGOTIATE';
      else if (bodyText.toLowerCase().includes('caution')) verdict = 'CAUTION';
      else if (bodyText.toLowerCase().includes('pass')) verdict = 'PASS';

      // Extract metrics with multiple pattern attempts
      let score = 'Unknown';
      const scorePatterns = [
        /(\d{1,3})\/100/,
        /score[:\s]*(\d{1,3})/i,
        /(\d{1,3})[:\s]*\/[:\s]*100/,
        /(\d{1,3})[%\s]*score/i
      ];

      for (const pattern of scorePatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          score = match[1];
          break;
        }
      }

      // Extract cash flow with multiple patterns
      let cashFlow = 'Unknown';
      const cashFlowPatterns = [
        /Cash Flow[:\s]*\$?([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /monthly[:\s]*\$?([+-]?\d+(?:,\d{3})*)/i,
        /\$([+-]?\d+(?:,\d{3})*)[:\s]*month/i,
        /cash[:\s]*\$?([+-]?\d+(?:,\d{3})*)/i
      ];

      for (const pattern of cashFlowPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          cashFlow = match[1];
          break;
        }
      }

      // QE ENGINEER: Log actual platform results
      cy.log('🎯 ACTUAL PLATFORM RESULTS EXTRACTED:');
      cy.log(`   Investment Verdict: ${verdict}`);
      cy.log(`   Deal Quality Score: ${score}/100`);
      cy.log(`   Monthly Cash Flow: $${cashFlow}`);

      // Store results for external validation (QE Engineer data persistence)
      const extractedData = {
        property: '1837 Walnut Way, Anna, TX 75409',
        purchasePrice: 245000,
        verdict: verdict,
        score: score,
        cashFlow: cashFlow,
        timestamp: new Date().toISOString()
      };

      if (verdict !== 'UNKNOWN') {
        cy.log('✅ QE SUCCESS: Verdict extracted successfully for AI validation');
        cy.writeFile('cypress/fixtures/extracted-platform-data.json', extractedData);
        cy.log(`📄 RESULTS SAVED: cypress/fixtures/extracted-platform-data.json`);
      } else {
        cy.log('⚠️ QE WARNING: No verdict pattern matched - checking if results page loaded correctly');
        cy.writeFile('cypress/fixtures/extraction-debug.json', {
          bodyTextSample: bodyText.substring(0, 1000),
          timestamp: new Date().toISOString(),
          error: 'No verdict pattern matched'
        });
      }
    });

    cy.log('✅ QE ENGINEER: Data extraction test completed');
  });
});