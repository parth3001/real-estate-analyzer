/**
 * W1-S1 acceptance test — BaseEventModel append-only enforcement.
 *
 * Verifies the schema-layer enforcement (one of three append-only layers
 * per /docs/PRODUCT_2.0_EVENTS_STORE.md §6). This test does NOT verify
 * DB role enforcement (W1-S8) or repository-method discipline (W1-S3) —
 * those are separate tests.
 *
 * Uses mongodb-memory-server: in-process ephemeral MongoDB that runs for
 * the duration of this test file and dies on exit. Never touches Atlas,
 * never requires local mongo install. Per project policy, Atlas is the
 * only production datastore; mongodb-memory-server is unit-test-only.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { BaseEventModel, APPEND_ONLY_ERROR } from '../BaseEvent';

// First-run can be slow (~30-60s) while mongodb-memory-server downloads the
// MongoDB binary to ~/.cache/mongodb-binaries. Subsequent runs use the
// cached binary and start in ~1-2s.
const SETUP_TIMEOUT_MS = 90_000;

describe('BaseEventModel — append-only enforcement (W1-S1)', () => {
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

  const validInput = () => ({
    traceId: 'test-trace-1',
    eventType: 'profile' as const,
    eventVersion: 1,
    actorType: 'user' as const,
    userId: new mongoose.Types.ObjectId(),
  });

  describe('insert path (the only permitted write)', () => {
    it('allows create() of a new event', async () => {
      const event = await BaseEventModel.create(validInput());
      expect(event.get('traceId')).toBe('test-trace-1');
      expect(event.get('eventVersion')).toBe(1);
      expect(event.get('timestamp')).toBeInstanceOf(Date);
    });

    it('allows save() of a new document (insert path)', async () => {
      const doc = new BaseEventModel(validInput());
      await expect(doc.save()).resolves.toBeDefined();
    });

    it('rejects insert with missing required field (traceId)', async () => {
      const incomplete = validInput() as Record<string, unknown>;
      delete incomplete.traceId;
      await expect(BaseEventModel.create(incomplete)).rejects.toThrow();
    });

    it("rejects insert with unknown top-level field (strict: 'throw')", async () => {
      const withUnknown = { ...validInput(), bogusField: 'should fail' };
      await expect(BaseEventModel.create(withUnknown)).rejects.toThrow();
    });
  });

  describe('append-only enforcement — query-level operations all throw', () => {
    beforeEach(async () => {
      await BaseEventModel.create(validInput());
    });

    it('throws on updateOne', async () => {
      await expect(
        BaseEventModel.updateOne({ traceId: 'test-trace-1' }, { eventVersion: 2 })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('throws on updateMany', async () => {
      await expect(
        BaseEventModel.updateMany({}, { eventVersion: 2 })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('throws on findOneAndUpdate', async () => {
      await expect(
        BaseEventModel.findOneAndUpdate({ traceId: 'test-trace-1' }, { eventVersion: 2 })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('throws on replaceOne', async () => {
      await expect(
        BaseEventModel.replaceOne({ traceId: 'test-trace-1' }, validInput())
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('throws on deleteOne', async () => {
      await expect(
        BaseEventModel.deleteOne({ traceId: 'test-trace-1' })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('throws on deleteMany', async () => {
      await expect(
        BaseEventModel.deleteMany({})
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('throws on findOneAndDelete', async () => {
      await expect(
        BaseEventModel.findOneAndDelete({ traceId: 'test-trace-1' })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });
  });

  describe('append-only enforcement — document-save path closes the gap', () => {
    it('throws on save() of an existing (already-persisted) document', async () => {
      const event = await BaseEventModel.create(validInput());
      event.set('eventVersion', 2);
      await expect(event.save()).rejects.toThrow(APPEND_ONLY_ERROR);
    });
  });

  describe('read operations remain unaffected', () => {
    beforeEach(async () => {
      await BaseEventModel.create(validInput());
    });

    it('allows find()', async () => {
      const events = await BaseEventModel.find({});
      expect(events).toHaveLength(1);
      expect(events[0].get('traceId')).toBe('test-trace-1');
    });

    it('allows findOne()', async () => {
      const event = await BaseEventModel.findOne({ traceId: 'test-trace-1' });
      expect(event).toBeDefined();
      expect(event?.get('eventVersion')).toBe(1);
    });
  });
});
