/**
 * costGuards — Phase A acceptance tests (Issue #106).
 *
 * Covers the two ceilings the orchestrator enforces before every turn:
 *   - per-session cap (default $1.00 = 100¢)
 *   - global daily cap (default $20.00 = 2000¢)
 *
 * The repository write path is exercised end-to-end against an
 * in-memory mongo (mongodb-memory-server) so the aggregate queries
 * the guard issues run against real indices on a real collection.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  assertWithinCaps,
  CostCapExceededError,
  getSessionSpendCents,
  getLicenseSpendCents,
  getDailySpendCents,
  getCostSnapshot,
  SESSION_CAP_CENTS,
  LICENSE_CAP_CENTS,
  DAILY_CAP_CENTS,
} from '../costGuards';
import { CostEventModel } from '../../../models/cost/CostEvent';

const SETUP_TIMEOUT_MS = 90_000;

async function seedCostEvent(opts: {
  sessionId?: string;
  licenseId?: Types.ObjectId;
  costCents: number;
  /** Override timestamp for daily-cap-window tests. */
  timestamp?: Date;
}): Promise<void> {
  await CostEventModel.create({
    traceId: `trace-${Math.random().toString(36).slice(2)}`,
    sessionId: opts.sessionId,
    licenseId: opts.licenseId,
    userId: new Types.ObjectId(),
    costType: 'llm',
    provider: 'anthropic',
    model: 'claude-haiku-4-5',
    inputTokens: 100,
    outputTokens: 50,
    cachedTokens: 0,
    costCents: opts.costCents,
    ...(opts.timestamp ? { timestamp: opts.timestamp } : {}),
  });
}

