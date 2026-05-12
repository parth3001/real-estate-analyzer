/**
 * DecisionEvent — third wave-1 event type (W1-S2 part 3).
 *
 * The deterministic scoring output from the engine. Paired with an
 * AnalysisEvent (which captures the inputs); the DecisionEvent captures
 * the Deal Quality Score and structured breakdown.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.3.
 *
 * LOAD-BEARING — this event is what the calibration check (W8) validates
 * against. Bugs in this schema or its write path = calibration drift =
 * moat erosion. Architect review required on any PR that changes the
 * shape. Per /docs/PRODUCT_2.0_RISK_REGISTER.md R-T1 + R-A1.
 *
 * DELIBERATE OMISSION — there is NO `verdict` field. The legacy categorical
 * verdict (BUY/PASS/NEGOTIATE/CAUTION) is not exposed via substrate per
 * /docs/PRODUCT_2.0_ARCHITECTURE.md §1.5 (the deterministic-scoring
 * non-negotiable). The V3.0 dealQuality score (0-100) is the single
 * source of truth. The engine may continue to compute verdict internally
 * for legacy logic, but it is NOT persisted.
 *
 * Persona context (`userContext` field) is captured for substrate-tagged
 * calibration analysis — when conservative-tagged investors override
 * vacancy upward more than aggressive-tagged, that's signal the engine's
 * conservative-default vacancy assumption is right. AI never produces
 * the score; persona context selects deterministic weight configurations.
 */

import { z } from 'zod';
import mongoose, { Schema, Types } from 'mongoose';
import { BaseEventModel } from './BaseEvent';
import type {
  ProfessionalAssessment,
  MarketPosition,
  ScoringWeights,
} from '../../services/investment/BaseDecisionEngine';

// ===== Enum-like type definitions =====

const QualityLabelSchema = z.enum([
  'Above professional standards', // 80+
  'Meets professional standards', // 65-79
  'Requires optimization', // 50-64
  'Below professional standards', // <50
]);

const QualityColorSchema = z.enum(['green', 'yellow', 'orange', 'red']);

const RiskToleranceSchema = z.enum(['conservative', 'moderate', 'aggressive']);
const InvestmentStrategySchema = z.enum(['cashflow', 'appreciation', 'balanced']);
const ExperienceLevelSchema = z.enum(['novice', 'intermediate', 'experienced', 'expert']);
const InvestorTypeSchema = z.enum(['retail', 'pro', 'lender', 'consultancy']);
const PrimaryGoalSchema = z.enum([
  'cash_flow',
  'wealth_building',
  'diversification',
  'tax_optimization',
]);

export type QualityLabel = z.infer<typeof QualityLabelSchema>;
export type QualityColor = z.infer<typeof QualityColorSchema>;

// ===== Runtime validators =====

/**
 * Validates that a value is either a Mongoose ObjectId instance or a
 * 24-character hex string convertible to one.
 */
const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or valid 24-char hex ObjectId string' }
);

