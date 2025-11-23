/**
 * Multi-Family Property Wizard TypeScript Interfaces
 * Extends existing property types with MF wizard-specific enhancements
 *
 * Architecture:
 * - Shares 80% of wizard infrastructure with SFR wizard
 * - MF-specific: Unit configuration, building details, common area utilities
 * - Uses same WizardStep enum and state management pattern as SFR
 */

import type { PropertyAddress, UnitType, MFLongTermAssumptions, CommonAreaUtilities } from '../../types/property';

// Re-export shared wizard step enumeration from SFR
// We use the same step progression pattern: ADDRESS → FINANCIALS → RENTAL → ASSUMPTIONS → GOALS → TAX
export const MFWizardStep = {
  ADDRESS: 0,
  FINANCIALS: 1,
  RENTAL: 2,        // MF-specific: Unit configuration
  ASSUMPTIONS: 3,
  GOALS: 4,
  TAX: 5
} as const;

export type MFWizardStep = typeof MFWizardStep[keyof typeof MFWizardStep];

// Data confidence scoring for auto-populated fields (shared with SFR)
export interface DataConfidence {
  score: number; // 0-100 confidence percentage
  source: string; // API source (e.g., "RentCast", "FRED", "Census")
  lastUpdated: Date;
  reliability: 'high' | 'medium' | 'low';
}

// Enhanced property address with geocoding data (shared with SFR)
export interface MFWizardPropertyAddress extends PropertyAddress {
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  confidence?: DataConfidence;
}

/**
 * MF-Specific Auto-Populated Property Data
 * Similar to SFR but focuses on multi-family specific data points
 */
export interface MFAutoPopulatedPropertyData {
  // Property basics (from property details APIs)
  totalUnits?: {
    value: number;
    confidence: DataConfidence;
  };
  totalSqft?: {
    value: number;
    confidence: DataConfidence;
  };
  buildingType?: {
    value: 'GARDEN' | 'MID_RISE' | 'HIGH_RISE' | 'TOWNHOUSE' | 'STACKED' | 'MIXED';
    confidence: DataConfidence;
  };
  yearBuilt?: {
    value: number;
    confidence: DataConfidence;
  };

  // Financial data (from various APIs)
  currentMortgageRate?: {
    value: number;
    confidence: DataConfidence;
  };
  propertyTaxes?: {
    value: number; // Annual amount
    confidence: DataConfidence;
  };
  insuranceEstimate?: {
    value: number; // Per unit annual amount
    confidence: DataConfidence;
  };

  // Rental market data (from RentCast) - unit level
  unitTypeEstimates?: Array<{
    type: string; // e.g., "2BR/1BA"
    rentEstimate: {
      value: number;
      range: { low: number; high: number };
      confidence: DataConfidence;
    };
    count?: number; // Estimated number of this unit type
  }>;

  marketPosition?: {
    value: 'Below Market' | 'At Market' | 'Above Market';
    confidence: DataConfidence;
  };
}

/**
 * Smart Defaults for Multi-Family Properties
 * Regional and market-based defaults specific to MF investing
 */
export interface MFSmartDefaults {
  // Financial defaults (similar to SFR but MF-specific ranges)
  downPaymentPercentage: number; // e.g., 25-30% for MF properties
  closingCostPercentage: {
    value: number;
    confidence: DataConfidence;
  } | number; // e.g., 2.5-3.5% for MF
  currentMortgageRate?: {
    value: number;
    confidence: DataConfidence;
  };

  // Operating expense defaults (MF-specific)
  propertyManagementRate: number; // e.g., 8-12% for MF (higher than SFR)
  maintenanceCostPerUnit: number; // e.g., $100-150/unit/month
  commonAreaUtilitiesEstimate: CommonAreaUtilities;
  vacancyRate: number; // e.g., 5-8% for MF

  // Long-term assumptions (market-based)
  appreciationRate?: {
    value: number;
    confidence: DataConfidence;
  };
  rentGrowthRate?: {
    value: number;
    confidence: DataConfidence;
  };
  inflationRate: number;
  propertyTaxRate?: {
    value: number;
    confidence: DataConfidence;
  };
  insuranceRatePerUnit?: {
    value: number;
    confidence: DataConfidence;
  };

  // Source information
  dataSource: string;
  confidence: DataConfidence;
}

/**
 * Unit Template Configuration
 * Allows users to quickly configure units using common templates
 */
export interface UnitTemplate {
  id: string;
  name: string;
  description: string;
  unitType: {
    type: string; // e.g., "2BR/1BA"
    sqft: number;
    suggestedRent: number;
  };
}

/**
 * Exit Strategy Data for MF Investment (shared with SFR)
 */
export interface ExitStrategyData {
  primaryExitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
  portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
  marketTimingFlexibility?: 'flexible' | 'somewhat' | 'constrained' | 'independent';
  riskApproach?: 'conservative' | 'balanced' | 'aggressive' | 'opportunistic';
  capitalDeployment?: 'reinvest_re' | 'diversify' | 'lifestyle' | 'business' | 'debt';
}

/**
 * Tax Profile Interface for Tax Intelligence (shared with SFR)
 */
export interface TaxProfile {
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household';
  state: string;
  federalTaxBracket?: number;
  stateTaxRate?: number;
  capitalGainsHoldingStrategy: 'short_term' | 'long_term' | 'flexible';
  depreciation: {
    method: 'straight_line';
    personalUsePercentage: number;
  };
  investorType: 'individual' | 'entity';
}

