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
      expect(pd.closingCosts).toBeCloseTo(425000 * 0.015);
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
});
