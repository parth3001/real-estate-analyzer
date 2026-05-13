/**
 * tool:compute_analysis — W4-S6.
 *
 * Wraps the legacy SFRAnalyzer / MultiFamilyAnalyzer behind the Tool
 * contract. Routes on `propertyType`: SFR → SFRAnalyzer, Multi-Family
 * → MultiFamilyAnalyzer. The analyzers themselves are untouched.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.2.
 *
 * SUBSTRATE BOUNDARY
 * ------------------
 *
 * Pure compute — no events. The analysis result is the input to
 * `tool:score_deal`, which is where the substrate write happens
 * (AnalysisEvent + DecisionEvent). compute_analysis just produces
 * the analysis payload; score_deal persists it.
 *
 * OUTPUT SHAPE
 * ------------
 *
 * Returns the three fields score_deal needs (`metrics`,
 * `monthlyAnalysis`, `longTermAnalysis`) plus the full
 * AnalysisResult for downstream consumers that want the rest
 * (projections, exitAnalysis, annualAnalysis).
 *
 * `longTermAnalysis` is composed from the analyzer's
 * `annualAnalysis` + `projections` + `exitAnalysis` — these were
 * separate fields in the legacy analyzer return, but the substrate's
 * AnalysisPayload bundles them as one nested object so the agent
 * mesh + chat surface treat them as a unit.
 */

import { z } from 'zod';
import {
  type Tool,
  type ToolContext,
  NO_RETRY,
} from './types';
import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import { MultiFamilyAnalyzer } from '../../analysis/MultiFamilyAnalyzer';
import type {
  AnalysisResult,
  CommonMetrics,
  SFRData,
  MultiFamilyData,
  SFRMetrics,
  MultiFamilyMetrics,
} from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';

// ===== Adapter =====

export type AnyAnalysisResult =
  | AnalysisResult<SFRMetrics>
  | AnalysisResult<MultiFamilyMetrics>;

/**
 * Adapter over the legacy analyzers. Same pattern as score_deal's
 * ScoringEngineAdapter and enrich_property's MarketIntelligenceAdapter:
 *   - Tests substitute fakes without mocking modules
 *   - The legacy code sees no test code, ever
 *   - The default impl is a few lines of routing
 */
export interface AnalyzerAdapter {
  analyze(args: {
    propertyData: SFRData | MultiFamilyData;
    assumptions: AnalysisAssumptions;
    propertyType: 'SFR' | 'Multi-Family';
  }): Promise<AnyAnalysisResult>;
}

export const defaultAnalyzerAdapter: AnalyzerAdapter = {
  async analyze({ propertyData, assumptions, propertyType }) {
    if (propertyType === 'Multi-Family') {
      const analyzer = new MultiFamilyAnalyzer(
        propertyData as MultiFamilyData,
        assumptions
      );
      // AnalysisResult<SFRMetrics> | AnalysisResult<MFMetrics> isn't
      // assignable to the union AnyAnalysisResult without widening;
      // cast through unknown — both branches return shape-compatible
      // results, only the `metrics` discriminator differs.
      return analyzer.analyze() as unknown as AnyAnalysisResult;
    }
    const analyzer = new SFRAnalyzer(propertyData as SFRData, assumptions);
    return analyzer.analyze() as unknown as AnyAnalysisResult;
  },
};

let currentAdapter: AnalyzerAdapter = defaultAnalyzerAdapter;

export function setAnalyzerAdapter(adapter: AnalyzerAdapter): void {
  currentAdapter = adapter;
}

export function resetAnalyzerAdapter(): void {
  currentAdapter = defaultAnalyzerAdapter;
}

// ===== Input schema =====

