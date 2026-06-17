/**
 * chatSessionMergeService unit tests — W6-S5.
 *
 * Backed by mongodb-memory-server so the merge query runs against real
 * collections (BaseEvent + CostEvent + User). Covers:
 *   - No ghost exists → no-op, merged: false
 *   - Ghost with N events + cost events → reassigned, deleted
 *   - Idempotence: re-running after merge is a no-op
 *   - Self-merge guard (target === ghost) refuses cleanly
 *   - Other users' events are NOT touched
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mergeAnonymousSessionIntoUser } from '../chatSessionMergeService';
import { assembleDecisionFromEvent } from '../dealMaterializationService';
import { User } from '../../models/User';
import { eventsRepository } from '../../repositories/EventsRepository';
import { costEventRepository } from '../../repositories/CostEventRepository';

/**
 * Raw-collection accessors mirror the merge service's own bypass of
 * the Mongoose append-only middleware. Tests use the raw collection
 * for assertions so we observe the same data the service updated.
 */
function eventsCol() {
  return mongoose.connection.db!.collection('events');
}
function costCol() {
  return mongoose.connection.db!.collection('cost_events');
}

const SETUP_TIMEOUT_MS = 90_000;
const SESSION_ID = '11111111-2222-4333-8444-555555555555';

async function createGhost(sessionId: string): Promise<Types.ObjectId> {
  const ghost = await User.create({
    email: `anon-${sessionId}@anon.app`,
    anonymous: true,
    anonymousSessionId: sessionId,
    firstName: '',
    lastName: '',
    role: 'user',
    isVerified: false,
  });
  return ghost._id as Types.ObjectId;
}

async function createRealUser(email: string): Promise<Types.ObjectId> {
  const user = await User.create({
    email,
    firstName: 'Real',
    lastName: 'User',
    role: 'user',
    isVerified: true,
    anonymous: false,
  });
  return user._id as Types.ObjectId;
}

async function seedConversationEvent(
  userId: Types.ObjectId,
  sessionId: string
): Promise<Types.ObjectId> {
  return eventsRepository.writeConversationEvent({
    traceId: 'trace-' + sessionId.slice(0, 8),
    actorType: 'user',
    userId,
    payload: {
      sessionId,
      turnNumber: 1,
      userInput: { text: 'analyze 123 Main St', inputMethod: 'text' },
      intentClassification: {
        intent: 'analyze_property',
        confidence: 90,
        classifierModel: 'claude-haiku-4-5',
      },
      routedTo: 'agent:deal_scoring',
      toolCalls: [],
      agentResponse: {
        text: 'analyzing…',
        structuredOutputs: [],
        relatedEventIds: [],
      },
      tokenUsage: {
        inputTokens: 100,
        outputTokens: 50,
        cachedTokens: 0,
        estimatedCostCents: 0.5,
      },
      modelUsed: 'claude-sonnet-4-6',
      totalDurationMs: 1200,
    },
  });
}

async function seedCostEvent(userId: Types.ObjectId): Promise<Types.ObjectId> {
  return costEventRepository.writeCostEvent({
    traceId: 'trace-cost',
    userId,
    costType: 'llm',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    inputTokens: 100,
    outputTokens: 50,
    cachedTokens: 0,
    costCents: 0.5,
  });
}

