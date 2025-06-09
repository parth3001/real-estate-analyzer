import { dealRepository, DealRepository } from '../repositories/DealRepository';
import { IDeal, ISFRDeal, IMFDeal } from '../models/Deal';
import { logger } from '../utils/logger';

export class DealService {
  private repository: DealRepository;

  constructor(repository = dealRepository) {
    this.repository = repository;
  }

  /**
   * Get a deal by ID
   */
  async getDealById(id: string): Promise<IDeal | null> {
    try {
      logger.info(`[DealService] Getting deal with ID: ${id}`);
      return await this.repository.findById(id);
    } catch (error) {
      logger.error('[DealService] Error getting deal by ID:', error);
      throw error;
    }
  }

  /**
   * Get all deals
   */
  async getAllDeals(userId?: string): Promise<IDeal[]> {
    try {
      logger.info(`[DealService] Getting all deals${userId ? ' for user: ' + userId : ''}`);
      return await this.repository.findAll(userId);
    } catch (error) {
      logger.error('[DealService] Error getting all deals:', error);
      throw error;
    }
  }

  /**
   * Get deals by property type
   */
  async getDealsByType(propertyType: 'SFR' | 'MF', userId?: string): Promise<IDeal[]> {
    try {
      logger.info(`[DealService] Getting ${propertyType} deals${userId ? ' for user: ' + userId : ''}`);
      return await this.repository.findByPropertyType(propertyType, userId);
    } catch (error) {
      logger.error(`[DealService] Error getting ${propertyType} deals:`, error);
      throw error;
    }
  }

  /**
   * Save a deal (create or update)
   */
  async saveDeal(dealData: Partial<IDeal>): Promise<IDeal> {
    try {
      const isUpdate = !!dealData._id;
      logger.info(`[DealService] ${isUpdate ? 'Updating' : 'Creating'} deal: ${dealData.propertyName}`);

      if (isUpdate) {
        const id = dealData._id!.toString();
        const updatedDeal = await this.repository.update(id, dealData);
        
        if (!updatedDeal) {
          throw new Error(`Deal with ID ${id} not found`);
        }
        
        return updatedDeal;
      } else {
        // Create new deal based on property type
        if (dealData.propertyType === 'SFR') {
          return await this.repository.createSFR(dealData as Partial<ISFRDeal>);
        } else if (dealData.propertyType === 'MF') {
          return await this.repository.createMF(dealData as Partial<IMFDeal>);
        } else {
          throw new Error(`Invalid property type: ${dealData.propertyType}`);
        }
      }
    } catch (error) {
      logger.error('[DealService] Error saving deal:', error);
      throw error;
    }
  }

  /**
   * Delete a deal
   */
  async deleteDeal(id: string): Promise<boolean> {
    try {
      logger.info(`[DealService] Deleting deal with ID: ${id}`);
      return await this.repository.delete(id);
    } catch (error) {
      logger.error('[DealService] Error deleting deal:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dealService = new DealService(); 