/**
 * Enhanced Goal Context (shared with SFR)
 * Import from GoalsStrategyStep when available
 */
export interface EnhancedGoalContext {
  exitStrategy?: ExitStrategyData;
  aiEnhancedStrategy?: string;
  strategicInsights?: string[];
}

/**
 * MF Wizard Form Data
 * This is the frontend-friendly structure used throughout the wizard
 *
 * CRITICAL: Field names differ from backend MultiFamilyPropertyData
 * Use mfDataAdapter.ts to transform between formats
 */
export interface MFWizardFormData {
  // Basic property information
  propertyName: string;
  propertyAddress: MFWizardPropertyAddress;

  // Building details (MF-specific)
  totalUnits: number;
  totalSqft: number;
  yearBuilt: number;
  buildingType?: 'GARDEN' | 'MID_RISE' | 'HIGH_RISE' | 'TOWNHOUSE' | 'STACKED' | 'MIXED';

  // Financial inputs
  purchasePrice: number;
  downPayment: number;
  downPaymentPercentage?: number; // Wizard-specific field for UI
  interestRate: number;
  loanTerm: number;
  loanType?: 'conventional' | 'commercial'; // Wizard-specific field for commercial loans
  balloonPayment?: {
    enabled: boolean;
    years?: number;
  }; // Commercial loan balloon payment configuration
  closingCosts?: number;
  closingCostPercentage?: number; // Wizard-specific field for UI
  capitalInvestments?: number; // Initial repairs or upgrades needed

  // Property taxes and insurance
  propertyTaxRate: number; // Percentage
  insurancePerUnit?: number; // CRITICAL: Dollar amount per unit (wizard format)
  insuranceRate?: number; // Percentage (backend format) - optional override

  // Operating expenses
  propertyManagementRate: number; // CRITICAL: Correct field name (not propertyManagementPercent)
  maintenanceCostPerUnit?: number; // CRITICAL: Per unit per month (wizard format)
  commonAreaUtilities: CommonAreaUtilities;

  // Unit configuration (MF-specific)
  unitTypes: UnitType[];

  // Long-term assumptions
  longTermAssumptions: MFLongTermAssumptions;

  // Investment goals and strategy (optional)
  exitStrategy?: ExitStrategyData;
  enhancedGoals?: EnhancedGoalContext;
  taxProfile?: TaxProfile;

  // Portfolio context (optional)
  portfolioId?: string;
  portfolioContext?: {
    portfolioName?: string;
    portfolioStrategy?: string;
  };
}

/**
 * MF Wizard State Management
 * Mirrors SFR wizard state structure for consistency
 */
export interface MFWizardState {
  currentStep: MFWizardStep;
  completed: boolean[];
  data: MFWizardFormData;
  autoPopulated: MFAutoPopulatedPropertyData;
  smartDefaults: MFSmartDefaults;
  manualOverrides: string[]; // Track which fields user manually modified
  apiErrors: string[]; // Track any API failures
  unitTemplateMode: 'template' | 'custom'; // MF-specific: template vs custom unit entry
}

/**
 * Individual Step Validation (shared pattern with SFR)
 */
export interface StepValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

/**
 * MF Wizard Step Component Props
 */
export interface MFWizardStepProps {
  state: MFWizardState;
  onUpdate: (updates: Partial<MFWizardState>) => void;
  onNext: () => void;
  onPrevious: () => void;
  validation: StepValidation;
}

/**
 * Property Lookup Result for MF Properties
 */
export interface MFPropertyLookupResult {
  found: boolean;
  propertyDetails?: MFAutoPopulatedPropertyData;
  comparables?: Array<{
    address: string;
    distance: number;
    salePrice: number;
    totalUnits?: number;
    pricePerUnit?: number;
    capRate?: number;
  }>;
  marketData?: {
    medianRentPerUnit: number;
    medianSalePricePerUnit: number;
    avgCapRate: number;
    avgOccupancyRate: number;
  };
  errors?: string[];
}

/**
 * Address Validation Result (shared with SFR)
 */
export interface AddressValidationResult {
  isValid: boolean;
  standardizedAddress?: MFWizardPropertyAddress;
  suggestions?: MFWizardPropertyAddress[];
  confidence?: DataConfidence;
}

/**
 * MF Wizard Configuration
 */
export interface MFWizardConfig {
  enableExternalAPIs: boolean;
  enableSmartDefaults: boolean;
  enableAutoPopulation: boolean;
  showConfidenceScores: boolean;
  allowManualOverrides: boolean;
  apiTimeout: number; // milliseconds
  defaultUnitTemplateMode: 'template' | 'custom'; // MF-specific
}

/**
 * Progress Tracking (shared with SFR)
 */
export interface MFWizardProgress {
  completedSteps: number;
  totalSteps: number;
  estimatedTimeRemaining: number; // minutes
  dataQualityScore: number; // 0-100 based on confidence scores
}

/**
 * User Experience Tracking (shared with SFR)
 */
export interface MFWizardAnalytics {
  stepCompletionTimes: number[]; // milliseconds per step
  fieldsManuallyModified: string[];
  apiCallsSuccessful: number;
  apiCallsFailed: number;
  totalWizardTime: number; // milliseconds
  exitedAtStep?: MFWizardStep;
  unitConfigurationMode?: 'template' | 'custom'; // MF-specific tracking
}

// Export all types
export type {
  MultiFamilyPropertyData,
  UnitType,
  MFLongTermAssumptions,
  CommonAreaUtilities
} from '../../types/property';
