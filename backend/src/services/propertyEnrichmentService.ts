/**
 * Property Enrichment Service
 * Enhances property data with additional information from external sources
 */

import { censusService } from './censusService';
import { logger } from '../utils/logger';
import { CensusQueryParams, PropertyWithCensusData } from '../types/census';

/**
 * Enrich property data with census information
 * @param propertyData The original property data
 */
export const enrichPropertyWithCensusData = async (propertyData: any): Promise<PropertyWithCensusData> => {
  try {
    // Extract location data from property
    const { address } = propertyData;
    
    if (!address) {
      logger.warn('Cannot enrich property with census data: No address provided');
      return { property: propertyData, censusData: {} };
    }
    
    // Extract ZIP code from address
    const zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/);
    const zip = zipMatch ? zipMatch[0].substring(0, 5) : null;
    
    // Extract state from address (assuming 2-letter state code)
    const stateMatch = address.match(/\b[A-Z]{2}\b/);
    const state = stateMatch ? stateMatch[0] : null;
    
    if (!zip && !state) {
      logger.warn('Cannot enrich property with census data: No ZIP or state found in address');
      return { property: propertyData, censusData: {} };
    }
    
    // Prepare query params
    const params: CensusQueryParams = {
      zip,
      state
    };
    
    // Get census data
    const censusData = await censusService.getComprehensiveCensusData(params);
    
    // Return enriched property data
    return {
      property: propertyData,
      censusData
    };
  } catch (error) {
    logger.error('Error enriching property with census data:', error);
    // Return original property data if enrichment fails
    return { property: propertyData, censusData: {} };
  }
};

/**
 * Analyze property in context of census data
 * @param propertyData The original property data
 * @param censusData Census data for the property location
 */
export const analyzePropertyWithCensusContext = (propertyData: any, censusData: any): any => {
  try {
    // Extract relevant property data
    const { purchasePrice, estimatedValue, monthlyRent } = propertyData;
    
    // Extract relevant census data
    const medianHomeValue = censusData?.housing?.medianHomeValue;
    const medianRent = censusData?.housing?.medianRent;
    const medianIncome = censusData?.income?.medianHouseholdIncome;
    
    // Calculate comparative metrics
    const insights = {
      valueComparison: medianHomeValue ? {
        relativeToMedian: purchasePrice / medianHomeValue,
        percentageDifference: ((purchasePrice - medianHomeValue) / medianHomeValue) * 100
      } : null,
      
      rentComparison: medianRent ? {
        relativeToMedian: monthlyRent / medianRent,
        percentageDifference: ((monthlyRent - medianRent) / medianRent) * 100
      } : null,
      
      affordabilityIndex: medianIncome && monthlyRent ? {
        percentOfMedianIncome: (monthlyRent * 12) / medianIncome * 100,
        isAffordable: (monthlyRent * 12) / medianIncome <= 0.3 // 30% rule of thumb
      } : null,
      
      investmentContext: {
        valueToAreaMedian: medianHomeValue ? purchasePrice / medianHomeValue : null,
        rentToValueRatio: purchasePrice ? (monthlyRent * 12) / purchasePrice : null,
        areaRentToValueRatio: (medianRent && medianHomeValue) ? (medianRent * 12) / medianHomeValue : null
      }
    };
    
    return {
      ...propertyData,
      censusInsights: insights
    };
  } catch (error) {
    logger.error('Error analyzing property with census context:', error);
    return propertyData;
  }
};

/**
 * Generate market insights based on census data
 * @param censusData Census data for the property location
 */
export const generateMarketInsights = (censusData: any): any => {
  try {
    // Extract relevant census data
    const { demographics, income, housing } = censusData;
    
    if (!demographics || !income || !housing) {
      return { marketInsights: [] };
    }
    
    const insights = [];
    
    // Population insights
    if (demographics.totalPopulation) {
      insights.push({
        type: 'population',
        title: 'Population Density',
        value: demographics.totalPopulation,
        insight: `The area has a population of ${demographics.totalPopulation.toLocaleString()} people.`
      });
    }
    
    // Income insights
    if (income.medianHouseholdIncome) {
      insights.push({
        type: 'income',
        title: 'Median Household Income',
        value: income.medianHouseholdIncome,
        insight: `The median household income in this area is $${income.medianHouseholdIncome.toLocaleString()}.`
      });
    }
    
    // Housing insights
    if (housing.medianHomeValue) {
      insights.push({
        type: 'housing',
        title: 'Median Home Value',
        value: housing.medianHomeValue,
        insight: `The median home value in this area is $${housing.medianHomeValue.toLocaleString()}.`
      });
    }
    
    if (housing.vacancyRate) {
      const vacancyPercentage = (housing.vacancyRate * 100).toFixed(1);
      insights.push({
        type: 'housing',
        title: 'Vacancy Rate',
        value: housing.vacancyRate,
        insight: `The housing vacancy rate in this area is ${vacancyPercentage}%.`
      });
    }
    
    if (housing.ownerOccupied && housing.renterOccupied) {
      const total = housing.ownerOccupied + housing.renterOccupied;
      const ownerPercentage = ((housing.ownerOccupied / total) * 100).toFixed(1);
      const renterPercentage = ((housing.renterOccupied / total) * 100).toFixed(1);
      
      insights.push({
        type: 'housing',
        title: 'Owner vs. Renter Occupied',
        value: { owner: ownerPercentage, renter: renterPercentage },
        insight: `In this area, ${ownerPercentage}% of occupied housing units are owner-occupied and ${renterPercentage}% are renter-occupied.`
      });
    }
    
    return { marketInsights: insights };
  } catch (error) {
    logger.error('Error generating market insights:', error);
    return { marketInsights: [] };
  }
}; 