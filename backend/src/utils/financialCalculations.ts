import { PropertyType } from '../types/propertyTypes';
import { AnalysisAssumptions } from '../analysis/BasePropertyAnalyzer';

export class FinancialCalculations {
  /**
   * Calculate monthly mortgage payment
   * @param principal Loan principal amount
   * @param annualRate Annual interest rate (as percentage)
   * @param years Loan term in years
   * @returns Monthly mortgage payment
   */
  static calculateMortgage(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 12 / 100;
    const numPayments = years * 12;
    if (monthlyRate === 0) return Math.round(principal / numPayments * 100) / 100;
    const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
    // Round to 2 decimal places for clean currency display
    return Math.round(payment * 100) / 100;
  }

  /**
   * Calculate loan amount based on purchase price and down payment
   */
  static calculateLoanAmount(purchasePrice: number, downPayment: number, providedLoanAmount?: number): number {
    return providedLoanAmount || (purchasePrice - downPayment);
  }

  /**
   * Calculate operating expenses with inflation adjustment
   */
  static calculateOperatingExpenses(baseExpenses: number, inflationRate: number, year: number): number {
    return baseExpenses * Math.pow(1 + inflationRate / 100, year);
  }

  /**
   * Calculate Net Operating Income (NOI)
   */
  static calculateNOI(effectiveGrossIncome: number, operatingExpenses: number): number {
    // Round to 2 decimal places for clean currency display
    return Math.round((effectiveGrossIncome - operatingExpenses) * 100) / 100;
  }

  /**
   * Calculate Cash Flow
   */
  static calculateCashFlow(noi: number, debtService: number): number {
    // Round to 2 decimal places for clean currency display
    return Math.round((noi - debtService) * 100) / 100;
  }

  /**
   * Calculate Cap Rate (returns as percentage, e.g. 6.5 for 6.5%)
   */
  static calculateCapRate(noi: number, purchasePrice: number): number {
    if (!purchasePrice) return 0;
    // Round to 2 decimal places for clean display
    return Math.round((noi / purchasePrice) * 10000) / 100;
  }

  /**
   * Calculate Cash on Cash Return (returns as percentage, e.g. 12 for 12%)
   */
  static calculateCashOnCashReturn(annualCashFlow: number, totalInvestment: number): number {
    if (!totalInvestment) return 0;
    // Round to 2 decimal places for clean display
    return Math.round((annualCashFlow / totalInvestment) * 10000) / 100;
  }

  /**
   * Calculate Debt Service Coverage Ratio (DSCR)
   */
  static calculateDSCR(noi: number, debtService: number): number {
    if (!debtService) return 0;
    // Round to 2 decimal places for clean display (e.g., 1.25)
    return Math.round((noi / debtService) * 100) / 100;
  }

  /**
   * Calculate Internal Rate of Return (IRR)
   */
  static calculateIRR(cashFlows: number[]): number {
    const maxIterations = 1000;
    const tolerance = 0.000001;

    // Check if we have a valid IRR scenario (at least one sign change)
    let signChanges = 0;
    for (let i = 1; i < cashFlows.length; i++) {
      if ((cashFlows[i] >= 0 && cashFlows[i-1] < 0) || 
          (cashFlows[i] < 0 && cashFlows[i-1] >= 0)) {
        signChanges++;
      }
    }
    
    console.log('==== IRR CALCULATION PROCESS ====');
    console.log('Cash Flows:', cashFlows);
    console.log('Sign Changes:', signChanges);
    
    // If there are no sign changes, IRR cannot be calculated
    if (signChanges === 0) {
      console.log('No sign changes in cash flows, IRR calculation not possible');
      console.log('==============================');
      return 0;
    }

    const npv = (rate: number): number => {
      return cashFlows.reduce((acc, cf, i) => {
        return acc + cf / Math.pow(1 + rate, i);
      }, 0);
    };

    let lowerRate = -0.99;
    let upperRate = 10;
    let guess = (lowerRate + upperRate) / 2;
    let currentNPV = 0;

    for (let i = 0; i < maxIterations; i++) {
      currentNPV = npv(guess);

      if (Math.abs(currentNPV) < tolerance) {
        console.log(`Converged after ${i} iterations. IRR: ${guess * 100}%`);
        console.log('==============================');
        return guess * 100; // Convert to percentage
      }

      if (currentNPV > 0) {
        lowerRate = guess;
      } else {
        upperRate = guess;
      }

      guess = (lowerRate + upperRate) / 2;
      
      // Log every 100 iterations
      if (i % 100 === 0) {
        console.log(`Iteration ${i}: Rate=${guess}, NPV=${currentNPV}`);
      }
    }

    console.log(`Failed to converge after ${maxIterations} iterations. Best guess: ${guess * 100}%`);
    console.log('==============================');
    return guess * 100; // Convert to percentage
  }

