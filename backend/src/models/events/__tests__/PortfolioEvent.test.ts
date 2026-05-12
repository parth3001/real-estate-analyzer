/**
 * W1-S2 part 10 — PortfolioEvent acceptance tests.
 * Discriminated union on `subType` — 7 portfolio actions.
 * Wave 1 schema; capture lights up in wave 1.5.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PortfolioEventModel, PortfolioPayloadSchema, PortfolioPayload } from '../PortfolioEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('PortfolioEvent (W1-S2 part 10)', () => {
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

  describe('Discriminated union — Zod parses all 7 subTypes', () => {
    it('parses portfolio_created', () => {
      const payload: PortfolioPayload = {
        subType: 'portfolio_created',
        portfolioId: new Types.ObjectId(),
        goals: { primaryGoal: 'cash_flow', riskTolerance: 'moderate' },
      };
      expect(() => PortfolioPayloadSchema.parse(payload)).not.toThrow();
    });

    it('parses property_added with ownershipPct in range', () => {
      const payload: PortfolioPayload = {
        subType: 'property_added',
        portfolioId: new Types.ObjectId(),
        dealId: new Types.ObjectId(),
        ownershipPct: 100,
      };
      expect(() => PortfolioPayloadSchema.parse(payload)).not.toThrow();
    });

    it('parses property_added with partial ownership', () => {
      const payload: PortfolioPayload = {
        subType: 'property_added',
        portfolioId: new Types.ObjectId(),
        dealId: new Types.ObjectId(),
        ownershipPct: 33.3,
      };
      expect(() => PortfolioPayloadSchema.parse(payload)).not.toThrow();
    });

    it('rejects ownershipPct > 100', () => {
      const payload = {
        subType: 'property_added' as const,
        portfolioId: new Types.ObjectId(),
        dealId: new Types.ObjectId(),
        ownershipPct: 150,
      };
      expect(() => PortfolioPayloadSchema.parse(payload)).toThrow();
    });

    it('parses property_removed', () => {
      const payload: PortfolioPayload = {
        subType: 'property_removed',
        portfolioId: new Types.ObjectId(),
        dealId: new Types.ObjectId(),
      };
      expect(() => PortfolioPayloadSchema.parse(payload)).not.toThrow();
    });

    it('parses goal_updated with old + new goals', () => {
      const payload: PortfolioPayload = {
        subType: 'goal_updated',
        portfolioId: new Types.ObjectId(),
        oldGoals: { primaryGoal: 'cash_flow' },
        newGoals: { primaryGoal: 'wealth_building' },
      };
      expect(() => PortfolioPayloadSchema.parse(payload)).not.toThrow();
    });

    it('parses analytics_recalculated with all 3 trigger types', () => {
      for (const trigger of ['property_change', 'manual', 'scheduled'] as const) {
        const payload: PortfolioPayload = {
          subType: 'analytics_recalculated',
          portfolioId: new Types.ObjectId(),
          trigger,
          durationMs: 142,
        };
        expect(() => PortfolioPayloadSchema.parse(payload)).not.toThrow();
      }
    });

    it('parses ai_insight_generated with all 3 insight types', () => {
      for (const insightType of ['health_check', 'peer_comparison', 'goal_path'] as const) {
        const payload: PortfolioPayload = {
          subType: 'ai_insight_generated',
          portfolioId: new Types.ObjectId(),
          insightType,
          tokenCost: 0.04,
        };
        expect(() => PortfolioPayloadSchema.parse(payload)).not.toThrow();
      }
    });

    it('parses recommendation_viewed', () => {
      const payload: PortfolioPayload = {
        subType: 'recommendation_viewed',
        portfolioId: new Types.ObjectId(),
        recommendationId: new Types.ObjectId(),
      };
      expect(() => PortfolioPayloadSchema.parse(payload)).not.toThrow();
    });

    it('rejects unknown subType', () => {
      const payload = {
        subType: 'rebalanced',
        portfolioId: new Types.ObjectId(),
      } as unknown as PortfolioPayload;
      expect(() => PortfolioPayloadSchema.parse(payload)).toThrow();
    });

    it('rejects portfolio_created missing goals (subType-specific requirement)', () => {
      const payload = {
        subType: 'portfolio_created',
        portfolioId: new Types.ObjectId(),
      } as unknown as PortfolioPayload;
      expect(() => PortfolioPayloadSchema.parse(payload)).toThrow();
    });
  });

  describe('Mongoose discriminator', () => {
    it('creates a PortfolioEvent in events collection', async () => {
      const event = await PortfolioEventModel.create({
        traceId: 'test-portfolio-1',
        eventVersion: 1,
        actorType: 'system',
        userId: new Types.ObjectId(),
        payload: {
          subType: 'portfolio_created',
          portfolioId: new Types.ObjectId(),
          goals: { primaryGoal: 'cash_flow' },
        },
      });
      expect(event.get('eventType')).toBe('portfolio');
      expect(event.get('payload').subType).toBe('portfolio_created');
    });

    it('inherits append-only', async () => {
      const event = await PortfolioEventModel.create({
        traceId: 'test-portfolio-2',
        eventVersion: 1,
        actorType: 'system',
        userId: new Types.ObjectId(),
        payload: {
          subType: 'property_added',
          portfolioId: new Types.ObjectId(),
          dealId: new Types.ObjectId(),
          ownershipPct: 100,
        },
      });
      await expect(
        PortfolioEventModel.updateOne({ _id: event._id }, { 'payload.ownershipPct': 50 })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });
  });
});
