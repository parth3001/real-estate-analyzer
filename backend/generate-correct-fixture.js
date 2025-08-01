const { SFRAnalyzer } = require('./src/analysis/SFRAnalyzer.ts');

// This would need to be run after compilation
// For now, let's calculate manually to understand the correct values

const property = {
  purchasePrice: 425000,
  monthlyRent: 2875,
  propertyTaxRate: 1.25,
  insuranceRate: 0.52,
  propertyManagementRate: 8.5,
  maintenanceCost: 287,
};

const assumptions = {
  vacancyRate: 5
};

// Manual calculation following our correct approach
const annualGrossIncome = property.monthlyRent * 12; // 34,500
const vacancyLoss = annualGrossIncome * (assumptions.vacancyRate / 100); // 1,725
const effectiveIncome = annualGrossIncome - vacancyLoss; // 32,775

const annualPropertyTax = property.purchasePrice * (property.propertyTaxRate / 100); // 5,312.50
const annualInsurance = property.purchasePrice * (property.insuranceRate / 100); // 2,210
const annualMaintenance = property.maintenanceCost * 12; // 3,444
const annualPropMgmt = annualGrossIncome * (property.propertyManagementRate / 100); // 2,932.50

// Basic operating expenses (not including turnover costs yet)
const basicOperatingExpenses = annualPropertyTax + annualInsurance + annualMaintenance + annualPropMgmt; // 13,899

// NOI (before turnover costs)
const basicNOI = effectiveIncome - basicOperatingExpenses; // 18,876

console.log('MANUAL CALCULATION (Industry Standard):');
console.log('=======================================');
console.log('Annual Gross Income:', annualGrossIncome);
console.log('Vacancy Loss:', vacancyLoss);
console.log('Effective Income:', effectiveIncome);
console.log('');
console.log('Operating Expenses:');
console.log('- Property Tax:', annualPropertyTax);
console.log('- Insurance:', annualInsurance); 
console.log('- Maintenance:', annualMaintenance);
console.log('- Property Management:', annualPropMgmt);
console.log('- Basic Total:', basicOperatingExpenses);
console.log('');
console.log('Basic NOI (before turnover):', basicNOI);
console.log('');
console.log('FIXTURE DATA COMPARISON:');
console.log('- Fixture NOI: 18,815.88');
console.log('- Our Basic NOI: 18,876');
console.log('- Difference: ~60 (very close!)');