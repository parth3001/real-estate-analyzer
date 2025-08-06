/**
 * Leverage Optimizer - Finds optimal leverage for real estate investments
 * 
 * Key Functions:
 * 1. Stress test multiple leverage scenarios (0% to 90% LTV)
 * 2. Find optimal LTV for maximum risk-adjusted returns
 * 3. Calculate opportunity cost of cash-heavy investments
 * 4. Generate leverage-based recommendations
 */

import { logger } from '../../utils/logger';
import { SFRData } from '../../types/propertyTypes';

export interface LeverageScenario {
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  monthlyPayment: number;
  monthlyInterest: number;
  monthlyPrincipal: number;
  monthlyTotalExpenses: number;
  monthlyNetCashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  dscr: number;
  totalCashRequired: number; // Down payment + closing costs
  leverageScore: number; // 0-100 score for this leverage level
}

export interface LeverageAnalysis {
  scenarios: LeverageScenario[];
  optimalScenario: LeverageScenario;
  currentScenario: LeverageScenario;
  recommendations: LeverageRecommendation[];
  opportunityCost: OpportunityCostAnalysis;
  stressTestResults: StressTestResult;
}

export interface LeverageRecommendation {
  type: 'optimal' | 'conservative' | 'aggressive' | 'warning';
  title: string;
  description: string;
  impact: string;
  action: string;
  priority: 'immediate' | 'short-term' | 'long-term';
}

export interface OpportunityCostAnalysis {
  currentDeployment: {
    cashInvested: number;
    propertiesControlled: number;
    totalAssetValue: number;
    portfolioVelocity: number; // Total assets / cash invested
  };
  optimalDeployment: {
    cashInvested: number;
    propertiesControlled: number;
    totalAssetValue: number;
    portfolioVelocity: number;
  };
  opportunityCostAnnual: number; // Lost returns per year
  capitalEfficiencyGap: number; // How much more efficient optimal deployment is
}

export interface StressTestResult {
  interestRateStress: {
    rateIncrease: number; // +1%, +2%, +3%
    impactOnCashFlow: number;
    impactOnDSCR: number;
    breakEvenRate: number; // Rate where cash flow goes to zero
  };
  vacancyStress: {
    vacancyRate: number; // 5%, 10%, 15%
    impactOnCashFlow: number;
    monthsOfReserves: number;
  };
  propertyValueStress: {
    valueDecline: number; // -10%, -20%
    ltv: number;
    equityRemaining: number;
  };
}

