const Deal = require('../models/Deal');
const OpenAI = require('openai');
const logger = require('../utils/logger');

class DealContext {
  constructor() {
    this.openai = new OpenAI(process.env.OPENAI_API_KEY);
  }

  async analyzeDeal(dealData) {
    try {
      // Create basic deal record
      const deal = new Deal(dealData);

      if (deal.propertyType === 'single_family') {
        await this.analyzeSFRDeal(deal);
      } else {
        // Calculate basic metrics
        const metrics = this.calculateMetrics(dealData);
        
        // Get AI analysis
        const aiAnalysis = await this.getAIAnalysis(dealData, metrics);
        deal.aiAnalysis = aiAnalysis;

        // Get contextual data
        const contextualData = await this.getContextualData(dealData);
        deal.contextualData = contextualData;
      }

      // Add analysis to history
      deal.analysisHistory.push({
        metrics: deal.propertyType === 'single_family' ? 
          deal.sfrDetails.monthlyAnalysis : this.calculateMetrics(dealData),
        aiAnalysis: deal.aiAnalysis,
        marketConditions: {
          interestRates: dealData.interestRate,
          localMarketIndicators: deal.contextualData.marketComps,
          economicIndicators: deal.contextualData.economicIndicators
        }
      });

      deal.status = 'analyzed';
      await deal.save();

      return deal;
    } catch (error) {
      logger.error('Error in analyzeDeal:', error);
      throw error;
    }
  }

  async analyzeSFRDeal(deal) {
    try {
      const sfrDetails = deal.sfrDetails;

      // Calculate purchase analysis
      sfrDetails.purchaseAnalysis = this.calculateSFRPurchaseAnalysis(deal);

      // Calculate monthly analysis
      sfrDetails.monthlyAnalysis = this.calculateSFRMonthlyAnalysis(deal);

      // Calculate annual analysis
      sfrDetails.annualAnalysis = this.calculateSFRAnnualAnalysis(deal);

      // Calculate long-term analysis
      sfrDetails.longTermAnalysis = this.calculateLongTermAnalysis(deal);

      // Get market comparables
      const comps = await this.getSFRComparables(deal);
      sfrDetails.comparables = comps.sales;
      sfrDetails.rentalComps = comps.rentals;

      // Get AI analysis specific to SFR
      deal.aiAnalysis = await this.getSFRAIAnalysis(deal);

      return deal;
    } catch (error) {
      logger.error('Error in SFR analysis:', error);
      throw error;
    }
  }

  calculateSFRPurchaseAnalysis(deal) {
    const {
      purchasePrice,
      downPayment,
      interestRate,
      loanTerm
    } = deal;

    const loanAmount = purchasePrice - downPayment;
    const monthlyInterestRate = interestRate / 12 / 100;
    const numberOfPayments = loanTerm * 12;

    // Calculate monthly mortgage payment (P&I)
    const monthlyPayment =
      (loanAmount *
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    // Estimate closing costs (typically 2-5% of purchase price)
    const closingCosts = purchasePrice * 0.03;

    // Calculate renovation costs if needed
    const renovationCosts = deal.sfrDetails.renovationNeeded ? 
      deal.sfrDetails.renovationCosts.total : 0;

    return {
      purchasePrice,
      closingCosts,
      renovationCosts,
      totalInvestment: purchasePrice + closingCosts + renovationCosts,
      loanDetails: {
        amount: loanAmount,
        type: '30-year-fixed', // Default assumption
        term: loanTerm,
        rate: interestRate,
        monthlyPayment,
        downPayment,
        pmi: downPayment / purchasePrice < 0.2 ? (loanAmount * 0.005) / 12 : 0
      }
    };
  }

  calculateSFRMonthlyAnalysis(deal) {
    const sfrDetails = deal.sfrDetails;
    const purchaseAnalysis = sfrDetails.purchaseAnalysis;

    // Calculate income
    const income = {
      baseRent: deal.monthlyRent,
      otherIncome: 0, // Can be updated later
      totalIncome: deal.monthlyRent
    };

    // Calculate management fee
    const managementFee = (sfrDetails.propertyManagement?.feePercentage || 4) / 100 * income.baseRent;

    // Calculate monthly accrual for tenant turnover costs if annual turnover is assumed
    let tenantTurnoverAccrual = 0;
    if (sfrDetails.tenantTurnover?.assumedAnnualTurnover) {
      const annualTurnoverCosts = this.calculateAnnualTurnoverCosts(deal);
      tenantTurnoverAccrual = annualTurnoverCosts / 12;
    }

    // Calculate expenses
    const expenses = {
      mortgage: purchaseAnalysis.loanDetails.monthlyPayment,
      taxes: deal.propertyTax / 12,
      insurance: deal.insurance / 12,
      hoa: sfrDetails.hoa?.monthly || 0,
      utilities: Object.values(sfrDetails.utilities || {}).reduce((sum, val) => sum + (val || 0), 0),
      management: managementFee,
      maintenance: deal.maintenance,
      vacancy: income.baseRent * 0.05, // 5% vacancy rate assumption
      capex: income.baseRent * 0.05, // 5% capital expenditure assumption
      tenantTurnoverAccrual: tenantTurnoverAccrual,
      total: 0 // Will be calculated
    };

    expenses.total = Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0);

    return {
      income,
      expenses,
      cashFlow: income.totalIncome - expenses.total
    };
  }