  /**
   * Calculate Exit Analysis
   */
  static calculateExitAnalysis(params: {
    propertyValue: number;
    loanBalance: number;
    sellingCosts: number;
    totalInvestment: number;
    cumulativeCashFlow: number;
  }) {
    const { propertyValue, loanBalance, sellingCosts, totalInvestment, cumulativeCashFlow } = params;
    
    const projectedEquity = propertyValue - loanBalance;
    const sellingCostsAmount = propertyValue * (sellingCosts / 100);
    const netProceedsFromSale = projectedEquity - sellingCostsAmount;
    const totalReturn = cumulativeCashFlow + netProceedsFromSale - totalInvestment;
    
    // Calculate ROI as a percentage of total investment
    const returnOnInvestment = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

    return {
      projectedSalePrice: propertyValue,
      sellingCosts: sellingCostsAmount,
      mortgagePayoff: loanBalance,
      netProceedsFromSale,
      totalReturn,
      returnOnInvestment
    };
  }

  /**
   * Calculate Gross Rent Multiplier
   */
  static calculateGRM(price: number, annualRent: number): number {
    return annualRent > 0 ? price / annualRent : 0;
  }

  /**
   * Calculate Debt Yield - Important for lender underwriting
   * Shows how much income property generates relative to loan amount
   */
  static calculateDebtYield(noi: number, loanAmount: number): number {
    if (loanAmount <= 0) return 0;
    // Round to 2 decimal places for clean display
    return Math.round((noi / loanAmount) * 10000) / 100;
  }

  /**
   * Calculate Gross Yield - Annual rent as percentage of purchase price
   * Quick metric for initial property screening
   */
  static calculateGrossYield(annualRent: number, purchasePrice: number): number {
    if (purchasePrice <= 0) return 0;
    // Round to 2 decimal places for clean display
    return Math.round((annualRent / purchasePrice) * 10000) / 100;
  }

  /**
   * Calculate recommended cash reserves based on property profile
   * Considers property age, monthly expenses, and market volatility
   */
  static calculateRecommendedReserves(params: {
    monthlyExpenses: number;
    propertyAge?: number;
    marketVolatility?: 'low' | 'medium' | 'high';
  }): {
    minimumReserves: number;
    recommendedReserves: number;
    optimalReserves: number;
    breakdown: {
      baseMonths: number;
      ageAdjustment: number;
      marketAdjustment: number;
    };
  } {
    const { monthlyExpenses, propertyAge = 10, marketVolatility = 'medium' } = params;
    
    // Base: 3 months for newer properties, up to 6 months for older
    let baseMonths = 3;
    let ageAdjustment = 0;
    
    if (propertyAge > 30) {
      ageAdjustment = 2; // Add 2 months for properties over 30 years
    } else if (propertyAge > 15) {
      ageAdjustment = 1; // Add 1 month for properties 15-30 years
    }
    
    // Market volatility adjustment
    let marketAdjustment = 0;
    switch (marketVolatility) {
      case 'high':
        marketAdjustment = 2;
        break;
      case 'medium':
        marketAdjustment = 1;
        break;
      case 'low':
        marketAdjustment = 0;
        break;
    }
    
    const minimumMonths = baseMonths;
    const recommendedMonths = baseMonths + ageAdjustment + marketAdjustment;
    const optimalMonths = recommendedMonths + 2; // Conservative approach
    
    return {
      minimumReserves: monthlyExpenses * minimumMonths,
      recommendedReserves: monthlyExpenses * recommendedMonths,
      optimalReserves: monthlyExpenses * optimalMonths,
      breakdown: {
        baseMonths,
        ageAdjustment,
        marketAdjustment
      }
    };
  }

