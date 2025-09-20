/**
 * QE Engineer: Final Data Extraction Test
 * Based on working gold standard test with data extraction added
 */

describe('QE: Investment Decision Engine Data Extraction - Final', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should extract Investment Decision Engine data for AI audit', () => {
    cy.log('🔬 QE ENGINEER: Investment Decision Engine Data Extraction');
    cy.log('🎯 OBJECTIVE: Extract complete analysis data for AI validation');

    // Test Property Configuration
    const testProperty = {
      address: '1837 Walnut Way, Anna, TX 75409',
      purchasePrice: 245000,
      downPayment: 20,
      interestRate: 7.5,
      loanTerm: 30
    };

    cy.log(`📍 Property: ${testProperty.address}`);
    cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
    cy.log('🔥 Investor Profile: AGGRESSIVE');

    // Navigate to Property Wizard
    cy.visit('/');
    cy.wait(2000);

    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // STEP 1: Property Address
    cy.log('📍 STEP 1: Property Address');
    cy.get('input[placeholder*="address"], input[type="text"]').first()
      .clear()
      .type(testProperty.address);
    cy.wait(5000); // RentCast auto-population

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
        cy.log(`✅ Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
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
    cy.log('🏠 STEP 3: Rental Analysis');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 4: Long-term Assumptions
    cy.log('📈 STEP 4: Long-term Assumptions');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 5: Investment Strategy - AGGRESSIVE
    cy.log('🔥 STEP 5: Investment Strategy - AGGRESSIVE');

    cy.get('body').then($body => {
      if ($body.find('button:contains("High")').length > 0) {
        cy.get('button:contains("High")').click();
        cy.log('✅ Risk Tolerance: High');
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Wealth Building")').length > 0) {
        cy.get('button:contains("Wealth Building")').click();
        cy.log('✅ Investment Goal: Wealth Building');
      }
    });

    cy.get('body').then($body => {
      if ($body.find('button:contains("Medium-term")').length > 0) {
        cy.get('button:contains("Medium-term")').click();
        cy.log('✅ Time Horizon: Medium-term');
      }
    });

    cy.wait(2000);

    // Complete Analysis
    cy.log('🚀 INITIATING ANALYSIS...');
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn =>
        btn.textContent.includes('Complete') ||
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
        cy.log('⏳ Analysis initiated, waiting for results...');
      }
    });

    // Wait for Investment Decision Engine
    cy.log('⏳ Waiting for Investment Decision Engine v2.1...');
    cy.wait(15000);

    // Try to click on Analysis Results tab if available
    cy.get('body').then($body => {
      if ($body.find('button:contains("Analysis Results")').length > 0) {
        cy.get('button:contains("Analysis Results")').first().click();
        cy.wait(5000);
        cy.log('📊 Navigated to Analysis Results');
      } else if ($body.find('a:contains("Analysis Results")').length > 0) {
        cy.get('a:contains("Analysis Results")').first().click();
        cy.wait(5000);
        cy.log('📊 Navigated to Analysis Results via link');
      }
    });

    // Take screenshot of results
    cy.screenshot('final-analysis-results');

    // EXTRACT ALL DATA FOR AI AUDIT
    cy.get('body').then($body => {
      const bodyText = $body.text();
      const timestamp = new Date().toISOString();

      // Initialize comprehensive extraction object
      const extractedData = {
        metadata: {
          timestamp,
          testType: 'QE_Investment_Decision_Engine_Extraction',
          engineVersion: 'v2.1',
          property: testProperty
        },
        verdict: null,
        dealQualityScore: null,
        financialMetrics: {},
        aiContent: {},
        rawTextExtract: null
      };

      // Extract Verdict (BUY, NEGOTIATE, CAUTION, PASS)
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

      // Extract Deal Quality Score
      const scoreMatch = bodyText.match(/(\d{1,3})\/100|Score.*?(\d{1,3})|Quality.*?(\d{1,3})/i);
      if (scoreMatch) {
        extractedData.dealQualityScore = parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
      }

      // Extract Financial Metrics
      const capRateMatch = bodyText.match(/Cap Rate[:\s]*([0-9]+\.?[0-9]*)%/i);
      if (capRateMatch) extractedData.financialMetrics.capRate = parseFloat(capRateMatch[1]);

      const cashFlowMatch = bodyText.match(/Cash Flow[:\s]*\$?([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      if (cashFlowMatch) extractedData.financialMetrics.monthlyCashFlow = cashFlowMatch[1].replace(/,/g, '');

      const irrMatch = bodyText.match(/IRR[:\s]*([0-9]+\.?[0-9]*)%/i);
      if (irrMatch) extractedData.financialMetrics.irr = parseFloat(irrMatch[1]);

      const cocMatch = bodyText.match(/Cash.*Return[:\s]*([0-9]+\.?[0-9]*)%/i);
      if (cocMatch) extractedData.financialMetrics.cashOnCashReturn = parseFloat(cocMatch[1]);

      const rentMatch = bodyText.match(/Monthly Rent[:\s]*\$?(\d+(?:,\d{3})*)/i);
      if (rentMatch) extractedData.financialMetrics.monthlyRent = rentMatch[1].replace(/,/g, '');

      const dscrMatch = bodyText.match(/DSCR[:\s]*([0-9]+\.?[0-9]*)/i);
      if (dscrMatch) extractedData.financialMetrics.dscr = parseFloat(dscrMatch[1]);

      // Store raw text for AI analysis (first 10000 chars)
      extractedData.rawTextExtract = bodyText.substring(0, 10000);

      // Quality check
      const dataQuality = {
        verdictExtracted: verdict !== 'UNKNOWN',
        scoreExtracted: extractedData.dealQualityScore !== null,
        metricsCount: Object.keys(extractedData.financialMetrics).length,
        extractionSuccess: verdict !== 'UNKNOWN' && extractedData.dealQualityScore !== null
      };
      extractedData.dataQuality = dataQuality;

      // LOG EXTRACTED DATA
      cy.log('================================================================');
      cy.log('🔬 QE DATA EXTRACTION COMPLETE');
      cy.log('================================================================');
      cy.log(`🎯 VERDICT: ${verdict}`);
      cy.log(`🏆 DEAL QUALITY SCORE: ${extractedData.dealQualityScore || 'NOT FOUND'}/100`);
      cy.log('💰 FINANCIAL METRICS EXTRACTED:');
      Object.entries(extractedData.financialMetrics).forEach(([key, value]) => {
        cy.log(`   ${key}: ${value}`);
      });
      cy.log(`✅ EXTRACTION SUCCESS: ${dataQuality.extractionSuccess}`);
      cy.log(`📊 METRICS FOUND: ${dataQuality.metricsCount}`);
      cy.log('================================================================');

      // SAVE TO FILE FOR AI AUDITING
      const fileName = `investment-engine-extraction-${Date.now()}.json`;
      cy.writeFile(`cypress/fixtures/${fileName}`, extractedData, 'utf8');
      cy.log(`💾 DATA SAVED TO: cypress/fixtures/${fileName}`);
      cy.log('🚀 READY FOR AI AUDIT VALIDATION');

      // Also log to task for visibility
      cy.task('log', `QE_EXTRACTION_COMPLETE: ${verdict} (Score: ${extractedData.dealQualityScore}/100)`);

      // Assertions
      expect(verdict, 'Verdict should be extracted').to.not.equal('UNKNOWN');
      expect(extractedData.dealQualityScore, 'Score should be extracted').to.not.be.null;
      expect(dataQuality.metricsCount, 'Should extract at least 3 metrics').to.be.at.least(3);
    });

    cy.log('🎯 QE Data extraction for AI audit completed successfully');
  });
});