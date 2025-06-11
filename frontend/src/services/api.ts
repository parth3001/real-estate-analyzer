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
};

export default api; 