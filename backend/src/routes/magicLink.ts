import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateEmailDomainMiddleware } from '../utils/emailValidator';
import {
  requestMagicLink,
  verifyMagicLink,
  validateMagicLinkRequest,
  validateMagicLinkVerify,
} from '../controllers/magicLinkController';

const router = Router();

// Per-IP: 3 requests / 15min. Matches existing emailRateLimit tightness.
const magicLinkIpLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many sign-in requests. Try again in 15 minutes.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-email: 5 requests / hour. Prevents one IP from burning another user's quota
// via rotating IPs. Uses normalized email from body as the key.
const magicLinkEmailLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many sign-in requests for this email. Try again in an hour.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return email ? `email:${email}` : `ip:${req.ip}`;
  },
});

/**
 * POST /api/auth/magic-link
 * Request a sign-in link. Always returns 200 to prevent email enumeration.
 */
router.post(
  '/magic-link',
  magicLinkIpLimit,
  magicLinkEmailLimit,
  validateEmailDomainMiddleware,
  validateMagicLinkRequest,
  requestMagicLink
);

/**
 * GET /api/auth/magic-link/verify?token=xxx
 * Consume a magic link. Returns JWT pair + user on success,
 * or { ok: false, reason: 'expired'|'used'|'invalid' } on failure.
 */
router.get('/magic-link/verify', validateMagicLinkVerify, verifyMagicLink);

export default router;
