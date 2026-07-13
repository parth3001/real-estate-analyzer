/**
 * formatStrategyLabel — Issue #243 (2026-07-12, iteration-2).
 *
 * The SINGLE canonical display-string helper for strategy values. Any
 * user-facing rendering (emails, PDFs, chat labels) MUST route through
 * this helper — inline ternaries like
 *   `strategy === 'brrrr' ? 'BRRRR' : 'Buy & Hold'`
 * are forbidden outside `backend/src/domain/strategy/**` per P10.
 *
 * See `/docs/ARCHITECTURE_PRINCIPLES.md` §P10 / §P12 (projectors at the
 * boundary, one canonical projector per concern).
 */

import type { CanonicalStrategy } from './canonicalStrategy';

const CANONICAL_TO_LABEL: Readonly<Record<CanonicalStrategy, string>> = {
  buy_hold: 'Buy & Hold',
  brrrr: 'BRRRR',
  house_hack: 'House Hack',
};

/**
 * Project a canonical strategy to its human-readable display label.
 * Pure + deterministic. Consumers should normalize the raw input first
 * (via `normalizeStrategy`) and fall back to `'buy_hold'` if the
 * normalizer returns null.
 */
export function formatStrategyLabel(canonical: CanonicalStrategy): string {
  return CANONICAL_TO_LABEL[canonical];
}
