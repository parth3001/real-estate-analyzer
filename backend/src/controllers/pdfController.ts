/**
 * PDF Controller
 *
 * Purpose: Handle anonymous PDF email requests from calculator users
 * Endpoint: POST /api/pdf/send-anonymous-pdf
 *
 * Flow:
 *   1. Validate email and form data
 *   2. Check rate limiting (5 PDFs/hour per IP)
 *   3. Run property analysis (same as regular calculator)
 *   4. Generate checksum for data integrity
 *   5. Generate PDF using React-PDF
 *   6. Send email with PDF attachment via Resend
 *   7. Store request in MongoDB for conversion tracking
 *
 * Created: 2026-03-01
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { PdfFormData, PdfStrategy, PDF_CONSTANTS } from '../types/pdf.types';
import { AnalysisResult, SFRMetrics } from '../types/analysis';
import pdfService from '../services/pdfService';
import { emailService } from '../services/emailService';
import AnonymousPdfRequest from '../models/AnonymousPdfRequest';
import SharedAnalysis from '../models/SharedAnalysis';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Extract IP address from request
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================
// Controller
// ============================================================

/**
 * Send Anonymous PDF Email
 *
 * POST /api/pdf/send-anonymous-pdf
 *
 * Body:
 *   - email: string (required)
 *   - analysis: AnalysisResult<SFRMetrics> (required) - The analysis they already saw on screen
 *   - formData: object (required) - Original form inputs for PDF display
 *   - strategy: 'brrrr' | 'buy-hold' (required)
 *
 * Response:
 *   - 200: { success: true, message: string, dealQualityScore: number }
 *   - 400: { error: string, type: 'validation-error' }
 *   - 429: { error: string, type: 'rate-limit', retryAfter: number }
 *   - 500: { error: string, type: 'generation-failed' | 'email-failed' }
 */
export async function sendAnonymousPdf(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  try {
    // ============================================================
    // Step 1: Validate Request Body
    // ============================================================

    const { email, analysis, formData, strategy } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      logger.warn('[PdfController] Missing or invalid email', { ip });
      res.status(400).json({
        error: 'Email is required',
        type: 'validation-error',
      });
      return;
    }

    if (!isValidEmail(email)) {
      logger.warn('[PdfController] Invalid email format', { email: email.substring(0, 5) + '...', ip });
      res.status(400).json({
        error: 'Invalid email address format',
        type: 'validation-error',
      });
      return;
    }

    // Validate strategy
    if (!strategy || (strategy !== 'brrrr' && strategy !== 'buy-hold')) {
      logger.warn('[PdfController] Invalid investment strategy', { strategy, ip });
      res.status(400).json({
        error: 'Invalid investment strategy. Must be "brrrr" or "buy-hold"',
        type: 'validation-error',
      });
      return;
    }

    // Validate analysis
    if (!analysis || typeof analysis !== 'object') {
      logger.warn('[PdfController] Missing or invalid analysis', { ip });
      res.status(400).json({
        error: 'Analysis data is required',
        type: 'validation-error',
      });
      return;
    }

    // Validate formData
    if (!formData || typeof formData !== 'object') {
      logger.warn('[PdfController] Missing or invalid formData', { ip });
      res.status(400).json({
        error: 'Form data is required',
        type: 'validation-error',
      });
      return;
    }

    const dealQualityScore = analysis.investmentDecision?.professionalAssessment?.dealQuality || 0;

    logger.info('[PdfController] Valid PDF request received', {
      email: email.substring(0, 5) + '...@' + email.split('@')[1],
      strategy,
      dealQualityScore,
      ip,
    });

    // ============================================================
    // Step 2: Generate Checksum for Data Integrity
    // ============================================================

    const dataString = JSON.stringify({ analysis, formData });
    const analysisChecksum = crypto.createHash(PDF_CONSTANTS.CHECKSUM_ALGORITHM).update(dataString).digest('hex');

    logger.info('[PdfController] Generated checksum', {
      checksum: analysisChecksum.substring(0, 16) + '...',
    });

    // ============================================================
    // Step 3: Generate PDF
    // ============================================================

    logger.info('[PdfController] Generating PDF', { strategy });

    const pdfResult = await pdfService.generateAnalysisPdf(
      analysis,
      formData,
      strategy as PdfStrategy
    );

    logger.info('[PdfController] PDF generated', {
      fileSizeKB: Math.round(pdfResult.fileSizeBytes / 1024),
      generationTimeMs: pdfResult.generationTimeMs,
    });

    // ============================================================
    // Step 4: Send Email with PDF Attachment
    // ============================================================

    const filename = pdfService.generateFilename(strategy as PdfStrategy, formData.propertyAddress);

    const attachment = {
      filename,
      content: pdfResult.pdfBuffer,
      contentType: PDF_CONSTANTS.PDF_CONTENT_TYPE,
    };

    logger.info('[PdfController] Sending email', {
      email: email.substring(0, 5) + '...@' + email.split('@')[1],
      filename,
    });

    await emailService.sendAnonymousPdfEmail(
      email,
      attachment,
      strategy,
      dealQualityScore,
      formData.propertyAddress,
      analysis  // Pass full analysis for metrics display in email
    );

    logger.info('[PdfController] Email sent successfully');

    // ============================================================
    // Step 5: Store Request in MongoDB for Conversion Tracking
    // ============================================================

    const anonymousRequest = new AnonymousPdfRequest({
      email: email.toLowerCase().trim(),
      strategy: strategy as PdfStrategy,
      analysisChecksum,
      requestIp: ip,
      userAgent,
      propertyAddress: formData.propertyAddress,  // Optional property address
      convertedToSignup: false,
    });

    await anonymousRequest.save();

    logger.info('[PdfController] Anonymous PDF request saved to database', {
      requestId: anonymousRequest._id,
    });

    // ============================================================
    // Step 6: Return Success Response
    // ============================================================

    const totalDuration = Date.now() - startTime;

    logger.info('[PdfController] PDF request completed successfully', {
      email: email.substring(0, 5) + '...@' + email.split('@')[1],
      strategy,
      dealQualityScore,
      totalDurationMs: totalDuration,
      pdfGenerationMs: pdfResult.generationTimeMs,
      fileSizeKB: Math.round(pdfResult.fileSizeBytes / 1024),
    });

    res.status(200).json({
      success: true,
      message: 'PDF sent successfully! Check your email inbox (and spam folder).',
      dealQualityScore,
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;

    logger.error('[PdfController] Failed to process PDF request', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip,
      totalDurationMs: totalDuration,
    });

    // Determine error type for frontend
    let errorType = 'generation-failed';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('email')) {
        errorType = 'email-failed';
      } else if (error.message.includes('PDF')) {
        errorType = 'generation-failed';
      }
    }

    res.status(statusCode).json({
      error: 'Failed to generate and send PDF. Please try again later.',
      type: errorType,
    });
  }
}

