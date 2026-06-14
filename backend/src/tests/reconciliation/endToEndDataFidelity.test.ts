/**
 * End-to-end data fidelity contract — Task #44, ground floor.
 *
 * The "200% accuracy" mandate (2026-06-13): no number in one view
 * can disagree with the same number in another view. This test
 * traces ONE property through the full pipeline and asserts every
 * boundary preserves the analyzer's truth:
 *
 *   Analyzer output
 *     ↓ (projectEngineOutputToEventPayloads)
 *   Substrate AnalysisEvent
 *     ↓ (materializer projectAnalysis — Task #41 fix lives here)
 *   Legacy Deal record
 *     ↓ (API endpoints — passthrough)
 *   /api/deals/:id and /api/deals/:id/scenario-detail responses
 *
 * Every step asserts identity (or documented rename). If any step
 * drifts, the test fails with a precise message pointing at which
 * boundary corrupted the data.
 *
 * BUGS THIS TEST CATCHES BY DESIGN
 * ─────────────────────────────────
 *   - Task #32: substrate stores `projections` but materializer
 *     wrote `yearlyProjections` → undefined on Deal
 *   - Task #41: hand-curated allowlist silently dropping 16 metrics
 *   - Task #43: CapEx default mismatch between headline + projection
 *   - Future: any new drift between the analyzer's output and what
 *     the API serves
 *
 * NOT covered here (filed separately):
 *   - The full chat-agent flow (compute_analysis → score_deal →
 *     projectEngineOutputToEventPayloads)
 *   - LLM narrative reconciliation (Task #28 eval harness)
 *   - PDF export content
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import { materializeDealFromDecision } from '../../services/dealMaterializationService';
import { User } from '../../models/User';
import { DealModel as Deal } from '../../models/Deal';
import { eventsRepository } from '../../repositories/EventsRepository';
import { eventsRepositoryReads } from '../../repositories/EventsRepositoryReads';
import type { AnalysisPayload } from '../../models/events/AnalysisEvent';
import type { DecisionPayload } from '../../models/events/DecisionEvent';
import type { SFRData } from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';

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
  // The user's actual deal that surfaced #43 — keeps the test
  // grounded in real reported data.
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
    monthlyRent: 1_850,
    squareFootage: 1_268,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2007,
  };
}

describe('End-to-end data fidelity (Task #44 ground floor)', () => {
  let mongoServer: MongoMemoryServer;
  let userId: Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    const user = await User.create({
      email: 'reconciliation-test@example.com',
      firstName: 'Recon',
      lastName: 'Test',
      role: 'user',
      isVerified: true,
      anonymous: false,
    });
    userId = user._id as Types.ObjectId;
  });

  /**
   * Runs ONE property all the way through: analyzer → substrate
   * write → materialize Deal → returns the references that all
   * downstream tests assert against. The result is the canonical
   * substrate of truth for this test file.
   */
  async function runFullPipeline() {
    const property = makeSFRProperty();
    const assumptions = makeAssumptions();

    // 1. Analyzer output (the canonical truth)
    const analyzerResult = new SFRAnalyzer(property, assumptions).analyze();

    // 2. Write substrate directly (we're testing the substrate→Deal
    //    boundary, not the score_deal tool's projection). The
    //    payload mirrors what projectEngineOutputToEventPayloads
    //    would produce given the analyzer output.
    const analysisPayload = {
      propertyData: property as unknown,
      marketData: {
        lastUpdated: new Date(),
        dataSource: ['fallback'],
      },
      assumptions,
      metrics: analyzerResult.keyMetrics,
      monthlyAnalysis: analyzerResult.monthlyAnalysis,
      longTermAnalysis: analyzerResult.longTermAnalysis,
      walkAwayPrice: 162_485,
      enrichmentSource: 'fallback',
      enrichmentCacheHit: false,
      engineVersion: 'v3.0',
      computeTimeMs: 100,
    } as unknown as AnalysisPayload;

    const analysisEventId = await eventsRepository.writeAnalysisEvent({
      traceId: 't-recon',
      actorType: 'tool:score_deal',
      userId,
      payload: analysisPayload,
    });

    const decisionPayload: DecisionPayload = {
      analysisEventId,
      dealQuality: 49,
      qualityLabel: 'Below professional standards',
      qualityColor: 'red',
      professionalAssessment: { dealQuality: 49 } as unknown as DecisionPayload['professionalAssessment'],
      marketPosition: { walkAwayPrice: 162_485 } as unknown as DecisionPayload['marketPosition'],
      reasoningTrail: {
        primaryInsight: 'r',
        strategicRecommendations: [],
        riskMitigation: [],
        opportunityMaximization: [],
        keyRisks: [],
      },
      confidence: 80,
      scoringWeightsUsed: {} as unknown as DecisionPayload['scoringWeightsUsed'],
      engineVersion: 'v3.0',
    };
    const decisionEventId = await eventsRepository.writeDecisionEvent({
      traceId: 't-recon',
      actorType: 'agent:deal_scoring',
      userId,
      payload: decisionPayload,
    });

    // 3. Materialize the Deal (Task #41 fix lives here)
    await materializeDealFromDecision(decisionEventId, userId);
    const deal = await Deal.findOne({ userId }).lean();
    expect(deal).not.toBeNull();

    // 4. The scenario-detail API serves substrate verbatim. We call
    //    the read layer directly (skip the HTTP layer — it's a thin
    //    passthrough). This emulates what /scenario-detail returns.
    const scenarioBundle = await eventsRepositoryReads.getScenarioBundle(
      decisionEventId.toString()
    );
    expect(scenarioBundle).not.toBeNull();

    return {
      analyzerResult,
      deal: deal!,
      substrate: scenarioBundle!.analysis!.payload as unknown as AnalysisPayload,
    };
  }

  // ===== Boundary 1: analyzer → substrate =====

  describe('Analyzer → substrate boundary (passthrough)', () => {
    it('substrate.monthlyAnalysis.cashFlow === analyzer.monthlyAnalysis.cashFlow', async () => {
      const { analyzerResult, substrate } = await runFullPipeline();
      const subMonthly = (substrate.monthlyAnalysis ?? {}) as {
        cashFlow?: number;
      };
      expect(subMonthly.cashFlow).toBeCloseTo(
        analyzerResult.monthlyAnalysis.cashFlow,
        2
      );
    });

    it('substrate.metrics.noi === analyzer.keyMetrics.noi', async () => {
      const { analyzerResult, substrate } = await runFullPipeline();
      const subMetrics = (substrate.metrics ?? {}) as { noi?: number };
      expect(subMetrics.noi).toBeCloseTo(analyzerResult.keyMetrics.noi, 2);
    });

    it('substrate.longTermAnalysis.projections has every analyzer year', async () => {
      const { analyzerResult, substrate } = await runFullPipeline();
      const subLT = (substrate.longTermAnalysis ?? {}) as {
        projections?: Array<{ year: number; cashFlow: number }>;
      };
      expect(subLT.projections).toHaveLength(
        analyzerResult.longTermAnalysis.projections.length
      );
      expect(subLT.projections).toHaveLength(10); // projection years setting
    });
  });

  // ===== Boundary 2: substrate → materialized Deal =====

  describe('Substrate → Deal boundary (Task #41 fix)', () => {
    it('Deal.analysis.monthlyAnalysis.cashFlow === substrate.monthlyAnalysis.cashFlow', async () => {
      const { deal, substrate } = await runFullPipeline();
      const subMonthly = (substrate.monthlyAnalysis ?? {}) as { cashFlow?: number };
      expect(deal.analysis?.monthlyAnalysis?.cashFlow).toBeCloseTo(
        subMonthly.cashFlow!,
        2
      );
    });

    it('Deal.analysis.longTermAnalysis.projections has all 10 rows (Task #32 root fix)', async () => {
      const { deal } = await runFullPipeline();
      const lt = deal.analysis?.longTermAnalysis as unknown as {
        projections?: Array<{ year: number }>;
      };
      expect(lt?.projections).toBeDefined();
      expect(lt?.projections).toHaveLength(10);
    });

    it('every Year-by-year row has a non-undefined NOI (Task #32 NOI-on-year-5/10 fix)', async () => {
      const { deal } = await runFullPipeline();
      const lt = deal.analysis?.longTermAnalysis as unknown as {
        projections?: Array<{ noi?: number }>;
      };
      for (const yearRow of lt!.projections!) {
        expect(typeof yearRow.noi).toBe('number');
        expect(yearRow.noi).toBeGreaterThan(0);
      }
    });

    it('Deal.analysis.annualAnalysis.annualNOI === substrate.metrics.noi', async () => {
      const { deal, substrate } = await runFullPipeline();
      const subMetrics = (substrate.metrics ?? {}) as { noi?: number };
      expect(deal.analysis?.annualAnalysis?.annualNOI).toBeCloseTo(
        subMetrics.noi!,
        2
      );
    });
  });

  // ===== Boundary 3: cross-view reconciliation =====
  // The "200% accuracy" contract: same number across every view.

  describe('Cross-view reconciliation (the 200% accuracy contract)', () => {
    it('Year 1 cashFlow / 12 === Financials monthly cashFlow (±$5/mo)', async () => {
      // The exact user-reported bug from Task #43. After all fixes,
      // the Financials and Year-by-year views MUST agree.
      const { deal } = await runFullPipeline();
      const monthlyCashFlow = deal.analysis?.monthlyAnalysis?.cashFlow as number;
      const projections = (deal.analysis?.longTermAnalysis as unknown as {
        projections?: Array<{ cashFlow: number }>;
      })?.projections;
      const year1AnnualCashFlow = projections![0].cashFlow;

      const delta = Math.abs(monthlyCashFlow * 12 - year1AnnualCashFlow);
      expect(delta).toBeLessThan(5);
    });

    it('Headline annualNOI === Year 1 NOI (±$1)', async () => {
      const { deal } = await runFullPipeline();
      const headlineNOI = deal.analysis?.annualAnalysis?.annualNOI as number;
      const year1NOI = (deal.analysis?.longTermAnalysis as unknown as {
        projections?: Array<{ noi: number }>;
      })?.projections![0].noi as number;

      expect(Math.abs(headlineNOI - year1NOI)).toBeLessThan(1);
    });

    it('Financials cashFlow × 12 === annualAnalysis cashFlow (derived)', async () => {
      // annualAnalysis.cashFlow is derived from annualNOI − annualDebtService.
      // Financials monthly is from substrate.monthlyAnalysis.cashFlow.
      // These two derivations must agree.
      const { deal } = await runFullPipeline();
      const monthlyCashFlow = deal.analysis?.monthlyAnalysis?.cashFlow as number;
      const annualNOI = deal.analysis?.annualAnalysis?.annualNOI as number;
      const annualDebtService = deal.analysis?.annualAnalysis?.annualDebtService as number;
      const derivedAnnualCashFlow = annualNOI - annualDebtService;

      expect(Math.abs(monthlyCashFlow * 12 - derivedAnnualCashFlow)).toBeLessThan(5);
    });

    it('Headline operating expenses (×12) reconciles with Year 1 operating expenses (±$5)', async () => {
      const { deal, substrate } = await runFullPipeline();
      const subMonthly = (substrate.monthlyAnalysis ?? {}) as {
        expenses?: { operating?: number };
      };
      const monthlyOpEx = subMonthly.expenses?.operating as number;
      const year1AnnualOpEx = (deal.analysis?.longTermAnalysis as unknown as {
        projections?: Array<{ operatingExpenses: number }>;
      })?.projections![0].operatingExpenses as number;

      expect(Math.abs(monthlyOpEx * 12 - year1AnnualOpEx)).toBeLessThan(5);
    });

    it('Walk-away price is preserved on Deal AND substrate', async () => {
      const { deal, substrate } = await runFullPipeline();
      const subWalkAway = (substrate as { walkAwayPrice?: number }).walkAwayPrice;
      const dealWalkAway = (deal.analysis as unknown as { walkAwayPrice?: number })
        ?.walkAwayPrice;
      expect(dealWalkAway).toBe(subWalkAway);
    });
  });

  // ===== Boundary 4: metric depth — pricing page promises =====

  describe('28+ professional metrics promise (pricing page contract)', () => {
    it('IRR is preserved end to end', async () => {
      const { analyzerResult, deal } = await runFullPipeline();
      const analyzerIRR = analyzerResult.longTermAnalysis.returns.irr;
      const dealIRR = (deal.analysis?.longTermAnalysis?.returns as unknown as {
        irr?: number;
      })?.irr;
      expect(dealIRR).toBeCloseTo(analyzerIRR, 2);
    });

    it('GRM lands on the Deal (was silently dropped pre-#41)', async () => {
      const { analyzerResult, deal } = await runFullPipeline();
      expect(deal.analysis?.keyMetrics?.grossRentMultiplier).toBeCloseTo(
        analyzerResult.keyMetrics.grossRentMultiplier,
        2
      );
    });

    it('Break-even occupancy lands on the Deal', async () => {
      const { deal } = await runFullPipeline();
      expect(deal.analysis?.keyMetrics?.breakEvenOccupancy).toBeDefined();
      expect(typeof deal.analysis?.keyMetrics?.breakEvenOccupancy).toBe('number');
    });

    it('Equity multiple lands on the Deal', async () => {
      const { deal } = await runFullPipeline();
      expect(deal.analysis?.keyMetrics?.equityMultiple).toBeDefined();
      expect(typeof deal.analysis?.keyMetrics?.equityMultiple).toBe('number');
    });

    it('Cap rate is consistent across surfaces', async () => {
      const { analyzerResult, deal, substrate } = await runFullPipeline();
      const subMetrics = (substrate.metrics ?? {}) as { capRate?: number };
      expect(deal.analysis?.keyMetrics?.capRate).toBeCloseTo(
        analyzerResult.keyMetrics.capRate,
        2
      );
      expect(subMetrics.capRate).toBeCloseTo(analyzerResult.keyMetrics.capRate, 2);
      expect(deal.analysis?.annualAnalysis?.capRate).toBeCloseTo(
        analyzerResult.keyMetrics.capRate,
        2
      );
    });
  });
});
