/**
 * Backend Wizard TypeScript Interfaces
 * For Property Wizard API endpoints and data processing
 */

import { SFRData, PropertyAddress } from './propertyTypes';

// Property lookup request
export interface PropertyLookupRequest {
  address: string;
  includeComparables?: boolean;
  includeMarketData?: boolean;
  includeTaxData?: boolean;
  includeInsuranceEstimate?: boolean;
}

// Property lookup response
export interface PropertyLookupResponse {
  success: boolean;
  propertyDetails?: {
    address: {
      formatted: string;
      standardized: PropertyAddress;
      latitude?: number;
      longitude?: number;
    };
    
    // Property characteristics
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    lotSize?: number;
    propertyType?: string;
    
    // Financial data
    assessedValue?: number;
    marketValue?: number;
    annualPropertyTax?: number;
    actualPropertyTaxRate?: number; // Real tax rate calculated from RentCast data (percentage)
    
    // Data confidence and sources
    dataConfidence: Record<string, {
      score: number;
      source: string;
      lastUpdated: Date;
    }>;
  };
  
  // Market intelligence
  rentEstimate?: {
    monthlyRent: number;
    range: { low: number; high: number };
    confidence: number;
    marketPosition: 'Below Market' | 'At Market' | 'Above Market';
  };
  
  comparables?: Array<{
    address: string;
    distance: number;
    salePrice: number;
    saleDate: Date;
    sqft: number;
    bedrooms: number;
    bathrooms: number;
  }>;
  
  marketData?: {
    zipCode: string;
    medianRent: number;
    medianSalePrice: number;
    averageDaysOnMarket: number;
    priceToRentRatio: number;
    marketTrend: 'Rising' | 'Stable' | 'Declining';
  };
  
  insuranceEstimate?: {
    homeowners: number; // Annual cost
    landlord: number; // Annual cost
    confidence: number;
  };
  
  // API call metadata
  apiCalls: {
    successful: string[]; // Which APIs succeeded
    failed: string[]; // Which APIs failed
    cached: string[]; // Which data came from cache
  };
  
  errors?: string[];
}

// Smart defaults request
export interface SmartDefaultsRequest {
  zipCode: string;
  propertyType: 'SFR' | 'MF';
  propertyValue?: number;
  squareFootage?: number;
}

// Smart defaults response
export interface SmartDefaultsResponse {
  success: boolean;
  defaults: {
    // Financial defaults
    downPaymentPercentage: number;
    closingCostPercentage: number;
    currentMortgageRate: number;
    
    // Operating expenses (as percentages)
    managementFeePercentage: number;
    maintenanceReservePercentage: number;
    vacancyRatePercentage: number;
    
    // Regional cost factors
    propertyTaxRate: number; // % of property value
    insuranceRate: number; // % of property value
    
    // Long-term assumptions
    appreciationRate: number;
    rentGrowthRate: number;
    inflationRate: number;
    
    // Data sources and confidence
    dataSources: {
      economic: string; // e.g., "FRED"
      market: string; // e.g., "RentCast"
      regional: string; // e.g., "LocalMarketData"
    };
    
    confidence: Record<string, number>; // 0-100 for each default
    lastUpdated: Date;
  };
  
  regionalContext?: {
    marketType: 'Hot' | 'Balanced' | 'Cold';
    investmentTiming: 'Favorable' | 'Neutral' | 'Challenging';
    keyFactors: string[];
  };
  
  errors?: string[];
}

// Address validation request
export interface AddressValidationRequest {
  address: string;
  validateOnly?: boolean; // Don't lookup property details, just validate
}

// Address validation response
export interface AddressValidationResponse {
  success: boolean;
  isValid: boolean;
  standardizedAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    formattedAddress: string;
  };
  
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  suggestions?: Array<{
    address: string;
    confidence: number;
  }>;
  
  errors?: string[];
}

// Wizard data enrichment metadata
export interface WizardDataEnrichment {
  autoPopulatedFields: string[];
  apiSources: Record<string, string>; // field -> API source
  dataConfidence: Record<string, number>; // field -> confidence score
  manualOverrides: Record<string, any>; // field -> user override value
  enrichmentTimestamp: Date;
  apiCallsSummary: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
  };
}

// Enhanced SFR data with wizard metadata
export interface WizardEnhancedSFRData extends SFRData {
  wizardData?: {
    dataEnrichment: WizardDataEnrichment;
    userJourney: {
      stepCompletionTimes: number[]; // milliseconds per step
      totalWizardTime: number;
      fieldsManuallyModified: string[];
      apiFailures: string[];
    };
  };
}

// API integration status
export interface ApiIntegrationStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number; // milliseconds
  errorRate?: number; // percentage
  rateLimitRemaining?: number;
  lastChecked: Date;
}

// System health for wizard APIs
export interface WizardSystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  services: ApiIntegrationStatus[];
  cacheHitRate: number; // percentage
  averageResponseTime: number; // milliseconds
  lastUpdated: Date;
}

// Wizard analytics for monitoring
export interface WizardUsageAnalytics {
  period: string; // e.g., "2025-01-15"
  totalWizardSessions: number;
  completedSessions: number;
  abandonedAtStep: Record<string, number>; // step -> abandonment count
  averageCompletionTime: number; // minutes
  mostPopularOverrides: string[]; // fields users override most
  apiUsageStats: {
    totalCalls: number;
    costEstimate: number;
    errorRate: number;
  };
}

// All interfaces are already exported inline above