#!/usr/bin/env ts-node
/**
 * EVAL — substrate write contract + calibration roundtrip.
 *
 * Per /docs/PRODUCT_2.0_EVALS.md §3 + §6.
 *
 * For each calibration fixture:
 *   1. Run compute_analysis → score_deal on the inputs
 *   2. Read back AnalysisEvent + DecisionEvent from substrate
 *   3. Assert substrate-persisted dealQuality === fixture.expected.dealQuality
 *      (zero tolerance — the deterministic-scoring non-negotiable means
 *      the score MUST be reproducible)
 *   4. Assert qualityLabel matches
 *   5. Assert event linkage (DecisionEvent.analysisEventId references
 *      the AnalysisEvent _id)
 *
 * Wave-1 scaffolding: 3 fixtures. Volume scales to ~500 deals
 * post-wave-1 once founder-historical backfill ships. The HARNESS
 * shipping today doesn't change.
 *
 * UPDATING EXPECTED VALUES
 * ------------------------
 *
 * When the engine is intentionally changed in a way that shifts
 * scores:
 *   1. Engine change PR includes regenerated `expected` values in
 *      backend/src/evals/fixtures/calibration/fixtures.ts
 *   2. Each changed fixture documents WHY in the engine change PR
 *      description
 *   3. Bump `lastValidated` to PR merge date
 *   4. Code review approval requires explicit acknowledgment that
 *      the calibration anchor is moving
 *
 * Per the evals doc §3.5 — drift is deliberate and reviewed, not
 * silent. This procedure is the audit trail.
 *
 * USAGE
 * -----
 *   cd backend && npm run eval:substrate
 *
 * Exit 0 on all-pass, 1 on any failure.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import {
  runEvalSuite,
  evalAssertEq,
  evalAssert,
  type EvalCase,
} from '../../src/evals/runner';

import { eventsRepository } from '../../src/repositories/EventsRepository';
import { eventsRepositoryReads } from '../../src/repositories/EventsRepositoryReads';
import { computeAnalysis } from '../../src/agents/tools/compute_analysis';
import { scoreDeal } from '../../src/agents/tools/score_deal';
import type { ToolContext } from '../../src/agents/tools/types';

import { CALIBRATION_FIXTURES } from '../../src/evals/fixtures/calibration/fixtures';

// ===== Setup / teardown =====

let mongoServer: MongoMemoryServer | null = null;

async function setup(): Promise<void> {
  // Silence noisy module-init logs from legacy services
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const noop = () => undefined;
  if (process.env.EVAL_VERBOSE !== '1') {
    (console as any).log = noop;
    (console as any).info = noop;
  }
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

async function teardown(): Promise<void> {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

// ===== Helpers =====

function ctxFor(traceId: string): ToolContext {
  return {
    traceId,
    userId: new Types.ObjectId(),
    eventsRepo: eventsRepository,
    eventsReads: eventsRepositoryReads,
    tools: {},
  };
}

// ===== Build cases =====

const cases: EvalCase<unknown>[] = CALIBRATION_FIXTURES.map((fixture, idx) => ({
  name: fixture.name,
  run: async (): Promise<string> => {
    const traceId = `eval-${idx}-${Date.now()}`;
    const ctx = ctxFor(traceId);

    // 1. compute_analysis
    const computeOutput = await computeAnalysis.execute(
      {
        propertyData: fixture.inputs.propertyData as unknown as Record<
          string,
          unknown
        >,
        assumptions: fixture.inputs.assumptions,
        propertyType: 'SFR',
      },
      ctx
    );

    // 2. score_deal
    const scoreOutput = await scoreDeal.execute(
      {
        propertyData: fixture.inputs.propertyData as unknown as Record<
          string,
          unknown
        >,
        analysisResult: computeOutput.fullResult as unknown as {
          metrics: Record<string, unknown>;
          monthlyAnalysis: Record<string, unknown>;
          longTermAnalysis: Record<string, unknown>;
        },
        userContext: fixture.inputs.userContext,
      },
      ctx
    );

    // 3. Read substrate
    const events = await eventsRepositoryReads.getEventsByTraceId(traceId);
    const analysisEvent = events.find((e) => e.eventType === 'analysis');
    const decisionEvent = events.find((e) => e.eventType === 'decision');

    // 4. Substrate write contract
    evalAssert(
      !!analysisEvent,
      'AnalysisEvent not written to substrate'
    );
    evalAssert(
      !!decisionEvent,
      'DecisionEvent not written to substrate'
    );

    const persistedDealQuality = (
      decisionEvent!.payload as { dealQuality: number }
    ).dealQuality;
    const persistedQualityLabel = (
      decisionEvent!.payload as { qualityLabel: string }
    ).qualityLabel;
    const persistedAnalysisRef = (
      decisionEvent!.payload as { analysisEventId: Types.ObjectId }
    ).analysisEventId;

    // 5. Event linkage
    evalAssertEq(
      persistedAnalysisRef.toString(),
      analysisEvent!._id.toString(),
      'DecisionEvent.analysisEventId does not reference the AnalysisEvent'
    );

    // 6. Tool return matches substrate (sanity — they should be the same)
    evalAssertEq(
      persistedDealQuality,
      scoreOutput.dealQuality,
      'Substrate dealQuality differs from tool return value (bug in projection)'
    );

    // 7. CALIBRATION CHECK — zero tolerance
    evalAssertEq(
      persistedDealQuality,
      fixture.expected.dealQuality,
      `Calibration drift: dealQuality (lastValidated ${fixture.lastValidated}, engineVersion ${fixture.engineVersion})`
    );
    evalAssertEq(
      persistedQualityLabel,
      fixture.expected.qualityLabel,
      'qualityLabel drift'
    );

    return `dealQuality=${persistedDealQuality} label="${persistedQualityLabel}"`;
  },
}));

// ===== Run =====

(async () => {
  const result = await runEvalSuite({
    suiteName: 'Substrate calibration roundtrip',
    cases,
    setup,
    teardown,
  });
  process.exit(result.allPassed ? 0 : 1);
})();
