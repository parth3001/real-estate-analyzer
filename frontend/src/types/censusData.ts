/**
 * Census Data Types for the Real Estate Analyzer
 */

// Re-export CensusInsight from its dedicated file
export type { CensusInsight } from './censusInsight';

// Parameters for census data queries
export interface CensusQueryParams {
  zip?: string;
  state?: string;
  county?: string;
  city?: string;
  tract?: string;
  year?: number;
  dataset?: string;
}

// Demographic data from census
export interface DemographicData {
  totalPopulation?: number;
  medianAge?: number;
  populationDensity?: number;
  populationGrowth?: number;
  householdSize?: number;
  malePopulation?: number;
  femalePopulation?: number;
  ageDistribution?: {
    under18?: number;
    _18to24?: number;
    _25to34?: number;
    _35to44?: number;
    _45to54?: number;
    _55to64?: number;
    _65plus?: number;
  };
  raceDistribution?: {
    white?: number;
    black?: number;
    hispanic?: number;
    asian?: number;
    nativeAmerican?: number;
    pacificIslander?: number;
    other?: number;
    multiRacial?: number;
  };
}

// Income data from census
export interface IncomeData {
  medianHouseholdIncome?: number;
  meanHouseholdIncome?: number;
  perCapitaIncome?: number;
  povertyRate?: number;
  incomeDistribution?: {
    under25k?: number;
    _25kto50k?: number;
    _50kto75k?: number;
    _75kto100k?: number;
    _100kto150k?: number;
    _150kPlus?: number;
  };
  unemploymentRate?: number;
}

// Housing data from census
export interface HousingData {
  totalHousingUnits?: number;
  occupiedHousingUnits?: number;
  vacancyRate?: number;
  ownerOccupied?: number;
  renterOccupied?: number;
  ownerOccupancyRate?: number;
  renterOccupancyRate?: number;
  medianHomeValue?: number;
  medianRent?: number;
  medianYearBuilt?: number;
  propertyTaxRate?: number;
  occupancyRate?: number;
  housingAgeDistribution?: {
    before1950?: number;
    _1950to1970?: number;
    _1970to1990?: number;
    _1990to2010?: number;
    after2010?: number;
  };
  averageRoomCount?: number;
}

// Education data from Census
export interface EducationData {
  highSchoolGraduate?: number;
  bachelorsOrHigher?: number;
  graduateOrProfessional?: number;
  educationalAttainment?: {
    lessThanHighSchool?: number;
    highSchool?: number;
    someCollege?: number;
    associates?: number;
    bachelors?: number;
    graduate?: number;
  };
}

// Employment data from Census
export interface EmploymentData {
  employmentRate?: number;
  unemploymentRate?: number;
  laborForceParticipation?: number;
  occupationDistribution?: {
    management?: number;
    service?: number;
    sales?: number;
    construction?: number;
    production?: number;
  };
  meanCommuteTime?: number;
  workFromHome?: number;
}

// Market insights derived from census data
export interface MarketInsight {
  type: 'housing' | 'income' | 'demographics' | 'general';
  title: string;
  value: number;
  insight: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  impact?: 'positive' | 'negative' | 'neutral';
}

// Complete census data response
export interface CensusDataResponse {
  demographics?: DemographicData;
  income?: IncomeData;
  housing?: HousingData;
  education?: EducationData;
  employment?: EmploymentData;
  insights?: MarketInsight[];
  lastUpdated?: string;
  source?: string;
  location?: {
    zip?: string;
    state?: string;
    county?: string;
    city?: string;
  };
}

// Enriched property data with census information
export interface PropertyWithCensusData {
  property: any; // Original property data
  censusData: CensusDataResponse;
}
