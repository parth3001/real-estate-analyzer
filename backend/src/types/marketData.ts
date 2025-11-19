/**
 * Market Data Type Definitions
 * 
 * Comprehensive interfaces for RentCast API, FRED API, and market intelligence
 */

// ============================================================================
// RentCast API Types
// ============================================================================

export interface RentcastPropertyResponse {
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  propertyType: string;
  rentEstimate: number;
  rentEstimateRange: {
    min: number;
    max: number;
  };
  confidence: number;
  lastUpdated: string;
}

// Enhanced RentCast Property Details Response (from /properties endpoint)
export interface RentcastPropertyDetailsResponse {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  // Additional property characteristics
  stories?: number;
  parkingSpaces?: number;
  garage?: boolean;
  pool?: boolean;
  ac?: boolean;
  heating?: string;
  cooling?: string;
  flooring?: string;
  roofType?: string;
  exteriorWalls?: string;
  fireplace?: boolean;
  basement?: boolean;
  // Market data
  lastSalePrice?: number;
  lastSaleDate?: string;
  pricePerSquareFoot?: number;
  taxAssessedValue?: number;
  annualTaxAmount?: number;
  // Estimates
  rentEstimate?: number;
  rentEstimateRange?: {
    min: number;
    max: number;
  };
  valueEstimate?: number;
  valueEstimateRange?: {
    min: number;
    max: number;
  };
  // Metadata
  confidence?: number;
  lastUpdated?: string;
  dataSource?: string;
}

// Enhanced Property Data for internal use
export interface EnhancedPropertyData {
  // Address information
  address: {
    formatted: string;
    standardized: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      county: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  // Property characteristics
  propertyDetails: {
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    lotSize?: number;
    yearBuilt?: number;
    stories?: number;
    parkingSpaces?: number;
    hasGarage?: boolean;
    hasPool?: boolean;
    hasAC?: boolean;
    hasFireplace?: boolean;
    hasBasement?: boolean;
    heating?: string;
    cooling?: string;
    flooring?: string;
    roofType?: string;
    exteriorWalls?: string;
  };
  // Financial data
  financialData: {
    lastSalePrice?: number;
    lastSaleDate?: string;
    pricePerSquareFoot?: number;
    taxAssessedValue?: number;
    annualTaxAmount?: number;
    rentEstimate?: number;
    rentEstimateRange?: {
      min: number;
      max: number;
    };
    valueEstimate?: number;
    valueEstimateRange?: {
      min: number;
      max: number;
    };
  };
  // Data quality
  dataQuality: {
    confidence: number;
    lastUpdated: Date;
    dataSource: string;
    completeness: number; // 0-100, percentage of fields populated
  };
}

export interface RentcastComparablesResponse {
  subject: {
    address: string;
    latitude: number;
    longitude: number;
  };
  comparables: Array<{
    address: string;
    latitude: number;
    longitude: number;
    distance: number;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    lotSize?: number;
    yearBuilt?: number;
    propertyType: string;
    lastSalePrice: number;
    lastSaleDate: string;
    daysOnMarket?: number;
    rentEstimate?: number;
  }>;
}

export interface RentcastMarketDataResponse {
  zipCode: string;
  city: string;
  state: string;
  rentData: {
    medianRent: number;
    averageRent: number;
    rentGrowthRate: number; // 12-month percentage
    sampleSize: number;
  };
  salesData: {
    medianSalePrice: number;
    averageSalePrice: number;
    priceGrowthRate: number; // 12-month percentage
    averageDaysOnMarket: number;
    sampleSize: number;
  };
  lastUpdated: string;
}

// ============================================================================
// FRED API Types
// ============================================================================

export interface FredSeriesResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: Array<{
    realtime_start: string;
    realtime_end: string;
    date: string;
    value: string;
  }>;
}

export interface FredSeriesInfo {
  id: string;
  realtime_start: string;
  realtime_end: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  frequency_short: string;
  units: string;
  units_short: string;
  seasonal_adjustment: string;
  seasonal_adjustment_short: string;
  last_updated: string;
  popularity: number;
  notes: string;
}

// ============================================================================
// Internal Market Data Types
// ============================================================================

export interface ComparableProperty {
  address: string;
  distance: number; // miles from subject property
  salePrice: number;
  saleDate: Date;
  pricePerSqft: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  daysOnMarket: number;
  propertyType: string;
  rentEstimate?: number;
  latitude?: number;
  longitude?: number;
  yearBuilt?: number;
  lotSize?: number;
}

