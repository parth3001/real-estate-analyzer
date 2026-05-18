/**
 * dealMaterializationService unit tests — Phase 2 of chat-first strategy.
 *
 * Backed by mongodb-memory-server so the helper runs against real Mongo
 * collections — substrate events, User, Deal — and we observe the exact
 * upsert / dedup behavior /saved-properties depends on.
 *
 * Coverage:
 *   - Authenticated user → materializes a Deal carrying all the right
 *     fields (address, price, strategy, dealQuality, professionalAssessment)
 *   - Ghost user → SKIPPED, no Deal row written
 *   - Missing user → SKIPPED (defensive, returns same shape as ghost)
 *   - Idempotent: 2nd call for same (userId, address) → UPDATES existing
 *     Deal (no duplicate row)
 *   - Different addresses → distinct Deal rows
 *   - Different users + same address → distinct Deal rows (isolation)
 *   - Bulk helper materializeDealsForUser handles success/failure counts
 *   - Strategy normalization: 'buy_hold' → 'buy-hold', 'brrrr' → 'brrrr'
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  materializeDealFromDecision,
  materializeDealsForUser,
} from '../dealMaterializationService';
import { User } from '../../models/User';
import { DealModel as Deal } from '../../models/Deal';
import { eventsRepository } from '../../repositories/EventsRepository';
import type { AnalysisPayload } from '../../models/events/AnalysisEvent';
import type { DecisionPayload } from '../../models/events/DecisionEvent';
import type { SFRData } from '../../types/propertyTypes';

const SETUP_TIMEOUT_MS = 90_000;

async function createRealUser(email: string): Promise<Types.ObjectId> {
  const u = await User.create({
    email,
    firstName: 'Real',
    lastName: 'User',
    role: 'user',
    isVerified: true,
    anonymous: false,
  });
  return u._id as Types.ObjectId;
}

async function createGhostUser(sessionId: string): Promise<Types.ObjectId> {
  const u = await User.create({
    email: `anon-${sessionId}@anon.app`,
    anonymous: true,
    anonymousSessionId: sessionId,
    firstName: '',
    lastName: '',
    role: 'user',
    isVerified: false,
  });
  return u._id as Types.ObjectId;
}

/**
 * Seed a (AnalysisEvent, DecisionEvent) pair under the given userId.
 * Returns both IDs so tests can pass the decision into the materializer.
 */
async function seedAnalysisAndDecision(opts: {
  userId: Types.ObjectId;
  street?: string;
  purchasePrice?: number;
  strategy?: 'buy_hold' | 'brrrr';
  dealQuality?: number;
}): Promise<{ analysisEventId: Types.ObjectId; decisionEventId: Types.ObjectId }> {
  const property: SFRData = {
    propertyType: 'SFR',
    propertyAddress: {
      street: opts.street ?? '336 Highland Ridge Drive',
      city: 'Anna',
      state: 'TX',
      zipCode: '75409',
    },
    purchasePrice: opts.purchasePrice ?? 295000,
    downPayment: (opts.purchasePrice ?? 295000) * 0.25,
    interestRate: 6.95,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 100,
    propertyManagementRate: 8,
    monthlyRent: 2500,
    squareFootage: 2110,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2008,
    closingCosts: 5000,
  };
  // Defensive extension — see propertyTypes.ts; investmentStrategy isn't
  // on SFRData proper but score_deal accepts it on the runtime shape.
  (property as unknown as { investmentStrategy?: 'buy_hold' | 'brrrr' }).investmentStrategy =
    opts.strategy ?? 'buy_hold';

  const analysisPayload: AnalysisPayload = {
    propertyData: property,
    marketData: {} as AnalysisPayload['marketData'],
    assumptions: { vacancyRate: 5 },
    metrics: {
      noi: 18000,
      capRate: 6.1,
      cashOnCashReturn: 8.2,
      irr: 11,
      dscr: 1.4,
      operatingExpenseRatio: 0.4,
      totalInvestment: 80000,
    } as AnalysisPayload['metrics'],
    monthlyAnalysis: {
      cashFlow: 250,
      grossIncome: 2500,
      effectiveGrossIncome: 2375,
    },
    longTermAnalysis: {},
    walkAwayPrice: 270000,
    enrichmentSource: 'fallback' as AnalysisPayload['enrichmentSource'],
    enrichmentCacheHit: false,
    engineVersion: 'v3.0',
    computeTimeMs: 100,
  };

  const analysisEventId = await eventsRepository.writeAnalysisEvent({
    traceId: 'trace-' + Math.random().toString(36).slice(2, 8),
    actorType: 'tool:score_deal',
    userId: opts.userId,
    payload: analysisPayload,
  });

  const decisionPayload: DecisionPayload = {
    analysisEventId,
    dealQuality: opts.dealQuality ?? 78,
    qualityLabel: 'Meets professional standards' as DecisionPayload['qualityLabel'],
    qualityColor: 'yellow' as DecisionPayload['qualityColor'],
    professionalAssessment: {
      dealQuality: opts.dealQuality ?? 78,
      executionDifficulty: 40,
      dataReliability: 80,
      cashFlowScore: 88,
      irrScore: 70,
      marketStrengthScore: 65,
      debtStructureScore: 72,
      exitStrategyScore: 55,
      capRateScore: 60,
      propertyRiskScore: 45,
      primaryInsight: 'Strong cash flow.',
      strategicRecommendations: ['Make an offer at $270k.'],
      riskMitigation: ['Maintain reserves.'],
      opportunityMaximization: [],
      confidenceLevel: 80,
      keyStrengths: [],
      keyRisks: [],
    },
    marketPosition: {
      walkAwayPrice: 270000,
      pricingContext: 'fair',
      marketStage: 'mid',
      competitiveIntensity: 'moderate',
    },
    reasoningTrail: {
      primaryInsight: 'Strong cash flow.',
      strategicRecommendations: ['Make an offer at $270k with 14-day inspection.'],
      riskMitigation: [],
      opportunityMaximization: [],
      keyRisks: [],
    },
    confidence: 80,
    scoringWeightsUsed: {} as DecisionPayload['scoringWeightsUsed'],
    engineVersion: 'v3.0',
  };

  const decisionEventId = await eventsRepository.writeDecisionEvent({
    traceId: 'trace-' + Math.random().toString(36).slice(2, 8),
    actorType: 'tool:score_deal',
    userId: opts.userId,
    payload: decisionPayload,
  });

  return { analysisEventId, decisionEventId };
}

