# REanalyzr 2.0 — First 2 Weeks

**Document type:** Decomposition output per thesis §0/§14
**Authored:** 2026-05-11 (Marcus Chen with Engineer + Architect framing)
**Status:** Draft 1
**Owns:** Concrete shippable units for weeks 1-2; branches, exit criteria, daily-ish prioritization

---

## 0. How to read this document

This is **the execution plan for weeks 1-2** — what to ship, in what order, with what exit criteria. Anchored to [PRODUCT_2.0_BACKLOG.md](PRODUCT_2.0_BACKLOG.md) critical path.

**Calendar window:** weeks of 2026-05-12 and 2026-05-19.

**Audience:**
- **Founder (Parth)** — daily/end-of-week review checkpoints; approves merges to reanalyzr-2.0
- **Engineer persona** — primary implementer; works through stories in order
- **Architect persona** — reviews W4-S4 (`score_deal`), W1-S5 (DB role), and any architectural decisions surfaced mid-implementation
- **QE persona** — owns W8-S1, W8-S6, W8-S7 (eval scaffolding + schema validation + substrate write verification)

**What this doc does NOT do:**
- Map work to calendar dates (founder hours are variable per thesis §7)
- Promise wave 1 completion in 2 weeks — this is the foundation, not the full wave
- Lock specific personas to specific stories (personas float)

---

## 1. Bias decisions on 6 open backlog questions

Calling these out so Founder can correct in review. Defaults applied:

| Q# | Question | Bias applied | Reasoning |
|---|---|---|---|
| 1 | Q&A migration scope (W3) | ✅ **LOCKED 2026-05-11: Option B — re-architect during the lift** | Founder rationale: not in a rush; cleaner foundation worth the time. W3-S5 stays L-sized (5-10 days) per original backlog estimate. Doesn't impact weeks 1-2 (W3 starts week 3+) but locks W3 total at 22-30 story-days. |
| 2 | Offline + sync tier (W6-S11) | ✅ **LOCKED 2026-05-11: Tier 1 — read-only offline** | Founder rationale: "ship fast > offline capabilities — we need users first." W6-S11 shrinks from L (12 days) to S (3 days). W6 workstream total drops from 25-35 to ~16-26 story-days. Tier 2/3 upgrade deferred until real usage data warrants. Doesn't impact weeks 1-2 (W6 starts week 4+). |
| 3 | Golden set sizing (W8-S5) | ✅ **LOCKED 2026-05-11: Option A — ship with 100 in wave 1, grow to 180 over time** | Founder aligned. W8-S5 resized from L (10 days) to M (5-6 days). W8 total drops from 20-28 to ~15-23 story-days. Allocation: ~30 deal-scoring + ~50 Q&A + ~20 adversarial scenarios at wave 1 ship. Remaining 80 grow incrementally with real usage data. |
| 4 | Founder-historical backfill volume (W10) | ✅ **LOCKED 2026-05-11: 50-75 personal analyses + ~100-150 synthetic = ~200 fixture regression set** | W10 stays at 5-8 story-days. Strategic addition: W24 community substrate seeding workstream introduced (multi-channel: LinkedIn=tech / Reddit+BP=RE / B2B direct). LinkedIn voice refined per R-O3 (architect-first, Reanalyzr-as-substrate-example). Wave 1 engineering grows by ~10-16 story-days (W24a). Doesn't impact weeks 1-2 (W10 starts week 4+, W24a week 5+). |
| 5 | Observability dashboards (W22) | ✅ **LOCKED 2026-05-11: Option A — full React in-house** | Founder rationale: brand consistency for LinkedIn screenshots (dashboards become content for modernization series); in-app aesthetic uniform; no external service dependency. W22 stays at 5-7 story-days as originally scoped. No critical-path impact. Doesn't affect weeks 1-2 (W22 starts week 6+). |
| 6 | Wave 1 exit criteria | ✅ **LOCKED 2026-05-11: 8-criterion all-pass set (no two-of-N threshold)** | Founder accepted revised set. ALL must pass for wave 1 to be "done": (1) all 12 workstreams + W24a ship; (2) 100% calibration check pass on regression set with documented founder-approved exceptions; (3) ≥85% prompt cache hit rate on observed traffic; (4) ≥500 substrate events; (5) avg per-query cost ≤$0.025; (6) chat end-to-end on /app; (7) ≥1 B2B demo end-to-end on chat surface; (8) ≥2 Track 3 LinkedIn modernization-series posts shipped. Each signal independently load-bearing. |

