function calculateAnnualExpenses(deal, currentPropertyValue) {
  // Calculate property tax and insurance based on current property value
  const propertyTax = (deal.propertyTaxRate / 100) * currentPropertyValue;
  const insurance = (deal.insuranceRate / 100) * currentPropertyValue;
  
  return {
    propertyTax,
    insurance,
    maintenance: deal.maintenance * 12,
    propertyManagement: deal.propertyManagement ? deal.monthlyRent * 12 * (deal.propertyManagementFee / 100) : 0,
    vacancy: deal.monthlyRent * 12 * (deal.vacancyRate / 100),
    capEx: deal.monthlyRent * 12 * (deal.capExRate / 100),
  };
} 