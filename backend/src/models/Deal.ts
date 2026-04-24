import mongoose, { Schema, Document } from 'mongoose';
import { BRRRRStrategyData } from '../types/propertyTypes';

// Base interfaces
export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
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

export interface MFLongTermAssumptions extends LongTermAssumptions {
  capitalExpenditureRate: number;
  commonAreaMaintenanceRate: number;
}

export interface UnitType {
  type: string;
  count: number;
  sqft: number;
  monthlyRent: number;
  occupied: number;
}

export interface CommonAreaUtilities {
  electric: number;
  water: number;
  gas: number;
  trash: number;
}

export interface Analysis {
  monthlyAnalysis: {
    expenses: {
      propertyTax?: number;
      insurance?: number;
      maintenance?: number;
      propertyManagement?: number;
      vacancy?: number;
      tenantTurnover?: number;
      total?: number;
    };
    income?: {
      gross?: number;
      effective?: number;
    };
    cashFlow?: number;
  };
  annualAnalysis: {
    dscr?: number;
    cashOnCashReturn?: number;
    capRate?: number;
    totalInvestment?: number;
    annualNOI?: number;
    annualDebtService?: number;
    effectiveGrossIncome?: number;
  };
  longTermAnalysis: {
    yearlyProjections?: Array<{
      year: number;
      cashFlow: number;
      propertyValue: number;
      equity: number;
      propertyTax: number;
      insurance: number;
      maintenance: number;
      propertyManagement: number;
      vacancy: number;
      turnoverCosts: number;
      capitalImprovements: number;
      operatingExpenses: number;
      noi: number;
      debtService: number;
      grossRent: number;
      mortgageBalance: number;
      appreciation: number;
      totalReturn: number;
      principalPaidThisYear?: number;
      totalPrincipalPaidToDate?: number;
      cashOnCashReturnThisYear?: number;
      pricePerSqFtAtThisPoint?: number;
    }>;
    projectionYears?: number;
    returns?: {
      irr?: number;
      totalCashFlow?: number;
      totalAppreciation?: number;
      totalReturn?: number;
    };
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
    pricePerSqFtAtPurchase?: number;
    pricePerSqFtAtSale?: number;
    avgRentPerSqFt?: number;
    expenseRatio?: number;
    breakEvenOccupancy?: number;
    equityMultiple?: number;
    onePercentRuleValue?: number;
    fiftyRuleAnalysis?: boolean;
    rentToPriceRatio?: number;
    pricePerBedroom?: number;
    debtToIncomeRatio?: number;
    grossRentMultiplier?: number;
    returnOnImprovements?: number;
    turnoverCostImpact?: number;
  };
  aiInsights?: {
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    investmentScore?: number;
    riskAssessment?: string;
    scoreBreakdown?: {
      cashFlow?: {
        score: number;
        max: number;
        reason: string;
      };
      marketPosition?: {
        score: number;
        max: number;
        reason: string;
      };
      riskAssessment?: {
        score: number;
        max: number;
        reason: string;
      };
      financialMetrics?: {
        score: number;
        max: number;
        reason: string;
      };
    };
    // Enhanced strategic analysis fields
    marketTrendPrediction?: string;
    optimalExitStrategy?: any; // Can be string or object from AI
    recommendedHoldPeriod?: string;
    investorFit?: string;
    strategicInsights?: string;
    competitiveAdvantage?: string;
    wealthBuildingPotential?: string;
    marketCycleAnalysis?: string;
    financingRecommendations?: string;
    portfolioFitAnalysis?: string;
    opportunityCostAnalysis?: string;
    notes?: string;
    // Value-add opportunities (can be string array or object array)
    valueAddOpportunities?: any[];
    // Market positioning and comparative analysis
    comparativeMarketAnalysis?: string;
    investorProfileMatch?: string;
    riskMitigationStrategies?: string[];
    // Unit mix analysis for multifamily
    unitMixAnalysis?: string;
    marketPositionAnalysis?: string;
    // Bold predictions from enhanced AI analysis
    boldPredictions?: {
      wealthCreation?: {
        year3Value?: string;
        year5Value?: string;
        year10Value?: string;
        totalWealthCreated?: string;
      };
      cashFlowGrowth?: {
        currentMonthly?: string;
        year2Monthly?: string;
        year5Monthly?: string;
        doubleDate?: string;
        reach5kDate?: string;
      };
      rentGrowthForecast?: {
        currentRent?: string;
        year3Rent?: string;
        year5Rent?: string;
        year7Rent?: string;
      };
      exitStrategy?: {
        optimalExitYear?: string;
        predictedSalePrice?: string;
        totalProfit?: string;
        annualizedReturn?: string;
      };
    };
    
    // Intelligence Multiplier fields
    metricIntelligence?: Array<{
      metricName: string;
      noviceView: string;
      proInsight: string;
      actionItem: string;
      benchmark: string;
      warning: string;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    }>;
    riskBlindSpots?: Array<{
      riskType: string;
      description: string;
      probability: string;
      impact: string;
      mitigation: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
    }>;
    opportunityAlternatives?: Array<{
      category: 'real_estate' | 'investment' | 'timing' | 'market';
      title: string;
      description: string;
      expectedReturn: string;
      riskLevel: string;
      benefit: string;
    }>;
    advancedStrategies?: Array<{
      strategyType: string;
      title: string;
      description: string;
      implementation: string;
      costEstimate: string;
      expectedROI: string;
      timeframe: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }>;
    competitiveIntelligence?: {
      marketInsight: string;
      winningStrategies: string[];
      losingPatterns: string[];
      localTrends: string[];
      investorBehavior: string;
    };
    intelligenceScore?: number;
    sophisticationLevel?: 'novice' | 'intermediate' | 'advanced' | 'professional';
    transformationInsights?: string;
    professionalEquivalent?: string;
  };
  sensitivityAnalysis?: {
    bestCase?: {
      cashFlow?: number;
      cashOnCashReturn?: number;
      totalReturn?: number;
    };
    worstCase?: {
      cashFlow?: number;
      cashOnCashReturn?: number;
      totalReturn?: number;
    };
  };
  // Tax Intelligence Analysis
  taxAnalysis?: {
    userTaxProfile?: {
      filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household';
      state: string; // Two-letter state code
      federalTaxBracket?: number;
      stateTaxRate?: number;
      capitalGainsHoldingStrategy: 'short_term' | 'long_term' | 'flexible';
      depreciation: {
        method: 'straight_line';
        personalUsePercentage: number;
      };
      investorType: 'individual' | 'entity';
    };
    holdPeriodAnalysis?: Array<{
      holdPeriod: number;
      salePrice: number;
      originalBasis: number;
      adjustedBasis: number;
      capitalGain: number;
      depreciationRecapture: number;
      federalCapitalGainsRate: number;
      stateCapitalGainsRate: number;
      federalTax: number;
      stateTax: number;
      totalTaxLiability: number;
      netProceedsFromSale: number;
      totalCashFlow: number;
      totalReturn: number;
      afterTaxIRR: number;
      taxSavingsVsPreviousYear: number;
      breakEvenHoldPeriod: boolean;
    }>;
    optimalHoldPeriod?: number;
    totalTaxSavingsAtOptimal?: number;
    taxOptimizationRecommendations?: string[];
    stateArbitrageOpportunities?: string[];
    exchange1031Eligibility?: {
      eligible: boolean;
      deferralAmount: number;
      timelineRequirements: string[];
      minimumExchangeValue: number;
    };
    expertInsights?: {
      holdPeriodReasoning: string;
      riskConsiderations: string[];
      opportunityCost: string;
      marketTimingFactors: string;
    };
    calculatedAt?: Date;
    taxYear?: number; // Tax year this analysis is based on (e.g., 2025)
  };
  // Investment Decision from Investment Decision Engine
  investmentDecision?: {
    verdict: 'BUY' | 'PASS' | 'NEGOTIATE' | 'CAUTION'; // V3.0 adds CAUTION
    confidence: number;
    score: number; // LEGACY - Property quality score 0-100 (deprecated, use professionalAssessment.dealQuality)
    primaryReason: string;
    goalBasedReasoning?: string; // V3.0 AI-enhanced reasoning based on user strategy
    secondaryReasons: string[];
    keyRisks: string[];
    // V3.0 Professional Assessment - Critical for Deal Quality scoring
    professionalAssessment?: {
      dealQuality: number; // 0-100 weighted score of deal fundamentals
      executionDifficulty: number; // 0-100 complexity of executing this investment
      dataReliability: number; // 0-100 confidence in input data quality
      
      // Factor breakdown (sum = 100%)
      cashFlowScore: number; // 35% weight - monthly income stability
      irrScore: number; // 25% weight - total return potential
      marketStrengthScore: number; // 15% weight - market tier and trends
      debtStructureScore: number; // 10% weight - financing quality
      exitStrategyScore: number; // 10% weight - liquidity and exit options
      capRateScore: number; // 3% weight - current yield vs market
      propertyRiskScore: number; // 2% weight - property quality and age
      
      // Professional recommendations
      primaryInsight: string;
      strategicRecommendations: string[];
      riskMitigation: string[];
      opportunityMaximization: string[];
      
      // Enhanced debt structure analysis
      debtAnalysis?: {
        dscr: number;
        interestRate: number;
        marketSpread: number; // in basis points
        leverageRatio: number;
        loanTerm: number;
        isBalloonLoan: boolean;
        balloonYears?: number;
        riskFactors: string[];
        strengthFactors: string[];
      };
    };
    actionPlan: Array<{
      action: string;
      priority: 'immediate' | 'short-term' | 'long-term';
      impact: string;
      effort: 'low' | 'medium' | 'high';
      expectedOutcome: string;
      timeframe: string;
    }>;
    capitalStrategy: {
      currentApproach: {
        description: string;
        cashRequired: number;
        expectedReturn: number;
        efficiency: 'poor' | 'fair' | 'good' | 'excellent';
      };
      recommendedApproach: {
        description: string;
        cashRequired: number;
        expectedReturn: number;
        efficiency: 'poor' | 'fair' | 'good' | 'excellent';
      };
      opportunityCost: {
        annualCost: number;
        description: string;
        alternativeUse: string;
      };
      portfolioStrategy: string;
    };
    alternativeOptions: Array<{
      type: 'better_deal' | 'market_timing' | 'different_strategy' | 'diversification';
      title: string;
      description: string;
      expectedReturn: string;
      riskLevel: 'lower' | 'similar' | 'higher';
      timeframe: string;
    }>;
    marketContext: {
      marketStage: 'early' | 'mid' | 'late' | 'correction';
      pricingContext: 'undervalued' | 'fair' | 'overvalued' | 'bubble';
      competitiveIntensity: 'low' | 'moderate' | 'high' | 'extreme';
      recommendedStrategy: string;
    };
    timeline: {
      immediateActions: string[];
      shortTermActions: string[];
      longTermStrategy: string[];
    };
    portfolioContext?: {
      portfolioId: string;
      portfolioName: string;
      portfolioGoal: string;
      currentProperties: number;
      monthlyNetCashFlow: number;
      totalValue: number;
      fitAnalysis: string;
      impactSummary: string;
    };
  };

