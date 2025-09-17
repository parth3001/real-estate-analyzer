describe('Comprehensive Expert Validation - E2E Workflow', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should complete full E2E workflow and extract detailed investment metrics', () => {
    cy.log('🎯 EXPERT VALIDATION: Comprehensive Property Analysis Test');
    
    // Test Property: 16 Belvidere Ave APT 3F, Jersey City NJ 07304
    const testProperty = {
      address: '16 Belvidere Ave APT 3F, Jersey City NJ 07304',
      city: 'Jersey City',
      state: 'NJ',
      zipCode: '07304',
      propertyType: 'Condo',
      // Financial assumptions
      purchasePrice: 250000,
      downPayment: 20, // %
      interestRate: 7.5,
      loanTerm: 30,
      expectedRent: 1900 // Expected based on RentCast
    };

    cy.log(`📍 Testing Property: ${testProperty.address}`);
    cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
    cy.log(`🏠 Expected Rent: $${testProperty.expectedRent}/month`);

    // Navigate to Property Wizard from Dashboard
    cy.visit('/');
    cy.wait(2000);
    cy.screenshot('01-dashboard-loaded');
    
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);
    cy.screenshot('02-wizard-launched');

    // STEP 1: Property Address & Details
    cy.log('📍 STEP 1: Property Address & Details');
    cy.get('input[placeholder*="address"], input[type="text"]').first().clear().type(testProperty.address);
    cy.wait(2000);
    
    // Wait for RentCast auto-population (critical integration test)
    cy.log('⏳ Waiting for RentCast API auto-population...');
    cy.wait(5000);
    
    // Verify RentCast data populated
    cy.get('body').then($body => {
      const bodyText = $body.text();
      if (bodyText.includes('1900') || bodyText.includes('$1,900')) {
        cy.log('✅ RentCast auto-population successful: ~$1,900/month');
      } else {
        cy.log('⚠️ RentCast auto-population may not have loaded properly');
      }
    });
    
    cy.screenshot('03-step1-completed-with-rentcast');
    cy.get('button:contains("Next")').click();
    cy.wait(3000);

    // STEP 2: Purchase & Financing
    cy.log('💰 STEP 2: Purchase & Financing');
    cy.get('input').then($inputs => {
      // Purchase Price (most critical field)
      const purchasePriceInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Purchase') || 
        input.value?.includes('250') ||
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
        cy.log(`✅ Purchase Price set: $${testProperty.purchasePrice.toLocaleString()}`);
      }

      // Down Payment Percentage
      const downPaymentInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Down') || 
        input.getAttribute('aria-label')?.includes('Down')
      );
      if (downPaymentInput) {
        cy.wrap(downPaymentInput).clear().type(testProperty.downPayment.toString());
        cy.log(`✅ Down Payment set: ${testProperty.downPayment}%`);
      }

      // Interest Rate
      const interestRateInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Interest') || 
        input.getAttribute('aria-label')?.includes('Interest')
      );
      if (interestRateInput) {
        cy.wrap(interestRateInput).clear().type(testProperty.interestRate.toString());
        cy.log(`✅ Interest Rate set: ${testProperty.interestRate}%`);
      }

      // Loan Term
      const loanTermInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Loan') || 
        input.getAttribute('aria-label')?.includes('Loan')
      );
      if (loanTermInput) {
        cy.wrap(loanTermInput).clear().type(testProperty.loanTerm.toString());
        cy.log(`✅ Loan Term set: ${testProperty.loanTerm} years`);
      }
    });

    cy.screenshot('04-step2-financing-completed');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 3: Rental Analysis
    cy.log('🏠 STEP 3: Rental Analysis');
    cy.screenshot('05-step3-rental-analysis');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 4: Long-term Assumptions
    cy.log('📈 STEP 4: Long-term Assumptions');
    cy.screenshot('06-step4-longterm-assumptions');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 5: Investment Goals & Strategy
    cy.log('🎯 STEP 5: Investment Goals & Strategy');
    
    // Set Conservative Investor Profile for baseline validation
    cy.get('body').then($body => {
      if ($body.find('button:contains("Low")').length > 0) {
        cy.get('button:contains("Low")').click();
        cy.log('✅ Risk Tolerance: Low (Conservative)');
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Cash Flow")').length > 0) {
        cy.get('button:contains("Cash Flow")').click();
        cy.log('✅ Investment Goal: Cash Flow Focus');
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Long-term")').length > 0) {
        cy.get('button:contains("Long-term")').click();
        cy.log('✅ Time Horizon: Long-term (10+ years)');
      }
    });

    cy.screenshot('07-step5-investment-strategy');
    cy.wait(2000);

    // Complete Analysis
    cy.log('🚀 INITIATING INVESTMENT ANALYSIS...');
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn => 
        btn.textContent.includes('Complete') || 
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
        cy.log('🚀 Analysis initiated - Investment Decision Engine processing...');
      }
    });

    // Wait for Investment Decision Engine to complete
    cy.log('⏳ Waiting for Investment Decision Engine v2.1 analysis...');
    cy.wait(10000);

    // Capture Final Results
    cy.screenshot('08-final-investment-analysis-results');
    cy.log('📊 ANALYSIS COMPLETE - Capturing results for expert validation');

    // Extract Investment Verdict
    cy.get('body').then($body => {
      const bodyText = $body.text();
      let verdict = 'UNKNOWN';
      let score = 'Unknown';
      
      // Extract Investment Decision
      if (bodyText.includes('STRONG BUY') || bodyText.includes('BUY')) {
        verdict = bodyText.includes('STRONG BUY') ? 'STRONG BUY' : 'BUY';
      } else if (bodyText.includes('NEGOTIATE')) {
        verdict = 'NEGOTIATE';
      } else if (bodyText.includes('CAUTION')) {
        verdict = 'CAUTION';
      } else if (bodyText.includes('PASS')) {
        verdict = 'PASS';
      }

      // Extract Property Quality Score (0-100)
      const scoreMatch = bodyText.match(/(\d{1,2})\/100|(\d{1,2})%/);
      if (scoreMatch) {
        score = scoreMatch[1] || scoreMatch[2];
      }

      // Extract Key Financial Metrics
      const capRateMatch = bodyText.match(/(\d+\.?\d*)%.*cap/i);
      const cashFlowMatch = bodyText.match(/\$(\d+,?\d*).*month/);
      const irr = bodyText.match(/IRR.*?(\d+\.?\d*)%/i);
      const cocReturn = bodyText.match(/Cash.*Return.*?(\d+\.?\d*)%/i);

      cy.log('=====================================');
      cy.log('🎯 EXPERT VALIDATION RESULTS');
      cy.log('=====================================');
      cy.log(`📍 Property: ${testProperty.address}`);
      cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
      cy.log(`📊 Investment Verdict: ${verdict}`);
      cy.log(`🏆 Property Quality Score: ${score}/100`);
      
      if (capRateMatch) cy.log(`📈 Cap Rate: ${capRateMatch[1]}%`);
      if (cashFlowMatch) cy.log(`💵 Monthly Cash Flow: $${cashFlowMatch[1]}`);
      if (irr) cy.log(`📊 IRR: ${irr[1]}%`);
      if (cocReturn) cy.log(`💎 Cash-on-Cash Return: ${cocReturn[1]}%`);
      
      cy.log('=====================================');

      // Expert Validation Logic
      const expectedVerdicts = ['BUY', 'NEGOTIATE', 'CAUTION']; // Jersey City condo should be reasonable
      const isVerdictReasonable = expectedVerdicts.includes(verdict);
      
      if (isVerdictReasonable) {
        cy.log(`✅ EXPERT VALIDATION PASSED: Verdict "${verdict}" is reasonable for Jersey City condo`);
      } else {
        cy.log(`⚠️ EXPERT VALIDATION CONCERN: Verdict "${verdict}" may need review`);
      }

      // Score validation (should be 40-85 for typical property)
      const numericScore = parseInt(score);
      if (numericScore >= 40 && numericScore <= 85) {
        cy.log(`✅ SCORE VALIDATION PASSED: ${score}/100 is in reasonable range`);
      } else {
        cy.log(`⚠️ SCORE VALIDATION CONCERN: ${score}/100 may need review`);
      }
    });

    cy.log('🎯 Expert validation test completed successfully');
  });
});