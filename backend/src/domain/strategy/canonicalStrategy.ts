/**
 * canonicalStrategy — Issue #243 (2026-07-12).
 *
 * The single canonical strategy vocabulary for the entire codebase per
 * `/docs/ARCHITECTURE_PRINCIPLES.md` §P10.
 *
 * `CanonicalStrategy` is re-exported from `services/dealMetrics/types.ts`
 * so `dealMetrics` remains the anchor definition per P1 (no duplicate
 * type declaration). New code should import `CanonicalStrategy` from
 * THIS module (`domain/strategy`) so the anchor location can move without
 * downstream churn.
 *
 * See also:
 *   - `normalizeStrategy.ts` — canonicalize any alias (kebab / SCREAMING /
 *     spaced / snake) to `CanonicalStrategy | null`.
 *   - `toLegacyDealStrategy.ts` — one-directional projector from
 *     canonical snake to the legacy `Deal.investmentStrategy` kebab shape.
 */

import { z } from 'zod';
import type { DealStrategy } from '../../services/dealMetrics/types';

/**
 * The canonical strategy enum for the entire codebase.
 *
 * Re-exports `DealStrategy` from `services/dealMetrics/types.ts` — that
 * file is the anchor definition, this module the public re-export point.
 */
export type CanonicalStrategy = DealStrategy;

/** Runtime schema counterpart of `CanonicalStrategy`. */
export const CanonicalStrategySchema = z.enum(['buy_hold', 'brrrr', 'house_hack']);

/**
 * Kebab-case aliases used by the legacy Deal wire shape and older
 * frontend/PDF code paths. Values map to canonical snake.
 */
export const KEBAB_STRATEGY_ALIASES: Readonly<Record<string, CanonicalStrategy>> = {
  'buy-hold': 'buy_hold',
  'brrrr': 'brrrr',
  'house-hack': 'house_hack',
};

/**
 * Snake-case aliases — the canonical vocabulary itself. Included in the
 * alias map so `normalizeStrategy` can treat all vocabularies uniformly
 * (and remain idempotent).
 */
export const SNAKE_STRATEGY_ALIASES: Readonly<Record<string, CanonicalStrategy>> = {
  'buy_hold': 'buy_hold',
  'brrrr': 'brrrr',
  'house_hack': 'house_hack',
};

/**
 * SCREAMING_SNAKE aliases — used by PipelineDeal and a few legacy fixture
 * paths. Includes the misspelled `BRRR` (single R short) which appears
 * in older PipelineDeal enum entries and must round-trip cleanly.
 */
export const SCREAMING_STRATEGY_ALIASES: Readonly<Record<string, CanonicalStrategy>> = {
  'BUY_HOLD': 'buy_hold',
  'BRRRR': 'brrrr',
  'BRRR': 'brrrr', // misspelling in older PipelineDeal enum
  'HOUSE_HACK': 'house_hack',
};

/**
 * Spaced / mixed-case aliases seen in tier3 legacy fixtures. `Multi-Family`
 * is NOT a strategy (it is a propertyType); listed here as `null` so
 * `normalizeStrategy` explicitly rejects it rather than silently coercing.
 */
export const SPACED_STRATEGY_ALIASES: Readonly<Record<string, CanonicalStrategy | null>> = {
  'Buy & Hold': 'buy_hold',
  'BUY & HOLD': 'buy_hold',
  'Buy and Hold': 'buy_hold',
  'House Hack': 'house_hack',
  'House Hacking': 'house_hack',
  'Multi-Family': null, // NOT a strategy — propertyType
};