  calculateSFRAnnualAnalysis(deal) {
    const monthly = deal.sfrDetails.monthlyAnalysis;
    const purchase = deal.sfrDetails.purchaseAnalysis;

    // Calculate annual turnover costs
    const turnoverCosts = this.calculateAnnualTurnoverCosts(deal);

    const grossRent = monthly.income.baseRent * 12;
    // Assuming 5% vacancy plus one month for turnover if applicable
    const effectiveGrossIncome = deal.sfrDetails.tenantTurnover?.assumedAnnualTurnover ?
      grossRent * (0.95 - 1/12) : // If annual turnover, subtract another month
      grossRent * 0.95;

    const operatingExpenses = (monthly.expenses.total - monthly.expenses.mortgage) * 12;
    const netOperatingIncome = effectiveGrossIncome - operatingExpenses;
    const cashFlow = (monthly.cashFlow * 12) - turnoverCosts.total; // Subtract turnover costs from annual cash flow

    return {
      grossRent,
      effectiveGrossIncome,
      operatingExpenses,
      netOperatingIncome,
      cashFlow,
      capRate: (netOperatingIncome / deal.purchasePrice) * 100,
      cashOnCashReturn: (cashFlow / purchase.totalInvestment) * 100,
      roi: ((netOperatingIncome + (deal.sfrDetails.afterRepairValue - deal.purchasePrice)) / 
        purchase.totalInvestment) * 100,
      irr: 0, // Would need cash flow projections for IRR calculation
      turnoverCosts: {
        realtorCommission: turnoverCosts.realtorCommission,
        prepFees: turnoverCosts.prepFees,
        total: turnoverCosts.total
      }
    };
  }

  calculateAnnualTurnoverCosts(deal) {
    const monthlyRent = deal.monthlyRent;
    const turnover = deal.sfrDetails.tenantTurnover;
    
    if (!turnover?.assumedAnnualTurnover) {
      return {
        realtorCommission: 0,
        prepFees: 0,
        total: 0
      };
    }

    // Calculate realtor commission (default 1 month rent)
    const realtorCommission = monthlyRent * (turnover.realtorCommissionMonths || 1);

    // Calculate prep fees (default 1 month rent)
    const prepFees = monthlyRent * (turnover.prepFeesMonths || 1);

    // Add any additional average turnover costs
    const additionalCosts = Object.values(turnover.averageTurnoverCosts || {})
      .reduce((sum, cost) => sum + (cost || 0), 0);

    return {
      realtorCommission,
      prepFees,
      total: realtorCommission + prepFees + additionalCosts
    };
  }

  async getSFRComparables(deal) {
    // TODO: Implement real estate API integration for comps
    return {
      sales: [],
      rentals: []
    };
  }

