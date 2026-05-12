/**
 * W1-S2 part 4 acceptance test — OverrideEvent payload schema + discriminator.
 *
 * Highest-signal event type per thesis §2.3 — captures user disagreement
 * with the engine. Tests cover:
 *   - Both input methods (inline_chat + structured_modal)
 *   - All three primitive value types (number / string / boolean)
 *   - Optional fields (justification, resulting event refs, newDealQuality)
 *   - DELIBERATE: no priorVerdict / newVerdict (consistent with §1.5)
 *   - Override chain pattern (multiple overrides per decision)
 *
 * Uses mongodb-memory-server (per project policy).
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  OverrideEventModel,
  OverridePayloadSchema,
  OverridePayload,
} from '../OverrideEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

/**
 * Inline-chat override: user said "change vacancy to 8%" in chat.
 * Vacancy moved from 0.05 → 0.08. Score dropped 67 → 58.
 */
function validInlineOverride(): OverridePayload {
  return {
    originalDecisionId: new Types.ObjectId(),
    fieldPath: 'assumptions.vacancyRate',
    originalValue: 0.05,
    newValue: 0.08,
    inputMethod: 'inline_chat',
    resultingAnalysisEventId: new Types.ObjectId(),
    resultingDecisionEventId: new Types.ObjectId(),
    priorDealQuality: 67,
    newDealQuality: 58,
    dealQualityDelta: -9,
  };
}

/**
 * Structured-modal override: B2B underwriter uses the structured override
 * UI with required justification. Rent moved up; cap rate improved.
 */
function validStructuredOverride(): OverridePayload {
  return {
    originalDecisionId: new Types.ObjectId(),
    fieldPath: 'propertyData.monthlyRent',
    originalValue: 2400,
    newValue: 2550,
    inputMethod: 'structured_modal',
    justification:
      'Comparable units in the same zip averaging $2,520/mo per RentCast last 30 days',
    resultingAnalysisEventId: new Types.ObjectId(),
    resultingDecisionEventId: new Types.ObjectId(),
    priorDealQuality: 62,
    newDealQuality: 71,
    dealQualityDelta: 9,
  };
}

