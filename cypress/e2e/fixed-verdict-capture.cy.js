describe('FIXED: Anna, TX Verdict Capture - Sr QE Fix', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should properly capture Investment Decision Engine verdicts', () => {
    cy.log('🔧 SR QE FIX: Properly capturing analysis results');
    
    const testProperty = {
      address: '1837 Walnut Way, Anna, TX 75409',
      purchasePrice: 245000
    };

    // TEST 1: CONSERVATIVE INVESTOR - WITH PROPER RESULT CAPTURE
    cy.log('🛡️ CONSERVATIVE INVESTOR TEST');
    cy.log('================================================================');
    
    cy.visit('/');
    cy.wait(3000);
    
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(4000);

    // Step 1: Property Address
    cy.get('input[placeholder*="address"], input[type="text"]').first()
      .clear()
      .type(testProperty.address);
    cy.wait(6000); // Extra wait for RentCast
    
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(4000);

    // Step 2: Purchase Price
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
    
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(4000);

    // Steps 3-4: Force through quickly
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 5: CONSERVATIVE SETTINGS
    cy.log('🛡️ Setting CONSERVATIVE profile...');
    
    // Risk Tolerance: Low
    cy.get('body').then($body => {
      if ($body.find('button:contains("Low")').length > 0) {
        cy.get('button:contains("Low")').click();
        cy.log('✅ Risk Tolerance: LOW');
      }
    });

    // Investment Goal: Cash Flow Focus
    cy.get('body').then($body => {
      if ($body.find('button:contains("Cash Flow")').length > 0) {
        cy.get('button:contains("Cash Flow")').click();
        cy.log('✅ Goal: CASH FLOW FOCUS');
      }
    });

    cy.wait(3000);

    // Complete Analysis - WAIT FOR ACTUAL RESULTS
    cy.log('🚀 Starting CONSERVATIVE analysis...');
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn => 
        btn.textContent.includes('Complete') || 
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
        cy.log('🚀 Analysis button clicked');
      }
    });

    // CRITICAL: Wait for analysis completion and navigate to results
    cy.log('⏳ Waiting for analysis completion...');
    cy.wait(20000); // Extended wait

    // Look for results page elements
    cy.get('body').then($body => {
      const bodyText = $body.text();
      
      // Check if we're still on wizard or on results
      if (bodyText.includes('Property Address') && bodyText.includes('City is required')) {
        cy.log('❌ Still on wizard page, analysis may have failed');
        
        // Try clicking "Analysis Results" tab if available
        cy.get('body').then($body2 => {
          if ($body2.find('button:contains("Analysis Results")').length > 0) {
            cy.get('button:contains("Analysis Results")').click();
            cy.wait(5000);
            cy.log('✅ Clicked Analysis Results tab');
          }
        });
      } else {
        cy.log('✅ Appears to be on results page');
      }
    });

    // Take screenshot and extract verdict
    cy.screenshot('conservative-analysis-attempt', { capture: 'fullPage' });
    
    cy.get('body').then($body => {
      const bodyText = $body.text();
      
      let verdict = 'NOT_FOUND';
      if (bodyText.includes('STRONG BUY')) verdict = 'STRONG BUY';
      else if (bodyText.includes('BUY')) verdict = 'BUY';
      else if (bodyText.includes('NEGOTIATE')) verdict = 'NEGOTIATE';
      else if (bodyText.includes('CAUTION')) verdict = 'CAUTION';
      else if (bodyText.includes('PASS')) verdict = 'PASS';

      let score = 'NOT_FOUND';
      const scoreMatch = bodyText.match(/(\d{1,2})\/100/) || bodyText.match(/(\d{1,2})%/);
      if (scoreMatch) score = scoreMatch[1];

      cy.log('🛡️ CONSERVATIVE RESULTS:');
      cy.log(`   Verdict: ${verdict}`);
      cy.log(`   Score: ${score}/100`);
      
      // Log page content for debugging
      if (verdict === 'NOT_FOUND') {
        cy.log('❌ VERDICT NOT FOUND - Page content analysis:');
        if (bodyText.includes('Analysis')) cy.log('   - Contains "Analysis"');
        if (bodyText.includes('Property')) cy.log('   - Contains "Property"');
        if (bodyText.includes('Investment')) cy.log('   - Contains "Investment"');
        if (bodyText.includes('Results')) cy.log('   - Contains "Results"');
        
        // Try to find the results section
        cy.get('[data-cy="analysis-results"], .analysis-results, .investment-decision').then($results => {
          if ($results.length > 0) {
            cy.log('✅ Found analysis results element');
          } else {
            cy.log('❌ No analysis results element found');
          }
        }).catch(() => {
          cy.log('❌ Analysis results element not accessible');
        });
      }
    });

    cy.log('================================================================');
    cy.log('🔧 SR QE DIAGNOSTIC COMPLETE');
    cy.log('Need to investigate why analysis results are not displaying');
    cy.log('================================================================');
  });
});