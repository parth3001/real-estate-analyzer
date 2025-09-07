/**
 * Utility functions for handling floating-point precision issues
 * Ensures consistent rounding across the application
 */

/**
 * Round a number to specified decimal places
 * @param value Number to round
 * @param decimals Number of decimal places (default: 2)
 * @returns Rounded number
 */
export const round = (value: number | undefined | null, decimals = 2): number => {
  if (value === undefined || value === null || isNaN(value)) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Round currency values to 2 decimal places
 * @param value Currency amount
 * @returns Rounded currency amount
 */
export const roundCurrency = (value: number | undefined | null): number => {
  return round(value, 2);
};

/**
 * Round percentage values to specified decimal places
 * @param value Percentage value
 * @param decimals Number of decimal places (default: 2)
 * @returns Rounded percentage
 */
export const roundPercent = (value: number | undefined | null, decimals = 2): number => {
  return round(value, decimals);
};

/**
 * Round interest rate to common precision (2 decimals)
 * @param rate Interest rate
 * @returns Rounded interest rate
 */
export const roundInterestRate = (rate: number | undefined | null): number => {
  return round(rate, 2);
};

/**
 * Calculate monthly payment from annual values with proper rounding
 * @param annualValue Annual amount
 * @returns Monthly amount rounded to 2 decimal places
 */
export const monthlyFromAnnual = (annualValue: number | undefined | null): number => {
  if (!annualValue) return 0;
  return round(annualValue / 12, 2);
};

/**
 * Calculate annual value from monthly with proper rounding
 * @param monthlyValue Monthly amount
 * @returns Annual amount rounded to 2 decimal places
 */
export const annualFromMonthly = (monthlyValue: number | undefined | null): number => {
  if (!monthlyValue) return 0;
  return round(monthlyValue * 12, 2);
};

/**
 * Calculate percentage with proper rounding
 * @param numerator Top value
 * @param denominator Bottom value
 * @param decimals Number of decimal places (default: 2)
 * @returns Percentage value rounded
 */
export const calculatePercent = (
  numerator: number | undefined | null, 
  denominator: number | undefined | null,
  decimals = 2
): number => {
  if (!numerator || !denominator || denominator === 0) return 0;
  return round((numerator / denominator) * 100, decimals);
};

/**
 * Safe division with rounding
 * @param numerator Top value
 * @param denominator Bottom value
 * @param decimals Number of decimal places (default: 2)
 * @returns Result of division, or 0 if denominator is 0
 */
export const safeDivide = (
  numerator: number | undefined | null,
  denominator: number | undefined | null,
  decimals = 2
): number => {
  if (!numerator || !denominator || denominator === 0) return 0;
  return round(numerator / denominator, decimals);
};

/**
 * Calculate mortgage payment with proper rounding
 * @param principal Loan amount
 * @param annualRate Annual interest rate (as percentage, e.g., 7 for 7%)
 * @param years Loan term in years
 * @returns Monthly payment amount rounded to 2 decimal places
 */
export const calculateMortgagePayment = (
  principal: number,
  annualRate: number,
  years: number
): number => {
  if (principal <= 0 || years <= 0) return 0;
  
  // Handle 0% interest rate
  if (annualRate === 0) {
    return round(principal / (years * 12), 2);
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return round(monthlyPayment, 2);
};

/**
 * Calculate cap rate with proper rounding
 * @param noi Net Operating Income (annual)
 * @param purchasePrice Property purchase price
 * @returns Cap rate as percentage rounded to 2 decimal places
 */
export const calculateCapRate = (
  noi: number | undefined | null,
  purchasePrice: number | undefined | null
): number => {
  return calculatePercent(noi, purchasePrice, 2);
};

/**
 * Calculate cash-on-cash return with proper rounding
 * @param annualCashFlow Annual cash flow
 * @param totalInvestment Total cash invested
 * @returns Cash-on-cash return as percentage rounded to 2 decimal places
 */
export const calculateCashOnCash = (
  annualCashFlow: number | undefined | null,
  totalInvestment: number | undefined | null
): number => {
  return calculatePercent(annualCashFlow, totalInvestment, 2);
};

/**
 * Sum multiple values with proper rounding
 * @param values Array of values to sum
 * @param decimals Number of decimal places (default: 2)
 * @returns Sum rounded to specified decimal places
 */
export const roundedSum = (values: (number | undefined | null)[], decimals = 2): number => {
  const sum = values.reduce((acc, val) => (acc || 0) + (val || 0), 0);
  return round(sum, decimals);
};

/**
 * Calculate property tax from rate and value
 * @param propertyValue Property value
 * @param taxRate Tax rate as percentage (e.g., 1.2 for 1.2%)
 * @param monthly Whether to return monthly amount (default: false for annual)
 * @returns Tax amount rounded to 2 decimal places
 */
export const calculatePropertyTax = (
  propertyValue: number | undefined | null,
  taxRate: number | undefined | null,
  monthly = false
): number => {
  if (!propertyValue || !taxRate) return 0;
  const annualTax = round((propertyValue * taxRate) / 100, 2);
  return monthly ? monthlyFromAnnual(annualTax) : annualTax;
};

/**
 * Calculate insurance cost from rate and value
 * @param propertyValue Property value
 * @param insuranceRate Insurance rate as percentage (e.g., 0.5 for 0.5%)
 * @param monthly Whether to return monthly amount (default: false for annual)
 * @returns Insurance amount rounded to 2 decimal places
 */
export const calculateInsurance = (
  propertyValue: number | undefined | null,
  insuranceRate: number | undefined | null,
  monthly = false
): number => {
  if (!propertyValue || !insuranceRate) return 0;
  const annualInsurance = round((propertyValue * insuranceRate) / 100, 2);
  return monthly ? monthlyFromAnnual(annualInsurance) : annualInsurance;
};

/**
 * Calculate property management fee
 * @param monthlyRent Monthly rental income
 * @param managementRate Management rate as percentage (e.g., 8 for 8%)
 * @returns Monthly management fee rounded to 2 decimal places
 */
export const calculateManagementFee = (
  monthlyRent: number | undefined | null,
  managementRate: number | undefined | null
): number => {
  if (!monthlyRent || !managementRate) return 0;
  return round((monthlyRent * managementRate) / 100, 2);
};