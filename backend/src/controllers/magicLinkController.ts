import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { body, validationResult } from 'express-validator';
import { MagicLinkToken } from '../models/MagicLinkToken';
import { User } from '../models/User';
import { emailService } from '../services/emailService';
import { authService } from '../services/authService';
import { mergeAnonymousSessionIntoUser } from '../services/chatSessionMergeService';
import {
  generateMagicLinkToken,
  hashMagicLinkToken,
  normalizeEmail,
} from '../utils/magicLinkToken';
import { logger } from '../utils/logger';

const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const TERMS_VERSION = process.env.TERMS_VERSION || '2026-01';

type VerifyFailureReason = 'expired' | 'used' | 'invalid';

function getFeatureFlag(): boolean {
  const raw = process.env.MAGIC_LINK_ENABLED ?? 'true';
  return raw.toLowerCase() === 'true';
}

function getClientIp(req: Request): string {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || '';
}

function getUserAgent(req: Request): string {
  return req.get('user-agent') || '';
}

/**
 * POST /api/auth/magic-link
 * Request body: { email: string }
 *
 * Always returns 200 { ok: true } on success-or-nonexistent-email to
 * prevent account enumeration. 429 from rate limit middleware is the
 * only non-200 success path.
 */
export const requestMagicLink = async (req: Request, res: Response): Promise<void> => {
  if (!getFeatureFlag()) {
    res.status(503).json({ error: 'Magic-link sign-in is temporarily unavailable.' });
    return;
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Invalid email.', details: errors.array() });
    return;
  }

  const email = normalizeEmail(req.body.email);
  const requestIp = getClientIp(req);
  const requestUserAgent = getUserAgent(req);
  // W6-S5b — optional chat sessionId to bind to the token row.
  // Validated by the route's `validateMagicLinkRequest` chain
  // (isUUID + isLength). Stored on the token so the verify handler
  // can claim it server-side regardless of which device opens the link.
  const pendingChatSessionId =
    typeof req.body.pendingChatSessionId === 'string' &&
    req.body.pendingChatSessionId.length > 0
      ? req.body.pendingChatSessionId
      : null;

  try {
    // Invalidate any prior unused tokens for this email — prevents stacking.
    await MagicLinkToken.updateMany(
      { emailNormalized: email, usedAt: null },
      { $set: { usedAt: new Date() } }
    );

    const { raw, hash } = generateMagicLinkToken();

    await MagicLinkToken.create({
      emailNormalized: email,
      tokenHash: hash,
      purpose: 'login',
      expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MS),
      usedAt: null,
      requestIp,
      requestUserAgent,
      pendingChatSessionId,
    });

    const existingUser = await User.findOne({ email }).lean();
    const isNewUser = !existingUser;

    // Email sending is awaited but failures do NOT leak to the caller.
    // Enumeration protection: caller cannot tell whether email delivery
    // succeeded or the email was even valid.
    try {
      await emailService.sendMagicLinkEmail(email, raw, {
        isNewUser,
        firstName: existingUser?.firstName,
        userId: existingUser?._id,
      });
    } catch (mailErr) {
      logger.error('[MagicLink] email send failed', {
        email,
        err: mailErr instanceof Error ? mailErr.message : String(mailErr),
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    logger.error('[MagicLink] request failed', {
      err: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: 'Could not process sign-in request.' });
  }
};

/**
 * GET /api/auth/magic-link/verify?token=xxx
 * Returns JWT pair + user on success. On failure, returns reason so the
 * frontend can render the correct error state.
 */
export const verifyMagicLink = async (req: Request, res: Response): Promise<void> => {
  if (!getFeatureFlag()) {
    res.status(503).json({ error: 'Magic-link sign-in is temporarily unavailable.' });
    return;
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ ok: false, reason: 'invalid' satisfies VerifyFailureReason });
    return;
  }

  const rawToken = String(req.body?.token || '');
  if (!rawToken) {
    res.status(400).json({ ok: false, reason: 'invalid' satisfies VerifyFailureReason });
    return;
  }

  try {
    const hash = hashMagicLinkToken(rawToken);
    const tokenDoc = await MagicLinkToken.findOne({ tokenHash: hash });

    if (!tokenDoc) {
      res.status(404).json({ ok: false, reason: 'invalid' satisfies VerifyFailureReason });
      return;
    }

    if (tokenDoc.usedAt !== null) {
      res.status(410).json({
        ok: false,
        reason: 'used' satisfies VerifyFailureReason,
        email: tokenDoc.emailNormalized,
      });
      return;
    }

    if (tokenDoc.expiresAt.getTime() <= Date.now()) {
      res.status(410).json({
        ok: false,
        reason: 'expired' satisfies VerifyFailureReason,
        email: tokenDoc.emailNormalized,
      });
      return;
    }

    // Atomic consumption — the filter `usedAt: null` protects against
    // a concurrent second verify (corp email scanner pre-fetch + user click).
    const consumed = await MagicLinkToken.findOneAndUpdate(
      { _id: tokenDoc._id, usedAt: null },
      { $set: { usedAt: new Date() } },
      { new: true }
    );

    if (!consumed) {
      res.status(410).json({
        ok: false,
        reason: 'used' satisfies VerifyFailureReason,
        email: tokenDoc.emailNormalized,
      });
      return;
    }

    const email = tokenDoc.emailNormalized;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        firstName: '',
        lastName: '',
        role: 'user',
        isVerified: true,
        emailVerifiedAt: new Date(),
        lastLogin: new Date(),
        registrationIp: tokenDoc.requestIp,
        registrationUserAgent: tokenDoc.requestUserAgent,
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        termsAcceptedIp: tokenDoc.requestIp,
      });
    } else {
      user.lastLogin = new Date();
      if (!user.isVerified) user.isVerified = true;
      if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
      await user.save();
    }

    const tokens = authService.generateTokens(user);

    // W6-S5b — server-side ghost-user merge.
    //
    // If the request that created this token carried a pendingChatSessionId,
    // claim it now. The merge is idempotent: a stale sessionId (no ghost
    // exists for it) returns merged: false. Failures are logged but do
    // NOT fail the login — the user is authenticated regardless.
    let claimedChat:
      | {
          merged: boolean;
          eventsMerged: number;
          returnTo: string;
        }
      | undefined;
    if (tokenDoc.pendingChatSessionId) {
      try {
        const result = await mergeAnonymousSessionIntoUser(
          tokenDoc.pendingChatSessionId,
          user._id as Types.ObjectId
        );
        claimedChat = {
          merged: result.merged,
          eventsMerged: result.eventsMerged,
          returnTo: '/app',
        };
        logger.info('[MagicLink] chat session claim completed', {
          email,
          sessionId: tokenDoc.pendingChatSessionId,
          merged: result.merged,
          eventsMerged: result.eventsMerged,
        });
      } catch (claimErr) {
        // Non-fatal — user is authenticated, we just couldn't merge.
        // Deal events stay queryable under the ghost user; a future
        // claim or cleanup job picks them up.
        logger.warn('[MagicLink] chat session claim failed', {
          email,
          sessionId: tokenDoc.pendingChatSessionId,
          err: claimErr instanceof Error ? claimErr.message : String(claimErr),
        });
      }
    }

    res.status(200).json({
      ok: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
      ...(claimedChat ? { claimedChat } : {}),
    });
  } catch (err) {
    logger.error('[MagicLink] verify failed', {
      err: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ ok: false, reason: 'invalid' satisfies VerifyFailureReason });
  }
};

export const validateMagicLinkRequest = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 254 })
    .withMessage('Email is too long'),
  // W6-S5b — optional chat sessionId. Must be a UUID v4 when present;
  // any other shape is rejected to keep this clean of injection
  // vectors (the value is stored on the token row + used as a
  // server-side lookup key in the merge service).
  body('pendingChatSessionId')
    .optional()
    .isUUID()
    .withMessage('pendingChatSessionId must be a valid UUID'),
];

export const validateMagicLinkVerify = [
  body('token')
    .isString()
    .isLength({ min: 64, max: 64 })
    .matches(/^[a-f0-9]+$/)
    .withMessage('Invalid token format'),
];
