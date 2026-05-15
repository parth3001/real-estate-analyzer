/**
 * W6-S1 acceptance test — POST /api/chat/turn route.
 *
 * Tests the HTTP contract:
 *   - 200 happy path: handleTurn output flows into the wire shape
 *     (ObjectIds stringified)
 *   - 400 malformed body: missing/invalid fields rejected by Zod
 *   - 500 orchestrator threw: generic error, internal detail logged
 *   - req.user.id from auth flows to handleTurn's userId
 *
 * Mocks handleTurn (so no real LLM/Mongo) and authMiddleware (so the
 * route is testable in isolation; the real authMiddleware is covered
 * by its own tests).
 */

import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';

// ===== Mocks =====
//
// jest.mock calls are hoisted to the top of the file, so these run
// BEFORE the chat route module is imported.

jest.mock('../../agents/orchestrator/orchestrator', () => ({
  handleTurn: jest.fn(),
}));

// Mock authMiddleware to inject a known user. The real middleware is
// JWT-based and tested elsewhere; this test isolates the route logic.
const TEST_USER_ID = new Types.ObjectId().toHexString();
jest.mock('../../middleware/auth', () => ({
  authMiddleware: (
    req: { user?: { id: string; email: string; role: string } },
    _res: unknown,
    next: () => void
  ): void => {
    req.user = { id: TEST_USER_ID, email: 'test@test.com', role: 'user' };
    next();
  },
}));

// eslint-disable-next-line import/first
import chatRouter from '../chat';
// eslint-disable-next-line import/first
import { handleTurn } from '../../agents/orchestrator/orchestrator';

const mockHandleTurn = handleTurn as jest.MockedFunction<typeof handleTurn>;

// ===== Test app =====

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);
  return app;
}

function validBody(): Record<string, unknown> {
  return {
    userInput: 'analyze 123 Main St',
    sessionId: '11111111-2222-4333-8444-555555555555',
    turnNumber: 1,
  };
}

function stubOrchestratorOutput(
  overrides: Partial<Awaited<ReturnType<typeof handleTurn>>> = {}
): Awaited<ReturnType<typeof handleTurn>> {
  return {
    traceId: 'tr-test-1',
    responseText: 'Stub response.',
    routing: {
      target: 'agent:qa',
      routedTo: 'agent:qa',
      classifierIntent: 'qa_general',
      classifierConfidence: 90,
    },
    events: {
      conversationEventId: new Types.ObjectId(),
      related: [new Types.ObjectId(), new Types.ObjectId()],
    },
    totalCostCents: 0.45,
    agentStubbed: false,
    ...overrides,
  };
}

// ===== Tests =====

describe('POST /api/chat/turn (W6-S1)', () => {
  afterEach(() => {
    mockHandleTurn.mockReset();
  });

  // ===== Happy path =====

  describe('200 happy path', () => {
    it('returns the orchestrator output as the wire shape', async () => {
      const out = stubOrchestratorOutput();
      mockHandleTurn.mockResolvedValueOnce(out);

      const res = await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody());

      expect(res.status).toBe(200);
      expect(res.body.traceId).toBe('tr-test-1');
      expect(res.body.responseText).toBe('Stub response.');
      expect(res.body.routing).toMatchObject({
        target: 'agent:qa',
        routedTo: 'agent:qa',
        classifierIntent: 'qa_general',
        classifierConfidence: 90,
      });
      expect(res.body.totalCostCents).toBe(0.45);
      expect(res.body.agentStubbed).toBe(false);
    });

    it('stringifies ObjectIds in events (HTTP is text)', async () => {
      const convId = new Types.ObjectId();
      const relA = new Types.ObjectId();
      const relB = new Types.ObjectId();
      mockHandleTurn.mockResolvedValueOnce(
        stubOrchestratorOutput({
          events: { conversationEventId: convId, related: [relA, relB] },
        })
      );

      const res = await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody());

      expect(res.status).toBe(200);
      expect(res.body.events.conversationEventId).toBe(convId.toHexString());
      expect(res.body.events.related).toEqual([
        relA.toHexString(),
        relB.toHexString(),
      ]);
      // Hex ObjectIds are 24 chars
      expect(res.body.events.conversationEventId).toMatch(/^[0-9a-f]{24}$/);
    });

    it('passes the authenticated user.id to handleTurn as a Types.ObjectId', async () => {
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      await request(buildApp()).post('/api/chat/turn').send(validBody());

      expect(mockHandleTurn).toHaveBeenCalledTimes(1);
      const args = mockHandleTurn.mock.calls[0][0];
      expect(args.userId).toBeInstanceOf(Types.ObjectId);
      expect(args.userId.toHexString()).toBe(TEST_USER_ID);
    });

    it('forwards inputMethod + toolPayload through to handleTurn', async () => {
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      await request(buildApp())
        .post('/api/chat/turn')
        .send({
          ...validBody(),
          inputMethod: 'voice',
          toolPayload: { decisionId: 'abc123', source: 'chat' },
        });

      const args = mockHandleTurn.mock.calls[0][0];
      expect(args.inputMethod).toBe('voice');
      expect(args.toolPayload).toEqual({ decisionId: 'abc123', source: 'chat' });
    });

    it('forwards optional routing.fallbackReason when present', async () => {
      mockHandleTurn.mockResolvedValueOnce(
        stubOrchestratorOutput({
          routing: {
            target: 'agent:qa',
            routedTo: 'agent:qa',
            classifierIntent: 'analyze_property',
            classifierConfidence: 55,
            fallbackReason: 'low_confidence',
          },
        })
      );

      const res = await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody());

      expect(res.body.routing.fallbackReason).toBe('low_confidence');
    });
  });

  // ===== 400 — body validation =====

  describe('400 malformed body', () => {
    it.each<[string, Record<string, unknown>]>([
      ['empty userInput', { ...validBody(), userInput: '' }],
      ['userInput too long (>8000)', { ...validBody(), userInput: 'a'.repeat(8001) }],
      [
        'sessionId not a UUID',
        { ...validBody(), sessionId: 'not-a-uuid' },
      ],
      ['turnNumber zero', { ...validBody(), turnNumber: 0 }],
      ['turnNumber negative', { ...validBody(), turnNumber: -1 }],
      ['turnNumber not int', { ...validBody(), turnNumber: 1.5 }],
      [
        'inputMethod outside enum',
        { ...validBody(), inputMethod: 'morse' },
      ],
      ['unknown top-level field (strict mode)', { ...validBody(), extraJunk: 1 }],
      ['missing userInput', { sessionId: validBody().sessionId, turnNumber: 1 }],
      ['missing sessionId', { userInput: 'x', turnNumber: 1 }],
      ['missing turnNumber', { userInput: 'x', sessionId: validBody().sessionId }],
    ])('rejects: %s', async (_label, body) => {
      const res = await request(buildApp()).post('/api/chat/turn').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid request body');
      // handleTurn must NOT be called on validation failure
      expect(mockHandleTurn).not.toHaveBeenCalled();
    });
  });

  // ===== 500 — orchestrator throws =====

  describe('500 orchestrator failure', () => {
    it('returns a generic error message (internal detail logged, not leaked)', async () => {
      mockHandleTurn.mockRejectedValueOnce(
        new Error('Sensitive internal: DB connection refused at mongo://prod-host')
      );

      const res = await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody());

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Chat turn failed. Please try again.');
      // The internal error message MUST NOT leak to the client
      expect(JSON.stringify(res.body)).not.toContain('DB connection');
      expect(JSON.stringify(res.body)).not.toContain('mongo://');
    });
  });
});