export interface PropertyMarketData {
  rentEstimate: number;
  rentRange: { 
    low: number; 
    high: number; 
  };
  valueEstimate?: number;
  valueRange?: { 
    low: number; 
    high: number; 
  };
  capRateEstimate?: number;
  marketPosition: 'Below Market' | 'At Market' | 'Above Market';
  confidence: number; // 0-100
  pricePerSqft?: number;
  lastUpdated: Date;
  dataSource: string;
}

export interface MarketTrendData {
  zipCode: string;
  city: string;
  state: string;
  medianRent: number;
  averageRent: number;
  rentGrowthRate: number; // 12-month percentage
  medianSalePrice: number;
  averageSalePrice: number;
  priceGrowthRate: number; // 12-month percentage
  daysOnMarket: number;
  inventoryLevel: 'Low' | 'Normal' | 'High';
  priceToRentRatio: number;
  seasonalTrend: string;
  sampleSize: {
    rentals: number;
    sales: number;
  };
  lastUpdated: Date;
  dataSource: string;
}

export interface EconomicData {
  currentMortgageRate: number;
  mortgageRateTrend: 'Rising' | 'Falling' | 'Stable';
  mortgageRateChange: number; // percentage points change
  inflationRate: number;
  unemploymentRate: number;
  housingIndex: number; // S&P Case-Shiller or similar
  housingIndexChange: number; // percentage change
  economicGrowth: number; // GDP growth rate
  consumerConfidence?: number;
  federalFundsRate: number;
  lastUpdated: Date;
  dataSource: string;
}

export interface MarketDataResponse {
  property: PropertyMarketData;
  comparables: ComparableProperty[];
  marketTrends: MarketTrendData;
  economicIndicators: EconomicData;
  location: {
    address: string;
    zipCode: string;
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  lastUpdated: Date;
  dataSource: string[];
  cacheKey?: string;
}

export interface MarketInsight {
  category: 'Market Position' | 'Rental Market' | 'Economic Climate' | 'Investment Timing' | 'Comparable Analysis' | 'Market Intelligence';
  insight: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
  confidence: number; // 0-100
  dataSource: string;
  metrics?: {
    [key: string]: number | string;
  };
  recommendation?: string;
}

// Market Intelligence Types for Phase 2A
export interface MarketTierData {
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  focusType: 'appreciation' | 'balanced' | 'cashflow';
  thresholds: {
    rentToPriceMinimum: number;
    capRatePremium: number;
    appreciationExpectation: number;
    liquidityRisk: number;
    managementComplexity: 'low' | 'medium' | 'high';
  };
}

export interface MarketIntelligenceData {
  marketTier: MarketTierData;
  marketContext: {
    cityName: string;
    stateName: string;
    marketMedianCapRate?: number;
    marketMedianRent?: number;
    marketMedianPrice?: number;
  };
  relativePerformance: {
    capRateVsMarket: number;
    rentVsMarket: number;
    priceVsMarket: number;
  };
  fairMarketValue: {
    fairValue: number;
    targetCapRate: number;
    reasoning: string;
    overpriced?: boolean;
    overpricedBy?: number;
  };
  marketInsights: string[];
  comparableAnalysis?: {
    comparableProperties: number;
    averageCapRate?: number;
    averageRent?: number;
    averagePrice?: number;
  };
}

export interface InvestmentTimingAnalysis {
  recommendation: 'Buy' | 'Hold' | 'Wait' | 'Caution';
  confidence: number; // 0-100
  reasoning: string[];
  marketCycle: 'Expansion' | 'Peak' | 'Contraction' | 'Recovery' | 'Unknown';
  timingScore: number; // 0-100
  riskFactors: string[];
  opportunities: string[];
  marketSignals: {
    interestRateSignal: number; // -1 to 1
    inflationSignal: number; // -1 to 1
    housingSupplySignal: number; // -1 to 1
    economicGrowthSignal: number; // -1 to 1
    overallSignal: number; // -1 to 1
  };
  nextReviewDate: Date;
}

// ============================================================================
// Service Configuration Types
// ============================================================================

export interface MarketDataConfig {
  rentcast: {
    apiKey: string;
    baseUrl: string;
    rateLimitPerHour: number;
    timeout: number;
  };
  fred: {
    apiKey?: string;
    baseUrl: string;
    rateLimitPerHour: number;
    timeout: number;
  };
  cache: {
    ttlMinutes: number;
    maxSize: number;
  };
  features: {
    enableMarketData: boolean;
    enableInvestmentTiming: boolean;
    enableComparableProperties: boolean;
  };
}

export class MarketDataError extends Error {
  service: string;
  statusCode?: number;
  retryable: boolean;
  originalError?: any;
  
