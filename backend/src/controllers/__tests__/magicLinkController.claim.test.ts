/**
 * magicLinkController — W6-S5b acceptance tests for the
 * pendingChatSessionId binding (server-side ghost-user claim).
 *
 * Scoped to the NEW W6-S5b behavior:
 *   - requestMagicLink stores pendingChatSessionId on the token row
 *   - requestMagicLink validates pendingChatSessionId as a UUID
 *   - verifyMagicLink: token has sessionId → calls mergeAnonymousSessionIntoUser
 *     + includes `claimedChat` in the response
 *   - verifyMagicLink: token has NO sessionId → no claimedChat in response
 *   - verifyMagicLink: merge throws → user still authenticated (non-fatal)
 *
 * Not in scope: pre-existing flows (basic happy-path login, expired
 * tokens, used tokens, rate limits). Those are covered live in
 * production and re-asserting them here would just be wide-net
 * regression catching that the broader auth suite owns.
 *
 * mongodb-memory-server backs this so token + user mutations land in
 * a real Mongo and the verifyMagicLink controller's findOneAndUpdate
 * atomic-consume hook behaves the same as production.
 */

// JWT_SECRET must be present BEFORE authService loads — it's read at
// module-construction time. This assignment runs before the imports
// below thanks to ESM/CommonJS evaluation order: const declarations
// at the top of the file evaluate before subsequent import resolution
// when the imports come AFTER. In practice we set it directly here so
// supertest + authService.generateTokens succeed inside the test app.
process.env.JWT_SECRET ??= 'test-jwt-secret-w6-s5b-magic-link-claim-flow';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-w6-s5b';

import express from 'express';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const SETUP_TIMEOUT_MS = 90_000;

// Mock the merge service so we don't need a full ghost-user setup.
const mockMerge = jest.fn();
jest.mock('../../services/chatSessionMergeService', () => ({
  mergeAnonymousSessionIntoUser: (sid: string, uid: Types.ObjectId): unknown =>
    mockMerge(sid, uid),
}));