  // Strategy-Specific Analysis Results (Phase 1.3)
  // For BRRRR: Contains BRRRRAnalysis object
  // For House Hack: Contains house hack specific data
  // For Buy & Hold: Undefined/null
  strategySpecific?: any;
}

// Base deal interface
export interface AnalysisConfidence {
  level: 1 | 2 | 3;
  lastUpdated: Date;
  dataSource: 'MANUAL' | 'QUICK_CALC' | 'FULL_ANALYSIS' | 'PIPELINE' | 'PORTFOLIO';
  calculationMethod: 'NONE' | 'BASIC' | 'QUICK_METRICS' | 'FULL_SFR';
}

export interface IDeal extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  portfolioId?: mongoose.Schema.Types.ObjectId; // Optional portfolio association
  ownershipPercentage?: number; // For fractional investments (syndications, partnerships)
  propertyName: string;
  propertyType: 'SFR' | 'MF' | 'CONDO' | 'TOWNHOUSE' | 'APARTMENT' | 'COMMERCIAL_RETAIL' | 'COMMERCIAL_OFFICE' | 'COMMERCIAL_INDUSTRIAL' | 'COMMERCIAL_MIXED' | 'SELF_STORAGE' | 'MOBILE_HOME_PARK' | 'LAND' | 'OTHER';
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
  repairCosts?: number;
  capitalInvestments?: number;
  tenantTurnoverFees?: {
    prepFees: number;
    realtorCommission: number;
  };

  // BRRRR Strategy Fields (Phase 1.3)
  investmentStrategy?: 'buy-hold' | 'brrrr' | 'house-hack';
  brrrr?: BRRRRStrategyData;

  analysis: Analysis;
  confidence?: AnalysisConfidence;
  investmentDecision?: {
    verdict: 'BUY' | 'PASS' | 'NEGOTIATE' | 'CAUTION';
    confidence: number;
    score: number;
    primaryReason: string;
    goalBasedReasoning?: string;
    secondaryReasons: string[];
    keyRisks: string[];
    professionalAssessment?: {
      dealQuality: number;
      executionDifficulty: number;
      dataReliability: number;
      cashFlowScore: number;
      irrScore: number;
      marketStrengthScore: number;
      debtStructureScore: number;
      exitStrategyScore: number;
      capRateScore: number;
      propertyRiskScore: number;
      primaryInsight: string;
      strategicRecommendations: string[];
      riskMitigation: string[];
      opportunityMaximization: string[];
    };
  };
  notes?: Array<{
    text: string;
    createdAt: Date;
    author?: string;
  }>;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }>;
  performanceMetrics?: {
    actualRent?: number;
    actualExpenses?: number;
    occupancyRate?: number;
    updatedAt: Date;
  };
  propertyVisuals?: {
    primaryImageUrl?: string | null;
    streetViewStaticUrl?: string;
    streetViewEmbedUrl?: string;
    staticMapUrl?: string;
    fetchedAt?: Date;
    cacheExpiry?: Date;
    source?: 'google-places' | 'street-view' | 'map-only';
    apiStatus?: 'success' | 'partial' | 'fallback';
  };
  createdAt: Date;
  updatedAt: Date;
}

