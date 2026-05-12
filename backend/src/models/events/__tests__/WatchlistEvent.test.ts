/**
 * W1-S2 part 8 — WatchlistEvent acceptance tests.
 * Lightweight save-to-watchlist event.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { WatchlistEventModel, WatchlistPayloadSchema, WatchlistPayload } from '../WatchlistEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

function validPayload(): WatchlistPayload {
  return {
    dealId: new Types.ObjectId(),
    source: 'chat',
    decisionIdAtSave: new Types.ObjectId(),
  };
}

describe('WatchlistEvent (W1-S2 part 8)', () => {
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

  describe('Zod schema', () => {
    it('parses valid payload', () => {
      expect(() => WatchlistPayloadSchema.parse(validPayload())).not.toThrow();
    });

    it('accepts all 4 sources', () => {
      for (const source of ['chat', 'wizard', 'import', 'shared_link'] as const) {
        expect(() => WatchlistPayloadSchema.parse({ ...validPayload(), source })).not.toThrow();
      }
    });

    it('rejects invalid source', () => {
      expect(() =>
        WatchlistPayloadSchema.parse({ ...validPayload(), source: 'email' as unknown as 'chat' })
      ).toThrow();
    });

    it('allows decisionIdAtSave to be omitted (saved before scoring complete)', () => {
      const payload = validPayload() as unknown as Record<string, unknown>;
      delete payload.decisionIdAtSave;
      expect(() => WatchlistPayloadSchema.parse(payload)).not.toThrow();
    });

    it('accepts optional note', () => {
      expect(() =>
        WatchlistPayloadSchema.parse({ ...validPayload(), note: 'Worth a second look after Q2' })
      ).not.toThrow();
    });

    it('rejects missing dealId', () => {
      const payload = validPayload() as unknown as Record<string, unknown>;
      delete payload.dealId;
      expect(() => WatchlistPayloadSchema.parse(payload)).toThrow();
    });
  });

  describe('Mongoose discriminator', () => {
    it('creates a WatchlistEvent in events collection', async () => {
      const event = await WatchlistEventModel.create({
        traceId: 'test-watchlist-1',
        eventVersion: 1,
        actorType: 'tool:save_to_watchlist',
        userId: new Types.ObjectId(),
        payload: validPayload(),
      });
      expect(event.get('eventType')).toBe('watchlist');
      expect(WatchlistEventModel.collection.name).toBe('events');
    });

    it('inherits append-only', async () => {
      const event = await WatchlistEventModel.create({
        traceId: 'test-watchlist-2',
        eventVersion: 1,
        actorType: 'tool:save_to_watchlist',
        userId: new Types.ObjectId(),
        payload: validPayload(),
      });
      await expect(
        WatchlistEventModel.deleteOne({ _id: event._id })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('demonstrates activation-moment query pattern (watchlist add rate per session)', async () => {
      // Activation signal per architecture §11.2: each WatchlistEvent
      // is a visible substrate write — the architectural metric for
      // "first interaction produced an event."
      const userId = new Types.ObjectId();
      for (let i = 0; i < 5; i++) {
        await WatchlistEventModel.create({
          traceId: `watchlist-batch-${i}`,
          eventVersion: 1,
          actorType: 'tool:save_to_watchlist',
          userId,
          payload: { ...validPayload(), source: 'chat' },
        });
      }
      const count = await WatchlistEventModel.countDocuments({ userId });
      expect(count).toBe(5);
    });
  });
});
