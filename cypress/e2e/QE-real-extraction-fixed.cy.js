/**
 * QE Engineer: REAL Investment Decision Engine Data Extraction
 * Fixed version based on actual interface discovery
 */

describe('QE: REAL Investment Decision Engine Data Extraction', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should complete full wizard flow and extract REAL Investment Decision Engine data', () => {
    cy.log('🔬 QE ENGINEER: REAL Investment Decision Engine Data Extraction');
    cy.log('🎯 MISSION: Extract actual platform data for legitimate validation');

    // Test Property Configuration
    const testProperty = {
      street: '1837 Walnut Way',
      city: 'Anna',
      state: 'TX',
      zip: '75409',
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2005,
      purchasePrice: 245000,
      downPayment: 20,
      interestRate: 7.5,
      loanTerm: 30
    };

    // Navigate to SFR Analysis
    cy.visit('/');
    cy.wait(2000);
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // STEP 1: Fill Property Address Form Correctly
    cy.log('📍 STEP 1: Property Address & Details - Filling ALL required fields');

    // Fill Property Address (main field)
    cy.get('input[placeholder*="Main Street"], input[placeholder*="address"]')
      .first()
      .clear()
      .type(testProperty.street);
    cy.log(`✅ Street Address: ${testProperty.street}`);

    // Fill City (required field)
    cy.get('input').then($inputs => {
      const cityInput = Array.from($inputs).find(input => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        const label = input.getAttribute('aria-label')?.toLowerCase() || '';
        return placeholder.includes('city') || label.includes('city');
      });
      if (cityInput) {
        cy.wrap(cityInput).clear().type(testProperty.city);
        cy.log(`✅ City: ${testProperty.city}`);
      }
    });

    // Fill State (required field)
    cy.get('input').then($inputs => {
      const stateInput = Array.from($inputs).find(input => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        const label = input.getAttribute('aria-label')?.toLowerCase() || '';
        return placeholder.includes('state') || label.includes('state');
      });
      if (stateInput) {
        cy.wrap(stateInput).clear().type(testProperty.state);
        cy.log(`✅ State: ${testProperty.state}`);
      }
    });

    // Fill ZIP Code
    cy.get('input').then($inputs => {
      const zipInput = Array.from($inputs).find(input => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        const label = input.getAttribute('aria-label')?.toLowerCase() || '';
        return placeholder.includes('zip') || placeholder.includes('code') ||
               label.includes('zip') || label.includes('code');
      });
      if (zipInput) {
        cy.wrap(zipInput).clear().type(testProperty.zip);
        cy.log(`✅ ZIP Code: ${testProperty.zip}`);
      }
    });

    // Fill Property Details
    cy.get('input').then($inputs => {
      const bedroomsInput = Array.from($inputs).find(input => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        return placeholder.includes('bedroom');
      });
      if (bedroomsInput) {
        cy.wrap(bedroomsInput).clear().type(testProperty.bedrooms.toString());
        cy.log(`✅ Bedrooms: ${testProperty.bedrooms}`);
      }

      const bathroomsInput = Array.from($inputs).find(input => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        return placeholder.includes('bathroom');
      });
      if (bathroomsInput) {
        cy.wrap(bathroomsInput).clear().type(testProperty.bathrooms.toString());
        cy.log(`✅ Bathrooms: ${testProperty.bathrooms}`);
      }

      const yearInput = Array.from($inputs).find(input => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        return placeholder.includes('year') || placeholder.includes('built');
      });
      if (yearInput) {
        cy.wrap(yearInput).clear().type(testProperty.yearBuilt.toString());
        cy.log(`✅ Year Built: ${testProperty.yearBuilt}`);
      }
    });

    cy.wait(5000); // Wait for RentCast auto-population
    cy.screenshot('01-step1-address-complete');

    // Click Next (should work now that all required fields are filled)
    cy.get('button:contains("Next")').click();
    cy.wait(3000);

    // STEP 2: Purchase & Financing
    cy.log('💰 STEP 2: Purchase & Financing');

    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Purchase') ||
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
        cy.log(`✅ Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
      }

      const downPaymentInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Down') ||
        input.getAttribute('aria-label')?.includes('Down')
      );
      if (downPaymentInput) {
        cy.wrap(downPaymentInput).clear().type(testProperty.downPayment.toString());
        cy.log(`✅ Down Payment: ${testProperty.downPayment}%`);
      }

      const interestRateInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Interest') ||
        input.getAttribute('aria-label')?.includes('Interest')
      );
      if (interestRateInput) {
        cy.wrap(interestRateInput).clear().type(testProperty.interestRate.toString());
        cy.log(`✅ Interest Rate: ${testProperty.interestRate}%`);
      }

      const loanTermInput = Array.from($inputs).find(input =>
        input.placeholder?.includes('Loan') ||
        input.getAttribute('aria-label')?.includes('Loan')
      );
      if (loanTermInput) {
        cy.wrap(loanTermInput).clear().type(testProperty.loanTerm.toString());
        cy.log(`✅ Loan Term: ${testProperty.loanTerm} years`);
      }
    });

    cy.screenshot('02-step2-financing-complete');
    cy.get('button:contains("Next")').click();
    cy.wait(3000);

    // STEP 3: Rental Analysis (accept defaults)
    cy.log('🏠 STEP 3: Rental Analysis');
    cy.screenshot('03-step3-rental');
    cy.get('button:contains("Next")').click();
    cy.wait(3000);

    // STEP 4: Long-term Assumptions (accept defaults)
    cy.log('📈 STEP 4: Long-term Assumptions');
    cy.screenshot('04-step4-assumptions');
    cy.get('button:contains("Next")').click();
    cy.wait(3000);

    // STEP 5: Investment Strategy - Set Aggressive Profile
    cy.log('🔥 STEP 5: Investment Strategy - Setting Aggressive Profile');

    // Set Risk Tolerance to High
    cy.get('body').then($body => {
      if ($body.find('button:contains("High")').length > 0) {
        cy.get('button:contains("High")').click();
        cy.log('✅ Risk Tolerance: High');
      }
    });

    // Set Investment Goal to Wealth Building
    cy.get('body').then($body => {
      if ($body.find('button:contains("Wealth Building")').length > 0) {
        cy.get('button:contains("Wealth Building")').click();
        cy.log('✅ Investment Goal: Wealth Building');
      }
    });

    cy.screenshot('05-step5-strategy-complete');
    cy.wait(2000);

    // Complete Analysis - Find the analyze button
    cy.log('🚀 COMPLETING ANALYSIS...');

    cy.get('button').then($buttons => {
      const buttons = Array.from($buttons);

      // Find enabled analyze/complete button
      const analyzeBtn = buttons.find(btn => {
        const text = btn.textContent || '';
        return (text.includes('Analyze') ||
                text.includes('Complete') ||
                text.includes('Finish')) &&
               !btn.disabled;
      });

      if (analyzeBtn) {
        cy.wrap(analyzeBtn).click();
        cy.log(`🚀 Clicked: "${analyzeBtn.textContent}"`);
      } else {
        cy.log('❌ No enabled analyze button found - logging all buttons:');
        buttons.forEach((btn, index) => {
          cy.log(`  ${index}: "${btn.textContent}" (disabled: ${btn.disabled})`);
        });
      }
    });

    // Wait for Investment Decision Engine processing
    cy.log('⏳ Waiting for Investment Decision Engine v2.1 processing...');
    cy.wait(20000);

    // Navigate to results page
    cy.log('📊 Looking for results page...');

    // Try multiple ways to get to results
    cy.get('body').then($body => {
      const bodyText = $body.text();

      if (bodyText.includes('Analysis Results')) {
        cy.get('button:contains("Analysis Results"), a:contains("Analysis Results")').click();
        cy.wait(5000);
        cy.log('✅ Navigated to Analysis Results tab');
      } else if (bodyText.includes('Investment Decision')) {
        cy.log('✅ Already on Investment Decision page');
      } else {
        cy.log('❓ Unclear page state, taking screenshot for analysis');
      }
    });

    // Take screenshot of final state
    cy.screenshot('06-final-results-state');

    // EXTRACT REAL INVESTMENT DECISION ENGINE DATA
    cy.get('body').then($body => {
      const bodyText = $body.text();
      const timestamp = new Date().toISOString();

      cy.log('🔬 EXTRACTING REAL INVESTMENT DECISION ENGINE DATA...');

      // Initialize extraction object
      const realEngineData = {
        timestamp,
        testType: 'QE_REAL_Investment_Decision_Engine_Extraction',
        property: testProperty,
        extractionMethod: 'Live_E2E_Test',
        verdict: null,
        dealQualityScore: null,
        financialMetrics: {},
        pageState: {
          hasAnalysisResults: bodyText.includes('Analysis Results'),
          hasInvestmentDecision: bodyText.includes('Investment Decision'),
          hasPropertyWizard: bodyText.includes('Property Analysis Wizard'),
          bodyTextLength: bodyText.length
        },
        rawExtract: bodyText.substring(0, 10000) // First 10k chars for analysis
      };

      // Extract Verdict (BUY, NEGOTIATE, CAUTION, PASS)
      let verdict = 'NOT_FOUND';
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
      realEngineData.verdict = verdict;

      // Extract Deal Quality Score
      const scoreMatches = [
        bodyText.match(/(\d{1,3})\/100/),
        bodyText.match(/Score[:\s]*(\d{1,3})/i),
        bodyText.match(/Quality[:\s]*(\d{1,3})/i)
      ];
      const scoreMatch = scoreMatches.find(match => match !== null);
      if (scoreMatch) {
        realEngineData.dealQualityScore = parseInt(scoreMatch[1]);
      }

      // Extract Financial Metrics
      const capRateMatch = bodyText.match(/Cap Rate[:\s]*([0-9]+\.?[0-9]*)%/i);
      if (capRateMatch) realEngineData.financialMetrics.capRate = parseFloat(capRateMatch[1]);

      const cashFlowMatch = bodyText.match(/Cash Flow[:\s]*\$?([+-]?\d+(?:,\d{3})*)/i);
      if (cashFlowMatch) realEngineData.financialMetrics.monthlyCashFlow = cashFlowMatch[1].replace(/,/g, '');

      const irrMatch = bodyText.match(/IRR[:\s]*([0-9]+\.?[0-9]*)%/i);
      if (irrMatch) realEngineData.financialMetrics.irr = parseFloat(irrMatch[1]);

      const cocMatch = bodyText.match(/Cash.*Return[:\s]*([0-9]+\.?[0-9]*)%/i);
      if (cocMatch) realEngineData.financialMetrics.cashOnCashReturn = parseFloat(cocMatch[1]);

      const rentMatch = bodyText.match(/Rent[:\s]*\$?(\d+(?:,\d{3})*)/i);
      if (rentMatch) realEngineData.financialMetrics.monthlyRent = rentMatch[1].replace(/,/g, '');

      // Data Quality Assessment
      realEngineData.dataQuality = {
        verdictExtracted: verdict !== 'NOT_FOUND',
        scoreExtracted: realEngineData.dealQualityScore !== null,
        metricsCount: Object.keys(realEngineData.financialMetrics).length,
        extractionSuccess: verdict !== 'NOT_FOUND' || realEngineData.dealQualityScore !== null,
        reachedResultsPage: bodyText.includes('Analysis Results') || bodyText.includes('Investment Decision')
      };

      // LOG REAL EXTRACTION RESULTS
      cy.log('================================================================');
      cy.log('🔬 REAL INVESTMENT DECISION ENGINE DATA EXTRACTION');
      cy.log('================================================================');
      cy.log(`🎯 VERDICT: ${verdict}`);
      cy.log(`🏆 DEAL QUALITY SCORE: ${realEngineData.dealQualityScore || 'NOT FOUND'}`);
      cy.log('💰 FINANCIAL METRICS:');
      Object.entries(realEngineData.financialMetrics).forEach(([key, value]) => {
        cy.log(`   ${key}: ${value}`);
      });
      cy.log('📊 PAGE STATE:');
      Object.entries(realEngineData.pageState).forEach(([key, value]) => {
        cy.log(`   ${key}: ${value}`);
      });
      cy.log(`✅ EXTRACTION SUCCESS: ${realEngineData.dataQuality.extractionSuccess}`);
      cy.log('================================================================');

      // Save REAL data for validation
      const fileName = `REAL-investment-engine-data-${Date.now()}.json`;
      cy.writeFile(`cypress/fixtures/${fileName}`, realEngineData);
      cy.log(`💾 REAL DATA SAVED: cypress/fixtures/${fileName}`);

      // Assertions
      expect(realEngineData.dataQuality.extractionSuccess, 'Should extract at least verdict or score').to.be.true;
    });

    cy.log('🎯 REAL Investment Decision Engine data extraction completed');
  });
});