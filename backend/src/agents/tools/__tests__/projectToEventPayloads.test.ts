/**
 * W4-S1 acceptance test — projectToEventPayloads (pure mapper).
 *
 * Tests the lean-substrate projection logic in isolation: no Mongo, no
 * engine, no tool context. If this test passes and the integration
 * test for score_deal also passes, we know the substrate writes are
 * shaped correctly.
 */

import { Types } from 'mongoose';
import {
  deriveQualityLabel,
  deriveQualityColor,
  projectEngineOutputToEventPayloads,
  type ProjectionInput,
  type EngineOutputForProjection,
} from '../projectToEventPayloads';
import type { SFRData, SFRMetrics } from '../../../types/propertyTypes';
import type { MarketDataResponse } from '../../../types/marketData';
import type { DecisionPayload } from '../../../models/events/DecisionEvent';

// ===== Quality binning =====

describe('deriveQualityLabel / deriveQualityColor', () => {
  it.each([
    [100, 'Above professional standards', 'green'],
    [85, 'Above professional standards', 'green'],
    [80, 'Above professional standards', 'green'],
    [79, 'Meets professional standards', 'yellow'],
    [70, 'Meets professional standards', 'yellow'],
    [65, 'Meets professional standards', 'yellow'],
    [64, 'Requires optimization', 'orange'],
    [55, 'Requires optimization', 'orange'],
    [50, 'Requires optimization', 'orange'],
    [49, 'Below professional standards', 'red'],
    [25, 'Below professional standards', 'red'],
    [0, 'Below professional standards', 'red'],
  ])('score %i → label "%s" / color "%s"', (score, label, color) => {
    expect(deriveQualityLabel(score)).toBe(label);
    expect(deriveQualityColor(score)).toBe(color);
  });
});

// ===== Projection mapper =====

