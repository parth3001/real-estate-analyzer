/**
 * toLegacyDealStrategy — Issue #243 (2026-07-12).
 *
 * One-directional projector (P12) from canonical snake to the legacy
 * `Deal.investmentStrategy` kebab wire shape.
 *
 * Legacy `Deal` documents persist strategy as
 *   `'buy-hold' | 'brrrr' | 'house-hack'`
 * The runtime canonical vocabulary is `'buy_hold' | 'brrrr' | 'house_hack'`.
 * Rather than touching every saved-properties document (a data
 * migration project), we project at the materializer boundary.
 *
 * Kept in a dedicated module (not co-located with normalizeStrategy)
 * because it is a WRITE-side projector — its inverse (`fromLegacyDealStrategy`)
 * composes with `normalizeStrategy` for reads. Explicit round-trip:
 *
 *   normalizeStrategy(toLegacyDealStrategy(s)) === s
 *   toLegacyDealStrategy(normalizeStrategy(kebab)!) === kebab
 */

import { normalizeStrategy } from './normalizeStrategy';
import type { CanonicalStrategy } from './canonicalStrategy';

export type LegacyDealStrategy = 'buy-hold' | 'brrrr' | 'house-hack';

const CANONICAL_TO_LEGACY: Readonly<Record<CanonicalStrategy, LegacyDealStrategy>> = {
  buy_hold: 'buy-hold',
  brrrr: 'brrrr',
  house_hack: 'house-hack',
};

/**
 * Project a canonical strategy to the legacy Deal wire shape.
 * Pure + deterministic.
 */
export function toLegacyDealStrategy(s: CanonicalStrategy): LegacyDealStrategy {
  return CANONICAL_TO_LEGACY[s];
}

/**
 * Inverse projector — normalize a legacy Deal kebab value back to
 * canonical. Convenience wrapper around `normalizeStrategy` for
 * read-path symmetry.
 */
export function fromLegacyDealStrategy(
  s: LegacyDealStrategy | string | undefined | null
): CanonicalStrategy | null {
  return normalizeStrategy(s);
}
