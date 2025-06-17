import { PropertyType } from '../types/propertyTypes';

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
    if (monthlyRate === 0) return principal / numPayments;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
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
    return effectiveGrossIncome - operatingExpenses;
  }

  /**
   * Calculate Cash Flow
   */
  static calculateCashFlow(noi: number, debtService: number): number {
    return noi - debtService;
  }

  /**
   * Calculate Cap Rate
   */
  static calculateCapRate(noi: number, purchasePrice: number): number {
    if (!purchasePrice) return 0;
    return (noi / purchasePrice) * 100;
  }

  /**
   * Calculate Cash on Cash Return
   */
  static calculateCashOnCashReturn(annualCashFlow: number, totalInvestment: number): number {
    if (!totalInvestment) return 0;
    return (annualCashFlow / totalInvestment) * 100;
  }

  /**
   * Calculate Debt Service Coverage Ratio (DSCR)
   */
  static calculateDSCR(noi: number, debtService: number): number {
    if (!debtService) return 0;
    return noi / debtService;
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
    return effectiveGrossIncome > 0 ? (operatingExpenses / effectiveGrossIncome) * 100 : 0;
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
} 