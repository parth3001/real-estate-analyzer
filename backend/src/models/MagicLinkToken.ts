import mongoose, { Schema, Document } from 'mongoose';

export type MagicLinkPurpose = 'login';

export interface IMagicLinkToken extends Document {
  emailNormalized: string;
  tokenHash: string;
  purpose: MagicLinkPurpose;
  expiresAt: Date;
  usedAt: Date | null;
  requestIp: string;
  requestUserAgent: string;
  createdAt: Date;
}

const MagicLinkTokenSchema = new Schema<IMagicLinkToken>(
  {
    emailNormalized: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['login'],
      default: 'login',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    requestIp: {
      type: String,
      default: '',
    },
    requestUserAgent: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index — MongoDB auto-deletes docs after expiresAt passes.
MagicLinkTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast lookup of unused tokens by email (invalidation path)
MagicLinkTokenSchema.index({ emailNormalized: 1, usedAt: 1 });

export const MagicLinkToken = mongoose.model<IMagicLinkToken>(
  'MagicLinkToken',
  MagicLinkTokenSchema
);
