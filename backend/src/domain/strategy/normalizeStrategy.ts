/**
 * normalizeStrategy — Issue #243 (2026-07-12).
 *
 * The SINGLE canonical entry point for translating any strategy alias
 * (kebab / snake / SCREAMING / spaced / misspelled) to `CanonicalStrategy`
 * per `/docs/ARCHITECTURE_PRINCIPLES.md` §P10.
 *
 * No other module in the backend defines a function named
 * `normalizeStrategy`. Every inline strategy-coercion ternary (materializer,
 * controllers/deals.ts, compute_deal_metric, orchestrator, perturbation
 * runner, get_decision_breakdown, BasePropertyAnalyzer) imports from
 * here.
 *
 * Behavior:
 *   - Accepts kebab (`'buy-hold'`, `'house-hack'`), snake (`'buy_hold'`,
 *     `'house_hack'`), SCREAMING (`'BUY_HOLD'`, `'HOUSE_HACK'`, `'BRRR'`
 *     misspelling → `'brrrr'`), spaced (`'Buy & Hold'`), case-insensitive.
 *   - Returns `null` for genuinely unrecognized input.
 *   - Logs WARN + increments a metric counter on non-canonical input
 *     (P16: silent drops unacceptable).
 *   - Explicitly REJECTS DecisionEvent philosophy values (`'cashflow'`,
 *     `'appreciation'`, `'balanced'`) with an INFO log and null return —
 *     any caller misusing the persona field as if it were a type is
 *     caught immediately.
 *   - Purely functional and idempotent:
 *       normalizeStrategy(normalizeStrategy(x)) === normalizeStrategy(x)
 */

import { logger } from '../../utils/logger';
import {
  CanonicalStrategy,
  KEBAB_STRATEGY_ALIASES,
  SNAKE_STRATEGY_ALIASES,
  SCREAMING_STRATEGY_ALIASES,
  SPACED_STRATEGY_ALIASES,
} from './canonicalStrategy';

/**
 * Persona / investor-philosophy values from DecisionEvent.userContext.
 * These are NOT investment types (buy_hold / brrrr / house_hack); any
 * caller passing one here is confusing the two fields (root of #243).
 * Explicitly rejected with INFO logging.
 */
const PHILOSOPHY_VALUES = new Set<string>(['cashflow', 'appreciation', 'balanced']);

// Metric counter for non-canonical inputs (P16). Kept as a module-local
// tally so the observability surface can read it out via a small helper
// without pulling in a full metrics library. Exposed for tests.
const _nonCanonicalInputCount = { value: 0 };
export function getNonCanonicalInputCount(): number {
  return _nonCanonicalInputCount.value;
}
export function resetNonCanonicalInputCount(): void {
  _nonCanonicalInputCount.value = 0;
}

/**
 * Try each alias table in canonical → alias fallback order. Returns
 * the CanonicalStrategy on hit, undefined on miss (undefined lets the
 * caller distinguish "explicit null reject" from "not-in-any-table").
 */
function tryAliasLookup(raw: string): CanonicalStrategy | null | undefined {
  // Snake is the canonical vocabulary itself — check FIRST so the
  // idempotency invariant (normalize(normalize(x)) === normalize(x))
  // holds without a WARN log on every re-run.
  if (raw in SNAKE_STRATEGY_ALIASES) {
    return SNAKE_STRATEGY_ALIASES[raw];
  }
  if (raw in KEBAB_STRATEGY_ALIASES) {
    return KEBAB_STRATEGY_ALIASES[raw];
  }
  if (raw in SCREAMING_STRATEGY_ALIASES) {
    return SCREAMING_STRATEGY_ALIASES[raw];
  }
  if (raw in SPACED_STRATEGY_ALIASES) {
    // May legitimately be `null` (e.g., 'Multi-Family' is a propertyType,
    // not a strategy — return the explicit null so caller knows it was
    // recognized and rejected, not "unknown").
    return SPACED_STRATEGY_ALIASES[raw];
  }
  return undefined;
}

