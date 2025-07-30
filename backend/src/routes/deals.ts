import express, { Router, Request, Response, NextFunction } from 'express';
import { 
  getAllDeals, 
  getDealById, 
  createDeal, 
  updateDeal, 
  deleteDeal,
  getSampleSFR,
  getSampleMF,
  analyzeDeal
} from '../controllers/deals';
import {
  getScenarios,
  createScenario,
  getScenario,
  updateScenario,
  deleteScenario,
  toggleScenarioFavorite
} from '../controllers/scenarioController';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';

const router: Router = express.Router();

// Middleware to log request bodies
const logRequestBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    logger.info(`${req.method} ${req.originalUrl} - Request Body:`, {
      body: req.body,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });
  }
  next();
};

// Apply middleware to all routes
router.use(logRequestBody);

// Sample endpoints (require authentication)
router.get('/sample-sfr', authMiddleware, getSampleSFR);
router.get('/sample-mf', authMiddleware, getSampleMF);

// Deal routes (require authentication)
router.get('/', authMiddleware, getAllDeals);
router.get('/:id', authMiddleware, getDealById);
router.post('/', authMiddleware, createDeal);
router.put('/:id', authMiddleware, updateDeal);
router.delete('/:id', authMiddleware, deleteDeal);

// Analysis endpoint (require authentication)
router.post('/analyze', authMiddleware, analyzeDeal);

// Scenario routes (require authentication) - Nested under deals for logical grouping
router.get('/:dealId/scenarios', authMiddleware, getScenarios);
router.post('/:dealId/scenarios', authMiddleware, createScenario);
router.get('/:dealId/scenarios/:scenarioId', authMiddleware, getScenario);
router.put('/:dealId/scenarios/:scenarioId', authMiddleware, updateScenario);
router.delete('/:dealId/scenarios/:scenarioId', authMiddleware, deleteScenario);
router.patch('/:dealId/scenarios/:scenarioId/favorite', authMiddleware, toggleScenarioFavorite);

export default router; 