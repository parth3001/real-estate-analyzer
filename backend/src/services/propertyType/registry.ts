/**
 * Property-type registry — the single source of truth for which property
 * types the platform supports and what each one can do.
 *
 * Task #20 (2026-05-27). The architectural seam that makes adding a new
 * property type (Commercial, Self-Storage, etc.) a one-line registry
 * entry instead of hunting down N scattered `if (type === 'MF') ... else`
 * branches.
 *
 * Why this exists
 * ---------------
 * Before this registry, property-type routing was open-coded in at least
 * 5 places (compute_analysis, score_deal, dealMaterializationService,
 * dealScoreCardProjection, scenarioSensitivity gate). Worse — those sites
 * had VOCABULARY DRIFT: the canonical `PropertyType` enum is `'SFR' | 'MF'`,
 * but `compute_analysis.ts` used its own `'SFR' | 'Multi-Family'` enum.
 * Same concept, different spellings, no compile-time check that they stayed
 * in sync.
 *
 * At property type #3 (Commercial, Self-Storage, etc.) that pattern would
 * have broken: a new entry would need to be added to N files, in the
 * right vocabulary, with no enforcement. This registry consolidates the
 * decision points so a new type = one entry here + the analyzer class.
 *
 * What's in scope for v1
 * ----------------------
 * - Canonical `PropertyType` key alignment (no more drift)
 * - Analyzer factory (the analyzer is the deterministic engine wrapper —
 *   asymmetric constructor differences are handled here, not at call sites)
 * - `fullySupported` flag — consumed by Task #21's agent gate to politely
 *   decline non-fully-supported types instead of producing half-broken output
 * - `sensitivitySupported` flag — consumed by the stress-test runner
 *   (services/perturbation/runner.ts) and the workspace SensitivityPanel
 * - `detailsVariant` — frontend uses this to choose which Details renderer
 *   to mount in the scenario-scoped workspace
 *
 * What's NOT in scope for v1
 * --------------------------
 * - Engine factory. The Decision engines (InvestmentDecisionEngine for SFR,
 *   MFDecisionEngine for MF) have asymmetric constructor signatures
 *   (MFDecisionEngine takes constructor args; the SFR engine is stateless
 *   then called per-decision). Unifying them behind one factory shape is a
 *   separate cleanup — score_deal's existing ScoringEngineAdapter handles
 *   that dispatch and stays as-is for now.
 */

import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import { MultiFamilyAnalyzer } from '../../analysis/MultiFamilyAnalyzer';
import type {
  PropertyType,
  SFRData,
  MultiFamilyData,
} from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';
import type { BasePropertyAnalyzer } from '../../analysis/BasePropertyAnalyzer';
import type { CommonMetrics } from '../../types/propertyTypes';

// ===== Capability shape =====

/**
 * Capabilities + factory functions for a single property type. Every
 * PropertyType has exactly one of these in the registry; lookups go
 * through `getPropertyTypeCapabilities()` which throws loudly for
 * unknown types (no silent fallthrough — that's the bug-defense).
 */
export interface PropertyTypeCapabilities {
  /** Canonical key — matches `PropertyType` enum in propertyTypes.ts. */
  key: PropertyType;

  /**
   * Human-readable label. Used by the agent gate (Task #21) when politely
   * declining a non-fully-supported type, and by narration layers that
   * want a friendly name ("Multi-Family" rather than "MF").
   */
  label: string;

  /**
   * Construct the analyzer for this property type. The factory wraps the
   * asymmetric type signatures of SFR vs MF analyzer classes behind a
   * single call shape.
   */
  analyzerFactory: (
    data: SFRData | MultiFamilyData,
    assumptions: AnalysisAssumptions
  ) => BasePropertyAnalyzer<SFRData | MultiFamilyData, CommonMetrics>;

  /**
   * True when the platform's new 2.0 agent flow can fully handle this
   * type — scoring + stress testing + workspace depth + narrative. When
   * false, the agent gate (Task #21) declines politely and routes the
   * user to whatever fallback exists (e.g., the legacy /mf-analysis page).
   */
  fullySupported: boolean;

  /**
   * True when the deterministic stress-test runner
   * (services/perturbation/runner.ts) and the workspace SensitivityPanel
   * support this type. May be false even when `fullySupported` is true
   * (e.g., a type could be scoreable but not yet stress-testable).
   */
  sensitivitySupported: boolean;

  /**
   * Frontend hint for which Details variant to mount in the
   * scenario-scoped workspace. Currently SFR has rich Details; MF deals
   * link out to /mf-analysis until the MF variant is built.
   */
  detailsVariant: 'sfr' | 'mf';
}

// ===== The registry =====

/**
 * Single source of truth. Adding a new property type = one entry here +
 * the analyzer class + (when ready) a new variant on `detailsVariant`.
 * No grep-and-update across N files.
 */