  /**
   * Calculate Price per Square Foot
   */
  static calculatePricePerSqFt(price: number, squareFootage: number): number {
    return squareFootage > 0 ? price / squareFootage : 0;
  }

  /**
   * Calculate Vacancy Rate
   */
  static calculateVacancyRate(vacantDays: number, totalDays: number): number {
    return totalDays > 0 ? (vacantDays / totalDays) * 100 : 0;
  }

  /**
   * Calculate Operating Expense Ratio
   */
  static calculateOperatingExpenseRatio(operatingExpenses: number, effectiveGrossIncome: number): number {
    if (effectiveGrossIncome <= 0) return 0;
    // Round to 2 decimal places for clean display
    return Math.round((operatingExpenses / effectiveGrossIncome) * 10000) / 100;
  }

  /**
   * Get threshold values for different metrics based on property type
   * @param metric Name of the metric
   * @param propertyType Type of property (SFR or MF)
   * @returns Threshold value for the metric
   */
  static getMetricThreshold(metric: 'capRate' | 'cashOnCash' | 'dscr' | 'operatingExpenseRatio', propertyType: PropertyType): number {
    const thresholds = {
      SFR: {
        capRate: 6,
        cashOnCash: 8,
        dscr: 1.0,
        operatingExpenseRatio: 45
      },
      MF: {
        capRate: 5,
        cashOnCash: 7,
        dscr: 1.25,
        operatingExpenseRatio: 50
      }
    } as const;

    return thresholds[propertyType][metric];
  }

  /**
   * Calculate Break-Even Occupancy
   * @param operatingExpenses Annual Operating Expenses
   * @param debtService Annual Debt Service
   * @param grossPotentialRent Annual Gross Potential Rent
   * @returns Break-even Occupancy as a percentage
   */
  static calculateBreakEvenOccupancy(
    operatingExpenses: number,
    debtService: number,
    grossPotentialRent: number
  ): number {
    if (!grossPotentialRent) return 0;
    return ((operatingExpenses + debtService) / grossPotentialRent) * 100;
  }

  /**
   * Calculate Price per Unit (Multi-family specific)
   * @param purchasePrice Total Purchase Price
   * @param numberOfUnits Total Number of Units
   * @returns Price per Unit
   */
  static calculatePricePerUnit(purchasePrice: number, numberOfUnits: number): number {
    if (!numberOfUnits) return 0;
    return purchasePrice / numberOfUnits;
  }

  /**
   * Calculate Equity Multiple
   * @param totalReturn Total return (cashflow + appreciation)
   * @param totalInvestment Total initial investment
   * @returns Equity Multiple (ratio)
   */
  static calculateEquityMultiple(totalReturn: number, totalInvestment: number): number {
    if (!totalInvestment) return 0;
    return totalReturn / totalInvestment;
  }

  /**
   * Calculate One Percent Rule Value
   * @param monthlyRent Monthly rent
   * @param purchasePrice Purchase price
   * @returns One Percent Rule value as a percentage
   */
  static calculateOnePercentRuleValue(monthlyRent: number, purchasePrice: number): number {
    if (!purchasePrice) return 0;
    return (monthlyRent / purchasePrice) * 100;
  }

  /**
   * Determine if a property passes the Fifty Percent Rule
   * @param operatingExpenses Annual operating expenses
   * @param grossRent Annual gross rent
   * @returns Boolean indicating if the property passes the rule
   */
  static checkFiftyPercentRule(operatingExpenses: number, grossRent: number): boolean {
    if (!grossRent) return false;
    return operatingExpenses <= (grossRent * 0.5);
  }

  /**
   * Calculate Rent-to-Price Ratio
   * @param monthlyRent Monthly rent
   * @param purchasePrice Purchase price
   * @returns Rent-to-Price ratio as a percentage
   */
  static calculateRentToPriceRatio(monthlyRent: number, purchasePrice: number): number {
    if (!purchasePrice) return 0;
    return (monthlyRent / purchasePrice) * 100;
  }

