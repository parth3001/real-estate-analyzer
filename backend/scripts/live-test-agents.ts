#!/usr/bin/env ts-node
/**
 * LIVE TEST — real Sonnet/Haiku/Opus, real tool-use loop.
 *
 * Answers the user's question: "are the agents getting the RIGHT
 * responses?" — which the stub-based unit tests CANNOT answer.
 *
 * WHAT'S REAL vs STUBBED
 * ----------------------
 *
 *   REAL (the thing under test):
 *     - The Anthropic API — real Haiku (classifier) + real Sonnet
 *       (deal-scoring, Q&A agents) + real Opus (critic)
 *     - The callWithTools tool-use loop — NEVER exercised against the
 *       real SDK before this script
 *     - The orchestrator, router, agent prompts, conversation-context
 *       threading
 *     - compute_analysis (real SFRAnalyzer — pure computation)
 *
 *   STUBBED (the external-API boundary — RentCast/FRED aren't
 *   configured locally anyway, and stubbing isolates AGENT BEHAVIOR
 *   as the single variable under test):
 *     - marketIntelligence adapter (enrich_property's data source)
 *     - PropertyResolverAdapter (resolve_property_inputs' data source)
 *     - ScoringEngineAdapter (score_deal's engine — stubbed so the
 *       score is deterministic and the test output isn't polluted by
 *       engine logs; the engine itself is unit-tested separately)
 *
 * WHAT THIS CATCHES
 * -----------------
 *   - SDK integration bugs in callWithTools (message format, tool
 *     schema format, tool_result format) — never tested live
 *   - Does real Sonnet actually FOLLOW the deal-scoring prompt? Ask
 *     for strategy + price? Call tools in the right order? Handle the
 *     two-bucket transparency?
 *   - Does the classifier recognize a terse turn-2 reply as a
 *     continuation?
 *   - Does the BRRRR-in-one-message path skip the clarifying question?
 *
 * COST: ~$0.20-0.50 total (real Sonnet in tool-use loops).
 *
 * USAGE
 * -----
 *   cd backend && unset ANTHROPIC_API_KEY && \
 *     node --env-file=.env -e "require('ts-node').register(); require('./scripts/live-test-agents.ts');"
 *
 *   (the unset + --env-file dance works around the shell exporting an
 *    empty ANTHROPIC_API_KEY — see the 2026-05-13 session notes)
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { randomUUID } from 'crypto';

import { handleTurn } from '../src/agents/orchestrator/orchestrator';
import { eventsRepositoryReads } from '../src/repositories/EventsRepositoryReads';
import {
  setMarketIntelligenceAdapter,
  resetMarketIntelligenceAdapter,
} from '../src/agents/tools/enrich_property';
import {
  setPropertyResolverAdapter,
  resetPropertyResolverAdapter,
} from '../src/agents/tools/resolve_property_inputs';
import {
  setEngineAdapter,
  resetEngineAdapter,
} from '../src/agents/tools/score_deal';
import type { EngineOutputForProjection } from '../src/agents/tools/projectToEventPayloads';
import type { MarketDataResponse } from '../src/types/marketData';

// ===== Silence the legacy services' init noise =====
const verbose = process.env.LIVE_VERBOSE === '1';
if (!verbose) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const noop = () => undefined;
  (console as any).log = noop;
  (console as any).info = noop;
  // keep console.error
}

// ===== Stub data =====

function stubMarketResponse(): MarketDataResponse {
  return {
    property: {
      rentEstimate: 2800,
      rentRange: { low: 2600, high: 3000 },
      valueEstimate: 430000,
      marketPosition: 'At Market',
      confidence: 82,
      lastUpdated: new Date(),
      dataSource: 'stub',
    } as unknown as MarketDataResponse['property'],
    comparables: [],
    marketTrends: {} as unknown as MarketDataResponse['marketTrends'],
    economicIndicators: {
      currentMortgageRate: 7.1,
      mortgageRateTrend: 'Stable',
      mortgageRateChange: 0,
      inflationRate: 3.1,
      unemploymentRate: 4.0,
      housingIndex: 310,
      housingIndexChange: 2.1,
      economicGrowth: 2.4,
      federalFundsRate: 4.5,
      lastUpdated: new Date(),
      dataSource: 'stub',
    },
    location: {
      address: '1837 Walnut Way, Anna, TX 75409',
      zipCode: '75409',
      city: 'Anna',
      state: 'TX',
    },
    lastUpdated: new Date(),
    dataSource: ['stub'],
  };
}

function stubEngineOutput(
  dealQuality = 62
): EngineOutputForProjection & Record<string, unknown> {
  return {
    professionalAssessment: {
      dealQuality,
      cashFlowScore: 68,
      irrScore: 55,
      marketStrengthScore: 65,
      debtStructureScore: 60,
      exitStrategyScore: 62,
      capRateScore: 50,
      propertyRiskScore: 75,
      primaryInsight: 'Moderate deal — cash flow is the constraint.',
      strategicRecommendations: ['Negotiate price down 5%'],
      riskMitigation: ['Stress-test vacancy at 8%'],
      opportunityMaximization: ['Light value-add on the kitchen'],
    },
    confidence: 74,
    marketContext: {
      marketStage: 'mid',
      pricingContext: 'fair',
      competitiveIntensity: 'moderate',
    },
    primaryReason: 'Moderate fundamentals.',
    secondaryReasons: [],
    keyRisks: ['Thin DSCR margin if rates rise'],
  };
}

// ===== Reporter =====

function hr(): void {
  process.stdout.write('─'.repeat(72) + '\n');
}

async function reportTurn(
  label: string,
  out: Awaited<ReturnType<typeof handleTurn>>
): Promise<void> {
  hr();
  process.stdout.write(`SCENARIO: ${label}\n`);
  hr();
  process.stdout.write(`  routed to:      ${out.routing.target}\n`);
  process.stdout.write(
    `  intent:         ${out.routing.classifierIntent} (conf ${out.routing.classifierConfidence})\n`
  );
  if (out.routing.fallbackReason) {
    process.stdout.write(`  fallbackReason: ${out.routing.fallbackReason}\n`);
  }
  process.stdout.write(`  cost:           ${out.totalCostCents.toFixed(4)}¢\n`);

  // Tool-call sequence — THE key diagnostic
  const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
  const conv = events.find((e) => e.eventType === 'conversation');
  const toolCalls =
    (conv?.payload as { toolCalls?: Array<{ toolName: string; success: boolean }> })
      ?.toolCalls ?? [];
  if (toolCalls.length > 0) {
    process.stdout.write(
      `  tool sequence:  ${toolCalls
        .map((t) => `${t.toolName}${t.success ? '' : '✗'}`)
        .join(' → ')}\n`
    );
  } else {
    process.stdout.write(`  tool sequence:  (none — text-only turn)\n`);
  }

  // Substrate events written this turn
  const eventTypes = events.map((e) => e.eventType);
  process.stdout.write(`  substrate:      ${eventTypes.join(', ')}\n`);

  process.stdout.write('\n  RESPONSE:\n');
  for (const line of out.responseText.split('\n')) {
    process.stdout.write(`    ${line}\n`);
  }
  process.stdout.write('\n');
}

// ===== Main =====

async function main(): Promise<number> {
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stdout.write(
      '\n❌  ANTHROPIC_API_KEY not set. See the USAGE block in this file.\n'
    );
    return 1;
  }

  let mongoServer: MongoMemoryServer | null = null;
  let totalCost = 0;

  try {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Stub ONLY the external-API boundary. Anthropic adapter stays REAL.
    setMarketIntelligenceAdapter({
      async getComprehensiveMarketData() {
        return stubMarketResponse();
      },
    });
    setPropertyResolverAdapter({
      async fetchExternalData() {
        return {
          rentEstimate: 2800,
          valueEstimate: 430000,
          currentMortgageRate: 7.1,
          bedrooms: 3,
          bathrooms: 2,
          squareFootage: 1850,
          yearBuilt: 2018,
          effectiveTaxRate: 1.8,
          enrichmentSource: 'stub',
        };
      },
    });
    setEngineAdapter({
      async generateDecision() {
        return stubEngineOutput(62);
      },
    });

    const userId = new Types.ObjectId();

    process.stdout.write('\n');
    process.stdout.write('═'.repeat(72) + '\n');
    process.stdout.write('  LIVE AGENT TEST — real Sonnet/Haiku, real tool-use loop\n');
    process.stdout.write('═'.repeat(72) + '\n');

    // ===== Scenario 1+2: the two-turn strategy-capture flow =====
    const sessionA = randomUUID();

    const t1 = await handleTurn({
      userInput: 'analyze 1837 Walnut Way, Anna TX 75409',
      userId,
      sessionId: sessionA,
      turnNumber: 1,
    });
    totalCost += t1.totalCostCents;
    await reportTurn(
      'Turn 1 — "analyze 1837 Walnut Way" (no strategy, no price)\n' +
        '  EXPECT: agent asks for BRRRR-vs-buy-hold AND price; no score yet',
      t1
    );

    const t2 = await handleTurn({
      userInput: 'buy and hold, my offer is $425,000',
      userId,
      sessionId: sessionA,
      turnNumber: 2,
    });
    totalCost += t2.totalCostCents;
    await reportTurn(
      'Turn 2 — "buy and hold, offer $425,000" (continuation)\n' +
        '  EXPECT: classifier sees continuation → analyze_property;\n' +
        '          agent runs resolve_property_inputs → compute_analysis →\n' +
        '          score_deal; response leads with strategy label + score',
      t2
    );

    // ===== Scenario 3: strategy + price in ONE message =====
    const sessionB = randomUUID();
    const t3 = await handleTurn({
      userInput:
        'analyze 1837 Walnut Way Anna TX 75409 as a BRRRR deal, asking $310,000',
      userId,
      sessionId: sessionB,
      turnNumber: 1,
    });
    totalCost += t3.totalCostCents;
    await reportTurn(
      'Turn 3 — "analyze ... as a BRRRR deal, asking $310,000" (one-shot)\n' +
        '  EXPECT: agent skips the clarifying question (strategy + price\n' +
        '          both in the message) → runs the full chain',
      t3
    );

    // ===== Scenario 4: rent PRE-CONFIRMED — watch the FULL chain =====
    // The earlier scenarios all stopped at the confirm-rent checkpoint.
    // Here the user supplies rent up front, so confirmBeforeScoring is
    // empty and the agent should run resolve → compute → score to
    // completion in one turn. This is the back-half verification.
    const sessionD = randomUUID();
    const t4 = await handleTurn({
      userInput:
        'analyze 1837 Walnut Way Anna TX 75409 as buy-and-hold, ' +
        'purchase price $425,000, and rent is $2,800/mo',
      userId,
      sessionId: sessionD,
      turnNumber: 1,
    });
    totalCost += t4.totalCostCents;
    await reportTurn(
      'Turn 4 — full one-shot: strategy + price + rent all supplied\n' +
        '  EXPECT: confirmBeforeScoring empty → agent runs the COMPLETE\n' +
        '          chain: resolve_property_inputs → compute_analysis →\n' +
        '          score_deal; response leads with strategy label + score;\n' +
        '          substrate gets analysis + decision events',
      t4
    );

    // ===== Scenario 5: Q&A question =====
    const sessionC = randomUUID();
    const t5 = await handleTurn({
      userInput: 'what does cap rate actually mean?',
      userId,
      sessionId: sessionC,
      turnNumber: 1,
    });
    totalCost += t5.totalCostCents;
    await reportTurn(
      'Turn 5 — "what does cap rate mean?" (Q&A)\n' +
        '  EXPECT: routes to agent:qa; educational text answer',
      t5
    );

    hr();
    process.stdout.write(
      `\n💰  TOTAL COST: ${totalCost.toFixed(4)}¢  (≈ $${(totalCost / 100).toFixed(5)})\n\n`
    );
  } catch (err) {
    process.stdout.write(
      `\n❌  FATAL: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`
    );
    return 1;
  } finally {
    resetMarketIntelligenceAdapter();
    resetPropertyResolverAdapter();
    resetEngineAdapter();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }

  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stdout.write(`\n❌  ${err}\n`);
    process.exit(1);
  });