// Mock the email send so request side-effects are visible without SMTP.
jest.mock('../../services/emailService', () => ({
  emailService: {
    sendMagicLinkEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

// Pin the feature flag ON for the duration of these tests. The
// controller checks `getFeatureFlag()` first; failing that gives 503.
jest.mock('../../utils/magicLinkToken', () => {
  const actual = jest.requireActual('../../utils/magicLinkToken');
  return {
    ...actual,
    getFeatureFlag: () => true,
    MAGIC_LINK_EXPIRY_MS: 15 * 60 * 1000,
  };
});

// eslint-disable-next-line import/first
import {
  requestMagicLink,
  verifyMagicLink,
  validateMagicLinkRequest,
  validateMagicLinkVerify,
} from '../magicLinkController';
// eslint-disable-next-line import/first
import { MagicLinkToken } from '../../models/MagicLinkToken';
// eslint-disable-next-line import/first
import { User } from '../../models/User';
// eslint-disable-next-line import/first
import {
  generateMagicLinkToken as realGenerateToken,
  hashMagicLinkToken,
} from '../../utils/magicLinkToken';

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.post('/api/auth/magic-link', validateMagicLinkRequest, requestMagicLink);
  app.post('/api/auth/magic-link/verify', validateMagicLinkVerify, verifyMagicLink);
  return app;
}

const VALID_SESSION_ID = '11111111-2222-4333-8444-555555555555';

describe('magicLinkController — pendingChatSessionId (W6-S5b)', () => {
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
    await mongoose.connection.dropDatabase();
    mockMerge.mockReset();
  });

  describe('requestMagicLink stores pendingChatSessionId on the token row', () => {
    it('persists the UUID when provided', async () => {
      const res = await request(buildApp())
        .post('/api/auth/magic-link')
        .send({ email: 'user@example.com', pendingChatSessionId: VALID_SESSION_ID });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });

      const token = await MagicLinkToken.findOne({
        emailNormalized: 'user@example.com',
      }).lean();
      expect(token).not.toBeNull();
      expect(token?.pendingChatSessionId).toBe(VALID_SESSION_ID);
    });

    it('stores null when no pendingChatSessionId is provided', async () => {
      const res = await request(buildApp())
        .post('/api/auth/magic-link')
        .send({ email: 'user@example.com' });
      expect(res.status).toBe(200);

      const token = await MagicLinkToken.findOne({
        emailNormalized: 'user@example.com',
      }).lean();
      expect(token?.pendingChatSessionId).toBeNull();
    });

    it('rejects non-UUID pendingChatSessionId with 400', async () => {
      const res = await request(buildApp())
        .post('/api/auth/magic-link')
        .send({ email: 'user@example.com', pendingChatSessionId: 'not-a-uuid' });
      expect(res.status).toBe(400);
      // Token should NOT be created
      const tokenCount = await MagicLinkToken.countDocuments({});
      expect(tokenCount).toBe(0);
    });
  });

  describe('verifyMagicLink fires merge + returns claimedChat', () => {
    it('calls mergeAnonymousSessionIntoUser with the bound sessionId, returns claimedChat', async () => {
      // 1. Request the link (stores token + sessionId binding)
      const requestRes = await request(buildApp())
        .post('/api/auth/magic-link')
        .send({ email: 'newbie@example.com', pendingChatSessionId: VALID_SESSION_ID });
      expect(requestRes.status).toBe(200);

      // We need the raw token to verify. The controller doesn't return
      // it (security — only the email carries it). For the test, we
      // generate one and seed it directly.
      const { raw, hash } = realGenerateToken();
      await MagicLinkToken.deleteMany({});
      await MagicLinkToken.create({
        emailNormalized: 'newbie@example.com',
        tokenHash: hash,
        purpose: 'login',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        requestIp: '127.0.0.1',
        requestUserAgent: 'jest',
        pendingChatSessionId: VALID_SESSION_ID,
      });

      mockMerge.mockResolvedValueOnce({
        merged: true,
        eventsMerged: 7,
        costEventsMerged: 4,
        ghostUserId: new Types.ObjectId().toHexString(),
      });

      // 2. Verify
      const verifyRes = await request(buildApp())
        .post('/api/auth/magic-link/verify')
        .send({ token: raw });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.ok).toBe(true);
      expect(verifyRes.body.accessToken).toBeTruthy();
      expect(verifyRes.body.user).toBeTruthy();

      // Merge service was called with the bound sessionId + the
      // newly-created user's _id
      expect(mockMerge).toHaveBeenCalledTimes(1);
      const [calledSessionId, calledUserId] = mockMerge.mock.calls[0] as [
        string,
        Types.ObjectId,
      ];
      expect(calledSessionId).toBe(VALID_SESSION_ID);
      expect(calledUserId).toBeInstanceOf(Types.ObjectId);

      // Response carries claimedChat with returnTo
      expect(verifyRes.body.claimedChat).toEqual({
        merged: true,
        eventsMerged: 7,
        returnTo: '/app',
      });
    });

    it('omits claimedChat when token has NO pendingChatSessionId', async () => {
      const { raw, hash } = realGenerateToken();
      await MagicLinkToken.create({
        emailNormalized: 'plain@example.com',
        tokenHash: hash,
        purpose: 'login',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        requestIp: '127.0.0.1',
        requestUserAgent: 'jest',
        // pendingChatSessionId intentionally absent
      });

      const verifyRes = await request(buildApp())
        .post('/api/auth/magic-link/verify')
        .send({ token: raw });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.ok).toBe(true);
      expect(mockMerge).not.toHaveBeenCalled();
      expect(verifyRes.body.claimedChat).toBeUndefined();
    });

    it('keeps the user authenticated even if the merge service throws', async () => {
      const { raw, hash } = realGenerateToken();
      await MagicLinkToken.create({
        emailNormalized: 'unlucky@example.com',
        tokenHash: hash,
        purpose: 'login',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        requestIp: '127.0.0.1',
        requestUserAgent: 'jest',
        pendingChatSessionId: VALID_SESSION_ID,
      });

      mockMerge.mockRejectedValueOnce(new Error('Sensitive: db unreachable'));

      const verifyRes = await request(buildApp())
        .post('/api/auth/magic-link/verify')
        .send({ token: raw });

      // Login succeeded despite merge failure
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.ok).toBe(true);
      expect(verifyRes.body.accessToken).toBeTruthy();
      // claimedChat is omitted on merge failure
      expect(verifyRes.body.claimedChat).toBeUndefined();
      // Error detail must not leak
      expect(JSON.stringify(verifyRes.body)).not.toContain('Sensitive');
      expect(JSON.stringify(verifyRes.body)).not.toContain('db unreachable');
    });

    it('marks the token used even when merge runs', async () => {
      const { raw, hash } = realGenerateToken();
      await MagicLinkToken.create({
        emailNormalized: 'consumed@example.com',
        tokenHash: hash,
        purpose: 'login',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        requestIp: '127.0.0.1',
        requestUserAgent: 'jest',
        pendingChatSessionId: VALID_SESSION_ID,
      });
      mockMerge.mockResolvedValueOnce({
        merged: true,
        eventsMerged: 2,
        costEventsMerged: 0,
        ghostUserId: 'abc',
      });

      await request(buildApp())
        .post('/api/auth/magic-link/verify')
        .send({ token: raw });

      const stored = await MagicLinkToken.findOne({ tokenHash: hash }).lean();
      expect(stored?.usedAt).not.toBeNull();

      // Replay the same token — should fail as 'used'
      const replay = await request(buildApp())
        .post('/api/auth/magic-link/verify')
        .send({ token: raw });
      expect(replay.status).toBe(410);
      expect(replay.body).toMatchObject({ ok: false, reason: 'used' });
      // Merge should NOT run twice
      expect(mockMerge).toHaveBeenCalledTimes(1);
    });
  });

  describe('user is created with verified state', () => {
    it('first-time user with chat claim gets isVerified=true + emailVerifiedAt set', async () => {
      const { raw, hash } = realGenerateToken();
      await MagicLinkToken.create({
        emailNormalized: 'firsttime@example.com',
        tokenHash: hash,
        purpose: 'login',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        requestIp: '127.0.0.1',
        requestUserAgent: 'jest',
        pendingChatSessionId: VALID_SESSION_ID,
      });
      mockMerge.mockResolvedValueOnce({
        merged: true,
        eventsMerged: 1,
        costEventsMerged: 0,
        ghostUserId: 'x',
      });

      await request(buildApp())
        .post('/api/auth/magic-link/verify')
        .send({ token: raw });

      const created = await User.findOne({ email: 'firsttime@example.com' }).lean();
      expect(created).not.toBeNull();
      expect(created?.isVerified).toBe(true);
      expect(created?.emailVerifiedAt).toBeInstanceOf(Date);
    });
  });
});

// Silence the unused-import warning — these are imported only for
// types/module-load-order verification.
void hashMagicLinkToken;
