export type PropertyType = 'SFR' | 'MF';

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

// BRRRR Strategy Data (Phase 1.3 - BRRRR Implementation)
export interface BRRRRStrategyData {
  rehabBudget: number;
  afterRepairValue: number;
  refinanceLTV: number;  // 65-80%, default 75
  seasoningPeriod: number;  // 6-24 months, default 12
  estimatedRehabTime?: number;  // months (optional)
  arvAppraisalConfidence: 'conservative' | 'moderate' | 'aggressive';
}

// Exit strategy data for investment decision enhancement
export interface ExitStrategyData {
  primaryExitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
  portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
  marketTimingFlexibility?: 'flexible' | 'somewhat' | 'constrained' | 'independent';
  riskApproach?: 'conservative' | 'balanced' | 'aggressive' | 'opportunistic';
  capitalDeployment?: 'reinvest_re' | 'diversify' | 'lifestyle' | 'business' | 'debt';
}

export interface BasePropertyData {
  propertyType: PropertyType;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  propertyAddress: PropertyAddress;
  closingCosts?: number;
  capitalInvestments?: number;
  landValueRatio?: number; // Percentage of purchase price allocated to land (default 0.20)
  tenantTurnoverFees?: {
    prepFees: number;
    realtorCommission: number;
  };
}

export interface CommonMetrics {
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  irr: number;
  dscr: number;
  operatingExpenseRatio: number;
  totalInvestment: number;
}

export interface SFRData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  condition?: string;
  afterRepairValue?: number;
  renovationCosts?: number;
  repairCosts?: number;
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    inflationRate: number;
    vacancyRate: number;
    sellingCostsPercentage: number;
    turnoverFrequency?: number;
  };
  // Exit strategy data for investment decision enhancement
  exitStrategy?: ExitStrategyData;
  // Tax Intelligence Profile for tax-optimized analysis
  taxProfile?: {
    filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household';
    state: string;
    federalTaxBracket?: number;
    stateTaxRate?: number;
    capitalGainsHoldingStrategy: 'short_term' | 'long_term' | 'flexible';
    depreciation: {
      method: 'straight_line';
      personalUsePercentage: number;
    };
    investorType: 'individual' | 'entity';
  };
}

export interface SFRMetrics extends CommonMetrics {
  pricePerSqFt: number;
  rentPerSqFt: number;
  grossRentMultiplier: number;
  afterRepairValueRatio?: number;
  rehabROI?: number;
}

/**
 * Multi-Family Building Types (Phase 1: Commercial MF - 5+ units)
 *
 * GARDEN: 2-3 story garden-style apartments with outdoor corridors
 * MID_RISE: 4-9 story buildings with elevators
 * COMPLEX: Multi-building complexes (multiple garden-style buildings)
 */
export type MFBuildingType = 'GARDEN' | 'MID_RISE' | 'COMPLEX';

/**
 * Multi-Family Property Data Interface
 * Story 1.1: Enhanced with unit-level granularity for competitive advantage
 *
 * Supports TWO input methods:
 * 1. unitTypes[] - Simplified aggregated input (Property Wizard default)
 * 2. units[] - Granular unit-level input (Advanced users, RentCast integration)
 */
export interface MultiFamilyData extends BasePropertyData {
  propertyType: 'MF';

  // Building Details
  totalUnits: number;  // 2-32 units (target range)
  totalSqft: number;
  yearBuilt: number;
  buildingType?: MFBuildingType;  // Phase 1: GARDEN | MID_RISE | COMPLEX

  // Unit Configuration - Method 1: Aggregated (existing, backward compatible)
  unitTypes?: Array<{
    type: string;          // e.g., "2bed/1bath", "Studio"
    count: number;         // How many of this type
    sqft: number;          // Square feet per unit
    monthlyRent: number;   // Current rent per unit (what tenant actually pays)
    marketRent?: number;   // Issue #6: RentCast market rent estimate (for value-add analysis)
  }>;

  // Unit Configuration - Method 2: Granular (NEW - competitive moat)
  units?: Array<{
    unitNumber?: string;          // e.g., "101", "2A"
    bedrooms: number;             // 0 (studio) to 4+
    bathrooms: number;            // 1.0, 1.5, 2.0, etc.
    squareFeet: number;           // Individual unit size
    currentRent: number;          // What tenant actually pays
    marketRent?: number;          // ✨ COMPETITIVE MOAT - From RentCast API
    isVacant?: boolean;           // Track physical vacancy at unit level
    condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';  // Renovation planning
    leaseEndDate?: string;        // ISO date for turnover planning
  }>;