// ============================================================
// Share Analysis (Authenticated)
// ============================================================

/**
 * Share Analysis via Email
 *
 * POST /api/pdf/share-analysis
 * Requires authentication
 */
export async function shareAnalysis(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;
  const senderEmail = authReq.user?.email;

  if (!userId || !senderEmail) {
    res.status(401).json({ error: 'Authentication required', type: 'validation-error' });
    return;
  }

  try {
    const { recipientEmail, ccEmail, personalNote, analysis, propertyData, strategy } = req.body;

    // Validate recipient email
    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      res.status(400).json({ error: 'Valid recipient email is required', type: 'validation-error' });
      return;
    }

    // Validate CC email if provided
    if (ccEmail && !isValidEmail(ccEmail)) {
      res.status(400).json({ error: 'Invalid CC email address', type: 'validation-error' });
      return;
    }

    // Validate strategy
    if (!strategy || (strategy !== 'brrrr' && strategy !== 'buy-hold')) {
      res.status(400).json({ error: 'Invalid strategy. Must be "brrrr" or "buy-hold"', type: 'validation-error' });
      return;
    }

    // Validate analysis data
    if (!analysis || typeof analysis !== 'object') {
      res.status(400).json({ error: 'Analysis data is required', type: 'validation-error' });
      return;
    }

    const dealQualityScore = analysis.investmentDecision?.professionalAssessment?.dealQuality || 0;
    const propertyAddress = propertyData?.address || propertyData?.propertyAddress?.street || '';

    // Build formData from propertyData for PDF generation
    const formData: PdfFormData = {
      purchasePrice: propertyData?.purchasePrice || 0,
      downPayment: propertyData?.downPayment || 0,
      monthlyRent: propertyData?.monthlyRent || 0,
      squareFeet: propertyData?.squareFootage || propertyData?.squareFeet || 0,
      investmentStrategy: strategy as PdfStrategy,
      projectionYears: propertyData?.projectionYears,
      rehabCost: propertyData?.rehabBudget || propertyData?.brrrr?.rehabBudget,
      afterRepairValue: propertyData?.afterRepairValue || propertyData?.brrrr?.afterRepairValue,
      propertyAddress,
    };

    logger.info('[PdfController] Share analysis request', {
      userId,
      recipientEmail: recipientEmail.substring(0, 5) + '...',
      strategy,
      dealQualityScore,
    });

    // Generate checksum
    const dataString = JSON.stringify({ analysis, propertyData });
    const analysisChecksum = crypto.createHash(PDF_CONSTANTS.CHECKSUM_ALGORITHM).update(dataString).digest('hex');

    // Generate professional report PDF
    const senderName = senderEmail.split('@')[0]; // Simple name extraction
    const pdfResult = await pdfService.generateProfessionalReportPdf(
      analysis,
      formData,
      strategy as PdfStrategy,
      senderName,
      propertyData  // Pass full propertyData for assumptions access
    );

    logger.info('[PdfController] Professional PDF generated', {
      fileSizeKB: Math.round(pdfResult.fileSizeBytes / 1024),
      generationTimeMs: pdfResult.generationTimeMs,
    });

    // Prepare attachment
    const filename = pdfService.generateFilename(strategy as PdfStrategy, propertyAddress);
    const attachment = {
      filename,
      content: pdfResult.pdfBuffer,
      contentType: PDF_CONSTANTS.PDF_CONTENT_TYPE,
    };

    // Send email
    await emailService.sendShareAnalysisEmail(
      recipientEmail,
      ccEmail,
      personalNote,
      attachment,
      strategy,
      dealQualityScore,
      senderName,
      senderEmail,
      propertyAddress,
      analysis
    );

    // Save share record
    const shareRecord = new SharedAnalysis({
      userId,
      senderEmail,
      recipientEmail: recipientEmail.toLowerCase().trim(),
      ccEmail: ccEmail ? ccEmail.toLowerCase().trim() : undefined,
      personalNote: personalNote ? personalNote.trim().substring(0, 500) : undefined,
      strategy,
      propertyAddress,
      dealQualityScore,
      analysisChecksum,
      pdfFileSizeBytes: pdfResult.fileSizeBytes,
      status: 'sent',
    });

    await shareRecord.save();

    const totalDuration = Date.now() - startTime;
    logger.info('[PdfController] Share analysis completed', {
      shareId: shareRecord._id,
      totalDurationMs: totalDuration,
    });

    res.status(200).json({
      success: true,
      message: `Analysis sent to ${recipientEmail}!`,
      shareId: shareRecord._id.toString(),
    });

  } catch (error) {
    logger.error('[PdfController] Failed to share analysis', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      totalDurationMs: Date.now() - startTime,
    });

    res.status(500).json({
      error: 'Failed to share analysis. Please try again.',
      type: error instanceof Error && error.message.includes('email') ? 'email-failed' : 'generation-failed',
    });
  }
}

