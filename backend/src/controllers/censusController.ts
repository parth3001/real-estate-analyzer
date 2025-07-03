/**
 * Census API Controller
 * Handles HTTP requests for Census data
 */

import { Request, Response } from 'express';
import { censusService } from '../services/censusService';
import { logger } from '../utils/logger';
import { CensusQueryParams } from '../types/census';

/**
 * Get demographic data for a location
 */
export const getDemographicData = async (req: Request, res: Response) => {
  try {
    // Check for both zip and zipCode parameters, with zipCode taking precedence
    const zipCode = (req.query.zipCode as string) || (req.query.zip as string);
    
    const params: CensusQueryParams = {
      state: req.query.state as string,
      county: req.query.county as string,
      zip: zipCode, // Use the zipCode value (which might come from either parameter)
      city: req.query.city as string,
      tract: req.query.tract as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      dataset: req.query.dataset as string
    };
    
    // Validate that we have at least one location parameter
    if (!params.state && !params.county && !params.zip && !params.city && !params.tract) {
      return res.status(400).json({
        error: 'At least one location parameter (state, county, zip/zipCode, city, or tract) is required'
      });
    }
    
    const data = await censusService.getDemographicData(params);
    return res.status(200).json(data);
  } catch (error: any) {
    logger.error('Error in getDemographicData controller:', error);
    return res.status(500).json({
      error: 'Failed to fetch demographic data',
      message: error.message
    });
  }
};

/**
 * Get income data for a location
 */
export const getIncomeData = async (req: Request, res: Response) => {
  try {
    // Check for both zip and zipCode parameters, with zipCode taking precedence
    const zipCode = (req.query.zipCode as string) || (req.query.zip as string);
    
    const params: CensusQueryParams = {
      state: req.query.state as string,
      county: req.query.county as string,
      zip: zipCode, // Use the zipCode value (which might come from either parameter)
      city: req.query.city as string,
      tract: req.query.tract as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      dataset: req.query.dataset as string
    };
    
    // Validate that we have at least one location parameter
    if (!params.state && !params.county && !params.zip && !params.city && !params.tract) {
      return res.status(400).json({
        error: 'At least one location parameter (state, county, zip/zipCode, city, or tract) is required'
      });
    }
    
    const data = await censusService.getIncomeData(params);
    return res.status(200).json(data);
  } catch (error: any) {
    logger.error('Error in getIncomeData controller:', error);
    return res.status(500).json({
      error: 'Failed to fetch income data',
      message: error.message
    });
  }
};

/**
 * Get housing data for a location
 */
export const getHousingData = async (req: Request, res: Response) => {
  try {
    // Check for both zip and zipCode parameters, with zipCode taking precedence
    const zipCode = (req.query.zipCode as string) || (req.query.zip as string);
    
    const params: CensusQueryParams = {
      state: req.query.state as string,
      county: req.query.county as string,
      zip: zipCode, // Use the zipCode value (which might come from either parameter)
      city: req.query.city as string,
      tract: req.query.tract as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      dataset: req.query.dataset as string
    };
    
    // Validate that we have at least one location parameter
    if (!params.state && !params.county && !params.zip && !params.city && !params.tract) {
      return res.status(400).json({
        error: 'At least one location parameter (state, county, zip/zipCode, city, or tract) is required'
      });
    }
    
    const data = await censusService.getHousingData(params);
    return res.status(200).json(data);
  } catch (error: any) {
    logger.error('Error in getHousingData controller:', error);
    return res.status(500).json({
      error: 'Failed to fetch housing data',
      message: error.message
    });
  }
};

/**
 * Get comprehensive census data for a location
 */
export const getComprehensiveCensusData = async (req: Request, res: Response) => {
  try {
    // Check for both zip and zipCode parameters, with zipCode taking precedence
    const zipCode = (req.query.zipCode as string) || (req.query.zip as string);
    
    const params: CensusQueryParams = {
      state: req.query.state as string,
      county: req.query.county as string,
      zip: zipCode, // Use the zipCode value (which might come from either parameter)
      city: req.query.city as string,
      tract: req.query.tract as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      dataset: req.query.dataset as string
    };
    
    // Validate that we have at least one location parameter
    if (!params.state && !params.county && !params.zip && !params.city && !params.tract) {
      return res.status(400).json({
        error: 'At least one location parameter (state, county, zip/zipCode, city, or tract) is required'
      });
    }
    
    const data = await censusService.getComprehensiveCensusData(params);
    return res.status(200).json(data);
  } catch (error: any) {
    logger.error('Error in getComprehensiveCensusData controller:', error);
    return res.status(500).json({
      error: 'Failed to fetch comprehensive census data',
      message: error.message
    });
  }
};