describe('dealMaterializationService', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  describe('happy path — authenticated user', () => {
    it('creates a Deal carrying all the projected fields', async () => {
      const userId = await createRealUser('owner@example.com');
      const { decisionEventId } = await seedAnalysisAndDecision({
        userId,
        purchasePrice: 295000,
        strategy: 'buy_hold',
        dealQuality: 87,
      });

      const result = await materializeDealFromDecision(decisionEventId, userId);

      expect(result.skipped).toBe(false);
      expect(result.created).toBe(true);
      expect(result.deal).not.toBeNull();
      expect(result.deal?.propertyAddress).toMatchObject({
        street: '336 Highland Ridge Drive',
        city: 'Anna',
        state: 'TX',
      });
      expect(result.deal?.purchasePrice).toBe(295000);
      expect(result.deal?.investmentStrategy).toBe('buy-hold'); // chat 'buy_hold' → legacy 'buy-hold'
      expect(result.deal?.investmentDecision?.score).toBe(87);
      expect(result.deal?.investmentDecision?.verdict).toBe('BUY'); // 87 ≥ 80
      expect(result.deal?.investmentDecision?.professionalAssessment?.dealQuality).toBe(87);
      expect(result.deal?.investmentDecision?.professionalAssessment?.cashFlowScore).toBe(88);
      expect(result.deal?.userId.toString()).toBe(userId.toString());
    });

    it('also embeds investmentDecision INSIDE deal.analysis (Issue #109 — NaN regression guard)', async () => {
      // The legacy SFRAnalysis components (InvestmentDecisionHero,
      // DealQualityHeader, ProgressiveMetricsSystem, DynamicSliders) read
      // the Deal Quality Score via:
      //   analysis.investmentDecision.professionalAssessment.dealQuality
      // NOT via the top-level deal.investmentDecision.* path. Earlier
      // materialization wrote only the top-level field and left the
      // nested path undefined, which produced the NaN score observed
      // during e2e testing 2026-05-17.
      //
      // This test asserts BOTH paths carry the score. If a future change
      // drops the nested embedding, the bug returns silently.
      const userId = await createRealUser('nested-decision@example.com');
      const { decisionEventId } = await seedAnalysisAndDecision({
        userId,
        purchasePrice: 250000,
        strategy: 'buy_hold',
        dealQuality: 75,
      });
      const result = await materializeDealFromDecision(decisionEventId, userId);

      // Top-level (chat-first views read here)
      expect(result.deal?.investmentDecision?.professionalAssessment?.dealQuality).toBe(75);

      // Nested under analysis (legacy SFRAnalysis views read here — the
      // path that was returning undefined and rendering NaN)
      const analysis = result.deal?.analysis as
        | { investmentDecision?: { professionalAssessment?: { dealQuality?: number } } }
        | undefined;
      expect(analysis?.investmentDecision).toBeDefined();
      expect(analysis?.investmentDecision?.professionalAssessment).toBeDefined();
      expect(analysis?.investmentDecision?.professionalAssessment?.dealQuality).toBe(75);

      // Both locations must be the SAME object reference shape (same
      // score, same verdict) so legacy and new views never disagree.
      expect(analysis?.investmentDecision?.professionalAssessment?.dealQuality).toBe(
        result.deal?.investmentDecision?.professionalAssessment?.dealQuality
      );
    });

    it('normalizes BRRRR strategy correctly', async () => {
      const userId = await createRealUser('brrrr@example.com');
      const { decisionEventId } = await seedAnalysisAndDecision({
        userId,
        strategy: 'brrrr',
      });
      const result = await materializeDealFromDecision(decisionEventId, userId);
      expect(result.deal?.investmentStrategy).toBe('brrrr');
    });

    it('derives verdict from dealQuality score-band boundaries', async () => {
      const userId = await createRealUser('verdict@example.com');

      const cases: Array<[number, string]> = [
        [85, 'BUY'],
        [70, 'NEGOTIATE'],
        [55, 'CAUTION'],
        [40, 'PASS'],
      ];
      for (const [score, expected] of cases) {
        const { decisionEventId } = await seedAnalysisAndDecision({
          userId,
          street: `Verdict Test ${score}`,
          dealQuality: score,
        });
        const result = await materializeDealFromDecision(decisionEventId, userId);
        expect(result.deal?.investmentDecision?.verdict).toBe(expected);
      }
    });
  });

  describe('skip paths', () => {
    it('skips materialization for anonymous (ghost) users', async () => {
      const ghostId = await createGhostUser('22222222-3333-4444-8555-111111111111');
      const { decisionEventId } = await seedAnalysisAndDecision({
        userId: ghostId,
      });

      const result = await materializeDealFromDecision(decisionEventId, ghostId);

      expect(result.skipped).toBe(true);
      expect(result.created).toBe(false);
      expect(result.deal).toBeNull();

      // No Deal row written under the ghost
      const dealCount = await Deal.countDocuments({ userId: ghostId });
      expect(dealCount).toBe(0);
    });

    it('skips materialization when the user record is missing', async () => {
      const phantomId = new Types.ObjectId();
      const { decisionEventId } = await seedAnalysisAndDecision({
        userId: phantomId,
      });
      const result = await materializeDealFromDecision(decisionEventId, phantomId);
      expect(result.skipped).toBe(true);
      expect(result.deal).toBeNull();
    });
  });

  describe('idempotence — upsert on (userId, address)', () => {
    it('second materialization for SAME user + SAME address UPDATES existing Deal', async () => {
      const userId = await createRealUser('upsert@example.com');

      // First analysis at score 78
      const { decisionEventId: firstDecisionId } = await seedAnalysisAndDecision({
        userId,
        dealQuality: 78,
      });
      const first = await materializeDealFromDecision(firstDecisionId, userId);
      expect(first.created).toBe(true);
      const firstDealId = first.deal?._id;

      // Second analysis (user changed assumptions, re-ran chat) — same address, score 65
      const { decisionEventId: secondDecisionId } = await seedAnalysisAndDecision({
        userId,
        dealQuality: 65,
      });
      const second = await materializeDealFromDecision(secondDecisionId, userId);

      expect(second.created).toBe(false); // UPDATE, not create
      expect(second.deal?._id?.toString()).toBe(firstDealId?.toString()); // same row
      expect(second.deal?.investmentDecision?.score).toBe(65); // updated

      // Only one Deal row exists
      const count = await Deal.countDocuments({ userId });
      expect(count).toBe(1);
    });

    it('different addresses create distinct Deal rows', async () => {
      const userId = await createRealUser('multi@example.com');
      const { decisionEventId: idA } = await seedAnalysisAndDecision({
        userId,
        street: '111 First St',
      });
      const { decisionEventId: idB } = await seedAnalysisAndDecision({
        userId,
        street: '222 Second St',
      });
      await materializeDealFromDecision(idA, userId);
      await materializeDealFromDecision(idB, userId);

      const count = await Deal.countDocuments({ userId });
      expect(count).toBe(2);
    });

    it('different users + SAME address create distinct Deal rows (isolation)', async () => {
      const userA = await createRealUser('a@example.com');
      const userB = await createRealUser('b@example.com');
      const { decisionEventId: idA } = await seedAnalysisAndDecision({
        userId: userA,
      });
      const { decisionEventId: idB } = await seedAnalysisAndDecision({
        userId: userB,
      });
      await materializeDealFromDecision(idA, userA);
      await materializeDealFromDecision(idB, userB);

      const aCount = await Deal.countDocuments({ userId: userA });
      const bCount = await Deal.countDocuments({ userId: userB });
      expect(aCount).toBe(1);
      expect(bCount).toBe(1);
    });
  });

  describe('materializeDealsForUser bulk helper', () => {
    it('processes all decisions and counts successes', async () => {
      const userId = await createRealUser('bulk@example.com');
      const { decisionEventId: id1 } = await seedAnalysisAndDecision({
        userId,
        street: 'Bulk 1',
      });
      const { decisionEventId: id2 } = await seedAnalysisAndDecision({
        userId,
        street: 'Bulk 2',
      });
      const result = await materializeDealsForUser([id1, id2], userId);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(2);
    });

    it('continues on per-decision failures (returns count)', async () => {
      const userId = await createRealUser('failsafe@example.com');
      const { decisionEventId: validId } = await seedAnalysisAndDecision({
        userId,
      });
      const bogusId = new Types.ObjectId();
      const result = await materializeDealsForUser([validId, bogusId], userId);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });
  });
});
