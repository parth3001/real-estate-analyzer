/**
 * Anonymous PDF Request MongoDB Model
 *
 * Purpose: Track anonymous calculator users who request PDF analyses via email
 * Use Cases:
 *   - Lead capture for conversion tracking
 *   - Conversion attribution (PDF request → signup)
 *   - Analytics and funnel optimization
 *
 * Created: 2026-03-01
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IAnonymousPdfRequest, PdfStrategy } from '../types/pdf.types';

// ============================================================
// MongoDB Document Interface (extends Mongoose Document)
// ============================================================

export interface IAnonymousPdfRequestDocument extends IAnonymousPdfRequest, Document {
  _id: mongoose.Types.ObjectId;
}

// ============================================================
// MongoDB Schema Definition
// ============================================================

const AnonymousPdfRequestSchema = new Schema<IAnonymousPdfRequestDocument>(
  {
    /**
     * Email address (lowercase, trimmed)
     * Used for:
     *   - Sending PDF attachment
     *   - Conversion attribution (matching to user signup)
     *   - Email marketing campaigns
     */
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,  // Index for fast lookup during conversion attribution
      validate: {
        validator: function (email: string) {
          // Basic email validation (RFC 5322 simplified)
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: (props: any) => `${props.value} is not a valid email address`,
      },
    },

    /**
     * Investment strategy (calculator type)
     * Values: 'brrrr' | 'buy-hold'
     */
    strategy: {
      type: String,
      required: true,
      enum: ['brrrr', 'buy-hold'],
      index: true,  // Index for analytics queries
    },

    /**
     * SHA-256 checksum of (analysis + formData)
     * Used for:
     *   - Data integrity verification
     *   - Audit trail (verify PDF matches analysis)
     *   - Debugging (compare sent PDF vs actual analysis)
     */
    analysisChecksum: {
      type: String,
      required: true,
      index: true,  // Index for audit/debugging queries
      match: /^[a-f0-9]{64}$/,  // SHA-256 produces 64 hex characters
    },

    /**
     * IP address of requester
     * Used for:
     *   - Rate limiting (5 PDFs/hour per IP)
     *   - Abuse detection
     *   - Geographic analytics
     */
    requestIp: {
      type: String,
      required: true,
      index: true,  // Index for rate limiting queries
    },

    /**
     * User agent string (browser/device info)
     * Optional - used for analytics
     */
    userAgent: {
      type: String,
      required: false,
    },

    /**
     * Property address (optional)
     * User-provided address for property identification
     * Examples: "1234 Main St, Austin, TX 78701" or "Austin rental"
     * Used for: PDF display, multi-property tracking
     */
    propertyAddress: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,  // Reasonable address length limit
    },

    /**
     * Conversion tracking flag
     * Set to true when user signs up with matching email
     * Default: false
     */
    convertedToSignup: {
      type: Boolean,
      required: true,
      default: false,
      index: true,  // Index for conversion rate queries
    },

    /**
     * Date when user signed up (if converted)
     * Null until convertedToSignup = true
     */
    signupDate: {
      type: Date,
      required: false,
      index: true,  // Index for time-to-conversion analytics
    },

    /**
     * User ID after signup (if converted)
     * References User model
     */
    userId: {
      type: String,
      required: false,
      index: true,  // Index for user lookup queries
    },
  },
  {
    // Automatic createdAt and updatedAt timestamps
    timestamps: true,

    // Collection name
    collection: 'anonymouspdfrequests',
  }
);

// ============================================================
// Indexes for Performance
// ============================================================

/**
 * Compound index for conversion attribution queries
 * Query: Find all unconverted PDF requests for a specific email
 * Used when: User signs up (mark all their PDF requests as converted)
 */
AnonymousPdfRequestSchema.index(
  { email: 1, convertedToSignup: 1 },
  { name: 'email_conversion_idx' }
);

/**
 * Compound index for rate limiting queries
 * Query: Count PDF requests from IP in last hour
 * Used when: User requests PDF (check if they've exceeded 5/hour limit)
 */