**Note on bias #6 calibration:** I'm tightening from the backlog's ≥80% suggestion to the evals doc's zero-tolerance default. Calibration drift IS a bug, not a tolerance band. Confirm or relax.

---

## 2. End-of-sprint exit criteria (what "weeks 1-2 done" looks like)

By end of week 2, all of the following are true:

### Substrate (W1)
- [ ] Events collection exists in MongoDB with insert-only DB role
- [ ] All 11 wave 1 event types have Mongoose discriminators + Zod payload schemas
- [ ] `EventsRepository` has write methods for every event type and read methods for the core query recipes (get-by-traceId, get-recent-by-user, get-current-profile, get-conversation-history, get-decision-history)
- [ ] In-memory MongoDB unit tests pass; integration test against Atlas test cluster passes (DB role rejects update/delete)
- [ ] All indexes per [events store §7](PRODUCT_2.0_EVENTS_STORE.md) created and explain-plan-verified

### Cost tracking (W9 partial)
- [ ] `CostEvent` collection exists (separate from substrate)
- [ ] Token usage tracking emits `CostEvent` for every Anthropic SDK call routed through the orchestrator (placeholder in week 2; orchestrator stub)

### First two tools (W4 partial)
- [ ] `tool:enrich_property` wraps `MarketIntelligenceService` and passes Zod schema validation
- [ ] `tool:compute_analysis` wraps `SFRAnalyzer` and `MultiFamilyAnalyzer` with propertyType-based routing

### Foundation for the load-bearing tool (W4-S4)
- [ ] `tool:score_deal` is implementable — events repo can accept AnalysisEvent + DecisionEvent; schema includes the corrected DecisionEvent shape (dealQuality + criticalFlags + userContext, no verdict field)
- [ ] **Week 2 stretch:** `tool:score_deal` actually written and emitting events for a single test property