// SFR specific fields
export interface ISFRDeal extends IDeal {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  maintenanceCost: number;
  longTermAssumptions: LongTermAssumptions;
}

// MF specific fields
export interface IMFDeal extends IDeal {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  maintenanceCostPerUnit: number;
  unitTypes: UnitType[];
  longTermAssumptions: MFLongTermAssumptions;
  commonAreaUtilities: CommonAreaUtilities;
}

// Address schema
const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: false }
});

// Confidence schema
const ConfidenceSchema = new Schema({
  level: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 3,
    default: 1
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  dataSource: { 
    type: String, 
    enum: ['MANUAL', 'QUICK_CALC', 'FULL_ANALYSIS', 'PIPELINE', 'PORTFOLIO'],
    default: 'MANUAL'
  },
  calculationMethod: { 
    type: String, 
    enum: ['NONE', 'BASIC', 'QUICK_METRICS', 'FULL_SFR'],
    default: 'NONE'
  }
});

// Analysis schema
const AnalysisSchema = new Schema({
  monthlyAnalysis: {
    expenses: {
      propertyTax: Number,
      insurance: Number,
      maintenance: Number,
      propertyManagement: Number,
      vacancy: Number,
      tenantTurnover: Number,
      debt: Number,
      operating: Number,
      total: Number,
      breakdown: {
        propertyTax: Number,
        insurance: Number,
        maintenance: Number,
        propertyManagement: Number,
        vacancy: Number,
        tenantTurnover: Number,
        utilities: Number,
        commonAreaElectricity: Number,
        landscaping: Number,
        waterSewer: Number,
        garbage: Number,
        marketingAndAdvertising: Number,
        repairsAndMaintenance: Number,
        capEx: Number,
        other: Number,
        // ✅ SFR-specific operating expenses (Jan 2026 - Issue #1)
        hoa: Number,
        landlordUtilities: Number,
        sfrCapEx: Number
      }
    },
    income: {
      gross: Number,
      effective: Number
    },
    cashFlow: Number
  },
  annualAnalysis: {
    income: Number,
    expenses: Number,
    noi: Number,
    debtService: Number,
    cashFlow: Number,
    // Legacy fields for backward compatibility
    dscr: Number,
    cashOnCashReturn: Number,
    capRate: Number,
    totalInvestment: Number,
    annualNOI: Number,
    annualDebtService: Number,
    effectiveGrossIncome: Number
  },
  longTermAnalysis: {
    projections: [{
      year: Number,
      cashFlow: Number,
      propertyValue: Number,
      equity: Number,
      propertyTax: Number,
      insurance: Number,
      maintenance: Number,
      propertyManagement: Number,
      vacancy: Number,
      turnoverCosts: Number,
      capitalImprovements: Number,
      operatingExpenses: Number,
      noi: Number,
      debtService: Number,
      grossRent: Number,
      grossIncome: Number,
      mortgageBalance: Number,
      appreciation: Number,
      totalReturn: Number,
      principalPaidThisYear: Number,
      totalPrincipalPaidToDate: Number,
      cashOnCashReturnThisYear: Number,
      pricePerSqFtAtThisPoint: Number
    }],
    projectionYears: Number,
    returns: {
      irr: Number,
      totalCashFlow: Number,
      totalAppreciation: Number,
      totalReturn: Number,
      totalInvestment: Number,
      totalAdditionalInvestment: Number
    },
    exitAnalysis: {
      projectedSalePrice: Number,
      sellingCosts: Number,
      mortgagePayoff: Number,
      netProceedsFromSale: Number,
      totalReturn: Number,
      returnOnInvestment: Number
    }
  },
  keyMetrics: {
    noi: Number,
    capRate: Number,
    cashOnCashReturn: Number,
    irr: Number,
    dscr: Number,
    operatingExpenseRatio: Number,
    totalInvestment: Number,
    pricePerSqFt: Number,
    rentPerSqFt: Number,
    pricePerSqFtAtPurchase: Number,
    pricePerSqFtAtSale: Number,
    avgRentPerSqFt: Number,
    expenseRatio: Number,
    breakEvenOccupancy: Number,
    equityMultiple: Number,
    onePercentRuleValue: Number,
    fiftyRuleAnalysis: Boolean,
    rentToPriceRatio: Number,
    pricePerBedroom: Number,
    debtToIncomeRatio: Number,
    grossRentMultiplier: Number,
    returnOnImprovements: Number,
    turnoverCostImpact: Number
  },
  aiInsights: {
    summary: String,
    strengths: [String],
    weaknesses: [String], 
    recommendations: [String],
    investmentScore: Number,
    riskAssessment: String,
    scoreBreakdown: {
      cashFlow: {
        score: Number,
        max: Number,
        reason: String
      },
      marketPosition: {
        score: Number,
        max: Number,
        reason: String
      },
      riskAssessment: {
        score: Number,
        max: Number,
        reason: String
      },
      financialMetrics: {
        score: Number,
        max: Number,
        reason: String
      }
    },
    // Enhanced strategic analysis fields
    marketTrendPrediction: String,
    optimalExitStrategy: Schema.Types.Mixed, // Can be string or object from AI
    recommendedHoldPeriod: String,
    investorFit: String,
    strategicInsights: String,
    competitiveAdvantage: String,
    wealthBuildingPotential: String,
    marketCycleAnalysis: String,
    financingRecommendations: String,
    portfolioFitAnalysis: String,
    opportunityCostAnalysis: String,
    notes: String,
    // Value-add opportunities (flexible schema)
    valueAddOpportunities: [Schema.Types.Mixed],
    // Market positioning and comparative analysis
    comparativeMarketAnalysis: String,
    investorProfileMatch: String,
    riskMitigationStrategies: [String],
    // Unit mix analysis for multifamily
    unitMixAnalysis: String,
    marketPositionAnalysis: String,
    // Bold predictions from enhanced AI analysis
    boldPredictions: {
      wealthCreation: {
        year3Value: String,
        year5Value: String,
        year10Value: String,
        totalWealthCreated: String
      },
      cashFlowGrowth: {
        currentMonthly: String,
        year2Monthly: String,
        year5Monthly: String,
        doubleDate: String,
        reach5kDate: String
      },
      rentGrowthForecast: {
        currentRent: String,
        year3Rent: String,
        year5Rent: String,
        year7Rent: String
      },
      exitStrategy: {
        optimalExitYear: String,
        predictedSalePrice: String,
        totalProfit: String,
        annualizedReturn: String
      }
    },
    
    // Intelligence Multiplier fields
    metricIntelligence: [{
      metricName: String,
      noviceView: String,
      proInsight: String,
      actionItem: String,
      benchmark: String,
      warning: String,
      riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    }],
    riskBlindSpots: [{
      riskType: String,
      description: String,
      probability: String,
      impact: String,
      mitigation: String,
      priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] }
    }],
    opportunityAlternatives: [{
      category: { type: String, enum: ['real_estate', 'investment', 'timing', 'market'] },
      title: String,
      description: String,
      expectedReturn: String,
      riskLevel: String,
      benefit: String
    }],
    advancedStrategies: [{
      strategyType: String,
      title: String,
      description: String,
      implementation: String,
      costEstimate: String,
      expectedROI: String,
      timeframe: String,
      difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
    }],
    competitiveIntelligence: {
      marketInsight: String,
      winningStrategies: [String],
      losingPatterns: [String],
      localTrends: [String],
      investorBehavior: String
    },
    intelligenceScore: Number,
    sophisticationLevel: { type: String, enum: ['novice', 'intermediate', 'advanced', 'professional'] },
    transformationInsights: String,
    professionalEquivalent: String
  },
  sensitivityAnalysis: {
    bestCase: {
      cashFlow: Number,
      cashOnCashReturn: Number,
      totalReturn: Number
    },
    worstCase: {
      cashFlow: Number,
      cashOnCashReturn: Number,
      totalReturn: Number
    }
  },

  // Tax Intelligence Analysis Schema
  taxAnalysis: {
    userTaxProfile: {
      filingStatus: { type: String, enum: ['single', 'married_joint', 'married_separate', 'head_household'] },
      state: String, // Two-letter state code
      federalTaxBracket: Number,
      stateTaxRate: Number,
      capitalGainsHoldingStrategy: { type: String, enum: ['short_term', 'long_term', 'flexible'] },
      depreciation: {
        method: { type: String, enum: ['straight_line'], default: 'straight_line' },
        personalUsePercentage: { type: Number, default: 0 }
      },
      investorType: { type: String, enum: ['individual', 'entity'], default: 'individual' }
    },
    holdPeriodAnalysis: [{
      holdPeriod: Number,
      salePrice: Number,
      originalBasis: Number,
      adjustedBasis: Number,
      capitalGain: Number,
      depreciationRecapture: Number,
      federalCapitalGainsRate: Number,
      stateCapitalGainsRate: Number,
      federalTax: Number,
      stateTax: Number,
      totalTaxLiability: Number,
      netProceedsFromSale: Number,
      totalCashFlow: Number,
      totalReturn: Number,
      afterTaxIRR: Number,
      taxSavingsVsPreviousYear: Number,
      breakEvenHoldPeriod: Boolean
    }],
    optimalHoldPeriod: Number,
    totalTaxSavingsAtOptimal: Number,
    taxOptimizationRecommendations: [String],
    stateArbitrageOpportunities: [String],
    exchange1031Eligibility: {
      eligible: Boolean,
      deferralAmount: Number,
      timelineRequirements: [String],
      minimumExchangeValue: Number
    },
    expertInsights: {
      holdPeriodReasoning: String,
      riskConsiderations: [String],
      opportunityCost: String,
      marketTimingFactors: String
    },
    calculatedAt: { type: Date, default: Date.now },
    taxYear: { type: Number, default: 2025 }
  },

  // NEW: Market Intelligence Data
  marketData: {
    property: {
      rentEstimate: Number,
      rentRange: {
        low: Number,
        high: Number
      },
      valueEstimate: Number,
      valueRange: {
        low: Number,
        high: Number
      },
      capRateEstimate: Number,
      marketPosition: String,
      confidence: Number,
      pricePerSqft: Number,
      lastUpdated: Date,
      dataSource: String
    },
    comparables: [{
      address: String,
      distance: Number,
      salePrice: Number,
      saleDate: Date,
      pricePerSqft: Number,
      bedrooms: Number,
      bathrooms: Number,
      sqft: Number,
      daysOnMarket: Number,
      propertyType: String,
      rentEstimate: Number,
      latitude: Number,
      longitude: Number,
      yearBuilt: Number,
      lotSize: Number
    }],
    marketTrends: {
      zipCode: String,
      city: String,
      state: String,
      medianRent: Number,
      averageRent: Number,
      rentGrowthRate: Number,
      medianSalePrice: Number,
      averageSalePrice: Number,
      priceGrowthRate: Number,
      daysOnMarket: Number,
      inventoryLevel: String,
      priceToRentRatio: Number,
      seasonalTrend: String,
      sampleSize: {
        rentals: Number,
        sales: Number
      },
      lastUpdated: Date,
      dataSource: String
    },
    economicIndicators: {
      currentMortgageRate: Number,
      mortgageRateTrend: String,
      mortgageRateChange: Number,
      inflationRate: Number,
      unemploymentRate: Number,
      housingIndex: Number,
      housingIndexChange: Number,
      economicGrowth: Number,
      federalFundsRate: Number,
      lastUpdated: Date,
      dataSource: String
    },
    lastUpdated: Date,
    dataSource: [String]
  },
  
  marketInsights: [{
    category: String,
    insight: String,
    impact: String,
    confidence: Number,
    dataSource: String,
    metrics: Schema.Types.Mixed,
    recommendation: String
  }],
  
  investmentTiming: {
    recommendation: String,
    confidence: Number,
    reasoning: [String],
    marketCycle: String,
    timingScore: Number,
    riskFactors: [String],
    opportunities: [String],
    marketSignals: {
      interestRateSignal: Number,
      inflationSignal: Number,
      housingSupplySignal: Number,
      economicGrowthSignal: Number,
      overallSignal: Number
    },
    nextReviewDate: Date
  },
  
  // Professional Investment Decision (Investment Decision Engine)
  investmentDecision: {
    verdict: { type: String, enum: ['BUY', 'PASS', 'NEGOTIATE', 'CAUTION'] }, // V3.0 adds CAUTION
    confidence: Number,
    score: Number, // LEGACY - Property quality score 0-100 (deprecated, use professionalAssessment.dealQuality)
    primaryReason: String,
    goalBasedReasoning: String, // V3.0 AI-enhanced reasoning based on user strategy
    secondaryReasons: [String],
    keyRisks: [String],
    // V3.0 Professional Assessment - Critical for Deal Quality scoring
    professionalAssessment: {
      dealQuality: Number, // 0-100 weighted score of deal fundamentals
      executionDifficulty: Number, // 0-100 complexity of executing this investment
      dataReliability: Number, // 0-100 confidence in input data quality
      
      // Factor breakdown (sum = 100%)
      cashFlowScore: Number, // 35% weight - monthly income stability
      irrScore: Number, // 25% weight - total return potential
      marketStrengthScore: Number, // 15% weight - market tier and trends
      debtStructureScore: Number, // 10% weight - financing quality
      exitStrategyScore: Number, // 10% weight - liquidity and exit options
      capRateScore: Number, // 3% weight - current yield vs market
      propertyRiskScore: Number, // 2% weight - property quality and age
      
      // Professional recommendations
      primaryInsight: String,
      strategicRecommendations: [String],
      riskMitigation: [String],
      opportunityMaximization: [String],
      
      // Enhanced debt structure analysis
      debtAnalysis: {
        dscr: Number,
        interestRate: Number,
        marketSpread: Number, // in basis points
        leverageRatio: Number,
        loanTerm: Number,
        isBalloonLoan: Boolean,
        balloonYears: Number,
        riskFactors: [String],
        strengthFactors: [String]
      }
    },
    actionPlan: [{
      action: String,
      priority: { type: String, enum: ['immediate', 'short-term', 'long-term'] },
      impact: String,
      effort: { type: String, enum: ['low', 'medium', 'high'] },
      expectedOutcome: String,
      timeframe: String
    }],
    capitalStrategy: {
      currentApproach: {
        description: String,
        cashRequired: Number,
        expectedReturn: Number,
        efficiency: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] }
      },
      recommendedApproach: {
        description: String,
        cashRequired: Number,
        expectedReturn: Number,
        efficiency: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] }
      },
      opportunityCost: {
        annualCost: Number,
        description: String,
        alternativeUse: String
      },
      portfolioStrategy: String
    },
    alternativeOptions: [{
      type: { type: String, enum: ['better_deal', 'market_timing', 'different_strategy', 'diversification'] },
      title: String,
      description: String,
      expectedReturn: String,
      riskLevel: { type: String, enum: ['lower', 'similar', 'higher'] },
      timeframe: String
    }],
    marketContext: {
      marketStage: { type: String, enum: ['early', 'mid', 'late', 'correction'] },
      pricingContext: { type: String, enum: ['undervalued', 'fair', 'overvalued', 'bubble'] },
      competitiveIntensity: { type: String, enum: ['low', 'moderate', 'high', 'extreme'] },
      recommendedStrategy: String
    },
    timeline: {
      immediateActions: [String],
      shortTermActions: [String],
      longTermStrategy: [String]
    },
    portfolioContext: {
      portfolioId: String,
      portfolioName: String,
      portfolioGoal: String,
      currentProperties: Number,
      monthlyNetCashFlow: Number,
      totalValue: Number,
      fitAnalysis: String,
      impactSummary: String
    }
  },

  // Strategy-Specific Analysis Results (Phase 1.3)
  // For BRRRR: Contains BRRRRAnalysis object
  // For House Hack: Contains house hack specific data
  // For Buy & Hold: Undefined/null
  strategySpecific: {
    type: Schema.Types.Mixed,
    required: false
  }
});