  /**
   * Calculate Price Per Bedroom
   * @param purchasePrice Purchase price
   * @param bedrooms Number of bedrooms
   * @returns Price per bedroom
   */
  static calculatePricePerBedroom(purchasePrice: number, bedrooms: number): number {
    if (!bedrooms) return 0;
    return purchasePrice / bedrooms;
  }

  /**
   * Calculate Debt-to-Income Ratio
   * @param debtService Annual debt service
   * @param income Annual property income
   * @returns Debt-to-Income ratio as a percentage
   */
  static calculateDebtToIncomeRatio(debtService: number, income: number): number {
    if (!income) return 0;
    return (debtService / income) * 100;
  }

  /**
   * Calculate Principal Paid in a given period
   * @param payment Monthly payment
   * @param rate Annual interest rate
   * @param term Loan term in years
   * @param period Period number (months elapsed)
   * @returns Principal paid in that period
   */
  static calculatePrincipalPayment(payment: number, rate: number, term: number, period: number): number {
    // Handle zero interest rate case
    if (rate === 0) return payment;
    
    const monthlyRate = rate / 12 / 100;
    const totalPayments = term * 12;
    
    // Calculate remaining balance before the payment
    const principal = payment / monthlyRate * (1 - Math.pow(1 + monthlyRate, -totalPayments));
    const balanceBefore = principal * Math.pow(1 + monthlyRate, period - 1) - 
                         (payment / monthlyRate) * (Math.pow(1 + monthlyRate, period - 1) - 1);
    
    // Interest portion of the payment
    const interestPayment = balanceBefore * monthlyRate;
    
    // Principal is payment minus interest
    return payment - interestPayment;
  }

  /**
   * Calculate Return on Improvements
   * @param noi Current NOI
   * @param baseNOI NOI before improvements, or null if not available
   * @param capitalInvestments Amount invested in capital improvements
   * @param estimatedReturn Optional estimated annual return percentage (default: 8%)
   * @returns Return on improvements as a percentage
   */
  static calculateReturnOnImprovements(
    noi: number, 
    baseNOI: number | null, 
    capitalInvestments: number,
    estimatedReturn: number = 8
  ): number {
    if (!capitalInvestments || capitalInvestments === 0) return 0;
    
    // If we have before/after NOI values, use those
    if (baseNOI !== null) {
      const noiIncrease = noi - baseNOI;
      return (noiIncrease / capitalInvestments) * 100;
    }
    
    // Otherwise use the estimated return percentage
    return estimatedReturn;
  }

  /**
   * Calculate Turnover Cost Impact
   * @param turnoverCosts Annual turnover costs
   * @param grossIncome Annual gross income
   * @returns Turnover cost impact as a percentage of gross income
   */
  static calculateTurnoverCostImpact(turnoverCosts: number, grossIncome: number): number {
    if (!grossIncome || grossIncome === 0) return 0;
    return (turnoverCosts / grossIncome) * 100;
  }

  /**
   * Calculate remaining loan balance
   * @param principal Initial principal
   * @param payment Monthly payment
   * @param rate Monthly interest rate
   * @param period Number of payments made
   * @returns Remaining balance
   */
  static calculateRemainingBalance(principal: number, payment: number, rate: number, period: number): number {
    if (rate === 0) return principal - (payment * period);
    return principal * Math.pow(1 + rate, period) - payment/rate * (Math.pow(1 + rate, period) - 1);
  }

  // ============================================================
  // UNIFIED CALCULATION ENGINE - SUPPORTS ALL PROPERTY TYPES
  // ============================================================

  /**
   * Calculate effective income after vacancy (CORE FIX)
   * @param grossIncome Annual gross income
   * @param vacancyRate Vacancy rate as percentage
   * @returns Effective income after vacancy
   */
  static calculateEffectiveIncome(grossIncome: number, vacancyRate: number): number {
    return grossIncome * (1 - vacancyRate / 100);
  }

