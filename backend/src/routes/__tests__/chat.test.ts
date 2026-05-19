/**
 * POST /api/chat/turn — W6-S1 + W6-S2.5 acceptance test.
 *
 * Tests the HTTP contract:
 *   - 200 happy path: handleTurn output flows into the wire shape
 *     (ObjectIds stringified)
 *   - 400 malformed body: missing/invalid fields rejected by Zod
 *   - 500 orchestrator threw: generic error, internal detail not leaked
 *   - Identity resolution: authed user.id OR ghost-user user.id reaches
 *     handleTurn (W6-S2.5)
 *   - Session rate limit: anonymous sessions cap at 10 turns/24h;
 *     authenticated sessions skip; different sessionIds are independent
 *     (W6-S2.5)
 *   - Activation telemetry: `chat.turn.completed` logged with
 *     `anonymous: boolean` flag (W6-S2.5)
 *
 * Mocks handleTurn (so no LLM/Mongo) and chatIdentityMiddleware (so we
 * don't need a real User collection to test route logic). The real
 * chatSessionRateLimit middleware runs unmocked — its in-memory state
 * is reset between tests via the exported test-only helper.
 */

import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';

// ===== Mocks =====
//
// jest.mock factories are hoisted; `mockState` is hoisted too because it
// starts with the literal "mock" prefix (jest documented escape hatch).

const mockChatIdentityState = {
  userId: new Types.ObjectId().toHexString(),
  anonymous: true,
};

jest.mock('../../agents/orchestrator/orchestrator', () => ({
  handleTurn: jest.fn(),
  streamTurn: jest.fn(),
}));

// Day 9b: Deal model + LicenseRepository need stubbing for the
// dealId → licenseId resolver. Each test sets the stub's return value
// to model the scenario under test.
const mockDealFindOne = jest.fn();
jest.mock('../../models/Deal', () => ({
  DealModel: {
    findOne: (...args: unknown[]) => mockDealFindOne(...args),
  },
}));

const mockFindActiveForProperty = jest.fn();
jest.mock('../../repositories/LicenseRepository', () => ({
  licenseRepository: {
    findActiveForProperty: (...args: unknown[]) =>
      mockFindActiveForProperty(...args),
  },
}));

jest.mock('../../middleware/chatIdentity', () => ({
  chatIdentityMiddleware: (
    req: { user?: { id: string; email: string; role: string; anonymous?: boolean } },
    _res: unknown,
    next: () => void
  ): void => {
    req.user = {
      id: mockChatIdentityState.userId,
      email: mockChatIdentityState.anonymous
        ? `anon-test@anon.app`
        : 'test@test.com',
      role: 'user',
      anonymous: mockChatIdentityState.anonymous,
    };
    next();
  },
}));

// eslint-disable-next-line import/first
import chatRouter from '../chat';
// eslint-disable-next-line import/first
import { handleTurn, streamTurn } from '../../agents/orchestrator/orchestrator';
// eslint-disable-next-line import/first
import { __resetChatSessionRateLimitForTests } from '../../middleware/chatSessionRateLimit';
// eslint-disable-next-line import/first
import { __resetChatPerIpRateLimitForTests } from '../../middleware/chatPerIpRateLimit';
// eslint-disable-next-line import/first
import type { OrchestratorStreamEvent } from '../../agents/orchestrator/streamEvents';

const mockHandleTurn = handleTurn as jest.MockedFunction<typeof handleTurn>;
const mockStreamTurn = streamTurn as jest.MockedFunction<typeof streamTurn>;

// ===== Test app =====

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);
  return app;
}

let nextSessionIdSeq = 0;
function freshSessionId(): string {
  // Deterministic UUID v4 per call — matches the route's z.string().uuid()
  // validator without depending on crypto.randomUUID() in test env.
  nextSessionIdSeq += 1;
  const seq = nextSessionIdSeq.toString(16).padStart(12, '0');
  return `11111111-2222-4333-8444-${seq}`;
}

