/**
 * POST /api/chat/claim-session — W6-S5 acceptance tests.
 *
 * Auth-required route that wraps mergeAnonymousSessionIntoUser. We
 * mock the service so this test focuses on route-level behavior:
 *   - 200 happy path: forwards sessionId + authenticated userId
 *   - 401 when no auth
 *   - 400 on body validation (non-UUID sessionId, strict-mode extras)
 *   - 500 with no internal leak on service failure
 */

import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';

const TEST_USER_ID = new Types.ObjectId().toHexString();

// Mock the auth middleware to inject a known authenticated user.
jest.mock('../../middleware/auth', () => ({
  authMiddleware: (
    req: { user?: { id: string; email: string; role: string } },
    _res: unknown,
    next: () => void
  ): void => {
    req.user = { id: TEST_USER_ID, email: 'real@example.com', role: 'user' };
    next();
  },
}));

// chat.ts also imports chatIdentityMiddleware / chatSessionRateLimit /
// orchestrator — none of those are used by the claim-session endpoint
// (it auth-only) but we stub them so the module loads.
jest.mock('../../middleware/chatIdentity', () => ({
  chatIdentityMiddleware: (
    _req: unknown,
    _res: unknown,
    next: () => void
  ): void => next(),
}));
jest.mock('../../agents/orchestrator/orchestrator', () => ({
  handleTurn: jest.fn(),
  streamTurn: jest.fn(),
}));

const mockMerge = jest.fn();
jest.mock('../../services/chatSessionMergeService', () => ({
  mergeAnonymousSessionIntoUser: (
    sessionId: string,
    userId: Types.ObjectId
  ): unknown => mockMerge(sessionId, userId),
}));

// eslint-disable-next-line import/first
import chatRouter from '../chat';

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);
  return app;
}

const SESSION_ID = '11111111-2222-4333-8444-555555555555';

const validBody = (overrides: Record<string, unknown> = {}) => ({
  sessionId: SESSION_ID,
  ...overrides,
});

describe('POST /api/chat/claim-session (W6-S5)', () => {
  beforeEach(() => {
    mockMerge.mockReset();
  });

  describe('200 happy path', () => {
    it('forwards sessionId + authenticated userId to the merge service', async () => {
      mockMerge.mockResolvedValueOnce({
        merged: true,
        eventsMerged: 5,
        costEventsMerged: 3,
        ghostUserId: '6a0700000000000000000099',
      });

      const res = await request(buildApp())
        .post('/api/chat/claim-session')
        .send(validBody());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        merged: true,
        eventsMerged: 5,
        costEventsMerged: 3,
        ghostUserId: '6a0700000000000000000099',
      });

      expect(mockMerge).toHaveBeenCalledTimes(1);
      const [sessionId, userId] = mockMerge.mock.calls[0] as [string, Types.ObjectId];
      expect(sessionId).toBe(SESSION_ID);
      expect(userId).toBeInstanceOf(Types.ObjectId);
      expect(userId.toHexString()).toBe(TEST_USER_ID);
    });

    it('returns merged: false unchanged from the service (idempotent no-op)', async () => {
      mockMerge.mockResolvedValueOnce({
        merged: false,
        eventsMerged: 0,
        costEventsMerged: 0,
        ghostUserId: null,
      });

      const res = await request(buildApp())
        .post('/api/chat/claim-session')
        .send(validBody());

      expect(res.status).toBe(200);
      expect(res.body.merged).toBe(false);
    });
  });

  describe('400 body validation', () => {
    it.each<[string, Record<string, unknown>]>([
      ['missing sessionId', { sessionId: undefined }],
      ['sessionId not a UUID', { sessionId: 'not-a-uuid' }],
      ['empty sessionId', { sessionId: '' }],
      ['unknown top-level field (strict mode)', { extraField: 1 }],
    ])('rejects: %s', async (_label, override) => {
      const res = await request(buildApp())
        .post('/api/chat/claim-session')
        .send(validBody(override));
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid request body');
      expect(mockMerge).not.toHaveBeenCalled();
    });
  });

  describe('500 with no internal leak', () => {
    it('returns a generic error when the merge service throws', async () => {
      mockMerge.mockRejectedValueOnce(
        new Error('Sensitive: db at mongo://prod-host refused')
      );

      const res = await request(buildApp())
        .post('/api/chat/claim-session')
        .send(validBody());

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Could not claim chat session.');
      expect(JSON.stringify(res.body)).not.toContain('mongo://');
      expect(JSON.stringify(res.body)).not.toContain('Sensitive');
    });
  });
});
