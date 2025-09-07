// Pipeline Deal Types

export const PropertyType = {
  SFR: 'SFR',
  MF: 'MF',
  CONDO: 'CONDO',
  TOWNHOUSE: 'TOWNHOUSE',
  APARTMENT: 'APARTMENT',
  COMMERCIAL_RETAIL: 'COMMERCIAL_RETAIL',
  COMMERCIAL_OFFICE: 'COMMERCIAL_OFFICE',
  COMMERCIAL_INDUSTRIAL: 'COMMERCIAL_INDUSTRIAL',
  COMMERCIAL_MIXED: 'COMMERCIAL_MIXED',
  SELF_STORAGE: 'SELF_STORAGE',
  MOBILE_HOME_PARK: 'MOBILE_HOME_PARK',
  LAND: 'LAND',
  OTHER: 'OTHER'
} as const;

export type PropertyType = typeof PropertyType[keyof typeof PropertyType];

export const PropertyStrategy = {
  BUY_HOLD: 'BUY_HOLD',
  BRRR: 'BRRR',
  FIX_FLIP: 'FIX_FLIP',
  WHOLESALE: 'WHOLESALE',
  HOUSE_HACK: 'HOUSE_HACK',
  VALUE_ADD: 'VALUE_ADD'
} as const;

export type PropertyStrategy = typeof PropertyStrategy[keyof typeof PropertyStrategy];

export const DealStage = {
  WATCHING: 'WATCHING',
  ANALYZING: 'ANALYZING',
  NEGOTIATING: 'NEGOTIATING',
  UNDER_CONTRACT: 'UNDER_CONTRACT',
  CLOSED: 'CLOSED',
  LOST: 'LOST'
} as const;

export type DealStage = typeof DealStage[keyof typeof DealStage];

export const DealSource = {
  MLS: 'MLS',
  AGENT: 'AGENT',
  DIRECT_MARKETING: 'DIRECT_MARKETING',
  ONLINE: 'ONLINE',
  REFERRAL: 'REFERRAL',
  COLD_CALLING: 'COLD_CALLING',
  OTHER: 'OTHER'
} as const;

export type DealSource = typeof DealSource[keyof typeof DealSource];

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface SourceInfo {
  channel: DealSource;
  referrer?: string;
  cost?: number;
  notes?: string;
}

export interface StageHistoryEntry {
  stage: DealStage;
  date: string;
  notes?: string;
  userId?: string;
}

export interface PriceHistoryEntry {
  price: number;
  date: string;
  source: 'USER' | 'AGENT' | 'API';
  notes?: string;
}

export interface QuickMetrics {
  dealQuality?: number;
  verdict?: 'BUY' | 'PASS' | 'NEGOTIATE' | 'CAUTION';
  monthlyCashFlow?: number;
  cashFlow?: number; // alias for compatibility
  monthlyIncome?: number;
  capRate?: number;
  cashOnCashReturn?: number;
  inputValues?: {
    monthlyRent: number;
    monthlyExpenses: number;
    downPayment: number;
    interestRate: number;
    loanTermYears: number;
  };
}

export interface PipelineDeal {
  _id: string;
  userId: string;
  dealName: string;
  propertyType: PropertyType;
  strategy: PropertyStrategy;
  currentStage: DealStage;
  address: PropertyAddress;
  askingPrice: number;
  propertyDetails?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    yearBuilt?: number;
    units?: number;
    [key: string]: any;
  };
  sourceInfo: SourceInfo;
  stageHistory: StageHistoryEntry[];
  analysisId?: string;
  analysisStatus: 'NOT_ANALYZED' | 'IN_PROGRESS' | 'COMPLETE';
  quickMetrics?: QuickMetrics;
  confidence?: {
    level: 1 | 2 | 3;
    lastUpdated: string;
    dataSource: 'MANUAL' | 'QUICK_CALC' | 'FULL_ANALYSIS' | 'PIPELINE' | 'PORTFOLIO';
    calculationMethod: 'NONE' | 'BASIC' | 'QUICK_METRICS' | 'FULL_SFR';
  };
  priceHistory: PriceHistoryEntry[];
  notes?: string;
  daysInCurrentStage?: number;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
}

export interface CreatePipelineDealRequest {
  dealName: string;
  propertyType: PropertyType;
  strategy?: PropertyStrategy;
  address: PropertyAddress;
  askingPrice: number;
  sourceInfo: {
    channel: DealSource;
    referrer?: string;
    cost?: number;
    notes?: string;
  };
  propertyDetails?: any;
  notes?: string;
}

export interface UpdatePipelineDealRequest {
  dealName?: string;
  askingPrice?: number;
  propertyDetails?: any;
  notes?: string;
  strategy?: PropertyStrategy;
  quickMetrics?: any; // Allow quick metrics updates
  analysisStatus?: 'NOT_ANALYZED' | 'IN_PROGRESS' | 'COMPLETE';
  analysisId?: string;
  confidence?: any; // Allow confidence updates
  [key: string]: any; // Allow any additional fields for full updates
}

export interface PipelineFilters {
  stage?: DealStage;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  source?: DealSource;
}

export interface KanbanData {
  [DealStage.WATCHING]: PipelineDeal[];
  [DealStage.ANALYZING]: PipelineDeal[];
  [DealStage.NEGOTIATING]: PipelineDeal[];
  [DealStage.UNDER_CONTRACT]: PipelineDeal[];
  [DealStage.CLOSED]: PipelineDeal[];
  [DealStage.LOST]: PipelineDeal[];
}

export interface PipelineAnalytics {
  stageDistribution: Array<{ _id: string; count: number }>;
  propertyTypeDistribution: Array<{ _id: string; count: number }>;
  sourceAnalysis: Array<{ _id: string; count: number }>;
  totalPipelineValue: number;
  avgDaysInStage: Array<{ _id: string; avgDays: number }>;
}