  async getSFRAIAnalysis(deal) {
    try {
      const prompt = this.constructSFRAnalysisPrompt(deal);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a single-family residential real estate investment expert. Analyze this property and provide detailed insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      return this.parseSFRAIResponse(completion.choices[0].message.content);
    } catch (error) {
      logger.error('Error in SFR AI analysis:', error);
      throw error;
    }
  }

  constructSFRAnalysisPrompt(deal) {
    const sfr = deal.sfrDetails;
    const monthly = sfr.monthlyAnalysis;
    const annual = sfr.annualAnalysis;
    
    return `
      Analyze this single-family residential investment property:
      
      Property Details:
      - Address: ${deal.propertyAddress.street}, ${deal.propertyAddress.city}, ${deal.propertyAddress.state}
      - Bedrooms: ${sfr.bedrooms}
      - Bathrooms: ${sfr.bathrooms}
      - Square Footage: ${sfr.squareFootage}
      - Year Built: ${sfr.yearBuilt}
      - Condition: ${sfr.condition}
      
      Financial Metrics:
      - Purchase Price: $${deal.purchasePrice}
      - Monthly Rent: $${monthly.income.baseRent}
      - Monthly Cash Flow: $${monthly.cashFlow}
      - Cap Rate: ${annual.capRate}%
      - Cash on Cash Return: ${annual.cashOnCashReturn}%
      - ROI: ${annual.roi}%
      
      Market Analysis:
      - Price per Sq Ft: $${deal.purchasePrice / sfr.squareFootage}
      - Rent per Sq Ft: $${(monthly.income.baseRent / sfr.squareFootage).toFixed(2)}
      - Number of Comparable Sales: ${sfr.comparables.length}
      - Number of Rental Comps: ${sfr.rentalComps.length}
      
      Please provide:
      1. Market position analysis
      2. Rental demand assessment
      3. Value-add opportunities
      4. Risk factors
      5. Improvement recommendations
      6. Hold period recommendations
      7. Exit strategy options
      8. Overall investment rating (1-10)
    `;
  }

  parseSFRAIResponse(response) {
    // TODO: Implement proper parsing of AI response
    return {
      cashFlowScore: 75,
      marketTrends: {
        priceGrowth: "positive",
        rentalDemand: "high",
        marketCondition: "stable"
      },
      riskAssessment: {
        overallRisk: "moderate",
        keyFactors: ["location", "market conditions", "property condition"]
      },
      recommendations: [
        "Consider long-term hold strategy",
        "Monitor market trends closely",
        "Plan for periodic maintenance"
      ],
      valueAddOpportunities: [
        "Kitchen upgrade potential",
        "Bathroom modernization",
        "Landscaping improvements"
      ],
      exitStrategies: [
        "Long-term rental",
        "Fix and flip",
        "Owner-occupant sale"
      ],
      investmentRating: 7.5
    };
  }

  async updateDealPerformance(dealId, performanceData) {
    try {
      const deal = await Deal.findById(dealId);
      if (!deal) throw new Error('Deal not found');

      deal.performanceMetrics = {
        ...deal.performanceMetrics,
        ...performanceData
      };

      // Recalculate ROI based on actual performance
      const actualAnnualIncome = 
        (performanceData.actualRent * 12 * (performanceData.occupancyRate / 100)) -
        (performanceData.actualExpenses * 12);
      
      deal.performanceMetrics.netOperatingIncome = actualAnnualIncome;
      deal.performanceMetrics.returnOnInvestment = 
        (actualAnnualIncome / deal.purchasePrice) * 100;

      await deal.save();
      return deal;
    } catch (error) {
      logger.error('Error updating deal performance:', error);
      throw error;
    }
  }

  async compareDeals(dealIds) {
    try {
      const deals = await Deal.compareDeals(dealIds);
      
      // Calculate comparative metrics
      const comparison = {
        deals: deals.map(deal => ({
          id: deal._id,
          address: deal.propertyAddress,
          metrics: {
            purchasePrice: deal.purchasePrice,
            monthlyRent: deal.monthlyRent,
            cashFlowScore: deal.aiAnalysis.cashFlowScore,
            roi: deal.performanceMetrics.returnOnInvestment
          }
        })),
        summary: this.calculateComparativeSummary(deals)
      };

      return comparison;
    } catch (error) {
      logger.error('Error comparing deals:', error);
      throw error;
    }
  }

