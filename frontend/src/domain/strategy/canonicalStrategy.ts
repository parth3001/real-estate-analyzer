/**
 * Frontend canonical strategy — Issue #243 (2026-07-12).
 *
 * Mirror of `backend/src/domain/strategy/canonicalStrategy.ts`. Frontend
 * and backend cannot share code without a monorepo package; parity is
 * enforced by a shared test fixture (see the __tests__ directory).
 */

export type CanonicalStrategy = 'buy_hold' | 'brrrr' | 'house_hack';

export const KEBAB_STRATEGY_ALIASES: Readonly<Record<string, CanonicalStrategy>> = {
  'buy-hold': 'buy_hold',
  'brrrr': 'brrrr',
  'house-hack': 'house_hack',
};

export const SNAKE_STRATEGY_ALIASES: Readonly<Record<string, CanonicalStrategy>> = {
  'buy_hold': 'buy_hold',
  'brrrr': 'brrrr',
  'house_hack': 'house_hack',
};

export const SCREAMING_STRATEGY_ALIASES: Readonly<Record<string, CanonicalStrategy>> = {
  'BUY_HOLD': 'buy_hold',
  'BRRRR': 'brrrr',
  'BRRR': 'brrrr',
  'HOUSE_HACK': 'house_hack',
};

export const SPACED_STRATEGY_ALIASES: Readonly<Record<string, CanonicalStrategy | null>> = {
  'Buy & Hold': 'buy_hold',
  'BUY & HOLD': 'buy_hold',
  'Buy and Hold': 'buy_hold',
  'House Hack': 'house_hack',
  'House Hacking': 'house_hack',
  'Multi-Family': null,
};

export type LegacyDealStrategy = 'buy-hold' | 'brrrr' | 'house-hack';

const CANONICAL_TO_LEGACY: Readonly<Record<CanonicalStrategy, LegacyDealStrategy>> = {
  buy_hold: 'buy-hold',
  brrrr: 'brrrr',
  house_hack: 'house-hack',
};

export function toLegacyDealStrategy(s: CanonicalStrategy): LegacyDealStrategy {
  return CANONICAL_TO_LEGACY[s];
}

/**
 * Analytics-boundary projector (P12) — GA dashboards have historical
 * continuity on the kebab strings, so we emit kebab at the analytics
 * hop. All INTERNAL code uses canonical.
 */
export function toAnalyticsStrategyDimension(s: CanonicalStrategy): LegacyDealStrategy {
  return CANONICAL_TO_LEGACY[s];
}
