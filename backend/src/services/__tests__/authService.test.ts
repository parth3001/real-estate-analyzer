/**
 * authService unit tests — Task #38 (2026-06-13).
 *
 * Focus: the first_free credit-issuance wiring that the Phase 0 audit
 * surfaced as broken. Pricing page promises "First full analysis free
 * on signup" but pre-Task-#38 nothing in authService.register() issued
 * the credit. These tests pin the behavior so future refactors don't
 * silently break the free-tier promise.
 *
 * Backed by mongodb-memory-server so the credit insertion runs against
 * real collections (User + DealCredit). Same pattern as
 * chatSessionMergeService.test.ts.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { authService } from '../authService';
import { User } from '../../models/User';
import { DealCreditModel } from '../../models/license/DealCredit';
import { licenseRepository } from '../../repositories/LicenseRepository';

const SETUP_TIMEOUT_MS = 90_000;

// JWT_SECRET is required by generateTokens; set a stable value before
// authService is exercised. Module-load happens before each test.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-task-38';

describe('authService.register — Task #38 first_free credit wiring', () => {
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

  // ===== Happy path =====

  describe('on successful registration', () => {
    it('issues exactly one first_free credit for the new user', async () => {
      const result = await authService.register({
        email: 'first-free-test@example.com',
        password: 'TestPassword123!',
        firstName: 'First',
        lastName: 'Free',
      });

      const credits = await DealCreditModel.find({
        userId: result.user.id,
      }).lean();

      expect(credits).toHaveLength(1);
      expect(credits[0].sourceType).toBe('first_free');
      expect(credits[0].pricePaidCents).toBe(0);
      expect(credits[0].status).toBe('issued');
      expect(credits[0].stripePaymentIntentId).toBeUndefined();
    });

    it('the credit is redeemable via the standard credit-redemption path', async () => {
      // Regression: the credit must be findable by the same query that
      // the runtime uses to gate the paywall. If this fails, the credit
      // exists but the chat agent can't see it — promise still broken.
      const result = await authService.register({
        email: 'redeemable-test@example.com',
        password: 'TestPassword123!',
        firstName: 'Redeemable',
        lastName: 'Test',
      });

      const redeemable = await licenseRepository.findRedeemableCredits(
        new mongoose.Types.ObjectId(result.user.id)
      );

      expect(redeemable).toHaveLength(1);
      expect(redeemable[0].sourceType).toBe('first_free');
    });

    it('credit has a future expiry (the user can actually use it)', async () => {
      const before = Date.now();
      const result = await authService.register({
        email: 'expiry-test@example.com',
        password: 'TestPassword123!',
        firstName: 'Expiry',
        lastName: 'Test',
      });

      const credit = await DealCreditModel.findOne({
        userId: result.user.id,
      }).lean();

      expect(credit).not.toBeNull();
      expect(credit!.expiresAt.getTime()).toBeGreaterThan(before);
      // Default 365 days — give it a generous lower bound for clock skew.
      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(credit!.expiresAt.getTime()).toBeGreaterThan(before + 30 * oneDayMs);
    });
  });

  // ===== Resilience =====

  describe('on credit-issuance failure', () => {
    it('registration still succeeds (account creation is the priority)', async () => {
      // Stub issueCredits to simulate a DB error AFTER user was saved.
      // Behavior contract: the user still gets created and gets back
      // valid tokens. The credit can be granted later via ops.
      const originalIssueCredits = licenseRepository.issueCredits.bind(
        licenseRepository
      );
      jest
        .spyOn(licenseRepository, 'issueCredits')
        .mockRejectedValueOnce(new Error('Simulated DB failure'));

      const result = await authService.register({
        email: 'resilience-test@example.com',
        password: 'TestPassword123!',
        firstName: 'Resilience',
        lastName: 'Test',
      });

      // Account was created (this is what matters):
      expect(result.accessToken).toBeTruthy();
      expect(result.user.email).toBe('resilience-test@example.com');

      const userInDb = await User.findOne({
        email: 'resilience-test@example.com',
      });
      expect(userInDb).not.toBeNull();

      // No credit was issued (because the stub rejected):
      const credits = await DealCreditModel.find({
        userId: result.user.id,
      }).lean();
      expect(credits).toHaveLength(0);

      // Restore for next test
      jest.spyOn(licenseRepository, 'issueCredits').mockImplementation(originalIssueCredits);
    });
  });

  // ===== Idempotency-ish =====

  describe('on duplicate registration attempt', () => {
    it('does NOT issue a second credit when registration is rejected', async () => {
      // First registration succeeds + issues a credit.
      const first = await authService.register({
        email: 'duplicate-test@example.com',
        password: 'TestPassword123!',
        firstName: 'Duplicate',
        lastName: 'Test',
      });

      // Second registration with the same email throws (existing user)
      await expect(
        authService.register({
          email: 'duplicate-test@example.com',
          password: 'OtherPassword456!',
          firstName: 'Duplicate',
          lastName: 'Two',
        })
      ).rejects.toThrow(/already exists/i);

      // The duplicate attempt should NOT have issued another credit for
      // the original user — and there's no second user to issue to.
      const credits = await DealCreditModel.find({
        userId: first.user.id,
      }).lean();
      expect(credits).toHaveLength(1);
    });
  });
});