  calculateComparativeSummary(deals) {
    const summary = {
      averagePurchasePrice: 0,
      averageMonthlyRent: 0,
      averageCashFlowScore: 0,
      averageROI: 0,
      bestPerformer: null,
      worstPerformer: null
    };

    if (deals.length === 0) return summary;

    // Calculate averages
    deals.forEach(deal => {
      summary.averagePurchasePrice += deal.purchasePrice;
      summary.averageMonthlyRent += deal.monthlyRent;
      summary.averageCashFlowScore += deal.aiAnalysis.cashFlowScore;
      summary.averageROI += deal.performanceMetrics.returnOnInvestment;
    });

    summary.averagePurchasePrice /= deals.length;
    summary.averageMonthlyRent /= deals.length;
    summary.averageCashFlowScore /= deals.length;
    summary.averageROI /= deals.length;

    // Find best and worst performers
    deals.sort((a, b) => 
      b.performanceMetrics.returnOnInvestment - a.performanceMetrics.returnOnInvestment
    );

    summary.bestPerformer = {
      id: deals[0]._id,
      address: deals[0].propertyAddress,
      roi: deals[0].performanceMetrics.returnOnInvestment
    };

    summary.worstPerformer = {
      id: deals[deals.length - 1]._id,
      address: deals[deals.length - 1].propertyAddress,
      roi: deals[deals.length - 1].performanceMetrics.returnOnInvestment
    };

    return summary;
  }

