/**
 * UI-Backend Metrics Validation Test
 *
 * Validates that ALL financial metrics displayed in the UI exactly match
 * the backend API response calculations. Uses existing Anna TX property
 * test infrastructure and optionally validates with AI expert personas.
 *
 * Strategy:
 * 1. Reuse existing Anna TX property wizard setup
 * 2. Capture backend API response as source of truth
 * 3. Validate every visible UI metric against backend
 * 4. Optional: Run parallel AI expert validation
 */

describe('UI-Backend Financial Metrics Validation', () => {

  beforeEach(() => {
    // Reuse existing login flow
    cy.visit('/login');
    cy.get('[data-testid="email"]').type('admin@realestateanalyzer.com');
    cy.get('[data-testid="password"]').type('admin123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');

    // Navigate to SFR Analysis
    cy.get('[data-testid="nav-sfr-analysis"]').click();
    cy.url().should('include', '/sfr-analysis');
  });

  it('validates all UI metrics match backend calculations exactly', () => {
    // Reuse existing Anna TX property wizard completion
    cy.completeAnnaTexasPropertyWizard();

    // Intercept the backend analysis response - our source of truth
    cy.intercept('POST', '/api/deals/analyze').as('backendAnalysis');

    // Trigger analysis
    cy.get('[data-testid="analyze-property-button"]').click();

    cy.wait('@backendAnalysis').then((interception) => {
      const backend = interception.response.body.analysis;

      // ===========================================
      // OVERVIEW TAB - INVESTMENT DECISION SECTION
      // ===========================================

      // V3.0 Professional Assessment validation
      if (backend.investmentDecision?.professionalAssessment) {
        const assessment = backend.investmentDecision.professionalAssessment;

        cy.get('[data-testid="deal-quality-score"]')
          .should('contain', assessment.dealQuality);

        cy.get('[data-testid="execution-difficulty"]')
          .should('contain', assessment.executionDifficulty);

        cy.get('[data-testid="data-reliability"]')
          .should('contain', assessment.dataReliability);
      }

      // Investment verdict validation
      if (backend.investmentDecision?.verdict) {
        cy.get('[data-testid="investment-verdict"]')
          .should('contain', backend.investmentDecision.verdict);
      }

      // ===========================================
      // OVERVIEW TAB - KEY METRICS AT A GLANCE
      // ===========================================

      // Monthly Cash Flow
      cy.get('[data-testid="monthly-cash-flow"]')
        .should('contain', formatCurrency(backend.monthlyAnalysis.cashFlow));

      // Cap Rate
      cy.get('[data-testid="cap-rate"]')
        .should('contain', formatPercent(backend.keyMetrics.capRate));

      // Cash-on-Cash Return
      cy.get('[data-testid="cash-on-cash-return"]')
        .should('contain', formatPercent(backend.keyMetrics.cashOnCashReturn));

      // 10-Year IRR
      if (backend.keyMetrics.irr) {
        cy.get('[data-testid="ten-year-irr"]')
          .should('contain', formatPercent(backend.keyMetrics.irr));
      }

      // DSCR
      cy.get('[data-testid="dscr"]')
        .should('contain', backend.keyMetrics.dscr.toFixed(2));

      // Total Investment
      if (backend.keyMetrics.totalInvestment) {
        cy.get('[data-testid="total-investment"]')
          .should('contain', formatCurrency(backend.keyMetrics.totalInvestment));
      }

      // ===========================================
      // OVERVIEW TAB - COMPLETE FINANCIAL GRID
      // ===========================================

      // Break-Even Occupancy
      if (backend.keyMetrics.breakEvenOccupancy) {
        cy.get('[data-testid="break-even-occupancy"]')
          .should('contain', formatPercent(backend.keyMetrics.breakEvenOccupancy));
      }

      // 1% Rule Value
      if (backend.keyMetrics.onePercentRule) {
        cy.get('[data-testid="one-percent-rule"]')
          .should('contain', formatPercent(backend.keyMetrics.onePercentRule));
      }

      // Gross Rent Multiplier
      if (backend.keyMetrics.grossRentMultiplier) {
        cy.get('[data-testid="gross-rent-multiplier"]')
          .should('contain', backend.keyMetrics.grossRentMultiplier.toFixed(2));
      }

      // Operating Expense Ratio
      if (backend.keyMetrics.operatingExpenseRatio) {
        cy.get('[data-testid="operating-expense-ratio"]')
          .should('contain', formatPercent(backend.keyMetrics.operatingExpenseRatio));
      }

      // Price Per Bedroom
      if (backend.keyMetrics.pricePerBedroom) {
        cy.get('[data-testid="price-per-bedroom"]')
          .should('contain', formatCurrency(backend.keyMetrics.pricePerBedroom));
      }

      // Debt-to-Income Ratio
      if (backend.keyMetrics.debtToIncomeRatio) {
        cy.get('[data-testid="debt-to-income-ratio"]')
          .should('contain', formatPercent(backend.keyMetrics.debtToIncomeRatio));
      }

      // ===========================================
      // FINANCIAL DETAILS TAB
      // ===========================================

      cy.get('[data-tab="Financial Details"]').click();
      cy.wait(1000); // Allow tab to load

      // Monthly Cash Flow Analysis breakdown
      if (backend.monthlyAnalysis.income) {
        cy.get('[data-testid="gross-rental-income"]')
          .should('contain', formatCurrency(backend.monthlyAnalysis.income.gross));
      }

      if (backend.monthlyAnalysis.expenses) {
        const expenses = backend.monthlyAnalysis.expenses;

        // Property Tax
        if (expenses.propertyTax) {
          cy.get('[data-testid="property-tax"]')
            .should('contain', formatCurrency(expenses.propertyTax));
        }

        // Insurance
        if (expenses.insurance) {
          cy.get('[data-testid="insurance"]')
            .should('contain', formatCurrency(expenses.insurance));
        }

        // Maintenance
        if (expenses.maintenance) {
          cy.get('[data-testid="maintenance"]')
            .should('contain', formatCurrency(expenses.maintenance));
        }

        // Property Management
        if (expenses.propertyManagement) {
          cy.get('[data-testid="property-management"]')
            .should('contain', formatCurrency(expenses.propertyManagement));
        }
      }

      // ===========================================
      // LONG-TERM PROJECTIONS TAB
      // ===========================================

      cy.get('[data-tab="Long-term Projections"]').click();
      cy.wait(1000); // Allow tab to load

      // Validate projections table if available
      if (backend.longTermAnalysis?.projections) {
        const projections = backend.longTermAnalysis.projections;

        // Year 1 values
        if (projections[0]) {
          cy.get('[data-testid="year-1-property-value"]')
            .should('contain', formatCurrency(projections[0].propertyValue));

          cy.get('[data-testid="year-1-cash-flow"]')
            .should('contain', formatCurrency(projections[0].cashFlow));
        }

        // Year 10 values (final year)
        if (projections[projections.length - 1]) {
          const finalYear = projections[projections.length - 1];

          cy.get('[data-testid="year-10-property-value"]')
            .should('contain', formatCurrency(finalYear.propertyValue));

          cy.get('[data-testid="year-10-cash-flow"]')
            .should('contain', formatCurrency(finalYear.cashFlow));

          cy.get('[data-testid="year-10-noi"]')
            .should('contain', formatCurrency(finalYear.noi));
        }
      }

      // Exit analysis validation
      if (backend.longTermAnalysis?.exitAnalysis) {
        const exit = backend.longTermAnalysis.exitAnalysis;

        cy.get('[data-testid="projected-sale-price"]')
          .should('contain', formatCurrency(exit.salePrice));

        cy.get('[data-testid="net-proceeds"]')
          .should('contain', formatCurrency(exit.netProceeds));
      }

      // ===========================================
      // PRECISION & FORMATTING VALIDATION
      // ===========================================

      // Check for floating-point display errors
      cy.get('body').should('not.contain', '.000000000');
      cy.get('body').should('not.contain', '.999999999');
      cy.get('body').should('not.contain', 'NaN');
      cy.get('body').should('not.contain', 'Infinity');

      // Validate currency formatting consistency
      cy.get('[data-testid*="cash-flow"], [data-testid*="price"], [data-testid*="cost"]')
        .each(($el) => {
          cy.wrap($el).invoke('text').then((text) => {
            if (text.includes('$')) {
              // Should be formatted as $X,XXX or $XXX (no excessive decimals)
              expect(text).to.not.match(/\$\d+\.\d{3,}/);
            }
          });
        });

      // Validate percentage formatting consistency
      cy.get('[data-testid*="rate"], [data-testid*="percent"], [data-testid*="ratio"]')
        .each(($el) => {
          cy.wrap($el).invoke('text').then((text) => {
            if (text.includes('%')) {
              // Should be formatted as X.XX% (max 2 decimal places)
              expect(text).to.match(/^\d+\.\d{1,2}%$/);
            }
          });
        });

      // ===========================================
      // CROSS-TAB CONSISTENCY CHECK
      // ===========================================

      // Monthly Cash Flow should be identical across all tabs
      let overviewCashFlow, detailsCashFlow;

      cy.get('[data-tab="Overview"]').click();
      cy.get('[data-testid="monthly-cash-flow"]').invoke('text').as('overviewCashFlow');

      cy.get('[data-tab="Financial Details"]').click();
      cy.get('[data-testid="monthly-cash-flow-result"]').invoke('text').as('detailsCashFlow');

      cy.get('@overviewCashFlow').then((overview) => {
        cy.get('@detailsCashFlow').then((details) => {
          expect(overview).to.equal(details);
        });
      });
    });
  });

  it('validates against AI expert personas for additional confidence', () => {
    // Complete analysis first
    cy.completeAnnaTexasPropertyWizard();
    cy.intercept('POST', '/api/deals/analyze').as('backendAnalysis');
    cy.get('[data-testid="analyze-property-button"]').click();

    cy.wait('@backendAnalysis').then((interception) => {
      const backend = interception.response.body.analysis;
      const propertyData = {
        address: '1837 Walnut Way, Anna, TX 75409',
        purchasePrice: 170000,
        monthlyRent: 1749,
        downPaymentPercent: 25,
        interestRate: 5.75,
        propertyTaxRate: 1.8,
        insuranceRate: 0.7,
        squareFootage: 1268,
        bedrooms: 3,
        yearBuilt: 2007
      };

      const calculatedMetrics = {
        monthlyCashFlow: backend.monthlyAnalysis.cashFlow,
        capRate: backend.keyMetrics.capRate,
        cashOnCashReturn: backend.keyMetrics.cashOnCashReturn,
        irr: backend.keyMetrics.irr,
        dscr: backend.keyMetrics.dscr,
        grossRentMultiplier: backend.keyMetrics.grossRentMultiplier,
        onePercentRule: backend.keyMetrics.onePercentRule,
        pricePerBedroom: backend.keyMetrics.pricePerBedroom,
        verdict: backend.investmentDecision.verdict
      };

      // Check for critical calculation errors first
      cy.task('validateCriticalMetrics', calculatedMetrics).then((criticalIssues) => {
        if (criticalIssues) {
          cy.log('🚨 CRITICAL ISSUES DETECTED:', criticalIssues);
          criticalIssues.forEach(issue => {
            cy.log(`❌ ${issue}`);
          });
        }
      });

      // Run AI expert validation in parallel
      cy.task('validateWithAIExperts', {
        propertyData: propertyData,
        calculatedMetrics: calculatedMetrics
      }).then((expertValidation) => {
        // Log comprehensive results
        cy.task('logValidationResults', {
          uiValidation: {
            metricsCount: Object.keys(calculatedMetrics).length,
            discrepancies: [] // Would be populated by UI validation
          },
          aiValidation: expertValidation
        });

        // Validate expert consensus
        expect(expertValidation).to.have.property('overallConfidence');
        expect(expertValidation).to.have.property('recommendation');

        // Check overall confidence level
        if (expertValidation.overallConfidence < 0.7) {
          cy.log(`⚠️ LOW EXPERT CONFIDENCE: ${(expertValidation.overallConfidence * 100).toFixed(1)}%`);
        }

        // Analyze discrepancies
        if (expertValidation.discrepancies?.length > 0) {
          cy.log(`🔍 AI EXPERTS FLAGGED ${expertValidation.discrepancies.length} DISCREPANCIES:`);

          expertValidation.discrepancies.forEach((discrepancy, index) => {
            cy.log(`${index + 1}. ${discrepancy.metric.toUpperCase()}`);
            cy.log(`   Severity: ${discrepancy.severity}`);
            cy.log(`   Expert Agreement: ${(discrepancy.agreement * 100).toFixed(1)}%`);
            cy.log(`   Backend Value: ${discrepancy.originalValue}`);

            // Log individual expert opinions
            discrepancy.expertOpinions.forEach(opinion => {
              const status = opinion.matches ? '✅' : '❌';
              cy.log(`   ${status} ${opinion.expert}: ${opinion.matches ? 'Agrees' : 'Disagrees'} (variance: ${opinion.variance}%)`);
            });
          });

          // Fail test if high-severity discrepancies found
          const highSeverityIssues = expertValidation.discrepancies.filter(d => d.severity === 'HIGH');
          if (highSeverityIssues.length > 0) {
            throw new Error(`${highSeverityIssues.length} HIGH SEVERITY calculation discrepancies found by AI experts`);
          }
        }

        // Validate specific expert assessments
        expertValidation.validations.forEach(validation => {
          if (validation.success) {
            cy.log(`✅ ${validation.expert.toUpperCase()} Expert: Validation completed`);

            // Check for specific expert flags
            const result = validation.result;

            if (result.expertValidation?.overallAssessment === 'INCORRECT') {
              cy.log(`❌ Financial Analyst flagged calculations as INCORRECT`);
            }

            if (result.appraisalValidation?.overallProperty === 'POOR') {
              cy.log(`⚠️ Appraiser rated property as POOR investment`);
            }

            if (result.cpaValidation?.financialRisk === 'HIGH') {
              cy.log(`⚠️ CPA flagged HIGH financial risk`);
            }

            if (result.institutionalValidation?.investmentDecision === 'REJECT') {
              cy.log(`❌ Institutional investor would REJECT this deal`);
            }
          } else {
            cy.log(`❌ ${validation.expert.toUpperCase()} Expert: Validation failed - ${validation.result.error}`);
          }
        });

        // Generate comprehensive validation report
        cy.task('generateValidationReport', {
          propertyData: propertyData,
          calculatedMetrics: calculatedMetrics,
          uiResults: { status: 'UI validation would be populated here' },
          aiResults: expertValidation
        });

        // Overall assessment
        switch (expertValidation.recommendation) {
          case 'CALCULATIONS_VALIDATED':
            cy.log('✅ AI EXPERT CONSENSUS: Calculations are accurate and validated');
            break;
          case 'MINOR_DISCREPANCIES_FOUND':
            cy.log('⚠️ AI EXPERT CONSENSUS: Minor discrepancies found, review recommended');
            break;
          case 'MAJOR_DISCREPANCIES_FOUND':
            cy.log('🚨 AI EXPERT CONSENSUS: Major discrepancies found, calculations need review');
            break;
          default:
            cy.log('❓ AI EXPERT CONSENSUS: Review required');
        }
      });
    });
  });

  it('comprehensive validation summary and reporting', () => {
    // This test combines UI validation with AI expert validation
    // and generates a comprehensive report

    cy.completeAnnaTexasPropertyWizard();
    cy.intercept('POST', '/api/deals/analyze').as('backendAnalysis');
    cy.get('[data-testid="analyze-property-button"]').click();

    cy.wait('@backendAnalysis').then((interception) => {
      const backend = interception.response.body.analysis;

      // Track UI validation results
      const uiValidationResults = {
        totalMetricsChecked: 0,
        passedValidations: 0,
        failedValidations: 0,
        formattingIssues: 0,
        discrepancies: []
      };

      // Example: Validate a few key metrics and track results
      const keyMetricsToValidate = [
        { testId: 'monthly-cash-flow', backendValue: backend.monthlyAnalysis.cashFlow, formatter: formatCurrency },
        { testId: 'cap-rate', backendValue: backend.keyMetrics.capRate, formatter: formatPercent },
        { testId: 'cash-on-cash-return', backendValue: backend.keyMetrics.cashOnCashReturn, formatter: formatPercent }
      ];

      keyMetricsToValidate.forEach(metric => {
        uiValidationResults.totalMetricsChecked++;

        cy.get(`[data-testid="${metric.testId}"]`).then($element => {
          const uiValue = $element.text();
          const expectedValue = metric.formatter(metric.backendValue);

          if (uiValue.includes(expectedValue)) {
            uiValidationResults.passedValidations++;
            cy.log(`✅ ${metric.testId}: UI matches backend`);
          } else {
            uiValidationResults.failedValidations++;
            uiValidationResults.discrepancies.push({
              metric: metric.testId,
              uiValue: uiValue,
              expectedValue: expectedValue,
              backendValue: metric.backendValue
            });
            cy.log(`❌ ${metric.testId}: UI="${uiValue}" vs Expected="${expectedValue}"`);
          }
        });
      });

      // Now run AI validation and combine results
      cy.task('validateWithAIExperts', {
        propertyData: {
          address: '1837 Walnut Way, Anna, TX 75409',
          purchasePrice: 170000,
          monthlyRent: 1749,
          downPaymentPercent: 25,
          interestRate: 5.75
        },
        calculatedMetrics: {
          monthlyCashFlow: backend.monthlyAnalysis.cashFlow,
          capRate: backend.keyMetrics.capRate,
          cashOnCashReturn: backend.keyMetrics.cashOnCashReturn,
          irr: backend.keyMetrics.irr,
          verdict: backend.investmentDecision.verdict
        }
      }).then((aiValidation) => {
        // Final comprehensive assessment
        const overallAssessment = {
          uiValidation: uiValidationResults,
          aiValidation: aiValidation,
          overallStatus: 'DETERMINING...'
        };

        // Determine overall status
        if (uiValidationResults.failedValidations === 0 &&
            aiValidation.recommendation === 'CALCULATIONS_VALIDATED') {
          overallAssessment.overallStatus = 'ALL_VALIDATIONS_PASSED';
        } else if (uiValidationResults.failedValidations > 0 ||
                   aiValidation.discrepancies?.some(d => d.severity === 'HIGH')) {
          overallAssessment.overallStatus = 'CRITICAL_ISSUES_FOUND';
        } else {
          overallAssessment.overallStatus = 'MINOR_ISSUES_FOUND';
        }

        // Log final summary
        cy.task('logValidationResults', overallAssessment);

        // Generate final report
        cy.task('generateValidationReport', {
          propertyData: { address: '1837 Walnut Way, Anna, TX 75409' },
          calculatedMetrics: backend,
          uiResults: uiValidationResults,
          aiResults: aiValidation
        }).then((report) => {
          cy.log('📋 FINAL VALIDATION REPORT GENERATED');
          cy.log(`   Overall Status: ${overallAssessment.overallStatus}`);
          cy.log(`   UI Metrics Validated: ${uiValidationResults.passedValidations}/${uiValidationResults.totalMetricsChecked}`);
          cy.log(`   AI Expert Confidence: ${(aiValidation.overallConfidence * 100).toFixed(1)}%`);
        });
      });
    });
  });
});

