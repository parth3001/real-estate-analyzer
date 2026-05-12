/**
 * W1-S2 part 9 — OutcomeEvent acceptance tests.
 *
 * Schema ships wave 1; capture pipeline deferred. Tests verify the
 * shape is correct so when capture activates (B2B LOS integration,
 * follow-up surveys), the model is ready.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { OutcomeEventModel, OutcomePayloadSchema, OutcomePayload } from '../OutcomeEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

function validPayload(): OutcomePayload {
  return {
    dealId: new Types.ObjectId(),
    originalDecisionId: new Types.ObjectId(),
    outcome: 'closed',
    outcomeDate: new Date('2026-03-15'),
    reportedBy: 'self',
    financialDelta: {
      actualVsProjectedNOI: -1200,
      actualVsProjectedCashFlow: -100,
      holdingPeriodMonths: 18,
      exitIRR: 0.087,
    },
  };
}

describe('OutcomeEvent (W1-S2 part 9)', () => {
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
    it('parses valid closed-outcome payload', () => {
      expect(() => OutcomePayloadSchema.parse(validPayload())).not.toThrow();
    });

    it('accepts all 5 outcome values', () => {
      const outcomes = ['closed', 'passed', 'walked', 'fell_through', 'defaulted'] as const;
      for (const outcome of outcomes) {
        expect(() => OutcomePayloadSchema.parse({ ...validPayload(), outcome })).not.toThrow();
      }
    });

    it('rejects invalid outcome value', () => {
      expect(() =>
        OutcomePayloadSchema.parse({ ...validPayload(), outcome: 'maybe' as unknown as 'closed' })
      ).toThrow();
    });

    it('accepts all 3 reportedBy values', () => {
      for (const reportedBy of ['self', 'b2b_los_integration', 'survey_followup'] as const) {
        expect(() => OutcomePayloadSchema.parse({ ...validPayload(), reportedBy })).not.toThrow();
      }
    });

    it('coerces ISO-string outcomeDate to Date', () => {
      const payload = { ...validPayload(), outcomeDate: '2026-03-15T00:00:00Z' as unknown as Date };
      const parsed = OutcomePayloadSchema.parse(payload);
      expect(parsed.outcomeDate).toBeInstanceOf(Date);
    });

    it('allows financialDelta to be omitted (defaulted outcome with no financial data)', () => {
      const payload = {
        dealId: new Types.ObjectId(),
        originalDecisionId: new Types.ObjectId(),
        outcome: 'defaulted' as const,
        outcomeDate: new Date(),
        reportedBy: 'b2b_los_integration' as const,
      };
      expect(() => OutcomePayloadSchema.parse(payload)).not.toThrow();
    });

    it('rejects negative holdingPeriodMonths', () => {
      const payload = {
        ...validPayload(),
        financialDelta: { holdingPeriodMonths: -1 },
      };
      expect(() => OutcomePayloadSchema.parse(payload)).toThrow();
    });

    it('rejects negative salePrice', () => {
      const payload = {
        ...validPayload(),
        financialDelta: { salePrice: -50000 },
      };
      expect(() => OutcomePayloadSchema.parse(payload)).toThrow();
    });

    it('allows negative IRR (deal lost money — legitimate outcome)', () => {
      const payload = {
        ...validPayload(),
        outcome: 'defaulted' as const,
        financialDelta: { exitIRR: -0.05 },
      };
      expect(() => OutcomePayloadSchema.parse(payload)).not.toThrow();
    });
  });

  describe('Mongoose discriminator', () => {
    it('creates an OutcomeEvent in events collection', async () => {
      const event = await OutcomeEventModel.create({
        traceId: 'test-outcome-1',
        eventVersion: 1,
        actorType: 'system',
        userId: new Types.ObjectId(),
        payload: validPayload(),
      });
      expect(event.get('eventType')).toBe('outcome');
    });

    it('inherits append-only', async () => {
      const event = await OutcomeEventModel.create({
        traceId: 'test-outcome-2',
        eventVersion: 1,
        actorType: 'system',
        userId: new Types.ObjectId(),
        payload: validPayload(),
      });
      await expect(
        OutcomeEventModel.updateOne({ _id: event._id }, { 'payload.outcome': 'passed' })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('demonstrates the outcome-validated calibration query pattern', async () => {
      // The Tier 3 moat pattern per events store doc:
      // "Of all BUY-band decisions, what percentage closed vs defaulted?"
      // This query becomes the engine's long-horizon validation signal.
      const userId = new Types.ObjectId();
      const outcomes: Array<OutcomePayload['outcome']> = [
        'closed',
        'closed',
        'closed',
        'closed',
        'defaulted',
      ];
      for (let i = 0; i < outcomes.length; i++) {
        await OutcomeEventModel.create({
          traceId: `outcome-batch-${i}`,
          eventVersion: 1,
          actorType: 'system',
          userId,
          payload: { ...validPayload(), outcome: outcomes[i] },
        });
      }

      const result = await OutcomeEventModel.aggregate([
        { $match: { userId } },
        { $group: { _id: '$payload.outcome', count: { $sum: 1 } } },
      ]);

      const byOutcome = Object.fromEntries(result.map((r) => [r._id, r.count]));
      expect(byOutcome.closed).toBe(4);
      expect(byOutcome.defaulted).toBe(1);
      // 80% close rate — long-horizon calibration signal
    });
  });
});
