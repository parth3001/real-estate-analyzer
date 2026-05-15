/**
 * chatIdentityMiddleware unit tests (W6-S2.5).
 *
 * Backed by mongodb-memory-server to exercise the real find-or-create
 * ghost-user logic against the User schema (synthetic email, unique
 * anonymousSessionId, etc.).
 *
 * Coverage:
 *   - First anon turn → User.create called → req.user set with anonymous: true
 *   - Repeat anon turn with same sessionId → finds existing ghost, no create
 *   - Two different sessionIds → two distinct ghost users
 *   - Missing sessionId on anon path → 400
 *   - Malformed sessionId (non-UUID) → 400
 *   - Bearer token present → delegates to authMiddleware (we mock auth to
 *     verify the delegation path is taken)
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Response, NextFunction } from 'express';

// Mock authMiddleware so we can detect when chatIdentity delegates to it.
jest.mock('../auth', () => {
  // Preserve type export but mock the function.
  const actual = jest.requireActual('../auth');
  return {
    ...actual,
    authMiddleware: jest.fn(
      (
        req: { user?: { id: string; email: string; role: string; anonymous?: boolean } },
        _res: unknown,
        next: () => void
      ): void => {
        req.user = {
          id: '507f1f77bcf86cd799439011',
          email: 'authed@example.com',
          role: 'user',
        };
        next();
      }
    ),
  };
});

// eslint-disable-next-line import/first
import { chatIdentityMiddleware } from '../chatIdentity';
// eslint-disable-next-line import/first
import { User } from '../../models/User';
// eslint-disable-next-line import/first
import { authMiddleware } from '../auth';
// eslint-disable-next-line import/first
import type { AuthenticatedRequest } from '../auth';

const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

const VALID_UUID = '11111111-2222-4333-8444-555555555555';
const OTHER_UUID = '11111111-2222-4333-8444-666666666666';
const SETUP_TIMEOUT_MS = 90_000;

type ResStub = {
  status: jest.Mock;
  json: jest.Mock;
  _status?: number;
  _body?: unknown;
};

function makeRes(): ResStub {
  const res: Partial<ResStub> = {};
  res.status = jest.fn((code: number) => {
    res._status = code;
    return res as ResStub;
  });
  res.json = jest.fn((body: unknown) => {
    res._body = body;
    return res as ResStub;
  });
  return res as ResStub;
}

function makeReq(opts: {
  authHeader?: string;
  sessionId?: unknown;
}): AuthenticatedRequest {
  return {
    headers: opts.authHeader ? { authorization: opts.authHeader } : {},
    body: opts.sessionId === undefined ? {} : { sessionId: opts.sessionId },
  } as unknown as AuthenticatedRequest;
}

describe('chatIdentityMiddleware', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  beforeEach(async () => {
    await User.deleteMany({});
    mockedAuthMiddleware.mockClear();
  });

  describe('anonymous path (no Bearer)', () => {
    it('creates a ghost user on first turn and attaches it to req.user', async () => {
      const req = makeReq({ sessionId: VALID_UUID });
      const res = makeRes();
      const next: NextFunction = jest.fn();

      await chatIdentityMiddleware(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user?.anonymous).toBe(true);
      expect(req.user?.email).toBe(`anon-${VALID_UUID}@anon.app`);

      const ghost = await User.findOne({ anonymousSessionId: VALID_UUID });
      expect(ghost).not.toBeNull();
      expect(ghost?.anonymous).toBe(true);
      expect(ghost?.email).toBe(`anon-${VALID_UUID}@anon.app`);
      expect((ghost?._id as Types.ObjectId).toString()).toBe(req.user?.id);
    });

    it('reuses the same ghost user on the next turn (no duplicate)', async () => {
      const next: NextFunction = jest.fn();

      await chatIdentityMiddleware(
        makeReq({ sessionId: VALID_UUID }),
        makeRes() as unknown as Response,
        next
      );
      await chatIdentityMiddleware(
        makeReq({ sessionId: VALID_UUID }),
        makeRes() as unknown as Response,
        next
      );

      const ghosts = await User.find({ anonymousSessionId: VALID_UUID });
      expect(ghosts).toHaveLength(1);
    });

    it('creates distinct ghosts for distinct sessionIds', async () => {
      const next: NextFunction = jest.fn();

      const reqA = makeReq({ sessionId: VALID_UUID });
      const reqB = makeReq({ sessionId: OTHER_UUID });
      await chatIdentityMiddleware(reqA, makeRes() as unknown as Response, next);
      await chatIdentityMiddleware(reqB, makeRes() as unknown as Response, next);

      expect(reqA.user?.id).not.toBe(reqB.user?.id);
      const all = await User.find({ anonymous: true });
      expect(all).toHaveLength(2);
    });

    it('rejects with 400 when sessionId is missing', async () => {
      const res = makeRes();
      const next: NextFunction = jest.fn();

      await chatIdentityMiddleware(makeReq({}), res as unknown as Response, next);

      expect(res._status).toBe(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects with 400 when sessionId is malformed (not a UUID)', async () => {
      const res = makeRes();
      const next: NextFunction = jest.fn();

      await chatIdentityMiddleware(
        makeReq({ sessionId: 'not-a-uuid' }),
        res as unknown as Response,
        next
      );

      expect(res._status).toBe(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authenticated path (Bearer header)', () => {
    it('delegates to authMiddleware and tags the user as non-anonymous', async () => {
      const req = makeReq({
        authHeader: 'Bearer fake-jwt-token',
        sessionId: VALID_UUID,
      });
      const res = makeRes();
      const next: NextFunction = jest.fn();

      await chatIdentityMiddleware(req, res as unknown as Response, next);

      expect(mockedAuthMiddleware).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user?.anonymous).toBe(false);
      // No ghost created
      const ghosts = await User.find({ anonymous: true });
      expect(ghosts).toHaveLength(0);
    });
  });
});
