/**
 * W5-Phase1 acceptance test — tool:resolve_property_inputs.
 *
 * Verifies the chat-flow input-gathering bridge:
 *   1. Tool contract conformance
 *   2. Field provenance — every field tagged with its source
 *   3. The two-bucket transparency split (confirm-before / disclose-after)
 *   4. userOverrides win over external data and defaults
 *   5. Fallback behavior when external sources return nothing
 *   6. The hard error: no rent estimate + no override → throw
 *   7. THE ARCHITECT'S PHASE-1 EXIT CRITERION:
 *      resolved propertyData fed through compute_analysis → score_deal
 *      produces the same score as feeding identical propertyData directly.
 *      (Determinism: chat-flow inputs aren't magically wizard-identical,
 *       but they ARE transparent + deterministic + reproducible.)
 *
 * Uses a stub PropertyResolverAdapter — no live RentCast / FRED / tax API.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  resolvePropertyInputs,
  setPropertyResolverAdapter,
  resetPropertyResolverAdapter,
  type PropertyResolverAdapter,
  type ResolverExternalData,
} from '../resolve_property_inputs';
import { computeAnalysis } from '../compute_analysis';
import {
  scoreDeal,
  setEngineAdapter,
  resetEngineAdapter,
} from '../score_deal';
import { eventsRepository } from '../../../repositories/EventsRepository';
import { eventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import type { ToolContext } from '../types';
import type { EngineOutputForProjection } from '../projectToEventPayloads';

const SETUP_TIMEOUT_MS = 90_000;

describe('tool:resolve_property_inputs (W5-Phase1)', () => {
  let mongoServer: MongoMemoryServer;

  function ctxFor(traceId: string): ToolContext {
    return {
      traceId,
      userId: new Types.ObjectId(),
      eventsRepo: eventsRepository,
      eventsReads: eventsRepositoryReads,
      tools: {},
    };
  }

  /** Stub adapter returning a controllable ResolverExternalData. */
  function stubAdapter(data: Partial<ResolverExternalData>): PropertyResolverAdapter {
    return {
      async fetchExternalData() {
        return { enrichmentSource: 'stub', ...data };
      },
    };
  }

  /** A "full data" stub — every external source returns a value. */
  const FULL_EXTERNAL: Partial<ResolverExternalData> = {
    rentEstimate: 2800,
    valueEstimate: 430000,
    currentMortgageRate: 7.1,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1850,
    yearBuilt: 2018,
    effectiveTaxRate: 1.8,
  };

  const ADDRESS = {
    street: '1837 Walnut Way',
    city: 'Anna',
    state: 'TX',
    zipCode: '75409',
  };

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
    resetPropertyResolverAdapter();
    resetEngineAdapter();
  });

  // ===== Contract =====

  describe('Tool contract', () => {
    it('declares invokeLLM: false (deterministic — no LLM in the resolver)', () => {
      expect(resolvePropertyInputs.invokeLLM).toBe(false);
    });
    it('declares external_api side effects, NO event writes', () => {
      expect(resolvePropertyInputs.sideEffects).toEqual([
        { type: 'external_api', service: 'rentcast' },
        { type: 'external_api', service: 'fred' },
      ]);
    });
    it('has the stable global name', () => {
      expect(resolvePropertyInputs.name).toBe('resolve_property_inputs');
    });
  });

  // ===== Happy path: full external data =====

  describe('full external data', () => {
    it('assembles a complete SFRData', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      const out = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
        ctxFor('t')
      );
      const pd = out.propertyData;
      expect(pd.propertyType).toBe('SFR');
      expect(pd.purchasePrice).toBe(425000);
      expect(pd.monthlyRent).toBe(2800); // RentCast estimate
      expect(pd.interestRate).toBe(7.1); // FRED
      expect(pd.propertyTaxRate).toBe(1.8); // tax service
      expect(pd.bedrooms).toBe(3);
      expect(pd.squareFootage).toBe(1850);
      expect(pd.yearBuilt).toBe(2018);
      // Assumption defaults
      expect(pd.downPayment).toBe(425000 * 0.25); // 25%
      expect(pd.loanTerm).toBe(30);
      expect(pd.propertyManagementRate).toBe(8);
      // Issue #231 (2026-07-07): default is max(price × 2%, $2,500 floor).
      // On $425K purchase, 2% dominates → $8,500.
      expect(pd.closingCosts).toBeCloseTo(Math.max(425000 * 0.02, 2500));
      expect(pd.maintenanceCost).toBeCloseTo(425000 * 0.01);
      expect(pd.insuranceRate).toBe(0.5);
      expect(pd.propertyAddress).toEqual(ADDRESS);
    });

    it('returns standard projection assumptions', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      const out = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
        ctxFor('t')
      );
      expect(out.assumptions).toMatchObject({
        projectionYears: 10,
        vacancyRate: 5,
        sellingCosts: 6,
      });
    });

    it('tags provenance per field', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      const out = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
        ctxFor('t')
      );
      expect(out.provenance.purchasePrice).toBe('user_provided');
      expect(out.provenance.monthlyRent).toBe('rentcast_estimate');
      expect(out.provenance.interestRate).toBe('fred_market');
      expect(out.provenance.propertyTaxRate).toBe('tax_service');
      expect(out.provenance.bedrooms).toBe('rentcast_property_record');
      expect(out.provenance.downPayment).toBe('assumption_default');
      expect(out.provenance.loanTerm).toBe('assumption_default');
    });
  });

  // ===== Two-bucket transparency =====

  describe('two-bucket transparency split', () => {
    it('puts the RentCast rent estimate in confirmBeforeScoring', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      const out = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
        ctxFor('t')
      );
      expect(out.confirmBeforeScoring).toHaveLength(1);
      expect(out.confirmBeforeScoring[0].field).toBe('monthlyRent');
      expect(out.confirmBeforeScoring[0].source).toBe('rentcast_estimate');
      expect(out.confirmBeforeScoring[0].value).toBe(2800);
      expect(out.confirmBeforeScoring[0].prompt).toMatch(/RentCast/);
    });

    it('does NOT confirm rent when the user supplied it (nothing to confirm)', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      const out = await resolvePropertyInputs.execute(
        {
          address: ADDRESS,
          purchasePrice: 425000,
          propertyType: 'SFR',
          userOverrides: { monthlyRent: 2650 },
        },
        ctxFor('t')
      );
      expect(out.confirmBeforeScoring).toHaveLength(0);
      expect(out.propertyData.monthlyRent).toBe(2650);
      expect(out.provenance.monthlyRent).toBe('user_provided');
    });

    it('puts inferred/defaulted fields in discloseAfterScoring', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      const out = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
        ctxFor('t')
      );
      const fields = out.discloseAfterScoring.map((d) => d.field);
      expect(fields).toContain('downPayment');
      expect(fields).toContain('interestRate');
      expect(fields).toContain('propertyTaxRate');
      expect(fields).toContain('loanTerm');
      // monthlyRent is NOT in disclose-after — it's confirm-before
      expect(fields).not.toContain('monthlyRent');
      // purchasePrice is NOT disclosed — the user typed it themselves
      expect(fields).not.toContain('purchasePrice');
    });

    it('user-overridden fields drop OUT of discloseAfterScoring', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      const out = await resolvePropertyInputs.execute(
        {
          address: ADDRESS,
          purchasePrice: 425000,
          propertyType: 'SFR',
          userOverrides: { downPayment: 100000, interestRate: 6.5 },
        },
        ctxFor('t')
      );
      const fields = out.discloseAfterScoring.map((d) => d.field);
      // The user set these — don't "disclose" their own input back to them
      expect(fields).not.toContain('downPayment');
      expect(fields).not.toContain('interestRate');
      expect(out.propertyData.downPayment).toBe(100000);
      expect(out.propertyData.interestRate).toBe(6.5);
    });
  });

  // ===== Fallbacks =====

  describe('fallback behavior when external sources return nothing', () => {
    it('falls back to defaults for property record + rates, tags them assumption_default', async () => {
      // Only rent comes back — everything else missing
      setPropertyResolverAdapter(stubAdapter({ rentEstimate: 2800 }));
      const out = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
        ctxFor('t')
      );
      expect(out.propertyData.bedrooms).toBe(3); // fallback
      expect(out.propertyData.squareFootage).toBe(1500); // fallback
      expect(out.propertyData.yearBuilt).toBe(1990); // fallback
      expect(out.propertyData.interestRate).toBe(7.0); // fallback mortgage rate
      expect(out.propertyData.propertyTaxRate).toBe(1.2); // fallback tax rate
      expect(out.provenance.bedrooms).toBe('assumption_default');
      expect(out.provenance.interestRate).toBe('assumption_default');
      expect(out.provenance.propertyTaxRate).toBe('assumption_default');
    });

    it('throws when no rent estimate AND no override (rent is too central to guess)', async () => {
      setPropertyResolverAdapter(stubAdapter({})); // nothing at all
      await expect(
        resolvePropertyInputs.execute(
          { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
          ctxFor('t')
        )
      ).rejects.toThrow(/no rent estimate/);
    });

    it('does NOT throw when rent is missing but supplied via userOverrides', async () => {
      setPropertyResolverAdapter(stubAdapter({}));
      const out = await resolvePropertyInputs.execute(
        {
          address: ADDRESS,
          purchasePrice: 425000,
          propertyType: 'SFR',
          userOverrides: { monthlyRent: 2700 },
        },
        ctxFor('t')
      );
      expect(out.propertyData.monthlyRent).toBe(2700);
    });
  });

  // ===== Task #15 — auto-populate purchasePrice from RentCast AVM =====

  describe('Task #15 — purchasePrice fallback to RentCast valueEstimate', () => {
    it('uses ext.valueEstimate (AVM) when user omitted purchasePrice', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL)); // valueEstimate: 430000

      const result = await resolvePropertyInputs.execute(
        { address: ADDRESS, propertyType: 'SFR' }, // no purchasePrice
        ctxFor('t')
      );

      expect(result.propertyData.purchasePrice).toBe(430000);
      expect(result.provenance.purchasePrice).toBe('rentcast_estimate');
    });

    it('still honors user purchasePrice when supplied (AVM is the fallback, not override)', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));

      const result = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 380000, propertyType: 'SFR' },
        ctxFor('t')
      );

      expect(result.propertyData.purchasePrice).toBe(380000);
      expect(result.provenance.purchasePrice).toBe('user_provided');
    });

    it('throws when user omits price AND RentCast has no valueEstimate', async () => {
      setPropertyResolverAdapter(stubAdapter({ rentEstimate: 2800 })); // no valueEstimate

      await expect(
        resolvePropertyInputs.execute(
          { address: ADDRESS, propertyType: 'SFR' },
          ctxFor('t')
        )
      ).rejects.toThrow(/no purchase price.*no RentCast.*AVM/i);
    });
  });

  // ===== Trust boundary =====

  describe('input validation', () => {
    it('rejects a non-SFR propertyType (MF is a separate path)', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      await expect(
        resolvePropertyInputs.execute(
          {
            address: ADDRESS,
            purchasePrice: 425000,
            propertyType: 'MF' as unknown as 'SFR',
          },
          ctxFor('t')
        )
      ).rejects.toThrow();
    });

    it('rejects a non-positive purchasePrice', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      await expect(
        resolvePropertyInputs.execute(
          { address: ADDRESS, purchasePrice: 0, propertyType: 'SFR' },
          ctxFor('t')
        )
      ).rejects.toThrow();
    });

    it('rejects a malformed address (missing zip)', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      await expect(
        resolvePropertyInputs.execute(
          {
            address: { street: 'x', city: 'y', state: 'TX', zipCode: '' },
            purchasePrice: 425000,
            propertyType: 'SFR',
          },
          ctxFor('t')
        )
      ).rejects.toThrow();
    });
  });

  // ===== THE ARCHITECT'S PHASE-1 EXIT CRITERION =====

  describe('determinism: resolved inputs → score is reproducible', () => {
    it('resolved propertyData fed through compute→score equals feeding identical propertyData directly', async () => {
      // Stub the engine so the score is a pure function of inputs
      // (we are testing input-resolution determinism, not the engine).
      const engineOutput: EngineOutputForProjection = {
        professionalAssessment: {
          dealQuality: 63,
          cashFlowScore: 70,
          irrScore: 55,
          marketStrengthScore: 65,
          debtStructureScore: 60,
          exitStrategyScore: 60,
          capRateScore: 50,
          propertyRiskScore: 75,
          primaryInsight: 'ok',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
        },
        confidence: 75,
        marketContext: {
          marketStage: 'mid',
          pricingContext: 'fair',
          competitiveIntensity: 'moderate',
        },
        primaryReason: 'reason',
        secondaryReasons: [],
        keyRisks: [],
      };
      setEngineAdapter({
        async generateDecision() {
          return engineOutput as EngineOutputForProjection &
            Record<string, unknown>;
        },
      });
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));

      // PATH A: chat flow — resolve, then compute, then score
      const resolved = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
        ctxFor('path-a')
      );
      const computeA = await computeAnalysis.execute(
        {
          propertyData: resolved.propertyData as unknown as Record<string, unknown>,
          assumptions: resolved.assumptions,
          propertyType: 'SFR',
        },
        ctxFor('path-a')
      );
      const scoreA = await scoreDeal.execute(
        {
          propertyData: resolved.propertyData as unknown as Record<string, unknown>,
          analysisResult: computeA.fullResult as unknown as {
            metrics: Record<string, unknown>;
            monthlyAnalysis: Record<string, unknown>;
            longTermAnalysis: Record<string, unknown>;
          },
        },
        ctxFor('path-a')
      );

      // PATH B: feed the SAME resolved propertyData directly through
      // compute + score again. Determinism check — identical inputs,
      // identical score.
      const computeB = await computeAnalysis.execute(
        {
          propertyData: resolved.propertyData as unknown as Record<string, unknown>,
          assumptions: resolved.assumptions,
          propertyType: 'SFR',
        },
        ctxFor('path-b')
      );
      const scoreB = await scoreDeal.execute(
        {
          propertyData: resolved.propertyData as unknown as Record<string, unknown>,
          analysisResult: computeB.fullResult as unknown as {
            metrics: Record<string, unknown>;
            monthlyAnalysis: Record<string, unknown>;
            longTermAnalysis: Record<string, unknown>;
          },
        },
        ctxFor('path-b')
      );

      // Zero-tolerance: same resolved inputs → same dealQuality
      expect(scoreA.dealQuality).toBe(scoreB.dealQuality);
      expect(scoreA.dealQuality).toBe(63);
      expect(scoreA.qualityLabel).toBe(scoreB.qualityLabel);
    });

    it('resolve is itself deterministic — same inputs, same propertyData twice', async () => {
      setPropertyResolverAdapter(stubAdapter(FULL_EXTERNAL));
      const a = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
        ctxFor('a')
      );
      const b = await resolvePropertyInputs.execute(
        { address: ADDRESS, purchasePrice: 425000, propertyType: 'SFR' },
        ctxFor('b')
      );
      expect(a.propertyData).toEqual(b.propertyData);
      expect(a.provenance).toEqual(b.provenance);
    });
  });

  // ===== Day 11b — stress-test reproducibility (Issue A fix) =====
  //
  // The original Issue A: a stress-test turn ("change rate to 7%")
  // re-ran resolve_property_inputs fresh, which re-fetched RentCast /
  // FRED / tax data — those return drifting values across calls.
  // Result: scores between turns weren't deterministically ordered
  // (rate 6.4% → score 20, rate 7% → score 45 in one observed run).
  //
  // The fix: when `priorDecisionId` is set, load the prior analysis
  // verbatim and apply only the explicit override. These tests assert
  // the contract.

  describe('priorDecisionId — reuse prior analysis for stress-tests (Issue A fix)', () => {
    /**
     * Seed a prior AnalysisEvent + DecisionEvent pair, return the
     * decisionId so the test can pass it to resolve_property_inputs.
     */
    async function seedPriorAnalysis(opts: {
      propertyData: Record<string, unknown>;
      assumptions: Record<string, unknown>;
    }): Promise<Types.ObjectId> {
      const userId = new Types.ObjectId();
      // AnalysisPayloadSchema requires propertyData, marketData,
      // assumptions, metrics, monthlyAnalysis, longTermAnalysis (all
      // ObjectShape), plus walkAwayPrice, enrichmentSource,
      // enrichmentCacheHit, engineVersion, computeTimeMs.
      const analysisPayload: unknown = {
        propertyData: opts.propertyData,
        marketData: {},
        assumptions: opts.assumptions,
        metrics: {},
        monthlyAnalysis: {},
        longTermAnalysis: {},
        walkAwayPrice: 200000,
        enrichmentSource: 'rentcast',
        enrichmentCacheHit: false,
        engineVersion: 'test',
        computeTimeMs: 100,
      };
      const analysisEventId = await eventsRepository.writeAnalysisEvent({
        traceId: 'seed-trace',
        actorType: 'agent:deal_scoring',
        userId,
        payload: analysisPayload as Parameters<
          typeof eventsRepository.writeAnalysisEvent
        >[0]['payload'],
      });
      // DecisionPayloadSchema requires: analysisEventId, dealQuality,
      // qualityLabel, qualityColor, professionalAssessment,
      // marketPosition, reasoningTrail (structured), confidence,
      // scoringWeightsUsed, engineVersion.
      const decisionPayload: unknown = {
        analysisEventId,
        dealQuality: 50,
        qualityLabel: 'Requires optimization',
        qualityColor: 'orange',
        professionalAssessment: {
          cashFlowScore: 50,
          irrScore: 50,
          capRateScore: 50,
          marketStrengthScore: 50,
          debtStructureScore: 50,
          exitStrategyScore: 50,
          propertyRiskScore: 50,
          dealQuality: 50,
        },
        marketPosition: {},
        reasoningTrail: {
          primaryInsight: 'seed for stress-test reproducibility test',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
        confidence: 80,
        scoringWeightsUsed: {},
        engineVersion: 'test',
      };
      const decisionEventId = await eventsRepository.writeDecisionEvent({
        traceId: 'seed-trace',
        actorType: 'agent:deal_scoring',
        userId,
        payload: decisionPayload as Parameters<
          typeof eventsRepository.writeDecisionEvent
        >[0]['payload'],
      });
      return decisionEventId;
    }

    it('loads propertyData + assumptions from prior analysis verbatim when priorDecisionId is set', async () => {
      const priorPropertyData = {
        propertyType: 'SFR',
        purchasePrice: 275000,
        monthlyRent: 1960,
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 1800,
        interestRate: 6.36,
        propertyTaxRate: 1.2,
      };
      const priorAssumptions = {
        vacancyRate: 5,
        mortgageRate: 6.36,
        downPaymentPercent: 25,
      };
      const decisionId = await seedPriorAnalysis({
        propertyData: priorPropertyData,
        assumptions: priorAssumptions,
      });

      // CRITICAL: a stub adapter that throws if called. The whole point
      // of the prior-decision path is to SKIP fresh API calls. If the
      // adapter is invoked, the test fails — verifies reproducibility.
      const throwingAdapter: PropertyResolverAdapter = {
        async fetchExternalData() {
          throw new Error(
            'priorDecisionId branch must NOT call the external adapter ' +
              '— that would re-fetch drifting data and defeat reproducibility'
          );
        },
      };
      setPropertyResolverAdapter(throwingAdapter);

      const result = await resolvePropertyInputs.execute(
        {
          address: ADDRESS,
          purchasePrice: 275000,
          propertyType: 'SFR',
          priorDecisionId: decisionId.toHexString(),
        },
        ctxFor('stress-1')
      );

      // Every prior propertyData field appears verbatim in the result
      for (const [key, expected] of Object.entries(priorPropertyData)) {
        expect((result.propertyData as unknown as Record<string, unknown>)[key]).toBe(expected);
      }
      // Every prior assumptions field appears verbatim too
      for (const [key, expected] of Object.entries(priorAssumptions)) {
        expect((result.assumptions as unknown as Record<string, unknown>)[key]).toBe(expected);
      }
      // Provenance for prior fields is tagged 'prior_analysis'
      expect(result.provenance.monthlyRent).toBe('prior_analysis');
      expect(result.provenance.interestRate).toBe('prior_analysis');
      // confirmBeforeScoring is empty — user already saw these values
      expect(result.confirmBeforeScoring).toEqual([]);
    });

    it('applies userOverrides on top of prior values (the stress-test scenario)', async () => {
      const decisionId = await seedPriorAnalysis({
        propertyData: {
          propertyType: 'SFR',
          purchasePrice: 275000,
          monthlyRent: 1960,
          interestRate: 6.36,
        },
        assumptions: { vacancyRate: 5, mortgageRate: 6.36 },
      });

      const result = await resolvePropertyInputs.execute(
        {
          address: ADDRESS,
          purchasePrice: 275000,
          propertyType: 'SFR',
          priorDecisionId: decisionId.toHexString(),
          // The user's explicit "stress-test at 7%" change.
          userOverrides: { interestRate: 7, mortgageRate: 7 },
        },
        ctxFor('stress-2')
      );

      // Override applied to propertyData (key existed there)
      expect((result.propertyData as unknown as Record<string, unknown>).interestRate).toBe(7);
      // Override applied to assumptions (key existed there too)
      expect((result.assumptions as unknown as Record<string, unknown>).mortgageRate).toBe(7);
      // Non-overridden field stays from prior
      expect((result.propertyData as unknown as Record<string, unknown>).monthlyRent).toBe(1960);
      // Overridden field provenance flips to user_provided
      expect(result.provenance.interestRate).toBe('user_provided');
      expect(result.provenance.mortgageRate).toBe('user_provided');
      // Non-overridden stays prior_analysis
      expect(result.provenance.monthlyRent).toBe('prior_analysis');
      // discloseAfterScoring lists only the overrides (the only change)
      expect(result.discloseAfterScoring).toHaveLength(2);
      expect(result.discloseAfterScoring.map((d) => d.field).sort()).toEqual([
        'interestRate',
        'mortgageRate',
      ]);
    });

    it('two stress-tests on the SAME priorDecisionId with the SAME override produce IDENTICAL output (deterministic)', async () => {
      // This is THE assertion that proves Issue A is fixed. Repeated
      // stress-tests on the same prior decision MUST be deterministic.
      const decisionId = await seedPriorAnalysis({
        propertyData: { propertyType: 'SFR', purchasePrice: 275000, monthlyRent: 1960, interestRate: 6.36 },
        assumptions: { vacancyRate: 5, mortgageRate: 6.36 },
      });

      const run1 = await resolvePropertyInputs.execute(
        {
          address: ADDRESS,
          purchasePrice: 275000,
          propertyType: 'SFR',
          priorDecisionId: decisionId.toHexString(),
          userOverrides: { interestRate: 7 },
        },
        ctxFor('det-1')
      );
      const run2 = await resolvePropertyInputs.execute(
        {
          address: ADDRESS,
          purchasePrice: 275000,
          propertyType: 'SFR',
          priorDecisionId: decisionId.toHexString(),
          userOverrides: { interestRate: 7 },
        },
        ctxFor('det-2')
      );

      expect(run1.propertyData).toEqual(run2.propertyData);
      expect(run1.assumptions).toEqual(run2.assumptions);
      expect(run1.provenance).toEqual(run2.provenance);
    });

    it('throws when priorDecisionId points to a missing analysis (defensive)', async () => {
      const orphanId = new Types.ObjectId();
      await expect(
        resolvePropertyInputs.execute(
          {
            address: ADDRESS,
            purchasePrice: 275000,
            propertyType: 'SFR',
            priorDecisionId: orphanId.toHexString(),
          },
          ctxFor('orphan')
        )
      ).rejects.toThrow();
    });

    it('rejects malformed priorDecisionId (non-24-char hex) at the validator', async () => {
      await expect(
        resolvePropertyInputs.execute(
          {
            address: ADDRESS,
            purchasePrice: 275000,
            propertyType: 'SFR',
            priorDecisionId: 'not-an-objectid',
          },
          ctxFor('bad-id')
        )
      ).rejects.toThrow();
    });
  });
});
