import express, { Router } from 'express';
import { CommandCenterController } from '../controllers/commandCenter';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router: Router = express.Router();

// Middleware for logging command center requests
router.use((req, res, next) => {
  logger.info(`CommandCenter API: ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * GET /api/command-center
 * Get aggregated dashboard data for immediate actions and status
 */
router.get('/', authMiddleware, CommandCenterController.getCommandCenterData);

export default router;