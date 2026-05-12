/**
 * W1-S2 part 2 acceptance test — AnalysisEvent payload schema + discriminator.
 *
 * Tests both the Zod runtime validation surface AND the Mongoose
 * discriminator. Uses mongodb-memory-server (per project policy).
 *
 * Note on the shallow-runtime-validation strategy: the test does NOT
 * deeply validate every field of propertyData / marketData / metrics /
 * etc. The Zod schema only checks "is it a non-null object?" for those
 * fields. Deep type safety lives at the TS layer via the existing
 * SFRData / MultiFamilyData / MarketDataResponse types — application
 * code is responsible for constructing well-typed payloads.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  AnalysisEventModel,
  AnalysisPayloadSchema,
  AnalysisPayload,
} from '../AnalysisEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

/**
 * Builds a representative valid AnalysisPayload. Uses real-shaped sample
 * data for propertyData / marketData / metrics / monthlyAnalysis /
 * longTermAnalysis — these fields are stored as Mixed (Zod treats them
 * as opaque objects), but the test fixture uses realistic shapes so
 * round-trip storage is exercised on representative data sizes.
 */
function validPayload(): AnalysisPayload {
  return {
    propertyData: {
      propertyType: 'SFR',
      propertyAddress: {
        street: '1837 Walnut Way',
        city: 'Anna',
        state: 'TX',
        zipCode: '75409',
      },
      purchasePrice: 425000,
      downPayment: 85000,
      closingCosts: 8500,
      monthlyRent: 2400,
      yearBuilt: 2018,
      squareFootage: 2100,
      // ... other fields omitted; payload tolerates extras
    } as unknown as AnalysisPayload['propertyData'],

    marketData: {
      property: { dataSource: 'rentcast' },
      comparables: [],
      marketTrends: { averageRent: 2350, rentGrowthRate: 0.04 },
      economicIndicators: { mortgageRate30Yr: 6.8 },
      location: { city: 'Anna', state: 'TX', zipCode: '75409' },
      lastUpdated: new Date(),
      dataSource: ['rentcast'],
      cacheKey: 'test-cache-key',
    } as unknown as AnalysisPayload['marketData'],

    assumptions: {
      vacancyRate: 0.05,
      maintenanceRate: 0.01,
      managementRate: 0.08,
      projectionYears: 10,
      annualRentIncrease: 0.03,
      annualPropertyValueIncrease: 0.04,
    },

    metrics: {
      capRate: 5.2,
      cashOnCashReturn: 4.1,
      irr: 0.092,
      dscr: 1.18,
      noi: 22100,
      // ... other metric fields omitted
    } as unknown as AnalysisPayload['metrics'],

    monthlyAnalysis: {
      income: { gross: 2400, effective: 2280 },
      expenses: {
        propertyTax: 354,
        insurance: 142,
        maintenance: 200,
        propertyManagement: 192,
        vacancy: 120,
        total: 1008,
      },
      cashFlow: -120,
    },

    longTermAnalysis: {
      yearlyProjections: [],
      projectionYears: 10,
      returns: { irr: 0.092, totalReturn: 95000 },
    },

    walkAwayPrice: 385000,
    enrichmentSource: 'rentcast',
    enrichmentCacheHit: false,
    engineVersion: 'v3.0',
    computeTimeMs: 142,
  };
}

