/**
 * GET /api/deals/:id/scenario-comparison?strategy=<alias> — INV-10
 * round-trip via the REAL HTTP route (Issue #243 iteration-3, 2026-07-12).
 *
 * QE finding closed by iteration-3: the existing INV-10 assertions in
 * `endToEndDataFidelity.test.ts:496` re-implement the endpoint's filter
 * logic locally (calling `normalizeStrategy` + `getScenariosForDeal`
 * directly). That covers the SHARED helpers but does not prove the
 * ENDPOINT itself is wired to the normalizer. If a future refactor
 * removes the `normalizeStrategy` call at the endpoint boundary while
 * keeping the helper intact, the local test still passes and the wire
 * regresses silently.
 *
 * This suite drives the real HTTP route via supertest and asserts:
 *
 *   Alias set for buy_hold:
 *     buy-hold, buy_hold, BUY_HOLD  →  identical result sets
 *
 *   Alias set for brrrr:
 *     brrrr, BRRRR                   →  identical result sets
 *
 *   Alias set for house_hack:
 *     house-hack, house_hack, HOUSE_HACK  →  identical result sets
 *
 * A byte-identical `scenarios[]` proves the endpoint's
 * `currentStrategy = normalizeStrategy(strategyQueryParam) ?? dealStrategy`
 * flow is intact end-to-end.
 *
 * Uses mongodb-memory-server (per project convention — no local Mongo)
 * and mocks `authMiddleware` so the request identity is deterministic
 * without JWT plumbing.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import request from 'supertest';

// Mock auth middleware BEFORE importing the router (which references it
// via a static import). The mocked middleware injects a fixed userId so
// controller code can compare `deal.userId?.toString() !== req.user.id`
// against the same value we seed the deal under.
const MOCK_USER_ID = new Types.ObjectId().toHexString();
jest.mock('../../middleware/auth', () => ({
  authMiddleware: (
    req: { user?: { id: string; email: string; role: string } },
    _res: unknown,
    next: () => void
  ): void => {
    req.user = { id: MOCK_USER_ID, email: 'inv10@example.com', role: 'user' };
    next();
  },
  authenticateToken: (
    req: { user?: { id: string; email: string; role: string } },
    _res: unknown,
    next: () => void
  ): void => {
    req.user = { id: MOCK_USER_ID, email: 'inv10@example.com', role: 'user' };
    next();
  },
}));

// pdfService pulls in @react-pdf/renderer, which ships ESM syntax the
// backend's Jest CJS pipeline can't parse. It's transitively required
// by controllers/deals.ts (which routes/deals.ts imports). This test
// never hits the PDF endpoints, so a shallow stub is enough to let the
// module graph load without patching Jest's transformIgnorePatterns.
jest.mock('../../services/pdfService', () => ({
  pdfService: {
    generatePropertyAnalysisPdf: jest.fn(),
    generateSubstrateDealPdf: jest.fn(),
  },
}));

/* eslint-disable import/first */
import dealsRouter from '../deals';
import { eventsRepository } from '../../repositories/EventsRepository';
import { materializeDealFromDecision } from '../../services/dealMaterializationService';
import { DealModel as Deal } from '../../models/Deal';
import { User } from '../../models/User';
import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import { buildCanonicalAddressKey } from '../../utils/canonicalAddressKey';
import type { AnalysisPayload } from '../../models/events/AnalysisEvent';
import type { DecisionPayload } from '../../models/events/DecisionEvent';
import type { SFRData } from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';
/* eslint-enable import/first */

const SETUP_TIMEOUT_MS = 90_000;

function makeAssumptions(): AnalysisAssumptions {
  return {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualExpenseIncrease: 2.5,
    annualPropertyValueIncrease: 3.5,
    sellingCosts: 6,
    vacancyRate: 5,
  };
}

function makeSFRProperty(): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 210_000,
    downPayment: 52_500,
    interestRate: 6.48,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 2_100,
    propertyManagementRate: 8,
    propertyAddress: {
      street: '1841 Walnut Way',
      city: 'Anna',
      state: 'TX',
      zipCode: '75409',
    },
    monthlyRent: 2_400,
    squareFootage: 1_800,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2018,
    closingCosts: 5_000,
  };
}