  constructor(message: string) {
    super(message);
    this.name = 'MarketDataError';
    this.service = '';
    this.retryable = false;
  }
}

// ============================================================================
// Query Parameters and Request Types
// ============================================================================

export interface MarketDataQuery {
  address: string;
  zipCode: string;
  city: string;
  state: string;
  propertyType?: 'SFR' | 'Condo' | 'Townhouse' | 'Multi-Family';
  radius?: number; // miles for comparable search
  maxComparables?: number;
  includeEconomicData?: boolean;
  forceRefresh?: boolean;
}

export interface RentcastQuery {
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  radius?: number;
  limit?: number;
}

export interface FredQuery {
  seriesId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sort_order?: 'asc' | 'desc';
  transformation?: 'lin' | 'chg' | 'ch1' | 'pch' | 'pc1' | 'pca' | 'cch' | 'cca' | 'log';
}

// ============================================================================
// FRED Series IDs for Common Economic Indicators
// ============================================================================

export const FRED_SERIES_IDS = {
  // Mortgage Rates
  MORTGAGE_30_YEAR: 'MORTGAGE30US',
  MORTGAGE_15_YEAR: 'MORTGAGE15US',
  MORTGAGE_5_1_ARM: 'MORTGAGE5US',
  
  // Housing Indices
  CASE_SHILLER_20_CITY: 'SPCS20RSA',
  CASE_SHILLER_NATIONAL: 'CSUSHPINSA',
  HOUSING_PRICE_INDEX: 'USSTHPI',
  
  // Economic Indicators
  INFLATION_CPI: 'CPIAUCSL',
  UNEMPLOYMENT_RATE: 'UNRATE',
  GDP_GROWTH: 'GDP',
  FEDERAL_FUNDS_RATE: 'FEDFUNDS',
  CONSUMER_CONFIDENCE: 'UMCSENT',
  
  // Housing Market Indicators
  HOUSING_STARTS: 'HOUST',
  BUILDING_PERMITS: 'PERMIT',
  NEW_HOME_SALES: 'HSN1F',
  EXISTING_HOME_SALES: 'EXHOSLUSM495S',
  MONTHS_SUPPLY: 'MSACSR',
  
  // Real Estate Investment
  REIT_INDEX: 'RMZ',
  COMMERCIAL_REAL_ESTATE: 'WILL5000INDFC'
} as const;

export type FredSeriesId = typeof FRED_SERIES_IDS[keyof typeof FRED_SERIES_IDS];

// ============================================================================
// Cache and Performance Types
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface ApiRateLimitInfo {
  service: string;
  remaining: number;
  resetTime: number;
  limit: number;
}

export interface MarketDataMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  lastRequest: Date;
  rateLimitStatus: ApiRateLimitInfo[];
}

// ============================================================================
// Multi-Family Property Types (Story 3.1)
// ============================================================================

/**
 * Unit configuration for MF rent estimate request
 */
export interface MFUnitConfig {
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
}

/**
 * Multi-Family Unit Rent Estimate
 * Returned by RentCast API for unit-level MF rent estimates
 */
export interface MFUnitRentEstimate {
  address: string;
  unitConfig: MFUnitConfig;
  rentEstimate: number;
  rentRange: {
    low: number;
    high: number;
  };
  confidence: {
    score: number; // 0-100
    source: string;
    lastUpdated: Date;
    comparableCount: number;
  };
  comparables: MFComparable[];
  dataSource: string;
  timestamp: Date;
}

/**
 * Multi-Family Comparable Property
 * Similar rental units used for rent estimation
 */
export interface MFComparable {
  address: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  rent: number;
  distance: number; // Miles from subject property
  correlation: number; // 0-1 similarity score
  status: string; // "Active", "Leased", etc.
}

/**
 * Request parameters for MF unit rent estimate
 */
export interface MFUnitRentEstimateParams {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
}