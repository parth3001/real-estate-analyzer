/**
 * Calculator Service
 *
 * Handles API calls to /analyze-anonymous endpoint for public calculators
 * No authentication required - for BRRRR and Buy & Hold strategies
 */

import type { SFRPropertyData } from '../../types/property';
import type { Analysis } from '../../types/analysis';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface AnonymousAnalysisResponse {
  success: boolean;
  analysis: Analysis;
  isAnonymous: true;
  message: string;
}

/**
 * Analyze property anonymously (no auth required)
 * Used by Universal Calculator for BRRRR and Buy & Hold
 */
export const analyzeAnonymous = async (
  propertyData: Partial<SFRPropertyData>
): Promise<AnonymousAnalysisResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/deals/analyze-anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data: AnonymousAnalysisResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Anonymous analysis failed:', error);
    throw error;
  }
};

/**
 * Save anonymous analysis to localStorage for conversion flow
 * When user creates account, we can retrieve and save their analysis
 */
export const saveAnonymousAnalysis = (
  propertyData: Partial<SFRPropertyData>,
  analysis: Analysis
): void => {
  try {
    const savedAnalysis = {
      propertyData,
      analysis,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('pendingAnalysis', JSON.stringify(savedAnalysis));
  } catch (error) {
    console.error('Failed to save analysis to localStorage:', error);
  }
};

/**
 * Retrieve pending analysis from localStorage
 * Used after user creates account to save their work
 */
export const getPendingAnalysis = (): {
  propertyData: Partial<SFRPropertyData>;
  analysis: Analysis;
  timestamp: string;
} | null => {
  try {
    const saved = localStorage.getItem('pendingAnalysis');
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to retrieve pending analysis:', error);
    return null;
  }
};

/**
 * Clear pending analysis from localStorage
 * Called after successfully saving to database
 */
export const clearPendingAnalysis = (): void => {
  try {
    localStorage.removeItem('pendingAnalysis');
  } catch (error) {
    console.error('Failed to clear pending analysis:', error);
  }
};
