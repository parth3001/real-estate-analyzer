/**
 * QE Engineer: Investment Decision Engine Data Extraction V2
 * Simplified and more robust version for data extraction
 */

describe('QE: Investment Engine Data Extraction V2', () => {
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

  it('should extract complete Investment Decision Engine data for AI validation', () => {
    cy.log('🔬 QE: Starting Investment Decision Engine data extraction');

    const testProperty = {
      street: '1837 Walnut Way',
      city: 'Anna',
      state: 'TX',
      zip: '75409',
      purchasePrice: 245000,
      downPayment: 20,
      interestRate: 7.5,
      loanTerm: 30
    };

    // Navigate to Property Wizard
    cy.visit('/');
    cy.wait(2000);
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // STEP 1: Property Address - Use separate field approach
    cy.log('📍 Entering Property Address');

    // Try to enter the full address first (if single field exists)
    cy.get('body').then($body => {
      const inputs = $body.find('input');
      if (inputs.length > 0) {
        // Try full address in first input
        cy.get('input').first().clear().type(`${testProperty.street}, ${testProperty.city}, ${testProperty.state} ${testProperty.zip}`);
        cy.wait(5000); // Wait for RentCast
      }
    });

    // Click Next (force if needed)
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 2: Purchase Price (Critical for analysis)
    cy.log('💰 Setting Purchase Price');

    // Find and set purchase price
    cy.get('input').each(($input) => {
      const placeholder = $input.attr('placeholder') || '';
      const label = $input.attr('aria-label') || '';

      if (placeholder.toLowerCase().includes('purchase') ||
          label.toLowerCase().includes('purchase')) {
        cy.wrap($input).clear().type(testProperty.purchasePrice.toString());
        cy.log('✅ Purchase price set: $245,000');
      }
    });

    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 3: Skip Rental (use defaults)
    cy.log('🏠 Skipping Rental Analysis (using defaults)');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 4: Skip Assumptions (use defaults)
    cy.log('📈 Skipping Long-term Assumptions (using defaults)');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 5: Investment Strategy - Set Aggressive Profile
    cy.log('🔥 Setting Aggressive Investment Profile');

    // Try button selectors for strategy
    cy.get('body').then($body => {
      // Risk Tolerance
      if ($body.find('button:contains("High")').length > 0) {
        cy.get('button:contains("High")').first().click();
        cy.log('✅ Risk Tolerance: High');
      }

      // Investment Goal
      if ($body.find('button:contains("Wealth Building")').length > 0) {
        cy.get('button:contains("Wealth Building")').first().click();
        cy.log('✅ Goal: Wealth Building');
      }

      // Time Horizon
      if ($body.find('button:contains("Medium")').length > 0) {
        cy.get('button:contains("Medium")').first().click();
        cy.log('✅ Time Horizon: Medium-term');
      }
    });

    cy.wait(2000);

    // Complete Analysis - Try multiple button selectors
    cy.log('🚀 Initiating Analysis...');

    cy.get('button').then($buttons => {
      const buttons = Array.from($buttons);
      const analyzeBtn = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('Analyze') ||
               text.includes('Complete') ||
               text.includes('Finish');
      });

      if (analyzeBtn) {
        cy.wrap(analyzeBtn).click({ force: true });
        cy.log('⏳ Analysis started, waiting for results...');
      }
    });

    // Wait for analysis to complete
    cy.wait(20000);

    // Try to navigate to results tab if available
    cy.get('body').then($body => {
      if ($body.find('button:contains("Analysis Results")').length > 0) {
        cy.get('button:contains("Analysis Results")').click();
        cy.wait(5000);
        cy.log('📊 Navigated to Analysis Results');
      }
    });

    // EXTRACT DATA FOR AI AUDIT
    cy.get('body').then($body => {
      const bodyText = $body.text();

      // Create extraction object
      const extractedData = {
        timestamp: new Date().toISOString(),
        property: {
          address: `${testProperty.street}, ${testProperty.city}, ${testProperty.state} ${testProperty.zip}`,
          purchasePrice: testProperty.purchasePrice
        },
        extractionStatus: 'attempting'
      };

      // Extract Verdict (4 categories: BUY, NEGOTIATE, CAUTION, PASS)
      let verdict = 'NOT_FOUND';
      if (bodyText.includes('STRONG BUY')) verdict = 'STRONG BUY';
      else if (bodyText.includes('BUY')) verdict = 'BUY';
      else if (bodyText.includes('NEGOTIATE')) verdict = 'NEGOTIATE';
      else if (bodyText.includes('CAUTION')) verdict = 'CAUTION';
      else if (bodyText.includes('PASS')) verdict = 'PASS';

      extractedData.verdict = verdict;

      // Extract Deal Quality Score
      const scorePatterns = [
        /(\d{1,3})\/100/,
        /Deal Quality.*?(\d{1,3})/i,
        /Property Quality.*?(\d{1,3})/i,
        /Score.*?(\d{1,3})/i
      ];

      let score = null;
      for (const pattern of scorePatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          score = parseInt(match[1]);
          break;
        }
      }
      extractedData.dealQualityScore = score;

      // Extract Financial Metrics
      const metrics = {};

      // Cap Rate
      const capRateMatch = bodyText.match(/Cap Rate[:\s]*([0-9]+\.?[0-9]*)%/i);
      metrics.capRate = capRateMatch ? parseFloat(capRateMatch[1]) : null;

      // Monthly Cash Flow
      const cashFlowMatch = bodyText.match(/Monthly Cash Flow[:\s]*\$?([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
                           bodyText.match(/Cash Flow[:\s]*\$?([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      metrics.monthlyCashFlow = cashFlowMatch ? cashFlowMatch[1].replace(/,/g, '') : null;

      // IRR
      const irrMatch = bodyText.match(/IRR[:\s]*([0-9]+\.?[0-9]*)%/i) ||
                      bodyText.match(/Internal Rate[:\s]*([0-9]+\.?[0-9]*)%/i);
      metrics.irr = irrMatch ? parseFloat(irrMatch[1]) : null;

      // Cash-on-Cash Return
      const cocMatch = bodyText.match(/Cash-on-Cash[:\s]*([0-9]+\.?[0-9]*)%/i) ||
                      bodyText.match(/CoC[:\s]*([0-9]+\.?[0-9]*)%/i);
      metrics.cashOnCashReturn = cocMatch ? parseFloat(cocMatch[1]) : null;

      extractedData.financialMetrics = metrics;

      // Data Quality Check
      extractedData.dataQuality = {
        verdictFound: verdict !== 'NOT_FOUND',
        scoreFound: score !== null,
        metricsFound: Object.values(metrics).filter(v => v !== null).length,
        extractionSuccess: verdict !== 'NOT_FOUND' && score !== null
      };

      // LOG RESULTS
      cy.log('================================================================');
      cy.log('🔬 QE DATA EXTRACTION RESULTS');
      cy.log('================================================================');
      cy.log(`🎯 Verdict: ${verdict}`);
      cy.log(`🏆 Deal Quality Score: ${score !== null ? score + '/100' : 'NOT FOUND'}`);
      cy.log('💰 FINANCIAL METRICS:');
      cy.log(`   Cap Rate: ${metrics.capRate || 'NOT FOUND'}%`);
      cy.log(`   Monthly Cash Flow: $${metrics.monthlyCashFlow || 'NOT FOUND'}`);
      cy.log(`   IRR: ${metrics.irr || 'NOT FOUND'}%`);
      cy.log(`   Cash-on-Cash: ${metrics.cashOnCashReturn || 'NOT FOUND'}%`);
      cy.log('✅ EXTRACTION STATUS:');
      cy.log(`   Success: ${extractedData.dataQuality.extractionSuccess}`);
      cy.log(`   Metrics Found: ${extractedData.dataQuality.metricsFound}`);
      cy.log('================================================================');

      // Save to file
      const fileName = `investment-engine-data-${Date.now()}.json`;
      cy.writeFile(`cypress/fixtures/${fileName}`, extractedData);
      cy.log(`💾 Data saved to: cypress/fixtures/${fileName}`);

      // Take final screenshot
      cy.screenshot('final-extraction-results');

      // Assertions
      expect(verdict).to.not.equal('NOT_FOUND');
      expect(score).to.not.be.null;
    });
  });
});