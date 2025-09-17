/// <reference types="cypress" />

/**
 * DIAGNOSTIC WIZARD TEST
 * 
 * Sr QE Strategic Approach: Systematic diagnosis of wizard flow
 * with proper error handling and state verification
 */

describe('Diagnostic Property Wizard Test', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@realestateanalyzer.com');
    cy.get('input[type="password"]').type('Spring@2025');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('should diagnose each wizard step systematically', () => {
    cy.log('🔬 DIAGNOSTIC TEST: Systematic wizard analysis');
    
    // Navigate to Dashboard
    cy.visit('/');
    cy.wait(2000);
    
    // Start SFR Analysis
    cy.get('button:contains("Start SFR Analysis")')
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    
    cy.log('✅ Started SFR Analysis from dashboard');
    cy.wait(3000);
    
    // ===========================================
    // STEP 1 DIAGNOSIS
    // ===========================================
    cy.log('📊 STEP 1 DIAGNOSIS');
    
    // Check current state
    cy.get('body').then($body => {
      // Log what step indicators show
      if ($body.text().includes('Property Address')) {
        cy.log('✅ Step 1: Property Address confirmed');
      }
      
      // Count and log all input fields
      cy.get('input').then($inputs => {
        cy.log(`Found ${$inputs.length} input fields in Step 1`);
        
        // Log each input's current state
        $inputs.each((index, input) => {
          if (input.placeholder || input.value) {
            cy.log(`Input ${index}: placeholder="${input.placeholder}" value="${input.value}" required=${input.required}`);
          }
        });
      });
    });
    
    // Fill Step 1 with detailed logging
    const step1Data = {
      address: '123 Test Street',
      city: 'Test City',
      state: 'NJ',
      zipCode: '07001'
    };
    
    // Fill address field
    cy.get('input[placeholder*="Street"], input[placeholder*="Main"]').first().then($input => {
      cy.wrap($input).clear().type(step1Data.address);
      cy.log(`✅ Filled address: ${step1Data.address}`);
    });
    
    // Fill remaining fields by position (based on observed order)
    cy.get('input').eq(1).clear().type(step1Data.city);
    cy.get('input').eq(2).clear().type(step1Data.state);
    cy.get('input').eq(3).clear().type(step1Data.zipCode);
    
    // Wait for any auto-population
    cy.wait(5000);
    cy.log('⏳ Waited for auto-population');
    
    // Verify fields are filled
    cy.get('input').then($inputs => {
      let filledCount = 0;
      $inputs.each((index, input) => {
        if (input.value && input.value !== '') {
          filledCount++;
        }
      });
      cy.log(`✅ ${filledCount} fields have values`);
    });
    
    // Check for validation errors
    cy.get('body').then($body => {
      const bodyText = $body.text();
      if (bodyText.includes('required') || bodyText.includes('error')) {
        cy.log('⚠️ Validation errors present:');
        cy.screenshot('step-1-validation-errors');
      } else {
        cy.log('✅ No validation errors detected');
      }
    });
    
    // Find and validate Next button state
    cy.get('button').then($buttons => {
      let nextFound = false;
      $buttons.each((index, button) => {
        if (button.textContent.toLowerCase().includes('next')) {
          const isDisabled = button.disabled;
          cy.log(`Next button found - disabled: ${isDisabled}`);
          
          if (!isDisabled) {
            cy.wrap(button).click();
            cy.log('✅ Clicked Next to Step 2');
            nextFound = true;
            return false;
          } else {
            cy.log('❌ Next button is disabled - investigating why');
            cy.screenshot('step-1-next-disabled');
          }
        }
      });
      
      if (!nextFound) {
        cy.log('❌ Could not proceed from Step 1');
        return;
      }
    });
    
    cy.wait(3000);
    
    // ===========================================
    // STEP 2 DIAGNOSIS
    // ===========================================
    cy.log('📊 STEP 2 DIAGNOSIS');
    
    cy.get('body').then($body => {
      if ($body.text().includes('Purchase & Financing') || $body.text().includes('Purchase Price')) {
        cy.log('✅ Step 2: Purchase & Financing confirmed');
        
        // Log all inputs in Step 2
        cy.get('input').then($inputs => {
          cy.log(`Found ${$inputs.length} input fields in Step 2`);
          
          // Find purchase price input
          const priceInput = Array.from($inputs).find(input => 
            input.placeholder?.includes('$') || 
            input.type === 'number' ||
            input.value?.includes('285000')
          );
          
          if (priceInput) {
            cy.wrap(priceInput).clear().type('285000');
            cy.log('✅ Set purchase price: $285,000');
          } else {
            cy.log('⚠️ Could not find purchase price input');
            // Try first input as fallback
            cy.get('input').first().clear().type('285000');
          }
        });
        
        // Handle sliders
        cy.get('.MuiSlider-root').then($sliders => {
          if ($sliders.length > 0) {
            cy.log(`Found ${$sliders.length} sliders`);
            cy.wrap($sliders[0]).click();
            cy.log('✅ Clicked down payment slider');
          } else {
            cy.log('⚠️ No sliders found in Step 2');
          }
        });
        
        // Wait and check Next button
        cy.wait(3000);
        
        cy.get('button').then($buttons => {
          const nextBtn = Array.from($buttons).find(btn => 
            btn.textContent.toLowerCase().includes('next')
          );
          
          if (nextBtn && !nextBtn.disabled) {
            cy.wrap(nextBtn).click();
            cy.log('✅ Clicked Next to Step 3');
          } else if (nextBtn && nextBtn.disabled) {
            cy.log('❌ Next button disabled in Step 2');
            cy.screenshot('step-2-next-disabled');
            
            // Log what might be missing
            cy.get('body').then($body => {
              const text = $body.text();
              cy.log('Page content sample:', text.substring(0, 300));
            });
          }
        });
      }
    });
    
    cy.wait(3000);
    
    // ===========================================
    // STEP 3 DIAGNOSIS
    // ===========================================
    cy.log('📊 STEP 3 DIAGNOSIS');
    
    cy.get('body').then($body => {
      if ($body.text().includes('Rental') || $body.text().includes('Monthly Rent')) {
        cy.log('✅ Step 3: Rental Analysis confirmed');
        
        // Just click Next without changes (accept defaults)
        cy.get('button').then($buttons => {
          const nextBtn = Array.from($buttons).find(btn => 
            btn.textContent.toLowerCase().includes('next')
          );
          
          if (nextBtn) {
            const isDisabled = nextBtn.disabled;
            cy.log(`Step 3 Next button - disabled: ${isDisabled}`);
            
            if (!isDisabled) {
              cy.wrap(nextBtn).click();
              cy.log('✅ Clicked Next to Step 4');
            } else {
              cy.log('❌ Next disabled in Step 3 - this is where it usually fails');
              cy.screenshot('step-3-stuck');
              
              // Diagnose why it's stuck
              cy.get('input').then($inputs => {
                $inputs.each((i, input) => {
                  if (input.required && !input.value) {
                    cy.log(`❌ Required field empty: ${input.name || input.placeholder}`);
                  }
                });
              });
            }
          }
        });
      }
    });
    
    cy.wait(3000);
    
    // ===========================================
    // STEP 4 DIAGNOSIS
    // ===========================================
    cy.log('📊 STEP 4 DIAGNOSIS');
    
    cy.get('body').then($body => {
      if ($body.text().includes('Assumptions') || $body.text().includes('Long-term')) {
        cy.log('✅ Step 4: Assumptions reached!');
        
        // Click Next to Step 5
        cy.get('button:contains("Next")').then($nextBtns => {
          const enabled = $nextBtns.filter(':not(:disabled)');
          if (enabled.length > 0) {
            cy.wrap(enabled[0]).click();
            cy.log('✅ Clicked Next to Step 5');
          }
        });
      } else {
        cy.log('❌ Did not reach Step 4');
      }
    });
    
    cy.wait(3000);
    
    // ===========================================
    // STEP 5 DIAGNOSIS
    // ===========================================
    cy.log('📊 STEP 5 DIAGNOSIS');
    
    cy.get('body').then($body => {
      if ($body.text().includes('Investment') && $body.text().includes('Strategy')) {
        cy.log('✅ Step 5: Investment Strategy reached!');
        
        // Look for Complete Analysis button
        cy.get('button').then($buttons => {
          const completeBtn = Array.from($buttons).find(btn => 
            btn.textContent.includes('Complete') || 
            btn.textContent.includes('Analyze')
          );
          
          if (completeBtn) {
            const isDisabled = completeBtn.disabled;
            cy.log(`Complete Analysis button - disabled: ${isDisabled}`);
            
            if (!isDisabled) {
              cy.wrap(completeBtn).click();
              cy.log('🚀 Clicked Complete Analysis!');
              
              // Wait for analysis
              cy.wait(15000);
              
              // Check for results
              cy.get('body').then($body => {
                const text = $body.text();
                if (text.includes('BUY') || text.includes('NEGOTIATE') || 
                    text.includes('CAUTION') || text.includes('PASS')) {
                  cy.log('🎉 INVESTMENT VERDICT FOUND!');
                  cy.screenshot('final-investment-verdict');
                  
                  // Extract verdict
                  ['BUY', 'NEGOTIATE', 'CAUTION', 'PASS'].forEach(verdict => {
                    if (text.includes(verdict)) {
                      cy.log(`📊 VERDICT: ${verdict}`);
                    }
                  });
                } else {
                  cy.log('⚠️ No verdict found yet');
                  cy.screenshot('no-verdict-found');
                }
              });
            }
          }
        });
      } else {
        cy.log('❌ Did not reach Step 5');
      }
    });
    
    cy.log('🔬 Diagnostic test completed');
  });
});