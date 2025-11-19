// Custom Cypress Commands for Real Estate Analyzer

// ==========================================
// AUTHENTICATION COMMANDS
// ==========================================

/**
 * Login with test user credentials
 */
Cypress.Commands.add('login', (email, password) => {
  // Use exact same credentials as expert validation that works (admin account)
  const testEmail = email || Cypress.env('TEST_USER_EMAIL') || 'admin@realestateanalyzer.com';
  const testPassword = password || Cypress.env('TEST_USER_PASSWORD') || 'S@madhu96780302';

  cy.log(`🔑 Logging in with: ${testEmail}`);

  // Intercept login API call to see what's happening
  cy.intercept('POST', '**/api/auth/login').as('loginRequest');

  cy.visit('/login');

  // Wait for login page to fully load
  cy.wait(1000);

  // Email field - be more specific to avoid conflicts
  cy.get('input[type="email"]')
    .should('be.visible')
    .clear()
    .type(testEmail);

  // Password field - be more specific
  cy.get('input[type="password"]')
    .should('be.visible')
    .clear()
    .type(testPassword);

  // Login button - target the specific submit button, not generic "Sign" text
  cy.get('button[type="submit"]')
    .should('be.visible')
    .should('not.be.disabled')
    .click();

  // Wait for login API call to complete
  cy.wait('@loginRequest').then((interception) => {
    cy.log(`Login API status: ${interception.response.statusCode}`);
    if (interception.response.statusCode !== 200) {
      cy.log(`⚠️ Login failed with status: ${interception.response.statusCode}`);
      cy.log(`Response: ${JSON.stringify(interception.response.body)}`);
    }
  });

  // Check for error messages on page
  cy.get('body').then($body => {
    const bodyText = $body.text();
    if (bodyText.includes('Invalid') || bodyText.includes('Error') || bodyText.includes('failed')) {
      cy.log('⚠️ Login error detected on page');
      cy.screenshot('login-error-message');
    }
  });

  // Wait for successful login and redirect with better timeout handling
  cy.url({timeout: 15000}).should('not.include', '/login');

  // Additional wait to ensure page has fully loaded
  cy.wait(2000);

  cy.log('✅ Login completed successfully');
});

/**
 * Logout current user
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu]', { timeout: 5000 })
    .should('be.visible')
    .click();
    
  cy.get('[data-cy=logout-button]')
    .should('be.visible')
    .click();
    
  cy.url().should('include', '/login');
});

// ==========================================
// PROPERTY WIZARD COMMANDS
// ==========================================

/**
 * Navigate to Property Wizard
 */
Cypress.Commands.add('openPropertyWizard', () => {
  // Navigate directly to SFR Analysis page which contains the wizard
  cy.visit('/sfr');
  
  // Wait for page to load
  cy.wait(3000);
  
  // Click the "Start SFR Analysis" button visible in screenshot
  cy.get('button:contains("Start SFR Analysis")')
    .should('be.visible')
    .click();
  
  // Wait for wizard to load
  cy.wait(2000);
  
  // Verify we're in the wizard by looking for Property Address form
  cy.get('input[placeholder*="Main Street"], input[placeholder*="123"], [placeholder*="address"]')
    .should('be.visible');
  
  cy.log('✅ Property Wizard opened successfully');
});

/**
 * Complete Property Wizard Step 1: Property Address & Details  
 * Tests ALL manual input fields including overrides of auto-populated data
 */
