/**
 * W1-S2 part 3 acceptance test — DecisionEvent payload schema + discriminator.
 *
 * LOAD-BEARING — this is the event that the calibration check (W8) validates
 * against. Architect-mandatory review on changes. Tests below cover:
 *   - Strict validation of the scoring surface (dealQuality 0-100,
 *     qualityLabel enum, qualityColor enum, confidence 0-100)
 *   - Critical-flag structured shapes (each flag's typed sub-fields)
 *   - User-context persona enums (riskTolerance, investmentStrategy,
 *     experienceLevel, investorType, primaryGoal)
 *   - Cross-event reference (analysisEventId) handles both ObjectId
 *     instances and 24-char hex strings
 *   - DELIBERATE: no `verdict` field allowed (per architecture §1.5)
 *
 * Uses mongodb-memory-server (per project policy).
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  DecisionEventModel,
  DecisionPayloadSchema,
  DecisionPayload,
} from '../DecisionEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

/**
 * Builds a representative valid DecisionPayload — a "Meets professional
 * standards" verdict (67/100) on the Anna TX sample property.
 */
function validPayload(): DecisionPayload {
  return {
    analysisEventId: new Types.ObjectId(),
    dealId: new Types.ObjectId(),

    dealQuality: 67,
    qualityLabel: 'Meets professional standards',
    qualityColor: 'yellow',

    professionalAssessment: {
      dealQuality: 67,
      executionDifficulty: 45,
      dataReliability: 78,
      cashFlowScore: 60,
      irrScore: 70,
      marketStrengthScore: 65,
      debtStructureScore: 75,
      exitStrategyScore: 70,
      capRateScore: 60,
      propertyRiskScore: 80,
      primaryInsight: 'Solid investment opportunity with optimization potential',
      strategicRecommendations: [],
      riskMitigation: [],
      opportunityMaximization: [],
      confidenceLevel: 78,
      keyStrengths: [],
      keyRisks: [],
    } as unknown as DecisionPayload['professionalAssessment'],

    marketPosition: {
      walkAwayPrice: 385000,
      pricingContext: 'fair',
      marketStage: 'mid',
      competitiveIntensity: 'moderate',
    } as unknown as DecisionPayload['marketPosition'],

    reasoningTrail: {
      primaryInsight: 'Strong fundamentals with $40K negotiation room below walk-away.',
      strategicRecommendations: [
        'Negotiate price reduction to $385K (walk-away level)',
        'Verify property condition during inspection',
      ],
      riskMitigation: ['Budget for unexpected maintenance reserves'],
      opportunityMaximization: ['Consider value-add improvements for rent growth'],
      keyRisks: ['Cash flow currently negative; sensitive to vacancy spike'],
    },

    confidence: 78,
    scoringWeightsUsed: {
      cashFlow: 0.35,
      irr: 0.25,
      marketStrength: 0.15,
      debtStructure: 0.1,
      exitStrategy: 0.1,
      capRate: 0.03,
      propertyRisk: 0.02,
    } as unknown as DecisionPayload['scoringWeightsUsed'],

    engineVersion: 'v3.0',

    userContext: {
      riskTolerance: 'moderate',
      investmentStrategy: 'balanced',
      experienceLevel: 'intermediate',
    },
  };
}

