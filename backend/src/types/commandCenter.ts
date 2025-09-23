// Command Center Dashboard Types
// Focused on immediate actions and status awareness

export interface UrgentAction {
  id: string;
  type: 'DEAL_EXPIRING' | 'ANALYSIS_READY' | 'NEGATIVE_CASHFLOW' | 'MARKET_OPPORTUNITY';
  title: string;
  description: string;
  daysUntilExpiry?: number;
  severity: 'high' | 'medium' | 'low';
  actionUrl: string;
  actionLabel: string;
  metadata?: {
    dealId?: string;
    analysisId?: string;
    portfolioId?: string;
    estimatedValue?: number;
    dealQuality?: number;
    verdict?: string;
  };
}

export interface ReviewItem {
  id: string;
  type: 'COMPLETED_ANALYSIS' | 'PORTFOLIO_UPDATE' | 'MARKET_CHANGE';
  title: string;
  description: string;
  completedAt: string;
  actionUrl: string;
  actionLabel: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: {
    dealQuality?: number;
    verdict?: string;
    dealId?: string;
  };
}

export interface PipelineDealSummary {
  id: string;
  dealName: string;
  currentStage: 'LEAD' | 'ANALYSIS' | 'NEGOTIATION' | 'CONTRACT' | 'CLOSED' | 'LOST';
  stageProgress: number;
  daysInStage: number;
  nextAction?: string;
  isUrgent: boolean;
  askingPrice: number;
  location: string;
}

export interface ActivityItem {
  id: string;
  type: 'DEAL_ADDED' | 'ANALYSIS_COMPLETED' | 'PROPERTY_PURCHASED' | 'MARKET_ALERT';
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
  icon: string;
}

export interface QuickWin {
  id: string;
  type: 'REFINANCE_OPPORTUNITY' | 'MARKET_TIMING' | 'PORTFOLIO_OPTIMIZATION' | 'TAX_SAVING';
  title: string;
  description: string;
  estimatedValue: number;
  effort: 'low' | 'medium' | 'high';
  actionUrl: string;
  actionLabel: string;
}

export interface PortfolioSummary {
  totalValue: number;
  monthlyNetCashFlow: number;
  totalProperties: number;
  portfolioCount: number;
  healthScore: number; // 0-100
  alerts: {
    urgent: number;
    review: number;
    info: number;
  };
}

export interface CommandCenterData {
  success: boolean;
  portfolioSummary: PortfolioSummary;
  urgentActions: UrgentAction[];
  reviewItems: ReviewItem[];
  activePipeline: PipelineDealSummary[];
  recentActivity: ActivityItem[];
  quickWins: QuickWin[];
  lastUpdated: string;
}

// Focused Dashboard Data for Investment Decision Center
export interface FocusedDashboardData {
  success: boolean;
  urgentDecision: UrgentAction | ReviewItem | null;
  nextInPipeline: PipelineDealSummary | null;
  marketContext: MarketContext | null;
  lastUpdated: string;
}

export interface MarketContext {
  location: string;
  avgRent: number;
  trendPercentage: number;
}