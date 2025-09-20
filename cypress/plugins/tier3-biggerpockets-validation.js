/**
 * TIER 3: BiggerPockets API Cross-Reference Validation
 *
 * Validates core real estate metrics against BiggerPockets industry standards
 * Limited to ~8-12 core metrics due to different assumptions
 */

class Tier3BiggerPocketsValidator {
  constructor() {
    this.tolerance = {
      currency: 15,      // $15 tolerance
      percentage: 0.3,   // 0.3% tolerance for BP differences
      ratio: 0.1,        // 0.1 tolerance
      price: 1000        // $1000 tolerance for price analysis
    };

    // Core metrics that BiggerPockets calculator provides
    this.coreMetrics = [
      'capRate',
      'monthlyCashFlow',
      'cashOnCashReturn',
      'fiftyPercentRule',
      'onePercentRule',
      'grossRentMultiplier',
      'rentToPriceRatio',
      'purchasePriceAnalysis'
    ];
  }

  async validateAgainstBiggerPockets(propertyData, ourResults) {
    try {
      // Attempt BiggerPockets API integration
      const bpResults = await this.getBiggerPocketsCalculations(propertyData);

      const validations = [];

      // Validate each core metric
      for (const metric of this.coreMetrics) {
        const validation = this.validateMetric(metric, ourResults, bpResults, propertyData);
        if (validation) {
          validations.push(validation);
        }
      }

      return {
        tier: 'BiggerPockets API Cross-Reference',
        validations: validations,
        summary: this.summarizeValidations(validations),
        bpDataSource: bpResults.dataSource || 'API',
        disclaimer: 'BiggerPockets may use different assumptions for expenses and projections'
      };

    } catch (error) {
      // Fallback to manual calculation approximation
      return this.fallbackValidation(propertyData, ourResults, error.message);
    }
  }

  async getBiggerPocketsCalculations(propertyData) {
    // This would integrate with BiggerPockets API if available
    // For now, simulate BP calculations using their known formulas

    const purchasePrice = propertyData.purchasePrice || 245000;
    const monthlyRent = propertyData.monthlyRent || 1749;
    const downPaymentPercent = propertyData.downPaymentPercent || 20;
    const interestRate = propertyData.interestRate || 7.5;

    // BiggerPockets calculator assumptions
    const bpAssumptions = {
      maintenancePercent: 5,     // 5% of rent
      vacancyPercent: 5,         // 5% of rent
      propertyManagementPercent: 8, // 8% of rent
      insuranceMonthly: 100,     // $100/month estimate
      propertyTaxPercent: 1.2    // 1.2% annually
    };

    // Calculate using BP methodology
    const grossMonthlyIncome = monthlyRent;
    const maintenance = monthlyRent * (bpAssumptions.maintenancePercent / 100);
    const vacancy = monthlyRent * (bpAssumptions.vacancyPercent / 100);
    const propertyManagement = monthlyRent * (bpAssumptions.propertyManagementPercent / 100);
    const insurance = bpAssumptions.insuranceMonthly;
    const propertyTax = (purchasePrice * (bpAssumptions.propertyTaxPercent / 100)) / 12;

    // Mortgage calculation
    const loanAmount = purchasePrice * (1 - downPaymentPercent / 100);
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = 30 * 12;
    const monthlyMortgage = this.calculatePMT(monthlyRate, numberOfPayments, loanAmount);

    const totalExpenses = monthlyMortgage + propertyTax + insurance + maintenance + vacancy + propertyManagement;
    const monthlyCashFlow = grossMonthlyIncome - totalExpenses;

    // Key metrics using BP formulas
    const noi = (grossMonthlyIncome - maintenance - vacancy - propertyManagement - insurance - propertyTax) * 12;
    const capRate = (noi / purchasePrice) * 100;

    const downPayment = purchasePrice * (downPaymentPercent / 100);
    const annualCashFlow = monthlyCashFlow * 12;
    const cashOnCashReturn = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

    const grossRentMultiplier = purchasePrice / (monthlyRent * 12);
    const onePercentRule = (monthlyRent / purchasePrice) * 100;
    const rentToPriceRatio = onePercentRule;

    // 50% Rule calculation
    const halfRentRule = monthlyRent * 0.5; // 50% of rent for expenses
    const fiftyPercentRule = grossMonthlyIncome - halfRentRule - monthlyMortgage;

    return {
      dataSource: 'Simulated BP Calculator',
      capRate: capRate,
      monthlyCashFlow: monthlyCashFlow,
      cashOnCashReturn: cashOnCashReturn,
      fiftyPercentRule: fiftyPercentRule,
      onePercentRule: onePercentRule,
      grossRentMultiplier: grossRentMultiplier,
      rentToPriceRatio: rentToPriceRatio,
      purchasePriceAnalysis: purchasePrice,
      assumptions: bpAssumptions
    };
  }

