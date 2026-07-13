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
  assembleDecisionFromEvent,
} from '../dealMaterializationService';
import { User } from '../../models/User';
import { DealModel as Deal } from '../../models/Deal';
import { eventsRepository } from '../../repositories/EventsRepository';
import { licenseRepository } from '../../repositories/LicenseRepository';
import type { AnalysisPayload } from '../../models/events/AnalysisEvent';
import type { DecisionPayload } from '../../models/events/DecisionEvent';
import type { SFRData } from '../../types/propertyTypes';

/** setImmediate is fire-and-forget; flush it before asserting side-effects. */
async function flushImmediate(): Promise<void> {
  // Two cycles: setImmediate body, then any inner awaits. 50ms is enough
  // for the in-memory Mongo round-trips the auto-redeem helper does.
  await new Promise((r) => setTimeout(r, 50));
}

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
  // Widened to include 'house_hack' + arbitrary aliases (Issue #243) so
  // regression tests can seed legacy/kebab writes and verify the
  // materializer canonicalizes them correctly.
  strategy?: string;
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
  (property as unknown as { investmentStrategy?: string }).investmentStrategy =
    opts.strategy ?? 'buy_hold';

  const analysisPayload: AnalysisPayload = {
    propertyData: property,
    marketData: {} as AnalysisPayload['marketData'],
    assumptions: { vacancyRate: 5 },
    metrics: {
      // CommonMetrics
      noi: 18000,
      capRate: 6.1,
      cashOnCashReturn: 8.2,
      irr: 11,
      dscr: 1.4,
      operatingExpenseRatio: 0.4,
      totalInvestment: 80000,
      // SFRMetricsShape — required so safeParseShape accepts the metrics
      // block (analyzer always populates these in production).
      pricePerSqFt: 159,
      rentPerSqFt: 1.6,
      grossRentMultiplier: 9.8,
      breakEvenOccupancy: 62,
      equityMultiple: 1.8,
      onePercentRuleValue: 0.95,
      fiftyRuleAnalysis: true,
      rentToPriceRatio: 0.0095,
      pricePerBedroom: 98333,
      debtToIncomeRatio: 0.35,
      returnOnImprovements: 0,
      turnoverCostImpact: 0.04,
      debtYield: 0.08,
      grossYield: 0.115,
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

      // Task #46 (2026-06-17): keyMetrics.irr must be projected onto the
      // Deal — the saved-properties list reads property.analysis.keyMetrics.irr
      // directly. Prior to this fix, irr was silently dropped by the
      // materializer (capRate / cashOnCashReturn / dscr were copied but
      // not irr), so 2.0 deals showed "N/A" on the list while the detail
      // page assembled the real number from substrate — a real source of
      // list↔detail drift.
      expect(result.deal?.analysis?.keyMetrics?.irr).toBe(11);

      // Task #49 cleanup (2026-06-17): post-Task-#1 (May 20, 2026), the
      // Deal no longer stores investmentDecision at WRITE time — it lives
      // solely in the substrate DecisionEvent and is assembled at READ
      // time via assembleDecisionFromEvent. So the materializer's
      // contract is now: latestDecisionEventId points at the right
      // DecisionEvent, and assembling it yields the expected score.
      expect(result.deal?.latestDecisionEventId?.toString()).toBe(
        decisionEventId.toString()
      );
      const assembled = await assembleDecisionFromEvent(decisionEventId);
      expect(assembled).not.toBeNull();
      expect(assembled?.score).toBe(87);
      expect(assembled?.verdict).toBe('BUY'); // 87 ≥ 80
      expect(assembled?.professionalAssessment?.dealQuality).toBe(87);
      expect(assembled?.professionalAssessment?.cashFlowScore).toBe(88);
      expect(result.deal?.userId.toString()).toBe(userId.toString());
    });

    it('assembleDecisionFromEvent returns a single-source decision shape (Issue #109 — NaN regression guard, refactored 2026-06-17)', async () => {
      // Issue #109 (originally 2026-05-17): the legacy SFRAnalysis views
      // rendered NaN when materialization stored investmentDecision in
      // only one of two duplicate locations (top-level vs. nested under
      // analysis). The fix at that time was to write both.
      //
      // Task #1 (2026-05-20) eliminated the duplication entirely — the
      // Deal stops storing investmentDecision in either location, and
      // assembleDecisionFromEvent shapes it once at GET time from the
      // substrate DecisionEvent. The NaN bug class is structurally
      // impossible now: one source, one shape, no divergence possible.
      //
      // What this test now guards: assembling from the substrate produces
      // the complete investmentDecision shape that all consumers (chat
      // surface AND legacy SFRAnalysis) read. Any future change that
      // returns a partial shape (missing professionalAssessment or
      // dealQuality) re-introduces the NaN failure mode upstream.
      const userId = await createRealUser('nested-decision@example.com');
      const { decisionEventId } = await seedAnalysisAndDecision({
        userId,
        purchasePrice: 250000,
        strategy: 'buy_hold',
        dealQuality: 75,
      });
      const result = await materializeDealFromDecision(decisionEventId, userId);

      // Materialization points at the right event.
      expect(result.deal?.latestDecisionEventId?.toString()).toBe(
        decisionEventId.toString()
      );

      // Assembled decision is complete and correct — no partial shape
      // that would let `professionalAssessment?.dealQuality` ride through
      // as undefined to a downstream NaN.
      const assembled = await assembleDecisionFromEvent(decisionEventId);
      expect(assembled).not.toBeNull();
      expect(assembled?.professionalAssessment).toBeDefined();
      expect(assembled?.professionalAssessment?.dealQuality).toBe(75);
      expect(assembled?.score).toBe(75);
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

    // Issue #243 (2026-07-12) — regression against the silent-drop bug
    // where `propertyData.investmentStrategy === 'house_hack'` collapsed
    // to `'buy-hold'` via the old inline ternary. The canonical
    // normalizer + `toLegacyDealStrategy` project it correctly to
    // `'house-hack'`.
    it("Issue #243: house_hack canonical → legacy 'house-hack' (was silently dropped)", async () => {
      const userId = await createRealUser('house-hack-243@example.com');
      const { decisionEventId } = await seedAnalysisAndDecision({
        userId,
        strategy: 'house_hack',
      });
      const result = await materializeDealFromDecision(decisionEventId, userId);
      expect(result.deal?.investmentStrategy).toBe('house-hack');
    });

    // Issue #243 (2026-07-12) — kebab-shaped legacy substrate writes
    // (pre-refactor) still round-trip correctly through the normalizer.
    it('Issue #243: kebab-in-substrate house-hack round-trips to house-hack', async () => {
      const userId = await createRealUser('house-hack-legacy@example.com');
      const { decisionEventId } = await seedAnalysisAndDecision({
        userId,
        // Simulate a pre-refactor legacy write that persisted the kebab
        // value directly.
        strategy: 'house-hack',
      });
      const result = await materializeDealFromDecision(decisionEventId, userId);
      expect(result.deal?.investmentStrategy).toBe('house-hack');
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
        await materializeDealFromDecision(decisionEventId, userId);
        // Task #49 cleanup (2026-06-17): verdict lives on the assembled
        // decision now, not on the materialized Deal. See top of file.
        const assembled = await assembleDecisionFromEvent(decisionEventId);
        expect(assembled?.verdict).toBe(expected);
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

      // Task #49 cleanup (2026-06-17): post-#1, the updated Deal points at
      // the NEW DecisionEvent; the score is assembled from that event.
      expect(second.deal?.latestDecisionEventId?.toString()).toBe(
        secondDecisionId.toString()
      );
      const updatedDecision = await assembleDecisionFromEvent(secondDecisionId);
      expect(updatedDecision?.score).toBe(65); // updated

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

  // Task #14 (2026-06-17) — first_free auto-redeem on materialization.
  // The materializer fires a background redemption of the user's oldest
  // unredeemed credit against the property it just materialized. This
  // closes the freemium funnel: signup → first_free credit → first
  // analysis → unlocked $4.99 workspace without a manual purchase step.
  describe('Task #14: first_free auto-redeem', () => {
    it('burns a first_free credit on first materialization, creating an active license', async () => {
      const userId = await createRealUser('autoredeem-fresh@example.com');
      // Issue the signup-time credit BEFORE materialization, exactly
      // as authService does post-signup.
      await licenseRepository.issueCredits({
        userId,
        sourceType: 'first_free',
        pricePaidCents: 0,
        count: 1,
      });

      const { decisionEventId } = await seedAnalysisAndDecision({
        userId,
        purchasePrice: 300000,
        strategy: 'buy_hold',
        dealQuality: 72,
      });
      const result = await materializeDealFromDecision(decisionEventId, userId);
      expect(result.deal).not.toBeNull();
      await flushImmediate();

      const license = await licenseRepository.findActiveForProperty(
        userId,
        result.deal!.propertyAddress as Parameters<
          typeof licenseRepository.findActiveForProperty
        >[1]
      );
      expect(license).not.toBeNull();
      expect(license?.pricePaidCents).toBe(0); // first_free
    });

    it('is idempotent — second materialization of the same property does not double-burn', async () => {
      const userId = await createRealUser('autoredeem-idempotent@example.com');
      await licenseRepository.issueCredits({
        userId,
        sourceType: 'first_free',
        pricePaidCents: 0,
        count: 1,
      });

      const seed1 = await seedAnalysisAndDecision({
        userId,
        purchasePrice: 300000,
        strategy: 'buy_hold',
        dealQuality: 72,
      });
      await materializeDealFromDecision(seed1.decisionEventId, userId);
      await flushImmediate();

      // Re-run the analysis (stress test) — same address, new decision.
      const seed2 = await seedAnalysisAndDecision({
        userId,
        purchasePrice: 300000,
        strategy: 'buy_hold',
        dealQuality: 65, // dropped after a tougher rate assumption
      });
      await materializeDealFromDecision(seed2.decisionEventId, userId);
      await flushImmediate();

      // Still exactly ONE active license; the second pass saw it and
      // skipped redemption rather than burning a non-existent 2nd credit.
      const licenses = await licenseRepository.findLicensesForUser(userId, {
        status: 'active',
      });
      expect(licenses).toHaveLength(1);
    });

    it('skips silently when the user has no redeemable credits (post-launch users without first_free)', async () => {
      const userId = await createRealUser('autoredeem-nocredit@example.com');
      // No credit issued — simulates a user who never got first_free
      // (e.g. legacy account from before #38 shipped).

      const { decisionEventId } = await seedAnalysisAndDecision({
        userId,
        purchasePrice: 300000,
        strategy: 'buy_hold',
        dealQuality: 72,
      });
      await materializeDealFromDecision(decisionEventId, userId);
      await flushImmediate();

      const licenses = await licenseRepository.findLicensesForUser(userId);
      expect(licenses).toHaveLength(0);
    });
  });
});
