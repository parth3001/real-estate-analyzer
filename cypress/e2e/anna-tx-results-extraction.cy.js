describe('Anna, TX Results Extraction', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should extract results from Anna, TX analysis', () => {
    cy.log('🎯 EXTRACTING ANNA, TX ANALYSIS RESULTS');
    
    // Test Property Details
    const testProperty = {
      address: '1837 Walnut Way, Anna, TX 75409',
      purchasePrice: 245000
    };

    cy.log(`📍 Property: ${testProperty.address}`);
    cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);

    // Navigate to Property Wizard and complete quickly
    cy.visit('/');
    cy.wait(2000);
    
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // Step 1: Enter Anna, TX address
    cy.get('input[placeholder*="address"], input[type="text"]').first().clear().type(testProperty.address);
    cy.wait(5000); // RentCast auto-population
    
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Step 2: Set purchase price to $245,000
    cy.get('input').then($inputs => {
      const purchasePriceInput = Array.from($inputs).find(input => 
        input.placeholder?.includes('Purchase') || 
        input.value?.includes('245') ||
        input.getAttribute('aria-label')?.includes('Purchase')
      );
      if (purchasePriceInput) {
        cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
      }
    });

    // Force-click through remaining steps
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(2000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(2000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(2000);
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(2000);

    // Complete analysis
    cy.get('button').then($buttons => {
      const completeBtn = Array.from($buttons).find(btn => 
        btn.textContent.includes('Complete') || 
        btn.textContent.includes('Analyze')
      );
      if (completeBtn) {
        cy.wrap(completeBtn).click({ force: true });
      }
    });

    // Wait for results and extract comprehensive data
    cy.wait(15000);
    
    cy.get('body').then($body => {
      const bodyText = $body.text();
      
      // Extract all possible metrics
      let verdict = 'UNKNOWN';
      let score = 'Unknown';
      let rent = 'Unknown';
      let capRate = 'Unknown';
      let cashFlow = 'Unknown';
      let irr = 'Unknown';
      let cocReturn = 'Unknown';
      let monthlyPayment = 'Unknown';
      let totalExpenses = 'Unknown';

      // Investment Verdict
      if (bodyText.includes('STRONG BUY')) verdict = 'STRONG BUY';
      else if (bodyText.includes('BUY')) verdict = 'BUY';
      else if (bodyText.includes('NEGOTIATE')) verdict = 'NEGOTIATE';
      else if (bodyText.includes('CAUTION')) verdict = 'CAUTION';
      else if (bodyText.includes('PASS')) verdict = 'PASS';

      // Property Quality Score
      const scoreMatch = bodyText.match(/(\d{1,2})\/100/) || bodyText.match(/Score.*?(\d{1,2})/);
      if (scoreMatch) score = scoreMatch[1];

      // Financial Metrics
      const rentMatch = bodyText.match(/\$(\d+,?\d+).*(?:rent|month)/i) || bodyText.match(/(?:rent|monthly).*?\$(\d+,?\d+)/i);
      if (rentMatch) rent = `$${rentMatch[1]}`;

      const capMatch = bodyText.match(/(\d+\.?\d*)%.*cap/i) || bodyText.match(/cap.*?(\d+\.?\d*)%/i);
      if (capMatch) capRate = `${capMatch[1]}%`;

      const cashMatch = bodyText.match(/cash flow.*?\$(\d+,?\d+)/i) || bodyText.match(/\$(\d+,?\d+).*cash flow/i);
      if (cashMatch) cashFlow = `$${cashMatch[1]}`;

      const irrMatch = bodyText.match(/IRR.*?(\d+\.?\d*)%/i);
      if (irrMatch) irr = `${irrMatch[1]}%`;

      const cocMatch = bodyText.match(/cash.*return.*?(\d+\.?\d*)%/i);
      if (cocMatch) cocReturn = `${cocMatch[1]}%`;

      const paymentMatch = bodyText.match(/payment.*?\$(\d+,?\d+)/i) || bodyText.match(/\$(\d+,?\d+).*payment/i);
      if (paymentMatch) monthlyPayment = `$${paymentMatch[1]}`;

      const expensesMatch = bodyText.match(/expenses.*?\$(\d+,?\d+)/i) || bodyText.match(/\$(\d+,?\d+).*expenses/i);
      if (expensesMatch) totalExpenses = `$${expensesMatch[1]}`;

      // Log comprehensive results
      cy.log('=========================================');
      cy.log('🏡 ANNA, TX PROPERTY ANALYSIS RESULTS');
      cy.log('=========================================');
      cy.log(`📍 Address: ${testProperty.address}`);
      cy.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
      cy.log(`🎯 Investment Verdict: ${verdict}`);
      cy.log(`🏆 Property Quality Score: ${score}/100`);
      cy.log(`🏠 Monthly Rent: ${rent}`);
      cy.log(`📊 Cap Rate: ${capRate}`);
      cy.log(`💵 Monthly Cash Flow: ${cashFlow}`);
      cy.log(`📈 IRR: ${irr}`);
      cy.log(`💎 Cash-on-Cash Return: ${cocReturn}`);
      cy.log(`🏦 Monthly Payment: ${monthlyPayment}`);
      cy.log(`💸 Total Expenses: ${totalExpenses}`);
      cy.log('=========================================');

      // Anna, TX Market Context Analysis
      cy.log('🏘️ ANNA, TX MARKET ANALYSIS:');
      cy.log('• Location: Dallas-Fort Worth suburb');
      cy.log('• Market Type: Growing suburban community');
      cy.log('• Demographics: Family-oriented, good schools');
      cy.log('• Rent Range: $1,800-2,200 for 3BR homes');
      cy.log('• Cap Rates: Typically 6-8%');
      cy.log('• Investment Grade: Good for buy-and-hold');

      // Expert Validation Assessment
      const isStrongVerdict = ['BUY', 'STRONG BUY'].includes(verdict);
      const isPositiveVerdict = ['BUY', 'NEGOTIATE', 'STRONG BUY'].includes(verdict);
      const numericScore = parseInt(score);

      cy.log('📊 EXPERT VALIDATION ASSESSMENT:');
      if (isStrongVerdict && numericScore >= 70) {
        cy.log('✅ EXCELLENT: Strong buy signal with high score');
      } else if (isPositiveVerdict && numericScore >= 60) {
        cy.log('✅ GOOD: Positive verdict with reasonable score');
      } else if (isPositiveVerdict) {
        cy.log('⚠️ MODERATE: Positive verdict but lower score');
      } else {
        cy.log('❌ CAUTION: Negative verdict - review needed');
      }

      // Calculate basic metrics for validation
      if (rent !== 'Unknown' && rent.includes('$')) {
        const monthlyRent = parseInt(rent.replace(/[$,]/g, ''));
        const annualRent = monthlyRent * 12;
        const grossYield = ((annualRent / testProperty.purchasePrice) * 100).toFixed(2);
        cy.log(`📈 Calculated Gross Yield: ${grossYield}%`);
        
        if (grossYield >= '8.0') {
          cy.log('✅ Gross yield above 8% - Strong cash flow potential');
        } else if (grossYield >= '6.0') {
          cy.log('👍 Gross yield 6-8% - Reasonable for Dallas suburbs');
        } else {
          cy.log('⚠️ Gross yield below 6% - Lower cash flow potential');
        }
      }

      cy.log('=========================================');
    });

    cy.screenshot('anna-tx-comprehensive-results');
    cy.log('✅ Anna, TX analysis extraction completed');
  });
});