describe('DecisionEvent (W1-S2 part 3)', () => {
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

  describe('DecisionPayloadSchema (runtime validation)', () => {
    it('parses a representative valid payload', () => {
      expect(() => DecisionPayloadSchema.parse(validPayload())).not.toThrow();
    });

    describe('dealQuality (THE primary output)', () => {
      it('accepts 0', () => {
        const payload = { ...validPayload(), dealQuality: 0, qualityLabel: 'Below professional standards' as const, qualityColor: 'red' as const };
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts 100', () => {
        const payload = { ...validPayload(), dealQuality: 100, qualityLabel: 'Above professional standards' as const, qualityColor: 'green' as const };
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });

      it('rejects -1 (below range)', () => {
        const payload = { ...validPayload(), dealQuality: -1 };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects 101 (above range)', () => {
        const payload = { ...validPayload(), dealQuality: 101 };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects non-numeric', () => {
        const payload = { ...validPayload(), dealQuality: '67' as unknown as number };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('qualityLabel + qualityColor enums', () => {
      it('accepts all 4 valid qualityLabel values', () => {
        const labels = [
          'Above professional standards',
          'Meets professional standards',
          'Requires optimization',
          'Below professional standards',
        ] as const;
        for (const label of labels) {
          const payload = { ...validPayload(), qualityLabel: label };
          expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
        }
      });

      it('rejects invalid qualityLabel (no free-form strings)', () => {
        const payload = { ...validPayload(), qualityLabel: 'Pretty good' as unknown as DecisionPayload['qualityLabel'] };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });

      it('accepts all 4 valid qualityColor values', () => {
        const colors = ['green', 'yellow', 'orange', 'red'] as const;
        for (const color of colors) {
          const payload = { ...validPayload(), qualityColor: color };
          expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
        }
      });

      it('rejects invalid qualityColor (e.g., blue)', () => {
        const payload = { ...validPayload(), qualityColor: 'blue' as unknown as DecisionPayload['qualityColor'] };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('confidence (0-100 like dealQuality)', () => {
      it('accepts boundary values', () => {
        expect(() => DecisionPayloadSchema.parse({ ...validPayload(), confidence: 0 })).not.toThrow();
        expect(() => DecisionPayloadSchema.parse({ ...validPayload(), confidence: 100 })).not.toThrow();
      });

      it('rejects out-of-range', () => {
        expect(() => DecisionPayloadSchema.parse({ ...validPayload(), confidence: -1 })).toThrow();
        expect(() => DecisionPayloadSchema.parse({ ...validPayload(), confidence: 101 })).toThrow();
      });
    });

    describe('ObjectId validation', () => {
      it('accepts Types.ObjectId instance for analysisEventId', () => {
        const payload = { ...validPayload(), analysisEventId: new Types.ObjectId() };
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts valid 24-char hex string for analysisEventId', () => {
        const payload = { ...validPayload(), analysisEventId: '507f1f77bcf86cd799439011' as unknown as Types.ObjectId };
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });

      it('rejects invalid string for analysisEventId', () => {
        const payload = { ...validPayload(), analysisEventId: 'not-an-objectid' as unknown as Types.ObjectId };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects missing analysisEventId (required reference)', () => {
        const payload = validPayload() as unknown as Record<string, unknown>;
        delete payload.analysisEventId;
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });

      it('allows dealId to be omitted (optional reference)', () => {
        const payload = validPayload() as unknown as Record<string, unknown>;
        delete payload.dealId;
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });
    });

    describe('reasoningTrail', () => {
      it('rejects missing primaryInsight', () => {
        const payload = { ...validPayload() };
        (payload.reasoningTrail as { primaryInsight?: string }).primaryInsight = '';
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });

      it('accepts empty arrays for recommendation lists', () => {
        const payload = {
          ...validPayload(),
          reasoningTrail: {
            primaryInsight: 'Some insight',
            strategicRecommendations: [],
            riskMitigation: [],
            opportunityMaximization: [],
            keyRisks: [],
          },
        };
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });
    });

    describe('criticalFlags (optional, score-affecting)', () => {
      it('omitting criticalFlags is fine (no critical failures)', () => {
        const payload = validPayload() as unknown as Record<string, unknown>;
        delete payload.criticalFlags;
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts dscrBelowOne flag with valid shape', () => {
        const payload = {
          ...validPayload(),
          dealQuality: 25, // score capped per events store §3.3.1
          qualityLabel: 'Below professional standards' as const,
          qualityColor: 'red' as const,
          criticalFlags: { dscrBelowOne: { dscrValue: 0.89 } },
        };
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts capRateFarBelowMarket with all 3 valid tier values', () => {
        for (const tier of [1, 2, 3] as const) {
          const payload = {
            ...validPayload(),
            criticalFlags: { capRateFarBelowMarket: { capRate: 0.03, marketMedian: 0.06, tier } },
          };
          expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
        }
      });

      it('rejects invalid tier value (e.g., 4)', () => {
        const payload = {
          ...validPayload(),
          criticalFlags: {
            capRateFarBelowMarket: { capRate: 0.03, marketMedian: 0.06, tier: 4 as unknown as 1 | 2 | 3 },
          },
        };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects unknown fields in criticalFlags (strict)', () => {
        const payload = {
          ...validPayload(),
          criticalFlags: { madeUpFlag: true as unknown as boolean },
        };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('userContext (optional, persona)', () => {
      it('omitting userContext is fine (anonymous interaction)', () => {
        const payload = validPayload() as unknown as Record<string, unknown>;
        delete payload.userContext;
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts partial userContext (just riskTolerance)', () => {
        const payload = { ...validPayload(), userContext: { riskTolerance: 'conservative' as const } };
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts all 5 persona dimensions populated', () => {
        const payload = {
          ...validPayload(),
          userContext: {
            riskTolerance: 'aggressive' as const,
            investmentStrategy: 'appreciation' as const,
            experienceLevel: 'expert' as const,
            investorType: 'lender' as const,
            primaryGoal: 'tax_optimization' as const,
          },
        };
        expect(() => DecisionPayloadSchema.parse(payload)).not.toThrow();
      });

      it('rejects invalid riskTolerance value', () => {
        const payload = {
          ...validPayload(),
          userContext: { riskTolerance: 'opportunistic' as unknown as 'conservative' },
        };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects invalid investorType value', () => {
        const payload = {
          ...validPayload(),
          userContext: { investorType: 'institutional' as unknown as 'retail' },
        };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects unknown fields in userContext (strict)', () => {
        const payload = {
          ...validPayload(),
          userContext: { madeUpField: 'foo' as unknown as undefined },
        };
        expect(() => DecisionPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('deliberate omission — no verdict field', () => {
      it("doesn't reject a payload that LACKS verdict (verdict is intentionally not in the schema)", () => {
        // The valid payload doesn't have verdict; it parses fine.
        expect(() => DecisionPayloadSchema.parse(validPayload())).not.toThrow();
      });

      it("silently strips a `verdict` field if accidentally added (Zod non-strict default)", () => {
        // If application code accidentally passes `verdict: 'BUY'`, Zod drops it.
        // This is by design — the events store should never accumulate verdict-tagged decisions.
        const payloadWithVerdict = { ...validPayload(), verdict: 'BUY' };
        const result = DecisionPayloadSchema.parse(payloadWithVerdict);
        expect((result as unknown as { verdict?: string }).verdict).toBeUndefined();
      });
    });
  });

  // ===== Mongoose discriminator =====

  describe('DecisionEventModel (discriminator)', () => {
    const validEnvelope = () => ({
      traceId: 'test-trace-decision-1',
      eventVersion: 1,
      actorType: 'tool:score_deal' as const,
      userId: new Types.ObjectId(),
      payload: validPayload(),
    });

    it('creates a DecisionEvent with valid payload', async () => {
      const event = await DecisionEventModel.create(validEnvelope());
      expect(event.get('eventType')).toBe('decision');
      expect(event.get('payload').dealQuality).toBe(67);
      expect(event.get('payload').qualityLabel).toBe('Meets professional standards');
    });

    it('stores DecisionEvent in the unified events collection', async () => {
      await DecisionEventModel.create(validEnvelope());
      expect(DecisionEventModel.collection.name).toBe('events');
      const rawDocs = await mongoose.connection.db.collection('events').find({}).toArray();
      expect(rawDocs).toHaveLength(1);
      expect(rawDocs[0].eventType).toBe('decision');
    });

    it('inherits append-only enforcement on updateOne', async () => {
      const event = await DecisionEventModel.create(validEnvelope());
      await expect(
        DecisionEventModel.updateOne({ _id: event._id }, { 'payload.dealQuality': 80 })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('inherits append-only enforcement on document save() of existing', async () => {
      const event = await DecisionEventModel.create(validEnvelope());
      event.set('payload.dealQuality', 80);
      await expect(event.save()).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('preserves full payload structure through round-trip read', async () => {
      await DecisionEventModel.create(validEnvelope());
      const found = await DecisionEventModel.findOne({});
      const payload = found?.get('payload');

      expect(payload.dealQuality).toBe(67);
      expect(payload.qualityLabel).toBe('Meets professional standards');
      expect(payload.qualityColor).toBe('yellow');
      expect(payload.professionalAssessment.cashFlowScore).toBe(60);
      expect(payload.marketPosition.walkAwayPrice).toBe(385000);
      expect(payload.reasoningTrail.strategicRecommendations).toHaveLength(2);
      expect(payload.scoringWeightsUsed.cashFlow).toBe(0.35);
      expect(payload.userContext.riskTolerance).toBe('moderate');
    });

    it('supports multiple DecisionEvents for the same dealId (decision history)', async () => {
      const userId = new Types.ObjectId();
      const dealId = new Types.ObjectId();

      // Original decision
      await DecisionEventModel.create({
        ...validEnvelope(),
        userId,
        payload: { ...validPayload(), dealId, dealQuality: 67 },
      });

      // Re-scoring after override
      await DecisionEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: 'test-trace-decision-2',
        payload: {
          ...validPayload(),
          dealId,
          dealQuality: 72,
          qualityLabel: 'Meets professional standards',
          qualityColor: 'yellow',
        },
      });

      const events = await DecisionEventModel.find({ 'payload.dealId': dealId }).sort({
        timestamp: 1,
      });
      expect(events).toHaveLength(2);
      expect(events[0].get('payload').dealQuality).toBe(67);
      expect(events[1].get('payload').dealQuality).toBe(72);
    });
  });
});