export const PROPERTY_TYPE_REGISTRY: Record<PropertyType, PropertyTypeCapabilities> = {
  SFR: {
    key: 'SFR',
    label: 'Single-Family Residential',
    analyzerFactory: (data, assumptions) =>
      new SFRAnalyzer(
        data as SFRData,
        assumptions
      ) as unknown as BasePropertyAnalyzer<SFRData | MultiFamilyData, CommonMetrics>,
    fullySupported: true,
    sensitivitySupported: true,
    detailsVariant: 'sfr',
  },
  MF: {
    key: 'MF',
    label: 'Multi-Family',
    analyzerFactory: (data, assumptions) =>
      new MultiFamilyAnalyzer(
        data as MultiFamilyData,
        assumptions
      ) as unknown as BasePropertyAnalyzer<SFRData | MultiFamilyData, CommonMetrics>,
    // Task #21 prep: MF agent flow isn't fully supported yet. The Details
    // variant is SFR-shaped, sensitivity is SFR-only, etc. The agent gate
    // will politely decline rather than produce half-broken output.
    fullySupported: false,
    sensitivitySupported: false,
    detailsVariant: 'mf',
  },
};

// ===== Lookup helpers =====

/**
 * Canonical lookup. Throws loudly if `type` isn't in the registry — that's
 * the bug-defense.
 *
 * If a future property type (e.g., 'Commercial') reaches a code path that
 * tries to dispatch on it but the registry entry is missing, this throws
 * instead of silently falling through to SFR (which would produce nonsense
 * math for a different property class — exactly the dangerous failure mode
 * the registry exists to prevent).
 */
export function getPropertyTypeCapabilities(
  type: PropertyType | string
): PropertyTypeCapabilities {
  const cap = (PROPERTY_TYPE_REGISTRY as Record<string, PropertyTypeCapabilities | undefined>)[
    type
  ];
  if (!cap) {
    throw new Error(
      `Property type '${type}' is not registered. Known types: ` +
        `${Object.keys(PROPERTY_TYPE_REGISTRY).join(', ')}. ` +
        `Add an entry to PROPERTY_TYPE_REGISTRY before using this type ` +
        `in dispatch sites.`
    );
  }
  return cap;
}

/**
 * Convenience for the common "is this SFR?" type-guard pattern used by
 * the materializer and the dealScoreCardProjection. Delegates to the
 * registry so future type changes don't require updating these call
 * sites individually.
 */
export function isSFR(
  p: { propertyType?: PropertyType | string }
): p is SFRData {
  return p.propertyType === 'SFR';
}

/**
 * Same convenience for MF. Symmetric helper so call sites don't have to
 * compare against the magic string `'MF'` directly.
 */
export function isMF(p: { propertyType?: PropertyType | string }): boolean {
  return p.propertyType === 'MF';
}

/** Convenience: all registered property type keys (the canonical enum values). */
export const SUPPORTED_PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_REGISTRY) as PropertyType[];

/**
 * Convenience: only the FULLY-supported types. Used by the agent gate
 * (Task #21) when introducing the "MF is coming soon" UX — anything not
 * in this list triggers the polite decline.
 */
export function getFullySupportedTypes(): PropertyType[] {
  return SUPPORTED_PROPERTY_TYPES.filter(
    (t) => PROPERTY_TYPE_REGISTRY[t].fullySupported
  );
}

/**
 * Task #21: derive a polite "in development" message for property types
 * the 2.0 chat flow doesn't fully support yet. Returns null when the
 * type IS fully supported (caller continues normally).
 *
 * Keeps the chat agent's MF refusal message + the platform-level
 * messaging in lockstep — when MF flips to fullySupported, every
 * call site that consumed this helper stops showing the WIP nudge
 * automatically. Future types (Commercial, Self-Storage) plug in
 * the same way.
 */
export function getWipMessageForType(type: PropertyType | string): string | null {
  const cap = (PROPERTY_TYPE_REGISTRY as Record<string, PropertyTypeCapabilities | undefined>)[
    type
  ];
  if (!cap) return null; // Unknown type — caller handles via getPropertyTypeCapabilities throw
  if (cap.fullySupported) return null;
  return (
    `${cap.label} analysis through chat is in active development. ` +
    `For full ${cap.label.toLowerCase()} depth right now, use the ` +
    `dedicated wizard at /mf-analysis (unit-level inputs, per-unit metrics, GRM, BEO).`
  );
}

/**
 * Task #21: human-readable summary of what's live today vs in development.
 * Used by the chat empty state and landing-page status copy so the
 * platform messaging stays consistent.
 */
export function getPlatformStatusSummary(): {
  live: PropertyType[];
  inDevelopment: PropertyType[];
  liveLabels: string[];
  inDevelopmentLabels: string[];
} {
  const live: PropertyType[] = [];
  const inDevelopment: PropertyType[] = [];
  for (const t of SUPPORTED_PROPERTY_TYPES) {
    const cap = PROPERTY_TYPE_REGISTRY[t];
    (cap.fullySupported ? live : inDevelopment).push(t);
  }
  return {
    live,
    inDevelopment,
    liveLabels: live.map((t) => PROPERTY_TYPE_REGISTRY[t].label),
    inDevelopmentLabels: inDevelopment.map((t) => PROPERTY_TYPE_REGISTRY[t].label),
  };
}
