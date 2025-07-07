// Market Intelligence Data Types for Frontend
// Mirrors the backend types but adapted for frontend usage (dates as strings, etc.)

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
  marketPosition: 'Below Market' | 'At Market' | 'Above Market' | 'Unknown';
  confidence: number;
  pricePerSqft?: number;
  lastUpdated: string; // ISO date string
  dataSource: string;
}

export interface ComparableProperty {
  address: string;
  distance: number; // miles
  salePrice: number;
  saleDate: string; // ISO date string
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

export interface MarketTrendData {
  zipCode: string;
  city: string;
  state: string;
  medianRent: number;
  averageRent: number;
  rentGrowthRate: number; // annual percentage
  medianSalePrice: number;
  averageSalePrice: number;
  priceGrowthRate: number; // annual percentage
  daysOnMarket: number;
  inventoryLevel: 'Low' | 'Normal' | 'High';
  priceToRentRatio: number;
  seasonalTrend: string;
  sampleSize: {
    rentals: number;
    sales: number;
  };
  lastUpdated: string; // ISO date string
  dataSource: string;
}

export interface EconomicData {
  currentMortgageRate: number;
  mortgageRateTrend: 'Rising' | 'Falling' | 'Stable';
  mortgageRateChange: number; // percentage change
  inflationRate: number;
  unemploymentRate: number;
  housingIndex: number;
  housingIndexChange: number; // YoY percentage change
  economicGrowth: number;
  federalFundsRate: number;
  lastUpdated: string; // ISO date string
  dataSource: string;
}

export interface LocationData {
  address?: string;
  zipCode: string;
  city?: string;
  state?: string;
}

export interface MarketDataResponse {
  property: PropertyMarketData;
  comparables: ComparableProperty[];
  marketTrends: MarketTrendData;
  economicIndicators: EconomicData;
  location: LocationData;
  lastUpdated: string; // ISO date string
  dataSource: string[];
  cacheKey?: string;
}

export interface MarketInsight {
  category: 'Market Position' | 'Rental Market' | 'Economic Climate' | 'Comparable Analysis' | 'Investment Timing';
  insight: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
  confidence: number; // 0-100
  dataSource: string;
  metrics?: Record<string, any>;
  recommendation?: string;
}

export interface MarketSignals {
  interestRateSignal: number; // -1 to 1
  inflationSignal: number; // -1 to 1
  housingSupplySignal: number; // -1 to 1
  economicGrowthSignal: number; // -1 to 1
  overallSignal: number; // -1 to 1 (average of all signals)
}

export interface InvestmentTimingAnalysis {
  recommendation: 'Buy' | 'Hold' | 'Sell' | 'Caution';
  confidence: number; // 0-100
  reasoning: string[];
  marketCycle: 'Expansion' | 'Peak' | 'Contraction' | 'Recovery' | 'Unknown';
  timingScore: number; // 0-100
  riskFactors: string[];
  opportunities: string[];
  marketSignals: MarketSignals;
  nextReviewDate: string; // ISO date string
}

// UI-specific interfaces for display components
export interface MarketDataDisplayProps {
  marketData: MarketDataResponse;
  loading?: boolean;
  error?: string;
}

export interface MarketInsightsDisplayProps {
  insights: MarketInsight[];
  loading?: boolean;
}

export interface InvestmentTimingDisplayProps {
  timingAnalysis: InvestmentTimingAnalysis;
  loading?: boolean;
}

export interface MarketIntelligenceTabProps {
  marketData?: MarketDataResponse;
  marketInsights?: MarketInsight[];
  investmentTiming?: InvestmentTimingAnalysis;
  loading?: boolean;
  error?: string;
}

// Utility types for market data processing
export type MarketDataStatus = 'loading' | 'success' | 'error' | 'idle';

export interface MarketDataState {
  data: MarketDataResponse | null;
  insights: MarketInsight[];
  timing: InvestmentTimingAnalysis | null;
  status: MarketDataStatus;
  error: string | null;
  lastUpdated: string | null;
}

// Chart data interfaces for market visualization
export interface MarketTrendChartData {
  period: string;
  rentGrowth: number;
  priceGrowth: number;
  daysOnMarket: number;
}

export interface ComparableChartData {
  address: string;
  price: number;
  pricePerSqft: number;
  distance: number;
  daysOnMarket: number;
}

export interface EconomicIndicatorChartData {
  indicator: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'positive' | 'negative' | 'neutral';
}