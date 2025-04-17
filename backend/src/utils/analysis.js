// Calculate monthly mortgage payment
const calculateMonthlyPayment = (principal, annualRate, years) => {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
};

// Calculate monthly cash flow
const calculateCashFlow = (monthlyRent, monthlyExpenses, monthlyMortgage) => {
  return monthlyRent - monthlyExpenses - monthlyMortgage;
};

// Calculate capitalization rate
const calculateCapRate = (annualNOI, purchasePrice) => {
  return (annualNOI / purchasePrice) * 100;
};

// Calculate cash on cash return
const calculateCashOnCashReturn = (annualCashFlow, downPayment) => {
  return (annualCashFlow / downPayment) * 100;
};

// Calculate Internal Rate of Return (IRR)
const calculateIRR = (cashFlows, initialInvestment) => {
  const maxIterations = 1000;
  const tolerance = 0.000001;

  const npv = (rate) => {
    return cashFlows.reduce((acc, cf, i) => {
      return acc + cf / Math.pow(1 + rate, i + 1);
    }, -initialInvestment);
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
};

// Calculate price per square foot
const calculatePricePerSqFt = (price, squareFootage) => {
  return price / squareFootage;
};

// Calculate gross rent multiplier
const calculateGRM = (price, annualRent) => {
  return price / annualRent;
};

// Calculate debt service coverage ratio
const calculateDSCR = (annualNOI, annualDebtService) => {
  return annualNOI / annualDebtService;
};

// Calculate vacancy rate
const calculateVacancyRate = (vacantDays, totalDays) => {
  return (vacantDays / totalDays) * 100;
};

// Main function to calculate all SFR metrics
const calculateSFRMetrics = async (dealData) => {
  const {
    purchasePrice,
    downPayment,
    interestRate,
    loanTerm = 30,
    monthlyRent,
    propertyTax,
    insurance,
    maintenance = 0,
    sfrDetails
  } = dealData;

  // Calculate loan amount and monthly payment
  const loanAmount = purchasePrice - downPayment;
  const monthlyMortgage = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

  // Calculate monthly expenses
  const monthlyExpenses = (propertyTax / 12) + (insurance / 12) + maintenance;
  const monthlyPropertyManagement = monthlyRent * (sfrDetails.propertyManagement.feePercentage / 100);
  const totalMonthlyExpenses = monthlyExpenses + monthlyPropertyManagement;

  // Calculate monthly and annual cash flow
  const monthlyCashFlow = calculateCashFlow(monthlyRent, totalMonthlyExpenses, monthlyMortgage);
  const annualCashFlow = monthlyCashFlow * 12;

  // Calculate NOI
  const annualNOI = (monthlyRent * 12) - (totalMonthlyExpenses * 12);

  // Calculate key metrics
  const capRate = calculateCapRate(annualNOI, purchasePrice);
  const cashOnCashReturn = calculateCashOnCashReturn(annualCashFlow, downPayment);
  const pricePerSqFt = calculatePricePerSqFt(purchasePrice, sfrDetails.squareFootage);
  const grm = calculateGRM(purchasePrice, monthlyRent * 12);
  const dscr = calculateDSCR(annualNOI, monthlyMortgage * 12);

  // Calculate 10-year projections
  const projections = [];
  let currentRent = monthlyRent;
  let currentPropertyValue = purchasePrice;
  const { annualRentIncrease, annualPropertyValueIncrease, inflationRate } = sfrDetails.longTermAssumptions;

  for (let year = 1; year <= 10; year++) {
    currentRent *= (1 + annualRentIncrease / 100);
    currentPropertyValue *= (1 + annualPropertyValueIncrease / 100);
    const yearlyExpenses = totalMonthlyExpenses * 12 * Math.pow(1 + inflationRate / 100, year);
    const yearlyMortgage = monthlyMortgage * 12;
    const yearlyCashFlow = (currentRent * 12) - yearlyExpenses - yearlyMortgage;

    projections.push({
      year,
      rent: currentRent * 12,
      propertyValue: currentPropertyValue,
      expenses: yearlyExpenses,
      mortgage: yearlyMortgage,
      cashFlow: yearlyCashFlow
    });
  }

  // Calculate IRR
  const cashFlows = projections.map(p => p.cashFlow);
  const exitValue = currentPropertyValue * (1 - sfrDetails.longTermAssumptions.sellingCostsPercentage / 100);
  cashFlows[cashFlows.length - 1] += exitValue;
  const irr = calculateIRR(cashFlows, downPayment);

  return {
    monthlyMortgage,
    monthlyExpenses: totalMonthlyExpenses,
    monthlyCashFlow,
    annualCashFlow,
    capRate,
    cashOnCashReturn,
    irr,
    pricePerSqFt,
    grm,
    dscr,
    projections,
    metrics: {
      pricePerSqFt,
      rentPerSqFt: monthlyRent / sfrDetails.squareFootage,
      grossRentMultiplier: purchasePrice / (monthlyRent * 12),
    }
  };
};

module.exports = {
  calculateSFRMetrics,
  calculateMonthlyPayment,
  calculateCashFlow,
  calculateCapRate,
  calculateCashOnCashReturn,
  calculateIRR,
  calculatePricePerSqFt,
  calculateGRM,
  calculateDSCR,
  calculateVacancyRate
}; 