function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userInput: 'analyze 123 Main St',
    sessionId: freshSessionId(),
    turnNumber: 1,
    ...overrides,
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

/**
 * Helper to wire the Mongoose-chain mock for `DealModel.findOne(...).select(...).lean()`.
 * Pass null to simulate "deal not found / not owned by user."
 */
function setMockDealLookup(
  result: { propertyAddress?: Record<string, string> } | null
): void {
  mockDealFindOne.mockReturnValue({
    select: () => ({
      lean: () => Promise.resolve(result),
    }),
  });
}

describe('POST /api/chat/turn', () => {
  beforeEach(() => {
    mockHandleTurn.mockReset();
    mockDealFindOne.mockReset();
    mockFindActiveForProperty.mockReset();
    __resetChatSessionRateLimitForTests();
    __resetChatPerIpRateLimitForTests();
    // Default: anonymous user. Tests that need an authed user flip this.
    mockChatIdentityState.userId = new Types.ObjectId().toHexString();
    mockChatIdentityState.anonymous = true;
  });

  // ===== Happy path =====

  describe('200 happy path', () => {
    it('returns the orchestrator output as the wire shape', async () => {
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

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
      expect(res.body.events.conversationEventId).toMatch(/^[0-9a-f]{24}$/);
    });

    it('passes the resolved user.id to handleTurn as a Types.ObjectId', async () => {
      const expectedUserId = new Types.ObjectId().toHexString();
      mockChatIdentityState.userId = expectedUserId;
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      await request(buildApp()).post('/api/chat/turn').send(validBody());

      expect(mockHandleTurn).toHaveBeenCalledTimes(1);
      const args = mockHandleTurn.mock.calls[0][0];
      expect(args.userId).toBeInstanceOf(Types.ObjectId);
      expect(args.userId.toHexString()).toBe(expectedUserId);
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

  // ===== W6-S2.5 — anonymous identity flow =====

  describe('anonymous identity (W6-S2.5)', () => {
    it('accepts an anonymous turn (no Bearer required)', async () => {
      mockChatIdentityState.anonymous = true;
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      const res = await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody());

      expect(res.status).toBe(200);
      expect(mockHandleTurn).toHaveBeenCalledTimes(1);
    });

    it('flows the ghost user.id through to handleTurn', async () => {
      const ghostUserId = new Types.ObjectId().toHexString();
      mockChatIdentityState.userId = ghostUserId;
      mockChatIdentityState.anonymous = true;
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      await request(buildApp()).post('/api/chat/turn').send(validBody());

      const args = mockHandleTurn.mock.calls[0][0];
      expect(args.userId.toHexString()).toBe(ghostUserId);
    });

    it('also works for authenticated users (anonymous flag false)', async () => {
      mockChatIdentityState.anonymous = false;
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      const res = await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody());

      expect(res.status).toBe(200);
    });
  });

  // ===== W6-S2.5 — session rate limit =====

  describe('chatSessionRateLimit (W6-S2.5)', () => {
    it('allows 10 anonymous turns on the same session', async () => {
      mockChatIdentityState.anonymous = true;
      mockHandleTurn.mockResolvedValue(stubOrchestratorOutput());

      const sessionId = freshSessionId();
      for (let i = 1; i <= 10; i++) {
        const res = await request(buildApp())
          .post('/api/chat/turn')
          .send({ ...validBody(), sessionId, turnNumber: i });
        expect(res.status).toBe(200);
      }
    });

    it('rejects the 11th anonymous turn on the same session with 429', async () => {
      mockChatIdentityState.anonymous = true;
      mockHandleTurn.mockResolvedValue(stubOrchestratorOutput());

      const sessionId = freshSessionId();
      for (let i = 1; i <= 10; i++) {
        await request(buildApp())
          .post('/api/chat/turn')
          .send({ ...validBody(), sessionId, turnNumber: i });
      }
      const res = await request(buildApp())
        .post('/api/chat/turn')
        .send({ ...validBody(), sessionId, turnNumber: 11 });

      expect(res.status).toBe(429);
      expect(res.body.error).toMatch(/free analysis limit/i);
      expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('gives different sessionIds independent quotas', async () => {
      mockChatIdentityState.anonymous = true;
      mockHandleTurn.mockResolvedValue(stubOrchestratorOutput());

      const sessionA = freshSessionId();
      const sessionB = freshSessionId();

      // Burn session A to the cap
      for (let i = 1; i <= 10; i++) {
        await request(buildApp())
          .post('/api/chat/turn')
          .send({ ...validBody(), sessionId: sessionA, turnNumber: i });
      }
      const aOver = await request(buildApp())
        .post('/api/chat/turn')
        .send({ ...validBody(), sessionId: sessionA, turnNumber: 11 });
      expect(aOver.status).toBe(429);

      // Session B should still be wide open
      const bFirst = await request(buildApp())
        .post('/api/chat/turn')
        .send({ ...validBody(), sessionId: sessionB, turnNumber: 1 });
      expect(bFirst.status).toBe(200);
    });

    it('authenticated users bypass the session limit (can exceed 10)', async () => {
      mockChatIdentityState.anonymous = false;
      mockHandleTurn.mockResolvedValue(stubOrchestratorOutput());

      const sessionId = freshSessionId();
      // 11 turns as an authed user — should all succeed
      for (let i = 1; i <= 11; i++) {
        const res = await request(buildApp())
          .post('/api/chat/turn')
          .send({ ...validBody(), sessionId, turnNumber: i });
        expect(res.status).toBe(200);
      }
    });
  });

  // ===== 400 — body validation =====

  describe('400 malformed body', () => {
    it.each<[string, Record<string, unknown>]>([
      ['empty userInput', { ...validBody(), userInput: '' }],
      ['userInput too long (>8000)', { ...validBody(), userInput: 'a'.repeat(8001) }],
      ['sessionId not a UUID', { ...validBody(), sessionId: 'not-a-uuid' }],
      ['turnNumber zero', { ...validBody(), turnNumber: 0 }],
      ['turnNumber negative', { ...validBody(), turnNumber: -1 }],
      ['turnNumber not int', { ...validBody(), turnNumber: 1.5 }],
      ['inputMethod outside enum', { ...validBody(), inputMethod: 'morse' }],
      ['unknown top-level field (strict mode)', { ...validBody(), extraJunk: 1 }],
      ['missing userInput', { sessionId: freshSessionId(), turnNumber: 1 }],
      ['missing sessionId', { userInput: 'x', turnNumber: 1 }],
      ['missing turnNumber', { userInput: 'x', sessionId: freshSessionId() }],
      // Day 9b — dealId validation
      [
        'dealId not 24-char hex',
        { ...validBody(), dealId: 'not-an-objectid' },
      ],
      [
        'dealId too short',
        { ...validBody(), dealId: 'abc123' },
      ],
    ])('rejects: %s', async (_label, body) => {
      const res = await request(buildApp()).post('/api/chat/turn').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid request body');
      expect(mockHandleTurn).not.toHaveBeenCalled();
    });
  });

  // ===== Day 9b — dealId → licenseId resolution =====

  describe('dealId → licenseId resolution (Day 9b — activates Phase B caps)', () => {
    it('passes resolved licenseId to handleTurn when dealId + active license both exist', async () => {
      const dealId = new Types.ObjectId().toHexString();
      const licenseId = new Types.ObjectId();
      setMockDealLookup({
        propertyAddress: {
          street: '123 Main St',
          city: 'Austin',
          state: 'TX',
        },
      });
      mockFindActiveForProperty.mockResolvedValueOnce({
        _id: licenseId,
        userId: new Types.ObjectId(),
        canonicalPropertyAddressKey: '123 main st|austin|TX|',
      });
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody({ dealId }))
        .expect(200);

      expect(mockHandleTurn).toHaveBeenCalledTimes(1);
      const callArg = mockHandleTurn.mock.calls[0][0];
      expect(callArg.licenseId).toEqual(licenseId);
    });

    it('passes undefined licenseId when dealId is omitted', async () => {
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody())
        .expect(200);

      const callArg = mockHandleTurn.mock.calls[0][0];
      expect(callArg.licenseId).toBeUndefined();
      // Should not have attempted any lookup.
      expect(mockDealFindOne).not.toHaveBeenCalled();
      expect(mockFindActiveForProperty).not.toHaveBeenCalled();
    });

    it('passes undefined licenseId when dealId is present but Deal is not found / not owned', async () => {
      // Most common case: user pasted someone else's dealId, or a stale
      // dealId that no longer exists. Ownership filter in the lookup
      // returns null. License resolution short-circuits to undefined.
      const dealId = new Types.ObjectId().toHexString();
      setMockDealLookup(null);
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody({ dealId }))
        .expect(200);

      const callArg = mockHandleTurn.mock.calls[0][0];
      expect(callArg.licenseId).toBeUndefined();
      expect(mockFindActiveForProperty).not.toHaveBeenCalled();
    });

    it('passes undefined licenseId when Deal exists but no active license for the property', async () => {
      // Saved deal but never licensed — free-tier flow. Per-license
      // cap MUST NOT fire; session + daily caps still cover this turn.
      const dealId = new Types.ObjectId().toHexString();
      setMockDealLookup({
        propertyAddress: { street: '9 Free St', city: 'Anywhere', state: 'TX' },
      });
      mockFindActiveForProperty.mockResolvedValueOnce(null);
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody({ dealId }))
        .expect(200);

      const callArg = mockHandleTurn.mock.calls[0][0];
      expect(callArg.licenseId).toBeUndefined();
    });

    it('degrades gracefully when license lookup throws (lookup failure must NEVER block a chat turn)', async () => {
      const dealId = new Types.ObjectId().toHexString();
      setMockDealLookup({
        propertyAddress: { street: '5 Crash Ln', city: 'X', state: 'TX' },
      });
      mockFindActiveForProperty.mockRejectedValueOnce(
        new Error('Mongo unreachable')
      );
      mockHandleTurn.mockResolvedValueOnce(stubOrchestratorOutput());

      // The chat turn should still succeed (cost discipline degrades to
      // session + daily only). The user must NEVER see a failure because
      // the optional license-cap layer broke.
      const res = await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody({ dealId }));
      expect(res.status).toBe(200);
      const callArg = mockHandleTurn.mock.calls[0][0];
      expect(callArg.licenseId).toBeUndefined();
    });
  });

  // ===== 500 — orchestrator throws =====

  describe('500 orchestrator failure', () => {
    it('returns a generic error message (internal detail not leaked)', async () => {
      mockHandleTurn.mockRejectedValueOnce(
        new Error('Sensitive internal: DB connection refused at mongo://prod-host')
      );

      const res = await request(buildApp())
        .post('/api/chat/turn')
        .send(validBody());

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Chat turn failed. Please try again.');
      expect(JSON.stringify(res.body)).not.toContain('DB connection');
      expect(JSON.stringify(res.body)).not.toContain('mongo://');
    });
  });
});

