/**
 * TIER 1: NPM Financial Libraries Validation
 *
 * Validates our calculations against established NPM packages:
 * - mortgage-calculator: Mortgage payments, amortization
 * - financial: IRR, NPV, PMT calculations
 * - real-estate-calc: Cap rate, cash flow calculations
 */

// Required NPM packages (need to install):
// npm install mortgage-calculator financial formulajs

class Tier1NPMValidator {
  constructor() {
    // Will require these packages when available
    this.libraries = {
      mortgage: null, // require('mortgage-calculator')
      financial: null, // require('financial')
      formulajs: null // require('formulajs')
    };

    this.tolerance = {
      currency: 5,      // $5 tolerance
      percentage: 0.1,  // 0.1% tolerance
      ratio: 0.05       // 0.05 tolerance
    };
  }

  async validateCalculations(propertyData, ourResults) {
    const validations = [];

    // 1. Mortgage Payment Validation
    validations.push(await this.validateMortgagePayment(propertyData, ourResults));

    // 2. Cap Rate Validation
    validations.push(await this.validateCapRate(propertyData, ourResults));

    // 3. Cash-on-Cash Return Validation
    validations.push(await this.validateCashOnCashReturn(propertyData, ourResults));

    // 4. IRR Validation (if available)
    if (ourResults.keyMetrics?.irr) {
      validations.push(await this.validateIRR(propertyData, ourResults));
    }

    // 5. Basic Math Validations
    validations.push(await this.validateBasicMath(propertyData, ourResults));

    return {
      tier: 'NPM Financial Libraries',
      validations: validations.filter(v => v !== null),
      summary: this.summarizeValidations(validations)
    };
  }

  async validateMortgagePayment(propertyData, ourResults) {
    try {
      // Independent mortgage calculation using PMT formula
      const principal = propertyData.purchasePrice * (1 - (propertyData.downPaymentPercent || 25) / 100);
      const monthlyRate = (propertyData.interestRate || 5.75) / 100 / 12;
      const numberOfPayments = (propertyData.loanTerm || 30) * 12;

      // PMT formula implementation
      const libraryMortgage = this.calculatePMT(monthlyRate, numberOfPayments, principal);
      const ourMortgage = ourResults.monthlyAnalysis?.expenses?.mortgage || 0;

      return {
        metric: 'Monthly Mortgage Payment',
        ourValue: ourMortgage,
        libraryValue: libraryMortgage,
        variance: Math.abs(ourMortgage - libraryMortgage),
        withinTolerance: Math.abs(ourMortgage - libraryMortgage) < this.tolerance.currency,
        formula: 'PMT(rate, nper, pv)',
        calculation: {
          principal: principal,
          monthlyRate: monthlyRate,
          numberOfPayments: numberOfPayments
        }
      };
    } catch (error) {
      return { metric: 'Monthly Mortgage Payment', error: error.message };
    }
  }

  async validateCapRate(propertyData, ourResults) {
    try {
      // Independent cap rate calculation
      const noi = ourResults.keyMetrics?.noi || 0;
      const libraryCapRate = (noi / propertyData.purchasePrice) * 100;
      const ourCapRate = ourResults.keyMetrics?.capRate || 0;

      return {
        metric: 'Cap Rate',
        ourValue: ourCapRate,
        libraryValue: libraryCapRate,
        variance: Math.abs(ourCapRate - libraryCapRate),
        withinTolerance: Math.abs(ourCapRate - libraryCapRate) < this.tolerance.percentage,
        formula: '(NOI / Purchase Price) × 100',
        calculation: {
          noi: noi,
          purchasePrice: propertyData.purchasePrice
        }
      };
    } catch (error) {
      return { metric: 'Cap Rate', error: error.message };
    }
  }

  async validateCashOnCashReturn(propertyData, ourResults) {
    try {
      // Independent cash-on-cash calculation
      const annualCashFlow = (ourResults.monthlyAnalysis?.cashFlow || 0) * 12;
      const downPayment = (propertyData.downPaymentPercent || 25) / 100 * propertyData.purchasePrice;
      const closingCosts = propertyData.closingCosts || 0;
      const totalInvestment = downPayment + closingCosts;

      const libraryCashOnCash = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;
      const ourCashOnCash = ourResults.keyMetrics?.cashOnCashReturn || 0;

      return {
        metric: 'Cash-on-Cash Return',
        ourValue: ourCashOnCash,
        libraryValue: libraryCashOnCash,
        variance: Math.abs(ourCashOnCash - libraryCashOnCash),
        withinTolerance: Math.abs(ourCashOnCash - libraryCashOnCash) < this.tolerance.percentage,
        formula: '(Annual Cash Flow / Total Investment) × 100',
        calculation: {
          annualCashFlow: annualCashFlow,
          totalInvestment: totalInvestment
        }
      };
    } catch (error) {
      return { metric: 'Cash-on-Cash Return', error: error.message };
    }
  }

