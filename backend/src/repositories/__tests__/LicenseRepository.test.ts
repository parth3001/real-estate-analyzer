/**
 * LicenseRepository — acceptance tests for the DealLicense + DealCredit
 * substrate that Phase B cost caps and Stripe wiring both depend on.
 *
 * Covers:
 *   - Purchase a license (paid + first-free flows)
 *   - Stripe idempotency: same paymentIntent → same license
 *   - Unique-active-license invariant (same property, same user)
 *   - Status transitions: active → expired, → refunded
 *   - Credit issuance (5-pack + 10-pack + single + promo)
 *   - Credit redemption: race-safe atomic mark
 *   - High-level redeemCreditForProperty (two-write flow)
 *   - findActiveForProperty (the chat-turn hot read)
 *   - findRedeemableCredits FIFO ordering
 *
 * In-memory mongo via mongodb-memory-server keeps the test fast and
 * lets the unique-partial-index assertion actually exercise the index.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { LicenseRepository } from '../LicenseRepository';
import { DealLicenseModel } from '../../models/license/DealLicense';
import { DealCreditModel } from '../../models/license/DealCredit';

const SETUP_TIMEOUT_MS = 90_000;

describe('LicenseRepository (Issue #105 substrate)', () => {
  let mongoServer: MongoMemoryServer;
  let repo: LicenseRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    repo = new LicenseRepository();
    // Ensure indices are built (in-memory mongo doesn't auto-build on
    // model registration in some versions) — without this the
    // unique-partial-index assertion is flaky.
    await DealLicenseModel.syncIndexes();
    await DealCreditModel.syncIndexes();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    await DealLicenseModel.syncIndexes();
    await DealCreditModel.syncIndexes();
  });

  const sampleAddress = {
    street: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
  };

  // ===== Licenses — purchase =====

  it('purchases a paid license and persists Stripe correlation', async () => {
    const userId = new Types.ObjectId();
    const id = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_test_1',
    });
    const doc = await DealLicenseModel.findById(id).lean();
    expect(doc?.status).toBe('active');
    expect(doc?.pricePaidCents).toBe(499);
    expect(doc?.stripePaymentIntentId).toBe('pi_test_1');
    expect(doc?.costBudgetCentsStart).toBe(200); // default
    // expiresAt ≈ purchasedAt + 30d
    const delta =
      (doc!.expiresAt as Date).getTime() -
      (doc!.purchasedAt as Date).getTime();
    expect(delta).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -3);
  });

  it('purchases a first-free license (no payment intent, $0)', async () => {
    const userId = new Types.ObjectId();
    const id = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 0,
    });
    const doc = await DealLicenseModel.findById(id).lean();
    expect(doc?.pricePaidCents).toBe(0);
    expect(doc?.stripePaymentIntentId).toBeUndefined();
  });

  it('is idempotent on stripePaymentIntentId (returns existing license)', async () => {
    const userId = new Types.ObjectId();
    const id1 = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_idempo',
    });
    const id2 = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_idempo',
    });
    expect(id1.toString()).toBe(id2.toString());
    const count = await DealLicenseModel.countDocuments({});
    expect(count).toBe(1);
  });

  it('refuses a duplicate ACTIVE license for the same property+user', async () => {
    const userId = new Types.ObjectId();
    await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_a',
    });
    // Different payment intent, same user+property → unique partial index
    // on (userId, canonicalKey) with status='active' filter fires.
    await expect(
      repo.purchaseLicense({
        userId,
        propertyAddress: sampleAddress,
        pricePaidCents: 499,
        stripePaymentIntentId: 'pi_b',
      })
    ).rejects.toThrow();
  });

  it('allows a NEW active license after the previous one expired', async () => {
    const userId = new Types.ObjectId();
    const firstId = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_old',
    });
    await repo.markLicenseExpired(firstId);
    const secondId = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_new',
    });
    expect(secondId.toString()).not.toBe(firstId.toString());
  });

  // ===== Licenses — reads + transitions =====

  it('findActiveForProperty returns the active license (chat hot path)', async () => {
    const userId = new Types.ObjectId();
    const id = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_hot',
    });
    // Slightly different address form must still resolve via canonical key
    const found = await repo.findActiveForProperty(userId, {
      street: '123 main street',
      city: 'austin',
      state: 'tx',
      zipCode: '78701-1234',
    });
    expect(found?._id.toString()).toBe(id.toString());
  });

  it('findActiveForProperty returns null after expiry', async () => {
    const userId = new Types.ObjectId();
    const id = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_exp',
    });
    await repo.markLicenseExpired(id);
    const found = await repo.findActiveForProperty(userId, sampleAddress);
    expect(found).toBeNull();
  });

  it('markLicenseExpired is a no-op on a non-active license', async () => {
    const userId = new Types.ObjectId();
    const id = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_nop',
    });
    await repo.markLicenseExpired(id);
    const flipped = await repo.markLicenseExpired(id);
    expect(flipped).toBe(false);
  });

  it('markLicenseRefunded transitions from any non-refunded status', async () => {
    const userId = new Types.ObjectId();
    const id = await repo.purchaseLicense({
      userId,
      propertyAddress: sampleAddress,
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_ref',
    });
    await repo.markLicenseExpired(id);
    // Already expired — refund should still flip status
    const flipped = await repo.markLicenseRefunded(id);
    expect(flipped).toBe(true);
    const doc = await DealLicenseModel.findById(id).lean();
    expect(doc?.status).toBe('refunded');
    expect(doc?.refundedAt).toBeInstanceOf(Date);
  });

  // ===== Credits — issuance =====

  it('issues 5 credits for a 5-pack with the same bundlePurchaseId', async () => {
    const userId = new Types.ObjectId();
    const ids = await repo.issueCredits({
      userId,
      sourceType: 'bundle_5',
      pricePaidCents: 400, // 1999 / 5 ≈ 400 effective
      stripePaymentIntentId: 'pi_bundle_5',
    });
    expect(ids).toHaveLength(5);
    const docs = await DealCreditModel.find({ _id: { $in: ids } }).lean();
    const bundleIds = new Set(docs.map((d) => d.bundlePurchaseId));
    expect(bundleIds.size).toBe(1);
  });

  it('issues 10 credits for a 10-pack', async () => {
    const ids = await repo.issueCredits({
      userId: new Types.ObjectId(),
      sourceType: 'bundle_10',
      pricePaidCents: 350,
      stripePaymentIntentId: 'pi_bundle_10',
    });
    expect(ids).toHaveLength(10);
  });

  it('issues 1 credit for sourceType=single', async () => {
    const ids = await repo.issueCredits({
      userId: new Types.ObjectId(),
      sourceType: 'single',
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_single',
    });
    expect(ids).toHaveLength(1);
  });

  // ===== Credits — redemption =====

  it('redeems a credit for a property, creating a linked license', async () => {
    const userId = new Types.ObjectId();
    const [creditId] = await repo.issueCredits({
      userId,
      sourceType: 'single',
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_rd_1',
    });
    const { licenseId } = await repo.redeemCreditForProperty({
      userId,
      creditId,
      propertyAddress: sampleAddress,
    });
    const credit = await DealCreditModel.findById(creditId).lean();
    expect(credit?.status).toBe('redeemed');
    expect(credit?.redeemedAsLicenseId?.toString()).toBe(licenseId.toString());
    const license = await DealLicenseModel.findById(licenseId).lean();
    expect(license?.redeemedFromCreditId?.toString()).toBe(creditId.toString());
  });

  it('refuses to redeem an already-redeemed credit', async () => {
    const userId = new Types.ObjectId();
    const [creditId] = await repo.issueCredits({
      userId,
      sourceType: 'single',
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_rd_2',
    });
    await repo.redeemCreditForProperty({
      userId,
      creditId,
      propertyAddress: sampleAddress,
    });
    await expect(
      repo.redeemCreditForProperty({
        userId,
        creditId,
        propertyAddress: {
          ...sampleAddress,
          street: '999 Another St',
        },
      })
    ).rejects.toThrow(/not redeemable/);
  });

  it('findRedeemableCredits returns issued credits in FIFO order', async () => {
    const userId = new Types.ObjectId();
    // Issue 3 credits in two separate purchases at different times.
    await repo.issueCredits({
      userId,
      sourceType: 'single',
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_fifo_1',
    });
    // Sleep a tick so issuedAt timestamps differ
    await new Promise((r) => setTimeout(r, 10));
    await repo.issueCredits({
      userId,
      sourceType: 'bundle_5',
      pricePaidCents: 400,
      stripePaymentIntentId: 'pi_fifo_2',
    });
    const credits = await repo.findRedeemableCredits(userId);
    expect(credits.length).toBe(6);
    for (let i = 1; i < credits.length; i++) {
      expect(credits[i].issuedAt.getTime()).toBeGreaterThanOrEqual(
        credits[i - 1].issuedAt.getTime()
      );
    }
  });

  it('countRedeemableCredits matches the find count', async () => {
    const userId = new Types.ObjectId();
    await repo.issueCredits({
      userId,
      sourceType: 'bundle_10',
      pricePaidCents: 350,
      stripePaymentIntentId: 'pi_cnt',
    });
    const count = await repo.countRedeemableCredits(userId);
    expect(count).toBe(10);
  });

  it('expired credits are excluded from findRedeemableCredits', async () => {
    const userId = new Types.ObjectId();
    const [creditId] = await repo.issueCredits({
      userId,
      sourceType: 'single',
      pricePaidCents: 499,
      stripePaymentIntentId: 'pi_expcred',
    });
    await repo.markCreditExpired(creditId);
    const credits = await repo.findRedeemableCredits(userId);
    expect(credits).toHaveLength(0);
  });
});
