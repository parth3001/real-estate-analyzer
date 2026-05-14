/**
 * W5-S2 acceptance test — conversation context helper.
 *
 * Verifies loadRecentTurns + renderRecentTurns: the Option-A
 * context-threading mechanism that lets the classifier + agents
 * recognize clarifying-question continuations.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import {
  loadRecentTurns,
  renderRecentTurns,
  type RecentTurn,
} from '../conversationContext';

const SETUP_TIMEOUT_MS = 90_000;
const SESSION = '11111111-2222-4333-8444-555555555555';

describe('conversationContext (W5-S2)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

  /** Seed a ConversationEvent for a session at a given turn. */
  async function seedTurn(
    sessionId: string,
    turnNumber: number,
    userText: string,
    agentText: string,
    intent = 'qa_general',
    routedTo = 'agent:qa'
  ): Promise<void> {
    await writes.writeConversationEvent({
      traceId: `trace-${sessionId}-${turnNumber}`,
      actorType: 'user',
      userId: new Types.ObjectId(),
      payload: {
        sessionId,
        turnNumber,
        userInput: { text: userText, inputMethod: 'text' },
        intentClassification: {
          intent: intent as 'qa_general',
          confidence: 90,
          classifierModel: 'claude-haiku-4-5',
        },
        routedTo: routedTo as 'agent:qa',
        toolCalls: [],
        agentResponse: { text: agentText, structuredOutputs: [], relatedEventIds: [] },
        tokenUsage: {
          inputTokens: 100,
          outputTokens: 50,
          cachedTokens: 0,
          estimatedCostCents: 0.1,
        },
        modelUsed: 'claude-haiku-4-5',
        totalDurationMs: 500,
      },
    });
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

  // ===== loadRecentTurns =====

  describe('loadRecentTurns', () => {
    it('returns [] for a brand-new session', async () => {
      const turns = await loadRecentTurns(reads, 'unknown-session');
      expect(turns).toEqual([]);
    });

    it('returns turns oldest-first', async () => {
      await seedTurn(SESSION, 1, 'first', 'reply 1');
      await seedTurn(SESSION, 2, 'second', 'reply 2');
      await seedTurn(SESSION, 3, 'third', 'reply 3');

      const turns = await loadRecentTurns(reads, SESSION);
      expect(turns.map((t) => t.turnNumber)).toEqual([1, 2, 3]);
      expect(turns[0].userText).toBe('first');
      expect(turns[2].agentText).toBe('reply 3');
    });

    it('caps at the limit, keeping the most recent', async () => {
      for (let i = 1; i <= 8; i++) {
        await seedTurn(SESSION, i, `user ${i}`, `agent ${i}`);
      }
      const turns = await loadRecentTurns(reads, SESSION, 4);
      expect(turns).toHaveLength(4);
      // Most recent 4 → turns 5,6,7,8
      expect(turns.map((t) => t.turnNumber)).toEqual([5, 6, 7, 8]);
    });

    it('captures intent and routedTo per turn', async () => {
      await seedTurn(
        SESSION,
        1,
        'analyze 123 Main St',
        'BRRRR or buy-hold?',
        'analyze_property',
        'agent:deal_scoring'
      );
      const turns = await loadRecentTurns(reads, SESSION);
      expect(turns[0].intent).toBe('analyze_property');
      expect(turns[0].routedTo).toBe('agent:deal_scoring');
    });

    it('scopes to the requested session only', async () => {
      const sessionA = '11111111-2222-4333-8444-aaaaaaaaaaaa';
      const sessionB = '11111111-2222-4333-8444-bbbbbbbbbbbb';
      await seedTurn(sessionA, 1, 'A1', 'a-reply');
      await seedTurn(sessionB, 1, 'B1', 'b-reply');

      const aTurns = await loadRecentTurns(reads, sessionA);
      expect(aTurns).toHaveLength(1);
      expect(aTurns[0].userText).toBe('A1');
    });
  });

  // ===== renderRecentTurns =====

  describe('renderRecentTurns', () => {
    it('returns empty string for no turns (no header on fresh session)', () => {
      expect(renderRecentTurns([])).toBe('');
    });

    it('renders a compact block with the conversation header', () => {
      const turns: RecentTurn[] = [
        {
          turnNumber: 3,
          userText: 'analyze 123 Main St Austin TX',
          agentText: 'Quick question — BRRRR or buy-and-hold?',
          intent: 'analyze_property',
          routedTo: 'agent:deal_scoring',
        },
      ];
      const rendered = renderRecentTurns(turns);
      expect(rendered).toContain('Conversation so far:');
      expect(rendered).toContain('Turn 3 [analyze_property → agent:deal_scoring]');
      expect(rendered).toContain('User: analyze 123 Main St Austin TX');
      expect(rendered).toContain('Assistant: Quick question — BRRRR or buy-and-hold?');
    });

    it('renders multiple turns in order', () => {
      const turns: RecentTurn[] = [
        {
          turnNumber: 1,
          userText: 'u1',
          agentText: 'a1',
          intent: 'qa_general',
          routedTo: 'agent:qa',
        },
        {
          turnNumber: 2,
          userText: 'u2',
          agentText: 'a2',
          intent: 'qa_metric',
          routedTo: 'agent:qa',
        },
      ];
      const rendered = renderRecentTurns(turns);
      const t1Index = rendered.indexOf('Turn 1');
      const t2Index = rendered.indexOf('Turn 2');
      expect(t1Index).toBeGreaterThan(-1);
      expect(t2Index).toBeGreaterThan(t1Index);
    });
  });

  // ===== Integration: the clarifying-question scenario =====

  describe('clarifying-question continuation scenario', () => {
    it('captures the agent-asked-strategy turn for the classifier to see', async () => {
      // Turn 1: user asks to analyze, agent asks the strategy question
      await seedTurn(
        SESSION,
        1,
        'analyze 1837 Walnut Way Anna TX',
        'Got it — 1837 Walnut Way. Quick question: BRRRR or buy-and-hold?',
        'analyze_property',
        'agent:deal_scoring'
      );

      // Now the orchestrator (on turn 2) would load this context
      const turns = await loadRecentTurns(reads, SESSION);
      const rendered = renderRecentTurns(turns);

      // The rendered context shows the agent asked a clarifying question —
      // this is what lets the classifier recognize "BRRRR" (turn 2) as a
      // continuation of analyze_property, not a fresh share_profile.
      expect(rendered).toContain('BRRRR or buy-and-hold?');
      expect(rendered).toContain('analyze_property');
    });
  });
});
