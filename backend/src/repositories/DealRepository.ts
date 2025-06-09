import { DealModel, IDeal, ISFRDeal, IMFDeal, SFRDeal, MFDeal } from '../models/Deal';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { logger } from '../utils/logger';

export class DealRepository {
  /**
   * Find a deal by its ID
   */
  async findById(id: string): Promise<IDeal | null> {
    try {
      return await DealModel.findById(id);
    } catch (error) {
      logger.error('Error finding deal by ID:', error);
      throw error;
    }
  }

  /**
   * Find all deals, optionally filtered by user ID
   */
  async findAll(userId?: string): Promise<IDeal[]> {
    try {
      const query: FilterQuery<IDeal> = userId ? { userId } : {};
      return await DealModel.find(query).sort({ updatedAt: -1 });
    } catch (error) {
      logger.error('Error finding all deals:', error);
      throw error;
    }
  }

  /**
   * Find deals by property type
   */
  async findByPropertyType(propertyType: 'SFR' | 'MF', userId?: string): Promise<IDeal[]> {
    try {
      const query: FilterQuery<IDeal> = { propertyType };
      if (userId) query.userId = userId;
      
      return await DealModel.find(query).sort({ updatedAt: -1 });
    } catch (error) {
      logger.error('Error finding deals by property type:', error);
      throw error;
    }
  }

  /**
   * Create a new SFR deal
   */
  async createSFR(dealData: Partial<ISFRDeal>): Promise<ISFRDeal> {
    try {
      const deal = new SFRDeal({
        ...dealData,
        propertyType: 'SFR'
      });
      return await deal.save() as ISFRDeal;
    } catch (error) {
      logger.error('Error creating SFR deal:', error);
      throw error;
    }
  }

  /**
   * Create a new MF deal
   */
  async createMF(dealData: Partial<IMFDeal>): Promise<IMFDeal> {
    try {
      const deal = new MFDeal({
        ...dealData,
        propertyType: 'MF'
      });
      return await deal.save() as IMFDeal;
    } catch (error) {
      logger.error('Error creating MF deal:', error);
      throw error;
    }
  }

  /**
   * Update an existing deal
   */
  async update(id: string, dealData: Partial<IDeal>): Promise<IDeal | null> {
    try {
      // Remove _id from update data if present to prevent errors
      if (dealData._id) {
        delete dealData._id;
      }

      // Set updatedAt timestamp
      const updateData: UpdateQuery<IDeal> = {
        ...dealData,
        updatedAt: new Date()
      };

      return await DealModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      logger.error('Error updating deal:', error);
      throw error;
    }
  }

  /**
   * Delete a deal by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await DealModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('Error deleting deal:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const dealRepository = new DealRepository(); 