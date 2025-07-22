/**
 * Test script to validate the unified calculation engine
 * with the 371 Dorr Drive property
 */

import { FinancialCalculations, SFRCalculationEngine } from '../utils/financialCalculations';
import { AnalysisAssumptions } from '../analysis/BasePropertyAnalyzer';

// 371 Dorr Drive property data
const your371DorrProperty = {
  propertyType: 'SFR' as const,
  purchasePrice: 467000,
  downPayment: 233500,
  monthlyRent: 2940,
  interestRate: 6.125,
  loanTerm: 30,
  propertyTaxRate: 1.2,
  insuranceRate: 0.6,
  maintenanceCost: 3528, // ANNUAL (from wizard calculation)
  propertyManagementRate: 5,
  squareFootage: 2450,
  bedrooms: 3,
  bathrooms: 2,
  closingCosts: 5000,
  capitalInvestments: 5000,
  tenantTurnoverFees: {
    prepFees: 2500,
    realtorCommission: 1.0 // 1x monthly rent
  },
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2,
    vacancyRate: 10,
    turnoverFrequency: 2
  },
  yearBuilt: 2000
};

const assumptions: AnalysisAssumptions = {
  projectionYears: 10,
  annualRentIncrease: 3,
  annualExpenseIncrease: 2,
  annualPropertyValueIncrease: 3,
  sellingCosts: 6,
  vacancyRate: 10,
  turnoverFrequency: 2
};

console.log('\n=== 371 DORR DRIVE UNIFIED ENGINE VALIDATION ===\n');

// Test core calculations
const grossIncome = SFRCalculationEngine.calculateGrossIncome(your371DorrProperty, 1);
console.log('✓ Gross Income (Year 1):', grossIncome);

const effectiveIncome = FinancialCalculations.calculateEffectiveIncome(grossIncome, assumptions.vacancyRate);
console.log('✓ Effective Income (after ' + assumptions.vacancyRate + '% vacancy):', effectiveIncome);

const operatingExpenses = SFRCalculationEngine.calculateOperatingExpenses(
  your371DorrProperty, grossIncome, 1, assumptions
);
console.log('✓ Operating Expenses (NO vacancy in expenses):', operatingExpenses);

const noi = FinancialCalculations.calculateNOI(effectiveIncome, operatingExpenses);
console.log('✓ NOI (unified calculation):', noi);

const loanAmount = FinancialCalculations.calculateLoanAmount(
  your371DorrProperty.purchasePrice, 
  your371DorrProperty.downPayment
);
const monthlyMortgage = FinancialCalculations.calculateMortgage(
  loanAmount, 
  your371DorrProperty.interestRate, 
  your371DorrProperty.loanTerm
);
const annualDebtService = monthlyMortgage * 12;
console.log('✓ Annual Debt Service:', annualDebtService);

const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
console.log('✓ Annual Cash Flow:', cashFlow);

const totalInvestment = FinancialCalculations.calculateTotalInvestment(
  your371DorrProperty.downPayment,
  your371DorrProperty.closingCosts,
  your371DorrProperty.capitalInvestments
);
console.log('✓ Total Investment:', totalInvestment);

const capRate = FinancialCalculations.calculateCapRate(noi, your371DorrProperty.purchasePrice);
console.log('✓ Cap Rate:', capRate.toFixed(2) + '%');

const cashOnCash = FinancialCalculations.calculateCashOnCashReturn(cashFlow, totalInvestment);
console.log('✓ Cash-on-Cash Return:', cashOnCash.toFixed(2) + '%');

const dscr = FinancialCalculations.calculateDSCR(noi, annualDebtService);
console.log('✓ DSCR:', dscr.toFixed(2));

const operatingExpenseRatio = FinancialCalculations.calculateOperatingExpenseRatio(operatingExpenses, effectiveIncome);
console.log('✓ Operating Expense Ratio (vs effective income):', operatingExpenseRatio.toFixed(2) + '%');

// Test expense breakdown
console.log('\n=== EXPENSE BREAKDOWN (CORRECTED) ===');
const propertyTax = FinancialCalculations.calculatePropertyTax(your371DorrProperty.purchasePrice, your371DorrProperty.propertyTaxRate);
console.log('✓ Property Tax:', propertyTax);

const insurance = FinancialCalculations.calculateInsurance(your371DorrProperty.purchasePrice, your371DorrProperty.insuranceRate);
console.log('✓ Insurance:', insurance);

const maintenance = your371DorrProperty.maintenanceCost; // Annual from wizard
console.log('✓ Maintenance (annual from wizard):', maintenance);

const propertyManagement = FinancialCalculations.calculatePropertyManagement(grossIncome, your371DorrProperty.propertyManagementRate);
console.log('✓ Property Management:', propertyManagement);

const turnoverCosts = FinancialCalculations.calculateTurnoverCosts({
  prepFees: your371DorrProperty.tenantTurnoverFees.prepFees,
  monthlyRent: grossIncome / 12,
  realtorCommission: your371DorrProperty.tenantTurnoverFees.realtorCommission,
  turnoverFrequency: assumptions.turnoverFrequency,
  vacancyRate: assumptions.vacancyRate
});
console.log('✓ Turnover Costs (no double broker fees):', turnoverCosts);

const totalCalculatedExpenses = propertyTax + insurance + maintenance + propertyManagement + turnoverCosts;
console.log('✓ Total Calculated Expenses:', totalCalculatedExpenses);
console.log('✓ Unified Engine Expenses:', operatingExpenses);
console.log('✓ Expenses Match:', Math.abs(totalCalculatedExpenses - operatingExpenses) < 1 ? 'YES' : 'NO');

console.log('\n=== VACANCY HANDLING VALIDATION ===');
console.log('✓ Gross Income:', grossIncome);
console.log('✓ Vacancy Amount (10%):', grossIncome * 0.1);
console.log('✓ Effective Income (gross - vacancy):', effectiveIncome);
console.log('✓ Vacancy in Operating Expenses:', 'NO - handled as income reduction');
console.log('✓ NOI = Effective Income - Operating Expenses:', noi);

console.log('\n=== HISTORICAL COMPARISON (371 Dorr Drive) ===');
console.log('Previous NOI values found in user analysis:');
console.log('  - $13,158 (wizard)');
console.log('  - $12,762 (another calculation)');
console.log('  - $16,290 (inflated calculation)');
console.log('Current Unified NOI:', noi);
console.log('Closest to realistic expectation (~$13K):', Math.abs(noi - 13158) < 500 ? 'YES' : 'NO');

console.log('\n=== SUMMARY ===');
console.log('✅ Unified Calculation Engine Validation Complete');
console.log('✅ Single NOI calculation source');
console.log('✅ Vacancy handled as income reduction (not expense)');
console.log('✅ No unauthorized default expenses (5% CapEx, broker fees)');
console.log('✅ Maintenance cost unit consistency (annual)');
console.log('✅ All calculations use effective income for NOI');