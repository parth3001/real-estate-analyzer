/**
 * W4-S6 acceptance test — tool:compute_analysis.
 *
 * Uses a fake AnalyzerAdapter (legacy analyzers are sealed per the
 * strangler-fig rule). Verifies:
 *   1. Tool contract conformance (invokeLLM: false, no events, no API)
 *   2. Property-type routing (SFR vs Multi-Family)
 *   3. Output reshape: bundles annualAnalysis + projections +
 *      exitAnalysis into longTermAnalysis
 *   4. Output shape matches what score_deal's input expects
 *      (the substrate writes work end-to-end)
 *   5. Trust boundary on malformed input
 */

import { Types } from 'mongoose';
import {
  computeAnalysis,
  setAnalyzerAdapter,
  resetAnalyzerAdapter,
  type AnalyzerAdapter,
  type AnyAnalysisResult,
} from '../compute_analysis';
import type { ToolContext } from '../types';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';

describe('tool:compute_analysis (W4-S6)', () => {
  function makeCtx(): ToolContext {
    return {
      traceId: 'trace-compute',
      userId: new Types.ObjectId(),
      eventsRepo: new EventsRepository(),
      eventsReads: new EventsRepositoryReads(),
      tools: {},
    };
  }

  function stubResult(
    overrides: Partial<AnyAnalysisResult> = {}
  ): AnyAnalysisResult {
    // AnyAnalysisResult is a discriminated union over `metrics`; literal
    // objects don't narrow without an explicit cast. Tests don't care
    // about the metrics shape — pass through unknown.
    const base = {
      monthlyAnalysis: {
        income: { gross: 2500, effective: 2375 },
        expenses: { operating: 500, debt: 1800, total: 2300, breakdown: {} },
        cashFlow: 75,
      },
      annualAnalysis: {
        income: 28500,
        expenses: 27600,
        noi: 22500,
        debtService: 21600,
        cashFlow: 900,
      },
      metrics: {
        capRate: 5.2,
        cashOnCash: 1.8,
        dscr: 1.05,
      },
      projections: [{ year: 1, cashFlow: 900, propertyValue: 425000 }],
      exitAnalysis: { netProceedsFromSale: 150000 },
      ...overrides,
    };
    return base as unknown as AnyAnalysisResult;
  }

  function makeAdapter(
    result: AnyAnalysisResult,
    onCall?: (args: Parameters<AnalyzerAdapter['analyze']>[0]) => void
  ): AnalyzerAdapter {
    return {
      async analyze(args) {
        if (onCall) onCall(args);
        return result;
      },
    };
  }

  function makeInput(
    propertyType: 'SFR' | 'Multi-Family' = 'SFR'
  ) {
    return {
      propertyData: { purchasePrice: 425000, propertyType },
      assumptions: {
        projectionYears: 10,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5,
      },
      propertyType,
    };
  }

  afterEach(() => {
    resetAnalyzerAdapter();
  });

  // ===== Contract =====

  describe('Tool contract', () => {
    it('declares invokeLLM: false', () => {
      expect(computeAnalysis.invokeLLM).toBe(false);
    });
    it('declares no side effects (pure compute)', () => {
      expect(computeAnalysis.sideEffects).toEqual([]);
    });
    it('uses NO_RETRY (deterministic — same inputs, same outputs)', () => {
      expect(computeAnalysis.retrySemantics.maxAttempts).toBe(1);
    });
    it('has the stable global name', () => {
      expect(computeAnalysis.name).toBe('compute_analysis');
    });
  });

  // ===== Property-type routing =====

  describe('property-type routing', () => {
    it('routes SFR to the SFR path with propertyType: SFR', async () => {
      let capturedType: 'SFR' | 'Multi-Family' | undefined;
      setAnalyzerAdapter(
        makeAdapter(stubResult(), (args) => {
          capturedType = args.propertyType;
        })
      );

      await computeAnalysis.execute(makeInput('SFR'), makeCtx());
      expect(capturedType).toBe('SFR');
    });

    it('routes Multi-Family to the MF path with propertyType: Multi-Family', async () => {
      let capturedType: 'SFR' | 'Multi-Family' | undefined;
      setAnalyzerAdapter(
        makeAdapter(stubResult(), (args) => {
          capturedType = args.propertyType;
        })
      );

      await computeAnalysis.execute(makeInput('Multi-Family'), makeCtx());
      expect(capturedType).toBe('Multi-Family');
    });
  });

  // ===== Output reshape =====

  describe('output reshape', () => {
    it('returns metrics + monthlyAnalysis directly from the analyzer', async () => {
      const result = stubResult();
      setAnalyzerAdapter(makeAdapter(result));

      const out = await computeAnalysis.execute(makeInput(), makeCtx());
      expect(out.metrics).toBe(result.metrics);
      expect(out.monthlyAnalysis).toBe(result.monthlyAnalysis);
    });

    it('bundles annualAnalysis + projections + exitAnalysis into longTermAnalysis', async () => {
      const result = stubResult();
      setAnalyzerAdapter(makeAdapter(result));

      const out = await computeAnalysis.execute(makeInput(), makeCtx());
      expect(out.longTermAnalysis).toEqual({
        annualAnalysis: result.annualAnalysis,
        projections: result.projections,
        exitAnalysis: result.exitAnalysis,
      });
    });

    it('exposes the full AnalysisResult on `fullResult`', async () => {
      const result = stubResult();
      setAnalyzerAdapter(makeAdapter(result));

      const out = await computeAnalysis.execute(makeInput(), makeCtx());
      expect(out.fullResult).toBe(result);
    });
  });

  // ===== Inter-tool compatibility =====

  describe('inter-tool compatibility', () => {
    it('output shape matches what score_deal expects as analysisResult', async () => {
      setAnalyzerAdapter(makeAdapter(stubResult()));
      const out = await computeAnalysis.execute(makeInput(), makeCtx());

      // score_deal's analysisResult input requires: { metrics, monthlyAnalysis,
      // longTermAnalysis } — all non-null objects.
      expect(typeof out.metrics).toBe('object');
      expect(out.metrics).not.toBeNull();
      expect(typeof out.monthlyAnalysis).toBe('object');
      expect(out.monthlyAnalysis).not.toBeNull();
      expect(typeof out.longTermAnalysis).toBe('object');
      expect(out.longTermAnalysis).not.toBeNull();
    });
  });

  // ===== Trust boundary =====

  describe('input validation', () => {
    it('rejects missing propertyData', async () => {
      setAnalyzerAdapter(makeAdapter(stubResult()));
      await expect(
        computeAnalysis.execute(
          {
            assumptions: makeInput().assumptions,
            propertyType: 'SFR',
          } as unknown as Parameters<typeof computeAnalysis.execute>[0],
          makeCtx()
        )
      ).rejects.toThrow();
    });

    it('rejects missing assumptions fields', async () => {
      setAnalyzerAdapter(makeAdapter(stubResult()));
      await expect(
        computeAnalysis.execute(
          {
            ...makeInput(),
            assumptions: { projectionYears: 10 } as unknown as ReturnType<
              typeof makeInput
            >['assumptions'],
          },
          makeCtx()
        )
      ).rejects.toThrow();
    });

    it('rejects unknown propertyType', async () => {
      setAnalyzerAdapter(makeAdapter(stubResult()));
      await expect(
        computeAnalysis.execute(
          {
            ...makeInput(),
            propertyType: 'Commercial' as unknown as 'SFR',
          },
          makeCtx()
        )
      ).rejects.toThrow();
    });

    it('rejects negative projectionYears', async () => {
      setAnalyzerAdapter(makeAdapter(stubResult()));
      await expect(
        computeAnalysis.execute(
          {
            ...makeInput(),
            assumptions: { ...makeInput().assumptions, projectionYears: -5 },
          },
          makeCtx()
        )
      ).rejects.toThrow();
    });

    it('rejects vacancyRate > 100', async () => {
      setAnalyzerAdapter(makeAdapter(stubResult()));
      await expect(
        computeAnalysis.execute(
          {
            ...makeInput(),
            assumptions: { ...makeInput().assumptions, vacancyRate: 150 },
          },
          makeCtx()
        )
      ).rejects.toThrow();
    });

    it('propagates analyzer failures', async () => {
      setAnalyzerAdapter({
        async analyze() {
          throw new Error('Analyzer boom');
        },
      });
      await expect(
        computeAnalysis.execute(makeInput(), makeCtx())
      ).rejects.toThrow(/Analyzer boom/);
    });
  });
});