describe('mergeAnonymousSessionIntoUser', () => {
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

  describe('no-op cases', () => {
    it('returns merged: false when no ghost exists for sessionId', async () => {
      const realUserId = await createRealUser('real@example.com');
      const result = await mergeAnonymousSessionIntoUser(SESSION_ID, realUserId);
      expect(result).toEqual({
        merged: false,
        eventsMerged: 0,
        costEventsMerged: 0,
        ghostUserId: null,
        dealsMaterialized: 0,
      });
    });

    it('refuses self-merge (ghost._id === targetUserId)', async () => {
      const ghostId = await createGhost(SESSION_ID);
      const result = await mergeAnonymousSessionIntoUser(SESSION_ID, ghostId);
      expect(result.merged).toBe(false);
      // Ghost still exists — not deleted
      const stillThere = await User.findById(ghostId).exec();
      expect(stillThere).not.toBeNull();
    });

    it('does NOT touch real users with anonymousSessionId unset', async () => {
      // Sanity: a real user with no anonymousSessionId should be invisible
      // to the merge query.
      await createRealUser('untouched@example.com');
      const realUserId = await createRealUser('claimer@example.com');
      const result = await mergeAnonymousSessionIntoUser(SESSION_ID, realUserId);
      expect(result.merged).toBe(false);
    });
  });

  describe('happy path', () => {
    it('reassigns all events from ghost to target user, then deletes the ghost', async () => {
      const ghostId = await createGhost(SESSION_ID);
      const targetId = await createRealUser('claimer@example.com');

      // Seed substrate state under the ghost
      await seedConversationEvent(ghostId, SESSION_ID);
      await seedConversationEvent(ghostId, SESSION_ID);
      await seedCostEvent(ghostId);
      await seedCostEvent(ghostId);
      await seedCostEvent(ghostId);

      const result = await mergeAnonymousSessionIntoUser(SESSION_ID, targetId);

      expect(result.merged).toBe(true);
      expect(result.eventsMerged).toBe(2);
      expect(result.costEventsMerged).toBe(3);
      expect(result.ghostUserId).toBe(ghostId.toHexString());

      // Ghost row is gone
      expect(await User.findById(ghostId).exec()).toBeNull();

      // All events now belong to target
      const eventsByTarget = await eventsCol()
        .find({ userId: targetId })
        .toArray();
      expect(eventsByTarget).toHaveLength(2);

      const costsByTarget = await costCol()
        .find({ userId: targetId })
        .toArray();
      expect(costsByTarget).toHaveLength(3);

      // No events remain under the ghost id
      const orphanedEvents = await eventsCol().countDocuments({
        userId: ghostId,
      });
      expect(orphanedEvents).toBe(0);
      const orphanedCosts = await costCol().countDocuments({
        userId: ghostId,
      });
      expect(orphanedCosts).toBe(0);
    });

    it('does NOT touch other users\' events', async () => {
      const ghostId = await createGhost(SESSION_ID);
      const targetId = await createRealUser('claimer@example.com');
      const bystanderId = await createRealUser('bystander@example.com');

      // 1 event under the ghost, 1 under bystander
      await seedConversationEvent(ghostId, SESSION_ID);
      await seedConversationEvent(
        bystanderId,
        '99999999-aaaa-4bbb-8ccc-dddddddddddd'
      );

      const result = await mergeAnonymousSessionIntoUser(SESSION_ID, targetId);
      expect(result.merged).toBe(true);
      expect(result.eventsMerged).toBe(1);

      // Bystander's event is untouched
      const bystanderEvents = await eventsCol().countDocuments({
        userId: bystanderId,
      });
      expect(bystanderEvents).toBe(1);
    });
  });

  describe('Phase 2 — Deal materialization on claim', () => {
    it('materializes a Deal for each claimed DecisionEvent (visible in /saved-properties)', async () => {
      // Setup: ghost user runs a chat → conversation event with
      // analysis + decision in relatedEventIds. Real user signs up.
      // Claim merges events to the real user AND materializes a Deal.
      const ghostId = await createGhost(SESSION_ID);
      const targetId = await createRealUser('claimer-with-deals@example.com');

      // Seed an analysis + decision under the ghost
      const property = {
        propertyType: 'SFR' as const,
        propertyAddress: {
          street: '336 Highland Ridge Drive',
          city: 'Anna',
          state: 'TX',
          zipCode: '75409',
        },
        purchasePrice: 295000,
        downPayment: 73750,
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
      };

      const analysisEventId = await eventsRepository.writeAnalysisEvent({
        traceId: 'trace-merge-mat',
        actorType: 'tool:score_deal',
        userId: ghostId,
        payload: {
          propertyData: property,
          marketData: {} as never,
          assumptions: { vacancyRate: 5 },
          metrics: {
            noi: 18000,
            capRate: 6.1,
            cashOnCashReturn: 8.2,
            irr: 11,
            dscr: 1.4,
            operatingExpenseRatio: 0.4,
            totalInvestment: 80000,
          } as never,
          monthlyAnalysis: { cashFlow: 250 },
          longTermAnalysis: {},
          walkAwayPrice: 270000,
          enrichmentSource: 'fallback' as never,
          enrichmentCacheHit: false,
          engineVersion: 'v3.0',
          computeTimeMs: 100,
        },
      });

      const decisionEventId = await eventsRepository.writeDecisionEvent({
        traceId: 'trace-merge-mat',
        actorType: 'tool:score_deal',
        userId: ghostId,
        payload: {
          analysisEventId,
          dealQuality: 78,
          qualityLabel: 'Meets professional standards' as never,
          qualityColor: 'yellow' as never,
          professionalAssessment: {
            dealQuality: 78,
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
            strategicRecommendations: ['Offer at $270k.'],
            riskMitigation: [],
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
            strategicRecommendations: ['Offer at $270k.'],
            riskMitigation: [],
            opportunityMaximization: [],
            keyRisks: [],
          },
          confidence: 80,
          scoringWeightsUsed: {} as never,
          engineVersion: 'v3.0',
        },
      });

      // Conversation event ties the two together + carries the session
      await eventsRepository.writeConversationEvent({
        traceId: 'trace-merge-mat',
        actorType: 'user',
        userId: ghostId,
        payload: {
          sessionId: SESSION_ID,
          turnNumber: 1,
          userInput: { text: 'analyze it', inputMethod: 'text' },
          intentClassification: {
            intent: 'analyze_property',
            confidence: 90,
            classifierModel: 'claude-haiku-4-5',
          },
          routedTo: 'agent:deal_scoring',
          toolCalls: [],
          agentResponse: {
            text: 'Here is the score.',
            structuredOutputs: [],
            relatedEventIds: [analysisEventId, decisionEventId],
          },
          tokenUsage: {
            inputTokens: 100,
            outputTokens: 50,
            cachedTokens: 0,
            estimatedCostCents: 0.5,
          },
          modelUsed: 'claude-sonnet-4-6',
          totalDurationMs: 1000,
        },
      });

      // Act: merge the ghost session into the real user
      const result = await mergeAnonymousSessionIntoUser(SESSION_ID, targetId);

      // Assert: merge fired + Deal materialized + visible under targetId
      expect(result.merged).toBe(true);
      expect(result.dealsMaterialized).toBe(1);

      const { DealModel } = await import('../../models/Deal');
      const deals = await DealModel.find({ userId: targetId }).lean();
      expect(deals).toHaveLength(1);
      expect(deals[0].propertyAddress).toMatchObject({
        street: '336 Highland Ridge Drive',
        city: 'Anna',
      });
      // Task #49 cleanup (2026-06-17): post-Task-#1 (May 20, 2026), the
      // Deal no longer stores investmentDecision at write time. The Deal
      // carries latestDecisionEventId; the score is assembled at GET
      // time via assembleDecisionFromEvent from the substrate event.
      const claimedDecisionEventId = deals[0].latestDecisionEventId;
      expect(claimedDecisionEventId).toBeTruthy();
      const assembled = await assembleDecisionFromEvent(
        claimedDecisionEventId as unknown as Types.ObjectId
      );
      expect(assembled?.score).toBe(78);
      expect(assembled?.verdict).toBe('NEGOTIATE'); // 65 ≤ 78 < 80
    });
  });

  describe('idempotence', () => {
    it('a second claim with the same sessionId is a no-op', async () => {
      const ghostId = await createGhost(SESSION_ID);
      const targetId = await createRealUser('claimer@example.com');
      await seedConversationEvent(ghostId, SESSION_ID);

      const first = await mergeAnonymousSessionIntoUser(SESSION_ID, targetId);
      expect(first.merged).toBe(true);

      // Run again — ghost is gone, so this returns merged: false
      const second = await mergeAnonymousSessionIntoUser(SESSION_ID, targetId);
      expect(second.merged).toBe(false);
      expect(second.eventsMerged).toBe(0);
    });
  });
});
