import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { pipelineService } from '../services/pipeline/pipelineService';
import { DealStage } from '../models/PipelineDeal';
import { logger } from '../utils/logger';

/**
 * Create a new pipeline deal
 */
export const createPipelineDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    const deal = await pipelineService.createDeal(userId, req.body);
    
    res.status(201).json({
      success: true,
      data: deal,
      message: 'Pipeline deal created successfully'
    });
  } catch (error: any) {
    logger.error('Error in createPipelineDeal controller', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create pipeline deal'
    });
  }
};

/**
 * Get all pipeline deals for the authenticated user
 */
export const getUserPipelineDeals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    // Parse filters from query params
    const filters = {
      stage: req.query.stage as DealStage,
      propertyType: req.query.propertyType as any,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      source: req.query.source as any
    };
    
    // Parse pagination
    const pagination = {
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0,
      sortBy: req.query.sortBy as string || 'lastActivity',
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
    };
    
    const { deals, total } = await pipelineService.getUserDeals(userId, filters, pagination);
    
    res.json({
      success: true,
      data: deals,
      total,
      pagination: {
        ...pagination,
        hasMore: (pagination.offset + pagination.limit) < total
      }
    });
  } catch (error: any) {
    logger.error('Error in getUserPipelineDeals controller', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pipeline deals'
    });
  }
};

/**
 * Get a single pipeline deal by ID
 */
export const getPipelineDealById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const dealId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    const deal = await pipelineService.getDealById(userId, dealId);
    
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline deal not found'
      });
    }
    
    res.json({
      success: true,
      data: deal
    });
  } catch (error: any) {
    logger.error('Error in getPipelineDealById controller', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pipeline deal'
    });
  }
};

/**
 * Update a pipeline deal
 */
export const updatePipelineDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const dealId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    const updatedDeal = await pipelineService.updateDeal(userId, dealId, req.body);
    
    if (!updatedDeal) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline deal not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedDeal,
      message: 'Pipeline deal updated successfully'
    });
  } catch (error: any) {
    logger.error('Error in updatePipelineDeal controller', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update pipeline deal'
    });
  }
};

/**
 * Delete a pipeline deal
 */
export const deletePipelineDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const dealId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    const deleted = await pipelineService.deleteDeal(userId, dealId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline deal not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Pipeline deal deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error in deletePipelineDeal controller', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete pipeline deal'
    });
  }
};

/**
 * Update deal stage (for Kanban board)
 */
export const updateDealStage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const dealId = req.params.id;
    const { stage, notes } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    if (!stage) {
      return res.status(400).json({
        success: false,
        error: 'Stage is required'
      });
    }
    
    const updatedDeal = await pipelineService.updateDealStage(
      userId, 
      dealId, 
      stage as DealStage,
      notes
    );
    
    if (!updatedDeal) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline deal not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedDeal,
      message: `Deal moved to ${stage}`
    });
  } catch (error: any) {
    logger.error('Error in updateDealStage controller', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update deal stage'
    });
  }
};

/**
 * Get Kanban board data
 */
export const getKanbanData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    logger.info(`🔄 Getting Kanban data for user: ${userId}`);
    const kanbanData = await pipelineService.getKanbanData(userId);
    
    // Debug: Log a sample of deals to see their current state
    const sampleDeals = Object.values(kanbanData).flat().slice(0, 2);
    logger.info(`📊 Kanban data sample:`, {
      totalStages: Object.keys(kanbanData).length,
      sampleDeals: sampleDeals.map(deal => ({
        id: deal._id,
        name: deal.dealName,
        askingPrice: deal.askingPrice,
        analysisStatus: deal.analysisStatus,
        hasQuickMetrics: !!deal.quickMetrics,
        dealQuality: deal.quickMetrics?.dealQuality,
        updatedAt: deal.updatedAt
      }))
    });
    
    res.json({
      success: true,
      data: kanbanData
    });
  } catch (error: any) {
    logger.error('Error in getKanbanData controller', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Kanban data'
    });
  }
};

/**
 * Link an existing analysis to a pipeline deal
 */
export const linkAnalysisToDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const dealId = req.params.id;
    const { analysisId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required'
      });
    }
    
    // Get the deal first to check if analysis is supported
    const deal = await pipelineService.getDealById(userId, dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline deal not found'
      });
    }
    
    // Check if analysis is supported for this deal type/strategy
    if (deal.propertyType !== 'SFR' || deal.strategy !== 'BUY_HOLD') {
      return res.status(400).json({
        success: false,
        error: 'Analysis is currently only supported for Single Family (SFR) properties with Buy & Hold strategy'
      });
    }
    
    const updatedDeal = await pipelineService.linkAnalysis(userId, dealId, analysisId);
    
    if (!updatedDeal) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline deal not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedDeal,
      message: 'Analysis linked successfully'
    });
  } catch (error: any) {
    logger.error('Error in linkAnalysisToDeal controller', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to link analysis'
    });
  }
};

/**
 * Convert an analyzed deal to a pipeline deal
 */
export const convertAnalysisToPipeline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { analysisId, sourceInfo, notes } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required'
      });
    }
    
    // Note: This endpoint converts existing SFR analyses to pipeline deals
    // Since all current analyses are SFR + BUY_HOLD, no additional validation needed here
    const pipelineDeal = await pipelineService.convertAnalysisToPipeline(
      userId,
      analysisId,
      { sourceInfo, notes }
    );
    
    res.status(201).json({
      success: true,
      data: pipelineDeal,
      message: 'Analysis converted to pipeline deal successfully'
    });
  } catch (error: any) {
    logger.error('Error in convertAnalysisToPipeline controller', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to convert analysis to pipeline'
    });
  }
};

/**
 * Get pipeline analytics
 */
export const getPipelineAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    const analytics = await pipelineService.getPipelineAnalytics(userId);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    logger.error('Error in getPipelineAnalytics controller', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pipeline analytics'
    });
  }
};