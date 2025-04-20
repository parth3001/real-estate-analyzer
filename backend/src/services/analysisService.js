function calculateMonthlyExpenses(dealData, propertyValue) {
  // Calculate base expenses as percentage of property value
  const propertyTax = (dealData.propertyTaxRate / 100 * propertyValue) / 12;
  const insurance = (dealData.insuranceRate / 100 * propertyValue) / 12;
  
  // Calculate management fee based on monthly rent
  const managementFee = dealData.monthlyRent * (dealData.sfrDetails?.propertyManagement?.feePercentage || 4) / 100;
  
  // Calculate reserves based on monthly rent
  const vacancyReserve = dealData.monthlyRent * 0.05; // 5% vacancy rate
  const capexReserve = dealData.monthlyRent * 0.05; // 5% for capital expenditures
  
  // Get maintenance cost (either specified or default to 5% of rent)
  const maintenance = dealData.maintenance || (dealData.monthlyRent * 0.05);
  
  // Calculate HOA fees if applicable
  const hoaFees = dealData.sfrDetails?.hoa?.monthly || 0;
  
  // Calculate utilities (sum of any owner-paid utilities)
  const utilities = Object.values(dealData.sfrDetails?.utilities || {})
    .reduce((sum, val) => sum + (val || 0), 0);
  
  // Calculate monthly accrual for tenant turnover if annual turnover is assumed
  const tenantTurnoverAccrual = dealData.sfrDetails?.tenantTurnover?.assumedAnnualTurnover
    ? ((dealData.monthlyRent * ((dealData.sfrDetails.tenantTurnover.realtorCommissionMonths || 1) + 
        (dealData.sfrDetails.tenantTurnover.prepFeesMonths || 1))) / 12)
    : 0;
  
  const total = propertyTax + insurance + managementFee + vacancyReserve + 
                capexReserve + maintenance + hoaFees + utilities + tenantTurnoverAccrual;
  
  return {
    propertyTax,
    insurance,
    managementFee,
    vacancyReserve,
    capexReserve,
    maintenance,
    hoaFees,
    utilities,
    tenantTurnoverAccrual,
    total
  };
}

function calculateAnnualExpenses(dealData, propertyValue) {
  // Calculate base expenses as percentage of property value
  const propertyTax = dealData.propertyTaxRate / 100 * propertyValue;
  const insurance = dealData.insuranceRate / 100 * propertyValue;
  
  // Calculate management fee based on annual rent
  const annualRent = dealData.monthlyRent * 12;
  const managementFee = annualRent * (dealData.sfrDetails?.propertyManagement?.feePercentage || 4) / 100;
  
  // Calculate reserves based on annual rent
  const vacancyReserve = annualRent * 0.05; // 5% vacancy rate
  const capexReserve = annualRent * 0.05; // 5% for capital expenditures
  
  // Get annual maintenance cost (either specified or default to 5% of rent)
  const maintenance = (dealData.maintenance || (dealData.monthlyRent * 0.05)) * 12;
  
  // Calculate annual HOA fees if applicable
  const hoaFees = (dealData.sfrDetails?.hoa?.monthly || 0) * 12;
  
  // Calculate annual utilities (sum of any owner-paid utilities)
  const utilities = Object.values(dealData.sfrDetails?.utilities || {})
    .reduce((sum, val) => sum + (val || 0), 0) * 12;
  
  // Calculate annual tenant turnover costs if applicable
  const tenantTurnoverCosts = dealData.sfrDetails?.tenantTurnover?.assumedAnnualTurnover
    ? (dealData.monthlyRent * ((dealData.sfrDetails.tenantTurnover.realtorCommissionMonths || 1) + 
        (dealData.sfrDetails.tenantTurnover.prepFeesMonths || 1)))
    : 0;
  
  const total = propertyTax + insurance + managementFee + vacancyReserve + 
                capexReserve + maintenance + hoaFees + utilities + tenantTurnoverCosts;
  
  return {
    propertyTax,
    insurance,
    managementFee,
    vacancyReserve,
    capexReserve,
    maintenance,
    hoaFees,
    utilities,
    tenantTurnoverCosts,
    total
  };
} 