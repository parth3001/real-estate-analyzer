/**
 * Shared Analysis MongoDB Model
 *
 * Purpose: Track when authenticated users share property analysis reports via email
 * Use Cases:
 *   - Share history for users ("who did I send this to?")
 *   - Resend capability
 *   - Analytics on share patterns
 *
 * Created: 2026-04-15
 */

import mongoose, { Schema, Document } from 'mongoose';
import { ISharedAnalysis, PdfStrategy } from '../types/pdf.types';

// ============================================================
// MongoDB Document Interface
// ============================================================

export interface ISharedAnalysisDocument extends ISharedAnalysis, Document {
  _id: mongoose.Types.ObjectId;
}

// ============================================================
// MongoDB Schema Definition
// ============================================================

const SharedAnalysisSchema = new Schema<ISharedAnalysisDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    senderEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: (props: any) => `${props.value} is not a valid email address`,
      },
    },

    ccEmail: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },

    personalNote: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },

    strategy: {
      type: String,
      required: true,
      enum: ['brrrr', 'buy-hold'],
    },

    propertyAddress: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },

    dealQualityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    analysisChecksum: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
    },

    pdfFileSizeBytes: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: ['sent', 'failed'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
    collection: 'sharedanalyses',
  }
);

// ============================================================
// Indexes
// ============================================================

SharedAnalysisSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'user_share_history_idx' }
);

// ============================================================
// Static Methods
// ============================================================

SharedAnalysisSchema.statics.getShareHistory = async function (
  userId: string,
  limit: number = 20
): Promise<ISharedAnalysisDocument[]> {
  return this.find({ userId, status: 'sent' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('recipientEmail ccEmail strategy propertyAddress dealQualityScore createdAt')
    .exec();
};

// ============================================================
// Export Model
// ============================================================

const SharedAnalysis = mongoose.model<ISharedAnalysisDocument>(
  'SharedAnalysis',
  SharedAnalysisSchema
);

export default SharedAnalysis;
