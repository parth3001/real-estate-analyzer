/**
 * QE Engineer: Investment Decision Engine Data Extraction for AI Auditing
 *
 * PURPOSE: Extract complete Investment Decision Engine analysis results
 * for independent AI validation and auditing
 *
 * BASED ON: Gold standard anna-tx-aggressive-investor-test.cy.js (100% pass rate)
 * ENHANCED: Complete data extraction for AI auditing capability
 */

describe('QE: Investment Decision Engine Data Extraction for AI Audit', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should extract complete Investment Decision Engine data for AI audit validation', () => {
    cy.log('🔬 QE ENGINEER: Extracting Investment Decision Engine data for AI auditing');
    cy.log('📊 Target: Complete analysis JSON for independent validation');

    // Test Property: Same as gold standard test
    const testProperty = {
      address: '1837 Walnut Way, Anna, TX 75409',
      purchasePrice: 245000,
      downPayment: 20, // %
      interestRate: 7.5,
      loanTerm: 30,
      investorProfile: 'aggressive'
    };

    cy.log(`📍 Property: ${testProperty.address}`);
    cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
    cy.log('🎯 Investor Profile: AGGRESSIVE (for maximum data richness)');

    // Navigate to Property Wizard
    cy.visit('/');
    cy.wait(2000);
    cy.screenshot('01-data-extraction-dashboard');

    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // STEP 1: Property Address & Details
    cy.log('📍 STEP 1: Property Address & Details');

    // Enter address components separately (new wizard format)
    cy.get('input[placeholder*="City"]').clear().type('Anna');
    cy.wait(1000);
    cy.get('input[placeholder*="State"]').clear().type('TX');
    cy.wait(1000);
    cy.get('input[placeholder*="ZIP"]').clear().type('75409');
    cy.wait(1000);

    // Enter street address
    cy.get('input').first().clear().type('1837 Walnut Way');
    cy.wait(5000); // RentCast auto-population

    cy.screenshot('02-data-extraction-address');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 2: Purchase & Financing
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

    cy.screenshot('03-data-extraction-financing');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 3: Rental Analysis
    cy.log('🏠 STEP 3: Rental Analysis');
    cy.screenshot('04-data-extraction-rental');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 4: Long-term Assumptions
    cy.log('📈 STEP 4: Long-term Assumptions');
    cy.screenshot('05-data-extraction-assumptions');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 5: Investment Goals & Strategy - AGGRESSIVE PROFILE
    cy.log('🔥 STEP 5: Investment Goals & Strategy - AGGRESSIVE INVESTOR');

    // Set Aggressive Investor Profile for rich data
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

    cy.screenshot('06-data-extraction-strategy');
    cy.wait(2000);

    // Complete Analysis
    cy.log('🚀 INITIATING INVESTMENT DECISION ENGINE ANALYSIS...');
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn =>
        btn.textContent.includes('Complete') ||
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
        cy.log('🚀 Analysis initiated - Extracting Investment Decision Engine v2.1 data...');
      }
    });

    // Wait for Investment Decision Engine (Critical for data accuracy)
    cy.log('⏳ Waiting for Investment Decision Engine v2.1 complete analysis...');
    cy.wait(15000);

    // Navigate to results if needed
    cy.get('body').then($body => {
      if ($body.find('button:contains("Analysis Results")').length > 0) {
        cy.get('button:contains("Analysis Results")').click();
        cy.wait(5000);
        cy.log('📊 Navigated to Analysis Results tab');
      }
    });

    // Capture Final Results Screenshot
    cy.screenshot('07-data-extraction-final-results');
    cy.log('📊 ANALYSIS COMPLETE - Extracting data for AI audit...');

    // COMPREHENSIVE DATA EXTRACTION FOR AI AUDITING
    cy.get('body').then($body => {
      const bodyText = $body.text();
      const bodyHTML = $body.html();

      // Initialize extraction object
      const extractedData = {
        property: testProperty,
        timestamp: new Date().toISOString(),
        testType: 'QE_Investment_Decision_Engine_Data_Extraction',
        engineVersion: 'v2.1',
        extractionMethod: 'DOM_Text_Parsing'
      };

      // 1. EXTRACT INVESTMENT VERDICT (4 categories)
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
      extractedData.verdict = verdict;

      // 2. EXTRACT DEAL QUALITY SCORE (0-100)
      const scoreMatch = bodyText.match(/(\d{1,3})\/100|Property Quality.*?(\d{1,3})|Deal Quality.*?(\d{1,3})/i);
      extractedData.dealQualityScore = scoreMatch ? (scoreMatch[1] || scoreMatch[2] || scoreMatch[3]) : null;

      // 3. EXTRACT FINANCIAL METRICS
      const metrics = {};

      // Cap Rate
      const capRateMatch = bodyText.match(/Cap Rate[:\s]*([0-9]+\.?[0-9]*)%/i);
      metrics.capRate = capRateMatch ? parseFloat(capRateMatch[1]) : null;

      // Monthly Cash Flow
      const cashFlowMatch = bodyText.match(/Cash Flow[:\s]*\$?([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      metrics.monthlyCashFlow = cashFlowMatch ? cashFlowMatch[1].replace(/,/g, '') : null;

      // IRR (Internal Rate of Return)
      const irrMatch = bodyText.match(/IRR[:\s]*([0-9]+\.?[0-9]*)%/i);
      metrics.irr = irrMatch ? parseFloat(irrMatch[1]) : null;

      // Cash-on-Cash Return
      const cocMatch = bodyText.match(/Cash.*Return[:\s]*([0-9]+\.?[0-9]*)%/i);
      metrics.cashOnCashReturn = cocMatch ? parseFloat(cocMatch[1]) : null;

      // Monthly Rent
      const rentMatch = bodyText.match(/rent[:\s]*\$?(\d+(?:,\d{3})*)/i) || bodyText.match(/\$(\d+(?:,\d{3})*).*rent/i);
      metrics.monthlyRent = rentMatch ? rentMatch[1].replace(/,/g, '') : null;

      // DSCR (Debt Service Coverage Ratio)
      const dscrMatch = bodyText.match(/DSCR[:\s]*([0-9]+\.?[0-9]*)/i);
      metrics.dscr = dscrMatch ? parseFloat(dscrMatch[1]) : null;

      extractedData.financialMetrics = metrics;

      // 4. EXTRACT AI CONTENT (If available)
      const aiContent = {};

      // Strategic Action Plan
      if (bodyText.includes('Strategic Action Plan') || bodyText.includes('Action Plan')) {
        const actionPlanMatch = bodyText.match(/Strategic Action Plan[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/s);
        aiContent.strategicActionPlan = actionPlanMatch ? actionPlanMatch[1].trim() : null;
      }

      // Capital Strategy
      if (bodyText.includes('Capital Strategy') || bodyText.includes('Financing Strategy')) {
        const capitalStrategyMatch = bodyText.match(/Capital Strategy[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/s);
        aiContent.capitalStrategy = capitalStrategyMatch ? capitalStrategyMatch[1].trim() : null;
      }

      extractedData.aiContent = aiContent;

      // 5. EXTRACT INVESTMENT DECISION ENGINE REASONING
      const reasoning = {};

      // Walk-away price if mentioned
      const walkAwayMatch = bodyText.match(/walk[- ]?away.*?\$?(\d+(?:,\d{3})*)/i);
      reasoning.walkAwayPrice = walkAwayMatch ? walkAwayMatch[1].replace(/,/g, '') : null;

      // Risk factors if mentioned
      if (bodyText.includes('risk') || bodyText.includes('concern')) {
        const riskMatch = bodyText.match(/(risk|concern)[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is);
        reasoning.riskFactors = riskMatch ? riskMatch[2].trim() : null;
      }

      extractedData.reasoning = reasoning;

      // 6. QUALITY VALIDATION
      extractedData.dataQuality = {
        verdictExtracted: verdict !== 'UNKNOWN',
        scoreExtracted: extractedData.dealQualityScore !== null,
        metricsCount: Object.values(metrics).filter(v => v !== null).length,
        aiContentAvailable: Object.keys(aiContent).length > 0,
        extractionComplete: verdict !== 'UNKNOWN' && extractedData.dealQualityScore !== null
      };

      // LOG EXTRACTED DATA FOR QE VALIDATION
      cy.log('================================================================');
      cy.log('🔬 QE DATA EXTRACTION FOR AI AUDIT - COMPLETE');
      cy.log('================================================================');
      cy.log('📊 INVESTMENT DECISION ENGINE RESULTS:');
      cy.log(`🎯 Verdict: ${verdict}`);
      cy.log(`🏆 Deal Quality Score: ${extractedData.dealQualityScore}/100`);
      cy.log('💰 FINANCIAL METRICS:');
      cy.log(`   Cap Rate: ${metrics.capRate}%`);
      cy.log(`   Monthly Cash Flow: $${metrics.monthlyCashFlow}`);
      cy.log(`   IRR: ${metrics.irr}%`);
      cy.log(`   Cash-on-Cash: ${metrics.cashOnCashReturn}%`);
      cy.log(`   Monthly Rent: $${metrics.monthlyRent}`);
      cy.log(`   DSCR: ${metrics.dscr}`);
      cy.log('🤖 AI CONTENT AVAILABLE:');
      cy.log(`   Strategic Action Plan: ${aiContent.strategicActionPlan ? 'YES' : 'NO'}`);
      cy.log(`   Capital Strategy: ${aiContent.capitalStrategy ? 'YES' : 'NO'}`);
      cy.log('✅ DATA QUALITY CHECK:');
      cy.log(`   Verdict Extracted: ${extractedData.dataQuality.verdictExtracted}`);
      cy.log(`   Score Extracted: ${extractedData.dataQuality.scoreExtracted}`);
      cy.log(`   Metrics Count: ${extractedData.dataQuality.metricsCount}/6`);
      cy.log(`   Extraction Complete: ${extractedData.dataQuality.extractionComplete}`);
      cy.log('================================================================');

      // SAVE EXTRACTED DATA TO FILE FOR AI AUDITING
      const dataFileName = `investment-decision-engine-data-${Date.now()}.json`;
      cy.writeFile(`cypress/fixtures/${dataFileName}`, extractedData);
      cy.log(`💾 Data saved to: cypress/fixtures/${dataFileName}`);
      cy.log('🚀 Ready for independent AI audit validation!');

      // ASSERTIONS FOR QE VALIDATION
      cy.wrap(extractedData.verdict).should('not.equal', 'UNKNOWN');
      cy.wrap(extractedData.dealQualityScore).should('not.be.null');
      cy.wrap(extractedData.dataQuality.extractionComplete).should('be.true');

      // Store in Cypress alias for potential further testing
      cy.wrap(extractedData).as('investmentDecisionEngineData');
    });

    cy.log('🎯 QE Investment Decision Engine data extraction completed successfully');
  });
});