  /**
   * Calculate property tax expense
   * @param purchasePrice Property purchase price  
   * @param propertyTaxRate Tax rate as percentage
   * @returns Annual property tax
   */
  static calculatePropertyTax(purchasePrice: number, propertyTaxRate: number): number {
    return purchasePrice * (propertyTaxRate / 100);
  }

  /**
   * Calculate insurance expense
   * @param purchasePrice Property purchase price
   * @param insuranceRate Insurance rate as percentage
   * @returns Annual insurance cost
   */
  static calculateInsurance(purchasePrice: number, insuranceRate: number): number {
    return purchasePrice * (insuranceRate / 100);
  }

  /**
   * Calculate property management expense
   * @param grossIncome Annual gross income
   * @param managementRate Management rate as percentage
   * @returns Annual property management cost
   */
  static calculatePropertyManagement(grossIncome: number, managementRate: number): number {
    return grossIncome * (managementRate / 100);
  }

  /**
   * Calculate projected value/expense with growth
   * @param baseAmount Base amount
   * @param growthRate Annual growth rate as percentage
   * @param year Year number (1-based)
   * @returns Projected amount for that year
   */
  static calculateProjectedAmount(baseAmount: number, growthRate: number, year: number): number {
    return baseAmount * Math.pow(1 + growthRate / 100, year - 1);
  }

  /**
   * Calculate total investment including all upfront costs
   * @param downPayment Down payment amount
   * @param closingCosts Closing costs
   * @param capitalInvestments Capital investments/improvements
   * @returns Total initial investment
   */
  static calculateTotalInvestment(downPayment: number, closingCosts: number = 0, capitalInvestments: number = 0): number {
    return downPayment + closingCosts + capitalInvestments;
  }

  /**
   * Calculate tenant turnover costs (FIXED - no more double broker fees)
   * @param params Turnover parameters
   * @returns Annual turnover costs
   */
  static calculateTurnoverCosts(params: {
    prepFees: number;
    monthlyRent: number;
    realtorCommission: number;
    turnoverFrequency: number;
    vacancyRate: number;
    units?: number; // For multi-family
  }): number {
    const { prepFees, monthlyRent, realtorCommission, turnoverFrequency, vacancyRate, units = 1 } = params;
    
    // Calculate base turnover rate as 1/frequency
    const baseTurnoverRate = 1 / turnoverFrequency;
    
    // Adjust based on vacancy rate: higher vacancy = higher turnover
    const vacancyAdjustment = vacancyRate / 5;
    const turnoverRate = Math.min(0.9, baseTurnoverRate * vacancyAdjustment);
    
    // Calculate per-unit turnover cost
    const perUnitCost = (prepFees + (monthlyRent * realtorCommission)) * turnoverRate;
    
    // Scale by number of units for multi-family
    return perUnitCost * units;
  }

}

// ============================================================
// PROPERTY-TYPE SPECIFIC CALCULATION ENGINES
// ============================================================

/**
 * Interface for property-specific calculation engines
 */
export interface IPropertyCalculationEngine<TData, TMetrics> {
  calculateGrossIncome(data: TData, year: number): number;
  calculateOperatingExpenses(data: TData, grossIncome: number, year: number, assumptions: AnalysisAssumptions): number;
  calculatePropertySpecificMetrics(data: TData, commonMetrics: any, assumptions: AnalysisAssumptions): TMetrics;
}

/**
 * Base calculation engine with common functionality
 */
export abstract class BaseCalculationEngine {
  /**
   * Calculate operating expenses common to all property types
   */
  protected static calculateBaseOperatingExpenses(params: {
    purchasePrice: number;
    propertyTaxRate: number;
    insuranceRate: number;
    maintenanceCost: number;
    grossIncome: number;
    propertyManagementRate: number;
    year: number;
    inflationRate: number;
  }): {
    propertyTax: number;
    insurance: number;
    maintenance: number;
    propertyManagement: number;
    total: number;
  } {
    const inflationFactor = Math.pow(1 + params.inflationRate / 100, params.year - 1);
    
    const propertyTax = FinancialCalculations.calculatePropertyTax(params.purchasePrice, params.propertyTaxRate) * inflationFactor;
    const insurance = FinancialCalculations.calculateInsurance(params.purchasePrice, params.insuranceRate) * inflationFactor;
    const maintenance = params.maintenanceCost * inflationFactor;
    const propertyManagement = FinancialCalculations.calculatePropertyManagement(params.grossIncome, params.propertyManagementRate);
    
    return {
      propertyTax,
      insurance,
      maintenance,
      propertyManagement,
      total: propertyTax + insurance + maintenance + propertyManagement
    };
  }
}

