# REanalyzr 2.0 — Implementation Log

**Document type:** Implementation status mirror for the 2.0 planning suite
**Authored:** 2026-05-18
**Status:** Living document — update at the end of each multi-commit push
**Owns:** What's actually shipped vs. planned, post-plan architectural decisions, issue index, env-var inventory, file map

---

## 0. What this doc is

The planning surface (`PRODUCT_2.0_README.md` and its 10 sibling docs) tells you **what we intend to build**.

This doc tells you **what we've actually built**, where reality diverged from the plan, and what's still open.

If you're new to the project, read it AFTER `PRODUCT_2.0_README.md`. If you're back after a break, this is the single page that gets you current.

**Source of truth for raw events:**
- Commit history: `git log main..reanalyzr-2.0` (344 commits as of 2026-05-18)
- Issue tracker: [`ISSUE_TRACKER.md`](ISSUE_TRACKER.md) (134 issues catalogued, #88-#117 are 2.0-era)
- Planning docs: see `PRODUCT_2.0_README.md` for the full map

---

## 1. Shipped vs. planned (by subsystem)

| Subsystem | Planning doc | Status | Notes |
|---|---|---|---|
| Substrate event store | `PRODUCT_2.0_EVENTS_STORE.md` | ✅ Complete | 11/11 event types live; `cost_events` separate collection; append-only at schema + repo layers |
| Agent mesh — orchestrator | `PRODUCT_2.0_AGENT_MESH.md` §2 | ✅ Complete | Intent classification + routing + tool-only execution + agent dispatch; streaming variant for SSE |
| Agent mesh — wave-1 agents | `PRODUCT_2.0_AGENT_MESH.md` §3 | ✅ Complete | `deal_scoring`, `qa`, `adversarial_critic` all running with real LLM calls + tool use |
| Agent mesh — tools | `PRODUCT_2.0_AGENT_MESH.md` §4 | ✅ Complete (10 tools) | `score_deal`, `compute_analysis`, `apply_override`, `enrich_property`, `export_audit_pdf`, `profile_extraction`, `recall_user_context`, `render_audit_trail`, `resolve_property_inputs`, `save_to_watchlist` |
| Chat surface (frontend) | `PRODUCT_2.0_FRONTEND.md` | ✅ Phase 4 shipped | `/app` chat overlay with streaming, markdown rendering, DealScoreCard, follow-up chips |
| Materialization → Deal | not in original plan | ✅ Shipped (Issue #89) | `dealMaterializationService.ts` projects substrate → legacy `Deal` model so `/saved-properties` still works |
| Polymorphic SavedDealHero | not in original plan | ✅ Shipped (Issue #117) | 4 deal variants (SFR buy-hold, BRRRR, house hack, MF) on a single visual shell, config-driven |
| Cost discipline — data layer | `PRODUCT_2.0_COSTS.md` §7 | ✅ Complete | `CostEvent` collection with provider/model/token/cost fields; per-call emission from classifier + runner |
| Cost discipline — Phase A caps | Issue #106 Phase A | ✅ Shipped 2026-05-18 | Per-turn (2000 tokens / 8 turns), per-session ($1.00), global daily ($20), prompt caching |
| DealLicense + DealCredit substrate | Issue #105 substrate | ✅ Shipped 2026-05-18 | Models, repo, address canonicalization, Stripe-idempotent purchase, FIFO credit redemption, race-safe credit-redeem flow |
| Cost discipline — Phase B caps | Issue #106 Phase B | ⏳ Open (substrate ready) | `CostEvent.licenseId` + sparse index now in place; enforcement code + chat-route license-lookup wiring is the remaining work |
| Cost discipline — Phase C caps | Issue #106 Phase C | ⏳ Open | Per-IP cap, anomaly alerts |
| Pricing & packaging | Issue #105 | ✅ Locked, ⏳ Stripe unwired | $4.99/deal + bundles model decided; `/pricing` page rewritten; payments integration not started |
| Evals / golden sets | `PRODUCT_2.0_EVALS.md` | ⏳ Partial | Some calibration tests exist; CI-gating not enforced yet |
| Email — chat summary | Issue #111 | ✅ Shipped 2026-05-18 | Rich HTML email with assumptions + 10-yr projection table; plain-text mirror for forward-to-CPA |
| Email — PDF attachment | Issue #96 | ⏳ Deferred | Legacy wizard PDF still exists; chat email-CTA inlines HTML instead. Tracked for post-Phase-A revisit |

**Read this as: "what's behind the chat input today, end-to-end."**

---

## 2. File map — agent mesh

The architecture doc (`PRODUCT_2.0_AGENT_MESH.md`) shows the conceptual layout. Here's where each piece lives in `backend/src/`:

```
agents/
├── llm/
│   └── anthropicAdapter.ts          ← SDK wrapper; 3 entry points (call, callWithTools, streamWithTools)
│                                       Prompt caching (ephemeral cache_control) added 2026-05-18 (Issue #106 Phase A)
├── runner/
│   └── agentRunner.ts               ← runAgent / runAgentStream; tool-use loop; emits CostEvent per call
│                                       Defaults: maxTokens=2000, maxTurns=8 (Issue #106 Phase A tightening)
├── orchestrator/
│   ├── orchestrator.ts              ← handleTurn / streamTurn entry points
│   │                                   Cost-cap guard runs BEFORE classifier (Issue #106 Phase A)
│   ├── intentClassifier.ts          ← Haiku classifier; 11 ChatIntents; brace-balanced JSON extraction
│   ├── router.ts                    ← Pure routeIntent(); fallbackReason enum incl. cost_cap_session/daily
│   ├── conversationContext.ts       ← loadRecentTurns() — thread context per Option A
│   ├── dealScoreCardProjection.ts   ← Project AnalysisEvent + DecisionEvent → DealScoreCardWireShape
│   ├── followupChips.ts             ← Agent-driven follow-up chips
│   └── streamEvents.ts              ← OrchestratorStreamEvent union type for SSE
├── dealScoring/
│   └── dealScoringAgent.ts          ← AgentConfig + system prompt for deal-scoring path
├── qa/
│   └── qaAgent.ts                   ← AgentConfig for educational Q&A (cheaper: maxTurns=4, max=1024)
├── adversarialCritic/
│   └── adversarialCriticAgent.ts    ← 2-persona critique (Opus); auto-triggered in BUY band
├── runtime/
│   ├── costGuards.ts                ← NEW (Issue #106 Phase A)
│   │                                   assertWithinCaps, getSessionSpendCents, getDailySpendCents
│   └── __tests__/costGuards.test.ts ← 10 acceptance tests
└── tools/
    ├── score_deal.ts                ← Wraps engine; emits AnalysisEvent + DecisionEvent
    │                                   Walk-away resolution: explicit → engine FMV → NOI/cap → 0 (Issue #114)
    ├── compute_analysis.ts          ← Engine wrapper without decision emission
    ├── apply_override.ts            ← Override + re-score; emits OverrideEvent
    ├── enrich_property.ts           ← RentCast + market-intelligence lookup
    ├── profile_extraction.ts        ← Extract investor goals/profile from chat
    ├── recall_user_context.ts       ← "My last deal" resolver — used by all agents
    ├── render_audit_trail.ts        ← Load DecisionEvent + history for the audit surface
    ├── resolve_property_inputs.ts   ← Address / listing-URL → analysis inputs
    ├── save_to_watchlist.ts         ← Emit WatchlistEvent
    ├── export_audit_pdf.ts          ← PDF render of audit trail
    ├── registry.ts                  ← Single source of truth tool dictionary
    ├── types.ts                     ← Tool, ToolContext, ModelTier types
    └── projectToEventPayloads.ts    ← Shared projection helpers
```

**Coverage:** 39 test files for 45 source files across the agent mesh, substrate, and cost layer (sibling `__tests__` directories).

---

## 3. Substrate event types

All 11 types live under `backend/src/models/events/` with paired Zod schemas + Mongoose models:

| Event | Emitted by | Read by |
|---|---|---|
| `AnalysisEvent` | `score_deal`, `compute_analysis` | DealScoreCard projection, audit trail |
| `DecisionEvent` | `score_deal` | DealScoreCard, materialization, critique |
| `ConversationEvent` | Orchestrator (every turn) | `loadRecentTurns`, dashboards |
| `OverrideEvent` | `apply_override` | Audit trail, override calibration |
| `CritiqueEvent` | `adversarial_critic` | Audit trail, calibration |
| `OutcomeEvent` | Future (post-close tracking) | Moat data — not yet emitted |
| `AuditTrailEvent` | `render_audit_trail` | UI rendering |
| `PipelineEvent` | Pipeline page actions | Pipeline view |
| `PortfolioEvent` | Portfolio actions | Portfolio view |
| `ProfileEvent` | `profile_extraction` | Personalization, profile-aware prompts |
| `WatchlistEvent` | `save_to_watchlist` | Watchlist view |

Plus the **operational** collection (separate lifecycle per architecture doc):
- `CostEvent` — emitted on every LLM call; `sessionId` added 2026-05-18 for per-session cap aggregation

---

## 4. Architectural decisions made post-plan

These weren't in the original planning docs but turned out to matter. Captured here so future-us doesn't have to re-derive them.

### 4.1 Walk-away price uses the income approach, not offer-anchored (Issue #114)

**Problem:** Engine fallback was `purchasePrice * 0.9`, so the walk-away always sat 10% below the buyer's offer. Undermined the "honest analysis" positioning — score said one thing, walk-away said "yeah but pay 10% less."

**Decision:** 4-tier resolver in `score_deal.ts`:
1. Explicit walkAwayPrice from engine (if computed)
2. `engineOutput.fairMarketValue`
3. Income approach: `annualNOI / targetCapRate` (target = market cap rate from intelligence layer)
4. Return 0 (DealScoreCard suppresses the delta row)

**Why it matters:** Walk-away price is now a property fundamental, not a haircut on the buyer's bid. Aligns with how institutional underwriters quote.

### 4.2 Polymorphic SavedDealHero with config-driven variants (Issue #117)

**Problem:** `/analysis/:id` rendered the legacy SFRAnalysis tabs — visually disconnected from the chat experience and only supported SFR Buy & Hold.

**Decision:** One visual shell (`DealScoreCard`), four content variants driven by `savedDealVariants.ts`:
- `sfr_buy_hold` (default) — Cash Flow / IRR / Market Strength
- `sfr_brrrr` — IRR (post-refi) / Market Strength / Debt Structure
- `sfr_house_hack` — Cash Flow (offset) / Market Strength / Debt Structure
- `multi_family` — Cash Flow / Debt Structure (DSCR) / Market Strength

Variant detection: `propertyType + investmentStrategy → variant`. Caption, top factors, and chip pool are config entries — adding a 5th variant (commercial later) is one config object.

**Apple Health / Wallet pattern:** same card shape adapts content based on type. Discussed in detail in the UX Designer call 2026-05-17.

### 4.3 Unified `/analysis/:id` for ALL property types (Option A)

**Problem:** `/sfr-analysis?id=X` and `/mf-analysis?id=X` lived as parallel routes. Chat-first IA should have one canonical "deal detail" URL.

**Decision:** Single `/analysis/:id` route. Internal dispatch by `propertyType`:
- SFR → SavedDealHero + legacy AnalysisResults tabs (the deep-dive surface)
- MF → SavedDealHero + link-out to `/mf-analysis` for the existing MF-specific deep dive

`SavedProperties.tsx` always navigates to `/analysis/:id` regardless of property type.

### 4.4 Cost-guard layered defense before the classifier (Issue #106 Phase A)

**Problem:** Even a small Haiku classifier call (~$0.002) racks up under abuse. The cap check has to happen *before* the LLM is invoked, not after.

**Decision:** `assertWithinCaps()` runs at the top of both `handleTurn` and `streamTurn`. Two cheap aggregate queries (session sum + daily sum) run in parallel. Fail-closed throws `CostCapExceededError` with a `userFacingMessage` the orchestrator surfaces as the assistant turn.

Order is session → daily so the cheaper local check fires first and the global query never runs when a session is already over budget.

### 4.5 Prompt caching gated on character-count proxy (Issue #106 Phase A)

**Problem:** Anthropic's `cache_control: ephemeral` requires ≥1024 tokens to actually cache. Wrapping smaller prompts adds noise without benefit.

**Decision:** Wrap system prompts ≥2000 characters (≈500 tokens × 4 chars/token × safety margin). Toggled via `ANTHROPIC_PROMPT_CACHE_ENABLED`. Three call sites (single-shot `call`, `callWithTools`, `streamWithTools`) all use the same `formatSystemForCache()` helper.

### 4.6 Brace-balanced JSON extraction in the classifier

**Problem:** The Haiku classifier occasionally returned valid JSON followed by trailing commentary the model decided to add. The old regex-strip approach broke with "non-whitespace character after JSON at position N."

**Decision:** `extractFirstJsonObject()` walks the string character-by-character starting at the first `{`, counts brace depth respecting string content + escape sequences, returns the slice for the first balanced `{...}` block. Robust to fence markers, leading commentary, multiple JSON objects (takes the first), and trailing text.

### 4.7 Tool-only routes re-routed through agents (Issue #104)

**Problem:** Chat-flow turns for `override_assumption`, `request_audit_trail`, `request_export`, `save_action` failed with "Chat turn failed" because the orchestrator couldn't construct a structured payload from natural-language input.

**Decision:** Route all four intents through agents (deal_scoring or qa) instead of direct tool execution. Agents use `recall_user_context` to resolve "my last deal" references and construct the tool payload themselves. Documented routing table in `router.ts` header.

### 4.9 DealLicense identity = (userId, canonicalAddressKey) with unique partial index (Issue #105 substrate)

**Problem:** Same property typed two different ways ("123 Main St" vs "123 main street") could create two separate paid licenses — double-billing the user.

**Decision:** `canonicalAddressKey` helper produces a stable joined string (`123 main st|austin|TX|78701`) by lowercasing, stripping punctuation, expanding `Street→st` / `Avenue→ave` etc., truncating ZIP+4. Unique compound index on `(userId, canonicalPropertyAddressKey)` with `partialFilterExpression: { status: 'active' }` enforces "one active license per property per user" at the DB layer. The partial filter lets expired/refunded licenses sit alongside without blocking a fresh purchase.

**Why it matters:** Pay-per-deal pricing requires bulletproof "same property" detection. Without canonicalization, a confused user types the same address twice with different formatting and gets two Stripe charges — the kind of mistake that triggers chargebacks.

### 4.10 Credit redemption order = "create license, then mark credit" (Issue #105 substrate)

**Problem:** Two writes need to land together: create the `DealLicense`, mark the `DealCredit` redeemed. Either order has a failure mode if step 2 fails.

**Decision:** Create license first, mark credit redeemed second. Reasoning: if step 2 fails (e.g., the credit was already redeemed by a parallel request — a race we detect via the atomic filter `status='issued'`), the worse outcome is an orphaned license. That outcome means the user got what they paid for and we have an ops-fixable inconsistency. The opposite failure (credit consumed, license missing) would silently take a user's credit and deliver nothing — a far worse trust failure.

When the race is detected, we log loudly (`logger.error`) so ops can backfill, and surface a "please retry" to the user.

### 4.8 Agent guardrail: never ask users for internal IDs (Issue #116)

**Problem:** Agents occasionally asked users for `decisionId` / `sessionId` / `conversationEventId` — internal vocabulary leaking into user-facing text.

**Decision:** Hard guardrail in both `dealScoringAgent.ts` and `qaAgent.ts` system prompts: "Users do NOT have decisionId / analysisEventId / sessionId / conversationEventId. NEVER ask for them. Use `recall_user_context` to resolve references autonomously."

---

## 5. Issue index — what shipped, what's open

The full tracker is `ISSUE_TRACKER.md`. This is the 2.0-era subset (#88-#117).

### Shipped

| # | Title | Resolved |
|---|---|---|
| 88 | Public-calculator real-time results distraction | 2026-04 |
| 89 | Claimed chat deals don't appear in /saved-properties | 2026-05 (materialization service) |
| 91 | ChatOverlay doesn't restore prior chat thread | 2026-05 |
| 92 | Ghost-user TTL cleanup job | 2026-05 |
| 93 | Drop W6-S5 localStorage fallback | 2026-05 |
| 95 | tool_call UX pills during streaming | 2026-05 |
| 99 | Named prompt-injection detection rule | 2026-05 |
| 100 | Strategic UX direction — wizard vs chat coexistence | 2026-05 (chat-first locked) |
| 104 | Tool-only routes fail for chat-flow input | 2026-05-17 |
| 105 | Pricing & packaging strategy LOCKED | 2026-05-17 ($4.99/deal + bundles) |
| 107 | Pricing page rewrite | 2026-05-17 |
| 108 | Legacy AppleNavigation wrapping protected routes | 2026-05-17 |
| 109 | Deal Quality Score shows NaN in materialized Deal | 2026-05-17 |
| 110 | Anon /app lacks PublicHeader | 2026-05-17 |
| 111 | Chat email summary is shallow | 2026-05-18 |
| 112 | 10-year projection not rendered in DealScoreCard | 2026-05-17 |
| 113 | Agent has no mechanism to resolve "my latest deal" | 2026-05-17 (chip hygiene) |
| 114 | Walk-away price tracks buyer's offer | 2026-05-17 |
| 115 | Markdown tables render as pipe-text mess | 2026-05-17 |
| 116 | Agent must NEVER ask for internal IDs | 2026-05-17 |
| 117 | /analysis/:id renders legacy tabs | 2026-05-18 |
| 106 (Phase A) | Cost-cap layered protection | 2026-05-18 |

### Open

| # | Title | Blocks |
|---|---|---|
| 96 | PDF attachment on email-summary CTA | Nothing (deferred) |
| 97 | adversarial_critic structured output rendering | Calibration dashboard |
| 98 | Real-LLM adjacency eval for off_topic classifier | Eval CI gate |
| 101 | Strategy comparison via multi-tool-use | Deferred per Marcus |
| 102 | Property comparison chip + CompareCard | Future feature |
| 103 | Full listing-URL → RentCast Tier 2 | Auto-analysis from URL |
| 106 (Phase B) | Per-license cap | Stripe go-live |
| 106 (Phase C) | Per-IP cap + anomaly alerts | Public launch |

---

## 6. Environment variables

Variables introduced or repurposed across the 2.0 build. Defaults shown.

### Cost discipline (Issue #106 Phase A)

| Var | Default | Purpose |
|---|---|---|
| `COST_CAP_SESSION_CENTS` | `100` ($1.00) | Per-session ceiling |
| `COST_CAP_DAILY_CENTS` | `2000` ($20.00) | Global daily ceiling |
| `COST_GUARDS_ENABLED` | `true` | Master kill-switch |
| `ANTHROPIC_PROMPT_CACHE_ENABLED` | `true` | Toggle `cache_control: ephemeral` wrapping |

### Model selection

| Var | Default | Used for |
|---|---|---|
| `ANTHROPIC_API_KEY` | required | All LLM calls |
| `ANTHROPIC_HAIKU_MODEL` | `claude-haiku-4-5` | Intent classifier |
| `ANTHROPIC_SONNET_MODEL` | `claude-sonnet-4-6` | deal_scoring, qa agents |
| `ANTHROPIC_OPUS_MODEL` | `claude-opus-4-7` | adversarial_critic |

### Affiliate (Josh Lupo)

| Var | Purpose |
|---|---|
| (none — detected from subdomain at runtime) | `theficouple.reanalyzr.com` → JOSH_LUPO code |

---

## 7. Operational runbook

### "A user's session is stuck behind the cap"

Symptom: `[EmailService]` and orchestrator logs show repeated `costGuards: session cap exceeded`.

Mitigation:
1. Have the user start a new chat session (new sessionId resets the aggregate)
2. To raise the cap globally, set `COST_CAP_SESSION_CENTS=200` (or whatever) and redeploy
3. To kill caps temporarily (incident response): `COST_GUARDS_ENABLED=false`

### "Global daily cap fired"

Symptom: `costGuards: GLOBAL DAILY CAP EXCEEDED` log at error level; ALL chat sessions return the daily-cap user message.

Mitigation:
1. Verify it's real spend (Anthropic dashboard cross-check) and not a logging bug
2. If real: dig into `cost_events` collection — who/what is driving the spend?
3. Raise cap or disable guards only after root cause is understood

### "Walk-away price is 0 in the saved-deal view"

By design when the engine couldn't derive one (no NOI, no FMV). The DealScoreCard suppresses the delta row when walkAwayPrice is 0. If users complain, check `score_deal.ts:resolveWalkAwayPrice` logs to see which tier failed.

### "Chat email looks shallow"

After 2026-05-18 the email includes assumptions + 10-yr projection sections when present. If a specific email still looks shallow:
1. Check that `card.assumptions` and `card.projection` are populated in the DealScoreCard wire payload
2. Empty arrays render no section — that's intentional, not a bug

---

## 8. What's next (priority-ordered)

1. **Phase B cost caps** (Issue #106 Phase B) — per-license cap. Blocked on DealLicense model (Issue #105 substrate spec).
2. **Stripe integration** (Issue #105) — $4.99/deal + bundles. Phase B caps gate this.
3. **Phase C cost caps** (Issue #106 Phase C) — per-IP cap, anomaly alerts. Ships with public launch.
4. **CI-gated eval suite** (`PRODUCT_2.0_EVALS.md`) — calibration tests need to block merges on drift.
5. **PDF attachment on email CTA** (Issue #96) — revisit after Phase B; legacy wizard PDF infra exists but coupled to wizard request shape.

---

## 9. How to update this doc

After each multi-commit push:
1. Run `git log <since-last-update>..HEAD` to recover the commits
2. For each issue resolved, add a row to §5
3. For each new architectural decision, add a §4.x entry — capture the *problem*, the *decision*, and *why it matters*
4. Update §1 if any subsystem moved status
5. Update §6 if env vars changed
6. Update §8 with what's now open

Keep it skimmable. If a section grows past ~25 rows, split it.

---

**Last updated:** 2026-05-18 (DealLicense substrate + CostEvent.licenseId field)
