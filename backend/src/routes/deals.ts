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
import { logger } from '../utils/logger';

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

// Sample endpoints
router.get('/sample-sfr', getSampleSFR);
router.get('/sample-mf', getSampleMF);

// Deal routes
router.get('/', getAllDeals);
router.get('/:id', getDealById);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

// Analysis endpoint
router.post('/analyze', analyzeDeal);

export default router; 