import mongoose from 'mongoose';
import PipelineDeal, { 
  IPipelineDeal, 
  DealStage, 
  PropertyType,
  PropertyStrategy,
  DealSource,
  SourceInfo
} from '../../models/PipelineDeal';
import { DealModel } from '../../models/Deal';
import { logger } from '../../utils/logger';

export interface CreatePipelineDealRequest {
  dealName: string;
  propertyType: PropertyType;
  strategy?: PropertyStrategy;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  askingPrice: number;
  sourceInfo: {
    channel: DealSource;
    referrer?: string;
    cost?: number;
    notes?: string;
  };
  propertyDetails?: any;
  notes?: string;
}

export interface UpdatePipelineDealRequest {
  dealName?: string;
  askingPrice?: number;
  propertyDetails?: any;
  notes?: string;
  strategy?: PropertyStrategy;
  quickMetrics?: any; // Allow quick metrics updates
  analysisStatus?: 'NOT_ANALYZED' | 'IN_PROGRESS' | 'COMPLETE';
  analysisId?: string;
  confidence?: any; // Allow confidence updates
  [key: string]: any; // Allow any additional fields for full updates
}

export interface PipelineFilters {
  stage?: DealStage;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  source?: DealSource;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PipelineService {
  /**
   * Create a new pipeline deal
   */
  async createDeal(
    userId: string, 
    dealData: CreatePipelineDealRequest
  ): Promise<IPipelineDeal> {
    try {
      logger.info('Creating new pipeline deal', { userId, dealName: dealData.dealName });
      
      const newDeal = new PipelineDeal({
        userId: new mongoose.Types.ObjectId(userId),
        dealName: dealData.dealName,
        propertyType: dealData.propertyType,
        strategy: dealData.strategy || PropertyStrategy.BUY_HOLD,
        currentStage: DealStage.WATCHING,
        address: dealData.address,
        askingPrice: dealData.askingPrice,
        sourceInfo: dealData.sourceInfo,
        propertyDetails: dealData.propertyDetails || {},
        notes: dealData.notes || '',
        analysisStatus: 'NOT_ANALYZED'
      });
      
      const savedDeal = await newDeal.save();
      logger.info('Pipeline deal created successfully', { dealId: savedDeal._id });
      
      return savedDeal;
    } catch (error) {
      logger.error('Error creating pipeline deal', error);
      throw error;
    }
  }
  
  /**
   * Get all deals for a user with optional filters
   */
  async getUserDeals(
    userId: string, 
    filters?: PipelineFilters,
    pagination?: PaginationOptions
  ): Promise<{ deals: IPipelineDeal[], total: number }> {
    try {
      const query: any = { userId: new mongoose.Types.ObjectId(userId) };
      
      // Apply filters
      if (filters?.stage) query.currentStage = filters.stage;
      if (filters?.propertyType) query.propertyType = filters.propertyType;
      if (filters?.source) query['sourceInfo.channel'] = filters.source;
      if (filters?.minPrice || filters?.maxPrice) {
        query.askingPrice = {};
        if (filters.minPrice) query.askingPrice.$gte = filters.minPrice;
        if (filters.maxPrice) query.askingPrice.$lte = filters.maxPrice;
      }
      
      // Get total count
      const total = await PipelineDeal.countDocuments(query);
      
      // Build query with pagination
      let dbQuery = PipelineDeal.find(query);
      
      // Apply sorting
      const sortField = pagination?.sortBy || 'lastActivity';
      const sortOrder = pagination?.sortOrder === 'asc' ? 1 : -1;
      dbQuery = dbQuery.sort({ [sortField]: sortOrder });
      
      // Apply pagination
      if (pagination?.offset) dbQuery = dbQuery.skip(pagination.offset);
      if (pagination?.limit) dbQuery = dbQuery.limit(pagination.limit);
      
      // Populate analysis data if linked - do it separately to avoid type issues
      const deals = await dbQuery.exec();
      
      // Populate the analysis reference for deals that have it
      for (let i = 0; i < deals.length; i++) {
        if (deals[i].analysisId) {
          await deals[i].populate({
            path: 'analysisId',
            select: 'propertyName analysis.investmentDecision.verdict analysis.investmentDecision.professionalAssessment.dealQuality'
          });
        }
      }
      
      return { deals, total };
    } catch (error) {
      logger.error('Error fetching user deals', error);
      throw error;
    }
  }
  
  /**
   * Get deal by ID
   */
  async getDealById(userId: string, dealId: string): Promise<IPipelineDeal | null> {
    try {
      const deal = await PipelineDeal.findOne({
        _id: new mongoose.Types.ObjectId(dealId),
        userId: new mongoose.Types.ObjectId(userId)
      }).populate({
        path: 'analysisId',
        select: 'propertyName analysis'
      });
      
      return deal;
    } catch (error) {
      logger.error('Error fetching deal by ID', error);
      throw error;
    }
  }
  
  /**
   * Update a pipeline deal
   */
  async updateDeal(
    userId: string,
    dealId: string,
    updates: UpdatePipelineDealRequest
  ): Promise<IPipelineDeal | null> {
    try {
      logger.info('Updating pipeline deal', { dealId, updates });
      
      const deal = await PipelineDeal.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(dealId),
          userId: new mongoose.Types.ObjectId(userId)
        },
        {
          $set: {
            ...updates,
            lastActivity: new Date()
          }
        },
        { new: true }
      );
      
      if (!deal) {
        logger.warn('Deal not found for update', { dealId, userId });
        return null;
      }
      
      // Handle price change - cast to include methods
      if (updates.askingPrice && updates.askingPrice !== deal.askingPrice) {
        await (deal as any).updatePrice(updates.askingPrice, 'USER', 'Manual price update');
      }
      
      logger.info('Pipeline deal updated successfully', { dealId });
      return deal;
    } catch (error) {
      logger.error('Error updating pipeline deal', error);
      throw error;
    }
  }
  
  /**
   * Delete a pipeline deal
   */
  async deleteDeal(userId: string, dealId: string): Promise<boolean> {
    try {
      const result = await PipelineDeal.deleteOne({
        _id: new mongoose.Types.ObjectId(dealId),
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Error deleting pipeline deal', error);
      throw error;
    }
  }
  
  /**
   * Update deal stage
   */
  async updateDealStage(
    userId: string,
    dealId: string,
    newStage: DealStage,
    notes?: string
  ): Promise<IPipelineDeal | null> {
    try {
      logger.info('Updating deal stage', { dealId, newStage });
      
      const deal = await this.getDealById(userId, dealId);
      if (!deal) {
        logger.warn('Deal not found for stage update', { dealId, userId });
        return null;
      }
      
      // Use the model method to update stage - cast to include methods
      const updatedDeal = await (deal as any).updateStage(
        newStage,
        new mongoose.Types.ObjectId(userId),
        notes
      );
      
      logger.info('Deal stage updated successfully', { 
        dealId, 
        oldStage: deal.currentStage, 
        newStage 
      });
      
      return updatedDeal;
    } catch (error) {
      logger.error('Error updating deal stage', error);
      throw error;
    }
  }
  
  /**
   * Get Kanban board data (deals grouped by stage)
   */
  async getKanbanData(userId: string): Promise<{ [key: string]: IPipelineDeal[] }> {
    try {
      logger.info('Fetching Kanban data', { userId });
      
      // Use the static method from the model
      const kanbanData = await (PipelineDeal as any).getKanbanData(userId);
      
      logger.info('Kanban data fetched successfully', { 
        userId,
        stages: Object.keys(kanbanData).map(stage => ({
          stage,
          count: kanbanData[stage].length
        }))
      });
      
      return kanbanData;
    } catch (error) {
      logger.error('Error fetching Kanban data', error);
      throw error;
    }
  }
  
  /**
   * Link an existing analysis (Deal) to a pipeline deal
   */
  async linkAnalysis(
    userId: string,
    pipelineDealId: string,
    analysisId: string
  ): Promise<IPipelineDeal | null> {
    try {
      logger.info('Linking analysis to pipeline deal', { pipelineDealId, analysisId });
      
      // Verify the analysis exists and belongs to the user
      const analysis = await DealModel.findOne({
        _id: new mongoose.Types.ObjectId(analysisId),
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      if (!analysis) {
        logger.warn('Analysis not found or unauthorized', { analysisId, userId });
        throw new Error('Analysis not found or unauthorized');
      }
      
      // Get the pipeline deal
      const pipelineDeal = await this.getDealById(userId, pipelineDealId);
      if (!pipelineDeal) {
        logger.warn('Pipeline deal not found', { pipelineDealId, userId });
        return null;
      }
      
      // Extract quick metrics from V3 analysis
      const quickMetrics = {
        dealQuality: analysis.analysis?.investmentDecision?.professionalAssessment?.dealQuality,
        verdict: analysis.analysis?.investmentDecision?.verdict,
        cashFlow: analysis.analysis?.monthlyAnalysis?.cashFlow,
        capRate: analysis.analysis?.keyMetrics?.capRate,
        cashOnCashReturn: analysis.analysis?.keyMetrics?.cashOnCashReturn
      };
      
      // Link the analysis using the model method - cast to include methods
      const updatedDeal = await (pipelineDeal as any).linkAnalysis(
        new mongoose.Types.ObjectId(analysisId),
        quickMetrics
      );
      
      logger.info('Analysis linked successfully', { pipelineDealId, analysisId });
      return updatedDeal;
    } catch (error) {
      logger.error('Error linking analysis', error);
      throw error;
    }
  }
  
  /**
   * Convert an analyzed Deal to a Pipeline Deal
   */
  async convertAnalysisToPipeline(
    userId: string,
    analysisId: string,
    additionalData?: {
      sourceInfo: SourceInfo;
      notes?: string;
    }
  ): Promise<IPipelineDeal> {
    try {
      logger.info('Converting analysis to pipeline deal', { analysisId });
      
      // Get the analysis
      const analysis = await DealModel.findOne({
        _id: new mongoose.Types.ObjectId(analysisId),
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      if (!analysis) {
        throw new Error('Analysis not found or unauthorized');
      }
      
      // Create pipeline deal from analysis data
      const pipelineDeal = new PipelineDeal({
        userId: new mongoose.Types.ObjectId(userId),
        dealName: analysis.propertyName,
        propertyType: analysis.propertyType as PropertyType,
        strategy: PropertyStrategy.BUY_HOLD, // Default, can be updated
        currentStage: DealStage.ANALYZING, // Start in analyzing since we have analysis
        address: analysis.propertyAddress,
        askingPrice: analysis.purchasePrice,
        sourceInfo: additionalData?.sourceInfo || {
          channel: DealSource.OTHER,
          notes: 'Converted from analysis'
        },
        propertyDetails: {
          bedrooms: (analysis as any).bedrooms,
          bathrooms: (analysis as any).bathrooms,
          squareFootage: (analysis as any).squareFootage || (analysis as any).totalSqft,
          yearBuilt: analysis.yearBuilt,
          units: (analysis as any).totalUnits
        },
        notes: additionalData?.notes || '',
        analysisId: analysis._id,
        analysisStatus: 'COMPLETE',
        quickMetrics: {
          dealQuality: analysis.analysis?.investmentDecision?.professionalAssessment?.dealQuality,
          verdict: analysis.analysis?.investmentDecision?.verdict,
          cashFlow: analysis.analysis?.monthlyAnalysis?.cashFlow,
          capRate: analysis.analysis?.keyMetrics?.capRate,
          cashOnCashReturn: analysis.analysis?.keyMetrics?.cashOnCashReturn
        }
      });
      
      const savedDeal = await pipelineDeal.save();
      logger.info('Analysis converted to pipeline deal successfully', { 
        analysisId, 
        pipelineDealId: savedDeal._id 
      });
      
      return savedDeal;
    } catch (error) {
      logger.error('Error converting analysis to pipeline', error);
      throw error;
    }
  }
  
  /**
   * Remove analysis reference from all pipeline deals (used during cascade deletion)
   */
  async unlinkAnalysisFromAllDeals(userId: string, analysisId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(analysisId)) {
        throw new Error('Invalid analysis ID');
      }

      logger.info(`Unlinking analysis ${analysisId} from all pipeline deals for user ${userId}`);

      // Find all pipeline deals that reference this analysis
      const dealsWithAnalysis = await PipelineDeal.find({
        userId: new mongoose.Types.ObjectId(userId),
        analysisId: new mongoose.Types.ObjectId(analysisId)
      });

      logger.info(`Found ${dealsWithAnalysis.length} pipeline deals referencing analysis ${analysisId}`);

      // When a user deletes a property from saved properties, they expect it gone from pipeline too
      // Delete pipeline deals that reference the deleted analysis
      const deleteResult = await PipelineDeal.deleteMany({
        userId: new mongoose.Types.ObjectId(userId),
        analysisId: new mongoose.Types.ObjectId(analysisId)
      });
      
      logger.info(`Deleted ${deleteResult.deletedCount} pipeline deals that referenced the deleted analysis`);

      // Alternative Option 1: Just unlink the analysis but keep the pipeline deal
      // This maintains deal tracking even if the analysis is deleted
      // Uncomment below if you prefer to keep pipeline deals as unanalyzed
      /*
      const result = await PipelineDeal.updateMany(
        {
          userId: new mongoose.Types.ObjectId(userId),
          analysisId: new mongoose.Types.ObjectId(analysisId)
        },
        {
          $unset: { analysisId: 1, quickMetrics: 1 },
          $set: {
            analysisStatus: 'NOT_ANALYZED',
            lastActivity: new Date()
          }
        }
      );

      logger.info(`Unlinked analysis from ${result.modifiedCount} pipeline deals`);
      */
      
    } catch (error) {
      logger.error('Error unlinking analysis from pipeline deals:', error);
      throw error;
    }
  }

  /**
   * Get pipeline analytics for a user
   */
  async getPipelineAnalytics(userId: string): Promise<any> {
    try {
      const pipeline = [
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $facet: {
            // Stage distribution
            byStage: [
              { $group: { _id: '$currentStage', count: { $sum: 1 } } }
            ],
            // Property type distribution
            byPropertyType: [
              { $group: { _id: '$propertyType', count: { $sum: 1 } } }
            ],
            // Source analysis
            bySource: [
              { $group: { _id: '$sourceInfo.channel', count: { $sum: 1 } } }
            ],
            // Total value
            totalValue: [
              { $group: { _id: null, total: { $sum: '$askingPrice' } } }
            ],
            // Average days in stage
            avgDaysInStage: [
              { $unwind: '$stageHistory' },
              {
                $group: {
                  _id: '$stageHistory.stage',
                  avgDays: {
                    $avg: {
                      $divide: [
                        { $subtract: [new Date(), '$stageHistory.date'] },
                        1000 * 60 * 60 * 24
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      ];
      
      const results = await PipelineDeal.aggregate(pipeline);
      const analytics = results[0];
      
      return {
        stageDistribution: analytics.byStage,
        propertyTypeDistribution: analytics.byPropertyType,
        sourceAnalysis: analytics.bySource,
        totalPipelineValue: analytics.totalValue[0]?.total || 0,
        avgDaysInStage: analytics.avgDaysInStage
      };
    } catch (error) {
      logger.error('Error getting pipeline analytics', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const pipelineService = new PipelineService();