// Base schema for all deals
const DealSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: false,
    index: true
  },
  ownershipPercentage: {
    type: Number,
    required: false,
    min: 0.1,
    max: 100,
    default: 100 // Default to 100% ownership
  },
  propertyName: { type: String, required: true },
  propertyType: { 
    type: String, 
    enum: [
      'SFR', 
      'MF', 
      'CONDO', 
      'TOWNHOUSE', 
      'APARTMENT', 
      'COMMERCIAL_RETAIL', 
      'COMMERCIAL_OFFICE', 
      'COMMERCIAL_INDUSTRIAL', 
      'COMMERCIAL_MIXED', 
      'SELF_STORAGE', 
      'MOBILE_HOME_PARK', 
      'LAND', 
      'OTHER'
    ], 
    required: true 
  },
  propertyAddress: { type: AddressSchema, required: true },
  purchasePrice: { type: Number, required: true },
  downPayment: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  loanTerm: { type: Number, required: true },
  propertyTaxRate: { type: Number, required: true },
  insuranceRate: { type: Number, required: true },
  propertyManagementRate: { type: Number, required: true },
  yearBuilt: { type: Number, required: true },
  closingCosts: { type: Number },
  repairCosts: { type: Number },
  capitalInvestments: { type: Number, default: 0 },
  tenantTurnoverFees: {
    prepFees: { type: Number, default: 500 },
    realtorCommission: { type: Number, default: 0.5 }
  },

  // BRRRR Strategy Fields (Phase 1.3)
  investmentStrategy: {
    type: String,
    enum: ['buy-hold', 'brrrr', 'house-hack'],
    default: 'buy-hold',
    required: false
  },

  brrrr: {
    rehabBudget: {
      type: Number,
      required: function() { return this.investmentStrategy === 'brrrr'; },
      min: 0
    },
    afterRepairValue: {
      type: Number,
      required: function() { return this.investmentStrategy === 'brrrr'; },
      min: 0
    },
    refinanceLTV: {
      type: Number,
      required: false,
      min: 65,
      max: 80,
      default: 75
    },
    seasoningPeriod: {
      type: Number,
      required: false,
      min: 6,
      max: 24,
      default: 12
    },
    estimatedRehabTime: {
      type: Number,
      required: false,
      min: 1
    },
    arvAppraisalConfidence: {
      type: String,
      required: false,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    }
  },

  // SFR specific fields with conditional validation
  monthlyRent: { 
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },
  squareFootage: { 
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },
  bedrooms: { 
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },
  bathrooms: { 
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },
  maintenanceCost: {
    type: Number,
    required: function() { return this.propertyType === 'SFR'; }
  },

  // ✅ NEW: Universal Operating Expenses (January 2026 - Buy & Hold Enhancement)
  // These fields apply to SFR properties and enable granular expense tracking
  // Field names match frontend: monthlyHOA, monthlyUtilities, monthlyCapEx
  monthlyHOA: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  monthlyUtilities: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  monthlyCapEx: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  // Issue #58: Insurance & Property Tax Dollar Amounts for UI Persistence
  monthlyInsurance: {
    type: Number,
    required: false,
    default: undefined,
    min: 0
  },
  annualPropertyTax: {
    type: Number,
    required: false,
    default: undefined,
    min: 0
  },

  // MF specific fields with conditional validation
  totalUnits: { 
    type: Number,
    required: function() { return this.propertyType === 'MF'; }
  },
  totalSqft: { 
    type: Number,
    required: function() { return this.propertyType === 'MF'; }
  },
  maintenanceCostPerUnit: { 
    type: Number,
    required: function() { return this.propertyType === 'MF'; }
  },
  unitTypes: { 
    type: [Schema.Types.Mixed],
    required: function() { return this.propertyType === 'MF'; }
  },
  commonAreaUtilities: { 
    type: Schema.Types.Mixed,
    required: function() { return this.propertyType === 'MF'; }
  },
  
  // Common fields for both types
  longTermAssumptions: { type: Schema.Types.Mixed, required: true },
  analysis: { type: AnalysisSchema },
  confidence: { type: ConfidenceSchema },

  // Property Visuals (Feature #9: Google Maps Integration)
  propertyVisuals: {
    primaryImageUrl: { type: String, default: null },
    streetViewStaticUrl: { type: String },
    streetViewEmbedUrl: { type: String },
    staticMapUrl: { type: String },
    fetchedAt: { type: Date },
    cacheExpiry: { type: Date },
    source: {
      type: String,
      enum: ['google-places', 'street-view', 'map-only'],
      required: false  // FSE Fix: Optional field, omit if visual fetch fails
    },
    apiStatus: {
      type: String,
      enum: ['success', 'partial', 'fallback'],
      required: false  // FSE Fix: Optional field, omit if visual fetch fails
    }
  },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  discriminatorKey: 'propertyType',
  strict: false  // Allow additional fields for new property types (COMMERCIAL, STORAGE, etc.)
});

