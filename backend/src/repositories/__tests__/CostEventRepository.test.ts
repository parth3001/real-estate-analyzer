/**
 * W9-S1 acceptance test — CostEventRepository write API.
 *
 * Same shape as the substrate EventsRepository test: Zod-gated writes,
 * single sanctioned write path, returns ObjectId on success.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CostEventRepository } from '../CostEventRepository';

const SETUP_TIMEOUT_MS = 90_000;

describe('CostEventRepository (W9-S1)', () => {
  let mongoServer: MongoMemoryServer;
  let repo: CostEventRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    repo = new CostEventRepository();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  // ===== Happy path =====

  it('writes an LLM CostEvent and returns its _id', async () => {
    const id = await repo.writeCostEvent({
      traceId: 'trace-1',
      userId: new Types.ObjectId(),
      costType: 'llm',
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
      inputTokens: 1500,
      outputTokens: 300,
      cachedTokens: 1000,
      costCents: 0.165,
    });
    expect(id).toBeInstanceOf(Types.ObjectId);
  });

  it('persists fields to cost_events collection', async () => {
    const userId = new Types.ObjectId();
    await repo.writeCostEvent({
      traceId: 'persist-trace',
      userId,
      costType: 'llm',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      inputTokens: 6000,
      outputTokens: 200,
      cachedTokens: 5000,
      costCents: 0.75,
    });
    const docs = await mongoose.connection.db
      .collection('cost_events')
      .find({})
      .toArray();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      traceId: 'persist-trace',
      costType: 'llm',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      inputTokens: 6000,
      outputTokens: 200,
      cachedTokens: 5000,
      costCents: 0.75,
    });
    expect((docs[0] as unknown as { userId: Types.ObjectId }).userId.toString()).toBe(
      userId.toString()
    );
  });

  it('accepts an external_api cost event without token fields', async () => {
    const id = await repo.writeCostEvent({
      traceId: 'rentcast-trace',
      userId: new Types.ObjectId(),
      costType: 'external_api',
      provider: 'rentcast',
      costCents: 0,
    });
    expect(id).toBeInstanceOf(Types.ObjectId);

    const docs = await mongoose.connection.db
      .collection('cost_events')
      .find({})
      .toArray();
    expect(docs[0].inputTokens).toBeUndefined();
    expect(docs[0].outputTokens).toBeUndefined();
  });

  it('captures capHit when provided', async () => {
    await repo.writeCostEvent({
      traceId: 'cap-trace',
      userId: new Types.ObjectId(),
      costType: 'llm',
      provider: 'anthropic',
      model: 'claude-opus-4-7',
      inputTokens: 3000,
      outputTokens: 600,
      costCents: 9,
      capHit: true,
    });
    const docs = await mongoose.connection.db
      .collection('cost_events')
      .find({ capHit: true })
      .toArray();
    expect(docs).toHaveLength(1);
  });

  // ===== Append-only API surface =====

  it('does not expose update or delete methods (API-level check)', () => {
    const proto = Object.getPrototypeOf(repo);
    const methods = Object.getOwnPropertyNames(proto).filter(
      (n) => typeof (repo as unknown as Record<string, unknown>)[n] === 'function'
    );
    expect(methods).toContain('writeCostEvent');
    expect(methods).not.toContain('updateCostEvent');
    expect(methods).not.toContain('deleteCostEvent');
    expect(methods).not.toContain('bulkWrite');
  });

  // ===== Trust boundary =====

  it('rejects invalid payload (negative costCents)', async () => {
    await expect(
      repo.writeCostEvent({
        traceId: 'bad-trace',
        userId: new Types.ObjectId(),
        costType: 'llm',
        provider: 'anthropic',
        costCents: -1,
      })
    ).rejects.toThrow();
  });

  it('rejects unknown costType', async () => {
    await expect(
      repo.writeCostEvent({
        traceId: 'bad',
        userId: new Types.ObjectId(),
        costType: 'compute' as unknown as 'llm',
        provider: 'anthropic',
        costCents: 1,
      })
    ).rejects.toThrow();
  });

  // ===== Cross-cutting: shares traceId with substrate =====

  it('multiple cost events sharing a traceId can be joined later', async () => {
    const userId = new Types.ObjectId();
    const traceId = 'multi-call-trace';

    // Simulate a multi-step turn: classifier + scoring agent first call + final call
    await repo.writeCostEvent({
      traceId,
      userId,
      costType: 'llm',
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
      inputTokens: 1500,
      outputTokens: 40,
      cachedTokens: 1200,
      costCents: 0.043,
    });
    await repo.writeCostEvent({
      traceId,
      userId,
      costType: 'llm',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      inputTokens: 6000,
      outputTokens: 200,
      cachedTokens: 5000,
      costCents: 0.75,
    });
    await repo.writeCostEvent({
      traceId,
      userId,
      costType: 'llm',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      inputTokens: 6300,
      outputTokens: 500,
      cachedTokens: 5500,
      costCents: 1.0,
    });

    const docs = await mongoose.connection.db
      .collection('cost_events')
      .find({ traceId })
      .toArray();
    expect(docs).toHaveLength(3);

    // Aggregate spend for this turn — what the dashboard would compute
    const total = docs.reduce(
      (sum, d) => sum + (d as unknown as { costCents: number }).costCents,
      0
    );
    expect(total).toBeCloseTo(0.043 + 0.75 + 1.0, 6);
  });
});
