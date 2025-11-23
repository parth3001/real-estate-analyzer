/**
 * MF Data Adapter - Critical Field Name Mapping Utility
 *
 * Purpose: Transform frontend MF wizard data to match backend API expectations
 *
 * CRITICAL: This adapter prevents null metrics bugs caused by field name mismatches
 *
 * Common Mistakes Prevented:
 * - ❌ insurance: 600 → ✅ insuranceRate: 0.5 (percentage, not dollar amount)
 * - ❌ propertyManagementPercent: 8 → ✅ propertyManagementRate: 8
 * - ❌ maintenance: 800 → ✅ maintenanceCost: 100 (per unit per month, not total)
 *
 * Data Source: /docs/DATA_MAPPING.md lines 425-590
 * Backend Interface: /backend/src/types/propertyTypes.ts (MultiFamilyData)
 */

import type { MultiFamilyPropertyData, CommonAreaUtilities } from '../types/property';

/**
 * Frontend wizard data structure (user-friendly field names)
 */
export interface MFWizardFormData {
  // Property Address
  propertyName: string;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
  };

  // Property Details
  totalUnits: number;
  totalSqft: number;
  yearBuilt: number;
  buildingType?: 'GARDEN' | 'MID_RISE' | 'HIGH_RISE' | 'TOWNHOUSE' | 'STACKED' | 'MIXED' | 'COMPLEX'; // Phase 1: Commercial MF (5+ units) - COMPLEX is legacy

  // Purchase & Financing
  purchasePrice: number;
  downPayment: number; // Can be $ or calculated from percentage
  downPaymentPercentage?: number; // Helper field from wizard
  interestRate: number;
  loanTerm: number;
  closingCosts?: number;
  capitalInvestments?: number;

  // Operating Expenses (USER-FRIENDLY NAMES)
  propertyTaxRate: number; // Percentage (e.g., 2.0 for 2%)
  insurancePerUnit?: number; // WIZARD: Dollar per unit per year
  insuranceRate?: number; // BACKEND: Percentage of purchase price
  propertyManagementRate: number; // Percentage (e.g., 8 for 8%)
  maintenanceCostPerUnit?: number; // WIZARD: Dollar per unit per month

  // Common Area Utilities (monthly amounts)
  commonAreaUtilities: {
    electric: number;
    water: number;
    gas: number;
    trash: number;
  };

  // Unit Configuration
  unitTypes: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
    occupied?: number;
  }>;

  // Long-term Assumptions
  longTermAssumptions: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    sellingCostsPercentage: number;
    inflationRate: number;
    vacancyRate: number;
    capitalExpenditureRate: number;
    commonAreaMaintenanceRate: number;
  };

  // Portfolio Context (optional)
  portfolioId?: string;
  portfolioContext?: {
    portfolioName?: string;
    portfolioStrategy?: string;
  };

  // Investment Goals (optional)
  enhancedGoals?: {
    exitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
    portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
    experienceLevel?: 'novice' | 'intermediate' | 'expert';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
    freeTextStrategy?: string;
    aiEnhancedStrategy?: string;
    strategicInsights?: string[];
  };
}

/**
 * Validation result interface
 */
export interface MFDataValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Validate MF wizard data before transformation
 *
 * @param wizardData - Frontend wizard form data
 * @returns Validation result with errors and warnings
 */