// BRRRR Strategy Indexes (Phase 1.3 - Simplified per Architect feedback)
// Index 1: Strategy filtering (simple queries like "show me all BRRRR deals")
DealSchema.index({ investmentStrategy: 1 });

// Index 2: User + Strategy (most common query: "show me MY BRRRR deals")
DealSchema.index({ userId: 1, investmentStrategy: 1 });

// Indexes 3 & 4: Supports magic-link email personalization
// "most recent deal for user" and "deals created this month" — see dealEmailHelper.
DealSchema.index({ userId: 1, updatedAt: -1 });
DealSchema.index({ userId: 1, createdAt: -1 });

// DEFERRED indexes (add when >1K BRRRR deals):
// - BRRRR Leaderboard: { investmentStrategy: 1, 'analysis.strategySpecific.capitalRecovery.capitalRecoveryRate': -1 }
// - ARV Analysis: { investmentStrategy: 1, 'brrrr.afterRepairValue': -1 }

// Create the base model
const DealModel = mongoose.model<IDeal>('Deal', DealSchema);

// Create discriminators for the different property types
const SFRDeal = DealModel.discriminator<ISFRDeal>(
  'SFR',
  new Schema({
    // SFR specific validation can go here
  })
);

const MFDeal = DealModel.discriminator<IMFDeal>(
  'MF',
  new Schema({
    // MF specific validation can go here
  })
);

export { DealModel, SFRDeal, MFDeal }; 