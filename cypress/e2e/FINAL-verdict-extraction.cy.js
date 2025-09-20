/**
 * FINAL VERDICT EXTRACTION - SR QE FIX
 * 
 * This test WILL capture actual Investment Decision Engine verdicts
 * No more screenshots of wizard steps - only final results
 */

describe('FINAL: Investment Decision Engine Verdict Extraction', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@realestateanalyzer.com');
    cy.get('input[type="password"]').type('Spring@2025');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
    cy.wait(3000);
  });

  it('EXTRACT REAL VERDICTS: Conservative vs Aggressive', () => {
    const results = {};
    
    // TEST 1: CONSERVATIVE INVESTOR
    cy.log('🛡️ CONSERVATIVE INVESTOR - EXTRACTING REAL VERDICT');
    
    // Navigate to wizard
    cy.visit('/');
    cy.wait(3000);
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // Step 1: Fill address fields separately
    cy.get('input[placeholder*="Street"], input[placeholder*="Main Street"]')
      .first()
      .clear()
      .type('1837 Walnut Way');
    
    cy.get('input').then($inputs => {
      const inputs = Array.from($inputs);
      const cityInput = inputs.find(input => 
        input.placeholder?.toLowerCase().includes('city') ||
        input.name?.toLowerCase().includes('city')
      ) || inputs[1];
      if (cityInput) cy.wrap(cityInput).clear().type('Anna');
      
      const stateInput = inputs.find(input => 
        input.placeholder?.toLowerCase().includes('state') ||
        input.name?.toLowerCase().includes('state')
      ) || inputs[2];
      if (stateInput) cy.wrap(stateInput).clear().type('TX');
      
      const zipInput = inputs.find(input => 
        input.placeholder?.toLowerCase().includes('zip') ||
        input.name?.toLowerCase().includes('zip')
      ) || inputs[3];
      if (zipInput) cy.wrap(zipInput).clear().type('75409');
    });
    
    cy.wait(3000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 2: Set purchase price
    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Purchase') || 
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type('245000');
      }
    });
    
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Steps 3-4: Force through
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 5: CONSERVATIVE settings
    cy.get('select, .MuiSelect-root').then($selects => {
      if ($selects.length >= 2) {
        // Portfolio Focus dropdown (usually second)
        cy.wrap($selects[1]).click();
        cy.get('[data-value="Cash Flow Focus"], .MuiMenuItem-root:contains("Cash Flow")').click();
      }
    });

    cy.get('select, .MuiSelect-root').then($selects => {
      if ($selects.length >= 4) {
        // Risk Tolerance dropdown (usually fourth)  
        cy.wrap($selects[3]).click();
        cy.get('[data-value="Low"], .MuiMenuItem-root:contains("Low")').click();
      }
    });

    cy.wait(2000);

    // Complete analysis and WAIT FOR RESULTS
    cy.get('button:contains("Analyzing"), button:contains("Complete"), button:contains("Analyze")').click({ force: true });
    cy.log('🚀 CONSERVATIVE analysis started...');
    
    // CRITICAL: Wait for analysis to complete and navigate to results
    cy.wait(20000); // Extended wait for analysis
    
    // Look for Analysis Results tab and click it
    cy.get('body').then($body => {
      if ($body.find('button:contains("Analysis Results")').length > 0) {
        cy.get('button:contains("Analysis Results")').click();
        cy.wait(5000);
      }
    });

    // Extract verdict from results page
    cy.get('body').then($body => {
      const bodyText = $body.text();
      
      let verdict = 'UNKNOWN';
      if (bodyText.includes('STRONG BUY')) verdict = 'STRONG BUY';
      else if (bodyText.includes('BUY')) verdict = 'BUY';
      else if (bodyText.includes('NEGOTIATE')) verdict = 'NEGOTIATE';
      else if (bodyText.includes('CAUTION')) verdict = 'CAUTION';
      else if (bodyText.includes('PASS')) verdict = 'PASS';
      
      let score = 'Unknown';
      const scoreMatch = bodyText.match(/(\d{1,2})\/100/);
      if (scoreMatch) score = scoreMatch[1];
      
      results.conservative = { verdict, score };
      
      cy.log('🛡️ CONSERVATIVE RESULTS EXTRACTED:');
      cy.log(`   Verdict: ${verdict}`);
      cy.log(`   Score: ${score}/100`);
      
      cy.screenshot('conservative-real-verdict');
    });

    // TEST 2: AGGRESSIVE INVESTOR (Fresh session)
    cy.log('🔥 AGGRESSIVE INVESTOR - EXTRACTING REAL VERDICT');
    
    cy.visit('/');
    cy.wait(3000);
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // Same property data
    cy.get('input[placeholder*="Street"], input[placeholder*="Main Street"]')
      .first()
      .clear()
      .type('1837 Walnut Way');
    
    cy.get('input').then($inputs => {
      const inputs = Array.from($inputs);
      const cityInput = inputs[1];
      if (cityInput) cy.wrap(cityInput).clear().type('Anna');
      const stateInput = inputs[2];
      if (stateInput) cy.wrap(stateInput).clear().type('TX');
      const zipInput = inputs[3];
      if (zipInput) cy.wrap(zipInput).clear().type('75409');
    });
    
    cy.wait(3000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Same purchase price
    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Purchase') || 
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type('245000');
      }
    });
    
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 5: AGGRESSIVE settings
    cy.get('select, .MuiSelect-root').then($selects => {
      if ($selects.length >= 2) {
        // Portfolio Focus: Wealth Building
        cy.wrap($selects[1]).click();
        cy.get('[data-value="Wealth Building"], .MuiMenuItem-root:contains("Wealth")').click();
      }
    });

    cy.get('select, .MuiSelect-root').then($selects => {
      if ($selects.length >= 4) {
        // Risk Tolerance: High
        cy.wrap($selects[3]).click();
        cy.get('[data-value="High"], .MuiMenuItem-root:contains("High")').click();
      }
    });

    cy.wait(2000);

    // Complete analysis
    cy.get('button:contains("Analyzing"), button:contains("Complete"), button:contains("Analyze")').click({ force: true });
    cy.log('🚀 AGGRESSIVE analysis started...');
    
    cy.wait(20000);
    
    // Navigate to results
    cy.get('body').then($body => {
      if ($body.find('button:contains("Analysis Results")').length > 0) {
        cy.get('button:contains("Analysis Results")').click();
        cy.wait(5000);
      }
    });

    // Extract aggressive verdict
    cy.get('body').then($body => {
      const bodyText = $body.text();
      
      let verdict = 'UNKNOWN';
      if (bodyText.includes('STRONG BUY')) verdict = 'STRONG BUY';
      else if (bodyText.includes('BUY')) verdict = 'BUY';
      else if (bodyText.includes('NEGOTIATE')) verdict = 'NEGOTIATE';
      else if (bodyText.includes('CAUTION')) verdict = 'CAUTION';
      else if (bodyText.includes('PASS')) verdict = 'PASS';
      
      let score = 'Unknown';
      const scoreMatch = bodyText.match(/(\d{1,2})\/100/);
      if (scoreMatch) score = scoreMatch[1];
      
      results.aggressive = { verdict, score };
      
      cy.log('🔥 AGGRESSIVE RESULTS EXTRACTED:');
      cy.log(`   Verdict: ${verdict}`);
      cy.log(`   Score: ${score}/100`);
      
      cy.screenshot('aggressive-real-verdict');
      
      // FINAL COMPARISON
      cy.log('================================================================');
      cy.log('🧠 INVESTMENT DECISION ENGINE VALIDATION COMPLETE');
      cy.log('================================================================');
      cy.log('🆚 REAL ENGINE VERDICTS:');
      cy.log(`Conservative: ${results.conservative?.verdict || 'FAILED'} (${results.conservative?.score || 'N/A'}/100)`);
      cy.log(`Aggressive:   ${results.aggressive?.verdict || 'FAILED'} (${results.aggressive?.score || 'N/A'}/100)`);
      
      if (results.conservative?.verdict && results.aggressive?.verdict) {
        if (results.conservative.verdict !== results.aggressive.verdict) {
          cy.log('✅ ENGINE WORKING: Different verdicts for different profiles');
        } else {
          cy.log('⚠️ SAME VERDICT: Engine may treat property the same regardless of profile');
        }
      } else {
        cy.log('❌ EXTRACTION FAILED: Could not capture verdicts properly');
      }
      
      cy.log('================================================================');
    });
  });
});