import express, { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createPipelineDeal,
  getUserPipelineDeals,
  getPipelineDealById,
  updatePipelineDeal,
  deletePipelineDeal,
  updateDealStage,
  getKanbanData,
  linkAnalysisToDeal,
  convertAnalysisToPipeline,
  getPipelineAnalytics
} from '../controllers/pipelineController';
import { logger } from '../utils/logger';

const router: Router = express.Router();

// Middleware to log requests
const logRequest = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`Pipeline API: ${req.method} ${req.originalUrl}`, {
    userId: (req as any).user?.id,
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
  });
  next();
};

// Apply middleware
router.use(authMiddleware); // All pipeline routes require authentication
router.use(logRequest);

// Pipeline Deal CRUD operations
router.get('/deals', getUserPipelineDeals);           // Get all deals with filters
router.post('/deals', createPipelineDeal);            // Create new deal
router.get('/deals/:id', getPipelineDealById);        // Get single deal
router.put('/deals/:id', updatePipelineDeal);         // Update deal
router.delete('/deals/:id', deletePipelineDeal);      // Delete deal

// Stage management
router.put('/deals/:id/stage', updateDealStage);      // Update deal stage

// Quick metrics from skinny calculator
router.put('/deals/:id/quick-metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { metrics } = req.body;
    const userId = (req as any).user?.id;
    
    // Import the controller function inline for now
    const PipelineDeal = require('../models/PipelineDeal').default;
    
    // Find and update the deal
    const deal = await PipelineDeal.findOneAndUpdate(
      { _id: id, userId },
      { 
        quickMetrics: metrics,
        analysisStatus: 'COMPLETE',
        updatedAt: new Date(),
        lastActivity: new Date()
      },
      { new: true }
    );
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    logger.info('Quick metrics saved', { dealId: id, userId });
    res.json({ success: true, data: deal });
  } catch (error) {
    logger.error('Error saving quick metrics:', error);
    res.status(500).json({ error: 'Failed to save quick metrics' });
  }
});

// Kanban board
router.get('/kanban', getKanbanData);                 // Get Kanban board data

// Analysis integration
router.post('/deals/:id/link-analysis', linkAnalysisToDeal);     // Link existing analysis
router.post('/convert-analysis', convertAnalysisToPipeline);     // Convert analysis to pipeline

// Analytics
router.get('/analytics', getPipelineAnalytics);       // Get pipeline analytics

export default router;