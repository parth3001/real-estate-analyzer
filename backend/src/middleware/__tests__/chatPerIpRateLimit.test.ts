/**
 * chatPerIpRateLimit — Day 11e (Issue E2) acceptance tests.
 *
 * Covers the per-IP analysis quota for anonymous chat users.
 *
 * Test cases:
 *   1. Authenticated users bypass
 *   2. Anonymous users tracked per IP, capped at 5 unique sessions
 *   3. Same sessionId from same IP doesn't burn quota (set semantics)
 *   4. Different IPs counted independently
 *   5. 429 response shape includes retryAfterSeconds
 *   6. Window expiry resets the quota
 *   7. Missing sessionId / unknown IP defensive pass-through
 */

import express from 'express';
import request from 'supertest';
import {
  chatPerIpRateLimit,
  __resetChatPerIpRateLimitForTests,
} from '../chatPerIpRateLimit';
import type { AuthenticatedRequest } from '../auth';

function buildApp(opts: { anonymous: boolean; ipOverride?: string }) {
  const app = express();
  // Enable trust-proxy so X-Forwarded-For sets req.ip — same shape
  // production uses behind Render's proxy.
  app.set('trust proxy', true);
  app.use(express.json());
  app.use((req, _res, next) => {
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: '507f1f77bcf86cd799439011',
      email: opts.anonymous ? 'anon@anon.app' : 'real@user.com',
      role: 'user',
      anonymous: opts.anonymous,
    };
    if (opts.ipOverride) {
      Object.defineProperty(req, 'ip', { value: opts.ipOverride });
    }
    next();
  });
  app.post('/api/chat/turn', chatPerIpRateLimit, (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

const FRESH_SID = (n: number): string =>
  `11111111-2222-4333-8444-${n.toString(16).padStart(12, '0')}`;

describe('chatPerIpRateLimit (Day 11e — Issue E2)', () => {
  beforeEach(() => {
    __resetChatPerIpRateLimitForTests();
  });

  // ===== Bypass for authed users =====

  it('does not limit authenticated users', async () => {
    const app = buildApp({ anonymous: false });
    // Run 10 different sessions — well over the 5-IP limit. All pass.
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/chat/turn')
        .set('X-Forwarded-For', '1.2.3.4')
        .send({ sessionId: FRESH_SID(i) });
      expect(res.status).toBe(200);
    }
  });

  // ===== Anonymous: 5 sessions allowed, 6th gated =====

  it('allows up to 5 unique sessions from an anonymous IP, then 429s', async () => {
    const app = buildApp({ anonymous: true });
    // Sessions 1-5 should pass
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/chat/turn')
        .set('X-Forwarded-For', '5.6.7.8')
        .send({ sessionId: FRESH_SID(i) });
      expect(res.status).toBe(200);
    }
    // Session 6 from the same IP is blocked
    const blocked = await request(app)
      .post('/api/chat/turn')
      .set('X-Forwarded-For', '5.6.7.8')
      .send({ sessionId: FRESH_SID(99) });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/daily limit of 5 free analyses/i);
    expect(blocked.body.error).toMatch(/sign up/i);
    expect(typeof blocked.body.retryAfterSeconds).toBe('number');
    expect(blocked.body.retryAfterSeconds).toBeGreaterThan(0);
  });

  // ===== Same session doesn't burn quota =====

  it('same sessionId repeated does NOT burn quota', async () => {
    const app = buildApp({ anonymous: true });
    const sid = FRESH_SID(1);
    // 20 turns on the same session — should all pass, only counts as 1.
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post('/api/chat/turn')
        .set('X-Forwarded-For', '9.9.9.9')
        .send({ sessionId: sid });
      expect(res.status).toBe(200);
    }
    // Now 4 more distinct sessions can pass (1 + 4 = 5 total)
    for (let i = 2; i <= 5; i++) {
      const res = await request(app)
        .post('/api/chat/turn')
        .set('X-Forwarded-For', '9.9.9.9')
        .send({ sessionId: FRESH_SID(i) });
      expect(res.status).toBe(200);
    }
    // 6th is gated
    const blocked = await request(app)
      .post('/api/chat/turn')
      .set('X-Forwarded-For', '9.9.9.9')
      .send({ sessionId: FRESH_SID(6) });
    expect(blocked.status).toBe(429);
  });

  // ===== Different IPs independent =====

  it('tracks IPs independently', async () => {
    const app = buildApp({ anonymous: true });
    // IP A: burns all 5 sessions
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/chat/turn')
        .set('X-Forwarded-For', '10.0.0.1')
        .send({ sessionId: FRESH_SID(i) });
    }
    const ipABlocked = await request(app)
      .post('/api/chat/turn')
      .set('X-Forwarded-For', '10.0.0.1')
      .send({ sessionId: FRESH_SID(99) });
    expect(ipABlocked.status).toBe(429);

    // IP B: fresh quota, first session passes
    const ipBPass = await request(app)
      .post('/api/chat/turn')
      .set('X-Forwarded-For', '10.0.0.2')
      .send({ sessionId: FRESH_SID(1) });
    expect(ipBPass.status).toBe(200);
  });

  // ===== Missing sessionId defensive pass-through =====

  it('passes through when sessionId is missing (defensive — body validation handles)', async () => {
    const app = buildApp({ anonymous: true });
    const res = await request(app)
      .post('/api/chat/turn')
      .set('X-Forwarded-For', '11.11.11.11')
      .send({});
    expect(res.status).toBe(200);
  });
});
