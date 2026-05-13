/**
 * W4-S3 acceptance test — tool:save_to_watchlist.
 *
 * Verifies:
 *   1. Tool contract conformance
 *   2. Reads the referenced DecisionEvent to derive dealId
 *   3. Writes a WatchlistEvent with dealId + decisionIdAtSave + source + note
 *   4. actorType is 'user' (saves are user actions, not tool emissions)
 *   5. Throws when the referenced decision doesn't exist
 *   6. Throws when the referenced decision has no dealId
 *   7. Source enum + note optional
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import { saveToWatchlist } from '../save_to_watchlist';
import type { ToolContext } from '../types';
import type { DecisionPayload } from '../../../models/events/DecisionEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('tool:save_to_watchlist (W4-S3)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

  function makeCtx(userId: Types.ObjectId, traceId = 'trace-save'): ToolContext {
    return {
      traceId,
      userId,
      eventsRepo: writes,
      eventsReads: reads,
      tools: {},
    };
  }

  /** Seed a DecisionEvent that the watchlist save can reference. */
  async function seedDecision(
    userId: Types.ObjectId,
    opts: { withDealId?: boolean } = {}
  ): Promise<{ decisionId: Types.ObjectId; dealId: Types.ObjectId | undefined }> {
    const dealId = opts.withDealId === false ? undefined : new Types.ObjectId();
    const analysisEventId = new Types.ObjectId();
    const payload: DecisionPayload = {
      analysisEventId,
      dealId,
      dealQuality: 72,
      qualityLabel: 'Meets professional standards',
      qualityColor: 'yellow',
      professionalAssessment: { dealQuality: 72 } as unknown as DecisionPayload['professionalAssessment'],
      marketPosition: { walkAwayPrice: 385000 } as unknown as DecisionPayload['marketPosition'],
      reasoningTrail: {
        primaryInsight: 'ok',
        strategicRecommendations: [],
        riskMitigation: [],
        opportunityMaximization: [],
        keyRisks: [],
      },
      confidence: 80,
      scoringWeightsUsed: { cashFlow: 0.3 } as unknown as DecisionPayload['scoringWeightsUsed'],
      engineVersion: 'v3.0',
    };
    const decisionId = await writes.writeDecisionEvent({
      traceId: 'seed',
      actorType: 'agent:deal_scoring',
      userId,
      payload,
    });
    return { decisionId, dealId };
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

  // ===== Contract =====

  describe('Tool contract', () => {
    it('declares invokeLLM: false', () => {
      expect(saveToWatchlist.invokeLLM).toBe(false);
    });
    it('declares a single WatchlistEvent side effect', () => {
      expect(saveToWatchlist.sideEffects).toEqual([
        { type: 'event', eventType: 'watchlist' },
      ]);
    });
    it('has the stable global name', () => {
      expect(saveToWatchlist.name).toBe('save_to_watchlist');
    });
  });

  // ===== Happy path =====

  describe('execute() — happy path', () => {
    it('writes a WatchlistEvent with dealId derived from the decision', async () => {
      const userId = new Types.ObjectId();
      const { decisionId, dealId } = await seedDecision(userId);

      const out = await saveToWatchlist.execute(
        { decisionId, source: 'chat', note: 'Worth a closer look' },
        makeCtx(userId)
      );

      expect(out.watchlistEventId).toBeInstanceOf(Types.ObjectId);
      expect(out.dealId.toString()).toBe(dealId!.toString());

      const events = await reads.getEventsByTraceId('trace-save');
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('watchlist');
      expect(events[0].payload).toMatchObject({
        source: 'chat',
        note: 'Worth a closer look',
      });
    });

    it('uses actorType: "user" (saves are user actions, not tool emissions)', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedDecision(userId);

      await saveToWatchlist.execute(
        { decisionId, source: 'chat' },
        makeCtx(userId)
      );

      const events = await reads.getEventsByTraceId('trace-save');
      expect(events[0].actorType).toBe('user');
    });

    it('captures decisionIdAtSave in the payload (substrate context)', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedDecision(userId);

      await saveToWatchlist.execute(
        { decisionId, source: 'wizard' },
        makeCtx(userId)
      );

      const events = await reads.getEventsByTraceId('trace-save');
      const payload = events[0].payload as { decisionIdAtSave: Types.ObjectId };
      expect(payload.decisionIdAtSave.toString()).toBe(decisionId.toString());
    });

    it('omits note from payload when not provided', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedDecision(userId);

      await saveToWatchlist.execute(
        { decisionId, source: 'chat' },
        makeCtx(userId)
      );

      const events = await reads.getEventsByTraceId('trace-save');
      expect((events[0].payload as { note?: string }).note).toBeUndefined();
    });

    it('accepts all four source values', async () => {
      const userId = new Types.ObjectId();
      for (const source of ['chat', 'wizard', 'import', 'shared_link'] as const) {
        const { decisionId } = await seedDecision(userId);
        await expect(
          saveToWatchlist.execute(
            { decisionId, source },
            makeCtx(userId, `trace-${source}`)
          )
        ).resolves.toBeDefined();
      }
    });

    it('accepts hex-string decisionId', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedDecision(userId);

      const out = await saveToWatchlist.execute(
        { decisionId: decisionId.toHexString(), source: 'chat' },
        makeCtx(userId)
      );
      expect(out.watchlistEventId).toBeInstanceOf(Types.ObjectId);
    });
  });

  // ===== Error handling =====

  describe('error handling', () => {
    it('throws when the referenced DecisionEvent does not exist', async () => {
      const userId = new Types.ObjectId();
      const fakeId = new Types.ObjectId();

      await expect(
        saveToWatchlist.execute(
          { decisionId: fakeId, source: 'chat' },
          makeCtx(userId, 'trace-missing')
        )
      ).rejects.toThrow(/referenced DecisionEvent not found/);

      const events = await reads.getEventsByTraceId('trace-missing');
      expect(events).toHaveLength(0);
    });

    it('throws when the DecisionEvent has no dealId (cannot save to watchlist)', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedDecision(userId, { withDealId: false });

      await expect(
        saveToWatchlist.execute(
          { decisionId, source: 'chat' },
          makeCtx(userId, 'trace-nodeal')
        )
      ).rejects.toThrow(/has no dealId/);

      const events = await reads.getEventsByTraceId('trace-nodeal');
      expect(events).toHaveLength(0);
    });

    it('rejects unknown source enum value', async () => {
      const userId = new Types.ObjectId();
      const { decisionId } = await seedDecision(userId);

      await expect(
        saveToWatchlist.execute(
          {
            decisionId,
            source: 'email' as unknown as Parameters<typeof saveToWatchlist.execute>[0]['source'],
          },
          makeCtx(userId)
        )
      ).rejects.toThrow();
    });
  });
});