// ===== W6-S3 — streaming endpoint =====

/**
 * Parse an SSE response body into a list of orchestrator stream events.
 * Mirrors the frontend's parseSseStream logic; sufficient for tests.
 */
function parseSseFrames(body: string): OrchestratorStreamEvent[] {
  const events: OrchestratorStreamEvent[] = [];
  for (const frame of body.split('\n\n')) {
    const dataLines: string[] = [];
    for (const line of frame.split('\n')) {
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length === 0) continue;
    try {
      events.push(JSON.parse(dataLines.join('\n')) as OrchestratorStreamEvent);
    } catch {
      // skip malformed
    }
  }
  return events;
}

function stubStreamEvents(): OrchestratorStreamEvent[] {
  return [
    {
      type: 'routing',
      target: 'agent:qa',
      routedTo: 'agent:qa',
      classifierIntent: 'qa_general',
      classifierConfidence: 90,
    },
    { type: 'text_delta', text: 'Cap rate' },
    { type: 'text_delta', text: ' is the' },
    { type: 'text_delta', text: ' yield.' },
    {
      type: 'done',
      traceId: 'tr-stream-1',
      conversationEventId: new Types.ObjectId().toHexString(),
      relatedEventIds: [],
      totalCostCents: 1.23,
      agentStubbed: false,
    },
  ];
}