export function validateMFWizardData(wizardData: MFWizardFormData): MFDataValidationResult {
  const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
  const warnings: Array<{ field: string; message: string }> = [];

  // Required fields validation
  if (!wizardData.totalUnits || wizardData.totalUnits < 2) {
    errors.push({
      field: 'totalUnits',
      message: 'Total units must be at least 2 for multi-family properties',
      severity: 'error'
    });
  }

  if (wizardData.totalUnits > 32) {
    warnings.push({
      field: 'totalUnits',
      message: 'Properties with more than 32 units may require commercial analysis'
    });
  }

  if (!wizardData.totalSqft || wizardData.totalSqft <= 0) {
    errors.push({
      field: 'totalSqft',
      message: 'Total square footage is required',
      severity: 'error'
    });
  }

  if (!wizardData.unitTypes || wizardData.unitTypes.length === 0) {
    errors.push({
      field: 'unitTypes',
      message: 'At least one unit type must be specified',
      severity: 'error'
    });
  }

  // Validate unit count matches
  if (wizardData.unitTypes && wizardData.unitTypes.length > 0) {
    const totalUnitsInConfig = wizardData.unitTypes.reduce((sum, ut) => sum + ut.count, 0);
    if (totalUnitsInConfig !== wizardData.totalUnits) {
      errors.push({
        field: 'unitTypes',
        message: `Unit configuration count (${totalUnitsInConfig}) doesn't match total units (${wizardData.totalUnits})`,
        severity: 'error'
      });
    }
  }

  // Validate insurance field (common mistake)
  if (wizardData.insurancePerUnit && !wizardData.insuranceRate) {
    // Calculate insuranceRate from insurancePerUnit
    const annualInsuranceTotal = wizardData.insurancePerUnit * wizardData.totalUnits;
    const insuranceRate = (annualInsuranceTotal / wizardData.purchasePrice) * 100;

    // Check both rate percentage and per-unit amount
    if (insuranceRate > 5) {
      warnings.push({
        field: 'insurance',
        message: `Insurance rate (${insuranceRate.toFixed(2)}%) seems high. Typical: 0.5-1.5%`
      });
    } else if (wizardData.insurancePerUnit > 2000) {
      // Typical insurance: $600-$1200/unit/year for multi-family
      warnings.push({
        field: 'insurance',
        message: `Insurance cost ($${wizardData.insurancePerUnit}/unit/year) seems very high. Typical: $600-$1200/unit/year`
      });
    }
  }

  // Validate maintenance cost (common mistake - total vs per unit)
  if (wizardData.maintenanceCostPerUnit) {
    const annualMaintenanceTotal = wizardData.maintenanceCostPerUnit * wizardData.totalUnits * 12;
    const maintenanceAsPercentOfPurchase = (annualMaintenanceTotal / wizardData.purchasePrice) * 100;

    if (maintenanceAsPercentOfPurchase > 10) {
      warnings.push({
        field: 'maintenanceCost',
        message: `Maintenance cost (${maintenanceAsPercentOfPurchase.toFixed(1)}% of purchase price) seems very high. Typical: 3-6%`
      });
    }
  }

  // Validate property management rate
  if (wizardData.propertyManagementRate) {
    if (wizardData.propertyManagementRate < 5 || wizardData.propertyManagementRate > 15) {
      warnings.push({
        field: 'propertyManagementRate',
        message: `Property management rate (${wizardData.propertyManagementRate}%) is outside typical range (8-12%)`
      });
    }
  }

  // Validate vacancy rate
  if (wizardData.longTermAssumptions?.vacancyRate) {
    if (wizardData.longTermAssumptions.vacancyRate < 3 || wizardData.longTermAssumptions.vacancyRate > 15) {
      warnings.push({
        field: 'vacancyRate',
        message: `Vacancy rate (${wizardData.longTermAssumptions.vacancyRate}%) is outside typical range (5-10%)`
      });
    }
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings
  };
}

/**
 * Transform frontend wizard data to backend API format
 *
 * CRITICAL: This function handles all field name mappings to prevent null metrics
 *
 * @param wizardData - Frontend wizard form data (user-friendly names)
 * @returns Backend-compatible MultiFamilyPropertyData
 * @throws Error if validation fails
 */