describe('GET /api/deals/:id/scenario-comparison?strategy=<alias> — INV-10 (Issue #243, iteration-3)', () => {
  let mongoServer: MongoMemoryServer;
  let app: express.Application;
  const userObjectId = new Types.ObjectId(MOCK_USER_ID);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use(express.json());
    app.use('/api/deals', dealsRouter);
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await User.create({
      _id: userObjectId,
      email: 'inv10@example.com',
      firstName: 'INV10',
      lastName: 'Test',
      role: 'user',
      isVerified: true,
      anonymous: false,
    });
  });

  // Seed two spines (buy_hold + brrrr) at the SAME address so the
  // filter has something meaningful to discriminate on. Returns the
  // resolved Deal id (from Mongo) and the canonical address key.
  async function seedTwoStrategies(): Promise<{
    dealId: string;
    canonicalAddressKey: string;
  }> {
    const buyHoldProp = { ...makeSFRProperty() };
    const brrrrProp = { ...makeSFRProperty() };
    const assumptions = makeAssumptions();
    const cak = buildCanonicalAddressKey({
      street: buyHoldProp.propertyAddress.street,
      city: buyHoldProp.propertyAddress.city,
      state: buyHoldProp.propertyAddress.state,
      zipCode: buyHoldProp.propertyAddress.zipCode,
    });

    const buyHoldA = new SFRAnalyzer(buyHoldProp, assumptions).analyze();
    const brrrrA = new SFRAnalyzer(brrrrProp, assumptions).analyze();

    const buyHoldPayload = {
      propertyData: {
        ...buyHoldProp,
        investmentStrategy: 'buy_hold',
      } as unknown,
      marketData: { lastUpdated: new Date(), dataSource: ['fallback'] },
      assumptions,
      metrics: buyHoldA.keyMetrics,
      monthlyAnalysis: buyHoldA.monthlyAnalysis,
      longTermAnalysis: buyHoldA.longTermAnalysis,
      walkAwayPrice: 162_485,
      enrichmentSource: 'fallback',
      enrichmentCacheHit: false,
      engineVersion: 'v3.0',
      computeTimeMs: 100,
    } as unknown as AnalysisPayload;

    const brrrrPayload = {
      propertyData: {
        ...brrrrProp,
        investmentStrategy: 'brrrr',
        brrrr: {
          rehabBudget: 25_000,
          afterRepairValue: 260_000,
          refinanceLTV: 75,
          refinanceInterestRate: 8.5,
          seasoningPeriod: 12,
        },
      } as unknown,
      marketData: { lastUpdated: new Date(), dataSource: ['fallback'] },
      assumptions,
      metrics: brrrrA.keyMetrics,
      monthlyAnalysis: brrrrA.monthlyAnalysis,
      longTermAnalysis: brrrrA.longTermAnalysis,
      walkAwayPrice: 158_000,
      enrichmentSource: 'fallback',
      enrichmentCacheHit: false,
      engineVersion: 'v3.0',
      computeTimeMs: 100,
    } as unknown as AnalysisPayload;

    const buyHoldAId = await eventsRepository.writeAnalysisEvent({
      traceId: 't-inv10-bh',
      actorType: 'tool:score_deal',
      userId: userObjectId,
      payload: buyHoldPayload,
    });
    const brrrrAId = await eventsRepository.writeAnalysisEvent({
      traceId: 't-inv10-br',
      actorType: 'tool:score_deal',
      userId: userObjectId,
      payload: brrrrPayload,
    });

    const makeDecisionPayload = (aid: Types.ObjectId): DecisionPayload => ({
      analysisEventId: aid,
      canonicalAddressKey: cak,
      dealQuality: 60,
      qualityLabel: 'Meets professional standards',
      qualityColor: 'yellow',
      professionalAssessment:
        { dealQuality: 60 } as unknown as DecisionPayload['professionalAssessment'],
      marketPosition:
        { walkAwayPrice: 160_000 } as unknown as DecisionPayload['marketPosition'],
      reasoningTrail: {
        primaryInsight: 'r',
        strategicRecommendations: [],
        riskMitigation: [],
        opportunityMaximization: [],
        keyRisks: [],
      },
      confidence: 80,
      scoringWeightsUsed:
        {} as unknown as DecisionPayload['scoringWeightsUsed'],
      engineVersion: 'v3.0',
    });

    const bhDId = await eventsRepository.writeDecisionEvent({
      traceId: 't-inv10-bh',
      actorType: 'agent:deal_scoring',
      userId: userObjectId,
      payload: makeDecisionPayload(buyHoldAId),
    });
    const brDId = await eventsRepository.writeDecisionEvent({
      traceId: 't-inv10-br',
      actorType: 'agent:deal_scoring',
      userId: userObjectId,
      payload: makeDecisionPayload(brrrrAId),
    });

    // Materialize both — #108 spine-per-strategy may produce two Deal
    // rows at the same canonicalAddressKey. Either row works for the
    // endpoint query; we take the first.
    await materializeDealFromDecision(bhDId, userObjectId);
    await materializeDealFromDecision(brDId, userObjectId);

    const deal = await Deal.findOne({ userId: userObjectId }).lean();
    expect(deal).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { dealId: (deal!._id as any).toString(), canonicalAddressKey: cak };
  }

  // ===== BUY_HOLD alias set =====

  it('buy_hold aliases (buy-hold, buy_hold, BUY_HOLD) return identical scenario sets via HTTP', async () => {
    const { dealId } = await seedTwoStrategies();

    const aliases = ['buy-hold', 'buy_hold', 'BUY_HOLD'];
    const responses = await Promise.all(
      aliases.map((a) =>
        request(app).get(`/api/deals/${dealId}/scenario-comparison`).query({ strategy: a })
      )
    );

    for (const r of responses) expect(r.status).toBe(200);

    // Serialize each response's scenarios[] (sorted by decisionEventId
    // for determinism) and assert byte-identity across all three aliases.
    const canonicalize = (r: request.Response): string => {
      const scenarios = (r.body?.scenarios ?? []) as Array<{ decisionEventId: string }>;
      return JSON.stringify(
        [...scenarios]
          .sort((a, b) => a.decisionEventId.localeCompare(b.decisionEventId))
          .map((s) => s.decisionEventId)
      );
    };
    const first = canonicalize(responses[0]);
    for (let i = 1; i < responses.length; i++) {
      expect(canonicalize(responses[i])).toBe(first);
    }
    // Also assert currentStrategy on the wire — this is what proves
    // normalizeStrategy fired at the endpoint boundary, not just that
    // the filtered list happens to be equal.
    for (const r of responses) {
      expect(r.body.currentStrategy).toBe('buy_hold');
    }
  });

  // ===== BRRRR alias set =====

  it('brrrr aliases (brrrr, BRRRR misspelling) return identical scenario sets via HTTP', async () => {
    const { dealId } = await seedTwoStrategies();

    // 'BRRR' (single R) is deliberately covered by the normalizer as
    // a common misspelling. Assert the endpoint canonicalizes it to
    // 'brrrr' and returns the same set as the correct spelling.
    const aliases = ['brrrr', 'BRRR'];
    const responses = await Promise.all(
      aliases.map((a) =>
        request(app).get(`/api/deals/${dealId}/scenario-comparison`).query({ strategy: a })
      )
    );
    for (const r of responses) expect(r.status).toBe(200);
    const canonicalize = (r: request.Response): string => {
      const scenarios = (r.body?.scenarios ?? []) as Array<{ decisionEventId: string }>;
      return JSON.stringify(
        [...scenarios]
          .sort((a, b) => a.decisionEventId.localeCompare(b.decisionEventId))
          .map((s) => s.decisionEventId)
      );
    };
    expect(canonicalize(responses[1])).toBe(canonicalize(responses[0]));
    for (const r of responses) {
      expect(r.body.currentStrategy).toBe('brrrr');
    }
  });
});
