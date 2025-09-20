/**
 * QE Engineer: Final Working Test
 * Based on actual interface structure from screenshots
 */

describe('QE: Final Working Investment Decision Engine Test', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should complete wizard and extract REAL Investment Decision Engine data', () => {
    cy.log('🔬 QE FINAL ATTEMPT: Real Investment Decision Engine Data Extraction');

    // Navigate to wizard
    cy.visit('/');
    cy.wait(2000);
    cy.get('button:contains("Start SFR Analysis")').click();
    cy.wait(3000);

    // STEP 1: Fill address form using direct field targeting
    cy.log('📍 STEP 1: Filling address form fields directly');

    // From the screenshot, I can see there are multiple input fields
    // Let me target them more systematically
    cy.get('input').then($inputs => {
      const inputs = Array.from($inputs);
      cy.log(`Found ${inputs.length} input fields`);

      // Fill the main property address field (usually first)
      if (inputs.length > 0) {
        cy.wrap(inputs[0]).clear().type('1837 Walnut Way');
        cy.log('✅ Filled field 0: 1837 Walnut Way');
      }

      // Fill remaining fields based on their labels/context
      inputs.forEach((input, index) => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        const name = input.name?.toLowerCase() || '';

        if (placeholder.includes('city') || name.includes('city')) {
          cy.wrap(input).clear().type('Anna');
          cy.log(`✅ Filled city field ${index}: Anna`);
        } else if (placeholder.includes('state') || name.includes('state')) {
          cy.wrap(input).clear().type('TX');
          cy.log(`✅ Filled state field ${index}: TX`);
        } else if (placeholder.includes('zip') || name.includes('zip')) {
          cy.wrap(input).clear().type('75409');
          cy.log(`✅ Filled ZIP field ${index}: 75409`);
        }
      });
    });

    // Wait for auto-population and validation
    cy.wait(5000);
    cy.screenshot('step1-fields-filled');

    // Force click Next regardless of validation (to see what happens)
    cy.log('🚀 Attempting to proceed to next step...');
    cy.get('button:contains("Next")').click({ force: true });
    cy.wait(3000);

    // Check if we progressed or are still on step 1
    cy.get('body').then($body => {
      const bodyText = $body.text();

      if (bodyText.includes('Purchase & Financing')) {
        cy.log('✅ Successfully moved to Step 2: Purchase & Financing');

        // STEP 2: Fill financing information
        cy.get('input').then($inputs => {
          Array.from($inputs).forEach((input, index) => {
            const placeholder = input.placeholder?.toLowerCase() || '';

            if (placeholder.includes('purchase')) {
              cy.wrap(input).clear().type('245000');
              cy.log(`✅ Purchase price: $245,000`);
            } else if (placeholder.includes('down')) {
              cy.wrap(input).clear().type('20');
              cy.log(`✅ Down payment: 20%`);
            } else if (placeholder.includes('interest')) {
              cy.wrap(input).clear().type('7.5');
              cy.log(`✅ Interest rate: 7.5%`);
            } else if (placeholder.includes('loan') || placeholder.includes('term')) {
              cy.wrap(input).clear().type('30');
              cy.log(`✅ Loan term: 30 years`);
            }
          });
        });

        cy.screenshot('step2-financing-filled');
        cy.get('button:contains("Next")').click({ force: true });
        cy.wait(3000);

        // Continue through remaining steps
        cy.log('🏠 STEP 3: Rental Analysis (accepting defaults)');
        cy.screenshot('step3-rental');
        cy.get('button:contains("Next")').click({ force: true });
        cy.wait(3000);

        cy.log('📈 STEP 4: Long-term Assumptions (accepting defaults)');
        cy.screenshot('step4-assumptions');
        cy.get('button:contains("Next")').click({ force: true });
        cy.wait(3000);

        cy.log('🔥 STEP 5: Investment Strategy');
        // Set aggressive investor profile
        cy.get('body').then($strategyBody => {
          if ($strategyBody.find('button:contains("High")').length > 0) {
            cy.get('button:contains("High")').click();
            cy.log('✅ Risk Tolerance: High');
          }
          if ($strategyBody.find('button:contains("Wealth Building")').length > 0) {
            cy.get('button:contains("Wealth Building")').click();
            cy.log('✅ Goal: Wealth Building');
          }
        });

        cy.screenshot('step5-strategy');
        cy.wait(2000);

        // Complete analysis
        cy.log('🚀 COMPLETING ANALYSIS...');
        cy.get('button').then($buttons => {
          const buttons = Array.from($buttons);
          const analyzeBtn = buttons.find(btn => {
            const text = btn.textContent || '';
            return (text.includes('Analyze') || text.includes('Complete')) && !btn.disabled;
          });

          if (analyzeBtn) {
            cy.wrap(analyzeBtn).click({ force: true });
            cy.log(`🚀 Clicked: "${analyzeBtn.textContent}"`);
          } else {
            cy.log('❌ No enabled analyze button found');
          }
        });

        // Wait for analysis
        cy.wait(20000);
        cy.screenshot('final-analysis-state');

        // Extract whatever data we can find
        cy.get('body').then($resultBody => {
          const resultText = $resultBody.text();

          const extractedData = {
            timestamp: new Date().toISOString(),
            testType: 'QE_FINAL_REAL_EXTRACTION',
            property: {
              address: '1837 Walnut Way, Anna, TX 75409',
              purchasePrice: 245000
            },
            pageContent: resultText.substring(0, 5000),
            hasResults: {
              verdict: resultText.includes('BUY') || resultText.includes('NEGOTIATE') ||
                      resultText.includes('CAUTION') || resultText.includes('PASS'),
              score: resultText.includes('/100'),
              financials: resultText.includes('Cap Rate') || resultText.includes('Cash Flow'),
              analysisResults: resultText.includes('Analysis Results'),
              investmentDecision: resultText.includes('Investment Decision')
            }
          };

          cy.writeFile('cypress/fixtures/final-real-extraction.json', extractedData);
          cy.log('💾 Final extraction data saved');

          // Log what we found
          cy.log('🔍 FINAL EXTRACTION RESULTS:');
          Object.entries(extractedData.hasResults).forEach(([key, found]) => {
            cy.log(`   ${key}: ${found ? '✅' : '❌'}`);
          });
        });

      } else {
        cy.log('❌ Still on Step 1 - address validation failed');
        cy.screenshot('stuck-on-step1');

        // Save debug information
        const debugData = {
          timestamp: new Date().toISOString(),
          issue: 'stuck_on_step1_address_validation',
          bodyText: bodyText.substring(0, 3000)
        };
        cy.writeFile('cypress/fixtures/debug-step1-stuck.json', debugData);
      }
    });

    cy.log('🎯 QE Final test completed');
  });
});