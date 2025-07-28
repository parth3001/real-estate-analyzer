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

// Property-related API calls
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

  // Analyze a property
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
};

export default api; 