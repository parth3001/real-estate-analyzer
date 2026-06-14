import crypto from 'crypto';

export interface MagicLinkTokenPair {
  raw: string;   // Sent in the email link. Never stored server-side.
  hash: string;  // Stored in DB. Used for lookup on verify.
}

/**
 * Generate a fresh magic-link token pair.
 * - 32 random bytes → 64 hex chars: 256 bits of entropy, URL-safe as hex.
 * - Hash is SHA-256 of raw. Storing only the hash means a DB leak
 *   can't produce usable tokens without the email-side plaintext.
 */
export function generateMagicLinkToken(): MagicLinkTokenPair {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = hashMagicLinkToken(raw);
  return { raw, hash };
}

export function hashMagicLinkToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Normalize an email for storage + lookup.
 *
 * Behavior (2026-06-14, Task #14 prep — anti-abuse on free-tier signup):
 *   1. Trim + lowercase
 *   2. For Gmail / Outlook / iCloud: strip the `+subaddress` portion of
 *      the local part. Prevents one base inbox (e.g., ppatel21@gmail.com)
 *      from creating unlimited "distinct" accounts via `+tag` aliasing
 *      and stacking free-tier credits.
 *   3. For Gmail specifically: also strip dots in the local part.
 *      Gmail's address engine treats `p.patel21@gmail.com` and
 *      `ppatel21@gmail.com` as the same mailbox; we mirror that.
 *
 * Matches the behavior of express-validator's `normalizeEmail()` used
 * in authController, so the password and magic-link signup paths are
 * symmetric — `+tag` doesn't slip through on either side.
 *
 * Other providers (Yahoo, Fastmail, custom domains) pass through with
 * just trim+lowercase. Their subaddressing semantics vary; treating
 * them all uniformly would either let abuse through (no normalization)
 * or block legitimate addresses (over-normalization).
 */
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return trimmed;

  let local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  const subaddressProviders = new Set([
    'gmail.com',
    'googlemail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'icloud.com',
    'me.com',
    'mac.com',
  ]);

  if (subaddressProviders.has(domain)) {
    // Strip everything after `+` in the local part.
    const plusIndex = local.indexOf('+');
    if (plusIndex !== -1) local = local.slice(0, plusIndex);
  }

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Strip dots in the local part — Gmail treats them as no-ops.
    local = local.replace(/\./g, '');
  }

  return `${local}@${domain}`;
}
