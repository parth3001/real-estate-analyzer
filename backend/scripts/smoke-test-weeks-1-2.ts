#!/usr/bin/env ts-node
/**
 * SMOKE TEST — Weeks 1-2 exit gate per PRODUCT_2.0_FIRST_2_WEEKS.md §6.
 *
 * Wires the wave-1 tool chain together end-to-end and verifies that the
 * substrate-stored Deal Quality Score matches what the legacy engine
 * produces from a direct call with the same inputs:
 *
 *   1. enrich_property   (stubbed market data — no external API calls)
 *   2. compute_analysis  (real SFRAnalyzer, no externals)
 *   3. score_deal        (real InvestmentDecisionEngine, writes substrate)
 *   4. Read back AnalysisEvent + DecisionEvent from substrate
 *   5. Call engine.generateInvestmentDecision() directly with same inputs
 *   6. Compare: dealQuality MUST match
 *
 * Uses mongodb-memory-server — no live Atlas needed. Stubs only the
 * MarketIntelligence adapter (avoids RentCast / FRED dependency); every
 * other piece is the real production code.
 *
 * Exit status: 0 = PASS, 1 = FAIL.
 *
 * USAGE
 * -----
 *
 *   npm run smoke-test:weeks-1-2
 *
 *   # Optional: increase verbosity (default just prints the report)
 *   SMOKE_VERBOSE=1 npm run smoke-test:weeks-1-2
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { eventsRepository } from '../src/repositories/EventsRepository';
import { eventsRepositoryReads } from '../src/repositories/EventsRepositoryReads';
import {
  enrichProperty,
  setMarketIntelligenceAdapter,
  resetMarketIntelligenceAdapter,
} from '../src/agents/tools/enrich_property';
import { computeAnalysis } from '../src/agents/tools/compute_analysis';
import { scoreDeal } from '../src/agents/tools/score_deal';
import type { ToolContext } from '../src/agents/tools/types';
import { InvestmentDecisionEngine } from '../src/services/investment/investmentDecisionEngine';
import type { SFRData } from '../src/types/propertyTypes';
import type { AnalysisAssumptions } from '../src/analysis/BasePropertyAnalyzer';
import type { MarketDataResponse } from '../src/types/marketData';

// ===== Silence non-error console noise =====

const verbose = process.env.SMOKE_VERBOSE === '1';
if (!verbose) {
  // The legacy services log liberally on init. Suppress unless verbose.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const noop = () => undefined;
  (console as any).log = noop;
  (console as any).info = noop;
  // Keep console.error visible.
}

// ===== Fixture — Anna TX-shaped SFR property =====

const propertyData: SFRData = {
  propertyType: 'SFR',
  purchasePrice: 425000,
  downPayment: 85000, // 20%
  interestRate: 7.0,
  loanTerm: 30,
  monthlyRent: 2800,
  propertyTaxRate: 1.8,
  insuranceRate: 0.6,
  propertyManagementRate: 8,
  maintenanceCost: 1800, // Annual
  squareFootage: 1850,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 2018,
  closingCosts: 6000,
  propertyAddress: {
    street: '1837 Walnut Way',
    city: 'Anna',
    state: 'TX',
    zipCode: '75409',
  },
};

const assumptions: AnalysisAssumptions = {
  projectionYears: 10,
  annualRentIncrease: 3,
  annualExpenseIncrease: 2.5,
  annualPropertyValueIncrease: 3.5,
  sellingCosts: 6,
  vacancyRate: 5,
};

const userContext = {
  riskTolerance: 'moderate' as const,
  availableCash: 100000,
};

// Engine's userContext shape (legacy — different field names)
const engineUserContext = {
  availableCash: 100000,
  experienceLevel: 'intermediate' as const,
  riskTolerance: 'moderate' as const,
  investmentGoals: 'balanced' as const,
};

// ===== Stub MarketIntelligence so we don't hit external APIs =====

function stubMarketResponse(): MarketDataResponse {
  return {
    property: { rentEstimate: 2800 } as unknown as MarketDataResponse['property'],
    comparables: [],
    marketTrends: {
      medianRent: 2800,
      medianHomePrice: 420000,
    } as unknown as MarketDataResponse['marketTrends'],
    economicIndicators: {
      mortgageRate: 7.0,
      unemployment: 4.0,
    } as unknown as MarketDataResponse['economicIndicators'],
    location: {
      address: propertyData.propertyAddress.street,
      zipCode: propertyData.propertyAddress.zipCode,
      city: propertyData.propertyAddress.city,
      state: propertyData.propertyAddress.state,
    },
    lastUpdated: new Date(),
    dataSource: ['fallback'],
  };
}

// ===== Reporter =====

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function check(name: string, ok: boolean, detail?: string): void {
  checks.push({ name, ok, detail });
}

function printReport(): void {
  /* eslint-disable no-console */
  // Restore console.log for the report.
  process.stdout.write('\n');
  process.stdout.write('===== SMOKE TEST — Weeks 1-2 exit gate =====\n');
  for (const c of checks) {
    const icon = c.ok ? '✅' : '❌';
    process.stdout.write(`${icon}  ${c.name}\n`);
    if (c.detail) {
      process.stdout.write(`     ${c.detail}\n`);
    }
  }
  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;
  process.stdout.write('\n');
  process.stdout.write(`${passed}/${total} checks passed.\n`);
  process.stdout.write('============================================\n');
}