AnonymousPdfRequestSchema.index(
  { requestIp: 1, createdAt: -1 },
  { name: 'rate_limit_idx' }
);

/**
 * Index for analytics queries
 * Query: Conversion rates by strategy over time
 */
AnonymousPdfRequestSchema.index(
  { strategy: 1, convertedToSignup: 1, createdAt: -1 },
  { name: 'analytics_idx' }
);

// ============================================================
// Instance Methods
// ============================================================

/**
 * Mark this PDF request as converted to signup
 *
 * @param userId - The new user's ID
 * @returns Promise<void>
 */
AnonymousPdfRequestSchema.methods.markAsConverted = async function (
  userId: string
): Promise<void> {
  this.convertedToSignup = true;
  this.signupDate = new Date();
  this.userId = userId;
  await this.save();
};

/**
 * Calculate days since PDF was requested
 *
 * @returns number - Days elapsed (fractional)
 */
AnonymousPdfRequestSchema.methods.daysSinceRequest = function (): number {
  const now = new Date();
  const diffMs = now.getTime() - this.createdAt.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
};

// ============================================================
// Static Methods (Model-level)
// ============================================================

/**
 * Find all unconverted PDF requests for a given email
 *
 * @param email - Email address (will be lowercased and trimmed)
 * @returns Promise<IAnonymousPdfRequestDocument[]>
 */
AnonymousPdfRequestSchema.statics.findUnconvertedByEmail = async function (
  email: string
): Promise<IAnonymousPdfRequestDocument[]> {
  return this.find({
    email: email.toLowerCase().trim(),
    convertedToSignup: false,
  }).exec();
};

/**
 * Count PDF requests from IP in the last N milliseconds
 *
 * @param ip - IP address
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns Promise<number> - Count of requests
 */
AnonymousPdfRequestSchema.statics.countRecentByIp = async function (
  ip: string,
  windowMs: number = 60 * 60 * 1000  // 1 hour default
): Promise<number> {
  const cutoffDate = new Date(Date.now() - windowMs);
  return this.countDocuments({
    requestIp: ip,
    createdAt: { $gte: cutoffDate },
  }).exec();
};

/**
 * Calculate conversion rate for a given strategy
 *
 * @param strategy - 'brrrr' | 'buy-hold'
 * @param daysBack - Number of days to look back (default: 7)
 * @returns Promise<{ total: number, converted: number, rate: number }>
 */
AnonymousPdfRequestSchema.statics.getConversionRate = async function (
  strategy: PdfStrategy,
  daysBack: number = 7
): Promise<{ total: number; converted: number; rate: number }> {
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const total = await this.countDocuments({
    strategy,
    createdAt: { $gte: cutoffDate },
  }).exec();

  const converted = await this.countDocuments({
    strategy,
    convertedToSignup: true,
    createdAt: { $gte: cutoffDate },
  }).exec();

  const rate = total > 0 ? (converted / total) * 100 : 0;

  return { total, converted, rate };
};

/**
 * Get average time to conversion (in days)
 *
 * @param strategy - Optional strategy filter
 * @returns Promise<number> - Average days from PDF request to signup
 */
AnonymousPdfRequestSchema.statics.getAverageTimeToConversion = async function (
  strategy?: PdfStrategy
): Promise<number> {
  const matchStage: any = { convertedToSignup: true };
  if (strategy) {
    matchStage.strategy = strategy;
  }

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $project: {
        daysToConversion: {
          $divide: [
            { $subtract: ['$signupDate', '$createdAt'] },
            1000 * 60 * 60 * 24,  // Convert ms to days
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgDays: { $avg: '$daysToConversion' },
      },
    },
  ]).exec();

  return result.length > 0 ? result[0].avgDays : 0;
};

// ============================================================
// Export Model
// ============================================================

const AnonymousPdfRequest = mongoose.model<IAnonymousPdfRequestDocument>(
  'AnonymousPdfRequest',
  AnonymousPdfRequestSchema
);

export default AnonymousPdfRequest;
