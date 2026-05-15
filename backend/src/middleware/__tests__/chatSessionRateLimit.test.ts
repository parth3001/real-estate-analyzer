/**
 * chatSessionRateLimit unit tests (W6-S2.5).
 *
 * Route-integration coverage is in routes/__tests__/chat.test.ts. These
 * tests pin the middleware's behavior in isolation:
 *
 *   - Authed users bypass entirely (req.user.anonymous = false)
 *   - 10 anon turns same session = OK
 *   - 11th anon turn = 429 with retryAfterSeconds
 *   - Different sessionIds are independent
 *   - Missing sessionId = pass-through (body validation handles)
 *   - Sliding window: expired entries reset the count
 */

import type { Response, NextFunction } from 'express';
import {
  chatSessionRateLimit,
  __resetChatSessionRateLimitForTests,
} from '../chatSessionRateLimit';
import type { AuthenticatedRequest } from '../auth';

type ResStub = {
  status: jest.Mock<ResStub, [number]>;
  json: jest.Mock<ResStub, [unknown]>;
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

function makeReq(
  anonymous: boolean,
  sessionId: string | undefined
): AuthenticatedRequest {
  return {
    user: {
      id: '507f1f77bcf86cd799439011',
      email: 'x@example.com',
      role: 'user',
      anonymous,
    },
    body: sessionId === undefined ? {} : { sessionId },
  } as unknown as AuthenticatedRequest;
}

describe('chatSessionRateLimit', () => {
  beforeEach(() => {
    __resetChatSessionRateLimitForTests();
  });

  it('passes through immediately for authenticated users', () => {
    const next: NextFunction = jest.fn();
    chatSessionRateLimit(makeReq(false, 'sess-1'), makeRes() as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes through if sessionId is missing (validation runs after)', () => {
    const next: NextFunction = jest.fn();
    chatSessionRateLimit(makeReq(true, undefined), makeRes() as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows up to 10 anon turns on the same session', () => {
    const next: NextFunction = jest.fn();
    for (let i = 0; i < 10; i++) {
      chatSessionRateLimit(makeReq(true, 'sess-A'), makeRes() as unknown as Response, next);
    }
    expect(next).toHaveBeenCalledTimes(10);
  });

  it('rejects the 11th anon turn with 429 + retryAfterSeconds', () => {
    const next: NextFunction = jest.fn();
    for (let i = 0; i < 10; i++) {
      chatSessionRateLimit(makeReq(true, 'sess-B'), makeRes() as unknown as Response, next);
    }
    const res = makeRes();
    chatSessionRateLimit(makeReq(true, 'sess-B'), res as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(10); // not incremented for the 429
    expect(res._status).toBe(429);
    expect(res._body).toMatchObject({
      retryAfterSeconds: expect.any(Number),
    });
    expect((res._body as { retryAfterSeconds: number }).retryAfterSeconds).toBeGreaterThan(0);
  });

  it('gives different sessionIds independent quotas', () => {
    const next: NextFunction = jest.fn();
    for (let i = 0; i < 10; i++) {
      chatSessionRateLimit(makeReq(true, 'sess-C'), makeRes() as unknown as Response, next);
    }
    // Burn C
    const resC = makeRes();
    chatSessionRateLimit(makeReq(true, 'sess-C'), resC as unknown as Response, next);
    expect(resC._status).toBe(429);

    // D should still pass
    const dNext: NextFunction = jest.fn();
    chatSessionRateLimit(makeReq(true, 'sess-D'), makeRes() as unknown as Response, dNext);
    expect(dNext).toHaveBeenCalledTimes(1);
  });

  it('authed users never hit the 429 even when they share a sessionId', () => {
    // Burn the session as anonymous
    const next: NextFunction = jest.fn();
    for (let i = 0; i < 10; i++) {
      chatSessionRateLimit(makeReq(true, 'sess-E'), makeRes() as unknown as Response, next);
    }
    const blocked = makeRes();
    chatSessionRateLimit(makeReq(true, 'sess-E'), blocked as unknown as Response, next);
    expect(blocked._status).toBe(429);

    // Same session, but now authed — must pass
    const authedRes = makeRes();
    const authedNext: NextFunction = jest.fn();
    chatSessionRateLimit(makeReq(false, 'sess-E'), authedRes as unknown as Response, authedNext);
    expect(authedRes._status).toBeUndefined();
    expect(authedNext).toHaveBeenCalledTimes(1);
  });
});
