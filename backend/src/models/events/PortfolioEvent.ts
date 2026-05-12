/**
 * PortfolioEvent — tenth wave-1 event type (W1-S2 part 10).
 *
 * **STATUS: Schema ships in wave 1; CAPTURE lights up in wave 1.5**
 * via instrumentation pass on existing portfolio services without
 * changing their behavior. See /docs/PRODUCT_2.0_ARCHITECTURE.md §11.5.1.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.10.
 *
 * Uses a DISCRIMINATED UNION on `subType` — each portfolio action has its
 * own typed sub-shape. Zod `discriminatedUnion()` handles the validation.
 */

import { z } from 'zod';
import mongoose, { Schema, Types } from 'mongoose';
import { BaseEventModel } from './BaseEvent';

// ===== Validators =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or valid 24-char hex ObjectId string' }
);

// ===== Sub-type union =====

const PortfolioGoalsSchema = z.object({
  primaryGoal: z
    .enum(['cash_flow', 'wealth_building', 'diversification', 'tax_optimization'])
    .optional(),
  targetTimeline: z.string().optional(),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  targetMonthlyIncome: z.number().nonnegative().optional(),
  targetNetWorth: z.number().nonnegative().optional(),
  geographicPreferences: z.array(z.string()).optional(),
});
export type PortfolioGoals = z.infer<typeof PortfolioGoalsSchema>;

export const PortfolioPayloadSchema = z.discriminatedUnion('subType', [
  z.object({
    subType: z.literal('portfolio_created'),
    portfolioId: ObjectIdSchema,
    goals: PortfolioGoalsSchema,
  }),
  z.object({
    subType: z.literal('property_added'),
    portfolioId: ObjectIdSchema,
    dealId: ObjectIdSchema,
    ownershipPct: z.number().min(0).max(100),
  }),
  z.object({
    subType: z.literal('property_removed'),
    portfolioId: ObjectIdSchema,
    dealId: ObjectIdSchema,
  }),
  z.object({
    subType: z.literal('goal_updated'),
    portfolioId: ObjectIdSchema,
    oldGoals: PortfolioGoalsSchema,
    newGoals: PortfolioGoalsSchema,
  }),
  z.object({
    subType: z.literal('analytics_recalculated'),
    portfolioId: ObjectIdSchema,
    trigger: z.enum(['property_change', 'manual', 'scheduled']),
    durationMs: z.number().nonnegative(),
  }),
  z.object({
    subType: z.literal('ai_insight_generated'),
    portfolioId: ObjectIdSchema,
    insightType: z.enum(['health_check', 'peer_comparison', 'goal_path']),
    tokenCost: z.number().nonnegative(),
  }),
  z.object({
    subType: z.literal('recommendation_viewed'),
    portfolioId: ObjectIdSchema,
    recommendationId: ObjectIdSchema,
  }),
]);

// ===== TypeScript types =====

export type PortfolioSubType =
  | 'portfolio_created'
  | 'property_added'
  | 'property_removed'
  | 'goal_updated'
  | 'analytics_recalculated'
  | 'ai_insight_generated'
  | 'recommendation_viewed';

export type PortfolioPayload = z.infer<typeof PortfolioPayloadSchema>;

// ===== Mongoose discriminator =====

const portfolioEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

export const PortfolioEventModel = BaseEventModel.discriminator(
  'portfolio',
  portfolioEventSchema
);
