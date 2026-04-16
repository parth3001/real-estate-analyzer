/**
 * PDF Routes
 *
 * Endpoints for anonymous PDF email and authenticated analysis sharing
 * Created: 2026-03-01
 * Updated: 2026-04-15 - Added authenticated share routes
 */

import { Router } from 'express';
import { sendAnonymousPdf, pdfHealthCheck, shareAnalysis, getShareHistory } from '../controllers/pdfController';
import pdfRateLimiter, { authenticatedPdfRateLimiter } from '../middleware/rateLimiter';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/pdf/send-anonymous-pdf
 *
 * Send property analysis PDF to anonymous user via email
 * Rate limited: 5 PDFs per hour per IP address
 */
router.post('/send-anonymous-pdf', pdfRateLimiter, sendAnonymousPdf);

/**
 * POST /api/pdf/share-analysis
 *
 * Share property analysis report via email (authenticated users)
 * Rate limited: 10 shares per hour per user ID
 */
router.post('/share-analysis', authMiddleware, authenticatedPdfRateLimiter, shareAnalysis);

/**
 * GET /api/pdf/share-history
 *
 * Get user's share history (authenticated users)
 */
router.get('/share-history', authMiddleware, getShareHistory);

/**
 * GET /api/pdf/health
 *
 * Health check endpoint for PDF generation service
 */
router.get('/health', pdfHealthCheck);

export default router;