const ObjectShape = z.custom<Record<string, unknown>>(
  (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
  { message: 'Expected a non-null object' }
);

const PropertyTypeSchema = z.enum(['SFR', 'Multi-Family']);

/**
 * AnalysisAssumptions Zod schema. Required for the analyzer; the agent
 * (orchestrator) typically extracts these from propertyData's
 * longTermAssumptions and any user-overridden inputs.
 */
const AssumptionsSchema = z.object({
  projectionYears: z.number().int().positive(),
  annualRentIncrease: z.number(),
  annualExpenseIncrease: z.number(),
  annualPropertyValueIncrease: z.number(),
  sellingCosts: z.number().nonnegative(),
  vacancyRate: z.number().nonnegative().max(100),
  turnoverFrequency: z.number().nonnegative().optional(),
});

export const ComputeAnalysisInputSchema = z.object({
  /** The property to analyze. Deep type comes from the TS interface. */
  propertyData: ObjectShape,

  /** Resolved assumptions for this run. */
  assumptions: AssumptionsSchema,

  /** Routes to SFRAnalyzer or MultiFamilyAnalyzer. */
  propertyType: PropertyTypeSchema,
});

export type ComputeAnalysisInput = z.infer<typeof ComputeAnalysisInputSchema>;

// ===== Output schema =====

/**
 * The three fields score_deal needs, plus the full AnalysisResult
 * for any downstream tool that wants more (e.g., apply_override
 * shows projections side-by-side in its UI).
 */
export const ComputeAnalysisOutputSchema = z.object({
  metrics: ObjectShape,
  monthlyAnalysis: ObjectShape,
  longTermAnalysis: ObjectShape,
  fullResult: z.unknown(),
});

export type ComputeAnalysisOutput = {
  metrics: SFRMetrics | MultiFamilyMetrics;
  monthlyAnalysis: AnyAnalysisResult['monthlyAnalysis'];
  longTermAnalysis: {
    annualAnalysis: AnyAnalysisResult['annualAnalysis'];
    projections: AnyAnalysisResult['projections'];
    exitAnalysis: AnyAnalysisResult['exitAnalysis'];
  };
  fullResult: AnyAnalysisResult;
};

// ===== Helpers =====

/**
 * Bundle the analyzer's three long-term outputs (annualAnalysis,
 * projections, exitAnalysis) into a single object matching the
 * AnalysisPayload's `longTermAnalysis` field. Substrate stores this
 * as a single nested object; agents read it as a unit.
 */
function bundleLongTermAnalysis(result: AnyAnalysisResult): {
  annualAnalysis: AnyAnalysisResult['annualAnalysis'];
  projections: AnyAnalysisResult['projections'];
  exitAnalysis: AnyAnalysisResult['exitAnalysis'];
} {
  return {
    annualAnalysis: result.annualAnalysis,
    projections: result.projections,
    exitAnalysis: result.exitAnalysis,
  };
}

// ===== Tool implementation =====

export const computeAnalysis: Tool<ComputeAnalysisInput, ComputeAnalysisOutput> = {
  name: 'compute_analysis',
  description:
    'Runs the property analyzer (SFRAnalyzer for SFR/Condo/Townhouse, MultiFamilyAnalyzer for Multi-Family) and returns metrics, monthly cash-flow breakdown, and long-term projection bundle (annualAnalysis + projections + exitAnalysis). Pure compute; emits no events. The score_deal tool consumes this output and persists it to substrate.',
  inputSchema: ComputeAnalysisInputSchema,
  outputSchema: ComputeAnalysisOutputSchema as unknown as z.ZodSchema<ComputeAnalysisOutput>,
  invokeLLM: false,
  // No events, no external APIs. Just runs the legacy analyzers.
  sideEffects: [],
  // Compute is deterministic and side-effect-free; retry adds nothing
  // (same inputs → same outputs). NO_RETRY also signals "if this fails,
  // it's a bug, not a transient issue."
  retrySemantics: NO_RETRY,

  async execute(
    input: ComputeAnalysisInput,
    _ctx: ToolContext
  ): Promise<ComputeAnalysisOutput> {
    const validated = ComputeAnalysisInputSchema.parse(input);

    const result = await currentAdapter.analyze({
      propertyData: validated.propertyData as unknown as SFRData | MultiFamilyData,
      // Zod-inferred type widens required fields to optional; the
      // schema's runtime validation already guarantees all required
      // fields are present, so the cast is safe.
      assumptions: validated.assumptions as unknown as AnalysisAssumptions,
      propertyType: validated.propertyType,
    });

    return {
      metrics: result.metrics as CommonMetrics as SFRMetrics | MultiFamilyMetrics,
      monthlyAnalysis: result.monthlyAnalysis,
      longTermAnalysis: bundleLongTermAnalysis(result),
      fullResult: result,
    };
  },
};