### Eval scaffolding skeleton (W8 partial)
- [ ] Eval harness scaffold (`npm run eval:schema`, `npm run eval:substrate` work locally)
- [ ] Schema validation eval runs against all wave 1 schemas
- [ ] Substrate write verification test pattern established (one tool's contract tested end-to-end as the template)

### Process / infrastructure
- [ ] `reanalyzr-2.0` branch has all commits from this sprint
- [ ] Each story landed in a sub-branch + PR into `reanalyzr-2.0` (review surface, even though policy allows direct commits — load-bearing stories deserve diff review)
- [ ] CI workflow file exists with at least schema validation + substrate write verification jobs

### Pre-work cleanup
- [ ] Existing uncommitted edits in main checkout (App.tsx, AppleNavigation.tsx route cleanup + admin script untracked) resolved — either committed to a chore branch OR explicitly deferred with documentation

**One sentence definition of done:** at end of week 2, Founder can trigger a manual scoring of a single property through the new pipeline (call `tool:score_deal` directly), see AnalysisEvent + DecisionEvent in the substrate, and verify the dealQuality output matches what the existing engine produces. **That's the foundation. Everything else builds on it.**

---

## 3. Branch and commit strategy

Per the operating policy (`main` frozen at production; all work on `reanalyzr-2.0`):

**Direct commits to `reanalyzr-2.0` for:**
- Small (XS/S) stories that are mostly mechanical (e.g., creating files, adding type definitions)
- Documentation updates
- Configuration changes

**Sub-branch + PR into `reanalyzr-2.0` for (recommended for review surface):**
- W4-S4 `score_deal` — load-bearing tool; calibration depends on it
- W1-S5 DB role provisioning — security-relevant
- W8 eval scaffolding stories — define the gate everything else passes through
- Any story that introduces a new architectural decision not captured in the architecture docs

**PR target:** sub-branches PR INTO `reanalyzr-2.0` (not main). When wave 1 is complete and Founder is satisfied, `reanalyzr-2.0` → `main` as the cut-over.

**Naming convention:** `feat/<workstream>-<story>-<short-desc>`, e.g.:
- `feat/w1-s2-event-payload-schemas`
- `feat/w4-s4-score-deal-tool`
- `feat/w8-s1-eval-harness-scaffold`

---

## 4. Week 1 — Foundation (May 12-18, 2026)

### Pre-work: clear stale state (Day 0 — Monday morning)

**Owner:** Founder + Engineer

| Task | Action | Status |
|---|---|---|
| Decide fate of uncommitted edits in main checkout | App.tsx + AppleNavigation.tsx route cleanup work — commit to `chore/remove-market-data-routes` branch on reanalyzr-2.0 OR document as deferred | ✅ Done 2026-05-11 (commits 2baa0cb + 3372e33 + 5c08299) |
| Decide fate of untracked admin script | `backend/src/scripts/resetAdminPassword.ts` — commit as needed for development, or .gitignore if local-only | ✅ Done 2026-05-11 (committed with security tightening: env-var-required, no hardcoded password fallback) |
| Verify clean working tree for new sprint | `git status` shows clean before W1-S1 starts | ✅ Done 2026-05-11 |
| Verify dev dependencies | Confirm Anthropic SDK present, Zod installed, mongodb-memory-server in devDependencies | ✅ Done 2026-05-11 (Mongoose, mongodb-memory-server, Jest already present; Zod 3.25.76 installed before W1-S2; Anthropic SDK installs with W2) |
| **Atlas M0 dev cluster setup** | Create dev Atlas cluster (M0 free tier), update `.env` MONGODB_URI to point at it. **CRITICAL before any application code writes events.** See [PRODUCT_2.0_PROD_MIGRATION.md §2.1-2.2](PRODUCT_2.0_PROD_MIGRATION.md). | ⚠️ Founder action — 30 min Atlas dashboard work |
| **W1-S5a — env-aware DB connection** | `backend/src/config/db.ts` with production-safety guard. Engineer ships once dev cluster URI is available. | ⏳ Engineer action — after Atlas dev cluster is live |

**Exit criterion:** main checkout has clean git status; **Atlas dev cluster live and env-aware connection helper deployed**; ready for any Atlas-touching W1 story (W1-S5, W1-S3 repository, W1-S7 integration tests, etc.).

### W1 — Substrate foundation (Days 1-4)

**Most of week 1 is substrate.** This is non-negotiable — every other workstream depends on it.

#### Day 1 (Monday): W1-S1 + W1-S2 partial

**Stories:**
- **W1-S1** (S, 1-2 days): Mongoose discriminator + base event schema
  - Branch: `feat/w1-s1-base-event-schema`
  - File: `backend/src/models/events/BaseEvent.ts`
  - Pre-hooks reject update/delete; discriminatorKey: 'eventType'
  - Strict mode throws on unknown fields
  - **Exit:** base schema exists; rejection pre-hooks tested
- **W1-S2 start** (M, 3-5 days): wave 1 event payload schemas — start ProfileEvent + AnalysisEvent
  - Branch: `feat/w1-s2-event-payload-schemas`
  - Files: `backend/src/models/events/ProfileEvent.ts`, `AnalysisEvent.ts`
  - Each with Zod schema + Mongoose discriminator
  - **Exit (today):** 2 of 11 event types implemented

#### Day 2 (Tuesday): W1-S2 continued

**Stories:**
- **W1-S2 continued**: DecisionEvent + OverrideEvent + CritiqueEvent + ConversationEvent
  - 4 more event types
  - **Exit (today):** 6 of 11 event types implemented

#### Day 3 (Wednesday): W1-S2 finish + W1-S3 + W1-S5

**Stories:**
- **W1-S2 finish**: AuditTrailEvent + WatchlistEvent + OutcomeEvent + PortfolioEvent + PipelineEvent
  - **Exit:** all 11 wave 1 event types implemented
- **W1-S3** (S, 1-2 days): `EventsRepository` write API
  - Branch: `feat/w1-s3-events-repository-writes`
  - File: `backend/src/repositories/EventsRepository.ts`
  - Insert-only methods per event type
  - traceId propagation
  - **Exit:** all 11 write methods exist; no update/delete methods exist
- **W1-S5** (S, 1-2 days): MongoDB `eventsAppendOnly` role provisioning
  - Branch: `feat/w1-s5-db-role-provisioning`
  - File: `backend/src/scripts/provisionEventsRole.ts` + `backend/src/config/startup-checks.ts`
  - **Exit:** role created on test cluster; startup sanity check verifies role correctness

#### Day 4 (Thursday): W1-S4 + W1-S6 + W1-S7 start

**Stories:**
- **W1-S4** (M, 3-5 days): `EventsRepository` read API
  - Branch: `feat/w1-s4-events-repository-reads`
  - File: `backend/src/repositories/EventsRepository.ts` (extend)
  - Methods: `getRecentEventsForUser`, `getEventsByTraceId`, `getCurrentProfile`, `getConversationHistory`, `getDecisionHistoryForDeal`, `getOverrideFrequencyByField`, `getCritiquesForDecision`, `getAuditTrail`
  - **Exit:** all named query methods exist and return correctly-typed objects
- **W1-S6** (S, 1-2 days): index creation
  - Branch: same as W1-S4 (small enough to bundle)
  - File: `backend/src/models/events/indexes.ts`
  - Indexes per [events store §7](PRODUCT_2.0_EVENTS_STORE.md)
  - **Exit:** all indexes present; explain plan for hot queries uses IXSCAN
- **W1-S7 start**: in-memory MongoDB test harness

### Day 5 (Friday): W1-S7 + W1-S8 + week 1 review

**Stories:**
- **W1-S7** (S, 1-2 days): in-memory MongoDB unit tests for repository
  - Branch: `feat/w1-s7-events-repository-tests`
  - Covers: write contract, append-only enforcement, read queries
  - **Exit:** unit tests pass; substrate-writes test pattern established as template for W8-S7
- **W1-S8** (S, 1-2 days): integration test against Atlas test cluster
  - Branch: `feat/w1-s8-events-integration-test`
  - Verifies: DB role enforcement (events-writer user actually rejects update/delete)
  - **Exit:** integration test passes against real Atlas cluster

**End-of-week-1 review (Founder, ~2 hours):**
- All event types implemented ✓
- Repository functional ✓
- DB role provisioned and verified ✓
- Tests passing ✓
- Ready to start W4 tools next week

**Week 1 risk to track:** if W1-S2 (11 event schemas) takes longer than 3 days, pull W4-S2 / W4-S3 (tool wraps that depend on substrate types) earlier into week 2 to maintain critical path.

---

## 5. Week 2 — First tools + cost tracking + eval scaffolding (May 19-25, 2026)

### Day 6 (Monday): W9-S1 + W4-S1

**Stories:**
- **W9-S1** (S, 1-2 days): `CostEvent` collection schema + repository
  - Branch: `feat/w9-s1-cost-event-collection`
  - File: `backend/src/models/CostEvent.ts` + `backend/src/repositories/CostEventsRepository.ts`
  - Insert-only; per-trace correlation
  - **Exit:** CostEvent shape per [costs doc §7.4](PRODUCT_2.0_COSTS.md) implemented and tested
- **W4-S1** (S, 1-2 days): Tool contract interface + registry skeleton
  - Branch: `feat/w4-s1-tool-contract-registry`
  - Files: `backend/src/tools/types.ts` (Tool<T,U> interface, ToolContext, SideEffect types), `backend/src/tools/registry.ts` (empty registry placeholder)
  - **Exit:** Tool contract type-safe and ready to wrap services

### Day 7 (Tuesday): W4-S2 + W4-S3

**Stories:**
- **W4-S2** (S, 1-2 days): `enrich_property` wraps MarketIntelligenceService
  - Branch: `feat/w4-s2-enrich-property-tool`
  - File: `backend/src/tools/enrichProperty.ts`
  - Zod input/output schemas; retry semantics; integration with existing tool-result cache
  - **Exit:** Tool callable; address-in → MarketDataResponse-out; cache discipline preserved
- **W4-S3** (S, 1-2 days): `compute_analysis` wraps SFRAnalyzer + MultiFamilyAnalyzer
  - Branch: `feat/w4-s3-compute-analysis-tool`
  - File: `backend/src/tools/computeAnalysis.ts`
  - PropertyType-based routing to correct analyzer
  - **Exit:** Single tool routes both SFR and MF correctly; metrics returned with full precision

### Day 8 (Wednesday): W9-S2 + W9-S4

**Stories:**
- **W9-S2** (S, 1-2 days): Token usage tracking — emit `CostEvent` from Anthropic SDK wrapper
  - Branch: `feat/w9-s2-token-tracking`
  - File: `backend/src/anthropic/client.ts` (wrapper around Anthropic SDK that emits CostEvent on every call)
  - **Exit:** All Anthropic calls go through wrapper; CostEvent emitted per call with model + tokens + cents
- **W9-S4** (XS, 0.5-1 day): Model-tier routing constants
  - Branch: same (small bundle)
  - File: `backend/src/agents/modelTiers.ts`
  - Constants per [costs doc §3](PRODUCT_2.0_COSTS.md): Haiku 4.5 for routing/extraction, Sonnet 4.6 for default agents, Opus 4.7 for adversarial critic
  - **Exit:** Centralized config; each agent imports its tier

### Day 9 (Thursday): W4-S4 (the load-bearing day)

**Architect MUST review this PR.** Calibration depends on it.

**Story:**
- **W4-S4** (M, 3-5 days): `score_deal` tool
  - Branch: `feat/w4-s4-score-deal-tool`
  - File: `backend/src/tools/scoreDeal.ts`
  - Wraps `BaseDecisionEngine` (SFR + MF subclasses)
  - **Emits AnalysisEvent + DecisionEvent** with the corrected DecisionEvent shape (dealQuality + qualityLabel + qualityColor + criticalFlags + userContext; NO verdict field)
  - Critical-flag score capping per [events store §3.3.1](PRODUCT_2.0_EVENTS_STORE.md)
  - **Exit:** Tool callable; substrate has AnalysisEvent + DecisionEvent; integration test verifies the score matches direct engine call (zero-tolerance) for at least 5 hand-picked test cases

**This is the critical-path story for the entire wave 1.** If W4-S4 is fragile, everything downstream breaks. Architect blocks merge until satisfied.

### Day 10 (Friday): W8-S1 + W8-S6 + W8-S7 + week 2 review

**Stories:**
- **W8-S1** (S, 1-2 days): Eval harness scaffold
  - Branch: `feat/w8-s1-eval-harness`
  - Files: `backend/src/evals/runner.ts`, `package.json` script entries
  - `npm run eval:schema`, `npm run eval:substrate`, `npm run eval:directive` work (even if scenarios are minimal)
  - **Exit:** Eval framework structure exists; future stories add scenarios
- **W8-S6** (XS, 0.5-1 day): Schema validation eval
  - Branch: same bundle
  - File: `backend/src/evals/schemaValidation.ts`
  - Runs all wave 1 Zod schemas against representative fixtures
  - **Exit:** `npm run eval:schema` passes
- **W8-S7 start** (S, 1-2 days): Substrate write verification — per-tool contract tests
  - Branch: `feat/w8-s7-substrate-write-tests`
  - File: `backend/src/evals/substrateWrites.ts`
  - Pattern: for each tool that emits events, integration test verifies (trace ID, event type, payload schema, cross-event references)
  - **Exit:** Pattern established with `enrich_property` and `compute_analysis` (no events); `score_deal` integration test verifies AnalysisEvent + DecisionEvent emission

**End-of-week-2 review (Founder, ~3 hours):**
- All exit criteria from §2 met ✓
- One-sentence definition of done: Founder can trigger `tool:score_deal` directly with a real property, see AnalysisEvent + DecisionEvent in substrate, verify dealQuality matches direct engine call ✓
- 12-15 small/medium stories landed across both weeks
- ~7-10 PRs merged into reanalyzr-2.0 (mix of direct commits and sub-branch PRs)

---

## 6. End-of-sprint verification

### The smoke test (week 2 Friday)

A scripted verification that Founder runs personally:

```bash
# 1. Start backend with new substrate + tools
npm run dev

# 2. Run a verification script that:
#    - Calls tool:enrich_property for a known address (e.g., the Anna TX property)
#    - Calls tool:compute_analysis with the enrichment output
#    - Calls tool:score_deal with the analysis output and a sample userContext
#    - Reads back AnalysisEvent and DecisionEvent from substrate
#    - Calls the existing engine directly with the same inputs
#    - Compares: dealQuality MUST match; all factor scores MUST match
npm run smoke-test:weeks-1-2
```

If the smoke test passes, weeks 1-2 are done.

### Sprint metrics (collected from CostEvent + observability)

By end of week 2:
- Substrate has at least 50 events (from smoke tests + integration tests + manual exercises)
- Calibration check has at least 5 test fixtures producing zero divergence
- CostEvent collection has token-usage records for every Anthropic call made during testing
- Eval harness can run all 3 scaffolded eval surfaces locally
- All wave 1 event schemas are version-1, frozen for the duration of wave 1

---

## 7. Risks specific to weeks 1-2

| Risk | Likelihood | Mitigation |
|---|---|---|
| W1-S2 (11 event schemas) slips beyond Wednesday | Medium | Compress non-wave-1 events (PortfolioEvent, PipelineEvent) to schema-only — defer Mongoose discriminator setup to wave 1.5 |
| W4-S4 reveals an engine-wrapping issue (e.g., scoring weights drift) | Medium-Low | Architect blocks merge; investigation; document divergence cause; update fixture if engine change is intentional |
| Atlas test cluster not available (W1-S8) | Low | Use docker-mongo with same role provisioning locally; verify production-equivalence in a follow-up |
| Founder hours under 10/week | Medium | Tighten week 2 — defer W8-S7 start to week 3; keep W4-S4 as critical-path priority |
| Founder pulled into B2B Track 2 mid-sprint | Medium-High | Document expected interruption; ensure W1 finishes by end of week 1; W4-S4 can land week 2 even with reduced founder review |
| Anthropic SDK installation / configuration issues | Low | Confirm SDK in package.json by Day 0 |
| Zod or other devDep missing | Low | Run `npm install` Day 0 baseline check |

---

## 8. What's NOT in weeks 1-2 (deferred to later wave 1)

To set expectations clearly — these are all wave 1 work but NOT week 1-2 work:

- **No agents shipping yet.** Orchestrator (W2) and agents (W3, W5) start week 3.
- **No frontend changes.** W6 (chat surface) starts week 4+. W7 (hero embed) requires `/app` shipping.
- **No MCP server.** W11 starts after W4 stabilizes.
- **No founder-historical backfill execution.** W10 starts after W4-S4 lands solid.
- **No adversarial critic.** W5 starts week 6+.
- **No portfolio/pipeline/wizard instrumentation.** W12, W13, W14 (wave 1.5) are weeks 10-14.
- **No real Q&A agent.** W3 (Q&A migration) is the largest single workstream and starts week 5+.
- **No observability dashboards.** W22 low-code dashboards happen week 6+.

If anyone (Engineer, QE, Marcus) wants to start any of these in weeks 1-2, that's premature optimization. Stay disciplined.

---

## 9. Founder-specific checkpoints

Per thesis §7 (founder throughput model), specify founder time needs:

| Founder activity | Cadence | Estimated time |
|---|---|---|
| **Day 0 (Monday)** — clear stale state; confirm priorities | One-time | 30 min |
| **W4-S4 review (Day 9 / Thursday week 2)** | Single PR review | 1 hour |
| **W1-S5 (DB role) review** | Single PR review | 30 min |
| **W8-S1/S6 eval harness review** | Single PR review | 30 min |
| **Daily standup-equivalent** — Founder reviews previous day's PRs | Daily, async | 30-45 min × 10 days = ~6 hours |
| **End-of-week 1 review** | Friday | 2 hours |
| **End-of-week 2 review (smoke test)** | Friday | 3 hours |
| **Smaller PR reviews** | As-needed | ~5 hours total |
| **Total founder time** | 2 weeks | **~17-20 hours** |

This fits within sustained 10-15 founder hours/week. **The bottleneck is review bandwidth, not Claude Code throughput.** If founder hours are constrained, defer non-critical-path stories.

---

## 10. After weeks 1-2 — what's next

End of week 2 lands you ready for:

- **Week 3:** start W2 (Orchestrator), continue W4 (remaining tools), start W8-S2 (calibration fixture set generation)
- **Week 4:** start W3 (Wave 1 agents — deal-scoring), continue W2
- **Week 5:** W3 Q&A migration kicks off (largest single workstream)
- **Week 6:** W5 (adversarial critic) starts; W6 (frontend) begins

I'll draft `PRODUCT_2.0_WEEKS_3_4.md` (next sprint planning artifact) once weeks 1-2 retrospective is in hand. Don't over-plan beyond week 2 — execution reality will reshape week 3-4 priorities.

---

## 11. Open questions for weeks 1-2 specifically

1. **Smoke test script (week 2 Friday)** — write it as part of W4-S4 sub-branch, or as a separate W4-S4-verify story?
2. ✅ **RESOLVED 2026-05-11: MongoDB cluster — Atlas only.** Founder policy locked: dev + prod use Atlas cloud exclusively. Local mongo (Docker or install) explicitly NOT acceptable. `mongodb-memory-server` in devDependencies is OK because it's unit-test-only (in-process ephemeral, never touches any cluster). W1-S5 DB role provisioning runs against Atlas; W1-S8 integration tests run against Atlas test cluster.
3. **Anthropic SDK version pinning.** Pin to a specific version for wave 1 to avoid mid-sprint upgrades? Bias: yes — pin in package.json; explicit upgrades only.
4. **CI cost.** Weeks 1-2 evals don't call real LLMs heavily, but W8-S5 onward will. Cap CI cost per PR at $0.50 starting week 3.

---

## 12. Changelog

- **2026-05-11 (v1):** Initial draft. Concrete weeks 1-2 execution plan for wave 1 foundation: substrate + first two tools + cost tracking + eval harness scaffold + critical-path `score_deal` tool. ~12-15 stories sequenced day-by-day. Smoke test verification at end-of-sprint. 6 backlog-question biases applied (transparency). Founder time estimate ~17-20 hours across 2 weeks. Risks specific to weeks 1-2 enumerated. What's NOT in weeks 1-2 documented to prevent scope creep.
