/**
 * Types for Census API integration
 */

/**
 * Parameters for querying Census API
 */
export interface CensusQueryParams {
  state?: string;
  county?: string;
  zip?: string;
  city?: string;
  tract?: string;
  year?: number;
  dataset?: string;
}

/**
 * Census API response structure
 */
export interface CensusDataResponse {
  demographics?: DemographicData;
  income?: IncomeData;
  housing?: HousingData;
  education?: EducationData;
  employment?: EmploymentData;
}

/**
 * Demographic data from Census
 */
export interface DemographicData {
  totalPopulation?: number;
  medianAge?: number;
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
  householdSize?: number;
  populationDensity?: number;
}

/**
 * Income data from Census
 */
export interface IncomeData {
  medianHouseholdIncome?: number;
  meanHouseholdIncome?: number;
  incomeDistribution?: {
    under25k?: number;
    _25kto50k?: number;
    _50kto75k?: number;
    _75kto100k?: number;
    _100kto150k?: number;
    _150kPlus?: number;
  };
  povertyRate?: number;
  perCapitaIncome?: number;
}

/**
 * Housing data from Census
 */
export interface HousingData {
  totalHousingUnits?: number;
  occupancyRate?: number;
  vacancyRate?: number;
  ownerOccupied?: number;
  renterOccupied?: number;
  medianHomeValue?: number;
  medianRent?: number;
  housingAgeDistribution?: {
    before1950?: number;
    _1950to1970?: number;
    _1970to1990?: number;
    _1990to2010?: number;
    after2010?: number;
  };
  averageRoomCount?: number;
}

/**
 * Education data from Census
 */
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

/**
 * Employment data from Census
 */
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

/**
 * Enriched property data with census information
 */
export interface PropertyWithCensusData {
  property: any; // Original property data
  censusData: CensusDataResponse;
} 