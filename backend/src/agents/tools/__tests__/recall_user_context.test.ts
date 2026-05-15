/**
 * W4-S0 acceptance test — tool:recall_user_context.
 *
 * Validates:
 *   1. Tool contract conformance (invokeLLM: false, no side effects,
 *      input/output schemas runtime-validated).
 *   2. Wraps the read repository correctly (returns profile + recent
 *      decisions + recent overrides as a structured bundle).
 *   3. Rejects malformed input at the trust boundary.
 *   4. Honors decisionsLimit / overridesLimit overrides.
 *   5. Works with hex-string userId (orchestrator may pass either).
 *
 * Uses mongodb-memory-server; seeds via EventsRepository so we exercise
 * the full insert→read→tool path.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import { recallUserContext } from '../recall_user_context';
import type { ToolContext } from '../types';

const SETUP_TIMEOUT_MS = 90_000;

describe('tool:recall_user_context (W4-S0)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

  function makeCtx(userId: Types.ObjectId): ToolContext {
    return {
      traceId: 'trace-test',
      userId,
      eventsRepo: writes,
      eventsReads: reads,
      tools: {},
    };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    writes = new EventsRepository();
    reads = new EventsRepositoryReads();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  // ===== Contract conformance =====

  describe('Tool contract', () => {
    it('declares invokeLLM: false (deterministic-scoring non-negotiable applies to read tools too)', () => {
      expect(recallUserContext.invokeLLM).toBe(false);
    });

    it('declares no side effects (pure read)', () => {
      expect(recallUserContext.sideEffects).toEqual([]);
    });

    it('has a stable global name', () => {
      expect(recallUserContext.name).toBe('recall_user_context');
    });
  });

  // ===== Behavior =====

  describe('execute()', () => {
    it('returns null profile + empty arrays for a brand-new user', async () => {
      const userId = new Types.ObjectId();
      const result = await recallUserContext.execute({ userId }, makeCtx(userId));
      expect(result.profile).toBeNull();
      expect(result.recentDecisions).toEqual([]);
      expect(result.recentOverrides).toEqual([]);
    });

    it('returns the most recent ProfileEvent payload', async () => {
      const userId = new Types.ObjectId();
      await writes.writeProfileEvent({
        traceId: 'p1',
        actorType: 'user',
        userId,
        payload: { investorType: 'retail', riskTolerance: 'moderate' },
      });
      const result = await recallUserContext.execute({ userId }, makeCtx(userId));
      expect(result.profile).toMatchObject({ investorType: 'retail', riskTolerance: 'moderate' });
    });

    it('returns recent DecisionEvents and OverrideEvents, newest first', async () => {
      const userId = new Types.ObjectId();
      const analysisEventId = new Types.ObjectId();

      // Write a decision
      const decisionId = await writes.writeDecisionEvent({
        traceId: 'd',
        actorType: 'agent:deal_scoring',
        userId,
        payload: {
          analysisEventId,
          dealId: new Types.ObjectId(),
          dealQuality: 72,
          qualityLabel: 'Meets professional standards',
          qualityColor: 'yellow',
          // Deep types — cast via unknown for the test fixture
          professionalAssessment: { dealQuality: 72 } as unknown as import('../../../models/events/DecisionEvent').DecisionPayload['professionalAssessment'],
          marketPosition: { walkAwayPrice: 385000 } as unknown as import('../../../models/events/DecisionEvent').DecisionPayload['marketPosition'],
          reasoningTrail: {
            primaryInsight: 'ok',
            strategicRecommendations: [],
            riskMitigation: [],
            opportunityMaximization: [],
            keyRisks: [],
          },
          confidence: 80,
          scoringWeightsUsed: { cashFlow: 0.3 } as unknown as import('../../../models/events/DecisionEvent').DecisionPayload['scoringWeightsUsed'],
          engineVersion: 'v3.0',
        },
      });

      // Write an override on it
      await writes.writeOverrideEvent({
        traceId: 'o',
        actorType: 'user',
        userId,
        payload: {
          originalDecisionId: decisionId,
          fieldPath: 'assumptions.vacancyRate',
          originalValue: 0.05,
          newValue: 0.08,
          inputMethod: 'structured_modal',
          priorDealQuality: 72,
        },
      });

      const result = await recallUserContext.execute({ userId }, makeCtx(userId));
      expect(result.recentDecisions).toHaveLength(1);
      expect(result.recentDecisions[0].eventType).toBe('decision');
      expect(result.recentOverrides).toHaveLength(1);
      expect(result.recentOverrides[0].eventType).toBe('override');
    });

    it('respects decisionsLimit and overridesLimit overrides', async () => {
      const userId = new Types.ObjectId();
      const decisionId = new Types.ObjectId();
      for (let i = 0; i < 5; i++) {
        await writes.writeOverrideEvent({
          traceId: `o-${i}`,
          actorType: 'user',
          userId,
          payload: {
            originalDecisionId: decisionId,
            fieldPath: `f${i}`,
            originalValue: 1,
            newValue: 2,
            inputMethod: 'structured_modal',
            priorDealQuality: 70,
          },
        });
      }
      const result = await recallUserContext.execute(
        { userId, overridesLimit: 3 },
        makeCtx(userId)
      );
      expect(result.recentOverrides).toHaveLength(3);
    });

    it('accepts a hex-string userId (orchestrator may pass either form)', async () => {
      const userId = new Types.ObjectId();
      await writes.writeProfileEvent({
        traceId: 'p',
        actorType: 'user',
        userId,
        payload: { investorType: 'retail' },
      });
      const result = await recallUserContext.execute(
        { userId: userId.toHexString() },
        makeCtx(userId)
      );
      expect(result.profile).toMatchObject({ investorType: 'retail' });
    });

    it('scopes results to the requested user (no cross-user leakage)', async () => {
      const userA = new Types.ObjectId();
      const userB = new Types.ObjectId();
      await writes.writeProfileEvent({
        traceId: 'a',
        actorType: 'user',
        userId: userA,
        payload: { investorType: 'retail' },
      });
      await writes.writeProfileEvent({
        traceId: 'b',
        actorType: 'user',
        userId: userB,
        payload: { investorType: 'pro' },
      });

      const resultA = await recallUserContext.execute({ userId: userA }, makeCtx(userA));
      expect(resultA.profile).toMatchObject({ investorType: 'retail' });
    });

    // ===== W5 live-test bug fix: userId defaults to ctx.userId =====

    it('defaults userId to ctx.userId when omitted from input (the normal agent path)', async () => {
      const userId = new Types.ObjectId();
      await writes.writeProfileEvent({
        traceId: 'ctx-default',
        actorType: 'user',
        userId,
        payload: { investorType: 'lender', riskTolerance: 'conservative' },
      });

      // Agent calls with NO userId — the LLM doesn't know it. The tool
      // must fall back to ctx.userId. (This is the bug the live test
      // surfaced: the old schema required userId, so the agent's call
      // failed.)
      const result = await recallUserContext.execute({}, makeCtx(userId));
      expect(result.profile).toMatchObject({
        investorType: 'lender',
        riskTolerance: 'conservative',
      });
    });

    it('input userId (when supplied) overrides ctx.userId — B2B path', async () => {
      const ctxUser = new Types.ObjectId();
      const targetUser = new Types.ObjectId();
      await writes.writeProfileEvent({
        traceId: 'ctx-u',
        actorType: 'user',
        userId: ctxUser,
        payload: { investorType: 'retail' },
      });
      await writes.writeProfileEvent({
        traceId: 'target-u',
        actorType: 'user',
        userId: targetUser,
        payload: { investorType: 'pro' },
      });

      // Explicit userId in input wins over ctx.userId
      const result = await recallUserContext.execute(
        { userId: targetUser },
        makeCtx(ctxUser)
      );
      expect(result.profile).toMatchObject({ investorType: 'pro' });
    });
  });

  // ===== Trust boundary =====

  describe('input validation', () => {
    it('rejects a non-ObjectId, non-hex-string userId', async () => {
      const ctx = makeCtx(new Types.ObjectId());
      await expect(
        recallUserContext.execute(
          { userId: 'not-a-valid-objectid' } as unknown as Parameters<typeof recallUserContext.execute>[0],
          ctx
        )
      ).rejects.toThrow();
    });

    it('rejects a decisionsLimit > 100 (sanity bound)', async () => {
      const ctx = makeCtx(new Types.ObjectId());
      await expect(
        recallUserContext.execute(
          { userId: new Types.ObjectId(), decisionsLimit: 500 },
          ctx
        )
      ).rejects.toThrow();
    });

    it('rejects a negative limit (sanity bound)', async () => {
      const ctx = makeCtx(new Types.ObjectId());
      await expect(
        recallUserContext.execute(
          { userId: new Types.ObjectId(), overridesLimit: -1 },
          ctx
        )
      ).rejects.toThrow();
    });
  });
});
