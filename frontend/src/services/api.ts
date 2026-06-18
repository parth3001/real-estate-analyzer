import axios from 'axios';
import type { PropertyData } from '../types/property';
import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  TokenRefreshResponse,
  ProfileUpdateData,
  PasswordChangeData
} from '../types/auth';
import { TOKEN_STORAGE_KEYS } from '../types/auth';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
export const tokenUtils = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
  },
  
  setAccessToken: (token: string): void => {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, token);
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  setRefreshToken: (token: string): void => {
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  
  removeTokens: (): void => {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.USER_DATA);
  },
  
  setUserData: (user: any): void => {
    localStorage.setItem(TOKEN_STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },
  
  getUserData: (): any | null => {
    const userData = localStorage.getItem(TOKEN_STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenUtils.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenUtils.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          tokenUtils.setAccessToken(accessToken);
          tokenUtils.setRefreshToken(newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          tokenUtils.removeTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        tokenUtils.removeTokens();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  message?: string;
}

/**
 * LicenseStatusWire — wire shape returned by GET /api/deals/:id/license
 * (Day 10, 2026-05-18).
 *
 * Drives the LicenseStatusBadge UX on SavedDealHero. Four states:
 *   - 'none'     — no license has been created (free-tier flow)
 *   - 'active'   — license live; expiresAt + budget fields populated
 *   - 'expired'  — past license, read-only state (currently treated
 *                  same as 'none' on the badge surface — future surfaces
 *                  like /account history will differentiate)
 *   - 'refunded' — past license refunded (same as expired for badge)
 */
export type LicenseStatusWire =
  | { status: 'none' }
  | {
      status: 'active' | 'expired' | 'refunded';
      licenseId: string;
      expiresAt: string;
      costBudgetCentsStart: number;
      costSpentCents: number;
      pricePaidCents: number;
      purchasedAt: string;
    };

/**
 * CritiqueWire — wire shape returned by GET /api/deals/:id/critique
 * (T1, 2026-05-18). One entry per persona; pre-T1 deals return [].
 *
 * Mirrors backend CritiquePayload subset — only fields the frontend
 * CritiqueCard renders, plus `timestamp` for ordering.
 */
export interface CritiqueWire {
  persona: 'optimistic_flipper' | 'skeptical_cpa';
  agreementWithOriginal: boolean;
  severityScore: number;
  divergenceReasons: string[];
  alternativeAssumptions: Array<{
    fieldPath: string;
    suggestedValue: number | string | boolean;
    reasoning: string;
  }>;
  triggerType:
    | 'auto_buy_band'
    | 'auto_on_save'
    | 'manual_request'
    | 'batch_seeding';
  timestamp: string;
}

// Property-related API calls
// ===== Scenario workspace wire types (Task #8, 2026-05-21) =====

export interface ScenarioFactorScores {
  cashFlow?: number;
  irr?: number;
  marketStrength?: number;
  debtStructure?: number;
  exitStrategy?: number;
  capRate?: number;
  propertyRisk?: number;
}

/** One changed input between a scenario and the baseline. */
export interface ScenarioDeltaWire {
  field: string;
  label: string;
  unit: 'currency' | 'percent' | 'years' | 'months' | 'number';
  baseline?: number;
  scenario?: number;
  formattedBaseline: string;
  formattedScenario: string;
  direction: 'up' | 'down' | 'changed';
}

/** One row in the scenario comparison — a substrate-derived what-if. */
export interface ScenarioComparisonRowWire {
  decisionEventId: string;
  createdAt: string;
  isBaseline: boolean;
  isCurrent: boolean;
  dealQuality: number;
  factorScores: ScenarioFactorScores;
  deltas: ScenarioDeltaWire[];
  changedCount: number;
}

/** Full analysis for one selected scenario (lazy-loaded for Details). */
export interface ScenarioDetailWire {
  decisionEventId: string;
  createdAt: string;
  dealQuality: number;
  factorScores: ScenarioFactorScores;
  walkAwayPrice?: number;
  propertyData?: any;
  /** Resolved assumptions for this scenario (vacancy, hold period, etc.). */
  assumptions?: Record<string, any>;
  monthlyAnalysis?: any;
  longTermAnalysis?: any;
  metrics?: any;
  /**
   * Market snapshot frozen at analysis time (Task #19). Powers the workspace
   * Market + Comparables sections. Shape mirrors backend MarketDataResponse;
   * loosely typed here (substrate stores it as Mixed) but the fields the UI
   * reads are declared on ScenarioMarketDataWire for safety.
   */
  marketData?: ScenarioMarketDataWire;
}

/** Subset of MarketDataResponse the workspace Market/Comparables sections read. */
export interface ScenarioComparableWire {
  address?: string;
  distance?: number;
  salePrice?: number;
  pricePerSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  daysOnMarket?: number;
  yearBuilt?: number;
}
export interface ScenarioMarketDataWire {
  comparables?: ScenarioComparableWire[];
  marketTrends?: {
    medianRent?: number;
    averageRent?: number;
    rentGrowthRate?: number;
    medianSalePrice?: number;
    priceGrowthRate?: number;
    daysOnMarket?: number;
    inventoryLevel?: string;
    priceToRentRatio?: number;
  };
  economicIndicators?: {
    currentMortgageRate?: number;
    mortgageRateTrend?: string;
    inflationRate?: number;
    unemploymentRate?: number;
  };
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export interface SensitivityPointWire {
  delta: number;
  label: string;
  dealQuality: number;
}
export interface SensitivityVariableWire {
  field: string;
  label: string;
  unit: 'currency' | 'percent' | 'years';
  baseValue: number;
  points: SensitivityPointWire[];
}
export interface StackedPerturbationWire {
  field: string;
  label: string;
  from: number;
  to: number;
}
/** Sensitivity report. `supported:false` for non-SFR (MF is a follow-up). */
export interface SensitivityReportWire {
  supported: boolean;
  reason?: string;
  baseDealQuality?: number;
  variables?: SensitivityVariableWire[];
  stackedDownside?: {
    label: string;
    perturbations: StackedPerturbationWire[];
    dealQuality: number;
  };
}

export const propertyApi = {
  // Get all properties
  getAllProperties: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await api.get('/deals');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Get a property by ID
  getProperty: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get(`/deals/${id}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },

  /**
   * Task #61 (2026-06-18): export a saved deal as PDF.
   *   mode: 'download' → returns the raw Blob the caller hands to a
   *                       browser download trigger.
   *   mode: 'email'    → server emails the PDF to the authenticated
   *                       user's address; resolves to undefined.
   */
  exportPdf: async (
    id: string,
    opts: { mode: 'download' | 'email'; email?: string }
  ): Promise<Blob | void> => {
    if (opts.mode === 'email') {
      await api.post(`/deals/${id}/export-pdf`, opts);
      return;
    }
    const response = await api.post(`/deals/${id}/export-pdf`, opts, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  /**
   * Get the adversarial critique tied to this deal's latest decision
   * (T1, 2026-05-18). Returns { critiques: [...], pending: boolean }.
   *
   *   critiques: array of CritiqueWire (0–2 entries, one per persona)
   *   pending:   true when the Deal has a substrate link but no events
   *              yet (background job still running, or skipped due to
   *              cost cap). Frontend treats pending=true as "show
   *              'Adversarial review in progress…' placeholder."
   *
   * Returns { critiques: [], pending: false } gracefully when the Deal
   * predates T1 (no latestDecisionEventId). Caller-side: render no
   * section in that case.
   */
  getDealCritique: async (
    dealId: string
  ): Promise<ApiResponse<{ critiques: CritiqueWire[]; pending: boolean }>> => {
    try {
      const response = await api.get(`/deals/${dealId}/critique`);
      return { data: response.data, status: response.status };
    } catch (error) {
      console.error('Error fetching deal critique:', error);
      throw error;
    }
  },

  /**
   * Scenario comparison (Task #8, 2026-05-21) — every substrate-derived
   * what-if for this deal's property, with score + 7 factors + a
   * field-agnostic diff vs the baseline. Backs the scenario list + compare.
   */
  getScenarioComparison: async (
    dealId: string
  ): Promise<ApiResponse<{ scenarios: ScenarioComparisonRowWire[] }>> => {
    try {
      const response = await api.get(`/deals/${dealId}/scenario-comparison`);
      return { data: response.data, status: response.status };
    } catch (error) {
      console.error('Error fetching scenario comparison:', error);
      throw error;
    }
  },

  /**
   * Full analysis for one selected scenario — lazy-loaded for the Details
   * sections when the user selects a scenario row.
   */
  getScenarioDetail: async (
    dealId: string,
    decisionEventId: string
  ): Promise<ApiResponse<ScenarioDetailWire>> => {
    try {
      const response = await api.get(
        `/deals/${dealId}/scenario-detail/${decisionEventId}`
      );
      return { data: response.data, status: response.status };
    } catch (error) {
      console.error('Error fetching scenario detail:', error);
      throw error;
    }
  },

  /**
   * Real sensitivity for a scenario — single-variable curves + the stacked
   * "realistic downside" preset. LLM-free recompute. `supported:false`
   * for non-SFR.
   */
  getScenarioSensitivity: async (
    dealId: string,
    decisionEventId: string
  ): Promise<ApiResponse<SensitivityReportWire>> => {
    try {
      const response = await api.get(
        `/deals/${dealId}/scenario-sensitivity/${decisionEventId}`
      );
      return { data: response.data, status: response.status };
    } catch (error) {
      console.error('Error fetching scenario sensitivity:', error);
      throw error;
    }
  },

  /**
   * Get the user's license status for this deal's property (Day 10).
   * Returns a discriminated union — `status` tells the consumer which
   * fields are populated. Used by LicenseStatusBadge on SavedDealHero.
   */
  getDealLicense: async (
    dealId: string
  ): Promise<ApiResponse<LicenseStatusWire>> => {
    try {
      const response = await api.get(`/deals/${dealId}/license`);
      return { data: response.data, status: response.status };
    } catch (error) {
      console.error('Error fetching deal license:', error);
      throw error;
    }
  },

  /**
   * Dev-mode license seed (Day 10). POSTs to seed-license endpoint;
   * backend rejects with 403 if ENABLE_DEV_LICENSE_SEED is not 'true'.
   * Returns 409 if a license already exists.
   *
   * NOT for production use. Only wired into a hidden "Activate test
   * license" button in SavedDealHero when the badge shows 'none'.
   */
  seedDealLicense: async (
    dealId: string
  ): Promise<ApiResponse<{ licenseId: string; seeded: boolean }>> => {
    const response = await api.post(`/deals/${dealId}/seed-license`);
    return { data: response.data, status: response.status };
  },

  // Create or save a property
  saveProperty: async (propertyData: PropertyData): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/deals', propertyData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  },

  // Create a property (alias for saveProperty)
  createProperty: async (propertyData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/deals', propertyData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },

  // Update a property
  updateProperty: async (id: string, propertyData: PropertyData): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put(`/deals/${id}`, propertyData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  // Delete a property
  deleteProperty: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete(`/deals/${id}`);
      
      return {
        data: response.data || {},
        status: response.status,
      };
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },

  // Analyze a property (traditional 76+ second analysis)
  analyzeProperty: async (propertyData: PropertyData): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/deals/analyze', propertyData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error analyzing property:', error);
      throw error;
    }
  },

  // Analyze property anonymously (no auth required)
  // Used by public calculators (BRRRR, Buy & Hold)
  analyzeAnonymous: async (propertyData: Partial<PropertyData>): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/deals/analyze-anonymous', propertyData);
      return {
        data: {
          success: true,
          analysis: response.data.analysis,
          isAnonymous: true,
          message: response.data.message || 'Analysis complete'
        },
        status: response.status,
      };
    } catch (error) {
      console.error('Anonymous analysis failed:', error);
      throw error;
    }
  },

  // NEW: Fast AI Predictions (3-4 seconds vs 76+ seconds)
  getQuickPredictions: async (propertyData: PropertyData): Promise<ApiResponse<{
    predictions: {
      marketTiming: any;
      rentGrowth: any;
      riskAssessment: any;
      exitStrategy: any;
      generatedAt: string;
      totalTime: number;
      failedPredictions: string[];
    };
    basicInsights: {
      summary: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      investmentScore: number;
      scoreBreakdown?: any;
    };
    quickAnalysis: {
      keyMetrics: any;
      monthlyAnalysis: any;
    };
    performance: {
      totalTime: string;
      improvement: string;
    };
  }>> => {
    try {
      const response = await api.post('/deals/quick-predictions', propertyData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error getting quick predictions:', error);
      throw error;
    }
  },

  // Get sample SFR data
  getSampleSFR: async (): Promise<ApiResponse<PropertyData>> => {
    try {
      const response = await api.get('/deals/sample-sfr');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          data: {} as PropertyData,
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      return {
        data: {} as PropertyData,
        status: 500,
        message: 'An unknown error occurred',
      };
    }
  },

  // Get sample MF data
  getSampleMF: async (): Promise<ApiResponse<PropertyData>> => {
    try {
      const response = await api.get('/deals/sample-mf');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          data: {} as PropertyData,
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      return {
        data: {} as PropertyData,
        status: 500,
        message: 'An unknown error occurred',
      };
    }
  },

  // Quick calculations for interactive analysis (< 50ms response time)
  quickCalculate: async (propertyData: PropertyData): Promise<ApiResponse<{
    monthlyAnalysis: {
      income: { gross: number; effective: number };
      expenses: { 
        operating: number; 
        debt: number; 
        total: number;
        breakdown: any;
      };
      cashFlow: number;
    };
    keyMetrics: {
      noi: number;
      capRate: number;
      cashOnCashReturn: number;
      dscr: number;
      totalInvestment: number;
    };
    calculationTime: number;
    performanceMetrics?: {
      calculationTime: number;
      totalResponseTime: number;
      targetMs: number;
    };
  }>> => {
    try {
      const response = await api.post('/quick/quick-calculate', propertyData);
      return {
        data: response.data.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error with quick calculation:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: {
            monthlyAnalysis: {
              income: { gross: 0, effective: 0 },
              expenses: { operating: 0, debt: 0, total: 0, breakdown: {} },
              cashFlow: 0
            },
            keyMetrics: {
              noi: 0,
              capRate: 0,
              cashOnCashReturn: 0,
              dscr: 0,
              totalInvestment: 0
            },
            calculationTime: 0
          },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },
};

// Wizard-specific API interfaces
export interface WizardPropertyLookupRequest {
  address: string;
  includeComparables?: boolean;
  includeMarketData?: boolean;
  includeTaxData?: boolean;
  includeInsuranceEstimate?: boolean;
}

export interface WizardPropertyLookupResponse {
  success: boolean;
  propertyDetails?: {
    address: {
      formatted: string;
      standardized: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        formattedAddress: string;
      };
      latitude?: number;
      longitude?: number;
    };
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    propertyType?: string;
    marketValue?: number;
    // Multi-family specific properties
    totalUnits?: number;
    totalSqft?: number;
    buildingType?: string;
    dataConfidence: Record<string, {
      score: number;
      source: string;
      lastUpdated: Date;
    }>;
  };
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
  apiCalls: {
    successful: string[];
    failed: string[];
    cached: string[];
  };
  errors?: string[];
}

export interface WizardSmartDefaultsRequest {
  zipCode: string;
  propertyType: 'SFR' | 'MF';
  propertyValue?: number;
  squareFootage?: number;
}

export interface WizardSmartDefaultsResponse {
  success: boolean;
  defaults: {
    downPaymentPercentage: number;
    closingCostPercentage: number;
    currentMortgageRate: number;
    managementFeePercentage: number;
    maintenanceReservePercentage: number;
    vacancyRatePercentage: number;
    propertyTaxRate: number;
    insuranceRate: number;
    appreciationRate: number;
    rentGrowthRate: number;
    inflationRate: number;
    dataSources: {
      economic: string;
      market: string;
      regional: string;
    };
    confidence: Record<string, number>;
    lastUpdated: Date;
  };
  regionalContext?: {
    marketType: 'Hot' | 'Balanced' | 'Cold';
    investmentTiming: 'Favorable' | 'Neutral' | 'Challenging';
    keyFactors: string[];
  };
  errors?: string[];
}

// Property Wizard API methods
export const wizardApi = {
  // Look up property details by address
  lookupProperty: async (request: WizardPropertyLookupRequest): Promise<ApiResponse<WizardPropertyLookupResponse>> => {
    try {
      console.log('Wizard API: Looking up property for address:', request.address);
      
      const response = await api.post('/wizard/property-lookup', request);
      
      console.log('Wizard API: Property lookup response:', {
        success: response.data.success,
        hasPropertyDetails: !!response.data.propertyDetails,
        hasRentEstimate: !!response.data.rentEstimate,
        apiCallsSuccessful: response.data.apiCalls?.successful?.length || 0,
        apiCallsCached: response.data.apiCalls?.cached?.length || 0
      });
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Wizard API: Property lookup failed:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: {
            success: false,
            apiCalls: { successful: [], failed: ['PropertyLookup'], cached: [] },
            errors: [error.response?.data?.error || error.message]
          },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Get smart defaults based on location
  getSmartDefaults: async (request: WizardSmartDefaultsRequest): Promise<ApiResponse<WizardSmartDefaultsResponse>> => {
    try {
      console.log('Wizard API: Getting smart defaults for:', request.zipCode, request.propertyType);
      
      const response = await api.post('/wizard/smart-defaults', request);
      
      console.log('Wizard API: Smart defaults response:', {
        success: response.data.success,
        mortgageRate: response.data.defaults?.currentMortgageRate,
        economicSource: response.data.defaults?.dataSources?.economic,
        marketType: response.data.regionalContext?.marketType
      });
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Wizard API: Smart defaults failed:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: {
            success: false,
            defaults: {
              downPaymentPercentage: 25,
              closingCostPercentage: 2.5,
              currentMortgageRate: 7.5,
              managementFeePercentage: 8,
              maintenanceReservePercentage: 5,
              vacancyRatePercentage: 5,
              propertyTaxRate: 1.2,
              insuranceRate: 0.7,
              appreciationRate: 3,
              rentGrowthRate: 3,
              inflationRate: 2.5,
              dataSources: { economic: 'defaults', market: 'defaults', regional: 'defaults' },
              confidence: { economic: 50, market: 50, regional: 50 },
              lastUpdated: new Date()
            },
            errors: [error.response?.data?.error || error.message]
          },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Validate address format
  validateAddress: async (address: string): Promise<ApiResponse<{
    success: boolean;
    isValid: boolean;
    standardizedAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      formattedAddress: string;
    };
    suggestions?: Array<{ address: string; confidence: number }>;
    errors?: string[];
  }>> => {
    try {
      console.log('Wizard API: Validating address:', address);
      
      const response = await api.post('/wizard/validate-address', {
        address,
        validateOnly: true
      });
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Wizard API: Address validation failed:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: {
            success: false,
            isValid: false,
            errors: [error.response?.data?.error || error.message]
          },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Analyze property using wizard data
  analyzeProperty: async (wizardData: any): Promise<ApiResponse<any>> => {
    try {
      console.log('Wizard API: Analyzing property with wizard data:', {
        hasPropertyData: !!wizardData.propertyData,
        monthlyRent: wizardData.propertyData?.monthlyRent,
        maintenanceReservePercentage: wizardData.propertyData?.maintenanceReservePercentage,
        vacancyRate: wizardData.propertyData?.vacancyRate,
        insuranceRate: wizardData.propertyData?.insuranceRate
      });
      
      const response = await api.post('/wizard/analyze', wizardData);
      
      console.log('Wizard API: Analysis response received:', {
        success: response.data.success || response.status === 200,
        hasAnalysis: !!response.data.analysis,
        maintenanceCost: response.data.analysis?.longTermAnalysis?.projections?.[0]?.maintenance
      });
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Wizard API: Analysis failed:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: {
            success: false,
            error: error.response?.data?.error || error.message
          },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Check wizard service health
  getHealth: async (): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    services: Record<string, { status: string; message: string }>;
    version: string;
  }>> => {
    try {
      const response = await api.get('/wizard/health');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Wizard API: Health check failed:', error);
      throw error;
    }
  },

  // Generate smart rent estimate
  getRentEstimate: async (data: {
    address: string;
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    zipCode?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    data?: {
      value: number;
      confidence: {
        score: number;
        source: string;
        reliability: 'high' | 'medium' | 'low';
      };
      range: {
        low: number;
        high: number;
      };
      breakdown: {
        baseRentPerSqft: number;
        adjustments: {
          bedrooms: number;
          yearBuilt: number;
          marketFactor: number;
        };
        capByValueRule: number;
      };
    };
    error?: string;
  }>> => {
    try {
      console.log('Wizard API: Getting rent estimate for:', data.address);
      
      const response = await api.post('/wizard/rent-estimate', data);
      
      console.log('Wizard API: Rent estimate response:', {
        success: response.data.success,
        estimatedRent: response.data.data?.value,
        confidence: response.data.data?.confidence?.score,
        source: response.data.data?.confidence?.source
      });
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Wizard API: Rent estimate failed:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: {
            success: false,
            error: error.response?.data?.error || error.message
          },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Generate smart property tax estimate
  getPropertyTaxEstimate: async (data: {
    address: string;
    purchasePrice: number;
    zipCode?: string;
    county?: string;
    state?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    data?: {
      annualTaxAmount: number;
      effectiveTaxRate: number;
      confidence: {
        score: number;
        source: string;
        reliability: 'high' | 'medium' | 'low';
        factors: string[];
      };
      breakdown: {
        purchasePrice: number;
        estimatedAssessmentRatio: number;
        estimatedAssessedValue: number;
        appliedTaxRate: number;
      };
      sourceData?: {
        address: string;
        taxAssessedValue: number;
        annualTaxAmount: number;
        calculatedRate: number;
      };
    };
    error?: string;
  }>> => {
    try {
      console.log('Wizard API: Getting property tax estimate for:', data.address);
      
      const response = await api.post('/wizard/property-tax-estimate', data);
      
      console.log('Wizard API: Property tax estimate response:', {
        success: response.data.success,
        annualTax: response.data.data?.annualTaxAmount,
        taxRate: response.data.data?.effectiveTaxRate,
        confidence: response.data.data?.confidence?.score,
        source: response.data.data?.confidence?.source
      });
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Wizard API: Property tax estimate failed:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: {
            success: false,
            error: error.response?.data?.error || error.message
          },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  }
};

// Authentication API methods
export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await api.post('/auth/register', data);
      
      // Store tokens and user data
      const { user, accessToken, refreshToken } = response.data;
      tokenUtils.setAccessToken(accessToken);
      tokenUtils.setRefreshToken(refreshToken);
      tokenUtils.setUserData(user);
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Registration error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { message: 'Registration failed' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Store tokens and user data
      const { user, accessToken, refreshToken } = response.data;
      tokenUtils.setAccessToken(accessToken);
      tokenUtils.setRefreshToken(refreshToken);
      tokenUtils.setUserData(user);
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { message: 'Login failed' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Logout user
  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.post('/auth/logout');
      
      // Clear stored tokens and user data
      tokenUtils.removeTokens();
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      // Clear tokens even if API call fails
      tokenUtils.removeTokens();
      
      console.error('Logout error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: { message: 'Logout completed locally' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Get user profile
  getProfile: async (): Promise<ApiResponse<{ user: any }>> => {
    try {
      const response = await api.get('/auth/profile');
      
      // Update stored user data
      tokenUtils.setUserData(response.data.user);
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Get profile error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { user: null },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (data: ProfileUpdateData): Promise<ApiResponse<{ user: any; message: string }>> => {
    try {
      const response = await api.put('/auth/profile', data);
      
      // Update stored user data
      tokenUtils.setUserData(response.data.user);
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Update profile error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { message: 'Update failed' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Change password
  changePassword: async (data: PasswordChangeData): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.put('/auth/password', data);
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Change password error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { message: 'Password change failed' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<ApiResponse<TokenRefreshResponse>> => {
    try {
      const refreshToken = tokenUtils.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      
      // Update stored tokens
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      tokenUtils.setAccessToken(accessToken);
      tokenUtils.setRefreshToken(newRefreshToken);
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens on refresh failure
      tokenUtils.removeTokens();
      
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { message: 'Token refresh failed' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Email verification
  verifyEmail: async (token: string): Promise<ApiResponse<{ message: string; user: any }>> => {
    try {
      const response = await api.post('/auth/verify-email', { token });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Email verification error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { message: 'Email verification failed' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Resend email verification
  resendVerification: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { message: 'Failed to resend verification email' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { message: 'Failed to send password reset email' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.post('/auth/reset-password', { token, password: newPassword });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { message: 'Password reset failed' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Request a magic-link sign-in email. Backend always returns 200
  // (regardless of whether the email is registered) to prevent enumeration.
  //
  // W6-S5b — `opts.pendingChatSessionId` binds an anonymous chat
  // sessionId to the magic-link token row. On verify, the server-side
  // merge runs automatically — works across browser/device because the
  // binding lives on the token, not in client storage.
  requestMagicLink: async (
    email: string,
    opts: { pendingChatSessionId?: string } = {}
  ): Promise<ApiResponse<{ ok: boolean }>> => {
    try {
      const body: Record<string, unknown> = { email };
      if (opts.pendingChatSessionId) {
        body.pendingChatSessionId = opts.pendingChatSessionId;
      }
      const response = await api.post('/auth/magic-link', body);
      return { data: response.data, status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { ok: false },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Consume a magic-link token and — on success — store the returned
  // JWT pair + user data so subsequent requests authenticate normally.
  //
  // W6-S5b — response now optionally carries `claimedChat: { returnTo,
  // merged, eventsMerged }` when the token had a pendingChatSessionId.
  // MagicLinkVerifyPage navigates to `claimedChat.returnTo` instead of
  // /dashboard in that case.
  verifyMagicLink: async (
    token: string
  ): Promise<
    ApiResponse<{
      ok: boolean;
      accessToken?: string;
      refreshToken?: string;
      user?: any;
      reason?: 'expired' | 'used' | 'invalid';
      email?: string;
      claimedChat?: {
        merged: boolean;
        eventsMerged: number;
        returnTo: string;
      };
    }>
  > => {
    try {
      // POST, not GET: avoids email-scanner prefetch consuming one-time tokens.
      const response = await api.post('/auth/magic-link/verify', { token });

      if (response.data?.ok && response.data.accessToken) {
        tokenUtils.setAccessToken(response.data.accessToken);
        tokenUtils.setRefreshToken(response.data.refreshToken);
        tokenUtils.setUserData(response.data.user);
      }

      return { data: response.data, status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          data: error.response?.data || { ok: false, reason: 'invalid' as const },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },
};

// Scenario-related types
export interface SavedScenario {
  _id: string;
  userId: string;
  dealId: string;
  name: string;
  description?: string;
  propertyData: any; // SFRPropertyData
  analysis: any; // Analysis object
  isFavorite: boolean;
  tags?: string[];
  createdAt: Date;
  lastModified: Date;
}

export interface CreateScenarioRequest {
  name: string;
  description?: string;
  propertyData: any;
  analysis: any;
  isFavorite?: boolean;
  tags?: string[];
}

export interface UpdateScenarioRequest {
  name?: string;
  description?: string;
  propertyData?: any;
  analysis?: any;
  isFavorite?: boolean;
  tags?: string[];
}

// Scenario API methods (following existing patterns and Complete Storage Architecture)
export const scenarioApi = {
  // Get all scenarios for a specific deal
  getScenarios: async (dealId: string): Promise<ApiResponse<{ scenarios: SavedScenario[]; total: number }>> => {
    try {
      const response = await api.get(`/deals/${dealId}/scenarios`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error getting scenarios:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: { scenarios: [], total: 0 },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Create a new scenario (follows Complete Storage Architecture)
  createScenario: async (dealId: string, scenarioData: CreateScenarioRequest): Promise<ApiResponse<{ scenario: SavedScenario; message: string }>> => {
    try {
      console.log('Scenario API: Creating scenario for deal', dealId, 'with data:', {
        name: scenarioData.name,
        hasPropertyData: !!scenarioData.propertyData,
        hasAnalysis: !!scenarioData.analysis,
        isFavorite: scenarioData.isFavorite
      });

      const response = await api.post(`/deals/${dealId}/scenarios`, scenarioData);
      
      console.log('Scenario API: Created scenario successfully:', response.data.scenario._id);
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error creating scenario:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: { scenario: {} as SavedScenario, message: 'Failed to create scenario' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Get a specific scenario (follows Complete Storage Architecture - no recalculation)
  getScenario: async (dealId: string, scenarioId: string): Promise<ApiResponse<SavedScenario>> => {
    try {
      console.log('Scenario API: Loading scenario', scenarioId, 'for deal', dealId);
      
      const response = await api.get(`/deals/${dealId}/scenarios/${scenarioId}`);
      
      console.log('Scenario API: Loaded scenario successfully:', {
        name: response.data.name,
        hasPropertyData: !!response.data.propertyData,
        hasAnalysis: !!response.data.analysis,
        cashFlow: response.data.analysis?.monthlyAnalysis?.cashFlow
      });
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error getting scenario:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: {} as SavedScenario,
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Update a scenario
  updateScenario: async (dealId: string, scenarioId: string, updateData: UpdateScenarioRequest): Promise<ApiResponse<{ scenario: SavedScenario; message: string }>> => {
    try {
      console.log('Scenario API: Updating scenario', scenarioId, 'for deal', dealId);
      
      const response = await api.put(`/deals/${dealId}/scenarios/${scenarioId}`, updateData);
      
      console.log('Scenario API: Updated scenario successfully');
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error updating scenario:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: { scenario: {} as SavedScenario, message: 'Failed to update scenario' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Delete a scenario
  deleteScenario: async (dealId: string, scenarioId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      console.log('Scenario API: Deleting scenario', scenarioId, 'for deal', dealId);
      
      const response = await api.delete(`/deals/${dealId}/scenarios/${scenarioId}`);
      
      console.log('Scenario API: Deleted scenario successfully');
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error deleting scenario:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: { message: 'Failed to delete scenario' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },

  // Toggle scenario favorite status
  toggleFavorite: async (dealId: string, scenarioId: string): Promise<ApiResponse<{ scenario: SavedScenario; message: string }>> => {
    try {
      console.log('Scenario API: Toggling favorite for scenario', scenarioId);
      
      const response = await api.patch(`/deals/${dealId}/scenarios/${scenarioId}/favorite`);
      
      console.log('Scenario API: Toggled favorite successfully:', response.data.scenario.isFavorite);
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error toggling scenario favorite:', error);
      if (axios.isAxiosError(error)) {
        return {
          data: { scenario: {} as SavedScenario, message: 'Failed to toggle favorite' },
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      throw error;
    }
  },
};

// Portfolio-related API calls
export const portfolioApi = {
  // Get dashboard summary for portfolio-first dashboard
  getDashboardSummary: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/portfolios/dashboard-summary');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },

  // Get all portfolios for the authenticated user
  getPortfolios: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/portfolios');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      throw error;
    }
  },

  // Get portfolio details by ID
  getPortfolioDetails: async (portfolioId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get(`/portfolios/${portfolioId}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching portfolio details:', error);
      throw error;
    }
  },

  // Create a new portfolio
  createPortfolio: async (portfolioData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/portfolios', portfolioData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error creating portfolio:', error);
      throw error;
    }
  },

  // Update an existing portfolio
  updatePortfolio: async (portfolioId: string, portfolioData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put(`/portfolios/${portfolioId}`, portfolioData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error updating portfolio:', error);
      throw error;
    }
  },

  // Archive a portfolio (soft delete)
  archivePortfolio: async (portfolioId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete(`/portfolios/${portfolioId}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error archiving portfolio:', error);
      throw error;
    }
  },

  // Get available portfolios for adding a property
  getAvailablePortfolios: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/portfolios/available');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching available portfolios:', error);
      throw error;
    }
  },

  // Add a property to a portfolio
  addPropertyToPortfolio: async (portfolioId: string, propertyId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post(`/portfolios/${portfolioId}/properties`, {
        propertyId
      });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error adding property to portfolio:', error);
      throw error;
    }
  },

  // Remove a property from a portfolio
  removePropertyFromPortfolio: async (portfolioId: string, propertyId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete(`/portfolios/${portfolioId}/properties/${propertyId}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error removing property from portfolio:', error);
      throw error;
    }
  },

  // Manually recalculate portfolio analytics
  recalculateAnalytics: async (portfolioId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post(`/portfolios/${portfolioId}/recalculate-analytics`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error recalculating analytics:', error);
      throw error;
    }
  },
};

// Pipeline-related API calls for dashboard integration
export const pipelineApi = {
  // Get pipeline summary for dashboard
  getDashboardSummary: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/pipeline/dashboard-summary');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching pipeline dashboard summary:', error);
      throw error;
    }
  },

  // Get recent pipeline deals for dashboard display
  getRecentDeals: async (limit: number = 5): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get(`/pipeline/deals?limit=${limit}&sortBy=updatedAt&sortOrder=desc`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching recent pipeline deals:', error);
      throw error;
    }
  },

  // Get deals requiring action for dashboard alerts
  getDealsRequiringAction: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/pipeline/deals/requiring-action');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching deals requiring action:', error);
      throw error;
    }
  },

  // Get pipeline analytics for dashboard metrics
  getAnalytics: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/pipeline/analytics');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching pipeline analytics:', error);
      throw error;
    }
  },

  // Get all pipeline deals with optional filters
  getDeals: async (filters?: {
    stage?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.stage) queryParams.append('stage', filters.stage);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.offset) queryParams.append('offset', filters.offset.toString());

      const url = `/pipeline/deals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);

      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching pipeline deals:', error);
      throw error;
    }
  },

  // Create new pipeline deal
  createDeal: async (dealData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/pipeline/deals', dealData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error creating pipeline deal:', error);
      throw error;
    }
  },

  // Update pipeline deal
  updateDeal: async (dealId: string, dealData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put(`/pipeline/deals/${dealId}`, dealData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error updating pipeline deal:', error);
      throw error;
    }
  },

  // Update deal stage
  updateDealStage: async (dealId: string, stage: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put(`/pipeline/deals/${dealId}/stage`, { stage });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error updating deal stage:', error);
      throw error;
    }
  }
};

// Command Center API for dashboard aggregation
export const commandCenterApi = {
  // Get command center dashboard data (detailed view)
  getCommandCenterData: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/command-center');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching command center data:', error);
      throw error;
    }
  },

  // Get focused dashboard data for Investment Decision Center
  getFocusedDashboardData: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/command-center?view=focused');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('Error fetching focused dashboard data:', error);
      throw error;
    }
  }
};

// ===== Anonymous Analysis LocalStorage Helpers =====
// Used by public calculators to save analysis before user creates account

/**
 * Save anonymous analysis to localStorage for conversion flow
 * When user creates account, we can retrieve and save their analysis
 */
export const saveAnonymousAnalysis = (
  propertyData: Partial<PropertyData>,
  analysis: any
): void => {
  try {
    const savedAnalysis = {
      propertyData,
      analysis,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('pendingAnalysis', JSON.stringify(savedAnalysis));
  } catch (error) {
    console.error('Failed to save analysis to localStorage:', error);
  }
};

/**
 * Retrieve pending analysis from localStorage
 * Used after user creates account to save their work
 */
export const getPendingAnalysis = (): {
  propertyData: Partial<PropertyData>;
  analysis: any;
  timestamp: string;
} | null => {
  try {
    const saved = localStorage.getItem('pendingAnalysis');
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to retrieve pending analysis:', error);
    return null;
  }
};

/**
 * Clear pending analysis from localStorage
 * Called after successfully saving to database
 */
export const clearPendingAnalysis = (): void => {
  try {
    localStorage.removeItem('pendingAnalysis');
  } catch (error) {
    console.error('Failed to clear pending analysis:', error);
  }
};

// ============================================================
// PDF Share API
// ============================================================

export const pdfApi = {
  shareAnalysis: async (data: {
    recipientEmail: string;
    ccEmail?: string;
    personalNote?: string;
    analysis: any;
    propertyData: any;
    strategy: string;
  }) => {
    const response = await api.post('/pdf/share-analysis', data);
    return response.data;
  },

  getShareHistory: async (limit?: number) => {
    const response = await api.get(`/pdf/share-history${limit ? `?limit=${limit}` : ''}`);
    return response.data;
  },
};

export default api;