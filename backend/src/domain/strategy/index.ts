/**
 * domain/strategy — canonical strategy module (Issue #243, 2026-07-12).
 *
 * The single import point for every strategy-shaped value in the
 * backend per `/docs/ARCHITECTURE_PRINCIPLES.md` §P10.
 */

export type { CanonicalStrategy } from './canonicalStrategy';
export {
  CanonicalStrategySchema,
  KEBAB_STRATEGY_ALIASES,
  SNAKE_STRATEGY_ALIASES,
  SCREAMING_STRATEGY_ALIASES,
  SPACED_STRATEGY_ALIASES,
} from './canonicalStrategy';
export {
  normalizeStrategy,
  assertCanonicalStrategy,
  getNonCanonicalInputCount,
  resetNonCanonicalInputCount,
} from './normalizeStrategy';
export {
  toLegacyDealStrategy,
  fromLegacyDealStrategy,
} from './toLegacyDealStrategy';
export type { LegacyDealStrategy } from './toLegacyDealStrategy';
export { formatStrategyLabel } from './formatStrategyLabel';
