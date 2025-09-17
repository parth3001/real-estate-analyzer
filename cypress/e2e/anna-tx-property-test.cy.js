describe('Anna, TX Property Expert Validation', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should analyze 1837 Walnut Way, Anna, TX and capture verdict', () => {
    cy.log('🎯 EXPERT VALIDATION: Anna, TX Property Analysis');
    
    // Test Property: 1837 Walnut Way, Anna, TX 75409
    const testProperty = {
      address: '1837 Walnut Way, Anna, TX 75409',
      purchasePrice: 245000,
      downPayment: 20, // %
      interestRate: 7.5,
      loanTerm: 30
    };

    cy.log(`📍 Testing Property: ${testProperty.address}`);
    cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);

    // Navigate to Property Wizard from Dashboard
    cy.visit('/');
    cy.wait(2000);
    cy.screenshot('01-anna-tx-dashboard');
    
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);
    cy.screenshot('02-anna-tx-wizard-launched');

    // STEP 1: Property Address & Details
    cy.log('📍 STEP 1: Property Address & Details');
    cy.get('input[placeholder*="address"], input[type="text"]').first().clear().type(testProperty.address);
    cy.wait(2000);
    
    // Wait for RentCast auto-population
    cy.log('⏳ Waiting for RentCast API auto-population...');
    cy.wait(5000);
    
    cy.screenshot('03-anna-tx-step1-with-rentcast');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 2: Purchase & Financing
    cy.log('💰 STEP 2: Purchase & Financing');
    cy.get('input').then($inputs => {
      // Purchase Price
      const purchasePriceInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Purchase') || 
        input.value?.includes('245') ||
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
        cy.log(`✅ Purchase Price set: $${testProperty.purchasePrice.toLocaleString()}`);
      }

      // Down Payment
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

    cy.screenshot('04-anna-tx-step2-financing');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 3: Rental Analysis
    cy.log('🏠 STEP 3: Rental Analysis');
    cy.screenshot('05-anna-tx-step3-rental');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 4: Long-term Assumptions
    cy.log('📈 STEP 4: Long-term Assumptions');
    cy.screenshot('06-anna-tx-step4-assumptions');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 5: Investment Goals & Strategy
    cy.log('🎯 STEP 5: Investment Goals & Strategy');
    
    // Set Conservative Investor Profile
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

    cy.screenshot('07-anna-tx-step5-strategy');
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

    // Wait for Investment Decision Engine
    cy.log('⏳ Waiting for Investment Decision Engine v2.1 analysis...');
    cy.wait(15000);

    // Capture Final Results
    cy.screenshot('08-anna-tx-final-analysis-results');
    cy.log('📊 ANALYSIS COMPLETE - Anna, TX Property Results');

    // Extract and log all analysis data
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
      cy.log('🎯 ANNA, TX PROPERTY ANALYSIS RESULTS');
      cy.log('=====================================');
      cy.log(`📍 Property: ${testProperty.address}`);
      cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
      cy.log(`📊 Investment Verdict: ${verdict}`);
      cy.log(`🏆 Property Quality Score: ${score}/100`);
      
      if (rentMatch) cy.log(`🏠 Monthly Rent: $${rentMatch[1]}`);
      if (capRateMatch) cy.log(`📈 Cap Rate: ${capRateMatch[1]}%`);
      if (cashFlowMatch) cy.log(`💵 Monthly Cash Flow: $${cashFlowMatch[1]}`);
      if (irrMatch) cy.log(`📊 IRR: ${irrMatch[1]}%`);
      if (cocMatch) cy.log(`💎 Cash-on-Cash Return: ${cocMatch[1]}%`);
      
      cy.log('=====================================');

      // Anna, TX Market Analysis
      cy.log('🏘️ ANNA, TX MARKET CONTEXT:');
      cy.log('- Dallas suburb, growing community');
      cy.log('- Family-friendly area with good schools');
      cy.log('- Expected rent: $1,800-2,200 for SFH');
      cy.log('- Typical cap rates: 6-8%');
      cy.log('- Market appreciation: Moderate to strong');
      
      // Expert validation for Anna, TX
      const isGoodVerdict = ['BUY', 'NEGOTIATE', 'STRONG BUY'].includes(verdict);
      const numericScore = parseInt(score);
      
      if (isGoodVerdict && numericScore >= 60) {
        cy.log(`✅ EXPERT VALIDATION: Strong results for Anna, TX property`);
      } else if (isGoodVerdict) {
        cy.log(`⚠️ EXPERT VALIDATION: Positive verdict but moderate score`);
      } else {
        cy.log(`❌ EXPERT VALIDATION: Unexpected results - may need review`);
      }
    });

    cy.log('🎯 Anna, TX property analysis completed');
  });
});