describe('OverrideEvent (W1-S2 part 4)', () => {
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

  describe('OverridePayloadSchema (runtime validation)', () => {
    it('parses a valid inline-chat override (vacancy upward)', () => {
      expect(() => OverridePayloadSchema.parse(validInlineOverride())).not.toThrow();
    });

    it('parses a valid structured-modal override with justification', () => {
      expect(() => OverridePayloadSchema.parse(validStructuredOverride())).not.toThrow();
    });

    describe('value types — must be number/string/boolean', () => {
      it('accepts number values', () => {
        const payload = {
          ...validInlineOverride(),
          originalValue: 0.05,
          newValue: 0.08,
        };
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts string values (e.g., propertyType override)', () => {
        const payload = {
          ...validInlineOverride(),
          fieldPath: 'propertyData.exitStrategy.primaryExitStrategy',
          originalValue: 'sale',
          newValue: 'refinance',
        };
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts boolean values (e.g., toggle flag)', () => {
        const payload = {
          ...validInlineOverride(),
          fieldPath: 'propertyData.brrrr.isBrrrrEligible',
          originalValue: false,
          newValue: true,
        };
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });

      it('rejects object values (wave 1 limitation)', () => {
        const payload = {
          ...validInlineOverride(),
          newValue: { foo: 'bar' } as unknown as number,
        };
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });

      it('rejects array values', () => {
        const payload = {
          ...validInlineOverride(),
          newValue: [1, 2, 3] as unknown as number,
        };
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });

      it('rejects null values', () => {
        const payload = {
          ...validInlineOverride(),
          newValue: null as unknown as number,
        };
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('fieldPath', () => {
      it('rejects empty string', () => {
        const payload = { ...validInlineOverride(), fieldPath: '' };
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });

      it('accepts dot-path notation', () => {
        const payload = {
          ...validInlineOverride(),
          fieldPath: 'propertyData.exitStrategy.primaryExitStrategy',
        };
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });
    });

    describe('inputMethod enum', () => {
      it('accepts both valid values', () => {
        const inline = { ...validInlineOverride(), inputMethod: 'inline_chat' as const };
        const modal = { ...validStructuredOverride(), inputMethod: 'structured_modal' as const };
        expect(() => OverridePayloadSchema.parse(inline)).not.toThrow();
        expect(() => OverridePayloadSchema.parse(modal)).not.toThrow();
      });

      it('rejects invalid value', () => {
        const payload = {
          ...validInlineOverride(),
          inputMethod: 'voice' as unknown as 'inline_chat',
        };
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('ObjectId fields', () => {
      it('requires originalDecisionId', () => {
        const payload = validInlineOverride() as unknown as Record<string, unknown>;
        delete payload.originalDecisionId;
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });

      it('rejects invalid originalDecisionId string', () => {
        const payload = {
          ...validInlineOverride(),
          originalDecisionId: 'not-an-objectid' as unknown as Types.ObjectId,
        };
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });

      it('allows resultingAnalysisEventId to be omitted (re-analysis not complete)', () => {
        const payload = validInlineOverride() as unknown as Record<string, unknown>;
        delete payload.resultingAnalysisEventId;
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });

      it('allows resultingDecisionEventId to be omitted', () => {
        const payload = validInlineOverride() as unknown as Record<string, unknown>;
        delete payload.resultingDecisionEventId;
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });
    });

    describe('deal quality score fields', () => {
      it('requires priorDealQuality', () => {
        const payload = validInlineOverride() as unknown as Record<string, unknown>;
        delete payload.priorDealQuality;
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });

      it('priorDealQuality must be in 0-100 range', () => {
        const payload = { ...validInlineOverride(), priorDealQuality: 150 };
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });

      it('allows newDealQuality to be omitted (re-analysis in flight)', () => {
        const payload = validInlineOverride() as unknown as Record<string, unknown>;
        delete payload.newDealQuality;
        delete payload.dealQualityDelta;
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });

      it('newDealQuality must also be in 0-100 range when present', () => {
        const payload = { ...validInlineOverride(), newDealQuality: 105 };
        expect(() => OverridePayloadSchema.parse(payload)).toThrow();
      });

      it('dealQualityDelta can be negative (downward override common)', () => {
        const payload = { ...validInlineOverride(), dealQualityDelta: -15 };
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });
    });

    describe('justification', () => {
      it('allows missing (inline-chat default)', () => {
        const payload = validInlineOverride() as unknown as Record<string, unknown>;
        delete payload.justification;
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts when present', () => {
        const payload = {
          ...validInlineOverride(),
          justification: 'Comparable rents support a $200 higher monthly rate.',
        };
        expect(() => OverridePayloadSchema.parse(payload)).not.toThrow();
      });
    });

    describe('deliberate omission — no priorVerdict / newVerdict', () => {
      it('schema does not include priorVerdict (consistent with no-verdict architecture)', () => {
        const payloadWithVerdict = {
          ...validInlineOverride(),
          priorVerdict: 'NEGOTIATE' as const,
        };
        const parsed = OverridePayloadSchema.parse(payloadWithVerdict);
        // Zod default non-strict drops the unknown field
        expect((parsed as unknown as { priorVerdict?: string }).priorVerdict).toBeUndefined();
      });

      it('schema does not include newVerdict', () => {
        const payloadWithVerdict = {
          ...validInlineOverride(),
          newVerdict: 'PASS' as const,
        };
        const parsed = OverridePayloadSchema.parse(payloadWithVerdict);
        expect((parsed as unknown as { newVerdict?: string }).newVerdict).toBeUndefined();
      });
    });
  });

  // ===== Mongoose discriminator =====

  describe('OverrideEventModel (discriminator)', () => {
    const validEnvelope = () => ({
      traceId: 'test-trace-override-1',
      eventVersion: 1,
      actorType: 'tool:apply_override' as const,
      userId: new Types.ObjectId(),
      payload: validInlineOverride(),
    });

    it('creates an OverrideEvent with valid payload', async () => {
      const event = await OverrideEventModel.create(validEnvelope());
      expect(event.get('eventType')).toBe('override');
      expect(event.get('payload').fieldPath).toBe('assumptions.vacancyRate');
      expect(event.get('payload').newValue).toBe(0.08);
    });

    it('stores OverrideEvent in the unified events collection', async () => {
      await OverrideEventModel.create(validEnvelope());
      expect(OverrideEventModel.collection.name).toBe('events');

      const rawDocs = await mongoose.connection.db.collection('events').find({}).toArray();
      expect(rawDocs).toHaveLength(1);
      expect(rawDocs[0].eventType).toBe('override');
    });

    it('inherits append-only enforcement on updateOne', async () => {
      const event = await OverrideEventModel.create(validEnvelope());
      await expect(
        OverrideEventModel.updateOne({ _id: event._id }, { 'payload.newValue': 0.1 })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('inherits append-only enforcement on document save() of existing', async () => {
      const event = await OverrideEventModel.create(validEnvelope());
      event.set('payload.newValue', 0.1);
      await expect(event.save()).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('preserves payload structure through round-trip', async () => {
      await OverrideEventModel.create(validEnvelope());
      const found = await OverrideEventModel.findOne({});
      const payload = found?.get('payload');

      expect(payload.fieldPath).toBe('assumptions.vacancyRate');
      expect(payload.originalValue).toBe(0.05);
      expect(payload.newValue).toBe(0.08);
      expect(payload.inputMethod).toBe('inline_chat');
      expect(payload.priorDealQuality).toBe(67);
      expect(payload.newDealQuality).toBe(58);
      expect(payload.dealQualityDelta).toBe(-9);
    });

    it('supports override chain — multiple overrides on same decision', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = new Types.ObjectId();

      // First override: vacancy
      await OverrideEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: 'override-chain-1',
        payload: {
          ...validInlineOverride(),
          originalDecisionId,
          fieldPath: 'assumptions.vacancyRate',
        },
      });

      // Second override: rent (later in session)
      await OverrideEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: 'override-chain-2',
        payload: {
          ...validInlineOverride(),
          originalDecisionId,
          fieldPath: 'propertyData.monthlyRent',
          originalValue: 2400,
          newValue: 2550,
        },
      });

      // Third override: maintenance rate
      await OverrideEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: 'override-chain-3',
        payload: {
          ...validInlineOverride(),
          originalDecisionId,
          fieldPath: 'assumptions.maintenanceRate',
          originalValue: 0.01,
          newValue: 0.015,
        },
      });

      const overrides = await OverrideEventModel.find({
        'payload.originalDecisionId': originalDecisionId,
      }).sort({ timestamp: 1 });

      expect(overrides).toHaveLength(3);
      expect(overrides[0].get('payload').fieldPath).toBe('assumptions.vacancyRate');
      expect(overrides[1].get('payload').fieldPath).toBe('propertyData.monthlyRent');
      expect(overrides[2].get('payload').fieldPath).toBe('assumptions.maintenanceRate');
    });

    it('demonstrates the calibration-signal query pattern', async () => {
      // Simulate 5 users overriding vacancy upward — exactly the substrate
      // signal the thesis cares about. Each writes their own OverrideEvent.
      const fieldPath = 'assumptions.vacancyRate';

      for (let i = 0; i < 5; i++) {
        await OverrideEventModel.create({
          ...validEnvelope(),
          userId: new Types.ObjectId(),
          traceId: `vacancy-override-${i}`,
          payload: {
            ...validInlineOverride(),
            fieldPath,
            originalValue: 0.05,
            newValue: 0.06 + i * 0.01, // 0.06, 0.07, 0.08, 0.09, 0.10
          },
        });
      }

      // Aggregate query: average new value for this fieldPath
      const overrides = await OverrideEventModel.find({ 'payload.fieldPath': fieldPath });
      expect(overrides).toHaveLength(5);

      const newValues = overrides.map((e) => e.get('payload').newValue);
      const avgNew = newValues.reduce((sum: number, v: number) => sum + v, 0) / newValues.length;
      expect(avgNew).toBeCloseTo(0.08, 2);

      // This is the moat in action: 5 users independently overrode vacancy
      // upward, averaging 0.08 (vs engine default 0.05). Engine's default
      // is too optimistic by 60% per real user signal.
    });
  });
});
