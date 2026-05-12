/**
 * W1-S2 part 5 acceptance test — CritiqueEvent payload schema + discriminator.
 *
 * Adversarial-critic agent output. Tests cover:
 *   - Both personas (optimistic_flipper, skeptical_cpa)
 *   - All three trigger types
 *   - severityScore 0-100
 *   - alternativeAssumptions array with typed sub-fields
 *   - DELIBERATE: no criticVerdict field (consistent with §1.5)
 *   - Per-persona signal-ratio query pattern (kill-criterion eval)
 *
 * Uses mongodb-memory-server (per project policy).
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  CritiqueEventModel,
  CritiquePayloadSchema,
  CritiquePayload,
} from '../CritiqueEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

/**
 * Optimistic flipper critique: deal-scoring agent returned 82 (BUY-band);
 * optimistic critic agrees it's a buy but pushes for even more aggressive
 * rent assumptions.
 */
function validOptimisticCritique(): CritiquePayload {
  return {
    originalDecisionId: new Types.ObjectId(),
    criticPersona: 'optimistic_flipper',
    agreementWithOriginal: true,
    divergenceReasons: [
      'Engine vacancy default of 5% is conservative for this submarket — comparable units show 3% effective vacancy.',
      'Annual rent growth projection of 3% is below the 5-year trailing average of 4.2% for this MSA.',
    ],
    alternativeAssumptions: [
      {
        fieldPath: 'assumptions.vacancyRate',
        suggestedValue: 0.03,
        reasoning: 'Submarket-specific vacancy is lower than national average',
      },
      {
        fieldPath: 'assumptions.annualRentIncrease',
        suggestedValue: 0.042,
        reasoning: 'MSA 5-year trailing rent growth',
      },
    ],
    severityScore: 22, // modest disagreement
    triggerType: 'auto_buy_band',
    modelUsed: 'claude-opus-4-7',
    tokenCost: 0.082,
  };
}

/**
 * Skeptical CPA critique: same BUY-band deal; skeptical critic disagrees,
 * citing hidden tax exposure and deferred-maintenance reserves.
 */
function validSkepticalCritique(): CritiquePayload {
  return {
    originalDecisionId: new Types.ObjectId(),
    criticPersona: 'skeptical_cpa',
    agreementWithOriginal: false,
    divergenceReasons: [
      'Property is 25 years old; engine maintenance reserve of 1% understates deferred CapEx risk.',
      'Depreciation recapture at exit not factored into IRR projection — actual after-tax IRR likely 1.5-2pp lower.',
      'Cash flow buffer of $120/mo is insufficient for unexpected expenses on a B-class property.',
    ],
    alternativeAssumptions: [
      {
        fieldPath: 'assumptions.maintenanceRate',
        suggestedValue: 0.02,
        reasoning: 'Property age + B-class warrants 2% maintenance reserve',
      },
      {
        fieldPath: 'assumptions.cashFlowBufferTarget',
        suggestedValue: 250,
        reasoning: 'Minimum monthly buffer should be 5% of gross rent for B-class',
      },
    ],
    severityScore: 68, // strong disagreement
    triggerType: 'auto_buy_band',
    modelUsed: 'claude-opus-4-7',
    tokenCost: 0.094,
  };
}