export function transformMFWizardDataToBackend(
  wizardData: MFWizardFormData
): MultiFamilyPropertyData {
  // Validate first
  const validation = validateMFWizardData(wizardData);

  if (!validation.isValid) {
    const errorMessages = validation.errors
      .filter(e => e.severity === 'error')
      .map(e => `${e.field}: ${e.message}`)
      .join(', ');
    throw new Error(`MF Data Validation Failed: ${errorMessages}`);
  }

  // Log warnings to console (non-blocking)
  if (validation.warnings.length > 0) {
    console.warn('MF Data Adapter Warnings:', validation.warnings);
  }

  // CRITICAL FIELD MAPPINGS (prevents null metrics)

  // 1. Insurance: Convert insurancePerUnit (dollars) → insuranceRate (percentage)
  let insuranceRate: number;
  if (wizardData.insuranceRate !== undefined) {
    insuranceRate = wizardData.insuranceRate;
  } else if (wizardData.insurancePerUnit !== undefined) {
    // Calculate from per-unit cost
    const annualInsuranceTotal = wizardData.insurancePerUnit * wizardData.totalUnits;
    insuranceRate = (annualInsuranceTotal / wizardData.purchasePrice) * 100;
    console.log('MFDataAdapter: Converted insurancePerUnit to insuranceRate', {
      insurancePerUnit: wizardData.insurancePerUnit,
      totalUnits: wizardData.totalUnits,
      annualInsuranceTotal,
      insuranceRate: insuranceRate.toFixed(3)
    });
  } else {
    // Default: $600/unit/year typical for MF
    const defaultInsurancePerUnit = 600;
    const annualInsuranceTotal = defaultInsurancePerUnit * wizardData.totalUnits;
    insuranceRate = (annualInsuranceTotal / wizardData.purchasePrice) * 100;
    console.log('MFDataAdapter: Using default insurance rate', {
      defaultInsurancePerUnit,
      insuranceRate: insuranceRate.toFixed(3)
    });
  }

  // 2. Maintenance: CRITICAL - maintenanceCostPerUnit (monthly per unit) → maintenanceCost
  // Backend expects: maintenanceCost (per unit per month)
  let maintenanceCost: number;
  if (wizardData.maintenanceCostPerUnit !== undefined) {
    maintenanceCost = wizardData.maintenanceCostPerUnit;
  } else {
    // Default: $100/unit/month typical for MF
    maintenanceCost = 100;
    console.log('MFDataAdapter: Using default maintenanceCost', {
      maintenanceCost
    });
  }

  // 3. Common Area Utilities: Ensure all fields present
  const commonAreaUtilities: CommonAreaUtilities = {
    electric: wizardData.commonAreaUtilities?.electric || 0,
    water: wizardData.commonAreaUtilities?.water || 0,
    gas: wizardData.commonAreaUtilities?.gas || 0,
    trash: wizardData.commonAreaUtilities?.trash || 0
  };

  // 4. Down Payment: Calculate if percentage provided
  let downPayment: number;
  if (wizardData.downPayment) {
    downPayment = wizardData.downPayment;
  } else if (wizardData.downPaymentPercentage) {
    downPayment = wizardData.purchasePrice * (wizardData.downPaymentPercentage / 100);
    console.log('MFDataAdapter: Calculated downPayment from percentage', {
      downPaymentPercentage: wizardData.downPaymentPercentage,
      downPayment
    });
  } else {
    // Default: 25% for MF investment property
    downPayment = wizardData.purchasePrice * 0.25;
    console.log('MFDataAdapter: Using default 25% down payment', {
      downPayment
    });
  }

  // Build backend-compatible data structure
  const backendData: MultiFamilyPropertyData = {
    // Property Type
    propertyType: 'MF',

    // Property Identification
    propertyName: wizardData.propertyName,
    propertyAddress: wizardData.propertyAddress,

    // Property Details
    totalUnits: wizardData.totalUnits,
    totalSqft: wizardData.totalSqft,
    yearBuilt: wizardData.yearBuilt,

    // Purchase & Financing
    purchasePrice: wizardData.purchasePrice,
    downPayment: downPayment,
    interestRate: wizardData.interestRate,
    loanTerm: wizardData.loanTerm,
    closingCosts: wizardData.closingCosts,
    capitalInvestments: wizardData.capitalInvestments,

    // Operating Expenses (CRITICAL FIELD NAMES)
    propertyTaxRate: wizardData.propertyTaxRate,
    insuranceRate: insuranceRate, // ✅ Percentage (not dollar amount)
    propertyManagementRate: wizardData.propertyManagementRate, // ✅ Correct field name
    maintenanceCostPerUnit: maintenanceCost, // ✅ Per unit per month

    // Common Area Utilities
    commonAreaUtilities: commonAreaUtilities,

    // Unit Configuration
    unitTypes: wizardData.unitTypes,

    // Long-term Assumptions
    longTermAssumptions: wizardData.longTermAssumptions,

    // Portfolio Context (optional)
    portfolioId: wizardData.portfolioId,
    portfolioContext: wizardData.portfolioContext,

    // Enhanced Goals (optional - for AI analysis)
    // Type assertion needed due to type difference between wizard EnhancedGoalContext and backend simple type
    enhancedGoals: wizardData.enhancedGoals as any
  };

  // Log transformation for debugging
  console.log('MFDataAdapter: Transformation complete', {
    totalUnits: backendData.totalUnits,
    insuranceRate: backendData.insuranceRate.toFixed(3),
    propertyManagementRate: backendData.propertyManagementRate,
    maintenanceCostPerUnit: backendData.maintenanceCostPerUnit,
    commonAreaUtilities: backendData.commonAreaUtilities
  });

  return backendData;
}

