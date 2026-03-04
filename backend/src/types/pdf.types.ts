/**
 * PDF Generation Type Definitions
 *
 * Purpose: Centralized type definitions for Feature #14 (Anonymous PDF Email Storage)
 * Created: 2026-03-01
 */

// ============================================================
// PDF Form Data (User Input for PDF Generation)
// ============================================================

export interface PdfFormData {
  // Property Details
  purchasePrice: number;
  downPayment: number;
  monthlyRent: number;
  squareFeet: number;

  // Strategy
  investmentStrategy: 'brrrr' | 'buy-hold';

  // Optional Fields
  projectionYears?: number;

  // Additional context (for BRRRR)
  rehabCost?: number;
  afterRepairValue?: number;

  // Property Identification (Optional - for display and tracking)
  propertyAddress?: string;  // "1234 Main St, Austin, TX 78701" or "Austin rental"
}

/**
 * Investment Strategy Type
 * Maps to calculator types in the frontend
 */
export type PdfStrategy = 'brrrr' | 'buy-hold';

// ============================================================
// PDF Generation Result
// ============================================================

export interface PdfGenerationResult {
  /**
   * PDF file as Buffer (ready for email attachment or file save)
   */
  pdfBuffer: Buffer;

  /**
   * File size in bytes
   * Target: 100-300KB for typical analysis
   */
  fileSizeBytes: number;

  /**
   * Time taken to generate PDF in milliseconds
   * Target: P95 < 1000ms
   */
  generationTimeMs: number;

  /**
   * SHA-256 checksum of analysis + formData
   * Used for data integrity verification and audit trail
   */
  checksum: string;
}

// ============================================================
// PDF Error Types (Discriminated Union)
// ============================================================

/**
 * Rate Limit Error
 * User has exceeded 5 PDFs/hour limit
 */
export interface PdfRateLimitError {
  type: 'rate-limit';
  retryAfter: number;  // Seconds until they can retry
  message: string;
}

/**
 * Network Error
 * Email service or network issues (retryable)
 */
export interface PdfNetworkError {
  type: 'network';
  retryable: true;
  message: string;
}

/**
 * PDF Generation Failed
 * React-PDF rendering error (non-retryable)
 */
export interface PdfGenerationError {
  type: 'generation-failed';
  retryable: false;
  message: string;
}

/**
 * Email Delivery Failed
 * Resend API error (retryable)
 */
export interface PdfEmailError {
  type: 'email-failed';
  retryable: true;
  message: string;
}

/**
 * Validation Error
 * Invalid email or form data (non-retryable)
 */
export interface PdfValidationError {
  type: 'validation-error';
  retryable: false;
  message: string;
}

/**
 * Union type for all PDF errors
 * Frontend uses this for detailed error handling
 */
export type PdfError =
  | PdfRateLimitError
  | PdfNetworkError
  | PdfGenerationError
  | PdfEmailError
  | PdfValidationError;

// ============================================================
// Anonymous PDF Request (MongoDB Document Interface)
// ============================================================

export interface IAnonymousPdfRequest {
  email: string;
  strategy: PdfStrategy;
  analysisChecksum: string;
  requestIp: string;
  userAgent?: string;
  propertyAddress?: string;  // Optional property address for identification
  convertedToSignup: boolean;
  signupDate?: Date;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Rate Limiter Types
// ============================================================

export interface RateLimitEntry {
  count: number;        // Number of requests in current window
  resetAt: number;      // Timestamp when count resets (Unix ms)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;    // Requests remaining in current window
  resetAt: number;      // When the limit resets (Unix ms)
  retryAfter?: number;  // Seconds to wait (only if !allowed)
}

// ============================================================
// PDF Service Configuration
// ============================================================

export interface PdfServiceConfig {
  /**
   * Maximum PDF file size in bytes
   * Default: 5MB (5 * 1024 * 1024)
   * Target: 100-300KB for typical analysis
   */
  maxFileSizeBytes: number;

  /**
   * PDF generation timeout in milliseconds
   * Default: 10000ms (10 seconds)
   * Target: P95 < 1000ms
   */
  generationTimeoutMs: number;

  /**
   * Enable detailed logging for debugging
   * Default: false (enable in development only)
   */
  enableDetailedLogging: boolean;
}

// ============================================================
// Email Service PDF Options
// ============================================================

export interface EmailPdfAttachment {
  filename: string;      // e.g., "REanalyzr-Analysis-2026-03-01.pdf"
  content: Buffer;       // PDF file buffer
  contentType: string;   // "application/pdf"
}

export interface SendPdfEmailOptions {
  to: string;            // Recipient email
  subject: string;       // Email subject
  htmlContent: string;   // Email HTML body
  attachment: EmailPdfAttachment;

  // Optional metadata for tracking
  strategy?: PdfStrategy;
  dealQualityScore?: number;
  propertyAddress?: string;
}

// ============================================================
// Type Guards (Runtime Type Checking)
// ============================================================

/**
 * Type guard to check if error is a rate limit error
 */
export function isPdfRateLimitError(error: PdfError): error is PdfRateLimitError {
  return error.type === 'rate-limit';
}

/**
 * Type guard to check if error is retryable
 */
export function isPdfErrorRetryable(error: PdfError): boolean {
  return error.type === 'network' || error.type === 'email-failed';
}

/**
 * Type guard to check if value is a valid PDF strategy
 */
export function isValidPdfStrategy(value: any): value is PdfStrategy {
  return value === 'brrrr' || value === 'buy-hold';
}

// ============================================================
// Constants
// ============================================================

export const PDF_CONSTANTS = {
  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: 5,           // 5 PDFs per hour per IP
  RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  RATE_LIMIT_CACHE_MAX_SIZE: 5000,      // Max IPs to track in LRU cache

  // PDF Generation
  PDF_MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,  // 5MB max (target: 100-300KB)
  PDF_GENERATION_TIMEOUT_MS: 10000,           // 10 seconds max
  PDF_TARGET_SIZE_KB: 300,                    // Target max size
  PDF_PERFORMANCE_TARGET_MS: 1000,            // P95 target

  // Email
  PDF_FILENAME_PREFIX: 'REanalyzr-Analysis',
  PDF_CONTENT_TYPE: 'application/pdf',

  // Checksum
  CHECKSUM_ALGORITHM: 'sha256',
} as const;

// ============================================================
// Analytics Event Types (for Google Analytics 4)
// ============================================================

export interface PdfAnalyticsEvent {
  eventName: 'pdf_request_initiated' | 'pdf_request_success' | 'pdf_request_failed' | 'pdf_converted_to_signup';
  properties: {
    strategy: PdfStrategy;
    dealQualityScore?: number;
    generationTimeMs?: number;
    fileSizeKb?: number;
    errorType?: string;
    errorMessage?: string;
    daysSincePdfRequest?: number;
    pdfRequestCount?: number;
  };
}
