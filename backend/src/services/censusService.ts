/**
 * Census API Service
 * Handles all interactions with the US Census Bureau API
 */

import axios from 'axios';
import { CensusDataResponse, CensusQueryParams } from '../types/census';
import { logger } from '../utils/logger';

export class CensusService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.CENSUS_API_KEY || '';
    this.baseUrl = 'https://api.census.gov/data';
    
    if (!this.apiKey) {
      logger.warn('Census API key not found in environment variables');
    }
  }
  
  /**
   * Get demographic data from Census API
   * @param params Query parameters for Census API
   */
  async getDemographicData(params: CensusQueryParams): Promise<any> {
    try {
      // Default to most recent American Community Survey (ACS) data if year not specified
      const year = params.year || 2022;
      const dataset = params.dataset || 'acs/acs5';
      
      // Construct query based on available location parameters
      let geographyQuery = '';
      
      if (params.zip) {
        geographyQuery = `for=zip%20code%20tabulation%20area:${params.zip}`;
      } else if (params.tract && params.state && params.county) {
        geographyQuery = `for=tract:${params.tract}&in=state:${params.state}&in=county:${params.county}`;
      } else if (params.county && params.state) {
        geographyQuery = `for=county:${params.county}&in=state:${params.state}`;
      } else if (params.state) {
        geographyQuery = `for=state:${params.state}`;
      } else {
        throw new Error('Insufficient location parameters provided');
      }
      
      // Variables to request (demographic data)
      // B01001_001E: Total population
      // B01002_001E: Median age
      const variables = 'get=B01001_001E,B01002_001E';
      
      const url = `${this.baseUrl}/${year}/${dataset}?${variables}&${geographyQuery}&key=${this.apiKey}`;
      
      const response = await axios.get(url);
      
      // Process and transform the response
      return this.transformDemographicData(response.data);
    } catch (error) {
      logger.error('Error fetching demographic data from Census API:', error);
      throw error;
    }
  }
  
  /**
   * Get income data from Census API
   * @param params Query parameters for Census API
   */
  async getIncomeData(params: CensusQueryParams): Promise<any> {
    try {
      // Default to most recent American Community Survey (ACS) data if year not specified
      const year = params.year || 2022;
      const dataset = params.dataset || 'acs/acs5';
      
      // Construct query based on available location parameters
      let geographyQuery = '';
      
      if (params.zip) {
        geographyQuery = `for=zip%20code%20tabulation%20area:${params.zip}`;
      } else if (params.tract && params.state && params.county) {
        geographyQuery = `for=tract:${params.tract}&in=state:${params.state}&in=county:${params.county}`;
      } else if (params.county && params.state) {
        geographyQuery = `for=county:${params.county}&in=state:${params.state}`;
      } else if (params.state) {
        geographyQuery = `for=state:${params.state}`;
      } else {
        throw new Error('Insufficient location parameters provided');
      }
      
      // Variables to request (income data)
      // B19013_001E: Median household income
      // B19025_001E: Aggregate household income
      // B19301_001E: Per capita income
      const variables = 'get=B19013_001E,B19025_001E,B19301_001E';
      
      const url = `${this.baseUrl}/${year}/${dataset}?${variables}&${geographyQuery}&key=${this.apiKey}`;
      
      const response = await axios.get(url);
      
      // Process and transform the response
      return this.transformIncomeData(response.data);
    } catch (error) {
      logger.error('Error fetching income data from Census API:', error);
      throw error;
    }
  }
  
  /**
   * Get housing data from Census API
   * @param params Query parameters for Census API
   */
  async getHousingData(params: CensusQueryParams): Promise<any> {
    try {
      // Default to most recent American Community Survey (ACS) data if year not specified
      const year = params.year || 2022;
      const dataset = params.dataset || 'acs/acs5';
      
      // Construct query based on available location parameters
      let geographyQuery = '';
      
      if (params.zip) {
        geographyQuery = `for=zip%20code%20tabulation%20area:${params.zip}`;
      } else if (params.tract && params.state && params.county) {
        geographyQuery = `for=tract:${params.tract}&in=state:${params.state}&in=county:${params.county}`;
      } else if (params.county && params.state) {
        geographyQuery = `for=county:${params.county}&in=state:${params.state}`;
      } else if (params.state) {
        geographyQuery = `for=state:${params.state}`;
      } else {
        throw new Error('Insufficient location parameters provided');
      }
      
      // Variables to request (housing data)
      // B25001_001E: Total housing units
      // B25002_002E: Occupied housing units
      // B25002_003E: Vacant housing units
      // B25003_002E: Owner occupied
      // B25003_003E: Renter occupied
      // B25077_001E: Median home value
      // B25064_001E: Median gross rent
      const variables = 'get=B25001_001E,B25002_002E,B25002_003E,B25003_002E,B25003_003E,B25077_001E,B25064_001E';
      
      const url = `${this.baseUrl}/${year}/${dataset}?${variables}&${geographyQuery}&key=${this.apiKey}`;
      
      const response = await axios.get(url);
      
      // Process and transform the response
      return this.transformHousingData(response.data);
    } catch (error) {
      logger.error('Error fetching housing data from Census API:', error);
      throw error;
    }
  }
  
  /**
   * Get comprehensive Census data for a location
   * @param params Query parameters for Census API
   */
  async getComprehensiveCensusData(params: CensusQueryParams): Promise<CensusDataResponse> {
    try {
      // Get data from multiple endpoints in parallel
      const [demographics, income, housing] = await Promise.all([
        this.getDemographicData(params),
        this.getIncomeData(params),
        this.getHousingData(params)
      ]);
      
      // Combine the results
      return {
        demographics,
        income,
        housing
      };
    } catch (error) {
      logger.error('Error fetching comprehensive census data:', error);
      throw error;
    }
  }
  
  /**
   * Transform raw demographic data from Census API to our format
   * @param rawData Raw data from Census API
   */
  private transformDemographicData(rawData: any[]): any {
    // Skip if no data
    if (!rawData || rawData.length < 2) {
      return {};
    }
    
    // First row contains headers, second row contains values
    const headers = rawData[0];
    const values = rawData[1];
    
    // Create a map of headers to values
    const dataMap: Record<string, any> = {};
    headers.forEach((header: string, index: number) => {
      dataMap[header] = values[index];
    });
    
    // Transform to our format
    return {
      totalPopulation: parseInt(dataMap['B01001_001E']) || 0,
      medianAge: parseFloat(dataMap['B01002_001E']) || 0
      // Additional transformations would be added here as we expand
    };
  }
  
  /**
   * Transform raw income data from Census API to our format
   * @param rawData Raw data from Census API
   */
  private transformIncomeData(rawData: any[]): any {
    // Skip if no data
    if (!rawData || rawData.length < 2) {
      return {};
    }
    
    // First row contains headers, second row contains values
    const headers = rawData[0];
    const values = rawData[1];
    
    // Create a map of headers to values
    const dataMap: Record<string, any> = {};
    headers.forEach((header: string, index: number) => {
      dataMap[header] = values[index];
    });
    
    // Transform to our format
    return {
      medianHouseholdIncome: parseInt(dataMap['B19013_001E']) || 0,
      perCapitaIncome: parseInt(dataMap['B19301_001E']) || 0
      // Additional transformations would be added here as we expand
    };
  }
  
  /**
   * Transform raw housing data from Census API to our format
   * @param rawData Raw data from Census API
   */
  private transformHousingData(rawData: any[]): any {
    // Skip if no data
    if (!rawData || rawData.length < 2) {
      return {};
    }
    
    // First row contains headers, second row contains values
    const headers = rawData[0];
    const values = rawData[1];
    
    // Create a map of headers to values
    const dataMap: Record<string, any> = {};
    headers.forEach((header: string, index: number) => {
      dataMap[header] = values[index];
    });
    
    // Calculate derived values
    const totalHousingUnits = parseInt(dataMap['B25001_001E']) || 0;
    const occupiedUnits = parseInt(dataMap['B25002_002E']) || 0;
    const vacantUnits = parseInt(dataMap['B25002_003E']) || 0;
    const ownerOccupied = parseInt(dataMap['B25003_002E']) || 0;
    const renterOccupied = parseInt(dataMap['B25003_003E']) || 0;
    
    // Calculate rates if we have valid denominators
    const occupancyRate = totalHousingUnits > 0 ? occupiedUnits / totalHousingUnits : 0;
    const vacancyRate = totalHousingUnits > 0 ? vacantUnits / totalHousingUnits : 0;
    
    // Transform to our format
    return {
      totalHousingUnits,
      occupancyRate,
      vacancyRate,
      ownerOccupied,
      renterOccupied,
      medianHomeValue: parseInt(dataMap['B25077_001E']) || 0,
      medianRent: parseInt(dataMap['B25064_001E']) || 0
    };
  }
}

// Export singleton instance
export const censusService = new CensusService(); 