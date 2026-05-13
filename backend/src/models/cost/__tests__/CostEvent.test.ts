/**
 * W9-S1 acceptance test — CostEvent Mongoose model + append-only.
 *
 * Verifies the same three-layer discipline as substrate (Zod payload
 * validation, schema-level pre-hooks blocking mutation, strict-mode
 * unknown-field rejection) — applied to the operational cost_events
 * collection.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  CostEventModel,
  CostEventSchema,
  COST_EVENT_APPEND_ONLY_ERROR,
} from '../CostEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('CostEvent (W9-S1)', () => {
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

  // ===== Zod payload validation =====

  describe('CostEventSchema (Zod payload validation)', () => {
    it('accepts a complete LLM cost event', () => {
      expect(() =>
        CostEventSchema.parse({
          traceId: 'trace-1',
          userId: new Types.ObjectId(),
          costType: 'llm',
          provider: 'anthropic',
          model: 'claude-haiku-4-5',
          inputTokens: 1500,
          outputTokens: 300,
          cachedTokens: 1000,
          costCents: 0.165,
        })
      ).not.toThrow();
    });

    it('accepts an external_api cost event without token fields', () => {
      expect(() =>
        CostEventSchema.parse({
          traceId: 'trace-2',
          userId: new Types.ObjectId(),
          costType: 'external_api',
          provider: 'rentcast',
          costCents: 0,
        })
      ).not.toThrow();
    });

    it('rejects unknown costType', () => {
      expect(() =>
        CostEventSchema.parse({
          traceId: 't',
          userId: new Types.ObjectId(),
          costType: 'compute',
          provider: 'anthropic',
          costCents: 1,
        })
      ).toThrow();
    });

    it('rejects unknown provider', () => {
      expect(() =>
        CostEventSchema.parse({
          traceId: 't',
          userId: new Types.ObjectId(),
          costType: 'llm',
          provider: 'gemini',
          costCents: 1,
        })
      ).toThrow();
    });

    it('rejects negative costCents', () => {
      expect(() =>
        CostEventSchema.parse({
          traceId: 't',
          userId: new Types.ObjectId(),
          costType: 'llm',
          provider: 'anthropic',
          costCents: -0.001,
        })
      ).toThrow();
    });

    it('rejects empty traceId', () => {
      expect(() =>
        CostEventSchema.parse({
          traceId: '',
          userId: new Types.ObjectId(),
          costType: 'llm',
          provider: 'anthropic',
          costCents: 1,
        })
      ).toThrow();
    });

    it('rejects negative token counts', () => {
      expect(() =>
        CostEventSchema.parse({
          traceId: 't',
          userId: new Types.ObjectId(),
          costType: 'llm',
          provider: 'anthropic',
          inputTokens: -1,
          outputTokens: 100,
          costCents: 1,
        })
      ).toThrow();
    });
  });

  // ===== Mongoose persistence =====

  describe('CostEventModel persistence', () => {
    it('writes to the cost_events collection (NOT events)', async () => {
      await CostEventModel.create({
        traceId: 'trace-coll',
        userId: new Types.ObjectId(),
        costType: 'llm',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        inputTokens: 6000,
        outputTokens: 200,
        cachedTokens: 5000,
        costCents: 0.75,
      });

      const inCostEvents = await mongoose.connection.db
        .collection('cost_events')
        .find({})
        .toArray();
      expect(inCostEvents).toHaveLength(1);

      // Verify it's NOT in the substrate events collection
      const inEvents = await mongoose.connection.db
        .collection('events')
        .find({})
        .toArray();
      expect(inEvents).toHaveLength(0);
    });

    it('sets timestamp automatically via the Mongoose default', async () => {
      const before = Date.now();
      const doc = await CostEventModel.create({
        traceId: 't',
        userId: new Types.ObjectId(),
        costType: 'llm',
        provider: 'anthropic',
        costCents: 1,
      });
      const after = Date.now();
      const ts = doc.get('timestamp') as Date;
      expect(ts).toBeInstanceOf(Date);
      expect(ts.getTime()).toBeGreaterThanOrEqual(before);
      expect(ts.getTime()).toBeLessThanOrEqual(after);
    });

    it('rejects unknown top-level fields (strict mode)', async () => {
      await expect(
        CostEventModel.create({
          traceId: 't',
          userId: new Types.ObjectId(),
          costType: 'llm',
          provider: 'anthropic',
          costCents: 1,
          // Unknown field — should throw
          mysteriousField: 'oops',
        } as Parameters<typeof CostEventModel.create>[0])
      ).rejects.toThrow();
    });
  });

  // ===== Append-only enforcement =====

  describe('append-only enforcement at the schema layer', () => {
    async function seedOne(): Promise<Types.ObjectId> {
      const doc = await CostEventModel.create({
        traceId: 't',
        userId: new Types.ObjectId(),
        costType: 'llm',
        provider: 'anthropic',
        costCents: 1,
      });
      return doc._id as Types.ObjectId;
    }

    it('blocks updateOne with the append-only error', async () => {
      const id = await seedOne();
      await expect(
        CostEventModel.updateOne({ _id: id }, { costCents: 2 })
      ).rejects.toThrow(COST_EVENT_APPEND_ONLY_ERROR);
    });

    it('blocks updateMany', async () => {
      await seedOne();
      await expect(
        CostEventModel.updateMany({}, { costCents: 99 })
      ).rejects.toThrow(COST_EVENT_APPEND_ONLY_ERROR);
    });

    it('blocks findOneAndUpdate', async () => {
      const id = await seedOne();
      await expect(
        CostEventModel.findOneAndUpdate({ _id: id }, { costCents: 2 })
      ).rejects.toThrow(COST_EVENT_APPEND_ONLY_ERROR);
    });

    it('blocks deleteOne', async () => {
      const id = await seedOne();
      await expect(
        CostEventModel.deleteOne({ _id: id })
      ).rejects.toThrow(COST_EVENT_APPEND_ONLY_ERROR);
    });

    it('blocks deleteMany', async () => {
      await seedOne();
      await expect(CostEventModel.deleteMany({})).rejects.toThrow(
        COST_EVENT_APPEND_ONLY_ERROR
      );
    });

    it('blocks doc.save() on an existing document', async () => {
      const id = await seedOne();
      const doc = await CostEventModel.findById(id);
      doc!.set('costCents', 99);
      await expect(doc!.save()).rejects.toThrow(COST_EVENT_APPEND_ONLY_ERROR);
    });

    it('allows save() on a freshly-constructed document (initial insert)', async () => {
      const doc = new CostEventModel({
        traceId: 't',
        userId: new Types.ObjectId(),
        costType: 'llm',
        provider: 'anthropic',
        costCents: 1,
      });
      await expect(doc.save()).resolves.toBeDefined();
    });
  });

  // ===== Indexes =====

  describe('indexes', () => {
    it('creates all four declared indexes', async () => {
      await CostEventModel.syncIndexes();
      const idx = await CostEventModel.collection.indexInformation();
      // We don't check exact key order here (event Indexes.test pins those);
      // just verify the collection has more than just the default _id index.
      const indexCount = Object.keys(idx).length;
      expect(indexCount).toBeGreaterThanOrEqual(5); // _id + 4 declared
    });

    it('capHit index is sparse (only indexes events with capHit set)', async () => {
      await CostEventModel.syncIndexes();
      const indexes = await CostEventModel.collection.indexes();
      const capHitIdx = indexes.find((i) =>
        Array.isArray(i.key) ? false : Object.keys(i.key ?? {}).includes('capHit')
      );
      expect(capHitIdx).toBeDefined();
      expect(capHitIdx?.sparse).toBe(true);
    });
  });
});
