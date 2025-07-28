/**
 * Calculate Internal Rate of Return (IRR)
 * @param cashFlows Array of cash flows, starting with initial investment (negative)
 * @returns IRR as a percentage
 */
export function calculateIRR(cashFlows: number[]): number {
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
  
  console.log('IRR Cash Flows:', cashFlows);
  
  // If there are no sign changes, IRR cannot be calculated
  if (signChanges === 0) {
    console.log('No sign changes in cash flows, IRR calculation not possible');
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
      console.log(`IRR converged: ${(guess * 100).toFixed(2)}%`);
      return guess * 100; // Convert to percentage
    }

    if (currentNPV > 0) {
      lowerRate = guess;
    } else {
      upperRate = guess;
    }

    guess = (lowerRate + upperRate) / 2;
  }

  console.log(`IRR failed to converge. Best guess: ${(guess * 100).toFixed(2)}%`);
  return guess * 100; // Convert to percentage
}

/**
 * Calculate total investment
 * @param downPayment Down payment amount
 * @param closingCosts Closing costs
 * @param capitalInvestments Additional capital investments
 * @returns Total investment amount
 */
export function calculateTotalInvestment(
  downPayment: number = 0, 
  closingCosts: number = 0, 
  capitalInvestments: number = 0
): number {
  return downPayment + closingCosts + capitalInvestments;
}

/**
 * Calculate cap rate
 * @param noi Net Operating Income
 * @param purchasePrice Purchase price
 * @returns Cap rate as a percentage
 */
export function calculateCapRate(noi: number, purchasePrice: number): number {
  if (!purchasePrice) return 0;
  return (noi / purchasePrice) * 100;
}

/**
 * Calculate cash on cash return
 * @param annualCashFlow Annual cash flow
 * @param totalInvestment Total investment
 * @returns Cash on cash return as a percentage
 */
export function calculateCashOnCashReturn(annualCashFlow: number, totalInvestment: number): number {
  if (!totalInvestment) return 0;
  return (annualCashFlow / totalInvestment) * 100;
}

/**
 * Calculate debt service coverage ratio
 * @param noi Net Operating Income
 * @param debtService Annual debt service
 * @returns DSCR as a ratio
 */
export function calculateDSCR(noi: number, debtService: number): number {
  if (!debtService) return Infinity;
  return noi / debtService;
}

/**
 * Calculate monthly mortgage payment using standard amortization formula
 * P = L[c(1 + c)^n]/[(1 + c)^n - 1]
 */
export const calculateMonthlyMortgagePayment = (
  principal: number,
  annualInterestRate: number,
  loanTermYears: number
): number => {
  if (principal <= 0 || loanTermYears <= 0) return 0
  
  // Handle zero interest rate case
  if (annualInterestRate === 0) {
    return principal / (loanTermYears * 12)
  }
  
  const monthlyRate = annualInterestRate / 100 / 12
  const numberOfPayments = loanTermYears * 12
  
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  
  return payment
}

/**
 * Calculate Operating Expense Ratio
 * OER = (Operating Expenses / Gross Income) * 100
 */
export const calculateOperatingExpenseRatio = (
  operatingExpenses: number,
  grossIncome: number
): number => {
  if (grossIncome === 0) return 0
  return (operatingExpenses / grossIncome) * 100
}

/**
 * Calculate Gross Rent Multiplier (GRM)
 * GRM = Property Value / Annual Gross Rent
 */
export const calculateGrossRentMultiplier = (
  propertyValue: number,
  monthlyRent: number
): number => {
  if (monthlyRent === 0) return 0
  const annualRent = monthlyRent * 12
  return propertyValue / annualRent
}

/**
 * Calculate 1% Rule Performance
 * 1% Rule = (Monthly Rent / Property Value) * 100
 */
export const calculateOnePercentRule = (
  monthlyRent: number,
  propertyValue: number
): number => {
  if (propertyValue === 0) return 0
  return (monthlyRent / propertyValue) * 100
}

/**
 * Calculate Break-Even Occupancy Rate
 * Break-Even = (Total Expenses / Gross Income) * 100
 */
export const calculateBreakEvenOccupancy = (
  totalExpenses: number,
  grossIncome: number
): number => {
  if (grossIncome === 0) return 0
  return (totalExpenses / grossIncome) * 100
} 