/**
 * SFR-specific calculation engine
 */
export class SFRCalculationEngine extends BaseCalculationEngine {
  static calculateGrossIncome(data: any, year: number): number {
    return FinancialCalculations.calculateProjectedAmount(
      data.monthlyRent * 12,
      data.longTermAssumptions?.annualRentIncrease || 3,
      year
    );
  }

  static calculateOperatingExpenses(data: any, grossIncome: number, year: number, assumptions: AnalysisAssumptions): number {
    const baseExpenses = this.calculateBaseOperatingExpenses({
      purchasePrice: data.purchasePrice,
      propertyTaxRate: data.propertyTaxRate,
      insuranceRate: data.insuranceRate,
      maintenanceCost: data.maintenanceCost,
      grossIncome,
      propertyManagementRate: data.propertyManagementRate,
      year,
      inflationRate: assumptions.annualExpenseIncrease || 2
    });

    // Add SFR-specific expenses
    const turnoverCosts = FinancialCalculations.calculateTurnoverCosts({
      prepFees: data.tenantTurnoverFees?.prepFees || 500,
      monthlyRent: grossIncome / 12,
      realtorCommission: data.tenantTurnoverFees?.realtorCommission || 0.5,
      turnoverFrequency: assumptions.turnoverFrequency || 2,
      vacancyRate: assumptions.vacancyRate
    });

    // NO vacancy expense - it's handled as income reduction
    // NO unauthorized defaults like 5% CapEx or mysterious 8.33% broker fees
    return baseExpenses.total + turnoverCosts;
  }

  static calculatePropertySpecificMetrics(data: any, commonMetrics: any, assumptions: AnalysisAssumptions): any {
    return {
      ...commonMetrics,
      pricePerSqFt: FinancialCalculations.calculatePricePerSqFt(data.purchasePrice, data.squareFootage),
      rentPerSqFt: (data.monthlyRent * 12) / data.squareFootage,
      grossRentMultiplier: FinancialCalculations.calculateGRM(data.purchasePrice, data.monthlyRent * 12),
      onePercentRuleValue: FinancialCalculations.calculateOnePercentRuleValue(data.monthlyRent, data.purchasePrice),
      rentToPriceRatio: FinancialCalculations.calculateRentToPriceRatio(data.monthlyRent, data.purchasePrice),
      pricePerBedroom: FinancialCalculations.calculatePricePerBedroom(data.purchasePrice, data.bedrooms),
      breakEvenOccupancy: FinancialCalculations.calculateBreakEvenOccupancy(
        this.calculateOperatingExpenses(data, data.monthlyRent * 12, 1, assumptions),
        FinancialCalculations.calculateMortgage(
          FinancialCalculations.calculateLoanAmount(data.purchasePrice, data.downPayment),
          data.interestRate,
          data.loanTerm
        ) * 12,
        data.monthlyRent * 12
      ),
      equityMultiple: 0, // Will be calculated after projections
      fiftyRuleAnalysis: FinancialCalculations.checkFiftyPercentRule(
        this.calculateOperatingExpenses(data, data.monthlyRent * 12, 1, assumptions),
        data.monthlyRent * 12
      ),
      debtToIncomeRatio: FinancialCalculations.calculateDebtToIncomeRatio(
        FinancialCalculations.calculateMortgage(
          FinancialCalculations.calculateLoanAmount(data.purchasePrice, data.downPayment),
          data.interestRate,
          data.loanTerm
        ) * 12,
        data.monthlyRent * 12
      ),
      returnOnImprovements: FinancialCalculations.calculateReturnOnImprovements(
        commonMetrics.noi,
        null,
        data.capitalInvestments || 0
      ),
      turnoverCostImpact: FinancialCalculations.calculateTurnoverCostImpact(
        FinancialCalculations.calculateTurnoverCosts({
          prepFees: data.tenantTurnoverFees?.prepFees || 500,
          monthlyRent: data.monthlyRent,
          realtorCommission: data.tenantTurnoverFees?.realtorCommission || 0.5,
          turnoverFrequency: assumptions.turnoverFrequency || 2,
          vacancyRate: assumptions.vacancyRate
        }),
        data.monthlyRent * 12
      )
    };
  }
}