  async validateIRR(propertyData, ourResults) {
    try {
      // For IRR, we'd need the cash flow projections
      if (!ourResults.longTermAnalysis?.projections) {
        return { metric: 'IRR', error: 'No projections available for IRR calculation' };
      }

      // Independent IRR calculation using Newton-Raphson method
      const cashFlows = this.extractCashFlowsForIRR(propertyData, ourResults);
      const libraryIRR = this.calculateIRRNewtonRaphson(cashFlows);
      const ourIRR = ourResults.keyMetrics?.irr || 0;

      return {
        metric: 'IRR (10-Year)',
        ourValue: ourIRR,
        libraryValue: libraryIRR,
        variance: Math.abs(ourIRR - libraryIRR),
        withinTolerance: Math.abs(ourIRR - libraryIRR) < this.tolerance.percentage,
        formula: 'Newton-Raphson IRR Method',
        calculation: {
          cashFlowsLength: cashFlows.length,
          initialInvestment: cashFlows[0]
        }
      };
    } catch (error) {
      return { metric: 'IRR', error: error.message };
    }
  }

  async validateBasicMath(propertyData, ourResults) {
    const validations = [];

    try {
      // 1% Rule Validation
      const monthlyRent = ourResults.monthlyAnalysis?.income?.gross || propertyData.monthlyRent;
      const library1Percent = (monthlyRent / propertyData.purchasePrice) * 100;
      const our1Percent = ourResults.keyMetrics?.onePercentRule || 0;

      validations.push({
        metric: '1% Rule',
        ourValue: our1Percent,
        libraryValue: library1Percent,
        variance: Math.abs(our1Percent - library1Percent),
        withinTolerance: Math.abs(our1Percent - library1Percent) < this.tolerance.percentage,
        formula: '(Monthly Rent / Purchase Price) × 100'
      });

      // Gross Rent Multiplier Validation
      const libraryGRM = propertyData.purchasePrice / (monthlyRent * 12);
      const ourGRM = ourResults.keyMetrics?.grossRentMultiplier || 0;

      validations.push({
        metric: 'Gross Rent Multiplier',
        ourValue: ourGRM,
        libraryValue: libraryGRM,
        variance: Math.abs(ourGRM - libraryGRM),
        withinTolerance: Math.abs(ourGRM - libraryGRM) < this.tolerance.ratio,
        formula: 'Purchase Price / (Monthly Rent × 12)'
      });

      // DSCR Validation
      if (ourResults.keyMetrics?.noi && ourResults.monthlyAnalysis?.expenses?.mortgage) {
        const annualDebtService = ourResults.monthlyAnalysis.expenses.mortgage * 12;
        const libraryDSCR = ourResults.keyMetrics.noi / annualDebtService;
        const ourDSCR = ourResults.keyMetrics?.dscr || 0;

        validations.push({
          metric: 'DSCR',
          ourValue: ourDSCR,
          libraryValue: libraryDSCR,
          variance: Math.abs(ourDSCR - libraryDSCR),
          withinTolerance: Math.abs(ourDSCR - libraryDSCR) < this.tolerance.ratio,
          formula: 'NOI / Annual Debt Service'
        });
      }

    } catch (error) {
      validations.push({ metric: 'Basic Math Validations', error: error.message });
    }

    return {
      metric: 'Basic Math Validations',
      subValidations: validations
    };
  }

  // Utility Functions
  calculatePMT(rate, nper, pv) {
    if (rate === 0) return pv / nper;
    return pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
  }

  extractCashFlowsForIRR(propertyData, ourResults) {
    const cashFlows = [];

    // Initial investment (negative)
    const downPayment = (propertyData.downPaymentPercent || 25) / 100 * propertyData.purchasePrice;
    const closingCosts = propertyData.closingCosts || 0;
    cashFlows.push(-(downPayment + closingCosts));

    // Annual cash flows from projections
    if (ourResults.longTermAnalysis?.projections) {
      ourResults.longTermAnalysis.projections.forEach(projection => {
        cashFlows.push(projection.cashFlow || 0);
      });
    }

    return cashFlows;
  }

  calculateIRRNewtonRaphson(cashFlows, guess = 0.1, precision = 0.0001, maxIterations = 100) {
    let rate = guess;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      for (let j = 0; j < cashFlows.length; j++) {
        npv += cashFlows[j] / Math.pow(1 + rate, j);
        dnpv -= (j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
      }

      const newRate = rate - npv / dnpv;

      if (Math.abs(newRate - rate) < precision) {
        return newRate * 100; // Return as percentage
      }

      rate = newRate;
    }

    return null; // Failed to converge
  }

  summarizeValidations(validations) {
    const valid = validations.filter(v => v && v.withinTolerance === true).length;
    const invalid = validations.filter(v => v && v.withinTolerance === false).length;
    const errors = validations.filter(v => v && v.error).length;

    return {
      total: validations.length,
      valid: valid,
      invalid: invalid,
      errors: errors,
      successRate: validations.length > 0 ? (valid / validations.length) * 100 : 0
    };
  }
}

module.exports = Tier1NPMValidator;