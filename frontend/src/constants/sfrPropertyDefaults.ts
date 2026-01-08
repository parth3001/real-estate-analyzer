/**
 * Single Source of Truth for SFR Property Default Values
 * 
 * CRITICAL: All components must import from this file to ensure consistency
 * across PropertyWizard, SFRPropertyForm, and Pipeline prefill flows.
 * 
 * Created: September 6, 2025
 * Purpose: Fix data consistency issues causing financial calculation differences
 */

import type { EnhancedGoalContext } from '../components/SFRAnalysis/GoalsStrategyStep';

// Address defaults
export const DEFAULT_PROPERTY_ADDRESS = {
  street: '',
  city: '',
  state: '',
  zipCode: ''
};

// Enhanced goals defaults (strategy preferences)
export const DEFAULT_ENHANCED_GOALS: EnhancedGoalContext = {
  exitStrategy: 'sale' as const,
  portfolioStrategy: 'cashflow' as const,
  experienceLevel: 'intermediate' as const,
  riskTolerance: 'moderate' as const,
  freeTextStrategy: ''
};

// Long term assumptions defaults
export const DEFAULT_LONG_TERM_ASSUMPTIONS = {
  projectionYears: 10,
  annualRentIncrease: 3.0,
  annualPropertyValueIncrease: 3.0,
  sellingCostsPercentage: 6.0,
  inflationRate: 2.5,
  vacancyRate: 5.0,
  turnoverFrequency: 2
};

// Tenant turnover fees defaults  
export const DEFAULT_TENANT_TURNOVER_FEES = {
  prepFees: 500,
  realtorCommission: 0.5
};

/**
 * Core SFR Property Default Values
 * 
 * NOTE: These values prioritize CONSISTENCY over market accuracy.
 * Users can modify any value - the key is that all entry methods
 * start with identical defaults.
 */
export const SFR_PROPERTY_DEFAULTS = {
  // Property identification
  propertyType: 'SFR' as const,
  propertyName: '',
  propertyAddress: DEFAULT_PROPERTY_ADDRESS,
  
  // Purchase details  
  purchasePrice: 0,
  downPayment: 0,
  closingCosts: 0,
  capitalInvestments: 0,
  
  // Loan details - CONSISTENCY KEY: All components must use same rate
  interestRate: 6.5,  // Reasonable middle-ground rate
  loanTerm: 30,
  
  // Operating rates - CONSISTENCY KEY: Same across all flows  
  propertyTaxRate: 1.2,     // National average
  insuranceRate: 0.7,       // Conservative estimate  
  propertyManagementRate: 8, // Industry standard
  
  // Property characteristics
  yearBuilt: new Date().getFullYear() - 20,
  monthlyRent: 0,
  squareFootage: 0,
  bedrooms: 3,
  bathrooms: 2,
  maintenanceCost: 0,

  // ✅ NEW: Operating Expenses (Josh's feature request - Jan 2026)
  monthlyHOA: 0,           // Monthly HOA fees (0 if not applicable)
  monthlyUtilities: 0,     // Landlord-paid utilities (0 if tenant pays)
  monthlyCapEx: 0,         // CapEx reserve (dynamically calculated as 5% of rent in wizard)

  // Fee structures
  tenantTurnoverFees: DEFAULT_TENANT_TURNOVER_FEES,
  
  // Investment strategy  
  enhancedGoals: DEFAULT_ENHANCED_GOALS,
  
  // Long term projections
  longTermAssumptions: DEFAULT_LONG_TERM_ASSUMPTIONS
};

/**
 * Wizard-specific percentage defaults
 * These are used by PropertyWizard for percentage-based inputs
 * that get converted to absolute values during backend processing
 */
export const DEFAULT_WIZARD_PERCENTAGES = {
  downPaymentPercentage: 25,
  closingCostPercentage: 2.5,  
  maintenanceReservePercentage: 5,
  vacancyRate: 5  // Note: Also in longTermAssumptions for consistency
};

/**
 * Smart defaults for wizard auto-population
 * Used by PropertyWizard's smart defaults system
 */
export const DEFAULT_SMART_DEFAULTS = {
  downPaymentPercentage: 25,
  closingCostPercentage: 2.5,
  managementFeePercentage: 8,
  maintenanceReservePercentage: 5,
  vacancyRatePercentage: 5,
  inflationRate: 2.5,
  dataSource: 'defaults',
  confidence: {
    score: 60,
    source: 'system_defaults',
    lastUpdated: new Date(),
    reliability: 'medium' as const
  }
};

/**
 * Helper function to merge partial property data with defaults
 * Useful for prefilling forms with existing data while ensuring
 * all fields have consistent default values
 */
export const mergeWithPropertyDefaults = (partialData: Partial<typeof SFR_PROPERTY_DEFAULTS>) => {
  return {
    ...SFR_PROPERTY_DEFAULTS,
    ...partialData,
    // Ensure nested objects are properly merged
    propertyAddress: {
      ...DEFAULT_PROPERTY_ADDRESS,
      ...partialData.propertyAddress
    },
    longTermAssumptions: {
      ...DEFAULT_LONG_TERM_ASSUMPTIONS,
      ...partialData.longTermAssumptions
    },
    tenantTurnoverFees: {
      ...DEFAULT_TENANT_TURNOVER_FEES,
      ...partialData.tenantTurnoverFees
    },
    enhancedGoals: {
      ...DEFAULT_ENHANCED_GOALS,
      ...partialData.enhancedGoals
    }
  };
};

/**
 * Generate property name from address
 * Consistent naming across all entry methods
 */
export const generatePropertyName = (address: { street?: string; city?: string }) => {
  if (address.street && address.city) {
    const streetNumber = address.street.split(' ')[0];
    return `${streetNumber} ${address.city}`;
  }
  return '';
};

/**
 * Validation: Ensure critical rates are reasonable
 * This helps catch any future modification errors
 */
export const validateDefaults = () => {
  const { interestRate, propertyTaxRate, insuranceRate } = SFR_PROPERTY_DEFAULTS;
  
  if (interestRate < 3 || interestRate > 15) {
    console.warn('Default interest rate outside reasonable range:', interestRate);
  }
  if (propertyTaxRate < 0.1 || propertyTaxRate > 5) {
    console.warn('Default property tax rate outside reasonable range:', propertyTaxRate);
  }
  if (insuranceRate < 0.1 || insuranceRate > 3) {
    console.warn('Default insurance rate outside reasonable range:', insuranceRate);
  }
};

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  validateDefaults();
}