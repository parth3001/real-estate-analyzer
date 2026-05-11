# REanalyzr 2.0 — Evals

**Document type:** Companion doc to [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) §8
**Authored:** 2026-05-10
**Status:** Draft 1
**Owns:** Eval philosophy, golden sets per agent, calibration check vs. existing engine, CI gating, drift detection, adversarial-agent meta-eval, substrate write verification

---

## 0. Scope and non-scope

**This doc covers:**
- Three eval surfaces and how they gate the platform
- Calibration check methodology — the load-bearing eval that protects the deterministic-scoring non-negotiable
- Golden-set construction per agent
- CI gating: what blocks merges, what reports get posted to PRs
- Adversarial-agent meta-eval (4-week kill criterion implementation)
- Substrate write verification (no agent ships without verified writes)
- Schema validation for structured outputs
- Hallucination detection for Q&A
- Cost / latency benchmarks
- Prompt regression on model upgrades

**Out of scope:**
- Specific test framework choice for the eval harness — pragmatic; defer to implementation
- Real-user analytics / product metrics (different system, different cadence)
- Security testing / pen-testing
- Load testing under traffic spikes
- Frontend / E2E browser tests (covered separately by Cypress suite)

---

## 1. Eval philosophy

**LLM behavior is probabilistic. Eval thresholds, not assertions.**

The instinct from deterministic code testing — "the output equals X, or it's a bug" — doesn't survive contact with LLM-driven agents. A Q&A agent that says "Your cap rate of 5.2% is below the Phoenix market median of 6.1%" on Monday may say "The cap rate (5.2%) is below the 6.1% Phoenix market median" on Tuesday. Both are correct. Both should pass.

The evals in this doc operate on:

