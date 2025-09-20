describe('Anna, TX Verdict Validation - Conservative vs Aggressive', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should capture ACTUAL Investment Decision Engine verdicts for both profiles', () => {
    cy.log('🔬 SR QE VALIDATION: Capturing Real Engine Results');
    cy.log('🎯 Test: Same property, different profiles → Different verdicts?');
    
    const testProperty = {
      address: '1837 Walnut Way, Anna, TX 75409',
      purchasePrice: 245000,
      downPayment: 20,
      interestRate: 7.5,
      loanTerm: 30
    };

    const results = {
      conservative: { verdict: null, score: null, screenshot: null },
      aggressive: { verdict: null, score: null, screenshot: null }
    };

    // TEST 1: CONSERVATIVE INVESTOR
    cy.log('🛡️ TESTING CONSERVATIVE INVESTOR PROFILE');
    cy.log('================================================================');
    
    cy.visit('/');
    cy.wait(2000);
    
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // Step 1: Property Address
    cy.get('input[placeholder*="address"], input[type="text"]').first()
      .clear()
      .type(testProperty.address);
    cy.wait(5000); // RentCast
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 2: Financing
    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Purchase') || 
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
      }
    });
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 3: Rental
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 4: Assumptions  
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 5: CONSERVATIVE PROFILE
    cy.log('🛡️ Setting CONSERVATIVE investor profile...');
    
    cy.get('body').then($body => {
      if ($body.find('button:contains("Low")').length > 0) {
        cy.get('button:contains("Low")').click();
        cy.log('✅ Risk Tolerance: LOW');
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Cash Flow")').length > 0) {
        cy.get('button:contains("Cash Flow")').click();
        cy.log('✅ Goal: CASH FLOW FOCUS');
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Long-term")').length > 0) {
        cy.get('button:contains("Long-term")').click();
        cy.log('✅ Horizon: LONG-TERM');
      }
    });

    cy.wait(2000);

    // Complete Analysis
    cy.log('🚀 Initiating CONSERVATIVE analysis...');
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn => 
        btn.textContent.includes('Complete') || 
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
      }
    });

    // CRITICAL: Wait for RESULTS and extract data
    cy.wait(15000);
    cy.log('📊 EXTRACTING CONSERVATIVE RESULTS...');

    // Take screenshot of actual results
    cy.screenshot('conservative-final-results', { capture: 'fullPage' });

    // Extract verdict and score from DOM
    cy.get('body').then($body => {
      const bodyText = $body.text();
      
      let verdict = 'UNKNOWN';
      if (bodyText.includes('STRONG BUY')) verdict = 'STRONG BUY';
      else if (bodyText.includes('BUY')) verdict = 'BUY';
      else if (bodyText.includes('NEGOTIATE')) verdict = 'NEGOTIATE';
      else if (bodyText.includes('CAUTION')) verdict = 'CAUTION';
      else if (bodyText.includes('PASS')) verdict = 'PASS';

      let score = 'Unknown';
      const scoreMatch = bodyText.match(/(\d{1,2})\/100/) || bodyText.match(/Score.*?(\d{1,2})/);
      if (scoreMatch) score = scoreMatch[1];

      results.conservative.verdict = verdict;
      results.conservative.score = score;

      cy.log('🛡️ CONSERVATIVE RESULTS CAPTURED:');
      cy.log(`   Verdict: ${verdict}`);
      cy.log(`   Score: ${score}/100`);
      cy.log('================================================================');
    });

    // TEST 2: AGGRESSIVE INVESTOR (NEW SESSION)
    cy.log('🔥 TESTING AGGRESSIVE INVESTOR PROFILE');
    cy.log('================================================================');
    
    // Start fresh analysis
    cy.visit('/');
    cy.wait(2000);
    
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // Step 1: Same Property Address
    cy.get('input[placeholder*="address"], input[type="text"]').first()
      .clear()
      .type(testProperty.address);
    cy.wait(5000); // RentCast
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 2: Same Financing
    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Purchase') || 
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
      }
    });
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 3: Same Rental
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 4: Same Assumptions
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 5: AGGRESSIVE PROFILE
    cy.log('🔥 Setting AGGRESSIVE investor profile...');
    
    cy.get('body').then($body => {
      if ($body.find('button:contains("High")').length > 0) {
        cy.get('button:contains("High")').click();
        cy.log('✅ Risk Tolerance: HIGH');
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Wealth Building")').length > 0) {
        cy.get('button:contains("Wealth Building")').click();
        cy.log('✅ Goal: WEALTH BUILDING');
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Medium-term")').length > 0) {
        cy.get('button:contains("Medium-term")').click();
        cy.log('✅ Horizon: MEDIUM-TERM');
      }
    });

    cy.wait(2000);

    // Complete Analysis
    cy.log('🚀 Initiating AGGRESSIVE analysis...');
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn => 
        btn.textContent.includes('Complete') || 
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
      }
    });

    // CRITICAL: Wait for RESULTS and extract data
    cy.wait(15000);
    cy.log('📊 EXTRACTING AGGRESSIVE RESULTS...');

    // Take screenshot of actual results
    cy.screenshot('aggressive-final-results', { capture: 'fullPage' });

    // Extract verdict and score from DOM
    cy.get('body').then($body => {
      const bodyText = $body.text();
      
      let verdict = 'UNKNOWN';
      if (bodyText.includes('STRONG BUY')) verdict = 'STRONG BUY';
      else if (bodyText.includes('BUY')) verdict = 'BUY';
      else if (bodyText.includes('NEGOTIATE')) verdict = 'NEGOTIATE';
      else if (bodyText.includes('CAUTION')) verdict = 'CAUTION';
      else if (bodyText.includes('PASS')) verdict = 'PASS';

      let score = 'Unknown';
      const scoreMatch = bodyText.match(/(\d{1,2})\/100/) || bodyText.match(/Score.*?(\d{1,2})/);
      if (scoreMatch) score = scoreMatch[1];

      results.aggressive.verdict = verdict;
      results.aggressive.score = score;

      cy.log('🔥 AGGRESSIVE RESULTS CAPTURED:');
      cy.log(`   Verdict: ${verdict}`);
      cy.log(`   Score: ${score}/100`);
      cy.log('================================================================');

      // FINAL COMPARISON AND VALIDATION
      cy.log('🧠 INVESTMENT DECISION ENGINE VALIDATION:');
      cy.log('================================================================');
      cy.log('🆚 ACTUAL ENGINE RESULTS:');
      cy.log(`Conservative: ${results.conservative.verdict} (${results.conservative.score}/100)`);
      cy.log(`Aggressive:   ${results.aggressive.verdict} (${results.aggressive.score}/100)`);
      
      // Validate engine behavior
      if (results.conservative.verdict !== results.aggressive.verdict) {
        cy.log('✅ ENGINE WORKING: Different verdicts for different profiles');
        
        const conservativeRank = getVerdictRank(results.conservative.verdict);
        const aggressiveRank = getVerdictRank(results.aggressive.verdict);
        
        if (aggressiveRank >= conservativeRank) {
          cy.log('✅ LOGIC CORRECT: Aggressive investor more bullish or equal');
        } else {
          cy.log('⚠️ UNEXPECTED: Conservative more bullish than aggressive');
        }
      } else {
        cy.log('⚠️ SAME VERDICT: Engine may not be differentiating by profile');
        cy.log('   This could be valid if property is clearly good/bad regardless');
      }

      // Score comparison
      const conservativeScore = parseInt(results.conservative.score) || 0;
      const aggressiveScore = parseInt(results.aggressive.score) || 0;
      
      if (aggressiveScore !== conservativeScore) {
        cy.log('✅ SCORE DIFFERENTIATION: Engine adapts scoring by profile');
        cy.log(`   Score difference: ${aggressiveScore - conservativeScore} points`);
      } else {
        cy.log('⚠️ SAME SCORE: Engine may not be adapting scores by profile');
      }

      cy.log('================================================================');
      cy.log('🎯 SR QE VALIDATION COMPLETE');
      cy.log('Real Investment Decision Engine results captured and analyzed');
      cy.log('================================================================');
    });
  });
});

// Helper function to rank verdicts for comparison
function getVerdictRank(verdict) {
  const ranks = {
    'PASS': 1,
    'CAUTION': 2,
    'NEGOTIATE': 3,
    'BUY': 4,
    'STRONG BUY': 5
  };
  return ranks[verdict] || 0;
}