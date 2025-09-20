/**
 * QE Engineer: Network Interception Test
 *
 * This approach uses the proven gold standard E2E test but intercepts
 * the API calls to capture Investment Decision Engine data directly.
 *
 * Benefits:
 * - Uses working UI flow (no navigation issues)
 * - Captures actual API responses (no parsing issues)
 * - Gets real Investment Decision Engine data
 */

describe('QE: Network Interception - Investment Decision Engine Data Capture', () => {
  let interceptedData = null;

  beforeEach(() => {
    cy.login();

    // Intercept the Investment Decision Engine API call
    cy.intercept('POST', '**/api/deals/analyze', (req) => {
      cy.log('🔬 QE: Intercepted Investment Decision Engine API call');
      cy.log('📤 Request data:', req.body);
    }).as('analyzeDeal');
  });

  it('should capture Investment Decision Engine data via network interception', () => {
    cy.log('🔬 QE ENGINEER: Network Interception Test');
    cy.log('🎯 OBJECTIVE: Capture real Investment Decision Engine API responses');

    // Use the EXACT same flow as the proven gold standard test
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
    cy.screenshot('01-network-test-dashboard');

    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // STEP 1: Property Address & Details
    cy.log('📍 STEP 1: Property Address & Details');
    cy.get('input[placeholder*="address"], input[type="text"]').first().clear().type(testProperty.address);
    cy.wait(5000); // RentCast auto-population

    cy.screenshot('02-network-test-step1');
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

    cy.screenshot('03-network-test-step2');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 3: Rental Analysis
    cy.log('🏠 STEP 3: Rental Analysis');
    cy.screenshot('04-network-test-step3');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 4: Long-term Assumptions
    cy.log('📈 STEP 4: Long-term Assumptions');
    cy.screenshot('05-network-test-step4');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // STEP 5: Investment Goals & Strategy - AGGRESSIVE PROFILE
    cy.log('🔥 STEP 5: Investment Strategy - AGGRESSIVE');

    cy.get('body').then($body => {
      if ($body.find('button:contains("High")').length > 0) {
        cy.get('button:contains("High")').click();
        cy.log('🔥 Risk Tolerance: High');
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
        cy.log('⚡ Time Horizon: Medium-term');
      }
    });

    cy.screenshot('06-network-test-step5');
    cy.wait(2000);

    // Complete Analysis - This should trigger the API call
    cy.log('🚀 INITIATING ANALYSIS - This will trigger API interception...');
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn =>
        btn.textContent.includes('Complete') ||
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
        cy.log('🚀 Analysis initiated - waiting for API call...');
      }
    });

    // Wait for the API call and capture the response
    cy.wait('@analyzeDeal', { timeout: 60000 }).then((interception) => {
      cy.log('🎯 QE: Investment Decision Engine API call intercepted!');

      // Extract the complete response data
      const apiResponse = interception.response.body;
      const requestData = interception.request.body;

      // Create comprehensive extraction object
      const qeInterceptedData = {
        timestamp: new Date().toISOString(),
        testType: 'QE_Network_Interception_Investment_Decision_Engine',
        property: testProperty,

        // Request data sent to Investment Decision Engine
        requestData: requestData,

        // Complete API response from Investment Decision Engine
        apiResponse: apiResponse,

        // Extracted Investment Decision data
        investmentDecision: apiResponse.investmentDecision || null,
        verdict: apiResponse.investmentDecision?.verdict || 'NOT_FOUND',
        dealQualityScore: apiResponse.investmentDecision?.professionalAssessment?.dealQuality || null,

        // Financial metrics
        financialMetrics: {
          capRate: apiResponse.keyMetrics?.capRate || apiResponse.analysis?.keyMetrics?.capRate,
          irr: apiResponse.keyMetrics?.irr || apiResponse.analysis?.keyMetrics?.irr,
          cashOnCashReturn: apiResponse.keyMetrics?.cashOnCashReturn || apiResponse.analysis?.keyMetrics?.cashOnCashReturn,
          monthlyCashFlow: apiResponse.monthlyAnalysis?.cashFlow || apiResponse.analysis?.monthlyAnalysis?.cashFlow,
          monthlyRent: apiResponse.monthlyAnalysis?.rent || apiResponse.analysis?.monthlyAnalysis?.rent,
          dscr: apiResponse.keyMetrics?.debtServiceCoverageRatio || apiResponse.analysis?.keyMetrics?.dscr
        },

        // AI-generated content
        aiContent: {
          strategicActionPlan: apiResponse.investmentDecision?.actionPlan,
          capitalStrategy: apiResponse.investmentDecision?.capitalStrategy,
          portfolioContext: apiResponse.investmentDecision?.portfolioContext
        },

        // Professional assessment details
        professionalAssessment: apiResponse.investmentDecision?.professionalAssessment || null,

        // Quality assessment
        dataQuality: {
          hasInvestmentDecision: !!apiResponse.investmentDecision,
          hasVerdict: !!(apiResponse.investmentDecision?.verdict),
          hasScore: !!(apiResponse.investmentDecision?.professionalAssessment?.dealQuality),
          hasFinancialMetrics: !!(apiResponse.keyMetrics || apiResponse.analysis?.keyMetrics),
          apiCallSuccessful: interception.response.statusCode === 200,
          responseSize: JSON.stringify(apiResponse).length
        }
      };

      // Log the extracted data
      cy.log('================================================================');
      cy.log('🔬 QE NETWORK INTERCEPTION RESULTS');
      cy.log('================================================================');
      cy.log(`🎯 VERDICT: ${qeInterceptedData.verdict}`);
      cy.log(`🏆 DEAL QUALITY SCORE: ${qeInterceptedData.dealQualityScore || 'NOT FOUND'}/100`);
      cy.log('💰 FINANCIAL METRICS:');
      Object.entries(qeInterceptedData.financialMetrics).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          cy.log(`   ${key}: ${value}`);
        }
      });
      cy.log('📊 DATA QUALITY:');
      Object.entries(qeInterceptedData.dataQuality).forEach(([key, value]) => {
        cy.log(`   ${key}: ${value}`);
      });
      cy.log(`📡 API STATUS: ${interception.response.statusCode}`);
      cy.log(`📦 RESPONSE SIZE: ${qeInterceptedData.dataQuality.responseSize} chars`);
      cy.log('================================================================');

      // Save the intercepted data
      const fileName = `QE-network-intercepted-data-${Date.now()}.json`;
      cy.writeFile(`cypress/fixtures/${fileName}`, qeInterceptedData);
      cy.log(`💾 QE: Intercepted data saved to cypress/fixtures/${fileName}`);

      // Assertions to validate we got real data
      expect(qeInterceptedData.dataQuality.apiCallSuccessful, 'API call should succeed').to.be.true;
      expect(qeInterceptedData.dataQuality.hasInvestmentDecision, 'Should have investment decision').to.be.true;
      expect(qeInterceptedData.verdict, 'Should have a verdict').to.not.equal('NOT_FOUND');
      expect(qeInterceptedData.dealQualityScore, 'Should have deal quality score').to.not.be.null;

      // Store for potential further use
      cy.wrap(qeInterceptedData).as('investmentDecisionData');
    });

    cy.screenshot('07-network-test-completed');
    cy.log('🎯 QE Network Interception Test completed successfully');
  });
});