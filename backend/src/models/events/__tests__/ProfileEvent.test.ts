/**
 * W1-S2 acceptance test — ProfileEvent payload schema + discriminator.
 *
 * Two surfaces tested:
 *   1. ZodProfilePayloadSchema — runtime validation contract that the
 *      repository layer (W1-S3) will rely on
 *   2. ProfileEventModel — Mongoose discriminator that stores events in
 *      the unified `events` collection and inherits append-only enforcement
 *
 * Uses mongodb-memory-server (per project policy — never touches Atlas).
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProfileEventModel, ProfilePayloadSchema, ProfilePayload } from '../ProfileEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('ProfileEvent (W1-S2)', () => {
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

  // ===== Zod payload schema =====

  describe('ProfilePayloadSchema (runtime validation)', () => {
    it('parses an empty payload (all fields optional)', () => {
      expect(() => ProfilePayloadSchema.parse({})).not.toThrow();
    });

    it('parses a minimal valid payload', () => {
      const payload: ProfilePayload = { investorType: 'retail', riskTolerance: 'moderate' };
      expect(() => ProfilePayloadSchema.parse(payload)).not.toThrow();
    });

    it('parses a full valid payload (every field populated)', () => {
      const payload: ProfilePayload = {
        investorType: 'lender',
        portfolioSize: '4-10',
        primaryMarkets: ['Phoenix', 'Dallas', 'Memphis'],
        role: 'loan_officer',
        institutionContext: {
          name: 'Acme Credit Union',
          institutionType: 'credit_union',
          typicalDealVolume: 'medium',
        },
        riskTolerance: 'conservative',
        primaryGoal: 'cash_flow',
        extractedFromInput: 'I am a loan officer at Acme Credit Union',
        extractionConfidence: 95,
      };
      expect(() => ProfilePayloadSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid investorType enum value', () => {
      expect(() => ProfilePayloadSchema.parse({ investorType: 'institutional' })).toThrow();
    });

    it('rejects invalid riskTolerance enum value', () => {
      expect(() => ProfilePayloadSchema.parse({ riskTolerance: 'opportunistic' })).toThrow();
    });

    it('rejects invalid institutionContext.institutionType', () => {
      expect(() =>
        ProfilePayloadSchema.parse({
          institutionContext: { institutionType: 'investment_bank' },
        })
      ).toThrow();
    });

    it('rejects extractionConfidence above 100', () => {
      expect(() => ProfilePayloadSchema.parse({ extractionConfidence: 150 })).toThrow();
    });

    it('rejects extractionConfidence below 0', () => {
      expect(() => ProfilePayloadSchema.parse({ extractionConfidence: -5 })).toThrow();
    });

    it('rejects primaryMarkets with non-string elements', () => {
      // Cast through unknown — intentionally invalid input for runtime test
      const invalidPayload = { primaryMarkets: ['Phoenix', 42] } as unknown;
      expect(() => ProfilePayloadSchema.parse(invalidPayload)).toThrow();
    });

    it('strips unknown top-level fields (Zod default non-strict behavior)', () => {
      // Documenting non-strict behavior: unknown keys silently dropped.
      // This is intentional — repository layer applies the typed parse;
      // event store stays clean.
      const result = ProfilePayloadSchema.parse({
        investorType: 'retail',
        unknownField: 'should be stripped',
      });
      expect(result).toEqual({ investorType: 'retail' });
    });
  });

  // ===== Mongoose discriminator =====

  describe('ProfileEventModel (discriminator)', () => {
    const validInput = () => ({
      traceId: 'test-trace-profile-1',
      eventVersion: 1,
      actorType: 'tool:profile_extraction' as const,
      userId: new mongoose.Types.ObjectId(),
      payload: {
        investorType: 'retail' as const,
        riskTolerance: 'moderate' as const,
      },
    });

    it('creates a ProfileEvent with valid payload', async () => {
      const event = await ProfileEventModel.create(validInput());
      expect(event.get('eventType')).toBe('profile');
      expect(event.get('payload')).toMatchObject({
        investorType: 'retail',
        riskTolerance: 'moderate',
      });
      expect(event.get('traceId')).toBe('test-trace-profile-1');
      expect(event.get('actorType')).toBe('tool:profile_extraction');
    });

    it('stores ProfileEvent in the unified events collection', async () => {
      await ProfileEventModel.create(validInput());

      // Verify the discriminator routes to the same collection as the base model
      expect(ProfileEventModel.collection.name).toBe('events');

      // Verify the document is queryable from the events collection directly
      const rawDocs = await mongoose.connection.db
        .collection('events')
        .find({})
        .toArray();
      expect(rawDocs).toHaveLength(1);
      expect(rawDocs[0].eventType).toBe('profile');
    });

    it('requires payload field', async () => {
      const inputWithoutPayload = validInput() as Record<string, unknown>;
      delete inputWithoutPayload.payload;
      await expect(ProfileEventModel.create(inputWithoutPayload)).rejects.toThrow();
    });

    it('inherits base envelope validation (rejects missing traceId)', async () => {
      const incomplete = validInput() as Record<string, unknown>;
      delete incomplete.traceId;
      await expect(ProfileEventModel.create(incomplete)).rejects.toThrow();
    });

    it('inherits append-only enforcement on updateOne', async () => {
      const event = await ProfileEventModel.create(validInput());
      await expect(
        ProfileEventModel.updateOne(
          { _id: event._id },
          { 'payload.investorType': 'lender' }
        )
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('inherits append-only enforcement on deleteOne', async () => {
      const event = await ProfileEventModel.create(validInput());
      await expect(
        ProfileEventModel.deleteOne({ _id: event._id })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('inherits append-only enforcement on document save() of existing event', async () => {
      const event = await ProfileEventModel.create(validInput());
      event.set('payload', { investorType: 'lender' });
      await expect(event.save()).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('preserves payload structure through round-trip read', async () => {
      const fullPayload: ProfilePayload = {
        investorType: 'lender',
        portfolioSize: '4-10',
        primaryMarkets: ['Phoenix', 'Dallas'],
        role: 'loan_officer',
        institutionContext: {
          name: 'Acme Credit Union',
          institutionType: 'credit_union',
          typicalDealVolume: 'medium',
        },
        riskTolerance: 'conservative',
        primaryGoal: 'cash_flow',
        extractionConfidence: 92,
      };

      await ProfileEventModel.create({
        ...validInput(),
        payload: fullPayload,
      });

      const found = await ProfileEventModel.findOne({});
      expect(found).toBeDefined();
      expect(found?.get('payload')).toMatchObject(fullPayload);
    });

    it('allows multiple ProfileEvents for the same user (profile evolution over time)', async () => {
      const userId = new mongoose.Types.ObjectId();

      await ProfileEventModel.create({
        ...validInput(),
        userId,
        payload: { investorType: 'retail' },
      });

      await ProfileEventModel.create({
        ...validInput(),
        userId,
        traceId: 'test-trace-profile-2',
        payload: { investorType: 'retail', portfolioSize: '1-3' },
      });

      await ProfileEventModel.create({
        ...validInput(),
        userId,
        traceId: 'test-trace-profile-3',
        payload: { investorType: 'retail', portfolioSize: '4-10', primaryMarkets: ['Phoenix'] },
      });

      const events = await ProfileEventModel.find({ userId }).sort({ timestamp: 1 });
      expect(events).toHaveLength(3);
      expect(events[0].get('payload').portfolioSize).toBeUndefined();
      expect(events[1].get('payload').portfolioSize).toBe('1-3');
      expect(events[2].get('payload').portfolioSize).toBe('4-10');
    });
  });
});
