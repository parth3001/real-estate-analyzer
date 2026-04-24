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

// Per-IP: 10 requests / 15min. A single user can easily hit multiple requests
// legitimately (typo, resend, log-out-and-back, testing). The POST always
// returns 200 regardless of success, so we can't skip-successful-requests.
// Tighter limits create false-positive lockouts that are worse than the
// abuse vector they prevent. Email-based limit below catches the real
// case (one address being spammed).
const magicLinkIpLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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
 * POST /api/auth/magic-link/verify
 *
 * Consume a magic link. Token comes from the request body, NOT the query
 * string, specifically to avoid email-scanner prefetch consumption:
 * inbox anti-phishing scanners (Gmail, Outlook, corporate) fetch URLs
 * in emails to vet them; a GET endpoint would let those fetches burn
 * the one-time token before the user ever clicks. POST with body is
 * never pre-fetched.
 *
 * The frontend's /auth/verify page shows an interstitial "Continue"
 * button so the POST only fires on a genuine human click.
 *
 * Returns JWT pair + user on success, or
 * { ok: false, reason: 'expired'|'used'|'invalid' } on failure.
 */
router.post('/magic-link/verify', validateMagicLinkVerify, verifyMagicLink);

export default router;
