#!/usr/bin/env ts-node
/**
 * EVAL — Zod schema invariants across all wave-1 substrate schemas +
 * the cost-events schema.
 *
 * Per /docs/PRODUCT_2.0_EVALS.md §4.4.
 *
 * For each schema:
 *   - One positive case (a valid example must pass)
 *   - At least one negative case (a deliberately-malformed example
 *     must throw)
 *
 * Catches:
 *   - Schema regressions (someone marks a field optional that was
 *     required, breaks an enum, etc.)
 *   - Hidden coupling drift (a substrate consumer relies on a field
 *     the schema doesn't actually guarantee)
 *
 * Wave-1 scaffolding: ~3 cases per schema. Volume scales with the
 * regression set; the HARNESS is what we need to ship today.
 *
 * USAGE
 * -----
 *   cd backend && npm run eval:schema
 *
 * Exit 0 on all-pass, 1 on any failure.
 */

import { Types } from 'mongoose';

import { runEvalSuite, evalAssertThrows, type EvalCase } from '../../src/evals/runner';

import { ProfilePayloadSchema } from '../../src/models/events/ProfileEvent';
import { AnalysisPayloadSchema } from '../../src/models/events/AnalysisEvent';
import { DecisionPayloadSchema } from '../../src/models/events/DecisionEvent';
import { OverridePayloadSchema } from '../../src/models/events/OverrideEvent';
import { CritiquePayloadSchema } from '../../src/models/events/CritiqueEvent';
import { ConversationPayloadSchema } from '../../src/models/events/ConversationEvent';
import { AuditTrailPayloadSchema } from '../../src/models/events/AuditTrailEvent';
import { WatchlistPayloadSchema } from '../../src/models/events/WatchlistEvent';
import { OutcomePayloadSchema } from '../../src/models/events/OutcomeEvent';
import { PortfolioPayloadSchema } from '../../src/models/events/PortfolioEvent';
import { PipelinePayloadSchema } from '../../src/models/events/PipelineEvent';
import { CostEventSchema } from '../../src/models/cost/CostEvent';

// ===== Helpers =====

const objectId = (): Types.ObjectId => new Types.ObjectId();

// ===== Cases =====

