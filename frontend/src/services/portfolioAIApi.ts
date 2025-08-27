import api from './api';

// Type definitions for AI insights
export interface HealthCheckInsights {
  biggestRisk: {
    title: string;
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    impact: string;
  };
  bestOpportunity: {
    title: string;
    description: string;
    potentialImpact: string;
    timeframe: string;
  };
  actionThisMonth: {
    action: string;
    why: string;
    expectedResult: string;
  };
}

export interface PeerComparisonInsights {
  outperforming: {
    metrics: string[];
    advantage: string;
  };
  lagging: {
    metrics: string[];
    gap: string;
  };
  whyItMatters: {
    strengths: string;
    concerns: string;
    longTermImpact: string;
  };
}

export interface GoalPathInsights {
  propertiesNeeded: {
    count: number;
    types: string[];
    avgPrice: number;
  };
  targetLocations: {
    primary: string;
    secondary: string;
    reasoning: string;
  };
  capitalRequired: {
    totalInvestment: number;
    downPayments: number;
    reserves: number;
    closingCosts: number;
  };
  timeline: {
    year1: string;
    year2: string;
    year3: string;
  };
}

export interface ComprehensiveInsights {
  healthCheck: HealthCheckInsights;
  peerComparison: PeerComparisonInsights;
  goalPath: GoalPathInsights;
}

// AI insights loading states
export interface AIInsightsState {
  healthCheck: {
    data: HealthCheckInsights | null;
    loading: boolean;
    error: string | null;
  };
  peerComparison: {
    data: PeerComparisonInsights | null;
    loading: boolean;
    error: string | null;
  };
  goalPath: {
    data: GoalPathInsights | null;
    loading: boolean;
    error: string | null;
  };
  comprehensive: {
    data: ComprehensiveInsights | null;
    loading: boolean;
    error: string | null;
  };
}

/**
 * Portfolio AI API Service
 * Handles all AI insights API calls for portfolios
 */
export class PortfolioAIApi {
  
  /**
   * Get portfolio health check insights
   */
  static async getHealthCheck(portfolioId: string): Promise<{ healthCheck: HealthCheckInsights; generated: string }> {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/health-check`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching health check:', error);
      throw new Error(error.response?.data?.error || 'Failed to get health check insights');
    }
  }
  
  /**
   * Get peer comparison insights
   */
  static async getPeerComparison(portfolioId: string): Promise<{ peerComparison: PeerComparisonInsights; generated: string }> {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/peer-comparison`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching peer comparison:', error);
      throw new Error(error.response?.data?.error || 'Failed to get peer comparison insights');
    }
  }
  
  /**
   * Get goal achievement path insights
   */
  static async getGoalPath(portfolioId: string): Promise<{ goalPath: GoalPathInsights; generated: string }> {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/goal-path`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching goal path:', error);
      throw new Error(error.response?.data?.error || 'Failed to get goal achievement path');
    }
  }
  
  /**
   * Get comprehensive AI insights (all three types)
   */
  static async getComprehensiveInsights(portfolioId: string): Promise<{ insights: ComprehensiveInsights; generated: string }> {
    try {
      const response = await api.get(`/portfolios/${portfolioId}/comprehensive-insights`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching comprehensive insights:', error);
      throw new Error(error.response?.data?.error || 'Failed to get comprehensive insights');
    }
  }
  
  /**
   * Get all insights individually (for better error handling and loading states)
   */
  static async getAllInsightsIndividually(portfolioId: string): Promise<{
    healthCheck: HealthCheckInsights | null;
    peerComparison: PeerComparisonInsights | null;
    goalPath: GoalPathInsights | null;
    errors: string[];
  }> {
    const results = {
      healthCheck: null as HealthCheckInsights | null,
      peerComparison: null as PeerComparisonInsights | null,
      goalPath: null as GoalPathInsights | null,
      errors: [] as string[]
    };
    
    // Fetch all insights in parallel but handle errors individually
    const promises = [
      this.getHealthCheck(portfolioId).then(result => {
        results.healthCheck = result.healthCheck;
      }).catch(error => {
        results.errors.push(`Health Check: ${error.message}`);
      }),
      
      this.getPeerComparison(portfolioId).then(result => {
        results.peerComparison = result.peerComparison;
      }).catch(error => {
        results.errors.push(`Peer Comparison: ${error.message}`);
      }),
      
      this.getGoalPath(portfolioId).then(result => {
        results.goalPath = result.goalPath;
      }).catch(error => {
        results.errors.push(`Goal Path: ${error.message}`);
      })
    ];
    
    await Promise.allSettled(promises);
    return results;
  }
}

// Helper functions for formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const getSeverityColor = (severity: 'HIGH' | 'MEDIUM' | 'LOW'): string => {
  switch (severity) {
    case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'info';
  }
};

export const getSeverityIcon = (severity: 'HIGH' | 'MEDIUM' | 'LOW'): string => {
  switch (severity) {
    case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'check_circle';
    default: return 'info';
  }
};