const ObjectShapeSchema = z.custom<Record<string, unknown>>(
  (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
  { message: 'Expected a non-null object (not array, not primitive)' }
);

// ===== Sub-schemas =====

/**
 * CriticalFlags — score-affecting (not verdict-overriding) flags per
 * events store §3.3.1. Each flag is optional; presence indicates the
 * engine detected a critical-failure scenario that capped the
 * `dealQuality` score regardless of weighted-factor sum.
 *
 * When any flag is present, `dealQuality` should reflect the corresponding
 * cap (per events store §3.3.1 table — e.g., dscrBelowOne caps at 25).
 */
const CriticalFlagsSchema = z
  .object({
    rentToPriceTooLow: z
      .object({
        ratio: z.number().nonnegative(),
        threshold: z.number().nonnegative(),
      })
      .optional(),
    capRateFarBelowMarket: z
      .object({
        capRate: z.number(),
        marketMedian: z.number().nonnegative(),
        tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      })
      .optional(),
    noPositiveCashFlowNoLeverage: z.boolean().optional(),
    cashFlowBufferCritical: z
      .object({
        actualBuffer: z.number(),
        minimumRequired: z.number().nonnegative(),
      })
      .optional(),
    dscrBelowOne: z
      .object({
        dscrValue: z.number().nonnegative(),
      })
      .optional(),
  })
  .strict(); // No unknown fields in criticalFlags

/**
 * UserContext — persona context that drove deterministic scoring config.
 * All fields optional; partial profiles are common in early sessions.
 */
const UserContextSchema = z
  .object({
    riskTolerance: RiskToleranceSchema.optional(),
    investmentStrategy: InvestmentStrategySchema.optional(),
    experienceLevel: ExperienceLevelSchema.optional(),
    investorType: InvestorTypeSchema.optional(),
    primaryGoal: PrimaryGoalSchema.optional(),
  })
  .strict();

/**
 * ReasoningTrail — the engine's structured rationale. Each list captures
 * a different dimension of the analysis surface. Lists may be empty
 * (e.g., no critical risks identified).
 */
const ReasoningTrailSchema = z.object({
  primaryInsight: z.string().min(1),
  strategicRecommendations: z.array(z.string()),
  riskMitigation: z.array(z.string()),
  opportunityMaximization: z.array(z.string()),
  keyRisks: z.array(z.string()),
});

// ===== Zod payload schema (runtime validation) =====

/**
 * DecisionPayloadSchema — runtime validation for DecisionEvent payload.
 *
 * Repository layer (W1-S3) calls `.parse()` before passing to
 * `DecisionEventModel.create()`. Strict validation on primitive
 * surface; shallow on nested complex objects whose TS types are the
 * source of truth (professionalAssessment, marketPosition, scoringWeightsUsed).
 *
 * NO `verdict` field. See file header.
 */
export const DecisionPayloadSchema = z.object({
  // Cross-event references
  analysisEventId: ObjectIdSchema,
  dealId: ObjectIdSchema.optional(),

  // PRIMARY OUTPUT — V3.0 Deal Quality scoring (single source of truth)
  dealQuality: z.number().min(0).max(100),
  qualityLabel: QualityLabelSchema,
  qualityColor: QualityColorSchema,

  // Structured breakdown — deep types live in BaseDecisionEngine
  professionalAssessment: ObjectShapeSchema,
  marketPosition: ObjectShapeSchema,

  reasoningTrail: ReasoningTrailSchema,

  // Confidence + provenance
  confidence: z.number().min(0).max(100),
  scoringWeightsUsed: ObjectShapeSchema,
  engineVersion: z.string().min(1),

  // Optional — score-affecting flags + persona context
  criticalFlags: CriticalFlagsSchema.optional(),
  userContext: UserContextSchema.optional(),
});

/**
 * DecisionPayload — TypeScript type for DecisionEvent payload.
 *
 * Deep types preserved via explicit declaration (not z.infer) so consumers
 * get `ProfessionalAssessment` etc. instead of `Record<string, unknown>`.
 */
export interface DecisionPayload {
  analysisEventId: Types.ObjectId;
  dealId?: Types.ObjectId;

  /** Deal Quality Score (0-100). The V3.0 single source of truth. */
  dealQuality: number;

  /** Derived contextual label. */
  qualityLabel: QualityLabel;

  /** Derived color. */
  qualityColor: QualityColor;

  /** Full 7-factor weighted scoring breakdown. From BaseDecisionEngine. */
  professionalAssessment: ProfessionalAssessment;

  /** Market position analysis including walk-away price. */
  marketPosition: MarketPosition;

  /** Structured reasoning for surface presentation. */
  reasoningTrail: {
    primaryInsight: string;
    strategicRecommendations: string[];
    riskMitigation: string[];
    opportunityMaximization: string[];
    keyRisks: string[];
  };

  /** Engine's confidence in the score (0-100). */
  confidence: number;

  /** Scoring weights applied (strategy-aware). From BaseDecisionEngine. */
  scoringWeightsUsed: ScoringWeights;

  /** Engine version (e.g., 'v3.0'). */
  engineVersion: string;

  /**
   * Critical-failure flags — score-affecting, NOT verdict-overriding.
   * When any flag is present, dealQuality reflects the corresponding cap.
   * See events store §3.3.1.
   */
  criticalFlags?: {
    rentToPriceTooLow?: { ratio: number; threshold: number };
    capRateFarBelowMarket?: { capRate: number; marketMedian: number; tier: 1 | 2 | 3 };
    noPositiveCashFlowNoLeverage?: boolean;
    cashFlowBufferCritical?: { actualBuffer: number; minimumRequired: number };
    dscrBelowOne?: { dscrValue: number };
  };

  /**
   * Persona context at time of decision. Flows into the deterministic
   * scoring engine as configuration (selects weight presets, threshold
   * variants). AI never produces the score — persona is config, not AI input.
   */
  userContext?: {
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
    investmentStrategy?: 'cashflow' | 'appreciation' | 'balanced';
    experienceLevel?: 'novice' | 'intermediate' | 'experienced' | 'expert';
    investorType?: 'retail' | 'pro' | 'lender' | 'consultancy';
    primaryGoal?: 'cash_flow' | 'wealth_building' | 'diversification' | 'tax_optimization';
  };
}

// ===== Mongoose discriminator =====

const decisionEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

/**
 * DecisionEventModel — Mongoose model for DecisionEvents.
 *
 * Registered as discriminator on BaseEventModel with `eventType: 'decision'`.
 * Stored in unified `events` collection. Append-only enforcement inherits.
 */
export const DecisionEventModel = BaseEventModel.discriminator(
  'decision',
  decisionEventSchema
);
