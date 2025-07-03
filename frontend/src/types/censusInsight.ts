/**
 * Census Insight Type for the Real Estate Analyzer
 */

// Census-based insights for AI analysis
export interface CensusInsight {
  type: 'positive' | 'negative' | 'neutral';
  text: string;
  category: 'value' | 'rent' | 'demographic' | 'market' | 'general';
  confidence?: number;
  source?: string;
}
