/**
 * Property Wizard TypeScript Interfaces
 * Extends existing property types with wizard-specific enhancements
 */

import type { SFRPropertyData, PropertyAddress } from '../../types/property';

// Wizard step enumeration (using const to satisfy erasableSyntaxOnly)
export const WizardStep = {
  ADDRESS: 0,
  FINANCIALS: 1,
  RENTAL: 2,
  ASSUMPTIONS: 3
} as const;

export type WizardStep = typeof WizardStep[keyof typeof WizardStep];

// Data confidence scoring for auto-populated fields
export interface DataConfidence {
  score: number; // 0-100 confidence percentage
  source: string; // API source (e.g., "RentCast", "FRED", "ATTOM")
  lastUpdated: Date;
  reliability: 'high' | 'medium' | 'low';
}

// Enhanced property address with geocoding data
export interface WizardPropertyAddress extends PropertyAddress {
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  confidence?: DataConfidence;
}

// Auto-populated property details from external APIs
export interface AutoPopulatedPropertyData {
  // Property basics (from property details APIs)
  squareFootage?: {
    value: number;
    confidence: DataConfidence;
  };
  bedrooms?: {
    value: number;
    confidence: DataConfidence;
  };
  bathrooms?: {
    value: number;
    confidence: DataConfidence;
  };
  yearBuilt?: {
    value: number;
    confidence: DataConfidence;
  };
  lotSize?: {
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
    value: number; // Annual amount
    confidence: DataConfidence;
  };
  
  // Rental market data (from RentCast)
  rentEstimate?: {
    value: number;
    range: { low: number; high: number };
    confidence: DataConfidence;
  };
  marketPosition?: {
    value: 'Below Market' | 'At Market' | 'Above Market';
    confidence: DataConfidence;
  };
}

// Smart defaults based on location and property type
export interface SmartDefaults {
  // Financial defaults
  downPaymentPercentage: number; // e.g., 25% for investment properties
  closingCostPercentage: {
    value: number;
    confidence: DataConfidence;
  } | number; // e.g., 2.5% in Texas
  currentMortgageRate?: {
    value: number;
    confidence: DataConfidence;
  };
  
  // Operating expense defaults (regional averages)
  managementFeePercentage: number; // e.g., 8% in Austin
  maintenanceReservePercentage: number; // e.g., 5% of rent
  vacancyRatePercentage: number; // e.g., 4% in Austin
  
  // Long-term assumptions (market-based)
  appreciationRate?: {
    value: number;
    confidence: DataConfidence;
  }; // e.g., 4.2% Austin 5-year average
  rentGrowthRate?: {
    value: number;
    confidence: DataConfidence;
  }; // e.g., 3.8% Austin trend
  inflationRate: number; // Current economic data
  propertyTaxRate?: {
    value: number;
    confidence: DataConfidence;
  };
  insuranceRate?: {
    value: number;
    confidence: DataConfidence;
  };
  
  // Source information
  dataSource: string;
  confidence: DataConfidence;
}

// Extended property data for wizard including percentage fields
export interface WizardPropertyData extends Partial<SFRPropertyData> {
  // Wizard-specific percentage fields
  downPaymentPercentage?: number;
  closingCostPercentage?: number;
  maintenanceReservePercentage?: number;
  vacancyRate?: number; // Note: this is already in longTermAssumptions but needed at top level for wizard
}

// Wizard state management
export interface WizardState {
  currentStep: WizardStep;
  completed: boolean[];
  data: WizardPropertyData;
  autoPopulated: AutoPopulatedPropertyData;
  smartDefaults: SmartDefaults;
  manualOverrides: string[]; // Track which fields user manually modified
  apiErrors: string[]; // Track any API failures
}

// Individual step validation
export interface StepValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

// Step component props interface
export interface WizardStepProps {
  state: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onPrevious: () => void;
  validation: StepValidation;
}

// API lookup results
export interface PropertyLookupResult {
  found: boolean;
  propertyDetails?: AutoPopulatedPropertyData;
  comparables?: Array<{
    address: string;
    distance: number;
    salePrice: number;
    rentEstimate?: number;
  }>;
  marketData?: {
    medianRent: number;
    medianSalePrice: number;
    priceToRentRatio: number;
  };
  errors?: string[];
}

// External API response interfaces
export interface AddressValidationResult {
  isValid: boolean;
  standardizedAddress?: WizardPropertyAddress;
  suggestions?: WizardPropertyAddress[];
  confidence?: DataConfidence;
}

// Wizard configuration
export interface WizardConfig {
  enableExternalAPIs: boolean;
  enableSmartDefaults: boolean;
  enableAutoPopulation: boolean;
  showConfidenceScores: boolean;
  allowManualOverrides: boolean;
  apiTimeout: number; // milliseconds
}

// Progress tracking
export interface WizardProgress {
  completedSteps: number;
  totalSteps: number;
  estimatedTimeRemaining: number; // minutes
  dataQualityScore: number; // 0-100 based on confidence scores
}

// User experience tracking
export interface WizardAnalytics {
  stepCompletionTimes: number[]; // milliseconds per step
  fieldsManuallyModified: string[];
  apiCallsSuccessful: number;
  apiCallsFailed: number;
  totalWizardTime: number; // milliseconds
  exitedAtStep?: WizardStep;
}

// All types and enums are already exported with their declarations above
// No need for additional export statement