import { useState, useCallback } from 'react';
import { dealDAO } from '../services/dao/DealDAO';
import { DealData, PropertyType, SavedDeal } from '../types/deal';
import { Analysis } from '../types/analysis';

/**
 * Custom hook for accessing DealDAO functionality with loading and error states
 */
export const useDealDAO = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get all deals
   */
  const getAllDeals = useCallback(async (): Promise<SavedDeal[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const deals = await dealDAO.getAllDeals();
      return deals;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get deals by property type
   */
  const getDealsByType = useCallback(async (propertyType: PropertyType): Promise<SavedDeal[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const deals = await dealDAO.getDealsByType(propertyType);
      return deals;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a deal by ID
   */
  const getDealById = useCallback(async (id: string): Promise<SavedDeal | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const deal = await dealDAO.getDealById(id);
      return deal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save a deal
   */
  const saveDeal = useCallback(async (
    dealData: DealData, 
    analysisResult: Analysis | null
  ): Promise<SavedDeal | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const deal = await dealDAO.saveDeal(dealData, analysisResult);
      return deal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a deal
   */
  const deleteDeal = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await dealDAO.deleteDeal(id);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Analyze a deal
   */
  const analyzeDeal = useCallback(async (dealData: DealData): Promise<Analysis | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await dealDAO.analyzeDeal(dealData);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAllDeals,
    getDealsByType,
    getDealById,
    saveDeal,
    deleteDeal,
    analyzeDeal,
    clearError: () => setError(null)
  };
}; 