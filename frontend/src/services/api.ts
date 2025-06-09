import axios from 'axios';
import type { PropertyData } from '../types/property';
import type { Analysis } from '../types/analysis';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Property-related API calls
export const propertyApi = {
  // Get all properties
  getAllProperties: async (): Promise<ApiResponse<PropertyData[]>> => {
    try {
      const response = await api.get('/deals');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          data: [],
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      return {
        data: [],
        status: 500,
        message: 'An unknown error occurred',
      };
    }
  },

  // Get a property by ID
  getPropertyById: async (id: string): Promise<ApiResponse<PropertyData>> => {
    try {
      const response = await api.get(`/deals/${id}`);
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

  // Create a new property
  createProperty: async (propertyData: PropertyData): Promise<ApiResponse<PropertyData>> => {
    try {
      const response = await api.post('/deals', propertyData);
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

  // Update a property
  updateProperty: async (id: string, propertyData: PropertyData): Promise<ApiResponse<PropertyData>> => {
    try {
      const response = await api.put(`/deals/${id}`, propertyData);
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

  // Delete a property
  deleteProperty: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/deals/${id}`);
      return {
        data: undefined,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          data: undefined,
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      return {
        data: undefined,
        status: 500,
        message: 'An unknown error occurred',
      };
    }
  },

  // Analyze a property
  analyzeProperty: async (propertyData: PropertyData): Promise<ApiResponse<Analysis>> => {
    try {
      const response = await api.post('/deals/analyze', propertyData);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          data: {} as Analysis,
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        };
      }
      return {
        data: {} as Analysis,
        status: 500,
        message: 'An unknown error occurred',
      };
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
};

export default api; 