| Concept | Deterministic test (don't do this for LLM) | Eval threshold (do this) |
|---|---|---|
| Output match | `expect(response).toBe(expected)` | `expect(verdictMatches(response, expected)).toBe(true)` |
| Score accuracy | `expect(score).toBe(67)` | `expect(score).toBeWithin(±3, 67)` |
| Pass rate | "all 50 tests pass" | "≥95% of 50 golden examples produce correct verdict" |
| Schema | `expect(output.score).toEqual(67)` | `expect(output).toMatchSchema(ScoreSchema)` (deterministic — keep strict) |

**One critical exception: the deterministic core stays deterministic.** The `dealQuality` score produced by `tool:score_deal` is computed by code, not AI. **That score must reproduce exactly for the same inputs.** The probabilistic threshold framing applies to *agent reasoning* (text generation, tool-call sequencing, explanation quality) — not to the deterministic engine's outputs.

**Two complementary failure signals:**

1. **Calibration drift** — agent-driven analysis pipeline produces different scores than the existing engine. This is the **highest-priority signal** in a substrate-backed system. Drift = either the tool wrapper is wrong, the engine code was changed, or the inputs are being mangled in transit. All three are bugs.
2. **Quality drift** — agent reasoning quality, explanation correctness, schema adherence drops. Caught by golden sets and CI gating.

Calibration drift is non-negotiable to fix. Quality drift is tunable and may sometimes reflect intentional behavior changes (new prompt version, new tone for B2B users).

---

## 2. The three eval surfaces

Recap from [PRODUCT_2.0_ARCHITECTURE.md §8](PRODUCT_2.0_ARCHITECTURE.md), with depth in this doc:

| Surface | What it tests | Where it runs | Gates what |
|---|---|---|---|
| **Calibration check** | New agent pipeline produces same `dealQuality` as existing engine on a regression set | CI (every PR touching agents, tools, or engine) | Merge to `reanalyzr-2.0` |
| **Golden sets per agent** | Agent reasoning, output structure, schema validity, no directive-language violations | CI + local dev | Merge to `reanalyzr-2.0` |
| **Adversarial-agent meta-eval** | Critic personas are producing useful disagreement signal (not noise, not trivial agreement) | Weekly review report | 4-week kill criterion decision (per thesis §5.5) |

Plus secondary surfaces (don't gate merges but track):
- Substrate write verification (every agent path emits expected event types)
- Cost / latency benchmarks (per-agent, per-tool)
- Prompt regression on model-version migrations

---

## 3. Calibration check — the critical eval

This is the load-bearing eval. It protects the deterministic-scoring non-negotiable.

### 3.1 What it tests

For a curated regression set of ~500 deals, run the same property data through:

1. **The existing engine** ([investmentDecisionEngine.ts](../backend/src/services/investment/investmentDecisionEngine.ts)) directly — call `calculateProfessionalAssessment(...)`, get the canonical `dealQuality` and factor scores.
2. **The new agent pipeline** — feed the same property data into `agent:deal_scoring` (which calls `tool:enrich_property` → `tool:compute_analysis` → `tool:score_deal`). Extract `dealQuality` and factor scores from the resulting `DecisionEvent`.

Compare. Any divergence between (1) and (2) is a bug. The score is supposed to be deterministic — the agent is just orchestrating the same calibrated formula.

### 3.2 Tolerance and divergence policy

**Default tolerance: zero.** The score must match exactly. The engine code is the same code in both paths. The agent doesn't compute; it orchestrates the tools that compute.

**Practical tolerance for first-pass calibration:** ±0 on `dealQuality` (integer). If even one deal in the regression set produces a different score in the new pipeline, the calibration check fails.

**The thesis open question (§10.9):** "what's the agent-divergence threshold for bug vs. improvement?" My answer: there is no "improvement" threshold. The score should not improve via the agent — the agent isn't supposed to compute. **Divergence = bug, always.** If we genuinely want to change the scoring formula in a way that produces different scores, that's a deliberate engine change, gated separately, and the regression set's expected outputs are updated as part of that change with explicit justification.

This is stricter than the architecture doc's earlier "±3 tolerance" framing. After reading the engine code, I believe zero is the right answer. The engine produces integer `dealQuality` via the existing `Math.round(...)` in `calculateProfessionalAssessment`. There is no precision drift to absorb. Either the agent path produces the same integer or it doesn't.

### 3.3 What divergence usually means

When the calibration check fails, the root cause is almost always one of:

| Failure mode | Likely cause | Fix |
|---|---|---|
| All scores diverge by the same amount | Tool wrapper shape bug — wrong input field name, missing field, type coercion | Fix the tool's input mapping |
| Some scores diverge, no pattern | Engine code accidentally changed (e.g., a refactor) | Revert engine change or update regression set explicitly |
| Scores match but other fields differ | Reasoning trail / market position passed through incorrectly | Fix tool output mapping |
| Verdict was supposed to be in DecisionEvent | Old behavior; we don't persist verdict anymore | Update test expectations |

The calibration check is a **shape and wiring test, not a quality test.** It says: "Does the agent's orchestration produce the same engine output as direct engine call?" Yes → pass. No → wiring bug.

### 3.4 Regression set construction

Sources for the 500 deals:

1. **Founder-historical backfill** (thesis §5.5): ~2 years of real personal analyses run through the existing engine. Diverse properties, markets, strategies. The most authentic substrate seed; also the calibration anchor.
2. **Synthetic edge cases**: deliberately constructed properties that hit each scoring tier (BUY-band ≥80, NEGOTIATE-band 65-79, CAUTION-band 50-64, PASS-band <50), each critical-flag scenario (DSCR<1, low rent-to-price ratio, etc.), each persona variant (conservative/moderate/aggressive). Covers boundary conditions the founder-historical set may miss.
3. **MF-specific cases** for the MF scoring path (using `MFDecisionEngine`).

Stored as JSON fixtures in `/tests/golden/calibration/`. Each fixture has:
```json
{
  "name": "phoenix-3bd-class-b-moderate",
  "inputs": { "propertyData": {...}, "userContext": {...} },
  "expected": {
    "dealQuality": 67,
    "factorScores": { "cashFlowScore": 80, "irrScore": 70, ... },
    "criticalFlags": [],
    "walkAwayPrice": 385000
  },
  "lastValidated": "2026-05-10",
  "engineVersion": "v3.0"
}
```

`expected` is generated by running the existing engine on `inputs` at fixture-creation time. CI compares agent-pipeline output to `expected`.

### 3.5 Updating expected values

The regression set's `expected` values are pinned to a specific engine version. When the engine is intentionally changed:

1. Engine change PR includes regenerated `expected` values
2. Each changed fixture documents *why* the expected value changed
3. Code review approval requires explicit acknowledgment that calibration anchor is moving
4. After merge, the new `expected` values become the new anchor

This makes engine evolution traceable. It's not impossible — it's deliberate and reviewed.

### 3.6 Drift detection

CI runs the calibration check on every PR. Failures block merge. PR comment posts:

```
Calibration check: FAILED
─────────────────────────
500 fixtures evaluated
  ✓ 487 matched expected output
  ✗  13 diverged

Sample divergences:
  - phoenix-3bd-class-b-moderate: expected 67, got 65 (-2)
  - dallas-mf-12units-aggressive: expected 84, got 81 (-3)
  - memphis-sfr-cashflow: expected 73, got 73 (verdict mismatch — old "BUY", new not persisted)

Most likely cause (heuristic):
  All 13 divergences are -2 to -3 lower than expected.
  Pattern suggests scoring weight change or factor scoring drift.
```

The heuristic-driven "likely cause" is a soft signal; final diagnosis is engineering work. But the report saves time by surfacing patterns.

### 3.7 Per-PR vs. periodic runs

- **Per PR:** run on PRs that touch `/backend/src/services/investment/`, `/backend/src/agents/deal-scoring/`, `/backend/src/tools/scoreDeal.ts`, `/backend/src/tools/computeAnalysis.ts`, `/backend/src/analysis/`
- **Periodic (nightly):** run the full regression set against current `reanalyzr-2.0` HEAD even without a PR — catches drift from indirect changes (dependency upgrades, environment changes)
- **Quarterly review:** human review of the regression set — are the expected values still right? Any drift in real-world deals that should be added?

---

## 4. Golden sets per agent

Calibration check covers the scoring path. Golden sets cover everything else: agent reasoning, output structure, schema validity, persona-aware tone.

### 4.1 Structure

`/tests/golden/<agent>/<scenario>.json`:

```json
{
  "scenario": "qa-explain-67-score",
  "agent": "qa",
  "inputs": {
    "userInput": "why did this score 67?",
    "userContext": { "experienceLevel": "intermediate", "investorType": "retail" },
    "decisionContext": { "decisionId": "test-decision-1", "dealQuality": 67, ... }
  },
  "expected": {
    "behaviors": [
      "references the 67 score explicitly",
      "explains the factor breakdown (cash flow, IRR, cap rate, etc.)",
      "no directive language (no 'should buy', 'recommend', etc.)",
      "mentions at least one specific number from the analysis",
      "appropriate tone for intermediate experienceLevel — no over-explanation"
    ],
    "antiPatterns": [
      "directive language present",
      "hallucinated metric values not in inputs",
      "off-topic content",
      "verdict-style framing (BUY/PASS/NEGOTIATE/CAUTION categorical)"
    ],
    "schema": "QAReasoningOutput"
  }
}
```

`behaviors` and `antiPatterns` are LLM-judged. A small evaluator model (Haiku 4.5) reads the actual agent output, the expected behaviors, and the anti-patterns, and produces a structured pass/fail per criterion. **Probabilistic eval over probabilistic output** — not deterministic match.

### 4.2 Golden-set sizing per agent

| Agent | Set size | Coverage |
|---|---|---|
| Deal-scoring | ~50 | Wave 1 minimum: each scoring band, each critical flag, each persona variant, B2B variants, error cases |
| Q&A | ~100 | More scenarios: metric explanations, decision explanations, override "what if" flows, persona-aware tone, B2B framing, novice/expert distinction |
| Adversarial critic | ~30 | Each persona × varied decision bands × strong/weak engine verdicts. Measures persona consistency (does optimistic_flipper actually bias optimistically) |

Smaller than typical ML-eval sets because each scenario is rich (multi-turn context, structured output schema, multiple behaviors). 50 well-curated scenarios outperform 500 noisy ones.

### 4.3 LLM-as-judge methodology

Each golden-set run:
1. Run the agent under test with `inputs`
2. Capture full output (text + structured outputs)
3. Pass to evaluator model (Haiku 4.5, cheap):
   ```
   Agent output: <actual output>
   Expected behaviors: <list>
   Anti-patterns to avoid: <list>
   For each behavior, is it present? For each anti-pattern, is it absent?
   Return structured JSON: { behavior_1: true|false, ..., antipattern_1: false|true, ... }
   ```
4. Aggregate per agent: percentage of behaviors satisfied, percentage of anti-patterns avoided
5. Threshold: ≥90% behaviors, ≥95% anti-patterns avoided

**Why LLM-as-judge for behavioral checks:** "did the agent reference the 67 score" is a fuzzy check. "Did the agent use directive language" requires understanding context. Regex-based or token-match approaches miss too much. LLM evaluator on a curated rubric is the pragmatic answer.

**Cost:** Haiku 4.5 evaluator pass over a 100-scenario Q&A golden set costs ~$0.30 per run. CI runs this on every PR touching `/backend/src/agents/qa/` — affordable.

### 4.4 Schema validation (deterministic, separate from LLM-as-judge)

Schema validation is NOT an LLM-judged check. It's strict and deterministic:

- All structured outputs (tool-use responses, JSON-mode responses) must parse against their Zod schemas
- Schema violations are immediate failures
- This catches: missing required fields, wrong types, out-of-range values

Run alongside golden-set evaluator. Cheap. No LLM cost.

### 4.5 Directive-language sanitization eval

The Q&A agent has legal-compliance requirements (no "recommend," no "you should buy," etc.) inherited from the current `aiEnhancedMessagingService` post-processing. Eval:

1. Run agent output through the existing directive-language regex patterns (porting from current code)
2. Any match = test failure for that scenario
3. Aggregate across golden set: report directive-language violation rate
4. Threshold: 0 violations across the golden set (zero tolerance)

This is deterministic (regex), runs every PR, gates merges. Critical for legal compliance.

---

## 5. Adversarial-agent meta-eval — the 4-week kill criterion

Per thesis §5.5: "if 2 personas don't produce useful signal in 4 weeks, scope down further or pause."

Operationalize "useful signal":

### 5.1 Metrics to track per persona, weekly

```
For each persona (optimistic_flipper, skeptical_cpa):
  invocations: <total runs this week>
  agreementRate: <% where critic agreed with engine verdict>
  meaningfulDisagreementRate: <% where severityScore > 40 AND agreementWithOriginal=false>
  noiseRate: <% where severityScore < 20 AND agreementWithOriginal=false (disagrees but weakly)>
  signalRatio: meaningfulDisagreementRate / noiseRate
```

### 5.2 Kill thresholds

Persona is "producing useful signal" if all three:

- `meaningfulDisagreementRate > 20%` (disagreeing substantively at least 1 in 5 times)
- `signalRatio > 2` (meaningful disagreement at least 2x the noise rate)
- Engineering review of 10 random critiques per persona finds ≥7 produce insight a real underwriter would consider valuable

If a persona fails thresholds for **4 consecutive weeks** → scope down (remove that persona) or pause both.

Failing **one week is not a kill signal** — natural variance, small sample sizes early. 4-week pattern is required.

### 5.3 Sample size discipline

If a persona is invoked fewer than 20 times in a week, defer evaluation to next week (combine sample). Early weeks may be sparse since auto-invocation is BUY-band only and BUY band is rare. Manual + batch runs should hit threshold faster.

### 5.4 Weekly review report (manual)

Auto-generated weekly:
```
Adversarial Critic — Week of 2026-05-10

optimistic_flipper:
  invocations: 47
  agreementRate: 62% (29/47)
  meaningfulDisagreementRate: 28% (13/47)
  noiseRate: 6% (3/47)
  signalRatio: 4.7
  STATUS: producing signal

skeptical_cpa:
  invocations: 47
  agreementRate: 81% (38/47)
  meaningfulDisagreementRate: 13% (6/47)
  noiseRate: 6% (3/47)
  signalRatio: 2.0
  STATUS: borderline — 1 week below threshold

Reviewer: <link to 10 sampled critiques per persona for manual quality check>
```

Founder + architect review weekly during early waves. After 8 weeks of clean signal, cadence drops to monthly.

---

## 6. Substrate write verification

Per [PRODUCT_2.0_EVENTS_STORE.md §1 principle 8](PRODUCT_2.0_EVENTS_STORE.md): "no agent ships without verified writes."

### 6.1 Per-tool write contract test

For each tool that emits events, an integration test verifies the contract:

```ts
test('score_deal emits AnalysisEvent + DecisionEvent with correct shape', async () => {
  const traceId = 'test-trace-1';
  await scoreDeal.execute(validInputs, { traceId, userId: TEST_USER_ID, ...mockCtx });

  const events = await eventsRepo.getEventsByTraceId(traceId);
  expect(events).toHaveLength(2);

  const analysis = events.find(e => e.eventType === 'analysis');
  expect(analysis).toBeDefined();
  expect(analysis.payload).toMatchSchema(AnalysisPayloadSchema);

  const decision = events.find(e => e.eventType === 'decision');
  expect(decision).toBeDefined();
  expect(decision.payload).toMatchSchema(DecisionPayloadSchema);
  expect(decision.payload.analysisEventId.toString()).toBe(analysis._id.toString());
});
```

This catches: missing event emission, wrong event type, malformed payload, broken cross-event references.

### 6.2 Per-agent flow write contract test

For each agent, an end-to-end mock-LLM test verifies the expected events:

```ts
test('deal-scoring agent emits expected events for full flow', async () => {
  const mockLLM = mockLLMResponses([
    { tool_call: 'enrich_property', input: {...} },
    { tool_call: 'compute_analysis', input: {...} },
    { tool_call: 'score_deal', input: {...} },
    { text: 'Final response with verdict card' },
  ]);

  const traceId = await orchestrator.handleTurn({
    input: 'analyze 1837 Walnut Way, Anna TX',
    userId: TEST_USER_ID,
    mockLLM,
  });

  const events = await eventsRepo.getEventsByTraceId(traceId);
  const eventTypes = events.map(e => e.eventType);

  expect(eventTypes).toContain('analysis');
  expect(eventTypes).toContain('decision');
  expect(eventTypes).toContain('conversation');
  expect(eventTypes).not.toContain('override'); // No override in this flow
});
```

Runs in CI. Cheap (mocked LLM, no Anthropic API costs).

### 6.3 Append-only enforcement test

Per [PRODUCT_2.0_EVENTS_STORE.md §11.2](PRODUCT_2.0_EVENTS_STORE.md): integration test that verifies the events-writer DB role actually rejects update/delete operations. Runs against real Atlas test cluster (or local Docker mongo with role provisioning).

If this test passes locally but fails in production, the DB role isn't provisioned correctly — startup sanity check (per events store doc §6.3) should catch it before any traffic, but the integration test is the secondary defense.

---

## 7. Cost / latency benchmarks

Cross-link to [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md). Evals here are about regression detection, not budget enforcement (that's the cost doc's territory).

### 7.1 Per-PR cost regression check

For each PR touching agents or prompts, the golden-set runs report:
```
Cost regression check:
  Per-query average cost: $0.012 (baseline: $0.011, change +9%)
  WARNING — cost per query increased by >5%. Investigate.
```

Thresholds:
- ≤5% increase: no flag
- 5-15% increase: warning, requires explicit acknowledgment in PR review
- >15% increase: blocks merge unless overridden

### 7.2 Latency regression check

Same pattern for p50 / p95 latency. Per-agent and per-tool.

### 7.3 Cache hit rate

`cachedTokens / inputTokens` aggregated across the golden-set run. Drop in cache hit rate is a smell — usually means a prompt change invalidated cache boundaries unintentionally.

---

## 8. Prompt regression on model upgrades

Anthropic ships model upgrades quarterly (Sonnet 4.5 → 4.6 → 4.7, etc.). Each upgrade is a potential regression source.

### 8.1 Model-upgrade evaluation procedure

1. New model version available
2. Run the full golden-set suite against new model (in isolated test env, parallel to production)
3. Compare behavior thresholds, schema validity, sanitization, calibration drift
4. Cost / latency comparison
5. If thresholds pass: roll out per-agent gradually (10% → 50% → 100% traffic)
6. If thresholds fail: stay on current model; investigate why new model behaves differently

### 8.2 Side-by-side eval

Run the same scenarios against multiple model versions concurrently:
```
deal-scoring agent, scenario: phoenix-3bd-class-b-moderate
  Sonnet 4.6: dealQuality 67, latency 2.1s, $0.011 cost
  Sonnet 4.7: dealQuality 67, latency 1.8s, $0.010 cost (-9% latency, -9% cost)
```

`dealQuality` should match across model versions (it comes from the deterministic engine, not the LLM). If it doesn't match, that's the calibration check failing — and it indicates the new model is producing different tool-call sequences, which is a behavioral change worth investigating.

### 8.3 Snapshot stability

For text outputs, prompt regression tests don't require exact-match snapshot equality (LLMs vary turn-to-turn). They require **behavioral snapshot equality** — same intent fulfilled, same schema, same anti-patterns avoided. The LLM-as-judge evaluator handles this.

---

## 9. CI implementation

### 9.1 Pipeline structure

```yaml
# .github/workflows/evals.yml (simplified)
on: [pull_request, push]

jobs:
  schema-validation:        # Cheap. Always runs.
    runs-on: ubuntu-latest
    steps: [...]

  substrate-writes:         # Cheap. Always runs.
    runs-on: ubuntu-latest
    steps: [...]

  directive-language:       # Cheap. Always runs.
    runs-on: ubuntu-latest
    steps: [...]

  calibration-check:        # Expensive. Conditional on path changes.
    if: paths-changed in [agents/, tools/, services/investment/, analysis/]
    runs-on: ubuntu-latest
    steps: [...]

  golden-sets:              # Expensive (LLM cost). Conditional.
    if: paths-changed in [agents/, prompts/]
    strategy: matrix [deal-scoring, qa, adversarial-critic]
    runs-on: ubuntu-latest
    steps: [...]

  cost-latency-regression:  # Runs as part of golden-sets, reports separately
    needs: [golden-sets]
    runs-on: ubuntu-latest
    steps: [...]
```

### 9.2 PR comment template

CI posts a single composite comment per PR:

```
Eval Report — Run #4521

✅ Schema validation: 47/47 passed
✅ Substrate writes: 8/8 tools verified
✅ Directive-language sanitization: 0 violations
✅ Calibration check: 500/500 fixtures matched
✅ Golden sets:
   deal-scoring: 50/50 (100%)
   qa: 96/100 (96%) — 4 below 90% behavior threshold (see details)
   adversarial-critic: 30/30 (100%)
⚠️  Cost regression: per-query average +6% from baseline (action: review)
✅ Latency regression: within 5%

Details: <link to full report>
```

### 9.3 Manual override

For known-acceptable regressions (e.g., a deliberate prompt change that costs more but produces better explanations), reviewers can mark a PR with `eval-override-acknowledged` label. CI proceeds but flags the override in the merge log for traceability.

---

## 10. Local development workflow

Evals must be runnable locally for fast iteration. Three commands:

```bash
# Cheap, fast — for every save
npm run eval:schema           # Schema validation, ~5s
npm run eval:substrate        # Substrate write verification, ~10s
npm run eval:directive        # Directive-language sanitization, ~3s

# Per-agent golden sets — for prompt changes
npm run eval:golden -- --agent qa
npm run eval:golden -- --agent deal-scoring
npm run eval:golden -- --agent adversarial-critic

# Calibration anchor — for engine changes
npm run eval:calibration

# Full suite — for PR-ready confidence
npm run eval:all
```

Local runs use real Anthropic API (no way around it for golden-set evaluator) — costs ~$1-3 per full local run. Make this affordable enough for engineers to run frequently.

---

## 11. Tooling decisions

| Decision | Choice | Rationale |
|---|---|---|
| Eval framework | Custom TypeScript harness, leveraging Jest for test infrastructure | No vendor lock-in for wave 1. Switch to Langfuse / baselime later if observability needs outpace what we build. |
| Test fixtures | JSON files in `/tests/golden/<surface>/` | Easy to inspect, version-controlled, shareable |
| LLM evaluator | Haiku 4.5 | Cheap, accurate for binary behavior checks |
| Mock LLM for unit tests | Custom mock returning pre-defined responses | Avoid Anthropic API costs in unit tests; deterministic outputs |
| Cost / latency tracking | Aggregated from `ConversationEvent` events; rolled up by separate aggregation job | Single source of truth (the events store), no parallel metrics infrastructure |
| PR comment posting | GitHub Actions native, structured Markdown | Standard, no extra service |

### 11.1 When to consider replacing custom harness

If any of these become true, evaluate Langfuse / baselime / etc:

- More than 3 engineers actively writing prompts and golden sets (collaboration features matter)
- Need for non-engineering stakeholders (B2B prospects, founder) to review golden-set results (UI matters)
- Eval suite runtime exceeds 10 minutes per CI run (parallel infrastructure matters)
- Multi-org / multi-tenant eval isolation needed (B2B pilot stage)

None of these are wave 1 concerns.

---

## 12. Open questions

1. **Founder-historical backfill volume.** Thesis says "~2 years of personal analyses." If that's fewer than 200 deals, supplement with synthetic edge cases to reach 500. If more than 500, sample to keep CI runtime bounded.

2. **B2B-specific golden sets.** Wave 1 golden sets are mostly retail-shaped scenarios. When B2B pilot lights up (per [PRODUCT_2.0_ARCHITECTURE.md §11.5](PRODUCT_2.0_ARCHITECTURE.md)), add B2B-specific scenarios (audit-trail consumption, regulated-language preferences, batch processing).

3. **Outcome-anchored calibration eval.** Once `OutcomeEvent` capture lights up (deferred per events store §3.9), the highest-fidelity calibration eval becomes: "did deals scored 80+ that actually closed perform as projected?" That's a months-out signal, not a CI-gated one. Plan for it; don't build it yet.

4. **Adversarial-critic golden-set ground truth.** What makes a critique "good"? The LLM-as-judge approach works for behavior thresholds but the persona-quality assessment is fuzzy. Recommend: founder reviews 10 sampled critiques per persona weekly during first 8 weeks; calibrate the LLM evaluator against founder judgment; transition to automated assessment when alignment is established.

5. **Eval cost as percentage of platform cost.** Target: eval costs are <5% of total LLM spend. If CI golden-set runs balloon (e.g., we double the golden-set size every 3 months), revisit which evals run per-PR vs. nightly.

---

## 13. Changelog

- **2026-05-10 (v1):** Initial draft. Eval philosophy (probabilistic thresholds + deterministic exceptions), three eval surfaces, calibration check methodology with zero-tolerance default, golden sets per agent with LLM-as-judge behavioral rubric, 4-week adversarial-critic kill criterion operationalized, substrate write verification per tool and per agent flow, cost/latency regression gates, prompt regression on model upgrades, CI implementation with PR comment template, local-dev workflow, tooling decisions with rationale, 5 open questions flagged.