describe('projectEngineOutputToEventPayloads', () => {
  /** Minimal projection input — every required field present, sensible values. */
  function makeInput(
    overrides: Partial<ProjectionInput> = {}
  ): ProjectionInput {
    const engineOutput: EngineOutputForProjection = {
      professionalAssessment: {
        dealQuality: 72,
        cashFlowScore: 80,
        irrScore: 60,
        marketStrengthScore: 70,
        debtStructureScore: 75,
        exitStrategyScore: 65,
        capRateScore: 55,
        propertyRiskScore: 80,
        primaryInsight: 'Solid cash flow with modest cap-rate spread.',
        strategicRecommendations: ['Negotiate price down 5%'],
        riskMitigation: ['Stress-test vacancy at 10%'],
        opportunityMaximization: ['Section 8 conversion'],
      },
      confidence: 82,
      marketContext: {
        marketStage: 'mid',
        pricingContext: 'fair',
        competitiveIntensity: 'moderate',
        recommendedStrategy: 'Buy & hold',
      },
      primaryReason: 'Strong cash flow stability.',
      secondaryReasons: ['Reasonable cap rate'],
      keyRisks: ['DSCR margin thin if rates rise'],
    };

    return {
      propertyData: { purchasePrice: 425000 } as unknown as SFRData,
      marketData: {
        lastUpdated: new Date(),
        dataSource: ['rentcast'],
      } as unknown as MarketDataResponse,
      assumptions: { vacancyRate: 0.05 },
      analysisResult: {
        metrics: { capRate: 5.2 } as unknown as SFRMetrics,
        monthlyAnalysis: { cashFlow: -120 },
        longTermAnalysis: { projectionYears: 10 },
      },
      engineOutput,
      userContext: { riskTolerance: 'moderate' },
      scoringWeightsUsed: {
        cashFlow: 0.35,
        irr: 0.25,
        marketStrength: 0.15,
        debtStructure: 0.1,
        exitStrategy: 0.1,
        capRate: 0.03,
        propertyRisk: 0.02,
      } as unknown as DecisionPayload['scoringWeightsUsed'],
      enrichmentSource: 'rentcast',
      enrichmentCacheHit: false,
      walkAwayPrice: 385000,
      engineVersion: 'v3.0',
      computeTimeMs: 142,
      ...overrides,
    };
  }

  // ===== AnalysisPayload shape =====

  describe('AnalysisPayload projection', () => {
    it('preserves all required AnalysisPayload fields verbatim', () => {
      const input = makeInput();
      const { analysisPayload } = projectEngineOutputToEventPayloads(input);

      expect(analysisPayload.propertyData).toBe(input.propertyData);
      expect(analysisPayload.marketData).toBe(input.marketData);
      expect(analysisPayload.assumptions).toBe(input.assumptions);
      expect(analysisPayload.metrics).toBe(input.analysisResult.metrics);
      expect(analysisPayload.monthlyAnalysis).toBe(
        input.analysisResult.monthlyAnalysis
      );
      expect(analysisPayload.longTermAnalysis).toBe(
        input.analysisResult.longTermAnalysis
      );
      expect(analysisPayload.walkAwayPrice).toBe(385000);
      expect(analysisPayload.enrichmentSource).toBe('rentcast');
      expect(analysisPayload.enrichmentCacheHit).toBe(false);
      expect(analysisPayload.engineVersion).toBe('v3.0');
      expect(analysisPayload.computeTimeMs).toBe(142);
    });
  });

  // ===== DecisionPayload shape =====

  describe('DecisionPayload draft projection', () => {
    it('uses the engine dealQuality and derives label + color', () => {
      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(
        makeInput()
      );
      expect(decisionPayloadDraft.dealQuality).toBe(72);
      expect(decisionPayloadDraft.qualityLabel).toBe('Meets professional standards');
      expect(decisionPayloadDraft.qualityColor).toBe('yellow');
    });

    it('clamps dealQuality > 100 to 100 (engine-bug defense)', () => {
      const input = makeInput();
      input.engineOutput.professionalAssessment!.dealQuality = 150;
      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(input);
      expect(decisionPayloadDraft.dealQuality).toBe(100);
    });

    it('clamps dealQuality < 0 to 0 (engine-bug defense)', () => {
      const input = makeInput();
      input.engineOutput.professionalAssessment!.dealQuality = -25;
      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(input);
      expect(decisionPayloadDraft.dealQuality).toBe(0);
    });

    it('forwards professionalAssessment verbatim (engine output is source of truth)', () => {
      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(
        makeInput()
      );
      expect(decisionPayloadDraft.professionalAssessment).toMatchObject({
        dealQuality: 72,
        cashFlowScore: 80,
        irrScore: 60,
      });
    });

    it('synthesizes marketPosition from marketContext + walkAwayPrice', () => {
      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(
        makeInput()
      );
      expect(decisionPayloadDraft.marketPosition).toEqual({
        walkAwayPrice: 385000,
        pricingContext: 'fair',
        marketStage: 'mid',
        competitiveIntensity: 'moderate',
      });
    });

    it('uses neutral defaults when marketContext is missing', () => {
      const input = makeInput();
      input.engineOutput.marketContext = undefined;
      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(input);
      expect(decisionPayloadDraft.marketPosition).toEqual({
        walkAwayPrice: 385000,
        pricingContext: 'fair',
        marketStage: 'mid',
        competitiveIntensity: 'moderate',
      });
    });

    it('builds reasoningTrail preferring professionalAssessment fields', () => {
      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(
        makeInput()
      );
      expect(decisionPayloadDraft.reasoningTrail.primaryInsight).toBe(
        'Solid cash flow with modest cap-rate spread.'
      );
      expect(decisionPayloadDraft.reasoningTrail.strategicRecommendations).toEqual([
        'Negotiate price down 5%',
      ]);
      expect(decisionPayloadDraft.reasoningTrail.keyRisks).toEqual([
        'DSCR margin thin if rates rise',
      ]);
    });

    it('falls back to legacy primaryReason when professionalAssessment.primaryInsight is missing', () => {
      const input = makeInput();
      delete input.engineOutput.professionalAssessment!.primaryInsight;
      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(input);
      expect(decisionPayloadDraft.reasoningTrail.primaryInsight).toBe(
        'Strong cash flow stability.'
      );
    });

    it('uses engine confidence; defaults to 50 if missing', () => {
      const a = projectEngineOutputToEventPayloads(makeInput());
      expect(a.decisionPayloadDraft.confidence).toBe(82);

      const input = makeInput();
      delete input.engineOutput.confidence;
      const b = projectEngineOutputToEventPayloads(input);
      expect(b.decisionPayloadDraft.confidence).toBe(50);
    });

    it('forwards optional fields: dealId, criticalFlags, userContext', () => {
      const dealId = new Types.ObjectId();
      const criticalFlags: DecisionPayload['criticalFlags'] = {
        dscrBelowOne: { dscrValue: 0.85 },
      };
      const userContext: DecisionPayload['userContext'] = {
        riskTolerance: 'conservative',
      };

      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(
        makeInput({ dealId, criticalFlags, userContext })
      );
      expect(decisionPayloadDraft.dealId).toBe(dealId);
      expect(decisionPayloadDraft.criticalFlags).toBe(criticalFlags);
      expect(decisionPayloadDraft.userContext).toBe(userContext);
    });

    it('does NOT include analysisEventId (the tool fills it in after writing the AnalysisEvent)', () => {
      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(
        makeInput()
      );
      expect(
        (decisionPayloadDraft as unknown as Record<string, unknown>).analysisEventId
      ).toBeUndefined();
    });
  });

  // ===== Trust boundary =====

  describe('throws on malformed engine output', () => {
    it('throws when professionalAssessment is missing', () => {
      const input = makeInput();
      input.engineOutput.professionalAssessment = undefined;
      expect(() => projectEngineOutputToEventPayloads(input)).toThrow(
        /missing professionalAssessment/
      );
    });

    it('throws when dealQuality is not a number', () => {
      const input = makeInput();
      // @ts-expect-error intentionally malformed
      input.engineOutput.professionalAssessment!.dealQuality = 'high';
      expect(() => projectEngineOutputToEventPayloads(input)).toThrow(
        /missing professionalAssessment/
      );
    });
  });

  // ===== Lean-substrate invariant =====

  describe('lean-substrate invariant', () => {
    it('does NOT include legacy verdict in the projected payload', () => {
      const input = makeInput();
      // Even if the engine produces a verdict, it must not appear in substrate.
      (input.engineOutput as Record<string, unknown>).verdict = 'BUY';

      const { decisionPayloadDraft } = projectEngineOutputToEventPayloads(input);
      expect((decisionPayloadDraft as Record<string, unknown>).verdict).toBeUndefined();
    });

    it('does NOT include the engine sprawling fields (actionPlan, capitalStrategy, etc.)', () => {
      const input = makeInput();
      (input.engineOutput as Record<string, unknown>).actionPlan = ['do stuff'];
      (input.engineOutput as Record<string, unknown>).capitalStrategy = { foo: 'bar' };
      (input.engineOutput as Record<string, unknown>).aiEnhancedContent = { html: '...' };

      const { analysisPayload, decisionPayloadDraft } =
        projectEngineOutputToEventPayloads(input);
      expect((analysisPayload as unknown as Record<string, unknown>).actionPlan).toBeUndefined();
      expect(
        (decisionPayloadDraft as unknown as Record<string, unknown>).actionPlan
      ).toBeUndefined();
      expect(
        (decisionPayloadDraft as unknown as Record<string, unknown>).capitalStrategy
      ).toBeUndefined();
      expect(
        (decisionPayloadDraft as unknown as Record<string, unknown>).aiEnhancedContent
      ).toBeUndefined();
    });
  });
});
