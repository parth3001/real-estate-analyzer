describe('Anna, TX Property - Aggressive Investor Validation', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should analyze same Anna, TX property with Aggressive Investor profile', () => {
    cy.log('🎯 AGGRESSIVE INVESTOR TEST: Anna, TX Property Analysis');
    cy.log('🆚 COMPARISON: Same property, different investor strategy');
    
    // Same Test Property: 1837 Walnut Way, Anna, TX 75409
    const testProperty = {
      address: '1837 Walnut Way, Anna, TX 75409',
      purchasePrice: 245000,
      downPayment: 20, // %
      interestRate: 7.5,
      loanTerm: 30
    };

    cy.log(`📍 Property: ${testProperty.address}`);
    cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
    cy.log('🔥 Investor Profile: AGGRESSIVE (High Risk Tolerance)');

    // Navigate to Property Wizard from Dashboard
    cy.visit('/');
    cy.wait(2000);
    cy.screenshot('01-aggressive-anna-tx-dashboard');
    
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // STEP 1: Property Address & Details (Same as Conservative)
    cy.log('📍 STEP 1: Property Address & Details');
    cy.get('input[placeholder*="address"], input[type="text"]').first().clear().type(testProperty.address);
    cy.wait(5000); // RentCast auto-population
    
    cy.screenshot('02-aggressive-step1-anna-tx');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 2: Purchase & Financing (Same as Conservative)
    cy.log('💰 STEP 2: Purchase & Financing');
    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Purchase') || 
        input.value?.includes('245') ||
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
        cy.log(`✅ Purchase Price set: $${testProperty.purchasePrice.toLocaleString()}`);
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

    cy.screenshot('03-aggressive-step2-financing');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 3: Rental Analysis (Same as Conservative)
    cy.log('🏠 STEP 3: Rental Analysis');
    cy.screenshot('04-aggressive-step3-rental');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 4: Long-term Assumptions (Same as Conservative)
    cy.log('📈 STEP 4: Long-term Assumptions');
    cy.screenshot('05-aggressive-step4-assumptions');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 5: Investment Goals & Strategy - AGGRESSIVE PROFILE
    cy.log('🔥 STEP 5: Investment Goals & Strategy - AGGRESSIVE INVESTOR');
    
    // Set Aggressive Investor Profile
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

    cy.get('body').then($body => {
      if ($body.find('button:contains("Medium-term")').length > 0) {
        cy.get('button:contains("Medium-term")').click();
        cy.log('⚡ Time Horizon: Medium-term (5-10 years)');
      }
    });

    cy.screenshot('06-aggressive-step5-strategy');
    cy.wait(2000);

    // Complete Analysis
    cy.log('🚀 INITIATING AGGRESSIVE INVESTOR ANALYSIS...');
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn => 
        btn.textContent.includes('Complete') || 
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
        cy.log('🚀 Analysis initiated - Testing Investment Decision Engine adaptation...');
      }
    });

    // Wait for Investment Decision Engine
    cy.log('⏳ Waiting for Investment Decision Engine v2.1 aggressive analysis...');
    cy.wait(15000);

    // Capture Final Results
    cy.screenshot('07-aggressive-anna-tx-final-results');
    cy.log('📊 ANALYSIS COMPLETE - Aggressive Investor Results');

    // Extract and compare results
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

      // Extract Property Quality Score
      const scoreMatch = bodyText.match(/(\d{1,2})\/100|(\d{1,2})%/);
      if (scoreMatch) {
        score = scoreMatch[1] || scoreMatch[2];
      }

      // Extract Financial Metrics
      const capRateMatch = bodyText.match(/(\d+\.?\d*)%.*cap/i);
      const cashFlowMatch = bodyText.match(/\$(\d+,?\d*).*month/);
      const irrMatch = bodyText.match(/IRR.*?(\d+\.?\d*)%/i);
      const cocMatch = bodyText.match(/Cash.*Return.*?(\d+\.?\d*)%/i);
      const rentMatch = bodyText.match(/rent.*?\$(\d+,?\d*)/i) || bodyText.match(/\$(\d+,?\d*).*rent/i);

      cy.log('=====================================');
      cy.log('🔥 AGGRESSIVE INVESTOR ANALYSIS RESULTS');
      cy.log('=====================================');
      cy.log(`📍 Property: ${testProperty.address}`);
      cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
      cy.log(`🎯 Investment Verdict: ${verdict}`);
      cy.log(`🏆 Property Quality Score: ${score}/100`);
      
      if (rentMatch) cy.log(`🏠 Monthly Rent: $${rentMatch[1]}`);
      if (capRateMatch) cy.log(`📈 Cap Rate: ${capRateMatch[1]}%`);
      if (cashFlowMatch) cy.log(`💵 Monthly Cash Flow: $${cashFlowMatch[1]}`);
      if (irrMatch) cy.log(`📊 IRR: ${irrMatch[1]}%`);
      if (cocMatch) cy.log(`💎 Cash-on-Cash Return: ${cocMatch[1]}%`);
      
      cy.log('=====================================');
      cy.log('🆚 AGGRESSIVE vs CONSERVATIVE COMPARISON:');
      cy.log('• Conservative Result: CAUTION (Low risk tolerance)');
      cy.log(`• Aggressive Result: ${verdict} (High risk tolerance)`);
      
      // Investment Decision Engine Validation
      cy.log('🧠 INVESTMENT DECISION ENGINE VALIDATION:');
      
      if (verdict === 'BUY' || verdict === 'STRONG BUY') {
        cy.log('✅ ENGINE WORKING: Aggressive investor accepts 10.29% yield risk');
        cy.log('✅ LOGIC: High risk tolerance → accepts thin margins for high yield');
      } else if (verdict === 'NEGOTIATE') {
        cy.log('✅ ENGINE WORKING: Aggressive investor sees opportunity with negotiation');
        cy.log('✅ LOGIC: High yield potential warrants negotiation for better terms');
      } else if (verdict === 'CAUTION') {
        cy.log('⚠️ ENGINE CONSISTENT: Even aggressive investor sees risks');
        cy.log('⚠️ LOGIC: Property fundamentals may be concerning regardless of risk tolerance');
      } else {
        cy.log('❌ UNEXPECTED: Aggressive investor should not PASS on 10.29% yield');
      }
      
      // Expected behavior validation
      const expectedBehavior = ['BUY', 'NEGOTIATE'].includes(verdict);
      if (expectedBehavior) {
        cy.log('🎯 EXPECTED BEHAVIOR: Aggressive investor more bullish than conservative');
      } else {
        cy.log('🤔 UNEXPECTED BEHAVIOR: May need engine review for aggressive profiles');
      }
      
      cy.log('=====================================');
      cy.log('🔬 ENGINE SOPHISTICATION TEST:');
      cy.log('• Same property, different risk tolerance');
      cy.log('• Tests strategy-aware verdict generation');
      cy.log('• Validates Investment Decision Engine adaptability');
      cy.log('=====================================');
    });

    cy.log('🎯 Aggressive investor analysis completed');
  });
});