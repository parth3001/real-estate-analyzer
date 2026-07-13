/**
 * Frontend normalizeStrategy — Issue #243 (2026-07-12).
 *
 * Mirror of `backend/src/domain/strategy/normalizeStrategy.ts`. Behavior
 * parity is enforced by a shared JSON fixture referenced by both test
 * suites.
 */

import {
  KEBAB_STRATEGY_ALIASES,
  SNAKE_STRATEGY_ALIASES,
  SCREAMING_STRATEGY_ALIASES,
  SPACED_STRATEGY_ALIASES,
} from './canonicalStrategy';
import type { CanonicalStrategy } from './canonicalStrategy';

const PHILOSOPHY_VALUES = new Set<string>(['cashflow', 'appreciation', 'balanced']);

function tryAliasLookup(raw: string): CanonicalStrategy | null | undefined {
  if (raw in SNAKE_STRATEGY_ALIASES) return SNAKE_STRATEGY_ALIASES[raw];
  if (raw in KEBAB_STRATEGY_ALIASES) return KEBAB_STRATEGY_ALIASES[raw];
  if (raw in SCREAMING_STRATEGY_ALIASES) return SCREAMING_STRATEGY_ALIASES[raw];
  if (raw in SPACED_STRATEGY_ALIASES) return SPACED_STRATEGY_ALIASES[raw];
  return undefined;
}

function tryCaseInsensitiveLookup(raw: string): CanonicalStrategy | null | undefined {
  const upper = raw.toUpperCase();
  const lower = raw.toLowerCase();
  if (upper in SCREAMING_STRATEGY_ALIASES) return SCREAMING_STRATEGY_ALIASES[upper];
  if (lower in KEBAB_STRATEGY_ALIASES) return KEBAB_STRATEGY_ALIASES[lower];
  if (lower in SNAKE_STRATEGY_ALIASES) return SNAKE_STRATEGY_ALIASES[lower];
  return undefined;
}

/**
 * Canonicalize any strategy alias. Returns `CanonicalStrategy | null`.
 * Idempotent: normalize(normalize(x)) === normalize(x).
 */
export function normalizeStrategy(raw: unknown): CanonicalStrategy | null {
  if (raw == null) return null;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (PHILOSOPHY_VALUES.has(trimmed.toLowerCase())) return null;
  const exact = tryAliasLookup(trimmed);
  if (exact !== undefined) return exact;
  const caseFold = tryCaseInsensitiveLookup(trimmed);
  if (caseFold !== undefined) return caseFold;
  return null;
}

export function assertCanonicalStrategy(
  raw: unknown,
  opts?: { defaultTo?: CanonicalStrategy }
): CanonicalStrategy {
  const canonical = normalizeStrategy(raw);
  if (canonical !== null) return canonical;
  if (opts?.defaultTo !== undefined) return opts.defaultTo;
  throw new Error(
    `assertCanonicalStrategy: cannot canonicalize strategy input ${JSON.stringify(raw)}`
  );
}