// ===== Main =====

async function main(): Promise<number> {
  let mongoServer: MongoMemoryServer | null = null;
  try {
    // ===== 1. Boot in-memory Mongo + connect =====

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    check('mongodb-memory-server up + mongoose connected', true);

    // ===== 2. Stub MarketIntelligence (no external API) =====

    setMarketIntelligenceAdapter({
      async getComprehensiveMarketData() {
        return stubMarketResponse();
      },
    });

    const userId = new Types.ObjectId();
    const traceId = `smoke-${Date.now()}`;
    const ctx: ToolContext = {
      traceId,
      userId,
      eventsRepo: eventsRepository,
      eventsReads: eventsRepositoryReads,
      tools: {},
    };

    // ===== 3. Tool chain: enrich → compute → score =====

    const enrichment = await enrichProperty.execute(
      {
        address: propertyData.propertyAddress,
        propertyType: 'SFR',
      },
      ctx
    );
    check(
      'enrich_property runs and produces enrichmentSource',
      !!enrichment.enrichmentSource
    );

    const computeOutput = await computeAnalysis.execute(
      {
        propertyData: propertyData as unknown as Record<string, unknown>,
        assumptions,
        propertyType: 'SFR',
      },
      ctx
    );
    check(
      'compute_analysis returns metrics + monthlyAnalysis + longTermAnalysis',
      !!computeOutput.metrics &&
        !!computeOutput.monthlyAnalysis &&
        !!computeOutput.longTermAnalysis
    );

    const scoreOutput = await scoreDeal.execute(
      {
        propertyData: propertyData as unknown as Record<string, unknown>,
        // Pass the FULL analyzer result so the engine sees what it expects;
        // Zod passthrough preserves the extra fields beyond the lean trio.
        analysisResult: computeOutput.fullResult as unknown as {
          metrics: Record<string, unknown>;
          monthlyAnalysis: Record<string, unknown>;
          longTermAnalysis: Record<string, unknown>;
        },
        marketData: enrichment.fullResponse as unknown as Record<
          string,
          unknown
        >,
        assumptions: assumptions as unknown as Record<string, unknown>,
        userContext,
        enrichmentSource: enrichment.enrichmentSource,
        enrichmentCacheHit: enrichment.cacheHit,
      },
      ctx
    );
    check(
      'score_deal returns a valid Deal Quality Score',
      typeof scoreOutput.dealQuality === 'number' &&
        scoreOutput.dealQuality >= 0 &&
        scoreOutput.dealQuality <= 100,
      `dealQuality = ${scoreOutput.dealQuality}, label = "${scoreOutput.qualityLabel}", color = ${scoreOutput.qualityColor}`
    );

    // ===== 4. Read back AnalysisEvent + DecisionEvent from substrate =====

    const events = await eventsRepositoryReads.getEventsByTraceId(traceId);
    const analysisEvent = events.find((e) => e.eventType === 'analysis');
    const decisionEvent = events.find((e) => e.eventType === 'decision');

    check(
      'AnalysisEvent + DecisionEvent both written to substrate',
      !!analysisEvent && !!decisionEvent,
      `events for trace: ${events.map((e) => e.eventType).join(', ')}`
    );

    check(
      'DecisionEvent.analysisEventId references the AnalysisEvent',
      !!decisionEvent &&
        !!analysisEvent &&
        (decisionEvent.payload as { analysisEventId: Types.ObjectId })
          .analysisEventId.toString() === analysisEvent._id.toString()
    );

    const substrateDealQuality = (
      decisionEvent?.payload as { dealQuality?: number } | undefined
    )?.dealQuality;

    check(
      'Substrate-persisted dealQuality matches tool return value',
      substrateDealQuality === scoreOutput.dealQuality,
      `substrate=${substrateDealQuality}  tool=${scoreOutput.dealQuality}`
    );

    // ===== 5. Direct engine call (the comparison oracle) =====

    const engine = new InvestmentDecisionEngine();
    const directDecision = await engine.generateInvestmentDecision(
      propertyData,
      computeOutput.fullResult,
      null, // predictions
      enrichment.fullResponse, // marketIntelligence
      engineUserContext
    );
    const directDealQuality =
      directDecision.professionalAssessment?.dealQuality;

    check(
      'Direct engine call produces a professionalAssessment.dealQuality',
      typeof directDealQuality === 'number',
      `direct dealQuality = ${directDealQuality}`
    );

    // ===== 6. THE EXIT-GATE COMPARISON =====

    check(
      'Substrate dealQuality === direct engine dealQuality (exit gate)',
      substrateDealQuality === directDealQuality,
      `substrate=${substrateDealQuality}  direct=${directDealQuality}`
    );

    // ===== 7. Substrate has NO verdict (deterministic-scoring rule) =====

    const hasVerdict =
      !!analysisEvent &&
      'verdict' in (analysisEvent.payload as Record<string, unknown>);
    const decisionHasVerdict =
      !!decisionEvent &&
      'verdict' in (decisionEvent.payload as Record<string, unknown>);
    check(
      'No verdict field in AnalysisEvent or DecisionEvent (architecture §1.5)',
      !hasVerdict && !decisionHasVerdict
    );

    // ===== 8. Verify the lean projection dropped the engine's sprawl =====

    const decisionPayload = decisionEvent?.payload as Record<string, unknown>;
    const droppedFields = [
      'actionPlan',
      'capitalStrategy',
      'alternativeOptions',
      'timeline',
      'aiEnhancedContent',
      'sensitivityAnalysis',
      'taxAnalysis',
    ];
    const leakedFields = droppedFields.filter((f) => f in (decisionPayload ?? {}));
    check(
      'Lean substrate: sprawling engine fields NOT persisted to DecisionEvent',
      leakedFields.length === 0,
      leakedFields.length > 0
        ? `Leaked: ${leakedFields.join(', ')}`
        : undefined
    );
  } catch (err) {
    check(
      'No uncaught exceptions during chain',
      false,
      err instanceof Error ? err.message : String(err)
    );
  } finally {
    resetMarketIntelligenceAdapter();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }

  printReport();

  const allPassed = checks.every((c) => c.ok);
  return allPassed ? 0 : 1;
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((err) => {
    process.stdout.write(`\n❌  Fatal error: ${err}\n`);
    process.exit(1);
  });
