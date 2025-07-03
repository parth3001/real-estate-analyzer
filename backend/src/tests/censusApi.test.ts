/**
 * Census API Integration Tests
 */

import request from 'supertest';
import express from 'express';
import { censusService } from '../services/censusService';
import * as censusController from '../controllers/censusController';
import { CensusQueryParams } from '../types/census';

// Mock the censusService
jest.mock('../services/censusService', () => ({
  censusService: {
    getDemographicData: jest.fn(),
    getIncomeData: jest.fn(),
    getHousingData: jest.fn(),
    getComprehensiveCensusData: jest.fn(),
  },
}));

describe('Census API Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Set up routes for testing
    app.get('/api/census/demographics', censusController.getDemographicData);
    app.get('/api/census/income', censusController.getIncomeData);
    app.get('/api/census/housing', censusController.getHousingData);
    app.get('/api/census/comprehensive', censusController.getComprehensiveCensusData);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /api/census/demographics', () => {
    it('should return demographic data when valid parameters are provided', async () => {
      // Mock the service response
      const mockDemographicData = {
        totalPopulation: 28000,
        medianAge: 35.4,
      };
      
      (censusService.getDemographicData as jest.Mock).mockResolvedValue(mockDemographicData);
      
      // Make the request
      const response = await request(app)
        .get('/api/census/demographics')
        .query({ zip: '94043' });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDemographicData);
      expect(censusService.getDemographicData).toHaveBeenCalledWith(
        expect.objectContaining({ zip: '94043' })
      );
    });
    
    it('should return 400 when no location parameters are provided', async () => {
      // Make the request with no parameters
      const response = await request(app).get('/api/census/demographics');
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(censusService.getDemographicData).not.toHaveBeenCalled();
    });
    
    it('should return 500 when the service throws an error', async () => {
      // Mock the service to throw an error
      (censusService.getDemographicData as jest.Mock).mockRejectedValue(
        new Error('Census API error')
      );
      
      // Make the request
      const response = await request(app)
        .get('/api/census/demographics')
        .query({ zip: '94043' });
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(censusService.getDemographicData).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/census/income', () => {
    it('should return income data when valid parameters are provided', async () => {
      // Mock the service response
      const mockIncomeData = {
        medianHouseholdIncome: 85000,
        perCapitaIncome: 45000,
      };
      
      (censusService.getIncomeData as jest.Mock).mockResolvedValue(mockIncomeData);
      
      // Make the request
      const response = await request(app)
        .get('/api/census/income')
        .query({ state: 'CA' });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockIncomeData);
      expect(censusService.getIncomeData).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'CA' })
      );
    });
  });
  
  describe('GET /api/census/housing', () => {
    it('should return housing data when valid parameters are provided', async () => {
      // Mock the service response
      const mockHousingData = {
        totalHousingUnits: 12000,
        occupancyRate: 0.95,
        vacancyRate: 0.05,
        ownerOccupied: 7000,
        renterOccupied: 4400,
        medianHomeValue: 450000,
        medianRent: 1800,
      };
      
      (censusService.getHousingData as jest.Mock).mockResolvedValue(mockHousingData);
      
      // Make the request
      const response = await request(app)
        .get('/api/census/housing')
        .query({ county: 'Santa Clara', state: 'CA' });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHousingData);
      expect(censusService.getHousingData).toHaveBeenCalledWith(
        expect.objectContaining({ county: 'Santa Clara', state: 'CA' })
      );
    });
  });
  
  describe('GET /api/census/comprehensive', () => {
    it('should return comprehensive census data when valid parameters are provided', async () => {
      // Mock the service response
      const mockComprehensiveData = {
        demographics: {
          totalPopulation: 28000,
          medianAge: 35.4,
        },
        income: {
          medianHouseholdIncome: 85000,
          perCapitaIncome: 45000,
        },
        housing: {
          totalHousingUnits: 12000,
          occupancyRate: 0.95,
          vacancyRate: 0.05,
          ownerOccupied: 7000,
          renterOccupied: 4400,
          medianHomeValue: 450000,
          medianRent: 1800,
        },
      };
      
      (censusService.getComprehensiveCensusData as jest.Mock).mockResolvedValue(mockComprehensiveData);
      
      // Make the request
      const response = await request(app)
        .get('/api/census/comprehensive')
        .query({ zip: '94043' });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockComprehensiveData);
      expect(censusService.getComprehensiveCensusData).toHaveBeenCalledWith(
        expect.objectContaining({ zip: '94043' })
      );
    });
  });
}); 