describe('POST /api/chat/turn/stream (W6-S3)', () => {
  beforeEach(() => {
    mockStreamTurn.mockReset();
    __resetChatSessionRateLimitForTests();
    __resetChatPerIpRateLimitForTests();
    mockChatIdentityState.userId = new Types.ObjectId().toHexString();
    mockChatIdentityState.anonymous = true;
  });

  it('responds with text/event-stream and emits the scripted events as SSE frames', async () => {
    const events = stubStreamEvents();
    mockStreamTurn.mockImplementation(async function* () {
      for (const ev of events) yield ev;
    });

    const res = await request(buildApp())
      .post('/api/chat/turn/stream')
      .send(validBody())
      .buffer(true)
      .parse((response, callback) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          data += chunk;
        });
        response.on('end', () => callback(null, data));
      });

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toMatch(/text\/event-stream/);
    expect(res.header['cache-control']).toMatch(/no-cache/);

    const parsed = parseSseFrames(res.body as string);
    expect(parsed.length).toBe(events.length);
    expect(parsed[0]).toMatchObject({ type: 'routing', target: 'agent:qa' });
    expect(parsed.filter((e) => e.type === 'text_delta')).toHaveLength(3);
    expect(parsed[parsed.length - 1].type).toBe('done');
  });

  it('emits an error frame and ends cleanly when streamTurn throws synchronously', async () => {
    mockStreamTurn.mockImplementation(() => {
      throw new Error('Sensitive: db at mongo://prod refused');
    });

    const res = await request(buildApp())
      .post('/api/chat/turn/stream')
      .send(validBody())
      .buffer(true)
      .parse((response, callback) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          data += chunk;
        });
        response.on('end', () => callback(null, data));
      });

    expect(res.status).toBe(200); // SSE keeps 200 — the error is in the body
    const parsed = parseSseFrames(res.body as string);
    expect(parsed[parsed.length - 1]).toEqual({
      type: 'error',
      message: 'Chat turn failed. Please try again.',
    });
    // No internal leak
    expect(res.body as string).not.toContain('mongo://');
    expect(res.body as string).not.toContain('Sensitive:');
  });

  it('validates the body before opening the stream (400 on malformed)', async () => {
    const res = await request(buildApp())
      .post('/api/chat/turn/stream')
      .send({ userInput: '', sessionId: freshSessionId(), turnNumber: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request body');
    expect(mockStreamTurn).not.toHaveBeenCalled();
  });

  it('honors the session rate limit (anon 11th stream → 429)', async () => {
    const events = stubStreamEvents();
    mockStreamTurn.mockImplementation(async function* () {
      for (const ev of events) yield ev;
    });
    const sessionId = freshSessionId();
    for (let i = 1; i <= 10; i++) {
      await request(buildApp())
        .post('/api/chat/turn/stream')
        .send({ ...validBody(), sessionId, turnNumber: i });
    }
    const res = await request(buildApp())
      .post('/api/chat/turn/stream')
      .send({ ...validBody(), sessionId, turnNumber: 11 });

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/free analysis limit/i);
  });
});
