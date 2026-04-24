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

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