const cases: EvalCase<unknown>[] = [
  // ----- ProfileEvent -----
  {
    name: 'ProfilePayloadSchema accepts minimal profile (all fields optional)',
    run: () => ProfilePayloadSchema.parse({}),
  },
  {
    name: 'ProfilePayloadSchema accepts a fully-populated profile',
    run: () =>
      ProfilePayloadSchema.parse({
        investorType: 'lender',
        portfolioSize: '11-30',
        primaryMarkets: ['Wichita'],
        role: 'loan_officer',
        institutionContext: {
          name: 'First Federal CU',
          institutionType: 'credit_union',
          typicalDealVolume: 'medium',
        },
        riskTolerance: 'moderate',
        primaryGoal: 'cash_flow',
        extractedFromInput: 'I run a credit union',
        extractionConfidence: 88,
      }),
  },
  {
    name: 'ProfilePayloadSchema rejects unknown investorType',
    run: () =>
      evalAssertThrows(() =>
        ProfilePayloadSchema.parse({ investorType: 'gambler' })
      ),
  },
  {
    name: 'ProfilePayloadSchema rejects extractionConfidence > 100',
    run: () =>
      evalAssertThrows(() =>
        ProfilePayloadSchema.parse({ extractionConfidence: 150 })
      ),
  },

  // ----- AnalysisEvent -----
  {
    name: 'AnalysisPayloadSchema accepts a well-formed analysis',
    run: () =>
      AnalysisPayloadSchema.parse({
        propertyData: { purchasePrice: 425000, propertyType: 'SFR' },
        marketData: { lastUpdated: new Date(), dataSource: ['rentcast'] },
        assumptions: { vacancyRate: 0.05 },
        metrics: { capRate: 5.2 },
        monthlyAnalysis: { cashFlow: -120 },
        longTermAnalysis: { projectionYears: 10 },
        walkAwayPrice: 385000,
        enrichmentSource: 'rentcast',
        enrichmentCacheHit: false,
        engineVersion: 'v3.0',
        computeTimeMs: 142,
      }),
  },
  {
    name: 'AnalysisPayloadSchema rejects unknown enrichmentSource',
    run: () =>
      evalAssertThrows(() =>
        AnalysisPayloadSchema.parse({
          propertyData: {},
          marketData: {},
          assumptions: {},
          metrics: {},
          monthlyAnalysis: {},
          longTermAnalysis: {},
          walkAwayPrice: 0,
          enrichmentSource: 'zillow', // not in enum
          enrichmentCacheHit: false,
          engineVersion: 'v3.0',
          computeTimeMs: 0,
        })
      ),
  },
  {
    name: 'AnalysisPayloadSchema rejects missing walkAwayPrice',
    run: () =>
      evalAssertThrows(() =>
        AnalysisPayloadSchema.parse({
          propertyData: {},
          marketData: {},
          assumptions: {},
          metrics: {},
          monthlyAnalysis: {},
          longTermAnalysis: {},
          // walkAwayPrice missing
          enrichmentSource: 'rentcast',
          enrichmentCacheHit: false,
          engineVersion: 'v3.0',
          computeTimeMs: 0,
        })
      ),
  },

  // ----- DecisionEvent -----
  {
    name: 'DecisionPayloadSchema accepts a complete decision',
    run: () =>
      DecisionPayloadSchema.parse({
        analysisEventId: objectId(),
        dealId: objectId(),
        dealQuality: 72,
        qualityLabel: 'Meets professional standards',
        qualityColor: 'yellow',
        professionalAssessment: { dealQuality: 72 },
        marketPosition: { walkAwayPrice: 385000 },
        reasoningTrail: {
          primaryInsight: 'ok',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
        confidence: 80,
        scoringWeightsUsed: { cashFlow: 0.35 },
        engineVersion: 'v3.0',
      }),
  },
  {
    name: 'DecisionPayloadSchema rejects dealQuality > 100 (deterministic-scoring invariant)',
    run: () =>
      evalAssertThrows(() =>
        DecisionPayloadSchema.parse({
          analysisEventId: objectId(),
          dealQuality: 110,
          qualityLabel: 'Above professional standards',
          qualityColor: 'green',
          professionalAssessment: {},
          marketPosition: {},
          reasoningTrail: {
            primaryInsight: 'ok',
            strategicRecommendations: [],
            riskMitigation: [],
            opportunityMaximization: [],
            keyRisks: [],
          },
          confidence: 80,
          scoringWeightsUsed: {},
          engineVersion: 'v3.0',
        })
      ),
  },
  {
    // Zod strips unknown fields (default behavior); Mongoose's
    // strict: 'throw' enforces verdict-rejection at write time. We
    // verify the Zod stripping here so substrate writes never accept
    // verdict even if a caller smuggles it in.
    name: 'DecisionPayloadSchema strips "verdict" field (architecture §1.5 — no verdict in substrate)',
    run: () => {
      const parsed = DecisionPayloadSchema.parse({
        analysisEventId: objectId(),
        verdict: 'BUY', // architecture §1.5 forbids — must NOT survive parse
        dealQuality: 80,
        qualityLabel: 'Above professional standards',
        qualityColor: 'green',
        professionalAssessment: {},
        marketPosition: {},
        reasoningTrail: {
          primaryInsight: 'ok',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
        confidence: 80,
        scoringWeightsUsed: {},
        engineVersion: 'v3.0',
      });
      const asRecord = parsed as unknown as Record<string, unknown>;
      if ('verdict' in asRecord) {
        throw new Error(
          'Zod parse retained the verdict field — substrate would be corrupted'
        );
      }
    },
  },

  // ----- OverrideEvent -----
  {
    name: 'OverridePayloadSchema accepts a structured-modal override',
    run: () =>
      OverridePayloadSchema.parse({
        originalDecisionId: objectId(),
        fieldPath: 'assumptions.vacancyRate',
        originalValue: 0.05,
        newValue: 0.08,
        inputMethod: 'structured_modal',
        priorDealQuality: 72,
      }),
  },
  {
    name: 'OverridePayloadSchema rejects empty fieldPath',
    run: () =>
      evalAssertThrows(() =>
        OverridePayloadSchema.parse({
          originalDecisionId: objectId(),
          fieldPath: '',
          originalValue: 1,
          newValue: 2,
          inputMethod: 'inline_chat',
          priorDealQuality: 50,
        })
      ),
  },

  // ----- CritiqueEvent -----
  {
    name: 'CritiquePayloadSchema accepts adversarial-critic output',
    run: () =>
      CritiquePayloadSchema.parse({
        originalDecisionId: objectId(),
        criticPersona: 'skeptical_cpa',
        agreementWithOriginal: false,
        divergenceReasons: ['Vacancy too aggressive'],
        alternativeAssumptions: [
          {
            fieldPath: 'assumptions.vacancyRate',
            suggestedValue: 0.08,
            reasoning: 'market history',
          },
        ],
        severityScore: 65,
        triggerType: 'auto_buy_band',
        modelUsed: 'claude-opus-4-7',
        tokenCost: 0.08,
      }),
  },
  {
    name: 'CritiquePayloadSchema rejects unknown criticPersona',
    run: () =>
      evalAssertThrows(() =>
        CritiquePayloadSchema.parse({
          originalDecisionId: objectId(),
          criticPersona: 'wall_street_quant', // not in enum
          agreementWithOriginal: true,
          divergenceReasons: [],
          alternativeAssumptions: [],
          severityScore: 0,
          triggerType: 'manual_request',
          modelUsed: 'claude-opus-4-7',
          tokenCost: 0,
        })
      ),
  },

  // ----- ConversationEvent -----
  {
    name: 'ConversationPayloadSchema accepts a Q&A turn',
    run: () =>
      ConversationPayloadSchema.parse({
        sessionId: '11111111-2222-4333-8444-555555555555',
        turnNumber: 1,
        userInput: { text: 'hi', inputMethod: 'text' },
        intentClassification: {
          intent: 'qa_general',
          confidence: 90,
          classifierModel: 'haiku-4-5',
        },
        routedTo: 'agent:qa',
        toolCalls: [],
        agentResponse: { text: 'hello', structuredOutputs: [], relatedEventIds: [] },
        tokenUsage: {
          inputTokens: 100,
          outputTokens: 200,
          cachedTokens: 0,
          estimatedCostCents: 1,
        },
        modelUsed: 'haiku-4-5',
        totalDurationMs: 800,
      }),
  },
  {
    name: 'ConversationPayloadSchema rejects non-UUID sessionId',
    run: () =>
      evalAssertThrows(() =>
        ConversationPayloadSchema.parse({
          sessionId: 'not-a-uuid',
          turnNumber: 1,
          userInput: { text: 'hi', inputMethod: 'text' },
          intentClassification: {
            intent: 'qa_general',
            confidence: 90,
            classifierModel: 'h',
          },
          routedTo: 'agent:qa',
          toolCalls: [],
          agentResponse: { text: 'hi', structuredOutputs: [], relatedEventIds: [] },
          tokenUsage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, estimatedCostCents: 0 },
          modelUsed: 'h',
          totalDurationMs: 0,
        })
      ),
  },

  // ----- AuditTrailEvent -----
  {
    name: 'AuditTrailPayloadSchema accepts export_pdf with format',
    run: () =>
      AuditTrailPayloadSchema.parse({
        decisionId: objectId(),
        action: 'export_pdf',
        exportFormat: 'pdf',
      }),
  },
  {
    name: 'AuditTrailPayloadSchema rejects unknown action',
    run: () =>
      evalAssertThrows(() =>
        AuditTrailPayloadSchema.parse({
          decisionId: objectId(),
          action: 'archive', // not in enum
        })
      ),
  },

  // ----- WatchlistEvent -----
  {
    name: 'WatchlistPayloadSchema accepts chat-initiated save',
    run: () =>
      WatchlistPayloadSchema.parse({
        dealId: objectId(),
        source: 'chat',
        decisionIdAtSave: objectId(),
        note: 'follow up next week',
      }),
  },
  {
    name: 'WatchlistPayloadSchema rejects unknown source',
    run: () =>
      evalAssertThrows(() =>
        WatchlistPayloadSchema.parse({
          dealId: objectId(),
          source: 'email', // not in enum
        })
      ),
  },

  // ----- OutcomeEvent -----
  {
    name: 'OutcomePayloadSchema accepts a closed outcome',
    run: () =>
      OutcomePayloadSchema.parse({
        dealId: objectId(),
        originalDecisionId: objectId(),
        outcome: 'closed',
        outcomeDate: new Date('2026-04-01'),
        reportedBy: 'self',
      }),
  },
  {
    name: 'OutcomePayloadSchema rejects unknown outcome',
    run: () =>
      evalAssertThrows(() =>
        OutcomePayloadSchema.parse({
          dealId: objectId(),
          originalDecisionId: objectId(),
          outcome: 'undecided',
          outcomeDate: new Date('2026-04-01'),
          reportedBy: 'self',
        })
      ),
  },

  // ----- PortfolioEvent (discriminated union) -----
  {
    name: 'PortfolioPayloadSchema accepts portfolio_created',
    run: () =>
      PortfolioPayloadSchema.parse({
        subType: 'portfolio_created',
        portfolioId: objectId(),
        goals: { primaryGoal: 'cash_flow' },
      }),
  },
  {
    name: 'PortfolioPayloadSchema rejects portfolio_created without goals',
    run: () =>
      evalAssertThrows(() =>
        PortfolioPayloadSchema.parse({
          subType: 'portfolio_created',
          portfolioId: objectId(),
        })
      ),
  },

  // ----- PipelineEvent (discriminated union) -----
  {
    name: 'PipelinePayloadSchema accepts deal_added_to_pipeline',
    run: () =>
      PipelinePayloadSchema.parse({
        subType: 'deal_added_to_pipeline',
        pipelineDealId: objectId(),
        dealId: objectId(),
        stage: 'initial_review',
      }),
  },
  {
    name: 'PipelinePayloadSchema rejects unknown subType',
    run: () =>
      evalAssertThrows(() =>
        PipelinePayloadSchema.parse({
          subType: 'rebalanced',
          pipelineDealId: objectId(),
        })
      ),
  },

  // ----- CostEvent -----
  {
    name: 'CostEventSchema accepts an Anthropic LLM call',
    run: () =>
      CostEventSchema.parse({
        traceId: 'trace-1',
        userId: objectId(),
        costType: 'llm',
        provider: 'anthropic',
        model: 'claude-haiku-4-5',
        inputTokens: 1500,
        outputTokens: 300,
        cachedTokens: 1000,
        costCents: 0.165,
      }),
  },
  {
    name: 'CostEventSchema rejects negative costCents',
    run: () =>
      evalAssertThrows(() =>
        CostEventSchema.parse({
          traceId: 't',
          userId: objectId(),
          costType: 'llm',
          provider: 'anthropic',
          costCents: -1,
        })
      ),
  },
];

// ===== Run =====

(async () => {
  const result = await runEvalSuite({
    suiteName: 'Wave-1 schema invariants',
    cases,
  });
  process.exit(result.allPassed ? 0 : 1);
})();
