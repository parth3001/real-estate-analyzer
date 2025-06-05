import axios from 'axios';
import { AnalysisResult } from '../types/analysisTypes';

// Types for property analysis
export interface PropertyData {
  propertyName: string;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  monthlyRent: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  vacancyRate: number;
  closingCosts: number;
  repairCosts: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  // Long term assumptions
  annualRentIncrease?: number;
  annualPropertyValueIncrease?: number;
  sellingCostsPercentage?: number;
  inflationRate?: number;
  projectionYears?: number;
}

// Set up axios with base URL
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// API functions
export const analyzeProperty = async (propertyData: PropertyData): Promise<AnalysisResult> => {
  try {
    // Format data for API according to the expected backend format
    const formattedData = {
      propertyType: 'SFR',
      propertyAddress: propertyData.propertyAddress,
      purchasePrice: propertyData.purchasePrice,
      downPayment: propertyData.downPayment,
      interestRate: propertyData.interestRate,
      loanTerm: propertyData.loanTerm,
      monthlyRent: propertyData.monthlyRent,
      propertyTaxRate: propertyData.propertyTaxRate,
      insuranceRate: propertyData.insuranceRate,
      propertyManagementRate: propertyData.propertyManagementRate,
      squareFootage: propertyData.squareFootage,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      yearBuilt: propertyData.yearBuilt,
      maintenanceCost: propertyData.maintenanceCost,
      propertyName: propertyData.propertyName,
      longTermAssumptions: {
        projectionYears: propertyData.projectionYears || 10,
        annualRentIncrease: propertyData.annualRentIncrease || 2,
        annualPropertyValueIncrease: propertyData.annualPropertyValueIncrease || 3,
        sellingCostsPercentage: propertyData.sellingCostsPercentage || 6,
        inflationRate: propertyData.inflationRate || 2,
        vacancyRate: propertyData.vacancyRate || 5
      }
    };

    const response = await api.post('/deals/analyze', {
      propertyType: 'SFR',
      propertyData: formattedData
    });
    
    return response.data as AnalysisResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
    throw new Error('Analysis failed with unknown error');
  }
};

// Get health status
export const checkHealth = async (): Promise<{status: string}> => {
  try {
    const response = await api.get('/health');
    return response.data as { status: string };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
    throw new Error('Health check failed with unknown error');
  }
}; 