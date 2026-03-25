/**
 * Analytics Types
 *
 * TypeScript interfaces for platform analytics and usage metrics
 */

export interface AnalyticsSummary {
  calculatorSubmissions: number;
  wizardSubmissions: number;
  userRegistrations: number;
  userLogins: number;
  dealsAnalyzed: number;
  dealsSaved: number;
  environment: string;
  period: {
    start: string;
    end: string;
  };
}

export interface AnalyticsResponse {
  message: string;
  data: AnalyticsSummary;
  period: string;
}

export type AnalyticsTimePeriod = 7 | 30 | 90;