describe('AnalysisEvent (W1-S2 part 2)', () => {
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

  describe('AnalysisPayloadSchema (runtime validation)', () => {
    it('parses a representative valid payload', () => {
      expect(() => AnalysisPayloadSchema.parse(validPayload())).not.toThrow();
    });

    it('rejects payload missing propertyData', () => {
      const payload = validPayload() as unknown as Record<string, unknown>;
      delete payload.propertyData;
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('rejects payload missing metrics', () => {
      const payload = validPayload() as unknown as Record<string, unknown>;
      delete payload.metrics;
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('rejects payload missing walkAwayPrice', () => {
      const payload = validPayload() as unknown as Record<string, unknown>;
      delete payload.walkAwayPrice;
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('rejects non-numeric walkAwayPrice', () => {
      const payload = { ...validPayload(), walkAwayPrice: 'not a number' as unknown as number };
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('rejects infinite walkAwayPrice (must be finite)', () => {
      const payload = { ...validPayload(), walkAwayPrice: Infinity };
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('rejects invalid enrichmentSource enum value', () => {
      const payload = { ...validPayload(), enrichmentSource: 'attom' as unknown as 'rentcast' };
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('accepts all 5 valid enrichmentSource values', () => {
      const validSources = ['rentcast', 'fred', 'census', 'fallback', 'composite'] as const;
      for (const source of validSources) {
        const payload = { ...validPayload(), enrichmentSource: source };
        expect(() => AnalysisPayloadSchema.parse(payload)).not.toThrow();
      }
    });

    it('rejects negative computeTimeMs', () => {
      const payload = { ...validPayload(), computeTimeMs: -10 };
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('accepts computeTimeMs of 0', () => {
      const payload = { ...validPayload(), computeTimeMs: 0 };
      expect(() => AnalysisPayloadSchema.parse(payload)).not.toThrow();
    });

    it('rejects empty engineVersion', () => {
      const payload = { ...validPayload(), engineVersion: '' };
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('rejects null for required nested object fields (propertyData)', () => {
      const payload = { ...validPayload(), propertyData: null as unknown as AnalysisPayload['propertyData'] };
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('rejects array for required nested object fields (propertyData)', () => {
      const payload = { ...validPayload(), propertyData: [] as unknown as AnalysisPayload['propertyData'] };
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });

    it('rejects non-boolean enrichmentCacheHit', () => {
      const payload = { ...validPayload(), enrichmentCacheHit: 'true' as unknown as boolean };
      expect(() => AnalysisPayloadSchema.parse(payload)).toThrow();
    });
  });

  // ===== Mongoose discriminator =====

  describe('AnalysisEventModel (discriminator)', () => {
    const validEnvelope = () => ({
      traceId: 'test-trace-analysis-1',
      eventVersion: 1,
      actorType: 'tool:score_deal' as const,
      userId: new mongoose.Types.ObjectId(),
      payload: validPayload(),
    });

    it('creates an AnalysisEvent with valid payload', async () => {
      const event = await AnalysisEventModel.create(validEnvelope());
      expect(event.get('eventType')).toBe('analysis');
      expect(event.get('payload').walkAwayPrice).toBe(385000);
      expect(event.get('payload').enrichmentSource).toBe('rentcast');
    });

    it('stores AnalysisEvent in the unified events collection', async () => {
      await AnalysisEventModel.create(validEnvelope());
      expect(AnalysisEventModel.collection.name).toBe('events');

      const rawDocs = await mongoose.connection.db.collection('events').find({}).toArray();
      expect(rawDocs).toHaveLength(1);
      expect(rawDocs[0].eventType).toBe('analysis');
    });

    it('requires payload field', async () => {
      const input = validEnvelope() as Record<string, unknown>;
      delete input.payload;
      await expect(AnalysisEventModel.create(input)).rejects.toThrow();
    });

    it('inherits base envelope validation (rejects missing traceId)', async () => {
      const input = validEnvelope() as Record<string, unknown>;
      delete input.traceId;
      await expect(AnalysisEventModel.create(input)).rejects.toThrow();
    });

    it('inherits append-only enforcement on updateOne', async () => {
      const event = await AnalysisEventModel.create(validEnvelope());
      await expect(
        AnalysisEventModel.updateOne({ _id: event._id }, { 'payload.walkAwayPrice': 400000 })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('inherits append-only enforcement on deleteOne', async () => {
      const event = await AnalysisEventModel.create(validEnvelope());
      await expect(AnalysisEventModel.deleteOne({ _id: event._id })).rejects.toThrow(
        APPEND_ONLY_ERROR
      );
    });

    it('inherits append-only enforcement on document save() of existing event', async () => {
      const event = await AnalysisEventModel.create(validEnvelope());
      event.set('payload.walkAwayPrice', 400000);
      await expect(event.save()).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('preserves payload structure through round-trip read (heavy nested objects)', async () => {
      await AnalysisEventModel.create(validEnvelope());
      const found = await AnalysisEventModel.findOne({});

      expect(found).toBeDefined();
      const payload = found?.get('payload');
      expect(payload.walkAwayPrice).toBe(385000);
      expect(payload.enrichmentSource).toBe('rentcast');
      expect(payload.propertyData.propertyType).toBe('SFR');
      expect(payload.propertyData.propertyAddress.city).toBe('Anna');
      expect(payload.metrics.capRate).toBe(5.2);
      expect(payload.monthlyAnalysis.cashFlow).toBe(-120);
      expect(payload.longTermAnalysis.projectionYears).toBe(10);
    });

    it('supports multiple AnalysisEvents for the same deal (re-analysis after override)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const traceId1 = 'test-trace-analysis-original';
      const traceId2 = 'test-trace-analysis-after-override';

      await AnalysisEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: traceId1,
      });

      // Simulate a re-analysis after override (different walkAwayPrice etc.)
      await AnalysisEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: traceId2,
        payload: { ...validPayload(), walkAwayPrice: 395000 },
      });

      const events = await AnalysisEventModel.find({ userId }).sort({ timestamp: 1 });
      expect(events).toHaveLength(2);
      expect(events[0].get('payload').walkAwayPrice).toBe(385000);
      expect(events[1].get('payload').walkAwayPrice).toBe(395000);
    });

    it('rejects payload missing computeTimeMs (Zod validation expected at repo layer)', async () => {
      // Note: this test demonstrates that Mongoose Mixed accepts ANY object —
      // it does NOT enforce the Zod schema. The repository layer (W1-S3) is
      // responsible for calling Zod parse before passing to Mongoose.
      // This test confirms that bypassing Zod (writing directly to model)
      // lets through payloads that Zod would reject.
      const invalidPayload = { ...validPayload() } as Record<string, unknown>;
      delete invalidPayload.computeTimeMs;
      const event = await AnalysisEventModel.create({
        ...validEnvelope(),
        payload: invalidPayload,
      });
      // It was accepted by Mongoose (Mixed allows anything) — but Zod would reject.
      expect(event).toBeDefined();
      expect(() => AnalysisPayloadSchema.parse(invalidPayload)).toThrow();
    });
  });
});
