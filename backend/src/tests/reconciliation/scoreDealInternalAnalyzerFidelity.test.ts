/**
 * score_deal internal-analyzer fidelity contract — Phase C of the
 * drifting-booping-ripple plan (2026-06-14).
 *
 * THE BUG THIS PREVENTS
 * ---------------------
 *
 * Task #32 / #51: the chat agent used to chain compute_analysis →
 * score_deal. The LLM (sonnet-4-6) was caught truncating the analysis
 * result during tool-input transcription — dropping 8 of 10 projection
 * rows AND 10 of 20 fields per row. Substrate received garbage; every
 * saved deal had sparse projections for weeks.
 *
 * The fix (#51) makes score_deal run the analyzer internally when the
 * caller omits analysisResult. This test verifies the substrate AnalysisEvent
 * actually receives the FULL analyzer output through that path.
 *
 * The PRE-EXISTING reconciliation test (endToEndDataFidelity.test.ts)
 * doesn't cover this — it writes substrate AnalysisEvents DIRECTLY with
 * full fixtures, never exercising score_deal's projection layer. That
 * blind spot is exactly why #32 sat unfixed for weeks. This test closes
 * the gap.
 *
 * WHAT IT ASSERTS
 * ---------------
 *
 *   1. score_deal.execute() with NO analysisResult succeeds (Task #51
 *      contract).
 *   2. The persisted AnalysisEvent has projections.length === 10 (the
 *      configured projectionYears).
 *   3. Every projection row has the FULL ~20-field set: year,
 *      propertyValue, grossIncome, operatingExpenses, noi, debtService,
 *      cashFlow, equity, mortgageBalance, totalReturn, propertyTax,
 *      insurance, maintenance, propertyManagement, vacancy,
 *      realtorBrokerageFee, grossRent, appreciation, turnoverCosts,
 *      capitalImprovements.
 *   4. Year-1 NOI is non-zero (catches the "fields present but all zero"
 *      failure mode that would survive a shape-only check).
 *   5. headline metrics NOI ≈ Year-1 projection NOI within $1 (catches
 *      header-vs-projection drift — the symptom users actually see).
 *
 * NOT covered here:
 *   - The full chat-agent LLM tool-call loop (would need real Anthropic
 *     API access; deferred to Task #28 eval harness).
 *   - apply_override's legacy analysisResult-passthrough path (still uses
 *     the caller-provided shape; covered by score_deal.test.ts happy path).
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  scoreDeal,
  setEngineAdapter,
  resetEngineAdapter,
  type ScoringEngineAdapter,
} from '../../agents/tools/score_deal';
import { User } from '../../models/User';
import { EventsRepository } from '../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../repositories/EventsRepositoryReads';
import { AnalysisEventModel } from '../../models/events/AnalysisEvent';
import type { EngineOutputForProjection } from '../../agents/tools/projectToEventPayloads';
import type { ToolContext } from '../../agents/tools/types';
import type { SFRData } from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';

const SETUP_TIMEOUT_MS = 90_000;

// Fields the SFR analyzer must emit on EVERY projection row. Sourced from
// the verified-good 2026-06-14 smoke-test log (Task #51 Phase A); pinned
// here so a future analyzer-side change that silently drops a field
// trips this test.
const REQUIRED_PROJECTION_FIELDS = [
  'year',
  'propertyValue',
  'grossIncome',
  'operatingExpenses',
  'noi',
  'debtService',
  'cashFlow',
  'equity',
  'mortgageBalance',
  'totalReturn',
  'propertyTax',
  'insurance',
  'maintenance',
  'propertyManagement',
  'vacancy',
  'realtorBrokerageFee',
  'grossRent',
  'appreciation',
  'turnoverCosts',
  'capitalImprovements',
] as const;

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
  // A well-formed property that the SFRAnalyzer can fully analyze
  // without external data dependencies. Numbers chosen to produce
  // non-trivial positive NOI so the "all zeros" failure mode is
  // catchable.
  return {
    propertyType: 'SFR',
    purchasePrice: 250_000,
    downPayment: 62_500,
    interestRate: 6.5,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 2_500,
    propertyManagementRate: 8,
    propertyAddress: {
      street: '1 Internal Analyzer Way',
      city: 'Plano',
      state: 'TX',
      zipCode: '75074',
    },
    monthlyRent: 2_400,
    squareFootage: 2_000,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2010,
  };
}

function stubEngineOutput(): EngineOutputForProjection & Record<string, unknown> {
  return {
    professionalAssessment: {
      dealQuality: 72,
      cashFlowScore: 80,
      irrScore: 60,
      marketStrengthScore: 70,
      debtStructureScore: 75,
      exitStrategyScore: 65,
      capRateScore: 55,
      propertyRiskScore: 80,
      primaryInsight: 'OK',
      strategicRecommendations: [],
      riskMitigation: [],
      opportunityMaximization: [],
    },
    confidence: 82,
    marketContext: {
      marketStage: 'mid',
      pricingContext: 'fair',
      competitiveIntensity: 'moderate',
    },
    primaryReason: 'reason',
    secondaryReasons: [],
    keyRisks: [],
    verdict: 'BUY',
  };
}

function makeStubAdapter(): ScoringEngineAdapter {
  return {
    async generateDecision() {
      return stubEngineOutput();
    },
  };
}

describe('score_deal internal-analyzer fidelity (Task #51 Phase C)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;
  let userId: Types.ObjectId;

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

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    const user = await User.create({
      email: 'phase-c-test@example.com',
      firstName: 'PhaseC',
      lastName: 'Test',
      role: 'user',
      isVerified: true,
      anonymous: false,
    });
    userId = user._id as Types.ObjectId;
    setEngineAdapter(makeStubAdapter());
  });

  afterEach(() => {
    resetEngineAdapter();
  });

  it('writes 10-row × 20-field projection to substrate when analysisResult is OMITTED', async () => {
    const ctx: ToolContext = {
      traceId: 't-phase-c',
      userId,
      eventsRepo: writes,
      eventsReads: reads,
      tools: {},
    };

    // The new chat-agent flow: score_deal called WITHOUT analysisResult.
    // The analyzer runs INSIDE score_deal via the property-type registry.
    await scoreDeal.execute(
      {
        propertyData: makeSFRProperty() as unknown as Record<string, unknown>,
        propertyType: 'SFR',
        assumptions: makeAssumptions() as unknown as Record<string, unknown>,
        // NO analysisResult — this is the path Task #51 made truncation-immune.
      },
      ctx
    );

    // Read the AnalysisEvent back from substrate. There's exactly one
    // (the test dropped the DB in beforeEach).
    const eventDoc = (await AnalysisEventModel.findOne({ userId }).lean()) as
      | { payload?: Record<string, unknown> }
      | null;
    expect(eventDoc).not.toBeNull();
    expect(eventDoc!.payload).toBeDefined();

    const payload = eventDoc!.payload as unknown as {
      longTermAnalysis: {
        projections: Array<Record<string, unknown>>;
        projectionYears?: number;
      };
      metrics: { noi: number };
    };

    // ===== Assertion 1: 10 rows =====
    expect(payload.longTermAnalysis.projections.length).toBe(10);

    // ===== Assertion 2: every row has all 20 fields =====
    payload.longTermAnalysis.projections.forEach((row, idx) => {
      for (const field of REQUIRED_PROJECTION_FIELDS) {
        if (!(field in row)) {
          throw new Error(
            `[Phase C regression] Projection row ${idx} is missing required field "${field}". ` +
              `Row keys: ${Object.keys(row).join(', ')}. ` +
              `This indicates the analyzer-internal path is dropping fields, OR the analyzer ` +
              `itself stopped emitting them. See score_deal.ts INVARIANT #6.`
          );
        }
      }
    });

    // ===== Assertion 3: Year-1 NOI is non-zero =====
    // Catches the "fields present but all zero" failure mode that a
    // shape-only check would miss.
    const year1Noi = payload.longTermAnalysis.projections[0].noi as number;
    expect(typeof year1Noi).toBe('number');
    expect(year1Noi).toBeGreaterThan(0);

    // ===== Assertion 4: headline NOI ≈ Year-1 NOI =====
    // Catches header-vs-projection drift — the symptom users actually
    // see. They're allowed to differ by sub-dollar rounding.
    expect(Math.abs(payload.metrics.noi - year1Noi)).toBeLessThan(1);
  });
});