/**
 * Helper function to convert backend response to frontend display format
 * (Useful for editing existing properties)
 *
 * @param backendData - Backend MultiFamilyPropertyData
 * @returns Frontend wizard form data
 */
export function transformBackendToWizardData(
  backendData: MultiFamilyPropertyData
): MFWizardFormData {
  // Calculate insurancePerUnit for display
  const annualInsuranceTotal = (backendData.insuranceRate / 100) * backendData.purchasePrice;
  const insurancePerUnit = annualInsuranceTotal / backendData.totalUnits;

  // Calculate downPaymentPercentage for display
  const downPaymentPercentage = (backendData.downPayment / backendData.purchasePrice) * 100;

  return {
    propertyName: backendData.propertyName,
    propertyAddress: backendData.propertyAddress,
    totalUnits: backendData.totalUnits,
    totalSqft: backendData.totalSqft,
    yearBuilt: backendData.yearBuilt,
    buildingType: backendData.buildingType,
    purchasePrice: backendData.purchasePrice,
    downPayment: backendData.downPayment,
    downPaymentPercentage: downPaymentPercentage,
    interestRate: backendData.interestRate,
    loanTerm: backendData.loanTerm,
    closingCosts: backendData.closingCosts,
    capitalInvestments: backendData.capitalInvestments,
    propertyTaxRate: backendData.propertyTaxRate,
    insurancePerUnit: insurancePerUnit,
    insuranceRate: backendData.insuranceRate,
    propertyManagementRate: backendData.propertyManagementRate,
    maintenanceCostPerUnit: backendData.maintenanceCostPerUnit,
    commonAreaUtilities: backendData.commonAreaUtilities,
    unitTypes: backendData.unitTypes,
    longTermAssumptions: backendData.longTermAssumptions,
    portfolioId: backendData.portfolioId,
    portfolioContext: backendData.portfolioContext,
    enhancedGoals: backendData.enhancedGoals
  };
}

/**
 * Utility function to calculate total monthly rent from unit types
 *
 * @param unitTypes - Array of unit type configurations
 * @returns Total monthly rent across all units
 */
export function calculateTotalMonthlyRent(
  unitTypes: Array<{ count: number; monthlyRent: number }>
): number {
  return unitTypes.reduce((total, ut) => total + (ut.count * ut.monthlyRent), 0);
}

/**
 * Utility function to calculate annual gross income
 *
 * @param unitTypes - Array of unit type configurations
 * @returns Annual gross income (monthly rent × 12)
 */
export function calculateAnnualGrossIncome(
  unitTypes: Array<{ count: number; monthlyRent: number }>
): number {
  return calculateTotalMonthlyRent(unitTypes) * 12;
}

/**
 * Utility function to format insurance for display
 *
 * @param insuranceRate - Insurance as percentage of purchase price
 * @param purchasePrice - Property purchase price
 * @param totalUnits - Total number of units
 * @returns Object with total annual insurance and per-unit cost
 */
export function formatInsuranceDisplay(
  insuranceRate: number,
  purchasePrice: number,
  totalUnits: number
) {
  const annualTotal = (insuranceRate / 100) * purchasePrice;
  const perUnit = annualTotal / totalUnits;

  return {
    annualTotal,
    perUnit,
    perUnitMonthly: perUnit / 12,
    displayText: `$${perUnit.toFixed(0)}/unit/year (${insuranceRate.toFixed(2)}%)`
  };
}
