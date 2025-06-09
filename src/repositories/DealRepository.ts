import Deal, { IDeal } from '../models/Deal';
import { logger } from '../utils/logger';
import { SFRData, MultiFamilyData, AnalysisResult, CommonMetrics } from '../types/propertyTypes';
import { FilterQuery } from 'mongoose';

/**
 * Repository for Deal model operations
 */
export class DealRepository {
  /**
   * Find a deal by ID
   * @param id - Deal ID
   * @returns The deal document or null if not found
   */
  async findById(id: string): Promise<IDeal | null> {
    try {
      return await Deal.findById(id);
    } catch (error) {
      logger.error('Error finding deal by ID:', error);
      throw error;
    }
  }

  /**
   * Find all deals
   * @param userId - Optional user ID to filter by
   * @returns Array of deal documents
   */
  async findAll(userId?: string): Promise<IDeal[]> {
    try {
      const query = userId ? { userId } : {};
      return await Deal.find(query).sort({ updatedAt: -1 });
    } catch (error) {
      logger.error('Error finding all deals:', error);
      throw error;
    }
  }

  /**
   * Create a new deal
   * @param dealData - Deal data (SFR or MF)
   * @param analysis - Analysis results
   * @param userId - Optional user ID
   * @returns The created deal document
   */
  async create(
    dealData: SFRData | MultiFamilyData, 
    analysis: AnalysisResult<CommonMetrics>,
    userId?: string
  ): Promise<IDeal> {
    try {
      const newDeal = new Deal({
        ...dealData,
        analysis,
        userId,
      });
      
      return await newDeal.save();
    } catch (error) {
      logger.error('Error creating deal:', error);
      throw error;
    }
  }

  /**
   * Update an existing deal
   * @param id - Deal ID
   * @param dealData - Deal data to update
   * @param analysis - Updated analysis results
   * @returns The updated deal document or null if not found
   */
  async update(
    id: string, 
    dealData: Partial<SFRData | MultiFamilyData>,
    analysis?: AnalysisResult<CommonMetrics>
  ): Promise<IDeal | null> {
    try {
      const updateData: any = { ...dealData };
      
      if (analysis) {
        updateData.analysis = analysis;
      }
      
      // Set updatedAt timestamp
      updateData.updatedAt = new Date();
      
      return await Deal.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true } // Return the updated document
      );
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
  async delete(id: string): Promise<boolean> {
    try {
      const result = await Deal.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('Error deleting deal:', error);
      throw error;
    }
  }

  /**
   * Search for deals
   * @param query - Search parameters
   * @returns Array of matching deals
   */
  async search(query: FilterQuery<IDeal>): Promise<IDeal[]> {
    try {
      return await Deal.find(query).sort({ updatedAt: -1 });
    } catch (error) {
      logger.error('Error searching deals:', error);
      throw error;
    }
  }
} 