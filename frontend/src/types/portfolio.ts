// Portfolio Types for Real Estate Investment Platform
// Simplified 80/20 approach matching backend implementation

export interface IPortfolioGoals {
  primaryGoal: 'CASH_FLOW' | 'WEALTH_BUILDING' | 'ESTATE_BUILDING' | 'INFLATION_HEDGE' | 'DIVERSIFICATION' | 'REIT_ALTERNATIVE' | 'OPPORTUNISTIC';
  targetMonthlyIncome?: number;
  targetNetWorth?: number;
  targetTimeline?: string;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}

export interface IPortfolioSettings {
  includeInSFRAnalysis: boolean;
  alertsEnabled: boolean;
  currency: 'USD';
}

export interface IPortfolio {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  goals: IPortfolioGoals;
  settings: IPortfolioSettings;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  description?: string;
  primaryGoal: string;
  riskTolerance: string;
  totalProperties: number;
  monthlyNetCashFlow: number;
  totalValue: number;
  status: string;
  createdAt: Date;
  lastAnalyticsUpdate?: Date;
}

export interface IPortfolioAnalytics {
  _id: string;
  portfolioId: string;
  summary: {
    totalValue: number;
    totalEquity: number;
    totalDebt: number;
    monthlyNetCashFlow: number;
    averageCapRate: number;
    averageCashOnCash: number;
    totalInvestment: number;
    portfolioIRR: number;
    totalProperties: number;
  };
  riskAnalysis: {
    concentrationRisk: number;
    geographicDiversification: number;
    leverageRisk: number;
    cashFlowStability: number;
    vacancyRisk: number;
    marketCorrelation: number;
  };
  goalProgress: {
    currentVsTarget: number;
    projectedTimeToGoal: number;
    recommendedAdjustments: string[];
  };
  aiInsights?: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskAssessment: string;
    marketOpportunities: string[];
  };
  calculatedAt: Date;
}

export interface IPortfolioRecommendation {
  _id: string;
  portfolioId: string;
  type: 'PORTFOLIO_OPTIMIZATION' | 'PROPERTY_ACQUISITION' | 'RISK_REDUCTION' | 'CASH_FLOW_IMPROVEMENT' | 'GOAL_ALIGNMENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  reasoning: string;
  impact: {
    expectedCashFlowIncrease?: number;
    riskReduction?: number;
    timeToImplement?: string;
    costEstimate?: number;
  };
  actionPlan: {
    immediateActions: string[];
    timeline: string;
    resources: string[];
  };
  status: 'PENDING' | 'VIEWED' | 'DISMISSED' | 'IMPLEMENTED';
  expiresAt: Date;
  createdAt: Date;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  goals: IPortfolioGoals;
  settings?: {
    includeInSFRAnalysis?: boolean;
    alertsEnabled?: boolean;
  };
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  goals?: Partial<IPortfolioGoals>;
  settings?: {
    includeInSFRAnalysis?: boolean;
    alertsEnabled?: boolean;
  };
}

export interface PortfolioDetails {
  portfolio: IPortfolio;
  analytics?: IPortfolioAnalytics;
  recommendations: IPortfolioRecommendation[];
  properties: any[]; // Will be Deal objects with analysis
  totalProperties: number;
}

// API Response Types
export interface PortfolioApiResponse {
  success: boolean;
  portfolio: IPortfolio;
}

export interface PortfoliosListResponse {
  success: boolean;
  portfolios: PortfolioSummary[];
}

export interface PortfolioDetailsResponse {
  success: boolean;
  portfolio: IPortfolio;
  analytics?: IPortfolioAnalytics;
  recommendations: IPortfolioRecommendation[];
  properties: any[];
  totalProperties: number;
}

// Legacy types (for backward compatibility)
export type RiskTolerance = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
export type PortfolioStatus = 'ACTIVE' | 'ARCHIVED';