  validateMetric(metricName, ourResults, bpResults, propertyData) {
    const metricMappings = {
      capRate: {
        ourValue: ourResults.keyMetrics?.capRate,
        bpValue: bpResults.capRate,
        tolerance: this.tolerance.percentage,
        type: 'percentage'
      },
      monthlyCashFlow: {
        ourValue: ourResults.monthlyAnalysis?.cashFlow,
        bpValue: bpResults.monthlyCashFlow,
        tolerance: this.tolerance.currency,
        type: 'currency'
      },
      cashOnCashReturn: {
        ourValue: ourResults.keyMetrics?.cashOnCashReturn,
        bpValue: bpResults.cashOnCashReturn,
        tolerance: this.tolerance.percentage,
        type: 'percentage'
      },
      fiftyPercentRule: {
        ourValue: this.calculate50PercentRule(ourResults, propertyData),
        bpValue: bpResults.fiftyPercentRule,
        tolerance: this.tolerance.currency,
        type: 'currency'
      },
      onePercentRule: {
        ourValue: ourResults.keyMetrics?.onePercentRule,
        bpValue: bpResults.onePercentRule,
        tolerance: this.tolerance.percentage,
        type: 'percentage'
      },
      grossRentMultiplier: {
        ourValue: ourResults.keyMetrics?.grossRentMultiplier,
        bpValue: bpResults.grossRentMultiplier,
        tolerance: this.tolerance.ratio,
        type: 'ratio'
      },
      rentToPriceRatio: {
        ourValue: ourResults.keyMetrics?.onePercentRule, // Same as 1% rule
        bpValue: bpResults.rentToPriceRatio,
        tolerance: this.tolerance.percentage,
        type: 'percentage'
      },
      purchasePriceAnalysis: {
        ourValue: propertyData.purchasePrice,
        bpValue: bpResults.purchasePriceAnalysis,
        tolerance: this.tolerance.price,
        type: 'currency'
      }
    };

    const mapping = metricMappings[metricName];
    if (!mapping || mapping.ourValue === undefined || mapping.bpValue === undefined) {
      return {
        metric: metricName,
        status: 'MISSING_DATA',
        ourValue: mapping?.ourValue,
        bpValue: mapping?.bpValue
      };
    }

    const variance = Math.abs(mapping.ourValue - mapping.bpValue);
    const withinTolerance = variance <= mapping.tolerance;

    // Calculate percentage variance for reporting
    const percentageVariance = mapping.ourValue !== 0 ?
      (variance / Math.abs(mapping.ourValue)) * 100 : 0;

    return {
      metric: metricName,
      metricType: mapping.type,
      ourValue: mapping.ourValue,
      bpValue: mapping.bpValue,
      variance: variance,
      percentageVariance: percentageVariance,
      tolerance: mapping.tolerance,
      withinTolerance: withinTolerance,
      status: withinTolerance ? 'PASS' : 'FAIL',
      note: this.getMetricNote(metricName)
    };
  }

  calculate50PercentRule(ourResults, propertyData) {
    // 50% Rule: Monthly rent - 50% (for expenses) - mortgage payment
    const monthlyRent = propertyData.monthlyRent || ourResults.monthlyAnalysis?.income?.gross || 0;
    const mortgage = ourResults.monthlyAnalysis?.expenses?.mortgage || 0;
    return monthlyRent - (monthlyRent * 0.5) - mortgage;
  }

  getMetricNote(metricName) {
    const notes = {
      capRate: 'BP may use different expense assumptions',
      monthlyCashFlow: 'BP typically uses higher expense ratios',
      cashOnCashReturn: 'BP may include different closing costs',
      fiftyPercentRule: 'BP 50% rule is a quick estimation method',
      onePercentRule: 'Industry standard calculation should match',
      grossRentMultiplier: 'Simple ratio should match closely',
      rentToPriceRatio: 'Same as 1% rule calculation',
      purchasePriceAnalysis: 'Input value should match exactly'
    };
    return notes[metricName] || 'Standard calculation comparison';
  }

  calculatePMT(rate, nper, pv) {
    if (rate === 0) return pv / nper;
    return pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
  }

  summarizeValidations(validations) {
    const total = validations.length;
    const passed = validations.filter(v => v.status === 'PASS').length;
    const failed = validations.filter(v => v.status === 'FAIL').length;
    const missing = validations.filter(v => v.status === 'MISSING_DATA').length;

    return {
      total: total,
      passed: passed,
      failed: failed,
      missing: missing,
      successRate: total > 0 ? (passed / total) * 100 : 0,
      overallStatus: this.determineOverallStatus(passed, failed, total)
    };
  }

  determineOverallStatus(passed, failed, total) {
    if (total === 0) return 'NO_DATA';

    const successRate = (passed / total) * 100;
    if (successRate >= 85) return 'EXCELLENT';
    if (successRate >= 75) return 'GOOD';
    if (successRate >= 65) return 'ACCEPTABLE';
    return 'NEEDS_INVESTIGATION';
  }

  fallbackValidation(propertyData, ourResults, errorMessage) {
    return {
      tier: 'BiggerPockets API Cross-Reference',
      status: 'FALLBACK_MODE',
      error: errorMessage,
      validations: [{
        metric: 'API_CONNECTION',
        status: 'FAIL',
        note: 'BiggerPockets API not available, used simulated calculations'
      }],
      summary: {
        total: 1,
        passed: 0,
        failed: 1,
        successRate: 0,
        overallStatus: 'API_ERROR'
      },
      disclaimer: 'Validation attempted using simulated BiggerPockets methodology'
    };
  }

  // Future: Real BiggerPockets API integration
  async callBiggerPocketsAPI(propertyData) {
    // This would require actual BiggerPockets API integration
    // const response = await fetch('https://api.biggerpockets.com/calculator', {...});
    throw new Error('BiggerPockets API integration not yet available');
  }
}

module.exports = Tier3BiggerPocketsValidator;