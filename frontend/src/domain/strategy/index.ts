/**
 * frontend/domain/strategy — canonical strategy module (Issue #243).
 *
 * Mirror of `backend/src/domain/strategy` for the frontend.
 */

export type {
  CanonicalStrategy,
  LegacyDealStrategy,
} from './canonicalStrategy';
export {
  KEBAB_STRATEGY_ALIASES,
  SNAKE_STRATEGY_ALIASES,
  SCREAMING_STRATEGY_ALIASES,
  SPACED_STRATEGY_ALIASES,
  toLegacyDealStrategy,
  toAnalyticsStrategyDimension,
} from './canonicalStrategy';
export { normalizeStrategy, assertCanonicalStrategy } from './normalizeStrategy';
