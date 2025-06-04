import { SavedDeal, SFRDealData } from '../types/deal';
import { v4 as uuidv4 } from 'uuid';
import type { AnalysisResult, SFRMetrics } from '../types/backendTypes';
import { Logger } from '../utils/logger';

// This will be replaced with actual API calls when we move to database
const STORAGE_KEY = 'savedDeals';
const CURRENT_DEAL_KEY = 'currentDeal';

export class DealService {
  static async getDealById(id: string): Promise<SavedDeal | null> {
    try {
      // TODO: Will be replaced with API call
      const dealsStr = localStorage.getItem(STORAGE_KEY);
      const deals: SavedDeal[] = dealsStr ? JSON.parse(dealsStr) : [];
      return deals.find(deal => deal.id === id) || null;
    } catch (error) {
      Logger.error('Error getting deal:', error);
      return null;
    }
  }

  static async saveDeal(
    dealData: SFRDealData, 
    analysisResult: AnalysisResult<SFRMetrics> | null
  ): Promise<SavedDeal | null> {
    try {
      const deals: SavedDeal[] = await this.getAllDeals();
      
      const dealName = dealData.propertyAddress.street 
        ? `${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}`
        : 'Untitled Deal';

      // Check if we're updating an existing deal
      const existingDealIndex = dealData.id 
        ? deals.findIndex(d => d.id === dealData.id)
        : -1;

      const deal: SavedDeal = {
        id: dealData.id || uuidv4(),
        name: dealName,
        type: 'SFR',
        data: {
          ...dealData,
          id: dealData.id, // Preserve ID in data
          analysisResult: analysisResult || undefined
        },
        savedAt: existingDealIndex >= 0 ? deals[existingDealIndex].savedAt : new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      if (existingDealIndex >= 0) {
        deals[existingDealIndex] = deal;
      } else {
        deals.push(deal);
      }

      // TODO: Will be replaced with API call
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
      return deal;
    } catch (error) {
      Logger.error('Error saving deal:', error);
      return null;
    }
  }

  static async getAllDeals(): Promise<SavedDeal[]> {
    try {
      // TODO: Will be replaced with API call
      const dealsStr = localStorage.getItem(STORAGE_KEY);
      return dealsStr ? JSON.parse(dealsStr) : [];
    } catch (error) {
      Logger.error('Error getting all deals:', error);
      return [];
    }
  }

  static async deleteDeal(id: string): Promise<boolean> {
    try {
      // TODO: Will be replaced with API call
      const deals = await this.getAllDeals();
      const filteredDeals = deals.filter(deal => deal.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDeals));
      return true;
    } catch (error) {
      Logger.error('Error deleting deal:', error);
      return false;
    }
  }

  static async setCurrentDeal(deal: SavedDeal): Promise<void> {
    try {
      // TODO: Will be replaced with session management
      localStorage.setItem(CURRENT_DEAL_KEY, JSON.stringify(deal));
    } catch (error) {
      Logger.error('Error setting current deal:', error);
    }
  }

  static async getCurrentDeal(): Promise<SavedDeal | null> {
    try {
      // TODO: Will be replaced with session management
      const dealStr = localStorage.getItem(CURRENT_DEAL_KEY);
      return dealStr ? JSON.parse(dealStr) : null;
    } catch (error) {
      Logger.error('Error getting current deal:', error);
      return null;
    }
  }

  static async clearCurrentDeal(): Promise<void> {
    try {
      // TODO: Will be replaced with session management
      localStorage.removeItem(CURRENT_DEAL_KEY);
    } catch (error) {
      Logger.error('Error clearing current deal:', error);
    }
  }
} 