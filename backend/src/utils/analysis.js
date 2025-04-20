// Calculate monthly mortgage payment
const calculateMonthlyPayment = (principal, annualRate, years) => {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = years * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
};

// Calculate monthly interest payment
const calculateMonthlyInterest = (principal, annualRate) => {
  return (principal * (annualRate / 100)) / 12;
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
const calculateCashOnCashReturn = (annualCashFlow, downPayment, closingCosts = 0) => {
  const totalInvestment = downPayment + closingCosts;
  return (annualCashFlow / totalInvestment) * 100;
};

// Calculate Internal Rate of Return (IRR)
const calculateIRR = (cashFlows) => {
  const maxIterations = 1000;
  const tolerance = 0.000001;

  const npv = (rate) => {
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
    capitalInvestment = 0,
    monthlyRent,
    propertyTaxRate,
    insuranceRate,
    maintenance = 0,
    sfrDetails,
    closingCosts = 0
  } = dealData;

  // Get long term assumptions with defaults
  const longTermAssumptions = {
    annualRentIncrease: 2,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2,
    vacancyRate: 5,
    projectionYears: 10,
    ...sfrDetails?.longTermAssumptions
  };

  // Calculate loan amount and monthly payments
  const loanAmount = purchasePrice - downPayment;
  const monthlyMortgage = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
  const monthlyInterest = calculateMonthlyInterest(loanAmount, interestRate);
  const monthlyPrincipal = monthlyMortgage - monthlyInterest;

  // Initialize property value for year 0
  let currentPropertyValue = purchasePrice;
  
  // Calculate initial annual expenses based on percentages
  const annualPropertyTax = (propertyTaxRate / 100) * currentPropertyValue;
  const annualInsurance = (insuranceRate / 100) * currentPropertyValue;
  
  // Calculate monthly operating expenses
  const monthlyPropertyTax = annualPropertyTax / 12;
  const monthlyInsurance = annualInsurance / 12;
  const monthlyMaintenance = maintenance / 12;
  const monthlyPropertyManagement = monthlyRent * (sfrDetails?.propertyManagement?.feePercentage || 0) / 100;
  const monthlyVacancy = monthlyRent * (longTermAssumptions.vacancyRate / 100); // Use configurable vacancy rate
  
  // Calculate total monthly operating expenses (excluding mortgage)
  const monthlyOperatingExpenses = monthlyPropertyTax + monthlyInsurance + monthlyMaintenance + 
                                 monthlyPropertyManagement + monthlyVacancy;

  // Calculate monthly cash flow
  const monthlyCashFlow = monthlyRent - monthlyOperatingExpenses - monthlyMortgage;

  // Calculate annual metrics
  const annualGrossRent = monthlyRent * 12;
  const annualOperatingExpenses = monthlyOperatingExpenses * 12;
  const annualMortgagePayment = monthlyMortgage * 12;
  
  // NOI is before debt service
  const annualNOI = annualGrossRent - annualOperatingExpenses;
  
  // Cash flow is after debt service
  const annualCashFlow = annualNOI - annualMortgagePayment;
  
  // Calculate cap rate (based on NOI before debt service)
  const capRate = calculateCapRate(annualNOI, purchasePrice);
  
  // Calculate cash on cash return (based on cash flow after debt service)
  const totalInitialInvestment = downPayment + closingCosts + capitalInvestment;
  const cashOnCashReturn = calculateCashOnCashReturn(annualCashFlow, totalInitialInvestment);

  // Calculate long-term projections
  const yearlyProjections = [];
  let currentMortgageBalance = loanAmount;
  let totalCashFlow = 0;
  let totalAppreciation = 0;
  let totalAdditionalInvestment = 0;

  // Initial investment (negative cash flow)
  const initialInvestment = -(downPayment + closingCosts + capitalInvestment);
  const cashFlows = [initialInvestment];
  let cumulativeCashFlow = 0;

  for (let year = 1; year <= longTermAssumptions.projectionYears; year++) {
    // Property value appreciation using user-defined rate
    const appreciationFactor = 1 + (longTermAssumptions.annualPropertyValueIncrease / 100);
    currentPropertyValue *= appreciationFactor;
    
    // Calculate mortgage balance and payment
    const annualInterestPayment = currentMortgageBalance * (interestRate / 100);
    const annualMortgagePayment = monthlyMortgage * 12;
    const annualPrincipalPayment = annualMortgagePayment - annualInterestPayment;
    currentMortgageBalance -= annualPrincipalPayment;
    
    // Calculate annual income with user-defined rent increase
    const rentIncreaseFactor = 1 + (longTermAssumptions.annualRentIncrease / 100);
    const annualRent = monthlyRent * 12 * Math.pow(rentIncreaseFactor, year - 1);
    
    // Calculate property tax and insurance based on current property value
    const yearlyPropertyTax = (propertyTaxRate / 100) * currentPropertyValue;
    const yearlyInsurance = (insuranceRate / 100) * currentPropertyValue;
    
    // Calculate other operating expenses with user-defined inflation rate
    const inflationFactor = 1 + (longTermAssumptions.inflationRate / 100);
    const yearlyMaintenance = maintenance * 12 * Math.pow(inflationFactor, year - 1);
    const yearlyPropertyManagement = (annualRent * (sfrDetails?.propertyManagement?.feePercentage || 0)) / 100;
    const yearlyVacancy = annualRent * (longTermAssumptions.vacancyRate / 100); // Use configurable vacancy rate
    
    // Total operating expenses for the year
    const yearlyOperatingExpenses = yearlyPropertyTax + yearlyInsurance + yearlyMaintenance + 
                                  yearlyPropertyManagement + yearlyVacancy;
    
    // NOI for this year
    const yearNOI = annualRent - yearlyOperatingExpenses;
    
    // Cash flow after debt service
    const yearCashFlow = yearNOI - annualMortgagePayment;

    // Track additional investment needed for negative cash flows
    if (yearCashFlow < 0) {
      totalAdditionalInvestment += Math.abs(yearCashFlow);
    }
    
    // Update cumulative values
    cumulativeCashFlow += yearCashFlow;
    totalCashFlow += yearCashFlow;
    totalAppreciation = currentPropertyValue - purchasePrice;

    // Calculate equity and appreciation
    const currentEquity = currentPropertyValue - currentMortgageBalance;
    const yearAppreciation = currentPropertyValue - purchasePrice;
    
    // Calculate returns considering additional investments
    const totalInvestmentToDate = Math.abs(initialInvestment) + 
                                 (cumulativeCashFlow < 0 ? Math.abs(cumulativeCashFlow) : 0);
    const cashOnCash = (yearCashFlow / totalInvestmentToDate) * 100;
    const totalReturn = yearCashFlow + yearAppreciation;
    const cumulativeReturn = ((cumulativeCashFlow + yearAppreciation) / totalInvestmentToDate * 100);

    // Add this year's cash flow to the array
    cashFlows.push(yearCashFlow);

    yearlyProjections.push({
      year,
      propertyValue: currentPropertyValue,
      mortgageBalance: currentMortgageBalance,
      grossRent: annualRent,
      operatingExpenses: yearlyOperatingExpenses,
      propertyTax: yearlyPropertyTax,
      insurance: yearlyInsurance,
      maintenance: yearlyMaintenance,
      propertyManagement: yearlyPropertyManagement,
      vacancy: yearlyVacancy,
      noi: yearNOI,
      debtService: annualMortgagePayment,
      cashFlow: yearCashFlow,
      equity: currentEquity,
      appreciation: yearAppreciation,
      cumulativeCashFlow: cumulativeCashFlow,
      cumulativeReturn: cumulativeReturn,
      cashOnCash: cashOnCash,
      totalReturn: totalReturn,
      additionalInvestmentNeeded: yearCashFlow < 0 ? Math.abs(yearCashFlow) : 0,
      totalInvestmentToDate: totalInvestmentToDate
    });
  }

  // Add final year's property sale proceeds
  const finalPropertyValue = currentPropertyValue;
  const sellingCosts = finalPropertyValue * (longTermAssumptions.sellingCostsPercentage / 100);
  const netProceedsFromSale = finalPropertyValue - sellingCosts - currentMortgageBalance;
  cashFlows[cashFlows.length - 1] += netProceedsFromSale;

  // Calculate exit analysis
  const exitAnalysis = {
    projectedSalePrice: finalPropertyValue,
    sellingCosts,
    mortgagePayoff: currentMortgageBalance,
    principalPaidOff: loanAmount - currentMortgageBalance,
    netProceedsFromSale,
    totalInvestment: Math.abs(initialInvestment) + totalAdditionalInvestment
  };

  // Calculate IRR using all cash flows
  const irr = calculateIRR(cashFlows);

  return {
    monthlyAnalysis: {
      income: {
        baseRent: monthlyRent,
        effectiveGrossRent: monthlyRent - monthlyVacancy
      },
      expenses: {
        propertyTax: monthlyPropertyTax,
        insurance: monthlyInsurance,
        maintenance: monthlyMaintenance,
        propertyManagement: monthlyPropertyManagement,
        vacancy: monthlyVacancy,
        operatingExpenses: monthlyOperatingExpenses,
        mortgage: {
          total: monthlyMortgage,
          principal: monthlyPrincipal,
          interest: monthlyInterest
        }
      },
      noi: annualNOI / 12,
      cashFlow: monthlyCashFlow,
      projectionYears: longTermAssumptions.projectionYears
    },
    annualAnalysis: {
      grossRent: annualGrossRent,
      effectiveGrossRent: annualGrossRent * 0.95,
      operatingExpenses: annualOperatingExpenses,
      noi: annualNOI,
      debtService: annualMortgagePayment,
      cashFlow: annualCashFlow,
      capRate,
      cashOnCashReturn,
      dscr: annualNOI / annualMortgagePayment,
      projectionYears: longTermAssumptions.projectionYears
    },
    longTermAnalysis: {
      yearlyProjections,
      returns: {
        totalCashFlow,
        totalAppreciation: finalPropertyValue - purchasePrice,
        irr,
        totalAdditionalInvestment,
        totalInvestment: Math.abs(initialInvestment) + totalAdditionalInvestment,
        totalReturn: (
          totalCashFlow +
          netProceedsFromSale -
          Math.abs(initialInvestment) -
          totalAdditionalInvestment
        ),
        projectionYears: longTermAssumptions.projectionYears
      },
      exitAnalysis,
      projectionYears: longTermAssumptions.projectionYears
    },
    keyMetrics: {
      dscr: annualNOI / annualMortgagePayment,
      pricePerSqFtAtPurchase: purchasePrice / sfrDetails.squareFootage,
      pricePerSqFtAtSale: finalPropertyValue / sfrDetails.squareFootage,
      avgRentPerSqFt: yearlyProjections.reduce((sum, year) => sum + (year.grossRent / 12 / sfrDetails.squareFootage), 0) / yearlyProjections.length,
      irr,
      cashOnCashReturn,
      capRate,
      projectionYears: longTermAssumptions.projectionYears
    }
  };
};

module.exports = {
  calculateSFRMetrics,
  calculateMonthlyPayment,
  calculateMonthlyInterest,
  calculateCashOnCashReturn,
  calculateIRR,
  calculateCashFlow,
  calculateCapRate,
  calculatePricePerSqFt,
  calculateGRM,
  calculateDSCR,
  calculateVacancyRate
}; 