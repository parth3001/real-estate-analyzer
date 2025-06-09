import { DealRepository } from '../repositories/DealRepository';
import { SFRData, MultiFamilyData, AnalysisResult, CommonMetrics } from '../types/propertyTypes';
import { IDeal } from '../models/Deal';
import { logger } from '../utils/logger';

/**
 * Service for deal operations
 */
export class DealService {
  private dealRepository: DealRepository;

  constructor() {
    this.dealRepository = new DealRepository();
  }

  /**
   * Get a deal by ID
   * @param id - Deal ID
   * @returns Deal or null if not found
   */
  async getDealById(id: string): Promise<IDeal | null> {
    try {
      return await this.dealRepository.findById(id);
    } catch (error) {
      logger.error('Error getting deal by ID:', error);
      throw error;
    }
  }

  /**
   * Get all deals
   * @param userId - Optional user ID to filter by
   * @returns Array of deals
   */
  async getAllDeals(userId?: string): Promise<IDeal[]> {
    try {
      return await this.dealRepository.findAll(userId);
    } catch (error) {
      logger.error('Error getting all deals:', error);
      throw error;
    }
  }

  /**
   * Save a new deal
   * @param dealData - Deal data (SFR or MF)
   * @param analysis - Analysis results
   * @param userId - Optional user ID
   * @returns The created deal
   */
  async saveDeal(
    dealData: SFRData | MultiFamilyData,
    analysis: AnalysisResult<CommonMetrics>,
    userId?: string
  ): Promise<IDeal> {
    try {
      // If the deal has an ID, update it
      if (dealData.id) {
        const updatedDeal = await this.dealRepository.update(
          dealData.id,
          dealData,
          analysis
        );
        
        if (!updatedDeal) {
          throw new Error(`Deal with ID ${dealData.id} not found`);
        }
        
        return updatedDeal;
      }
      
      // Otherwise create a new deal
      return await this.dealRepository.create(dealData, analysis, userId);
    } catch (error) {
      logger.error('Error saving deal:', error);
      throw error;
    }
  }

  /**
   * Update an existing deal
   * @param id - Deal ID
   * @param dealData - Deal data to update
   * @param analysis - Updated analysis results
   * @returns The updated deal or null if not found
   */
  async updateDeal(
    id: string,
    dealData: Partial<SFRData | MultiFamilyData>,
    analysis?: AnalysisResult<CommonMetrics>
  ): Promise<IDeal | null> {
    try {
      return await this.dealRepository.update(id, dealData, analysis);
    } catch (error) {
      logger.error('Error updating deal:', error);
      throw error;
    }
  }

  /**
   * Delete a deal
   * @param id - Deal ID
   * @returns True if successful, false if not found
   */
  async deleteDeal(id: string): Promise<boolean> {
    try {
      return await this.dealRepository.delete(id);
    } catch (error) {
      logger.error('Error deleting deal:', error);
      throw error;
    }
  }

  /**
   * Search for deals
   * @param searchParams - Search parameters object
   * @returns Array of matching deals
   */
  async searchDeals(searchParams: Record<string, any>): Promise<IDeal[]> {
    try {
      // Build a MongoDB query from the search parameters
      const query: Record<string, any> = {};
      
      // Handle property type
      if (searchParams.propertyType) {
        query.propertyType = searchParams.propertyType;
      }
      
      // Handle property address search
      if (searchParams.location) {
        query['propertyAddress.city'] = { $regex: searchParams.location, $options: 'i' };
      }
      
      // Handle price range
      if (searchParams.minPrice || searchParams.maxPrice) {
        query.purchasePrice = {};
        
        if (searchParams.minPrice) {
          query.purchasePrice.$gte = searchParams.minPrice;
        }
        
        if (searchParams.maxPrice) {
          query.purchasePrice.$lte = searchParams.maxPrice;
        }
      }
      
      // Handle other search parameters as needed
      
      return await this.dealRepository.search(query);
    } catch (error) {
      logger.error('Error searching deals:', error);
      throw error;
    }
  }
} 