/**
 * Get Share History
 *
 * GET /api/pdf/share-history
 * Requires authentication
 */
export async function getShareHistory(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const shares = await SharedAnalysis.find({ userId, status: 'sent' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('recipientEmail ccEmail strategy propertyAddress dealQualityScore createdAt')
      .exec();

    res.status(200).json({ shares });
  } catch (error) {
    logger.error('[PdfController] Failed to get share history', { error, userId });
    res.status(500).json({ error: 'Failed to retrieve share history' });
  }
}

// ============================================================
// Health Check Endpoint
// ============================================================

/**
 * PDF Service Health Check
 *
 * GET /api/pdf/health
 *
 * Returns health status of PDF generation service
 */
export async function pdfHealthCheck(req: Request, res: Response): Promise<void> {
  try {
    // Get recent PDF generation stats from MongoDB
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentRequestsCount = await AnonymousPdfRequest.countDocuments({
      createdAt: { $gte: last24Hours },
    });

    // TODO: Calculate average generation time from logs or tracking
    // For now, return basic health status

    res.status(200).json({
      status: 'healthy',
      service: 'pdf-generation',
      timestamp: new Date().toISOString(),
      metrics: {
        last24hRequestCount: recentRequestsCount,
        // avgGenerationTimeMs: 0, // TODO: Track this
        // p95GenerationTimeMs: 0, // TODO: Track this
      },
    });
  } catch (error) {
    logger.error('[PdfController] Health check failed', { error });

    res.status(500).json({
      status: 'unhealthy',
      service: 'pdf-generation',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