  // Operating Expenses
  commonAreaUtilities: {
    electric: number;   // Common area electricity (monthly)
    water: number;      // Water/sewer for common areas (monthly)
    gas: number;        // Gas for common areas (monthly)
    trash: number;      // Trash removal (monthly)
  };
  maintenanceCostPerUnit: number;  // Monthly per-unit maintenance budget
  insurancePerUnit: number;        // Annual insurance cost per unit ($/unit/year)

  // Financing Options
  loanType?: 'RESIDENTIAL' | 'COMMERCIAL';  // ✨ EDUCATES BEGINNERS: 1-4 units = residential, 5+ = commercial
  balloonPayment?: {
    years: number;      // Typical: 5, 7, or 10 years
    amount?: number;    // Calculated if not provided
  };

  // Long-term Assumptions (optional, uses defaults if not provided)
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    inflationRate: number;
    vacancyRate: number;
    sellingCostsPercentage: number;
    turnoverFrequency?: number;
  };
}

export interface MultiFamilyMetrics extends CommonMetrics {
  // Per-unit metrics (averaged across all units)
  pricePerUnit: number;
  pricePerSqft: number;
  noiPerUnit: number;
  cashFlowPerUnit: number;
  averageRentPerUnit: number;
  operatingExpensePerUnit: number;

  // Per-unit-type metrics (Issue #5 - Story 4.2 Unit Mix Analysis)
  // Breakdown by unit type for profitability comparison
  perUnitTypeMetrics?: Array<{
    unitType: string;       // e.g., "2BR/1BA", "1BR/1BA"
    income: number;         // Annual gross income per unit of this type
    opex: number;           // Annual operating expenses per unit of this type
    noi: number;            // Annual NOI per unit of this type
    cashFlow: number;       // Annual cash flow per unit of this type (after debt service)
  }>;

  // Advanced MF-specific metrics (Story 1.4)
  grm: number;                      // Gross Rent Multiplier: Purchase Price / Gross Annual Income
  debtYield: number;                // (NOI / Loan Amount) * 100 - What lenders use
  breakEvenOccupancy: number;       // (Operating Expenses + Debt Service) / Gross Income * 100
  rentPerSqft: number;              // Monthly Rent / Total Square Feet
  unitMixEfficiency: number;        // Rent optimization score (0-100)
  economicVacancyRate: number;      // (Potential Income - Actual Income) / Potential Income * 100
  grossYield: number;               // (Gross Annual Income / Purchase Price) * 100

  // Efficiency metrics
  commonAreaExpenseRatio: number;   // Common area costs per square foot

  // Context fields for NOI calculation clarity
  effectiveGrossIncome?: number;    // Gross Income - Vacancy - Credit Loss
  grossIncome?: number;             // Potential Gross Income (before vacancy)
  operatingExpenses?: number;       // Total operating expenses (NO vacancy)
}

export interface ProjectionAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualExpenseIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCostsPercentage: number;
  vacancyRate: number;
}

export interface YearlyProjection {
  year: number;
  propertyValue: number;
  grossIncome: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  equity: number;
  mortgageBalance: number;
  totalReturn: number;
  turnoverCosts?: number;
  capitalImprovements?: number;
}

export interface ExitAnalysis {
  projectedSalePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceedsFromSale: number;
  totalReturn: number;
  equityMultiple: number;
}

export interface SensitivityAnalysis {
  bestCase: {
    cashFlow: number;
    noi: number;
    dscr: number;
    capRate: number;
    totalReturn: number;
    assumptions: {
      rentIncrease: number;     // % increase applied
      expenseDecrease: number;  // % decrease applied
      vacancyRate: number;      // Optimistic vacancy rate
    };
  };
  worstCase: {
    cashFlow: number;
    noi: number;
    dscr: number;
    capRate: number;
    totalReturn: number;
    assumptions: {
      rentDecrease: number;     // % decrease applied
      expenseIncrease: number;  // % increase applied
      vacancyRate: number;      // Pessimistic vacancy rate
    };
  };
  baseCase: {
    cashFlow: number;
    noi: number;
    dscr: number;
    capRate: number;
    totalReturn: number;
  };
}

export interface AnalysisResult<T extends CommonMetrics> {
  monthlyAnalysis: {
    income: {
      gross: number;
      effective: number;
      other?: number;
    };
    expenses: {
      operating: number;
      debt: number;
      total: number;
      breakdown: Record<string, number>;
    };
    cashFlow: number;
  };
  annualAnalysis: {
    income: number;
    expenses: number;
    noi: number;
    debtService: number;
    cashFlow: number;
  };
  metrics: T;
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;
}

export interface PropertyTypeThresholds {
  capRate: number;
  cashOnCash: number;
  dscr: number;
  operatingExpenseRatio: number;
}

// Unified DealData interface for both SFR and MF
export type DealData = SFRData | MultiFamilyData; 