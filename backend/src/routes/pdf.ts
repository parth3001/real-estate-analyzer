/**
 * PDF Routes
 *
 * Endpoints for anonymous PDF email functionality
 * Created: 2026-03-01
 */

import { Router } from 'express';
import { sendAnonymousPdf, pdfHealthCheck } from '../controllers/pdfController';
import pdfRateLimiter from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/pdf/send-anonymous-pdf
 *
 * Send property analysis PDF to anonymous user via email
 * Rate limited: 5 PDFs per hour per IP address
 *
 * Body:
 *   - email: string
 *   - analysis: AnalysisResult<SFRMetrics>
 *   - formData: object (original form inputs)
 *   - strategy: 'brrrr' | 'buy-hold'
 */
router.post('/send-anonymous-pdf', pdfRateLimiter, sendAnonymousPdf);

/**
 * GET /api/pdf/health
 *
 * Health check endpoint for PDF generation service
 * Returns service status and metrics
 */
router.get('/health', pdfHealthCheck);

export default router;