/**
 * Multi-Family calculation engine
 */
export class MFCalculationEngine extends BaseCalculationEngine {
  static calculateGrossIncome(data: any, year: number): number {
    const baseIncome = data.unitTypes.reduce((total: number, unit: any) => {
      return total + (unit.monthlyRent * unit.count * 12);
    }, 0);
    
    return FinancialCalculations.calculateProjectedAmount(
      baseIncome,
      data.longTermAssumptions?.annualRentIncrease || 3,
      year
    );
  }

  static calculateOperatingExpenses(data: any, grossIncome: number, year: number, assumptions: AnalysisAssumptions): number {
    const baseExpenses = this.calculateBaseOperatingExpenses({
      purchasePrice: data.purchasePrice,
      propertyTaxRate: data.propertyTaxRate,
      insuranceRate: data.insuranceRate,
      maintenanceCost: data.maintenanceCostPerUnit * data.totalUnits,
      grossIncome,
      propertyManagementRate: data.propertyManagementRate,
      year,
      inflationRate: assumptions.annualExpenseIncrease || 2
    });

    // Add MF-specific expenses
    const inflationFactor = Math.pow(1 + (assumptions.annualExpenseIncrease || 2) / 100, year - 1);
    const utilitiesTotal = Object.values(data.commonAreaUtilities || {})
      .reduce((sum: number, cost: any) => sum + (cost || 0), 0) as number;
    const commonAreaUtilities = utilitiesTotal * inflationFactor;
    
    const avgMonthlyRent = grossIncome / 12 / data.totalUnits;
    const turnoverCosts = FinancialCalculations.calculateTurnoverCosts({
      prepFees: data.tenantTurnoverFees?.prepFees || 500,
      monthlyRent: avgMonthlyRent,
      realtorCommission: data.tenantTurnoverFees?.realtorCommission || 0.5,
      turnoverFrequency: assumptions.turnoverFrequency || 2,
      vacancyRate: assumptions.vacancyRate,
      units: data.totalUnits
    });

    return baseExpenses.total + commonAreaUtilities + turnoverCosts;
  }

  static calculatePropertySpecificMetrics(data: any, commonMetrics: any, assumptions: AnalysisAssumptions): any {
    const avgRentPerUnit = data.unitTypes.reduce((total: number, unit: any) => 
      total + (unit.monthlyRent * unit.count), 0) / data.totalUnits;
    
    return {
      ...commonMetrics,
      pricePerUnit: FinancialCalculations.calculatePricePerUnit(data.purchasePrice, data.totalUnits),
      pricePerSqft: data.totalSqft > 0 ? data.purchasePrice / data.totalSqft : 0,
      noiPerUnit: commonMetrics.noi / data.totalUnits,
      averageRentPerUnit: avgRentPerUnit,
      operatingExpensePerUnit: (this.calculateOperatingExpenses(data, this.calculateGrossIncome(data, 1), 1, assumptions) || 0) / data.totalUnits,
      commonAreaExpenseRatio: 0, // TODO: Calculate when we have the data
      unitMixEfficiency: 0, // TODO: Calculate unit mix efficiency
      economicVacancyRate: assumptions.vacancyRate
    };
  }
}

/**
 * Factory to get the appropriate calculation engine
 */
export class PropertyCalculationEngineFactory {
  static getEngine(propertyType: PropertyType): typeof SFRCalculationEngine | typeof MFCalculationEngine {
    switch (propertyType) {
      case 'SFR':
        return SFRCalculationEngine;
      case 'MF':
        return MFCalculationEngine;
      default:
        throw new Error(`Unsupported property type: ${propertyType}`);
    }
  }
} 