  calculateMetrics(dealData) {
    const {
      purchasePrice,
      downPayment,
      interestRate,
      loanTerm,
      monthlyRent,
      propertyTax,
      insurance,
      maintenance,
    } = dealData;

    const loanAmount = purchasePrice - downPayment;
    const monthlyInterestRate = interestRate / 12 / 100;
    const numberOfPayments = loanTerm * 12;

    // Calculate monthly mortgage payment (P&I)
    const monthlyMortgage =
      (loanAmount *
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    // Calculate monthly expenses
    const monthlyExpenses = {
      mortgage: monthlyMortgage,
      propertyTax: propertyTax / 12,
      insurance: insurance / 12,
      maintenance: maintenance,
    };

    const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce(
      (sum, expense) => sum + expense,
      0
    );

    // Calculate cash flow
    const monthlyCashFlow = monthlyRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    // Calculate ROI
    const totalInvestment = downPayment + (propertyTax + insurance);
    const cashOnCashROI = (annualCashFlow / totalInvestment) * 100;

    return {
      monthlyMortgage,
      monthlyExpenses,
      totalMonthlyExpenses,
      monthlyCashFlow,
      annualCashFlow,
      cashOnCashROI,
      capRate: (annualCashFlow / purchasePrice) * 100,
      debtServiceCoverageRatio: monthlyCashFlow / monthlyMortgage
    };
  }

  async getAIAnalysis(dealData, metrics) {
    try {
      const prompt = this.constructAnalysisPrompt(dealData, metrics);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a real estate investment analysis expert. Analyze the deal and provide insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      const analysis = this.parseAIResponse(completion.choices[0].message.content);
      
      return {
        ...analysis,
        lastAnalyzed: new Date(),
      };
    } catch (error) {
      logger.error('Error in AI analysis:', error);
      throw error;
    }
  }

  constructAnalysisPrompt(dealData, metrics) {
    return `
      Analyze this real estate investment opportunity:
      
      Property Details:
      - Address: ${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}, ${dealData.propertyAddress.state}
      - Type: ${dealData.propertyType}
      - Purchase Price: $${dealData.purchasePrice}
      - Monthly Rent: $${dealData.monthlyRent}
      
      Key Metrics:
      - Monthly Cash Flow: $${metrics.monthlyCashFlow.toFixed(2)}
      - Cash on Cash ROI: ${metrics.cashOnCashROI.toFixed(2)}%
      - Cap Rate: ${metrics.capRate.toFixed(2)}%
      - Debt Service Coverage Ratio: ${metrics.debtServiceCoverageRatio.toFixed(2)}
      - Total Monthly Expenses: $${metrics.totalMonthlyExpenses.toFixed(2)}
      
      Please provide:
      1. A cash flow score (0-100)
      2. Market trend analysis
      3. Risk assessment
      4. Investment recommendations
      5. Potential value-add opportunities
      6. Exit strategy suggestions
    `;
  }

  parseAIResponse(response) {
    // TODO: Implement proper parsing of AI response
    // For now, returning example data
    return {
      cashFlowScore: 75,
      marketTrends: {
        priceGrowth: "positive",
        rentalDemand: "high",
        marketCondition: "stable"
      },
      riskAssessment: {
        overallRisk: "moderate",
        keyFactors: ["location", "market conditions", "property condition"]
      },
      recommendations: [
        "Consider long-term hold strategy",
        "Monitor market trends closely",
        "Plan for periodic maintenance"
      ]
    };
  }

  async getContextualData(dealData) {
    // TODO: Implement real API integrations
    return {
      marketComps: [],
      demographicData: {},
      economicIndicators: {},
      propertyHistory: {}
    };
  }

  async addNote(dealId, noteData) {
    try {
      const deal = await Deal.findById(dealId);
      if (!deal) throw new Error('Deal not found');
      await deal.addNote(noteData);
      return deal;
    } catch (error) {
      logger.error('Error adding note:', error);
      throw error;
    }
  }

  async addDocument(dealId, documentData) {
    try {
      const deal = await Deal.findById(dealId);
      if (!deal) throw new Error('Deal not found');
      await deal.addDocument(documentData);
      return deal;
    } catch (error) {
      logger.error('Error adding document:', error);
      throw error;
    }
  }

  calculateLongTermAnalysis(deal) {
    const assumptions = deal.sfrDetails.longTermAssumptions;
    const purchaseAnalysis = deal.sfrDetails.purchaseAnalysis;
    const monthlyAnalysis = deal.sfrDetails.monthlyAnalysis;
    const annualAnalysis = deal.sfrDetails.annualAnalysis;

    // Initialize cash flows array with initial investment as first (negative) cash flow
    const cashFlows = [-purchaseAnalysis.totalInvestment];
    const yearlyProjections = [];

    let currentPropertyValue = deal.purchasePrice;
    let currentRent = monthlyAnalysis.income.baseRent;
    let mortgageBalance = purchaseAnalysis.loanDetails.amount;
    const monthlyMortgagePayment = purchaseAnalysis.loanDetails.monthlyPayment;
    const monthlyInterestRate = purchaseAnalysis.loanDetails.rate / 12 / 100;

    // Calculate yearly projections
    for (let year = 1; year <= assumptions.projectionYears; year++) {
      // Calculate property value appreciation
      currentPropertyValue *= (1 + assumptions.annualPropertyValueIncrease / 100);

      // Calculate rent increase
      currentRent *= (1 + assumptions.annualRentIncrease / 100);

      // Calculate mortgage balance
      const yearlyMortgagePayment = monthlyMortgagePayment * 12;
      const yearlyInterest = mortgageBalance * (purchaseAnalysis.loanDetails.rate / 100);
      const yearlyPrincipal = yearlyMortgagePayment - yearlyInterest;
      mortgageBalance -= yearlyPrincipal;

      // Calculate operating expenses with inflation
      const inflatedExpenses = Object.entries(monthlyAnalysis.expenses)
        .reduce((acc, [key, value]) => {
          if (key !== 'total' && key !== 'mortgage') {
            acc[key] = value * Math.pow(1 + assumptions.inflationRate / 100, year);
          }
          return acc;
        }, {});

      // Add mortgage payment back
      inflatedExpenses.mortgage = monthlyMortgagePayment;

      // Calculate turnover costs for the year
      const turnoverCosts = deal.sfrDetails.tenantTurnover?.assumedAnnualTurnover ?
        this.calculateAnnualTurnoverCosts({ ...deal, monthlyRent: currentRent }) :
        { realtorCommission: 0, prepFees: 0, total: 0 };

      // Calculate yearly cash flow
      const yearlyGrossRent = currentRent * 12;
      const yearlyEffectiveGrossIncome = deal.sfrDetails.tenantTurnover?.assumedAnnualTurnover ?
        yearlyGrossRent * (0.95 - 1/12) :
        yearlyGrossRent * 0.95;

      const yearlyOperatingExpenses = Object.values(inflatedExpenses).reduce((sum, exp) => sum + exp, 0) * 12;
      const yearlyNetOperatingIncome = yearlyEffectiveGrossIncome - yearlyOperatingExpenses;
      const yearlyCashFlow = yearlyNetOperatingIncome - turnoverCosts.total;

      // Store yearly projection
      yearlyProjections.push({
        year,
        grossRent: yearlyGrossRent,
        effectiveGrossIncome: yearlyEffectiveGrossIncome,
        operatingExpenses: yearlyOperatingExpenses,
        netOperatingIncome: yearlyNetOperatingIncome,
        cashFlow: yearlyCashFlow,
        propertyValue: currentPropertyValue,
        equity: currentPropertyValue - mortgageBalance,
        mortgageBalance,
        turnoverCosts
      });

      // Add to cash flows array for IRR calculation
      cashFlows.push(yearlyCashFlow);
    }

    // Calculate exit analysis
    const exitAnalysis = this.calculateExitAnalysis(
      currentPropertyValue,
      mortgageBalance,
      assumptions.sellingCostsPercentage
    );

    // Add final proceeds to cash flows for IRR calculation
    cashFlows[cashFlows.length - 1] += exitAnalysis.netProceedsFromSale;

    // Calculate IRR and other return metrics
    const returns = this.calculateReturnMetrics(cashFlows, yearlyProjections, exitAnalysis);

    return {
      yearlyProjections,
      exitAnalysis,
      returns
    };
  }

  calculateExitAnalysis(propertyValue, mortgageBalance, sellingCostsPercentage) {
    const sellingCosts = propertyValue * (sellingCostsPercentage / 100);
    const netProceedsFromSale = propertyValue - sellingCosts - mortgageBalance;

    return {
      projectedSalePrice: propertyValue,
      sellingCosts,
      mortgagePayoff: mortgageBalance,
      netProceedsFromSale
    };
  }

  calculateReturnMetrics(cashFlows, yearlyProjections, exitAnalysis) {
    // Calculate IRR
    const irr = this.calculateIRR(cashFlows);

    // Calculate total cash flow
    const totalCashFlow = yearlyProjections.reduce((sum, year) => sum + year.cashFlow, 0);

    // Calculate total appreciation
    const totalAppreciation = exitAnalysis.netProceedsFromSale;

    // Calculate total return
    const totalReturn = totalCashFlow + totalAppreciation;

    // Calculate average annual cash flow
    const averageAnnualCashFlow = totalCashFlow / yearlyProjections.length;

    // Calculate equity multiple
    const equityMultiple = (totalReturn - cashFlows[0]) / Math.abs(cashFlows[0]);

    return {
      totalCashFlow,
      totalAppreciation,
      totalReturn,
      averageAnnualCashFlow,
      irr,
      equityMultiple
    };
  }

  calculateIRR(cashFlows, guess = 0.1) {
    const maxIterations = 1000;
    const tolerance = 0.0000001;

    const npv = (rate) => {
      return cashFlows.reduce((acc, cf, i) => {
        return acc + cf / Math.pow(1 + rate, i);
      }, 0);
    };

    let x0 = guess;
    let x1;

    for (let i = 0; i < maxIterations; i++) {
      const dx = 0.0000001;
      const npv0 = npv(x0);
      const npv1 = npv(x0 + dx);
      const derivative = (npv1 - npv0) / dx;

      if (Math.abs(derivative) < tolerance) break;

      x1 = x0 - npv0 / derivative;
      if (Math.abs(x1 - x0) < tolerance) break;

      x0 = x1;
    }

    return x1 * 100; // Convert to percentage
  }
}

module.exports = new DealContext(); 