// ===== UTILITY FUNCTIONS =====

function formatCurrency(value) {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value) {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(2)}%`;
}

// ===== REUSE EXISTING COMMAND =====

Cypress.Commands.add('completeAnnaTexasPropertyWizard', () => {
  // Reuse existing Anna TX property setup from your working tests
  // This should match exactly what we used in expert validation tests

  // Step 1: Property Address & Details
  cy.get('[data-testid="wizard-step-1"]').should('be.visible');
  cy.get('[data-testid="property-address-input"]').type('1837 Walnut Way, Anna, TX 75409');
  cy.wait(2000); // Allow RentCast auto-population
  cy.get('[data-testid="next-step-button"]').click();

  // Step 2: Purchase & Financing
  cy.get('[data-testid="wizard-step-2"]').should('be.visible');
  cy.get('[data-testid="purchase-price"]').should('have.value', '170000'); // Should auto-populate
  cy.get('[data-testid="down-payment-percent"]').clear().type('25');
  cy.get('[data-testid="interest-rate"]').clear().type('5.75');
  cy.get('[data-testid="next-step-button"]').click();

  // Step 3: Rental Analysis
  cy.get('[data-testid="wizard-step-3"]').should('be.visible');
  cy.get('[data-testid="monthly-rent"]').should('have.value', '1749'); // Should auto-populate
  cy.get('[data-testid="next-step-button"]').click();

  // Step 4: Investment Goals & Strategy
  cy.get('[data-testid="wizard-step-4"]').should('be.visible');
  cy.get('[data-testid="exit-strategy-select"]').select('Sale (7-10 years)');
  cy.get('[data-testid="portfolio-strategy-select"]').select('Balanced Approach');
  cy.get('[data-testid="risk-tolerance-select"]').select('Moderate');
  cy.get('[data-testid="experience-level-select"]').select('Some Experience');
});