describe('costGuards (Issue #106 Phase A)', () => {
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

  // ===== Defaults =====

  it('exposes the configured caps as constants', () => {
    // Sanity: the issue tracker spec said $1.00 session, $2.00
    // license, $20.00 daily. These are env-overridable but the
    // defaults must match the spec.
    expect(SESSION_CAP_CENTS).toBe(100);
    expect(LICENSE_CAP_CENTS).toBe(200);
    expect(DAILY_CAP_CENTS).toBe(2000);
  });

  // ===== Aggregate queries =====

  it('sums session spend across multiple events with the same sessionId', async () => {
    await seedCostEvent({ sessionId: 'sess-A', costCents: 12.5 });
    await seedCostEvent({ sessionId: 'sess-A', costCents: 7.25 });
    await seedCostEvent({ sessionId: 'sess-B', costCents: 99 }); // different session — must be excluded
    const spend = await getSessionSpendCents('sess-A');
    // Use approx because mongoose stores doubles
    expect(spend).toBeCloseTo(19.75, 5);
  });

  it('returns 0 for an unseen session', async () => {
    expect(await getSessionSpendCents('nope')).toBe(0);
  });

  it('sums daily spend across all sessions for the current UTC day', async () => {
    await seedCostEvent({ sessionId: 'sess-A', costCents: 50 });
    await seedCostEvent({ sessionId: 'sess-B', costCents: 60 });
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(12, 0, 0, 0);
    await seedCostEvent({ sessionId: 'sess-C', costCents: 999, timestamp: yesterday });
    const spend = await getDailySpendCents();
    expect(spend).toBeCloseTo(110, 5);
  });

  // ===== assertWithinCaps =====

  it('passes silently when both caps are unhit', async () => {
    await seedCostEvent({ sessionId: 'sess-A', costCents: 10 });
    await expect(
      assertWithinCaps({
        sessionId: 'sess-A',
        userId: new Types.ObjectId(),
        traceId: 'trace-1',
      })
    ).resolves.not.toThrow();
  });

  it('throws CostCapExceededError with kind="session" when the session cap is hit', async () => {
    // Seed up to the cap. Need ≥ SESSION_CAP_CENTS.
    await seedCostEvent({ sessionId: 'sess-A', costCents: SESSION_CAP_CENTS });
    await expect(
      assertWithinCaps({
        sessionId: 'sess-A',
        userId: new Types.ObjectId(),
      })
    ).rejects.toMatchObject({
      name: 'CostCapExceededError',
      kind: 'session',
    });
  });

  it('surfaces the user-facing copy for session cap hits', async () => {
    await seedCostEvent({ sessionId: 'sess-A', costCents: SESSION_CAP_CENTS + 5 });
    let captured: CostCapExceededError | undefined;
    try {
      await assertWithinCaps({
        sessionId: 'sess-A',
        userId: new Types.ObjectId(),
      });
    } catch (err) {
      captured = err as CostCapExceededError;
    }
    expect(captured).toBeInstanceOf(CostCapExceededError);
    // Copy must NOT leak the dollar figure to the user (Marcus Chen
    // cost-discipline note — internal numbers are an ops detail).
    expect(captured?.userFacingMessage).not.toMatch(/\$/);
    expect(captured?.userFacingMessage).toMatch(/pricing/i);
  });

  it('throws kind="daily" when the daily cap is hit (and session is clean)', async () => {
    // Spread spend across many sessions so no single session hits its
    // cap; daily total still over the daily cap.
    const perSession = SESSION_CAP_CENTS - 1;
    const sessionsNeeded = Math.ceil(DAILY_CAP_CENTS / perSession) + 1;
    for (let i = 0; i < sessionsNeeded; i++) {
      await seedCostEvent({
        sessionId: `bulk-sess-${i}`,
        costCents: perSession,
      });
    }
    await expect(
      assertWithinCaps({
        sessionId: 'fresh-session-with-no-events',
        userId: new Types.ObjectId(),
      })
    ).rejects.toMatchObject({
      name: 'CostCapExceededError',
      kind: 'daily',
    });
  });

  it('checks session cap BEFORE daily cap (cheaper failure path first)', async () => {
    // Both caps hit. Session must be the reported kind because it's
    // checked first.
    await seedCostEvent({ sessionId: 'sess-X', costCents: DAILY_CAP_CENTS + 10 });
    let captured: CostCapExceededError | undefined;
    try {
      await assertWithinCaps({
        sessionId: 'sess-X',
        userId: new Types.ObjectId(),
      });
    } catch (err) {
      captured = err as CostCapExceededError;
    }
    expect(captured?.kind).toBe('session');
  });

  // ===== Snapshot helper =====

  it('getCostSnapshot returns current spend without throwing', async () => {
    await seedCostEvent({ sessionId: 'sess-A', costCents: 25 });
    const snap = await getCostSnapshot('sess-A');
    expect(snap.sessionSpendCents).toBeCloseTo(25, 5);
    expect(snap.dailySpendCents).toBeCloseTo(25, 5);
    expect(snap.sessionCapCents).toBe(SESSION_CAP_CENTS);
    expect(snap.dailyCapCents).toBe(DAILY_CAP_CENTS);
    expect(snap.licenseCapCents).toBe(LICENSE_CAP_CENTS);
    expect(snap.licenseSpendCents).toBeUndefined();
    expect(snap.guardsEnabled).toBe(true);
  });

  // ===== Phase B — per-license cap =====

  it('sums license spend across multiple events with the same licenseId', async () => {
    const licenseA = new Types.ObjectId();
    const licenseB = new Types.ObjectId();
    await seedCostEvent({
      sessionId: 'sess-x',
      licenseId: licenseA,
      costCents: 40,
    });
    await seedCostEvent({
      sessionId: 'sess-x',
      licenseId: licenseA,
      costCents: 35,
    });
    await seedCostEvent({
      sessionId: 'sess-y',
      licenseId: licenseB,
      costCents: 99,
    });
    expect(await getLicenseSpendCents(licenseA)).toBeCloseTo(75, 5);
    expect(await getLicenseSpendCents(licenseB)).toBeCloseTo(99, 5);
  });

  it('accepts a string licenseId (Stripe webhook ergonomics)', async () => {
    const licenseId = new Types.ObjectId();
    await seedCostEvent({
      sessionId: 'sess-x',
      licenseId,
      costCents: 15,
    });
    expect(await getLicenseSpendCents(licenseId.toHexString())).toBeCloseTo(
      15,
      5
    );
  });

  it('throws CostCapExceededError kind="license" when licenseId spend ≥ cap', async () => {
    const licenseId = new Types.ObjectId();
    // Spread across multiple sessions so per-session doesn't fire first.
    await seedCostEvent({
      sessionId: 's1',
      licenseId,
      costCents: LICENSE_CAP_CENTS / 2,
    });
    await seedCostEvent({
      sessionId: 's2',
      licenseId,
      costCents: LICENSE_CAP_CENTS / 2 + 5,
    });
    let captured: CostCapExceededError | undefined;
    try {
      await assertWithinCaps({
        sessionId: 'fresh-session',
        userId: new Types.ObjectId(),
        licenseId,
      });
    } catch (err) {
      captured = err as CostCapExceededError;
    }
    expect(captured?.kind).toBe('license');
    // Message must reference the property scope without leaking dollar figures.
    expect(captured?.userFacingMessage).not.toMatch(/\$/);
    expect(captured?.userFacingMessage).toMatch(/property/i);
  });

  it('skips the license check when no licenseId is supplied (free-tier turn)', async () => {
    // Seed unrelated license spend at the cap — should NOT fire when
    // the caller didn't pass a licenseId.
    const otherLicense = new Types.ObjectId();
    await seedCostEvent({
      sessionId: 's1',
      licenseId: otherLicense,
      costCents: LICENSE_CAP_CENTS + 100,
    });
    await expect(
      assertWithinCaps({
        sessionId: 'fresh-free-tier-session',
        userId: new Types.ObjectId(),
        // no licenseId
      })
    ).resolves.not.toThrow();
  });

  it('reports license-cap kind BEFORE daily when both fire', async () => {
    // Seed enough total spend to trip the daily cap, with the bulk
    // tagged to a single license (so per-license also trips).
    const licenseId = new Types.ObjectId();
    const perSession = SESSION_CAP_CENTS - 1;
    const sessionsNeeded = Math.ceil(DAILY_CAP_CENTS / perSession) + 1;
    for (let i = 0; i < sessionsNeeded; i++) {
      await seedCostEvent({
        sessionId: `bulk-${i}`,
        licenseId, // ALL on the same license → license cap also fires
        costCents: perSession,
      });
    }
    let captured: CostCapExceededError | undefined;
    try {
      await assertWithinCaps({
        sessionId: 'fresh',
        userId: new Types.ObjectId(),
        licenseId,
      });
    } catch (err) {
      captured = err as CostCapExceededError;
    }
    // License check comes before daily in the throw order, so license
    // wins when both are over.
    expect(captured?.kind).toBe('license');
  });

  it('getCostSnapshot includes licenseSpendCents when licenseId provided', async () => {
    const licenseId = new Types.ObjectId();
    await seedCostEvent({
      sessionId: 'sess-snap',
      licenseId,
      costCents: 33,
    });
    const snap = await getCostSnapshot('sess-snap', licenseId);
    expect(snap.licenseSpendCents).toBeCloseTo(33, 5);
  });
});
