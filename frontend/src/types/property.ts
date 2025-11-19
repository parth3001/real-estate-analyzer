export type PropertyType = 'SFR' | 'MF' | 'Commercial' | 'Mixed-Use' | 'Industrial';

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
}

export interface LongTermAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCostsPercentage: number;
  inflationRate: number;
  vacancyRate: number;
  turnoverFrequency?: number; // Average tenant stay in years (default: 2)
}

export interface BasePropertyData {
  id?: string;
  propertyName: string;
  propertyAddress: PropertyAddress;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  propertyManagementRate: number;
  yearBuilt: number;
  closingCosts?: number;
  capitalInvestments?: number;
  tenantTurnoverFees?: {
    prepFees?: number;
    realtorCommission?: number;
  };
}

export interface SFRPropertyData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  maintenanceCost: number;
  repairCosts?: number;
  longTermAssumptions: LongTermAssumptions;
  // Portfolio context (optional)
  portfolioId?: string;
  portfolioContext?: {
    portfolioName?: string;
    portfolioStrategy?: string;
  };
  // Investment goals and strategy (optional)
  enhancedGoals?: {
    exitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
    portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
    experienceLevel?: 'novice' | 'intermediate' | 'expert';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
    freeTextStrategy?: string;
    aiEnhancedStrategy?: string;
    strategicInsights?: string[];
  };
}

export interface UnitType {
  type: string;
  count: number;
  sqft: number;
  monthlyRent: number;
  marketRent?: number;      // Issue #6: RentCast market rent estimate (for value-add analysis)
  occupied?: number;         // Optional: Number of occupied units of this type
}

export interface MFLongTermAssumptions extends LongTermAssumptions {
  capitalExpenditureRate: number;
  commonAreaMaintenanceRate: number;
}

export interface CommonAreaUtilities {
  electric: number;
  water: number;
  gas: number;
  trash: number;
}

export interface MultiFamilyPropertyData extends BasePropertyData {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  maintenanceCostPerUnit: number;
  unitTypes: UnitType[];
  longTermAssumptions: MFLongTermAssumptions;
  commonAreaUtilities: CommonAreaUtilities;
  buildingType?: 'GARDEN' | 'MID_RISE' | 'COMPLEX'; // Phase 1: Commercial MF (5+ units)
  // Portfolio context (optional)
  portfolioId?: string;
  portfolioContext?: {
    portfolioName?: string;
    portfolioStrategy?: string;
  };
  // Investment goals and strategy (optional)
  enhancedGoals?: {
    exitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
    portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
    experienceLevel?: 'novice' | 'intermediate' | 'expert';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
    freeTextStrategy?: string;
    aiEnhancedStrategy?: string;
    strategicInsights?: string[];
  };
}

export type PropertyData = SFRPropertyData | MultiFamilyPropertyData;

/**
 * Represents a saved property from the backend
 */
export interface SavedProperty {
  _id: string;
  propertyName: string;
  propertyType: 'SFR' | 'MF';
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTax: number;
  insurance: number;
  // SFR specific
  monthlyRent?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  // MF specific
  totalUnits?: number;
  totalSqft?: number;
  unitTypes?: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
  }>;
  analysis: {
    monthlyAnalysis: {
      expenses: {
        mortgage?: {
          total: number;
        };
        propertyTax?: number;
        insurance?: number;
        maintenance?: number;
        propertyManagement?: number;
        vacancy?: number;
        total?: number;
      };
      income?: number;
      cashFlow?: number;
    };
    annualAnalysis?: {
      dscr?: number;
      cashOnCashReturn?: number;
      capRate?: number;
      totalInvestment?: number;
      annualNOI?: number;
    };
    longTermAnalysis?: {
      projections?: Array<any>;
      exitAnalysis?: {
        projectedSalePrice?: number;
        sellingCosts?: number;
        mortgagePayoff?: number;
        netProceedsFromSale?: number;
      };
    };
    keyMetrics?: {
      capRate?: number;
      cashOnCashReturn?: number;
      dscr?: number;
      grossRentMultiplier?: number;
      netOperatingIncome?: number;
      totalInvestment?: number;
    };
    aiInsights?: {
      summary?: string;
      strengths?: string[];
      weaknesses?: string[];
      recommendations?: string[];
      investmentScore?: number | null;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Re-export Portfolio types for SFR analysis integration
export type {
  IPortfolio as Portfolio,
  PortfolioSummary,
  IPortfolioAnalytics as PortfolioAnalytics,
  IPortfolioRecommendation as PortfolioRecommendation,
  CreatePortfolioRequest
} from './portfolio';

// Re-export Analysis type from analysis module
export type { Analysis } from './analysis'; 