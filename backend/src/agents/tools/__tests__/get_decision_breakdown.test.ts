/**
 * Task #31 acceptance test — tool:get_decision_breakdown.
 *
 * Verifies the four things that matter for a confabulation-killing
 * read tool:
 *
 *   1. Contract conformance (invokeLLM: false, no side effects,
 *      stable name) — the registry / orchestrator depends on these.
 *   2. The output reproduces the engine's actual monthly breakdown —
 *      every line item the agent might narrate from is wired through
 *      to the AnalysisEvent it lives in.
 *   3. Orphan / missing AnalysisEvent throws — the agent should NEVER
 *      receive a null-shaped breakdown that it could then confabulate
 *      around. Loud failure is the only safe behavior.
 *   4. Reconciliation invariant — total expenses + cash flow add back
 *      to effective rent (within rounding). If this ever fails, the
 *      tool is selecting the wrong fields and the audit trail it
 *      surfaces will not reconcile (which IS the bug that motivated
 *      this whole tool).
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import { getDecisionBreakdown } from '../get_decision_breakdown';
import type { ToolContext } from '../types';
import type { DecisionPayload } from '../../../models/events/DecisionEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('tool:get_decision_breakdown (Task #31)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

  function makeCtx(userId: Types.ObjectId, traceId = 'trace-bd'): ToolContext {
    return {
      traceId,
      userId,
      eventsRepo: writes,
      eventsReads: reads,
      tools: {},
    };
  }

  /**
   * Seed a realistic SFR decision matching the 1837 Walnut Way fixture
   * the manual test used: $205K @ 6.48% / 25% down, $1,800/mo rent,
   * known operating-expense line items, ~-$116 monthly cash flow.
   *
   * Numbers chosen so the reconciliation assertion below is meaningful
   * — total expenses + cash flow should equal effective rent.
   */
  async function seedRealisticDecision(userId: Types.ObjectId): Promise<{
    decisionEventId: Types.ObjectId;
    analysisEventId: Types.ObjectId;
  }> {
    const analysisEventId = await writes.writeAnalysisEvent({
      traceId: 'seed-bd',
      actorType: 'tool:score_deal',
      userId,
      payload: {
        propertyData: {
          propertyType: 'SFR',
          purchasePrice: 205_000,
          downPayment: 51_250,
          interestRate: 6.48,
          loanTerm: 30,
          monthlyRent: 1_800,
          propertyAddress: {
            street: '1837 Walnut Way',
            city: 'Anna',
            state: 'TX',
            zipCode: '75409',
          },
        } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['propertyData'],
        marketData: {
          lastUpdated: new Date(),
          dataSource: ['rentcast'],
        } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['marketData'],
        assumptions: { vacancyRate: 5 },
        metrics: {
          capRate: 5.0,
          dscr: 0.88,
        } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['metrics'],
        monthlyAnalysis: {
          income: {
            gross: 1_800,
            // 5% vacancy → effective = 1710
            effective: 1_710,
          },
          expenses: {
            // Operating excludes mortgage. 308 + 116 + 171 + 144 + 50 = 789
            operating: 789,
            debt: 967,
            total: 1_756,
            breakdown: {
              propertyTax: 308,
              insurance: 116,
              maintenance: 171,
              propertyManagement: 144,
              tenantTurnover: 50,
              capEx: 0,
              hoa: 0,
              utilities: 0,
              commonAreaElectricity: 0,
              landscaping: 0,
              waterSewer: 0,
              garbage: 0,
              marketingAndAdvertising: 0,
              repairsAndMaintenance: 0,
              other: 0,
              vacancy: 0,
            },
          },
          // 1710 - 789 - 967 = -46. Using -46 (not the legacy -116) so the
          // reconciliation invariant below is mathematically clean — the
          // bug we're fixing is "agent's numbers don't reconcile to the
          // result," and this fixture proves the tool surfaces a result
          // that DOES reconcile.
          cashFlow: -46,
        },
        longTermAnalysis: { projectionYears: 10 },
        walkAwayPrice: 157_646,
        enrichmentSource: 'rentcast',
        enrichmentCacheHit: false,
        engineVersion: 'v3.0',
        computeTimeMs: 142,
      },
    });

    const decisionPayload: DecisionPayload = {
      analysisEventId,
      dealQuality: 49,
      qualityLabel: 'Below professional standards',
      qualityColor: 'red',
      professionalAssessment: { dealQuality: 49 } as unknown as DecisionPayload['professionalAssessment'],
      marketPosition: { walkAwayPrice: 157_646 } as unknown as DecisionPayload['marketPosition'],
      reasoningTrail: {
        primaryInsight: 'cash-flow drag',
        strategicRecommendations: [],
        riskMitigation: [],
        opportunityMaximization: [],
        keyRisks: [],
      },
      confidence: 75,
      scoringWeightsUsed: {} as unknown as DecisionPayload['scoringWeightsUsed'],
      engineVersion: 'v3.0',
    };
    const decisionEventId = await writes.writeDecisionEvent({
      traceId: 'seed-bd',
      actorType: 'agent:deal_scoring',
      userId,
      payload: decisionPayload,
    });

    return { decisionEventId, analysisEventId };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    writes = new EventsRepository();
    reads = new EventsRepositoryReads();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  // ===== Contract =====

  describe('Tool contract', () => {
    it('declares invokeLLM: false', () => {
      expect(getDecisionBreakdown.invokeLLM).toBe(false);
    });
    it('declares no side effects (pure read)', () => {
      expect(getDecisionBreakdown.sideEffects).toEqual([]);
    });
    it('has the stable global name', () => {
      expect(getDecisionBreakdown.name).toBe('get_decision_breakdown');
    });
  });

  // ===== Happy path =====

  describe('execute() — happy path', () => {
    it('returns line-item breakdown that matches the seeded engine output', async () => {
      const userId = new Types.ObjectId();
      const { decisionEventId } = await seedRealisticDecision(userId);

      const out = await getDecisionBreakdown.execute(
        { decisionId: decisionEventId },
        makeCtx(userId)
      );

      // Property block
      expect(out.property.purchasePrice).toBe(205_000);
      expect(out.property.monthlyRent).toBe(1_800);
      expect(out.property.address?.city).toBe('Anna');

      // Loan block (loanAmount derived from purchase - down)
      expect(out.loan.loanAmount).toBe(153_750);
      expect(out.loan.interestRate).toBe(6.48);
      expect(out.loan.termYears).toBe(30);
      expect(out.loan.monthlyPayment).toBe(967);

      // Monthly income block
      expect(out.monthly.grossRent).toBe(1_800);
      expect(out.monthly.effectiveRent).toBe(1_710);
      expect(out.monthly.vacancyLoss).toBe(90);

      // Expense line items — these are the numbers the agent must
      // narrate FROM, not synthesize.
      expect(out.monthly.expenses.propertyTax).toBe(308);
      expect(out.monthly.expenses.insurance).toBe(116);
      expect(out.monthly.expenses.maintenance).toBe(171);
      expect(out.monthly.expenses.propertyManagement).toBe(144);
      expect(out.monthly.expenses.tenantTurnover).toBe(50);
      expect(out.monthly.expenses.totalOperating).toBe(789);
      expect(out.monthly.expenses.mortgagePayment).toBe(967);
      expect(out.monthly.expenses.total).toBe(1_756);

      // Cash flow
      expect(out.monthly.netCashFlow).toBe(-46);

      // Metrics
      expect(out.metrics.dscr).toBe(0.88);
      expect(out.metrics.capRate).toBe(5.0);
      // monthlyNOI = effectiveRent - totalOperating = 1710 - 789 = 921
      expect(out.metrics.monthlyNOI).toBe(921);
    });

    it('reconciles: effective rent - total expenses === net cash flow (within rounding)', async () => {
      // THIS is the test that codifies the bug. The agent's pre-fix
      // confabulation produced line items that did NOT reconcile to
      // the stated cash flow (verified ~$120/mo gap on real chat output).
      // With this tool, the values come straight from substrate — they
      // MUST reconcile.
      const userId = new Types.ObjectId();
      const { decisionEventId } = await seedRealisticDecision(userId);

      const out = await getDecisionBreakdown.execute(
        { decisionId: decisionEventId },
        makeCtx(userId)
      );

      const derived =
        out.monthly.effectiveRent - out.monthly.expenses.total;
      expect(Math.abs(derived - out.monthly.netCashFlow)).toBeLessThan(0.5);
    });

    it('accepts a hex-string decisionId', async () => {
      const userId = new Types.ObjectId();
      const { decisionEventId } = await seedRealisticDecision(userId);

      const out = await getDecisionBreakdown.execute(
        { decisionId: decisionEventId.toHexString() },
        makeCtx(userId)
      );
      expect(out.decisionId).toBe(decisionEventId.toHexString());
    });

    it('rolls up secondary line items into otherOperating bucket', async () => {
      // MF-style decision with non-zero utilities + landscaping +
      // commonAreaElectricity. These should sum into otherOperating
      // so the agent narrative stays compact.
      const userId = new Types.ObjectId();
      const analysisEventId = await writes.writeAnalysisEvent({
        traceId: 'mf-seed',
        actorType: 'tool:score_deal',
        userId,
        payload: {
          propertyData: { propertyType: 'MF', purchasePrice: 800_000 } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['propertyData'],
          marketData: { lastUpdated: new Date(), dataSource: ['rentcast'] } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['marketData'],
          assumptions: {},
          metrics: {} as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['metrics'],
          monthlyAnalysis: {
            income: { gross: 5_600, effective: 5_320 },
            expenses: {
              operating: 2_000,
              debt: 3_500,
              total: 5_500,
              breakdown: {
                propertyTax: 800,
                insurance: 200,
                maintenance: 400,
                propertyManagement: 300,
                tenantTurnover: 100,
                capEx: 0,
                hoa: 0,
                utilities: 80,
                commonAreaElectricity: 40,
                landscaping: 50,
                waterSewer: 20,
                garbage: 10,
                marketingAndAdvertising: 0,
                repairsAndMaintenance: 0,
                other: 0,
              },
            },
            cashFlow: -180,
          },
          longTermAnalysis: {},
          walkAwayPrice: 650_000,
          enrichmentSource: 'rentcast',
          enrichmentCacheHit: false,
          engineVersion: 'v3.0',
          computeTimeMs: 200,
        },
      });
      const decisionPayload: DecisionPayload = {
        analysisEventId,
        dealQuality: 55,
        qualityLabel: 'Requires optimization',
        qualityColor: 'orange',
        professionalAssessment: {} as unknown as DecisionPayload['professionalAssessment'],
        marketPosition: { walkAwayPrice: 650_000 } as unknown as DecisionPayload['marketPosition'],
        reasoningTrail: {
          primaryInsight: 'mf',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
        confidence: 70,
        scoringWeightsUsed: {} as unknown as DecisionPayload['scoringWeightsUsed'],
        engineVersion: 'v3.0',
      };
      const decisionId = await writes.writeDecisionEvent({
        traceId: 'mf-seed',
        actorType: 'agent:deal_scoring',
        userId,
        payload: decisionPayload,
      });

      const out = await getDecisionBreakdown.execute(
        { decisionId },
        makeCtx(userId)
      );
      // utilities (80) + commonAreaElectricity (40) + landscaping (50)
      // + waterSewer (20) + garbage (10) = 200
      expect(out.monthly.expenses.utilities).toBe(80);
      expect(out.monthly.expenses.otherOperating).toBe(120);
    });
  });

  // ===== Error handling =====

  describe('error handling', () => {
    it('throws when decisionId references a non-existent decision', async () => {
      const userId = new Types.ObjectId();
      const fake = new Types.ObjectId();
      await expect(
        getDecisionBreakdown.execute({ decisionId: fake }, makeCtx(userId))
      ).rejects.toThrow(/Decision not found/);
    });

    it('throws loudly when AnalysisEvent is missing (no silent null shape)', async () => {
      // The bug-defense: a decision whose linked analysis is missing
      // should fail fast, NOT return a half-empty breakdown the agent
      // could narrate around. Silent fallthrough is the failure mode
      // this whole tool exists to prevent.
      const userId = new Types.ObjectId();
      const decisionPayload: DecisionPayload = {
        analysisEventId: new Types.ObjectId(), // dangling
        dealQuality: 60,
        qualityLabel: 'Requires optimization',
        qualityColor: 'orange',
        professionalAssessment: {} as unknown as DecisionPayload['professionalAssessment'],
        marketPosition: { walkAwayPrice: 0 } as unknown as DecisionPayload['marketPosition'],
        reasoningTrail: {
          primaryInsight: 'orphan',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
        confidence: 50,
        scoringWeightsUsed: {} as unknown as DecisionPayload['scoringWeightsUsed'],
        engineVersion: 'v3.0',
      };
      const decisionId = await writes.writeDecisionEvent({
        traceId: 'orphan-bd',
        actorType: 'agent:deal_scoring',
        userId,
        payload: decisionPayload,
      });
      await expect(
        getDecisionBreakdown.execute({ decisionId }, makeCtx(userId))
      ).rejects.toThrow(/has no linked analysis event/);
    });
  });
});