/**
 * Case-insensitive alias lookup — used as a fallback for arbitrary
 * mixed-case input like 'Buy-Hold' or 'HOUSE-HACK'. Kept as a second
 * pass to preserve the WARN-free fast path for canonical snake.
 */
function tryCaseInsensitiveLookup(raw: string): CanonicalStrategy | null | undefined {
  const upper = raw.toUpperCase();
  const lower = raw.toLowerCase();
  // SCREAMING table matches on uppercase directly.
  if (upper in SCREAMING_STRATEGY_ALIASES) {
    return SCREAMING_STRATEGY_ALIASES[upper];
  }
  // kebab + snake tables are all lowercase.
  if (lower in KEBAB_STRATEGY_ALIASES) {
    return KEBAB_STRATEGY_ALIASES[lower];
  }
  if (lower in SNAKE_STRATEGY_ALIASES) {
    return SNAKE_STRATEGY_ALIASES[lower];
  }
  return undefined;
}

/**
 * normalizeStrategy — accepts any strategy alias, returns
 * CanonicalStrategy or null.
 *
 * The single translation point per P10. All application code that
 * needs to compare or branch on strategy MUST pass values through
 * this function first.
 */
export function normalizeStrategy(raw: unknown): CanonicalStrategy | null {
  if (raw == null) return null;
  if (typeof raw !== 'string') {
    _nonCanonicalInputCount.value += 1;
    logger.warn(
      '[normalizeStrategy] non-string input received',
      { rawType: typeof raw }
    );
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  // P10 explicit reject: philosophy values from DecisionEvent.userContext
  // are NOT investment types. If any caller passes one here, they're
  // confusing the two fields (root of #243). Fail visibly (INFO log +
  // null return) rather than misclassifying.
  if (PHILOSOPHY_VALUES.has(trimmed.toLowerCase())) {
    logger.info(
      '[normalizeStrategy] philosophy value rejected (not a strategy type)',
      { raw: trimmed }
    );
    return null;
  }

  // Fast path — exact match against any alias table.
  const exactMatch = tryAliasLookup(trimmed);
  if (exactMatch !== undefined) {
    // Non-canonical alias (kebab / SCREAMING / spaced) → increment the
    // observability counter + WARN so drift is visible. The canonical
    // snake path (SNAKE_STRATEGY_ALIASES) is checked first and returns
    // BEFORE this branch, so idempotent re-normalization stays quiet.
    if (!(trimmed in SNAKE_STRATEGY_ALIASES)) {
      _nonCanonicalInputCount.value += 1;
      logger.warn(
        '[normalizeStrategy] non-canonical alias received',
        { raw: trimmed, canonical: exactMatch }
      );
    }
    return exactMatch;
  }

  // Case-insensitive fallback — handles arbitrary mixed case.
  const caseFold = tryCaseInsensitiveLookup(trimmed);
  if (caseFold !== undefined) {
    _nonCanonicalInputCount.value += 1;
    logger.warn(
      '[normalizeStrategy] case-fold alias received',
      { raw: trimmed, canonical: caseFold }
    );
    return caseFold;
  }

  // Genuinely unrecognized — log at WARN + return null so caller can
  // apply an explicit fallback.
  _nonCanonicalInputCount.value += 1;
  logger.warn('[normalizeStrategy] unrecognized strategy input', {
    raw: trimmed,
  });
  return null;
}

/**
 * assertCanonicalStrategy — throws (or falls back explicitly) if the
 * input cannot be canonicalized. Used at Zod-boundary and startup
 * points where a null return is a bug, not an expected outcome (P17
 * fail-fast at boundaries).
 */
export function assertCanonicalStrategy(
  raw: unknown,
  opts?: { defaultTo?: CanonicalStrategy }
): CanonicalStrategy {
  const canonical = normalizeStrategy(raw);
  if (canonical !== null) return canonical;
  if (opts?.defaultTo !== undefined) return opts.defaultTo;
  throw new Error(
    `assertCanonicalStrategy: cannot canonicalize strategy input ${JSON.stringify(
      raw
    )}`
  );
}