export class LeverageOptimizer {
  private readonly LEVERAGE_SCENARIOS = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 85, 90]; // Down payment percentages
  private readonly OPTIMAL_LEVERAGE_RANGE = [70, 80]; // 70-80% LTV typically optimal
  private readonly CLOSING_COST_PERCENT = 0.03; // 3% closing costs
  private readonly CURRENT_TREASURY_RATE = 0.045; // 4.5% risk-free rate
  private readonly RE_RISK_PREMIUM = 0.02; // 2% real estate risk premium
  
  /**
   * Analyze optimal leverage for a property investment
   */
  async analyzeOptimalLeverage(
    propertyData: SFRData,
    analysis: any,
    availableCash: number
  ): Promise<LeverageAnalysis> {
    const startTime = Date.now();
    logger.info('Leverage Optimizer: Starting analysis', { 
      propertyPrice: propertyData.purchasePrice,
      availableCash 
    });

    try {
      // Generate all leverage scenarios
      const scenarios = this.generateLeverageScenarios(propertyData, analysis);
      
      // Find optimal scenario based on risk-adjusted returns
      const optimalScenario = this.findOptimalScenario(scenarios);
      
      // Identify current scenario (user's intended approach)
      const currentScenario = this.identifyCurrentScenario(scenarios, propertyData, availableCash);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        scenarios, 
        optimalScenario, 
        currentScenario,
        availableCash
      );
      
      // Calculate opportunity cost
      const opportunityCost = this.calculateOpportunityCost(
        currentScenario,
        optimalScenario,
        availableCash,
        propertyData.purchasePrice
      );
      
      // Run stress tests on optimal scenario
      const stressTestResults = this.runStressTests(optimalScenario, propertyData, analysis);
      
      const processingTime = Date.now() - startTime;
      logger.info('Leverage Optimizer: Analysis complete', {
        processingTime: `${processingTime}ms`,
        optimalLTV: `${100 - optimalScenario.downPaymentPercent}%`,
        currentLTV: `${100 - currentScenario.downPaymentPercent}%`,
        opportunityCost: opportunityCost.opportunityCostAnnual
      });

      return {
        scenarios,
        optimalScenario,
        currentScenario,
        recommendations,
        opportunityCost,
        stressTestResults
      };

    } catch (error) {
      logger.error('Leverage Optimizer: Analysis failed', error);
      throw new Error('Failed to analyze leverage optimization');
    }
  }

  /**
   * Generate leverage scenarios for all down payment percentages
   */
  private generateLeverageScenarios(propertyData: SFRData, analysis: any): LeverageScenario[] {
    const purchasePrice = propertyData.purchasePrice;
    const monthlyRent = propertyData.monthlyRent;
    const monthlyExpenses = analysis.monthlyAnalysis?.totalExpenses || 0;
    const interestRate = propertyData.interestRate || 0.07; // 7% default
    const loanTermYears = 30;

    return this.LEVERAGE_SCENARIOS.map(downPaymentPercent => {
      const downPaymentAmount = purchasePrice * (downPaymentPercent / 100);
      const loanAmount = purchasePrice - downPaymentAmount;
      const closingCosts = purchasePrice * this.CLOSING_COST_PERCENT;
      const totalCashRequired = downPaymentAmount + closingCosts;

      // Calculate monthly mortgage payment
      const monthlyInterestRate = interestRate / 12;
      const numberOfPayments = loanTermYears * 12;
      
      let monthlyPayment = 0;
      let monthlyInterest = 0;
      let monthlyPrincipal = 0;

      if (loanAmount > 0) {
        monthlyPayment = loanAmount * 
          (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
          (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        monthlyInterest = loanAmount * monthlyInterestRate;
        monthlyPrincipal = monthlyPayment - monthlyInterest;
      }

      const monthlyTotalExpenses = monthlyExpenses + monthlyPayment;
      const monthlyNetCashFlow = monthlyRent - monthlyTotalExpenses;
      
      // Calculate key metrics
      const cashOnCashReturn = totalCashRequired > 0 ? 
        (monthlyNetCashFlow * 12) / totalCashRequired : 0;
      
      const noi = (monthlyRent - monthlyExpenses) * 12;
      const capRate = noi / purchasePrice;
      
      const dscr = monthlyPayment > 0 ? 
        (monthlyRent - monthlyExpenses) / monthlyPayment : 999;

      // Calculate leverage score (0-100)
      const leverageScore = this.calculateLeverageScore({
        cashOnCashReturn,
        monthlyNetCashFlow,
        dscr,
        downPaymentPercent,
        capRate
      });

      return {
        downPaymentPercent,
        downPaymentAmount,
        loanAmount,
        monthlyPayment,
        monthlyInterest,
        monthlyPrincipal,
        monthlyTotalExpenses,
        monthlyNetCashFlow,
        cashOnCashReturn,
        capRate,
        dscr,
        totalCashRequired,
        leverageScore
      };
    });
  }

  /**
   * Calculate leverage score (0-100) for a scenario
   */
  private calculateLeverageScore(metrics: {
    cashOnCashReturn: number;
    monthlyNetCashFlow: number;
    dscr: number;
    downPaymentPercent: number;
    capRate: number;
  }): number {
    let score = 50; // Base score

    // Cash-on-cash return contribution (0-30 points)
    const hurdle = this.CURRENT_TREASURY_RATE + this.RE_RISK_PREMIUM; // 6.5%
    if (metrics.cashOnCashReturn >= hurdle + 0.04) score += 30; // >10.5%
    else if (metrics.cashOnCashReturn >= hurdle + 0.02) score += 20; // >8.5%
    else if (metrics.cashOnCashReturn >= hurdle) score += 10; // >6.5%
    else if (metrics.cashOnCashReturn >= 0) score += 5; // Positive
    else score -= 10; // Negative cash flow

    // Cash flow stability (0-25 points)
    if (metrics.monthlyNetCashFlow >= 800) score += 25;
    else if (metrics.monthlyNetCashFlow >= 400) score += 20;
    else if (metrics.monthlyNetCashFlow >= 100) score += 15;
    else if (metrics.monthlyNetCashFlow >= 0) score += 5;
    else score -= 15; // Negative cash flow penalty

    // DSCR safety (0-20 points)
    if (metrics.dscr >= 1.5) score += 20;
    else if (metrics.dscr >= 1.25) score += 15;
    else if (metrics.dscr >= 1.1) score += 10;
    else if (metrics.dscr >= 1.0) score += 5;
    else score -= 20; // DSCR below 1.0 is dangerous

    // Leverage efficiency (0-15 points)
    // Optimal leverage is typically 70-80% LTV (20-30% down)
    const ltv = 100 - metrics.downPaymentPercent;
    if (ltv >= 70 && ltv <= 80) score += 15; // Optimal range
    else if (ltv >= 60 && ltv <= 85) score += 10; // Good range
    else if (ltv >= 50 && ltv <= 90) score += 5; // Acceptable
    else if (ltv < 20) score -= 10; // Too much cash (opportunity cost)

    // Cap rate context (0-10 points)
    if (metrics.capRate >= 0.08) score += 10;
    else if (metrics.capRate >= 0.06) score += 7;
    else if (metrics.capRate >= 0.04) score += 3;
    // No penalty for low cap rates in growth markets

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Find the optimal leverage scenario
   */
  private findOptimalScenario(scenarios: LeverageScenario[]): LeverageScenario {
    // Filter scenarios with positive cash flow and acceptable DSCR
    const viableScenarios = scenarios.filter(s => 
      s.monthlyNetCashFlow >= 0 && 
      s.dscr >= 1.1
    );

    if (viableScenarios.length === 0) {
      // If no positive cash flow scenarios, return the least negative
      return scenarios.reduce((best, current) => 
        current.monthlyNetCashFlow > best.monthlyNetCashFlow ? current : best
      );
    }

    // Return scenario with highest leverage score
    return viableScenarios.reduce((best, current) => 
      current.leverageScore > best.leverageScore ? current : best
    );
  }

  /**
   * Identify current scenario based on user's intended approach
   */
  private identifyCurrentScenario(
    scenarios: LeverageScenario[], 
    propertyData: SFRData, 
    availableCash: number
  ): LeverageScenario {
    const purchasePrice = propertyData.purchasePrice;
    
    // If user has exactly the purchase price, assume 100% cash
    if (availableCash >= purchasePrice * 1.05) { // 5% buffer for closing costs
      return scenarios.find(s => s.downPaymentPercent === 100) || scenarios[0];
    }
    
    // Otherwise, assume conventional 20% down
    return scenarios.find(s => s.downPaymentPercent === 20) || scenarios[2];
  }

  /**
   * Generate leverage recommendations
   */
  private generateRecommendations(
    scenarios: LeverageScenario[],
    optimalScenario: LeverageScenario,
    currentScenario: LeverageScenario,
    availableCash: number
  ): LeverageRecommendation[] {
    const recommendations: LeverageRecommendation[] = [];

    // Compare current vs optimal
    if (currentScenario.leverageScore < optimalScenario.leverageScore - 10) {
      recommendations.push({
        type: 'optimal',
        title: `Use ${optimalScenario.downPaymentPercent}% Down Instead of ${currentScenario.downPaymentPercent}%`,
        description: `Optimal leverage improves your investment score by ${optimalScenario.leverageScore - currentScenario.leverageScore} points`,
        impact: `Monthly cash flow: $${optimalScenario.monthlyNetCashFlow.toFixed(0)} vs $${currentScenario.monthlyNetCashFlow.toFixed(0)}`,
        action: `Use ${optimalScenario.downPaymentPercent}% down payment (${(100 - optimalScenario.downPaymentPercent)}% LTV)`,
        priority: 'immediate'
      });
    }

    // Cash-heavy warning
    if (currentScenario.downPaymentPercent >= 80) {
      const excessCash = currentScenario.totalCashRequired - optimalScenario.totalCashRequired;
      recommendations.push({
        type: 'warning',
        title: 'Excessive Cash Deployment',
        description: `You're using $${excessCash.toLocaleString()} more cash than necessary`,
        impact: `This excess capital could control $${(excessCash * 4).toLocaleString()} in additional real estate`,
        action: 'Consider optimal leverage to free up capital for additional investments',
        priority: 'immediate'
      });
    }

    // Negative cash flow warning
    if (currentScenario.monthlyNetCashFlow < 0) {
      recommendations.push({
        type: 'warning',
        title: 'Negative Cash Flow Risk',
        description: `Current leverage results in -$${Math.abs(currentScenario.monthlyNetCashFlow).toFixed(0)}/month cash flow`,
        impact: 'Requires monthly capital injection, unsustainable long-term',
        action: 'Increase down payment or negotiate lower purchase price',
        priority: 'immediate'
      });
    }

    // DSCR risk warning
    if (currentScenario.dscr < 1.25 && currentScenario.dscr > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Debt Service Coverage Risk',
        description: `DSCR of ${currentScenario.dscr.toFixed(2)} is below safe threshold of 1.25`,
        impact: 'High risk of payment stress with vacancy or unexpected expenses',
        action: 'Increase down payment to improve debt coverage ratio',
        priority: 'short-term'
      });
    }

    // Conservative option
    const conservativeScenario = scenarios.find(s => s.dscr >= 1.5 && s.monthlyNetCashFlow >= 300);
    if (conservativeScenario && conservativeScenario !== currentScenario) {
      recommendations.push({
        type: 'conservative',
        title: 'Conservative Option Available',
        description: `${conservativeScenario.downPaymentPercent}% down provides excellent safety margin`,
        impact: `DSCR: ${conservativeScenario.dscr.toFixed(2)}, Cash flow: $${conservativeScenario.monthlyNetCashFlow.toFixed(0)}/month`,
        action: `Consider ${conservativeScenario.downPaymentPercent}% down for lower risk profile`,
        priority: 'long-term'
      });
    }

    return recommendations;
  }

  /**
   * Calculate opportunity cost of current vs optimal capital deployment
   */
  private calculateOpportunityCost(
    currentScenario: LeverageScenario,
    optimalScenario: LeverageScenario,
    availableCash: number,
    propertyValue: number
  ): OpportunityCostAnalysis {
    const currentDeployment = {
      cashInvested: currentScenario.totalCashRequired,
      propertiesControlled: 1,
      totalAssetValue: propertyValue,
      portfolioVelocity: propertyValue / currentScenario.totalCashRequired
    };

    // Calculate how many properties could be controlled with optimal leverage
    const optimalCashPerProperty = optimalScenario.totalCashRequired;
    const additionalProperties = Math.floor((availableCash - optimalCashPerProperty) / optimalCashPerProperty);
    const totalOptimalProperties = 1 + additionalProperties;

    const optimalDeployment = {
      cashInvested: Math.min(availableCash, totalOptimalProperties * optimalCashPerProperty),
      propertiesControlled: totalOptimalProperties,
      totalAssetValue: totalOptimalProperties * propertyValue,
      portfolioVelocity: (totalOptimalProperties * propertyValue) / Math.min(availableCash, totalOptimalProperties * optimalCashPerProperty)
    };

    // Calculate opportunity cost based on return differential
    const currentAnnualReturn = currentScenario.monthlyNetCashFlow * 12;
    const optimalAnnualReturn = optimalScenario.monthlyNetCashFlow * 12 * totalOptimalProperties;
    const opportunityCostAnnual = optimalAnnualReturn - currentAnnualReturn;

    const capitalEfficiencyGap = optimalDeployment.portfolioVelocity / currentDeployment.portfolioVelocity;

    return {
      currentDeployment,
      optimalDeployment,
      opportunityCostAnnual,
      capitalEfficiencyGap
    };
  }

  /**
   * Run stress tests on the scenario
   */
  private runStressTests(
    scenario: LeverageScenario, 
    propertyData: SFRData, 
    analysis: any
  ): StressTestResult {
    const monthlyRent = propertyData.monthlyRent;
    const monthlyExpenses = analysis.monthlyAnalysis?.totalExpenses || 0;
    const currentRate = propertyData.interestRate || 0.07;

    // Interest rate stress test
    const rateStressResults = [1, 2, 3].map(increase => {
      const stressRate = currentRate + (increase / 100);
      const monthlyInterestRate = stressRate / 12;
      const numberOfPayments = 30 * 12;
      
      const stressedPayment = scenario.loanAmount > 0 ? 
        scenario.loanAmount * 
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1) : 0;
      
      const stressedCashFlow = monthlyRent - monthlyExpenses - stressedPayment;
      const stressedDSCR = stressedPayment > 0 ? (monthlyRent - monthlyExpenses) / stressedPayment : 999;
      
      return {
        rateIncrease: increase,
        impactOnCashFlow: stressedCashFlow - scenario.monthlyNetCashFlow,
        impactOnDSCR: stressedDSCR - scenario.dscr,
        newCashFlow: stressedCashFlow
      };
    });

    // Find break-even rate (where cash flow goes to zero)
    let breakEvenRate = currentRate;
    const maxCashFlow = monthlyRent - monthlyExpenses;
    if (scenario.loanAmount > 0 && maxCashFlow > 0) {
      // Binary search for break-even rate
      let low = currentRate;
      let high = 0.20; // 20% max
      
      while (high - low > 0.001) {
        const testRate = (low + high) / 2;
        const monthlyRate = testRate / 12;
        const testPayment = scenario.loanAmount * 
          (monthlyRate * Math.pow(1 + monthlyRate, 360)) /
          (Math.pow(1 + monthlyRate, 360) - 1);
        
        if (testPayment < maxCashFlow) {
          low = testRate;
        } else {
          high = testRate;
        }
      }
      breakEvenRate = (low + high) / 2;
    }

    // Vacancy stress test
    const vacancyStressResults = [5, 10, 15].map(vacancyPercent => {
      const effectiveRent = monthlyRent * (1 - vacancyPercent / 100);
      const stressedCashFlow = effectiveRent - monthlyExpenses - scenario.monthlyPayment;
      return {
        vacancyRate: vacancyPercent,
        impactOnCashFlow: stressedCashFlow - scenario.monthlyNetCashFlow,
        newCashFlow: stressedCashFlow
      };
    });

    // Calculate months of reserves needed
    const monthlyShortfall = Math.abs(Math.min(...vacancyStressResults.map(v => v.newCashFlow)));
    const monthsOfReserves = monthlyShortfall > 0 ? Math.ceil(monthlyShortfall * 6) : 3; // 6 months minimum

    // Property value stress test
    const valueStressResults = [10, 20].map(declinePercent => {
      const stressedValue = propertyData.purchasePrice * (1 - declinePercent / 100);
      const currentLTV = scenario.loanAmount / propertyData.purchasePrice;
      const stressedLTV = scenario.loanAmount / stressedValue;
      const equityRemaining = stressedValue - scenario.loanAmount;
      
      return {
        valueDecline: declinePercent,
        newValue: stressedValue,
        newLTV: stressedLTV,
        equityRemaining
      };
    });

    return {
      interestRateStress: {
        rateIncrease: 2, // Focus on 2% increase
        impactOnCashFlow: rateStressResults[1].impactOnCashFlow,
        impactOnDSCR: rateStressResults[1].impactOnDSCR,
        breakEvenRate
      },
      vacancyStress: {
        vacancyRate: 10, // Focus on 10% vacancy
        impactOnCashFlow: vacancyStressResults[1].impactOnCashFlow,
        monthsOfReserves
      },
      propertyValueStress: {
        valueDecline: 20, // Focus on 20% decline
        ltv: valueStressResults[1].newLTV,
        equityRemaining: valueStressResults[1].equityRemaining
      }
    };
  }
}