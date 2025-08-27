import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createPortfolio,
  getUserPortfolios,
  getPortfolioDetails,
  updatePortfolio,
  archivePortfolio,
  addPropertyToPortfolio,
  removePropertyFromPortfolio,
  getAvailablePortfolios,
  recalculatePortfolioAnalytics,
  // Phase 4: Enhanced AI Insights
  getPortfolioHealthCheck,
  getPeerComparison,
  getGoalAchievementPath,
  getComprehensiveInsights
} from '../controllers/portfolios';

const router = Router();

/**
 * Portfolio Routes - RESTful API design
 * All routes require authentication
 */

// Portfolio CRUD operations
router.post('/', authMiddleware, createPortfolio);              // Create portfolio
router.get('/', authMiddleware, getUserPortfolios);             // List user portfolios
router.get('/available', authMiddleware, getAvailablePortfolios); // Get portfolios for property addition
router.get('/:id', authMiddleware, getPortfolioDetails);        // Get portfolio details
router.put('/:id', authMiddleware, updatePortfolio);            // Update portfolio
router.delete('/:id', authMiddleware, archivePortfolio);        // Archive portfolio

// Property management within portfolios
router.post('/:id/properties', authMiddleware, addPropertyToPortfolio);        // Add property to portfolio
router.delete('/:id/properties/:propertyId', authMiddleware, removePropertyFromPortfolio); // Remove property

// Analytics and debug routes
router.post('/:id/recalculate-analytics', authMiddleware, recalculatePortfolioAnalytics); // Debug: manually recalculate analytics

// Phase 4: Enhanced AI Insights
router.get('/:id/health-check', authMiddleware, getPortfolioHealthCheck);         // Portfolio health check AI
router.get('/:id/peer-comparison', authMiddleware, getPeerComparison);           // Peer comparison intelligence  
router.get('/:id/goal-path', authMiddleware, getGoalAchievementPath);            // Goal achievement path AI
router.get('/:id/comprehensive-insights', authMiddleware, getComprehensiveInsights); // All AI insights

// Future routes (to be implemented in later phases)
// router.get('/:id/analytics', auth, getPortfolioAnalytics);           // Get portfolio analytics
// router.get('/:id/recommendations', auth, getPortfolioRecommendations); // Get recommendations

export default router;