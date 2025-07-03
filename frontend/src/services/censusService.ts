/**
 * Census API Service for Frontend
 */
import api from './api';
import type { 
  CensusDataResponse, 
  CensusQueryParams,
  DemographicData,
  IncomeData,
  HousingData
} from '../types/censusData';

/**
 * Get demographic data from Census API
 * @param params Query parameters
 */
export const getDemographicData = async (params: CensusQueryParams): Promise<DemographicData> => {
  try {
    const response = await api.get('/census/demographics', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching demographic data:', error);
    throw error;
  }
};

/**
 * Get income data from Census API
 * @param params Query parameters
 */
export const getIncomeData = async (params: CensusQueryParams): Promise<IncomeData> => {
  try {
    const response = await api.get('/census/income', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching income data:', error);
    throw error;
  }
};

/**
 * Get housing data from Census API
 * @param params Query parameters
 */
export const getHousingData = async (params: CensusQueryParams): Promise<HousingData> => {
  try {
    const response = await api.get('/census/housing', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching housing data:', error);
    throw error;
  }
};

/**
 * Get comprehensive census data from Census API
 * @param params Query parameters
 */
export const getComprehensiveCensusData = async (params: CensusQueryParams): Promise<CensusDataResponse> => {
  try {
    const response = await api.get('/census/comprehensive', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching comprehensive census data:', error);
    throw error;
  }
}; 