describe('CritiqueEvent (W1-S2 part 5)', () => {
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

  describe('CritiquePayloadSchema (runtime validation)', () => {
    it('parses a valid optimistic_flipper critique', () => {
      expect(() => CritiquePayloadSchema.parse(validOptimisticCritique())).not.toThrow();
    });

    it('parses a valid skeptical_cpa critique', () => {
      expect(() => CritiquePayloadSchema.parse(validSkepticalCritique())).not.toThrow();
    });

    describe('criticPersona enum', () => {
      it('accepts both valid personas', () => {
        const optimistic = { ...validOptimisticCritique(), criticPersona: 'optimistic_flipper' as const };
        const skeptical = { ...validSkepticalCritique(), criticPersona: 'skeptical_cpa' as const };
        expect(() => CritiquePayloadSchema.parse(optimistic)).not.toThrow();
        expect(() => CritiquePayloadSchema.parse(skeptical)).not.toThrow();
      });

      it('rejects invalid persona name', () => {
        const payload = {
          ...validOptimisticCritique(),
          criticPersona: 'cynical_skeptic' as unknown as 'optimistic_flipper',
        };
        expect(() => CritiquePayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('triggerType enum', () => {
      it('accepts all 3 valid trigger types', () => {
        const triggers = ['auto_buy_band', 'manual_request', 'batch_seeding'] as const;
        for (const trigger of triggers) {
          const payload = { ...validOptimisticCritique(), triggerType: trigger };
          expect(() => CritiquePayloadSchema.parse(payload)).not.toThrow();
        }
      });

      it('rejects invalid trigger type', () => {
        const payload = {
          ...validOptimisticCritique(),
          triggerType: 'cron_job' as unknown as 'auto_buy_band',
        };
        expect(() => CritiquePayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('severityScore (0-100)', () => {
      it('accepts boundary values', () => {
        expect(() =>
          CritiquePayloadSchema.parse({ ...validOptimisticCritique(), severityScore: 0 })
        ).not.toThrow();
        expect(() =>
          CritiquePayloadSchema.parse({ ...validOptimisticCritique(), severityScore: 100 })
        ).not.toThrow();
      });

      it('rejects out-of-range', () => {
        expect(() =>
          CritiquePayloadSchema.parse({ ...validOptimisticCritique(), severityScore: -1 })
        ).toThrow();
        expect(() =>
          CritiquePayloadSchema.parse({ ...validOptimisticCritique(), severityScore: 101 })
        ).toThrow();
      });
    });

    describe('agreementWithOriginal', () => {
      it('accepts true (critic agrees, may still note disagreements)', () => {
        const payload = { ...validOptimisticCritique(), agreementWithOriginal: true };
        expect(() => CritiquePayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts false (critic fundamentally disagrees)', () => {
        const payload = { ...validSkepticalCritique(), agreementWithOriginal: false };
        expect(() => CritiquePayloadSchema.parse(payload)).not.toThrow();
      });

      it('rejects non-boolean', () => {
        const payload = {
          ...validOptimisticCritique(),
          agreementWithOriginal: 'maybe' as unknown as boolean,
        };
        expect(() => CritiquePayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('divergenceReasons', () => {
      it('accepts empty array (no specific reasons cited)', () => {
        const payload = { ...validOptimisticCritique(), divergenceReasons: [] };
        expect(() => CritiquePayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts multiple reasons', () => {
        const payload = {
          ...validOptimisticCritique(),
          divergenceReasons: ['reason 1', 'reason 2', 'reason 3'],
        };
        expect(() => CritiquePayloadSchema.parse(payload)).not.toThrow();
      });

      it('rejects empty-string entries', () => {
        const payload = {
          ...validOptimisticCritique(),
          divergenceReasons: ['valid', ''],
        };
        expect(() => CritiquePayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('alternativeAssumptions', () => {
      it('accepts empty array (critic disagrees but suggests no specific fixes)', () => {
        const payload = { ...validOptimisticCritique(), alternativeAssumptions: [] };
        expect(() => CritiquePayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts mixed primitive suggested values', () => {
        const payload = {
          ...validOptimisticCritique(),
          alternativeAssumptions: [
            { fieldPath: 'a.b', suggestedValue: 0.05, reasoning: 'numeric' },
            { fieldPath: 'a.c', suggestedValue: 'cashflow', reasoning: 'string' },
            { fieldPath: 'a.d', suggestedValue: true, reasoning: 'boolean' },
          ],
        };
        expect(() => CritiquePayloadSchema.parse(payload)).not.toThrow();
      });

      it('rejects entries missing reasoning', () => {
        const payload = {
          ...validOptimisticCritique(),
          alternativeAssumptions: [
            { fieldPath: 'a.b', suggestedValue: 0.05 } as unknown as { fieldPath: string; suggestedValue: number; reasoning: string },
          ],
        };
        expect(() => CritiquePayloadSchema.parse(payload)).toThrow();
      });

      it('rejects object as suggestedValue (primitive-only)', () => {
        const payload = {
          ...validOptimisticCritique(),
          alternativeAssumptions: [
            { fieldPath: 'a.b', suggestedValue: { foo: 1 } as unknown as number, reasoning: 'r' },
          ],
        };
        expect(() => CritiquePayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('cost observability fields', () => {
      it('requires modelUsed (non-empty)', () => {
        const payload = { ...validOptimisticCritique(), modelUsed: '' };
        expect(() => CritiquePayloadSchema.parse(payload)).toThrow();
      });

      it('rejects negative tokenCost', () => {
        const payload = { ...validOptimisticCritique(), tokenCost: -0.01 };
        expect(() => CritiquePayloadSchema.parse(payload)).toThrow();
      });

      it('accepts tokenCost of 0 (e.g., free-tier promotional credit)', () => {
        const payload = { ...validOptimisticCritique(), tokenCost: 0 };
        expect(() => CritiquePayloadSchema.parse(payload)).not.toThrow();
      });
    });

    describe('deliberate omission — no criticVerdict', () => {
      it('schema does not include criticVerdict — silently strips it if added', () => {
        const payloadWithVerdict = {
          ...validOptimisticCritique(),
          criticVerdict: 'NEGOTIATE' as const,
        };
        const parsed = CritiquePayloadSchema.parse(payloadWithVerdict);
        expect((parsed as unknown as { criticVerdict?: string }).criticVerdict).toBeUndefined();
      });
    });
  });

  // ===== Mongoose discriminator =====

  describe('CritiqueEventModel (discriminator)', () => {
    const validEnvelope = () => ({
      traceId: 'test-trace-critique-1',
      eventVersion: 1,
      actorType: 'agent:adversarial_critic' as const,
      userId: new Types.ObjectId(),
      payload: validOptimisticCritique(),
    });

    it('creates a CritiqueEvent with valid payload', async () => {
      const event = await CritiqueEventModel.create(validEnvelope());
      expect(event.get('eventType')).toBe('critique');
      expect(event.get('payload').criticPersona).toBe('optimistic_flipper');
      expect(event.get('payload').severityScore).toBe(22);
    });

    it('stores CritiqueEvent in the unified events collection', async () => {
      await CritiqueEventModel.create(validEnvelope());
      expect(CritiqueEventModel.collection.name).toBe('events');

      const rawDocs = await mongoose.connection.db.collection('events').find({}).toArray();
      expect(rawDocs).toHaveLength(1);
      expect(rawDocs[0].eventType).toBe('critique');
    });

    it('inherits append-only enforcement on updateOne', async () => {
      const event = await CritiqueEventModel.create(validEnvelope());
      await expect(
        CritiqueEventModel.updateOne({ _id: event._id }, { 'payload.severityScore': 50 })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('preserves alternativeAssumptions array through round-trip', async () => {
      await CritiqueEventModel.create(validEnvelope());
      const found = await CritiqueEventModel.findOne({});
      const payload = found?.get('payload');

      expect(payload.alternativeAssumptions).toHaveLength(2);
      expect(payload.alternativeAssumptions[0].fieldPath).toBe('assumptions.vacancyRate');
      expect(payload.alternativeAssumptions[0].suggestedValue).toBe(0.03);
      expect(payload.alternativeAssumptions[1].suggestedValue).toBe(0.042);
    });

    it('supports both personas critiquing the same decision', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = new Types.ObjectId();

      // Optimistic critique
      await CritiqueEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: 'critique-flipper-1',
        payload: { ...validOptimisticCritique(), originalDecisionId },
      });

      // Skeptical critique on the same decision
      await CritiqueEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: 'critique-cpa-1',
        payload: { ...validSkepticalCritique(), originalDecisionId },
      });

      const critiques = await CritiqueEventModel.find({
        'payload.originalDecisionId': originalDecisionId,
      });
      expect(critiques).toHaveLength(2);

      const personas = critiques.map((c) => c.get('payload').criticPersona).sort();
      expect(personas).toEqual(['optimistic_flipper', 'skeptical_cpa']);
    });

    it('demonstrates the kill-criterion eval query pattern (per-persona signal ratio)', async () => {
      // Simulate 20 critiques from skeptical_cpa, with varied severity scores.
      // The 4-week kill criterion (per evals doc §5) requires
      // meaningfulDisagreementRate > 20% (severityScore > 40 AND
      // agreementWithOriginal=false).
      for (let i = 0; i < 20; i++) {
        const severityScore = i * 5; // 0, 5, 10, ..., 95
        const agreementWithOriginal = severityScore < 30;
        await CritiqueEventModel.create({
          ...validEnvelope(),
          userId: new Types.ObjectId(),
          traceId: `cpa-batch-${i}`,
          payload: {
            ...validSkepticalCritique(),
            severityScore,
            agreementWithOriginal,
          },
        });
      }

      // Kill-criterion query: how many are meaningful disagreements?
      const meaningful = await CritiqueEventModel.find({
        'payload.criticPersona': 'skeptical_cpa',
        'payload.severityScore': { $gt: 40 },
        'payload.agreementWithOriginal': false,
      });

      // severityScores > 40 with disagreement: 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95
      // (severity 30-40 still has agreementWithOriginal=false but ≤40 fails the cut)
      // That's 11 out of 20.
      expect(meaningful.length).toBeGreaterThanOrEqual(11);
      const ratio = meaningful.length / 20;
      expect(ratio).toBeGreaterThan(0.2); // > 20% per kill-criterion threshold
    });
  });
});