Cypress.Commands.add('completeWizardStep1', (propertyData = {}) => {
  const address = propertyData.address || Cypress.env('TEST_PROPERTY_ADDRESS');
  
  cy.log('🏠 Step 1: Property Address & Details (ALL FIELDS)');
  
  // Enter address in the street field (based on screenshot)
  const addressString = typeof address === 'string' ? address : `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  
  // Fill the main street address field
  cy.get('input[placeholder*="Main Street"], input[placeholder*="Street"]')
    .should('be.visible')
    .clear()
    .type(addressString);
  
  // If separate fields exist, fill them too
  if (typeof address === 'object') {
    // Look for separate city field
    cy.get('body').then($body => {
      if ($body.find('input[placeholder*="City"], [name*="city"]').length) {
        cy.get('input[placeholder*="City"], [name*="city"]')
          .clear()
          .type(address.city || '');
      }
    });
    
    // Look for separate state field  
    cy.get('body').then($body => {
      if ($body.find('input[placeholder*="State"], [name*="state"]').length) {
        cy.get('input[placeholder*="State"], [name*="state"]')
          .clear()
          .type(address.state || '');
      }
    });
    
    // Look for separate ZIP field
    cy.get('body').then($body => {
      if ($body.find('input[placeholder*="ZIP"], [name*="zip"]').length) {
        cy.get('input[placeholder*="ZIP"], [name*="zip"]')
          .clear()
          .type(address.zipCode || '');
      }
    });
  }
  
  // Wait for auto-population
  cy.wait(3000);
  
  // Test manual property details input (may override auto-populated)
  // Based on screenshot, these fields are visible in Property Details section
  if (propertyData.squareFootage) {
    cy.get('input[placeholder*="1847"], input[label*="Square"], [name*="squareFootage"]')
      .clear()
      .type(propertyData.squareFootage.toString());
  }
  
  if (propertyData.bedrooms) {
    cy.get('input[placeholder*="3"], input[label*="Bedroom"], [name*="bedrooms"]')
      .clear()
      .type(propertyData.bedrooms.toString());
  }
  
  if (propertyData.bathrooms) {
    cy.get('input[placeholder*="2"], input[label*="Bathroom"], [name*="bathrooms"]')
      .clear()
      .type(propertyData.bathrooms.toString());
  }
  
  if (propertyData.yearBuilt) {
    cy.get('input[placeholder*="2005"], input[label*="Year"], [name*="yearBuilt"]')
      .clear()
      .type(propertyData.yearBuilt.toString());
  }
  
  if (propertyData.propertyName) {
    cy.get('input[label*="Name"], [name*="propertyName"]')
      .clear()
      .type(propertyData.propertyName);
  }
  
  // Click next step - look for Next button or proceed button
  cy.get('button:contains("Next"), button:contains("Continue"), button:contains("Proceed")')
    .should('be.visible')
    .should('not.be.disabled')
    .click();
    
  // Wait for next step to load
  cy.wait(2000);
});

/**
 * Complete Property Wizard Step 2: Purchase & Financing
 * Tests ALL financing fields including loan terms, closing costs, etc.
 */
Cypress.Commands.add('completeWizardStep2', (propertyData = {}) => {
  const purchasePrice = propertyData.purchasePrice || Cypress.env('TEST_PROPERTY_PRICE');
  const downPayment = propertyData.downPayment || Math.round(purchasePrice * 0.2);
  
  cy.log('💰 Step 2: Purchase & Financing (ALL FIELDS)');
  
  // Purchase price (critical field)
  cy.get('[data-cy=purchase-price], input[placeholder*="price"], input[placeholder*="Price"], input[label*="Purchase"]')
    .should('be.visible')
    .clear()
    .type(purchasePrice.toString());
  
  // Down payment (amount or percentage)
  cy.get('body').then($body => {
    if ($body.find('[data-cy=down-payment], input[placeholder*="down"], input[label*="Down"]').length) {
      cy.get('[data-cy=down-payment], input[placeholder*="down"], input[label*="Down"]')
        .clear()
        .type(downPayment.toString());
    }
  });
  
  // Interest rate
  if (propertyData.interestRate) {
    cy.get('[data-cy=interest-rate], input[label*="Interest"], input[placeholder*="rate"]')
      .should('be.visible')
      .clear()
      .type(propertyData.interestRate.toString());
  }
  
  // Loan term
  if (propertyData.loanTerm) {
    cy.get('[data-cy=loan-term], input[label*="Loan"], input[label*="Term"]')
      .clear()
      .type(propertyData.loanTerm.toString());
  }
  
  // Closing costs
  if (propertyData.closingCosts) {
    cy.get('[data-cy=closing-costs], input[label*="Closing"]')
      .clear()
      .type(propertyData.closingCosts.toString());
  }
  
  // Capital investments/renovations
  if (propertyData.capitalInvestments) {
    cy.get('[data-cy=capital-investments], input[label*="Capital"], input[label*="Renovation"]')
      .clear()
      .type(propertyData.capitalInvestments.toString());
  }
  
  // Loan type toggle (if available)
  if (propertyData.loanType) {
    cy.get('body').then($body => {
      if ($body.find('[data-cy=loan-type-toggle], .MuiToggleButton-root').length) {
        cy.get(`[data-cy=loan-type-toggle]:contains("${propertyData.loanType}"), .MuiToggleButton-root:contains("${propertyData.loanType}")`)
          .click();
      }
    });
  }
  
  // Click next step
  cy.get('[data-cy=wizard-next-button], [data-cy=next-step-button], button:contains("Next")')
    .should('be.visible')
    .should('not.be.disabled')
    .click();
    
  // Verify we moved to step 3
  cy.get('[data-cy=wizard-step-3], .wizard-step-3')
    .should('be.visible');
});

/**
 * Complete Property Wizard Step 3: Rental Analysis
 * Tests ALL rental fields including management, vacancy, turnover costs
 */
Cypress.Commands.add('completeWizardStep3', (propertyData = {}) => {
  const monthlyRent = propertyData.monthlyRent || 2200;
  
  cy.log('🏠 Step 3: Rental Analysis (ALL FIELDS)');
  
  // Monthly rent (may override RentCast auto-populated estimate)
  cy.get('[data-cy=monthly-rent], input[placeholder*="rent"], input[label*="Monthly Rent"]')
    .should('be.visible')
    .clear()
    .type(monthlyRent.toString());
  
  // Self-manage toggle
  if (propertyData.selfManage !== undefined) {
    cy.get('[data-cy=self-manage-toggle], input[type="checkbox"]').then($toggle => {
      if ($toggle.length) {
        if (propertyData.selfManage) {
          cy.wrap($toggle).check();
        } else {
          cy.wrap($toggle).uncheck();
        }
      }
    });
  }
  
  // Property management rate (slider)
  if (propertyData.propertyManagementRate && !propertyData.selfManage) {
    cy.get('body').then($body => {
      // Look for management rate slider
      const managementSliders = $body.find('.MuiSlider-root');
      if (managementSliders.length > 0) {
        cy.wrap(managementSliders[0]).click();
      }
    });
  }
  
  // Vacancy rate (slider)
  if (propertyData.vacancyRate) {
    cy.get('body').then($body => {
      // Look for vacancy rate slider (usually second slider)
      const sliders = $body.find('.MuiSlider-root');
      if (sliders.length > 1) {
        cy.wrap(sliders[1]).click();
      }
    });
  }
  
  // Tenant turnover fees
  if (propertyData.tenantTurnoverFees) {
    // Unit prep fees
    if (propertyData.tenantTurnoverFees.prepFees) {
      cy.get('[data-cy=prep-fees], input[label*="Prep"], input[label*="Unit"]')
        .clear()
        .type(propertyData.tenantTurnoverFees.prepFees.toString());
    }
    
    // Realtor commission
    if (propertyData.tenantTurnoverFees.realtorCommission) {
      cy.get('[data-cy=realtor-commission], input[label*="Realtor"], input[label*="Commission"]')
        .clear()
        .type(propertyData.tenantTurnoverFees.realtorCommission.toString());
    }
  }
  
  // Click next step
  cy.get('[data-cy=wizard-next-button], [data-cy=next-step-button], button:contains("Next")')
    .should('be.visible')
    .should('not.be.disabled')
    .click();
    
  // Verify we moved to step 4
  cy.get('[data-cy=wizard-step-4], .wizard-step-4')
    .should('be.visible');
});

/**
 * Complete Property Wizard Step 4: Long-term Assumptions
 * Tests ALL assumption fields including taxes, insurance, maintenance, growth rates
 */
Cypress.Commands.add('completeWizardStep4', (propertyData = {}) => {
  cy.log('📈 Step 4: Long-term Assumptions (ALL FIELDS)');
  
  // Property tax rate
  if (propertyData.propertyTaxRate) {
    cy.get('[data-cy=property-tax-rate], input[label*="Tax"]')
      .clear()
      .type(propertyData.propertyTaxRate.toString());
  }
  
  // Insurance rate
  if (propertyData.insuranceRate) {
    cy.get('[data-cy=insurance-rate], input[label*="Insurance"]')
      .clear()
      .type(propertyData.insuranceRate.toString());
  }
  
  // Maintenance reserve percentage
  if (propertyData.maintenanceReservePercentage) {
    cy.get('[data-cy=maintenance-percentage], input[label*="Maintenance"]')
      .clear()
      .type(propertyData.maintenanceReservePercentage.toString());
  }
  
  // Long-term projection fields
  if (propertyData.longTermProjections) {
    const projections = propertyData.longTermProjections;
    
    // Projection years
    if (projections.projectionYears) {
      cy.get('[data-cy=projection-years], input[label*="Years"]')
        .clear()
        .type(projections.projectionYears.toString());
    }
    
    // Annual rent increase
    if (projections.annualRentIncrease) {
      cy.get('[data-cy=rent-increase], input[label*="Rent"]')
        .clear()
        .type(projections.annualRentIncrease.toString());
    }
    
    // Annual property value increase
    if (projections.annualPropertyValueIncrease) {
      cy.get('[data-cy=appreciation-rate], input[label*="Appreciation"], input[label*="Value"]')
        .clear()
        .type(projections.annualPropertyValueIncrease.toString());
    }
    
    // Selling costs percentage
    if (projections.sellingCostsPercentage) {
      cy.get('[data-cy=selling-costs], input[label*="Selling"]')
        .clear()
        .type(projections.sellingCostsPercentage.toString());
    }
    
    // Inflation rate
    if (projections.inflationRate) {
      cy.get('[data-cy=inflation-rate], input[label*="Inflation"]')
        .clear()
        .type(projections.inflationRate.toString());
    }
    
    // Turnover frequency
    if (projections.turnoverFrequency) {
      cy.get('[data-cy=turnover-frequency], input[label*="Turnover"]')
        .clear()
        .type(projections.turnoverFrequency.toString());
    }
  }
  
  // Click next step
  cy.get('[data-cy=wizard-next-button], [data-cy=next-step-button], button:contains("Next")')
    .should('be.visible')
    .should('not.be.disabled')
    .click();
    
  // Verify we moved to step 5
  cy.get('[data-cy=wizard-step-5], .wizard-step-5')
    .should('be.visible');
});

/**
 * Complete Property Wizard Step 5: Investment Goals & Strategy
 * Tests ALL strategy fields including dropdowns and free-form goals
 */
Cypress.Commands.add('completeWizardStep5', (strategyData = {}) => {
  cy.log('🎯 Step 5: Investment Goals & Strategy (ALL FIELDS)');
  
  const exitStrategy = strategyData.exitStrategy || 'flexible';
  const portfolioStrategy = strategyData.portfolioStrategy || 'balanced';
  const experienceLevel = strategyData.experienceLevel || 'intermediate';
  const riskTolerance = strategyData.riskTolerance || 'moderate';
  
  // Exit strategy dropdown (Material-UI Select)
  cy.get('body').then($body => {
    if ($body.find('[data-cy=exit-strategy], .MuiSelect-root').length) {
      cy.get('[data-cy=exit-strategy], .MuiSelect-root').first().click();
      cy.get(`[data-value="${exitStrategy}"], .MuiMenuItem-root:contains("${exitStrategy}")`)
        .click();
    }
  });
  
  // Portfolio strategy dropdown
  cy.get('body').then($body => {
    if ($body.find('[data-cy=portfolio-strategy], .MuiSelect-root').length) {
      cy.get('[data-cy=portfolio-strategy], .MuiSelect-root').eq(1).click();
      cy.get(`[data-value="${portfolioStrategy}"], .MuiMenuItem-root:contains("${portfolioStrategy}")`)
        .click();
    }
  });
  
  // Experience level dropdown
  cy.get('body').then($body => {
    if ($body.find('[data-cy=experience-level], .MuiSelect-root').length) {
      cy.get('[data-cy=experience-level], .MuiSelect-root').eq(2).click();
      cy.get(`[data-value="${experienceLevel}"], .MuiMenuItem-root:contains("${experienceLevel}")`)
        .click();
    }
  });
  
  // Risk tolerance dropdown  
  cy.get('body').then($body => {
    if ($body.find('[data-cy=risk-tolerance], .MuiSelect-root').length) {
      cy.get('[data-cy=risk-tolerance], .MuiSelect-root').eq(3).click();
      cy.get(`[data-value="${riskTolerance}"], .MuiMenuItem-root:contains("${riskTolerance}")`)
        .click();
    }
  });
  
  // Investment horizon (if available)
  if (strategyData.investmentHorizon) {
    cy.get('[data-cy=investment-horizon], .MuiSelect-root').then($select => {
      if ($select.length) {
        cy.wrap($select).click();
        cy.get(`[data-value="${strategyData.investmentHorizon}"], .MuiMenuItem-root:contains("${strategyData.investmentHorizon}")`)
          .click();
      }
    });
  }
  
  // Free-form investment goals (text area)
  if (strategyData.freeformGoals) {
    cy.get('[data-cy=investment-goals], [data-cy=freeform-goals], textarea, input[multiline]')
      .clear()
      .type(strategyData.freeformGoals);
  }
  
  // Financial goals (if available)
  if (strategyData.targetCashFlow) {
    cy.get('[data-cy=target-cash-flow], input[label*="Cash Flow"]')
      .clear()
      .type(strategyData.targetCashFlow.toString());
  }
  
  if (strategyData.targetAppreciation) {
    cy.get('[data-cy=target-appreciation], input[label*="Appreciation"]')
      .clear()
      .type(strategyData.targetAppreciation.toString());
  }
  
  // Complete the wizard
  cy.get('[data-cy=complete-wizard-button], [data-cy=analyze-button], button:contains("Analyze"), button:contains("Complete")')
    .should('be.visible')
    .should('not.be.disabled')
    .click();
});

/**
 * Complete entire Property Wizard flow
 */
Cypress.Commands.add('completePropertyWizard', (propertyData = {}, strategyData = {}) => {
  cy.log('🧙‍♂️ Completing Full Property Wizard');
  
  cy.openPropertyWizard();
  cy.completeWizardStep1(propertyData);
  cy.completeWizardStep2(propertyData);
  cy.completeWizardStep3(propertyData);
  cy.completeWizardStep4(propertyData);
  cy.completeWizardStep5(strategyData);
  
  // Wait for analysis to complete
  cy.get('[data-cy=analysis-results], .analysis-results, .investment-decision')
    .should('be.visible', { timeout: 30000 });
});

// ==========================================
// ANALYSIS VALIDATION COMMANDS
// ==========================================

/**
 * Validate analysis results are displayed
 */
Cypress.Commands.add('validateAnalysisResults', () => {
  cy.log('✅ Validating Analysis Results');
  
  // Check for key analysis components
  cy.get('[data-cy=investment-verdict], .investment-decision, .verdict')
    .should('be.visible')
    .should('contain.text', /(BUY|NEGOTIATE|CAUTION|PASS)/);
    
  cy.get('[data-cy=cash-flow], .cash-flow, .monthly-flow')
    .should('be.visible');
    
  cy.get('[data-cy=cap-rate], .cap-rate')
    .should('be.visible');
});

/**
 * Take optimized screenshot with smaller file size
 */
Cypress.Commands.add('takeScreenshot', (name, options = {}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}`;
  
  cy.log(`📸 Taking optimized screenshot: ${filename}`);
  
  // Take screenshot with optimized settings
  cy.screenshot(filename, { 
    capture: options.fullPage ? 'fullPage' : 'viewport', // Default to viewport for smaller size
    overwrite: true,
    scale: false, // Disable scaling to reduce file size
    disableTimersAndAnimations: true, // Faster capture
    ...options
  });
});

/**
 * Take compact screenshot (viewport only, no animations)
 */
Cypress.Commands.add('takeCompactScreenshot', (name) => {
  cy.takeScreenshot(name, {
    capture: 'viewport',
    scale: false,
    disableTimersAndAnimations: true
  });
});

// ==========================================
// UTILITY COMMANDS  
// ==========================================

/**
 * Wait for element to be visible and interactable
 */
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout })
    .should('be.visible')
    .should('not.be.disabled');
});

/**
 * Custom log command with emoji
 * Using logMessage instead of log to avoid conflict
 */
Cypress.Commands.add('logMessage', (message) => {
  cy.task('log', message);
});