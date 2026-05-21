import express, { Router, Request, Response, NextFunction } from 'express';
import {
  getAllDeals,
  getDealById,
  getDealScenarioComparison,
  getDealScenarioDetail,
  getDealScenarioSensitivity,
  getDealCritique,
  getDealLicense,
  seedDealLicense,
  createDeal,
  updateDeal,
  deleteDeal,
  getSampleSFR,
  getSampleMF,
  getSampleAnalysis,
  analyzeDeal,
  analyzeAnonymous,
  getQuickPredictions,
  analyzeGoals
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

// PUBLIC: Sample analysis for SEO landing page (NO AUTH REQUIRED)
router.get('/sample-analysis', getSampleAnalysis);

// PUBLIC: Anonymous calculator analysis (NO AUTH REQUIRED)
// Used by UniversalCalculator for BRRRR and Buy & Hold strategies
router.post('/analyze-anonymous', analyzeAnonymous);

// Sample endpoints (require authentication)
router.get('/sample-sfr', authMiddleware, getSampleSFR);
router.get('/sample-mf', authMiddleware, getSampleMF);

// Deal routes (require authentication)
router.get('/', authMiddleware, getAllDeals);
router.get('/:id', authMiddleware, getDealById);
// T1 (Day 9a, 2026-05-18): adversarial-critique read endpoint.
// Critique is fired automatically on every save (see triggerOnSave.ts);
// this surfaces both personas to the SavedDealHero.
router.get('/:id/critique', authMiddleware, getDealCritique);
// Task #13/#8 (2026-05-20): substrate-derived scenario comparison — every
// analyzed what-if for this property, with score + factor breakdown + a
// field-agnostic diff vs the baseline. Distinct from /:dealId/scenarios
// (legacy named-Scenario collection). Backs the scenario-scoped workspace.
router.get('/:id/scenario-comparison', authMiddleware, getDealScenarioComparison);
// Task #8 (2026-05-20): full analysis for ONE selected scenario (lazy-loaded
// by the workspace for the Financials/Long-term/Tax depth sections).
router.get('/:id/scenario-detail/:decisionEventId', authMiddleware, getDealScenarioDetail);
// Task #8 (2026-05-21): REAL sensitivity — re-runs analyzer->engine over
// perturbed inputs (single-variable curves + stacked "realistic downside").
// LLM-free. SFR-only for now.
router.get('/:id/scenario-sensitivity/:decisionEventId', authMiddleware, getDealScenarioSensitivity);
// Day 10 (2026-05-18): license status + dev-mode license seed.
// `getDealLicense` surfaces the user's active license (if any) for
// this property's badge UX. `seedDealLicense` is dev-guarded by
// ENABLE_DEV_LICENSE_SEED env var — lets us test the paid-user
// experience end-to-end before Stripe is wired.
router.get('/:id/license', authMiddleware, getDealLicense);
router.post('/:id/seed-license', authMiddleware, seedDealLicense);
router.post('/', authMiddleware, createDeal);
router.put('/:id', authMiddleware, updateDeal);
router.delete('/:id', authMiddleware, deleteDeal);

// Analysis endpoints (require authentication)
router.post('/analyze', authMiddleware, analyzeDeal);

// NEW: Fast AI Predictions endpoint (3-4s vs 76+s)
router.post('/quick-predictions', authMiddleware, getQuickPredictions);

// NEW: AI Goal Analysis endpoint - Enhanced investment strategy personalization
router.post('/analyze-goals', authMiddleware, analyzeGoals);

// Scenario routes (require authentication) - Nested under deals for logical grouping
router.get('/:dealId/scenarios', authMiddleware, getScenarios);
router.post('/:dealId/scenarios', authMiddleware, createScenario);
router.get('/:dealId/scenarios/:scenarioId', authMiddleware, getScenario);
router.put('/:dealId/scenarios/:scenarioId', authMiddleware, updateScenario);
router.delete('/:dealId/scenarios/:scenarioId', authMiddleware, deleteScenario);
router.patch('/:dealId/scenarios/:scenarioId/favorite', authMiddleware, toggleScenarioFavorite);

export default router; 