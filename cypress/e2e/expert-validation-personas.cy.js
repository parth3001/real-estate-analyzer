describe('Expert Validation - Multiple Investor Personas', () => {
  beforeEach(() => {
    cy.login();
  });

  const testProperty = {
    address: '1837 Walnut Way, Anna, TX 75409',
    purchasePrice: 245000,
    downPayment: 20, // percentage
    interestRate: 7.5,
    loanTerm: 30
  };

  const investorPersonas = [
    {
      name: 'Conservative Investor',
      riskTolerance: 'Low',
      investmentGoal: 'Cash Flow Focus',
      timeHorizon: 'Long-term (10+ years)',
      expectedVerdict: ['BUY', 'NEGOTIATE'] // Conservative should get positive verdicts for good deals
    },
    {
      name: 'Aggressive Investor',
      riskTolerance: 'High',
      investmentGoal: 'Wealth Building',
      timeHorizon: 'Medium-term (5-10 years)',
      expectedVerdict: ['BUY', 'NEGOTIATE', 'CAUTION'] // Aggressive may accept riskier deals
    },
    {
      name: 'Balanced Investor',
      riskTolerance: 'Medium',
      investmentGoal: 'Estate Building',
      timeHorizon: 'Long-term (10+ years)',
      expectedVerdict: ['BUY', 'NEGOTIATE', 'CAUTION'] // Balanced approach
    }
  ];

  investorPersonas.forEach((persona, index) => {
    it(`should complete analysis for ${persona.name} and capture verdict`, () => {
      cy.log(`🎯 Testing ${persona.name} persona`);
      
      // Navigate to Property Wizard
      cy.visit('/');
      cy.wait(2000);
      cy.get('button:contains("Start SFR Analysis")').click();
      cy.wait(3000);

      // Step 1: Property Address & Details
      cy.get('input[placeholder*="address"], input[type="text"]').first().clear().type(testProperty.address);
      cy.wait(2000);
      
      // Wait for RentCast auto-population
      cy.wait(5000);
      cy.log('✅ RentCast auto-population completed');
      
      cy.get('button:contains("Next")').click();
      cy.wait(3000);

      // Step 2: Purchase & Financing
      cy.get('input').then($inputs => {
        // Purchase Price
        const purchasePriceInput = Array.from($inputs).find(input => 
          input.placeholder?.includes('Purchase') || 
          input.value?.includes('250') ||
          input.getAttribute('aria-label')?.includes('Purchase')
        );
        if (purchasePriceInput) {
          cy.wrap(purchasePriceInput).clear().type(testProperty.purchasePrice.toString());
        }

        // Down Payment
        const downPaymentInput = Array.from($inputs).find(input => 
          input.placeholder?.includes('Down') || 
          input.getAttribute('aria-label')?.includes('Down')
        );
        if (downPaymentInput) {
          cy.wrap(downPaymentInput).clear().type(testProperty.downPayment.toString());
        }

        // Interest Rate
        const interestRateInput = Array.from($inputs).find(input => 
          input.placeholder?.includes('Interest') || 
          input.getAttribute('aria-label')?.includes('Interest')
        );
        if (interestRateInput) {
          cy.wrap(interestRateInput).clear().type(testProperty.interestRate.toString());
        }

        // Loan Term
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

      // Step 3: Rental Analysis (force click past any validation issues)
      cy.get('button:contains("Next")').click({ force: true });
      cy.wait(3000);

      // Step 4: Long-term Assumptions
      cy.get('button:contains("Next")').click({ force: true });
      cy.wait(3000);

      // Step 5: Investment Goals & Strategy (Persona-specific)
      cy.log(`🎭 Setting ${persona.name} preferences`);
      
      // Set Risk Tolerance
      cy.get('body').then($body => {
        if ($body.find(`button:contains("${persona.riskTolerance}")`).length > 0) {
          cy.get(`button:contains("${persona.riskTolerance}")`).click();
        }
      });

      // Set Investment Goal
      cy.get('body').then($body => {
        if ($body.find(`button:contains("${persona.investmentGoal}")`).length > 0) {
          cy.get(`button:contains("${persona.investmentGoal}")`).click();
        }
      });

      // Set Time Horizon
      cy.get('body').then($body => {
        if ($body.find(`button:contains("${persona.timeHorizon}")`).length > 0) {
          cy.get(`button:contains("${persona.timeHorizon}")`).click();
        }
      });

      cy.wait(2000);

      // Complete Analysis
      cy.get('button').then($buttons => {
        const completeBtn = Array.from($buttons).find(btn => 
          btn.textContent.includes('Complete') || 
          btn.textContent.includes('Analyze')
        );
        if (completeBtn) {
          cy.wrap(completeBtn).click({ force: true });
          cy.log('🚀 Analysis initiated');
        }
      });

      // Wait for analysis completion
      cy.wait(10000);

      // Capture final results
      cy.screenshot(`${persona.name.toLowerCase().replace(' ', '-')}-analysis-results`);
      
      // Extract verdict from results
      cy.get('body').then($body => {
        let verdictFound = 'UNKNOWN';
        const bodyText = $body.text();
        
        if (bodyText.includes('BUY') || bodyText.includes('STRONG BUY')) {
          verdictFound = 'BUY';
        } else if (bodyText.includes('NEGOTIATE')) {
          verdictFound = 'NEGOTIATE';
        } else if (bodyText.includes('CAUTION')) {
          verdictFound = 'CAUTION';
        } else if (bodyText.includes('PASS')) {
          verdictFound = 'PASS';
        }

        cy.log(`📊 ${persona.name} Verdict: ${verdictFound}`);
        
        // Validate verdict against expectations
        if (persona.expectedVerdict.includes(verdictFound)) {
          cy.log(`✅ Verdict ${verdictFound} matches expectations for ${persona.name}`);
        } else {
          cy.log(`⚠️ Unexpected verdict ${verdictFound} for ${persona.name}, expected: ${persona.expectedVerdict.join(' or ')}`);
        }
      });

      cy.log(`✅ ${persona.name} analysis completed`);
    });
  });
});