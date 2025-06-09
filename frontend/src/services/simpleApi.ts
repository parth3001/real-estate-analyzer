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
      purchasePrice: Number(propertyData.purchasePrice) || 0,
      downPayment: Number(propertyData.downPayment) || 0,
      interestRate: Number(propertyData.interestRate) || 0,
      loanTerm: Number(propertyData.loanTerm) || 0,
      monthlyRent: Number(propertyData.monthlyRent) || 0,
      propertyTaxRate: Number(propertyData.propertyTaxRate) || 0,
      insuranceRate: Number(propertyData.insuranceRate) || 0,
      propertyManagementRate: Number(propertyData.propertyManagementRate) || 0,
      squareFootage: Number(propertyData.squareFootage) || 0,
      bedrooms: Number(propertyData.bedrooms) || 0,
      bathrooms: Number(propertyData.bathrooms) || 0,
      yearBuilt: Number(propertyData.yearBuilt) || 0,
      // Convert monthly maintenance to annual
      maintenanceCost: Number(propertyData.maintenanceCost) * 12 || 0,
      propertyName: propertyData.propertyName,
      longTermAssumptions: {
        projectionYears: Number(propertyData.projectionYears) || 10,
        annualRentIncrease: Number(propertyData.annualRentIncrease) || 2,
        annualPropertyValueIncrease: Number(propertyData.annualPropertyValueIncrease) || 3,
        sellingCostsPercentage: Number(propertyData.sellingCostsPercentage) || 6,
        inflationRate: Number(propertyData.inflationRate) || 2,
        vacancyRate: Number(propertyData.vacancyRate) || 5
      }
    };

    console.log('Sending analysis request with data:', formattedData);

    // Send the formatted data directly in the request body
    const response = await api.post('/deals/analyze', formattedData);
    
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