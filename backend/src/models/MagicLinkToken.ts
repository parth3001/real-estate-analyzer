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
  /**
   * Anonymous chat sessionId to merge into the user on verify (W6-S5b).
   *
   * When set, the verify handler runs mergeAnonymousSessionIntoUser
   * SERVER-SIDE after the user is authenticated, then includes a
   * `claimedChat` block in the verify response so the frontend can
   * navigate to /app (instead of /dashboard).
   *
   * Why on the TOKEN row (not localStorage on the client)?
   *   Magic-link auth is cross-device by design — the user types email
   *   on desktop, clicks the link on phone. localStorage is origin- AND
   *   device-scoped. Binding the claim to the token row means the merge
   *   works no matter where the email opens.
   */
  pendingChatSessionId?: string;
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
    // W6-S5b — see IMagicLinkToken doc above. Optional; only set when
    // a chat sessionId was supplied at link-request time.
    pendingChatSessionId: {
      type: String,
      required: false,
      default: null,
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
