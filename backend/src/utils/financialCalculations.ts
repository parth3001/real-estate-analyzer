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

    const npv = (rate: number): number => {
      return cashFlows.reduce((acc, cf, i) => {
        return acc + cf / Math.pow(1 + rate, i);
      }, 0);
    };

    let lowerRate = -0.99;
    let upperRate = 10;
    let guess = (lowerRate + upperRate) / 2;

    for (let i = 0; i < maxIterations; i++) {
      const currentNPV = npv(guess);

      if (Math.abs(currentNPV) < tolerance) {
        return guess * 100; // Convert to percentage
      }

      if (currentNPV > 0) {
        lowerRate = guess;
      } else {
        upperRate = guess;
      }

      guess = (lowerRate + upperRate) / 2;
    }

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
} 