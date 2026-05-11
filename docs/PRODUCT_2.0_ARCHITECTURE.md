# REanalyzr 2.0 — Architecture (Master)

**Document type:** Architecture decisions and shape
**Authored:** 2026-05-10 (Architect persona, anchored to thesis v3)
**Source thesis:** [REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md](REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md)
**Status:** Draft 1 — overview + decision table. Companion docs hold the depth.

---

## 0. How to read this document

This is the **master architecture doc**. It establishes the shape of REanalyzr 2.0, locks the architectural decisions made on 2026-05-10, and points to companion docs for depth.

**For each role:**
- **Founder / Marcus persona running decomposition:** read end-to-end. §12 (decision table) and §13 (migration path) are load-bearing.
- **Engineer joining the rewrite:** read §1–§5, then jump to whichever companion doc you're working in.
- **Future investor / B2B prospect:** §1 (executive summary) and §10 (compliance + audit architecture) are the relevant slices.

**Companion docs (depth lives here, not in this doc):**
- [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md) — event taxonomy, schemas, persistence discipline, query patterns
- [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md) — orchestrator, agent boundaries, tool design, conversation memory
- [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md) — golden sets, calibration check vs. existing engine, CI gating
- [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md) — model-tier routing, per-query token budgets, caching strategy
- [PRODUCT_2.0_FRONTEND.md](PRODUCT_2.0_FRONTEND.md) — chat-native overlay, structured controls inline in chat, mobile patterns

---

## 1. Executive summary

REanalyzr 2.0 is a **re-shape, not a rewrite.** The existing analysis engine, decision logic, walk-away pricing, pipeline, and portfolio code are kept. The frontend stays mostly intact (strangler-fig pattern). What changes:

1. **A new chat-native surface** ships as an overlay on the existing wizard/dashboard. Users get a single open input that the agent extracts intent from. Existing wizard remains operational at `/sfr-analysis`.
2. **A backend rebuild from calculator-architecture to agent-mesh-and-events-store architecture.** Wave 1 mesh: deal-scoring agent, Q&A agent, adversarial critic agent. Enrichment is a tool of deal-scoring, not a separate agent (deviation from thesis §5.2 — see §5.2 below for rationale).
3. **A typed, append-only events store** that captures every analysis, decision, override, critique, conversation, and audit event. Same MongoDB cluster, separate event collections with insert-only discipline.
4. **MCP-compatible edges** as the protocol surface for future agent-to-agent integration. A2A and OpenAI Assistants adapters are deferred until those standards converge.

**The substrate framing in the thesis does two jobs:**
- *Technical:* a typed, append-only event log. Mundane primitive — disciplined engineering, not exotic infrastructure. ~3 days of focused schema + repository work.
- *Strategic / moat:* "the dataset that ships a tool, not a tool that logs data." The moat isn't the storage primitive. It's *what we put in it* — override events from real underwriters, outcome events from closed deals, critique events from adversarial agents. Competitors can replicate the storage trivially. They can't backfill 18 months of underwriter override behavior.

This doc uses **events store** as the technical name for the primitive; **substrate** is reserved for external/strategic communication where the moat framing matters.

---

## 1.5 Non-negotiable: AI never produces the scoring decision

**The `dealQuality` score (0-100) is produced by a deterministic, calibrated formula in the engine. AI never produces the score.**

AI agents (Q&A, adversarial critic, profile extraction) explain, critique, personalize, and extract — but they do not compute the score. This is a project-wide rule, not a wave-1 limitation. Future agent waves (market-data, pipeline, portfolio) inherit this constraint.

**Personas flow into the algorithmic core as deterministic configuration**, not as AI calls:

- `riskTolerance` → selects from a finite set of pre-defined scoring weight tables (conservative / moderate / aggressive). See `getStrategyAwareWeights()` in [investmentDecisionEngine.ts:207](../backend/src/services/investment/investmentDecisionEngine.ts) — this pattern is already in current code and lifts cleanly.
- `investorType` (lender / consultancy / pro / retail) → enforces deterministic threshold variations (e.g., `lender` triggers stricter DSCR critical-flag thresholds; `consultancy` enables audit-trail output by default).
- `investmentStrategy`, `experienceLevel`, `primaryGoal` → adjust deterministic weights and thresholds.

AI is allowed to *recommend* persona-aware adjustments to deterministic configuration (e.g., "based on your stated goals, conservative weights apply") and to *surface* persona context to the engine — but the engine itself runs the same calibrated formula and produces the same score for the same inputs every time. **The score is reproducible from inputs.**

**Why this is load-bearing:**

1. **Auditability.** A regulator, B2B underwriting committee, or CPA reviewing this platform must be able to trace any score back through the formula and its inputs. "Why 67?" answers with weighted factors and thresholds. "The AI thought so" is not a defensible answer in regulated lending contexts.

2. **Calibration moat.** Conservative-by-design calibration is an engineered property of the scoring formula. AI in the decision path would dilute this over time as the AI is trained, fine-tuned, or nudged toward outputs the user prefers. The thesis non-negotiable ("honest analysis over deal rationalization") depends on this layer staying deterministic.

3. **User protection.** Users cannot socially-engineer the engine into a higher score. AI is excellent at producing what users want to hear. A deterministic core prevents wishful-thinking investors, aggressive sellers feeding context to the platform, or affiliate-driven traffic from talking the engine into optimism. If a user is going to get a wrong answer, it won't be because they reframed the conversation cleverly enough — it'll be because the input data was wrong, which is a different and traceable failure mode.

4. **Compliance.** B2B regulated buyers (small lenders, credit unions, underwriting consultancies) need explainable underwriting. Deterministic scoring is the only defensible answer when "show me the assumptions" is a regulatory requirement, not a UX nicety.

**Where AI's surface area DOES expand in 2.0:** explanation (Q&A agent uses personas to personalize how scores are explained), critique (adversarial agents stress-test decisions and surface counter-arguments as parallel signal — they do NOT modify the score), profile extraction (AI reads unstructured chat input and writes typed ProfileEvent), and long-term calibration loops (persona-tagged override events accumulate in substrate; analytics on those patterns inform future deterministic-config adjustments). All of these are intentional. None of them put AI in the scoring path.

The 80/20 algorithmic/AI split from the thesis holds: ~80% of the value-bearing decision logic stays in calibrated code. AI is the layer that makes that calibrated logic more usable, more communicable, and more defensible — never the layer that produces the answer.

---

## 2. Target architecture — the two-layer stack

```
┌────────────────────────────────────────────────────────────┐
│  SURFACE                                                    │
│  ─ Existing wizard + dashboard (kept, /sfr-analysis)       │
│  ─ Chat-native overlay (new, /app)                         │
│    with embedded structured controls (verdict cards,        │
│    override sliders, audit-trail expansions, PDF export)   │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│  ORCHESTRATOR                                               │
│  ─ Intent recognition (route to deal-scoring / Q&A /       │
│    adversarial / general)                                   │
│  ─ Conversation memory (per-session ephemeral +            │
│    per-user events-store-backed)                            │
│  ─ A2A-compatible edges via MCP server (primary)           │
└────────┬─────────┬──────────────┬──────────────┬───────────┘
         │         │              │              │
    ┌────▼───┐ ┌───▼────┐  ┌──────▼─────┐  ┌────▼──────┐
    │ Deal-  │ │ Q&A /  │  │ Adversarial │  │ Tools     │
    │ scoring│ │ Edu    │  │ Critic      │  │ - enrich  │
    │ agent  │ │ agent  │  │ agent       │  │ - calc    │
    │        │ │        │  │ (optimist + │  │ - search  │
    │        │ │        │  │  CPA)       │  │ - export  │
    └───┬────┘ └────┬───┘  └──────┬──────┘  └───┬───────┘
        │           │             │             │
        └───────────┴─────────────┴─────────────┘
                          │
                  ┌───────▼────────┐
                  │  EVENTS STORE  │
                  │  (MongoDB,     │
                  │   typed,       │
                  │   append-only) │
                  └────────────────┘
```

**Key properties:**
- Surface and orchestrator coexist with existing REST endpoints (`/api/deals/analyze`, `/api/portfolios/*`, etc.) for the strangler-fig migration period.
- Every agent invocation writes ≥1 event to the events store. Tools that don't write to the store don't ship.
- Tools are deterministic (no LLM); agents wrap reasoning + tool calls.
- The orchestrator is the only component that talks to the chat surface; agents are not directly addressable from the frontend.

---

## 3. Events store

**Companion doc:** [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md) — schemas, indexing, query patterns.

### 3.1 Decision: MongoDB, separate event collections, insert-only discipline

**Locked.** Same MongoDB cluster currently running portfolio/user/auth/cache. New collections per event type, with:

- **Insert-only DB role** for the application's events-store user (no `update`/`delete` permissions on event collections)
- **Strict Mongoose schemas per event type** — no `Schema.Types.Mixed`, no opaque blob fields
- **`eventVersion` field on every event** — readers handle multiple versions; never mutate historical events
- **Correlation ID** (`traceId`) on every event — enables tracing across agent calls within one user interaction

**Why MongoDB and not Postgres+jsonb:**
- Same datastore as existing data — zero ops delta (no second DB to provision, monitor, back up, secure, scale, version-upgrade)
- "Append-only" is enforceable via DB roles and repository discipline; not a tech-stack-dependent property
- "Typed schema" is enforced by Mongoose + TypeScript — the "no JSON blobs" warning in the thesis is a discipline issue, not an engine issue
- MongoDB aggregation framework is at least as capable as Postgres for the substrate's query patterns (mostly within-event-store queries by user + timestamp + eventType)

**When we'd reconsider:**
- RAG / embeddings enter the architecture in wave 2 or 3 — at that point pgvector vs. Atlas Vector Search becomes a real comparison
- Cross-event-store-and-relational joins become a hot query path — not currently anticipated

### 3.2 Event taxonomy (initial — wave 1)

Every event has: `_id`, `traceId`, `userId`, `eventType`, `eventVersion`, `timestamp`, `actorType` (`user` | `agent:<name>` | `tool:<name>`), and a typed payload.

| Event type | When written | Payload (representative) |
|---|---|---|
| `ProfileEvent` | User shares profile in chat (or onboarding form, or B2B sales) | investorType, portfolioSize, primaryMarket, role (retail / lender / pro), institutionContext (B2B) |
| `AnalysisEvent` | Deal-scoring agent runs analysis | propertyData, marketData, computed metrics (60+ fields) |
| `DecisionEvent` | Deal-scoring agent produces verdict | verdict, dealQuality, professionalAssessment, walkAwayPrice, reasoningTrail |
| `OverrideEvent` | User overrides an assumption (rent, vacancy, rate, etc.) | originalValue, newValue, fieldPath, justification (optional), priorVerdict, newVerdict |
| `CritiqueEvent` | Adversarial agent disagrees with deal-scoring agent | criticPersona ("optimistic flipper" \| "skeptical CPA"), originalDecision, criticVerdict, divergenceReasons |
| `ConversationEvent` | Each turn in chat (user input + agent response) | userInput, agentResponse, intentClassification, toolCalls, tokenUsage |
| `AuditTrailEvent` | B2B-relevant: PDF export, audit-trail view rendered, override approved | exportType, viewedAssumptions, approvedBy, signedAt |
| `WatchlistEvent` | User saves a property to watchlist | propertyId, source ("chat" \| "wizard" \| "import") |
| `OutcomeEvent` *(deferred)* | User reports a deal closed / passed / walked / defaulted | outcome, dealId, financialDelta (optional, post-purchase performance) |

The `OutcomeEvent` schema is shipped from day one even though we don't capture outcomes yet. Cost is near-zero; benefit is that when we light up outcome capture (B2B pilot, retail follow-up surveys), the schema is already there.

### 3.3 Indexing and access patterns

Most-used queries:
- **By user + recent**: `{ userId: 1, timestamp: -1 }` — every "show this user's recent deals" or "load conversation history" query
- **By user + eventType + recent**: `{ userId: 1, eventType: 1, timestamp: -1 }` — "show all analyses" or "show all overrides for calibration"
- **By traceId**: `{ traceId: 1 }` — debug a single agent interaction across all events
- **By dealId** (for events that reference a specific deal): `{ dealId: 1, timestamp: -1 }`

TTL: none on event collections (substrate is the moat — we keep everything). Bloat managed by archival to cold storage if/when collection size becomes an issue (deferred — at projected wave 1 volumes, ~5–10K events/active user, total volume is manageable for years).

---

## 4. Orchestrator

**Companion doc:** [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md) — implementation detail.

### 4.1 Decision: custom orchestrator, not LangGraph / CrewAI

**Locked.** For wave 1 (3 agents + tools), framework lock-in cost > ergonomic gain. Direct Anthropic SDK with typed tool definitions, intent recognition via cheap classification call (Haiku 4.5), routing in plain TypeScript.

**Why not framework:**
- LangGraph state graphs and CrewAI role hierarchies are valuable when you have ≥6 agents and complex multi-turn state. Wave 1 doesn't.
- Framework lock-in introduces upgrade-risk and observability friction
- Anthropic SDK + typed tools + plain code is straightforward for this scale

**When we'd reconsider:**
- Wave 2 lands and the mesh has 6+ agents with complex state graphs (LangGraph becomes attractive)
- Multi-agent coordination patterns get hard (CrewAI's role/task/process abstractions might pay)

### 4.2 Conversation memory model: hybrid

- **Per-session (ephemeral):** active conversation thread held in memory + Redis (or in-memory cache; deferred decision). Used for the immediate back-and-forth.
- **Per-user (events-store-backed):** ProfileEvents, OverrideEvents, prior DecisionEvents are queried from the events store at session start to seed the agent's context. No separate "user memory" store.

This means the events store IS the long-term memory. Conversations are RAG-able from substrate at session start; no parallel memory infrastructure to maintain.

### 4.3 Intent recognition + routing

Cheap classification call (Haiku 4.5, prompt-cached) maps user input → intent → agent.

| Intent | Routes to |
|---|---|
| `analyze_property` (address, listing link) | Deal-scoring agent |
| `share_profile` (user shares context about themselves / portfolio / role) | Profile extraction tool, then waiting for property |
| `qa_education` ("what does cap rate mean") | Q&A agent |
| `qa_decision` ("why did this PASS", "what would change to make it BUY") | Q&A agent with decision context |
| `override_assumption` (user changes a metric in chat) | Override tool, triggers re-analysis |
| `request_audit_trail` (B2B, "show me the assumptions") | Audit tool |
| `request_export` (PDF export) | Export tool, AuditTrailEvent |
| `request_critique` (manual or auto-triggered by certain verdict bands) | Adversarial critic agent |
| `general` (couldn't classify) | Q&A agent as fallback |

Routing is plain TypeScript with the Haiku classifier as the dispatcher.

---

## 5. Agent mesh — wave 1

**Companion doc:** [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md) — agent specs, tool definitions, prompt structure.

Three agents in wave 1, each wrapping existing-engine capability where possible (re-shape, not rewrite).

### 5.1 Deal-scoring agent

**Wraps:** `BaseDecisionEngine` + `SFRDecisionEngine` / `MFDecisionEngine` ([backend/src/services/investment/](../backend/src/services/investment/))
**Lift difficulty:** Low. Engine is already abstract base + extension pattern.

**Tools available:**
- `enrich_property(address)` — fetches RentCast + FRED + (Census) data. Wraps existing `MarketIntelligenceService`. Deterministic, no LLM.
- `compute_analysis(propertyData, marketData)` — runs `SFRAnalyzer` / `MultiFamilyAnalyzer` to produce 60+ metrics. Wraps existing analyzers. Deterministic.
- `score_deal(analysisResult, propertyData)` — runs `BaseDecisionEngine.generateDecision()`. Deterministic.
- `compute_walk_away(...)` — surface for explicit walk-away calculation queries.

**Substrate writes:** `AnalysisEvent`, `DecisionEvent` per invocation.

**Why this is one agent and not three:** the three tools above are sequential, deterministic, and write related events. An agent boundary between them adds ceremony without value. The agent is the reasoning layer that decides when to call which tool, formats the output for chat (verdict card vs. text), and handles overrides.

### 5.2 Enrichment as **tool**, not separate agent — *deviation from thesis §5.2*

**Thesis §5.2 lists three wave-1 agents:** deal-scoring, **enrichment**, Q&A.

**Decision: enrichment is a tool of deal-scoring, not a peer agent.**

**Rationale:**
- Enrichment is deterministic (no LLM). The existing `MarketIntelligenceService` already orchestrates RentCast + FRED + Census in parallel with caching. Wrapping it in an agent boundary adds ceremony without changing behavior.
- The "agent boundary heuristic" from the thesis: *if its substrate writes are categorically different, it's an agent.* Enrichment's writes (market data fetched events) are scaffolding for analysis events, not categorically different from them. They could even be folded into the AnalysisEvent's payload.
- Agent overhead (LLM call to decide which API to hit) is counterproductive when the decision tree is "always call all three in parallel."

**When we'd promote enrichment to agent:**
- Comp-selection becomes non-trivial (agentic decisions about which comps are most relevant — e.g. filtering by recency, distance, property similarity)
- We add data sources where the agent must choose which to query (e.g. county records for some markets but not others)

**Counter we'd accept:** if you want the 3-agent narrative for clarity in external pitches, we can wrap the tools in a thin "enrichment-agent" facade with no actual reasoning. Keep the implementation as-is, change the org chart. Marketing call, not architecture call.

### 5.3 Q&A / education agent

**Wraps:** `aiEnhancedMessagingService` ([backend/src/services/aiEnhancedMessaging.ts](../backend/src/services/aiEnhancedMessaging.ts))
**Lift difficulty:** Medium. Surface already produces 5 distinct content types (reasoning, actionPlan, capitalStrategy, timeline, alternatives) plus goal-based reasoning. Migration work:

1. **String-template prompts → tool-use** — current implementation uses hand-rolled prompt strings ([backend/src/prompts/](../backend/src/prompts/), 1,341 lines across 3 files) that contain calculation logic + instructions + output schemas mixed together. Migration: separate (a) tool definitions, (b) persona/instructions, (c) typed output schemas. Each is independently testable.
2. **Add `ConversationEvent` writes** on every turn (currently no event capture).
3. **Replace `getOpenAIClient()` with Anthropic SDK** (Sonnet 4.6 default, prompt caching, tool use). Existing legal-compliance post-processing (directive language sanitization) ports over.

**Tools available:**
- `explain_metric(metricName, currentValue)` — "what does cap rate mean for this deal"
- `explain_decision(decisionId)` — "why did this score 67/100"
- `propose_optimization(decisionId)` — "what would change to push this above 80"
- `recall_user_context(userId)` — pulls ProfileEvents and recent decisions for personalized answers

**Substrate writes:** `ConversationEvent` on every turn.

### 5.4 Adversarial critic agent (new — no existing equivalent)

Two synthetic personas configured at the prompt/instruction level:
1. **Optimistic flipper** — biased toward upside, value-add scenarios, aggressive rent assumptions
2. **Skeptical CPA** — biased toward conservatism, hidden costs, tax/cash-flow risk

**When invoked:**
- Automatically on every BUY-band verdict (deal-scoring agent score ≥ 80) — sanity check before user sees a strong recommendation
- Manually via "request a critique" intent
- Periodically as a batch over recent analyses (substrate seeding)

**Cost discipline:** Opus 4.7 is expensive (~$0.05–0.15/critique). Auto-invocation only on BUY band (rare) + batched periodic runs. Not run on every analysis.

**Substrate writes:** `CritiqueEvent` on every invocation. Disagreement with deal-scoring agent is the signal.

**Kill criterion (per thesis §5.5):** if 4 weeks of running these personas don't produce useful disagreement signal (i.e. critiques are either trivially agreeing or producing noise), scope down to one persona or pause. Instrument from day one so the kill decision is data-driven, not vibes.

### 5.5 Wave 2 preview — portfolio-agent, pipeline-agent, market-data agent

Per [thesis §5.2](REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md), wave 2 adds three agents. They are explicitly **NOT in wave 1 scope.** The architecture supports them without rework when wave 2 lands.

| Wave 2 agent | Wraps | Lift difficulty | New chat capability |
|---|---|---|---|
| Portfolio agent | [portfolioAnalyticsService](../backend/src/services/portfolio/), [portfolioPropertyMetricsService](../backend/src/services/portfolio/), [enhancedPortfolioAI](../backend/src/services/portfolio/enhancedPortfolioAI.ts) | Medium | "How does this deal fit my portfolio?", "What's my portfolio health?", "Which deal should I sell first?" |
| Pipeline agent | Pipeline services + [PipelineDeal](../backend/src/models/PipelineDeal.ts) model | Medium | "Which deals need review this week?", "Show pipeline by next action", "What's my close rate this quarter?" |
| Market-data agent | (Net-new — no clean lift target) | High | "What's the rent trend in Phoenix?", "Compare cap rates across my markets" |

**The deterministic-scoring non-negotiable extends to wave 2.** Portfolio analytics calculations stay in deterministic code; AI provides explanation and personalization. Pipeline state transitions are deterministic; AI helps prioritize. Same boundary as wave 1.

**B2B variant flag:** The existing Portfolio model is retail-shaped (goals: cash flow / wealth building / diversification / tax optimization). B2B buyers (lenders, consultancies) need a different portfolio shape — loan portfolios with regulatory views, default-rate aggregations, audit-trail-per-portfolio. Recommend adding `portfolioType: 'retail' | 'b2b_loan' | 'b2b_advisory'` to the Portfolio model in wave 1.5 (cheap, non-breaking) so wave 2's portfolio-agent can branch on it without a schema migration. The actual B2B portfolio shape is wave 2 design.

---

## 6. Tool design

**Companion doc:** [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md) §3.

Standards:
- All tools have **typed input + typed output schemas** (TypeScript interfaces, validated at runtime via Zod or similar)
- Tools return **structured outputs** (Anthropic tool use), not free-form prose
- Tools **never call LLMs** — they are deterministic. If reasoning is needed, that's an agent, not a tool
- Tools **emit events to the store** when they cause state changes (override tool emits OverrideEvent; export tool emits AuditTrailEvent)
- **Retry semantics:** transient failures (RentCast 5xx, FRED rate limit) retry with exponential backoff, max 3 attempts. Permanent failures (invalid input) surface to the agent as typed errors, not exceptions.

**Tool catalog (initial — wave 1):**

| Tool | Input | Output | Side effects |
|---|---|---|---|
| `enrich_property` | `{ address, propertyType }` | `{ comps, marketTrends, economicIndicators, propertyData }` | none (read-only) |
| `compute_analysis` | `{ propertyData, marketData }` | `{ metrics: 60+ fields, monthlyAnalysis, longTermAnalysis }` | none (compute-only) |
| `score_deal` | `{ analysisResult, propertyData }` | `{ verdict, dealQuality, professionalAssessment, walkAwayPrice }` | `AnalysisEvent` + `DecisionEvent` |
| `apply_override` | `{ decisionId, fieldPath, newValue }` | re-runs analysis with override; returns new decision | `OverrideEvent` |
| `recall_user_context` | `{ userId }` | `{ profile, recentDecisions, recentOverrides }` | none |
| `export_audit_pdf` | `{ decisionId }` | PDF binary | `AuditTrailEvent` |
| `save_to_watchlist` | `{ decisionId }` | confirmation | `WatchlistEvent` |

---

## 7. A2A-compatible edges

**Decision: MCP first, A2A and OpenAI Assistants adapters deferred.**

**Why:**
- MCP (Anthropic's Model Context Protocol) is the most concretely specified standard in May 2026
- Aligns with the SDK we're already using
- A2A (Google) and OpenAI Assistants haven't converged with each other or with MCP

**What we build now:**
- Internal agent mesh exposes its tools via MCP server interface from day one
- This makes those tools callable by any MCP-aware client (Claude Desktop, future MCP-compatible agents)
- Edge layer is thin — thin REST/HTTP wrapper over the same tool registry

**What we defer:**
- A2A-compatible adapter (build when standard solidifies, or when a partner needs it)
- OpenAI Assistants adapter (same)

**Adapter pattern at the edges:** the tool registry is the source of truth. MCP server is the first edge. Adapters for A2A / Assistants are layered on the registry, not a separate implementation. Swap edges, not architecture.

---

## 8. Eval architecture

**Companion doc:** [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md) — golden-set construction, calibration check methodology, CI gating.

**Three eval surfaces, gated independently:**

### 8.1 Golden set per agent

A small (50–200 examples) curated test set for each agent, with expected outputs. Run on every PR. Failures gate merges.

- **Deal-scoring agent:** input = property data; expected = verdict + dealQuality within tolerance vs. existing engine's output
- **Q&A agent:** input = question + decision context; expected = factual correctness against substrate, schema validity, no directive-language violations
- **Adversarial critic agent:** input = decision; expected = critique events with at least N substantive disagreement points (testing the personas produce signal, not just agree)

### 8.2 Calibration check vs. existing engine

The most important eval. The deal-scoring agent must produce verdicts and `dealQuality` scores within tolerance of the existing `investmentDecisionEngine.ts` for a curated regression set of ~500 deals (founder-historical backfill is the seed corpus).

- **Tolerance:** verdict must match exactly; dealQuality must be within ±3 points (configurable). The §10.9 open question — "what's the agent-divergence threshold for bug vs. improvement?" — is QE's call to make. Default starts strict (±3) and loosens only with explicit justification per drift case.
- **Drift detection:** if the agent's distribution of verdicts on the regression set shifts (e.g., suddenly more BUY verdicts than the existing engine produced), that's calibration drift. Reject the change unless the drift is justified and approved.

### 8.3 CI gating

- Every PR that touches an agent or its prompts runs both eval surfaces
- Failures block merge
- Eval reports posted to PR (verdict match rate, dealQuality MAE, schema violation count, directive-language violation count)
- Cost report: total tokens consumed, per-query average — drift on cost is also a CI signal

---

## 9. Cost economics model

**Companion doc:** [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md) — per-query budgets at $19.99 / $200 / $2K price points, caching strategy, fallback cost-cap enforcement.

### 9.1 Model-tier routing

| Component | Model | Why |
|---|---|---|
| Intent classifier (orchestrator routing) | Haiku 4.5 | Fast, cheap, deterministic; called on every turn |
| Deal-scoring agent | Sonnet 4.6 | Reasoning + tool use; default agent tier |
| Q&A agent | Sonnet 4.6 | Reasoning + multi-turn coherence |
| Adversarial critic | Opus 4.7 | High-stakes critique; runs sparingly (BUY band only or batched) |
| Profile extraction tool | Haiku 4.5 | Pattern matching, structured extraction |
| Tools (deterministic) | None (no LLM) | Tools are pure code |

### 9.2 Per-query cost budget (estimates, validate with real traffic)

| Tier | Budget per query | Rationale |
|---|---|---|
| Retail (free / $19.99/mo) | <$0.05 | 100 queries/user/month at $19.99 = $0.20/query margin headroom; target 25% of margin = $0.05 |
| B2B small lender ($200/mo) | <$0.30 | Higher per-query budget supports adversarial critique on every deal |
| B2B mid-market ($2K/mo) | <$2.00 | Audit-trail-heavy workflows with multi-agent reasoning per deal |

### 9.3 Caching strategy

- **Prompt cache (Anthropic 5-min TTL):** persona / instructions / shared context. Architecture conversations span >5 minutes, so cache windows are designed for either <270s (stays warm) or >1200s (amortizes one miss for a much longer wait). Don't sit at 300s — worst-of-both.
- **Semantic cache:** repeated user questions in Q&A ("what does cap rate mean") cached by embedding similarity. Cheap wins.
- **Tool result cache:** `enrich_property` results cached by address + recency window (existing MarketIntelligenceService caching ports over).

### 9.4 Cost-cap enforcement

- Per-user monthly cap (configurable per tier)
- Per-query absolute cap (kill switch on runaway generation)
- Per-organization cap (B2B safety)
- All caps emit events to a separate `CostEvent` collection (not in §3.2 taxonomy because it's operational, not substrate)

---

## 10. Compliance and audit architecture (B2B-driven)

The B2B paying market (small lenders, credit unions, hard-money shops, underwriting consultancies) requires audit-trail visibility as a gate, not a nice-to-have.

### 10.1 Audit trail as event-sourced view

The audit trail is **not a separate data structure**. It's a query over the events store, scoped to a single decision:

```
audit_trail(decisionId) =
  AnalysisEvent + DecisionEvent + all related OverrideEvents +
  any CritiqueEvent + any AuditTrailEvent (export/sign-off events) +
  the assumptions used (snapshot embedded in AnalysisEvent payload)
```

The "show me the assumptions" surface in the UI is a render of this query. The PDF export is the same query, formatted for compliance.

**Why this matters:** every audit-trail consumer (mobile loan officer, compliance reviewer, regulator) gets the same view, sourced from the same events. No "audit DB" to keep in sync with the decision DB.

### 10.2 Override-as-signal capture

**Two paths, both write `OverrideEvent`:**
- **Inline correction in chat:** user says "change rent to $2,600" → override tool fires → re-analysis runs → new DecisionEvent emitted → comparison with original surfaces in chat
- **Structured override modal:** for high-stakes overrides on B2B audit trails, modal asks for justification text, captures actor identity, requires sign-off

Both write the same event type. The structured modal adds `justification` and `approvedBy` fields. UI choice doesn't fragment the substrate.

### 10.3 Outcome event capture (deferred, schema-ready)

`OutcomeEvent` schema ships from day one even though we're not capturing outcomes yet. When B2B pilot lights up outcome reporting (or retail follow-up surveys catch on), the schema is already there.

---

## 11. Strangler-fig integration plan (frontend)

**Companion doc:** [PRODUCT_2.0_FRONTEND.md](PRODUCT_2.0_FRONTEND.md) — chat-native overlay, structured controls inline, mobile patterns, voice input.

### 11.1 Coexistence

- **`/sfr-analysis` wizard:** stays operational. No rewrite. Continues to serve users who prefer forms.
- **`/app` chat surface:** new. The default destination for new traffic.
- **Marketing homepage at `reanalyzr.com`:** stays as-is per thesis non-negotiable. Hiring-manager optics are not a tradeoff.
- **Affiliate landing pages (e.g. `theficouple.reanalyzr.com`):** continue to work, route into `/app` or `/sfr-analysis` based on existing affiliate config.

### 11.2 Cold-start surface

**Decision: open input, no upfront form.** Walking back the earlier "3-question micro-onboarding" framing.

The chat surface opens with one input. The user types, pastes, or speaks. The agent extracts intent — address, profile, B2B context, or some combination — and writes the appropriate substrate events from the first turn.

**Activation moment satisfied:** every first-turn interaction produces ≥1 substrate event (AnalysisEvent + DecisionEvent if address; ProfileEvent if context; both if both).

### 11.3 Inline structured controls

The chat-native distinction is that the agent emits **React components rendered in the chat thread**, not paragraphs of prose:

- Verdicts → `<DealScoreCard>` (score + label + key metrics)
- "Show assumptions" → `<AssumptionsPanel>` (collapsible, every assumption visible)
- Override → `<OverrideSlider>` (rent, vacancy, rate inline in chat)
- Save action → `<SaveButton>` toast
- Audit / B2B → `<ExportButton>`, `<AuditTrailPanel>`

Existing UI components are reused where possible; new wrappers handle chat-thread context (collapse states, mobile sizing, inline density).

### 11.4 Mobile

Same chat surface, single column. Voice input button prominent (property-tour use case). Verdict cards collapse by default to score + label, tap to expand. Bottom nav: Chat • Watchlist • Portfolio • Account. See [PRODUCT_2.0_FRONTEND.md](PRODUCT_2.0_FRONTEND.md) for streaming-on-cellular patterns and offline+sync handling.

### 11.5 Existing features (portfolio, pipeline) — strangler-fig coverage

The current production features **Portfolio Analysis** and **Deal Pipeline** stay **completely untouched in wave 1.** Strangler-fig discipline:

- **REST endpoints** (`/api/portfolios/*`, `/api/pipeline/*`) continue serving
- **Existing UI** (PortfolioDashboard, ApplePortfolioWizard, AddManualPropertyModal, pipeline views) continues working
- **Services** (portfolioAnalyticsService, portfolioPropertyMetricsService, enhancedPortfolioAI, pipeline services) **not touched** in wave 1
- **Chat surface in wave 1 is deal-analysis-only.** If a user asks about their portfolio in chat, the deal-scoring agent acknowledges the gap: "Portfolio context is in the dashboard — visit `/portfolio` for that view. I'll be able to answer portfolio questions here in wave 2." Honest, doesn't fake the capability.

#### 11.5.1 Wave 1.5 — substrate instrumentation (parallel, ~weeks 10-14)

Single highest-leverage thing we can do between wave 1 and wave 2: instrument existing portfolio and pipeline services to emit substrate events without changing their behavior.

- New event types: `PortfolioEvent`, `PipelineEvent` (see [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md) §3.10, §3.11)
- Implementation cost: ~2 days per service. Single-line `eventsRepo.writePortfolioEvent(...)` / `writePipelineEvent(...)` calls at write points
- No behavior change. No new endpoints. No new dashboards.
- **Earns substrate weight 14+ weeks earlier.** When outcome capture lights up, `pipeline_deal_closed` events are the lowest-friction precursor to `OutcomeEvent` — the calibration loop has a year of history instead of starting from zero.

#### 11.5.2 Wave 1.5 — Portfolio model B2B variant flag

Add `portfolioType: 'retail' | 'b2b_loan' | 'b2b_advisory'` to the Portfolio model. Default `'retail'` for all existing records (non-breaking). Wave 2's portfolio-agent will branch on this; without the field, wave 2 would need a schema migration. **Recommended in wave 1.5** while we're already touching portfolio code for event instrumentation.

#### 11.5.3 Wave 2 — portfolio-agent and pipeline-agent

Per §5.5. Wraps existing services. Chat surface extends to portfolio and pipeline queries. Existing dashboards remain operational throughout. Eventual deprecation of the wizard/dashboard surfaces is a **separate decision, not part of this rewrite.**

#### 11.5.4 Risks tracked

1. **Scope-creep pressure.** Once wave 1 chat ships for deals, users will ask "why can't I ask about my portfolio in chat?" Honor the thesis non-negotiable: deflect to existing dashboard until wave 2 ships. Discipline > velocity.
2. **Substrate-instrumentation drift.** If we skip wave 1.5 and only start emitting portfolio/pipeline events in wave 2, we lose 14+ weeks of substrate weight. The 2-day-per-service cost is well worth the substrate accumulation.
3. **Cost-tier implications for AI portfolio insights.** [enhancedPortfolioAI](../backend/src/services/portfolio/enhancedPortfolioAI.ts) currently runs without per-user cost gating. When it becomes the wave 2 portfolio-agent, it needs tier-aware cost discipline per [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md). To address when drafting the cost doc.

---

## 12. Open architecture questions (§10 of thesis) — answers

For each thesis §10 question: recommendation, rationale, or explicit "deferred" status.

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Substrate primitives (event store choice) | **MongoDB**, separate event collections, insert-only DB role, strict Mongoose schemas, `eventVersion` field, correlation IDs | Same datastore as existing data. Append-only is enforceable via discipline + permissions, not engine choice. Postgres+jsonb adds ops cost without proportional gain at wave 1 scale. Reconsider if RAG / pgvector enters wave 2/3. |
| 2 | Orchestrator implementation | **Custom** TypeScript orchestrator, Anthropic SDK, typed tools | LangGraph / CrewAI lock-in cost > ergonomic gain at 3 agents. Reconsider when wave 2 brings 6+ agents with complex state graphs. |
| 3 | Agent boundaries | **Wave 1: 3 agents** (deal-scoring, Q&A, adversarial critic). **Enrichment is a tool of deal-scoring, not a peer agent.** | Heuristic: agent boundary if substrate writes are categorically different. Enrichment writes scaffolding events for analysis, not categorically different. Promotion to agent if comp-selection becomes agentic. |
| 4 | A2A edge contract | **MCP first.** A2A and OpenAI Assistants adapters deferred. | MCP is most concretely specified in May 2026; aligns with SDK. Adapter pattern keeps swap cheap when standards converge. |
| 5 | Conversation memory | **Hybrid.** Per-session ephemeral; per-user events-store-backed. | Events store IS the long-term memory. No separate user-memory infrastructure. Conversation history is RAG-able from substrate at session start. |
| 6 | Override-as-signal capture | **Both.** Inline correction in chat AND structured override modal. Both write same `OverrideEvent` type. | Inline is low-friction for common edits ("change rent to 2600"). Structured is for high-stakes B2B overrides with justification + sign-off. UI fragmentation, substrate unification. |
| 7 | Cold-start surface | **Open input, no upfront form.** Agent extracts profile + property + B2B context from one turn. | Avoids form-before-value anti-pattern. Activation moment is satisfied because every first turn produces ≥1 substrate event. |
| 8 | Stripe gating in chat | **Deferred.** Per thesis kept-vs-released table, retail subscription-first is released. | Stripe stays available for high-intent retail; not the milestone. If/when re-introduced, gate at "save analysis" or "audit trail PDF export" — not at chat input. |
| 9 | Eval infrastructure | **Custom TypeScript harness.** Golden sets per agent in `/tests/golden/{agent}/`. Calibration check vs. existing engine on regression set. CI-gated. | No vendor lock-in for wave 1. Switch to Langfuse / baselime if observability needs outpace what we can build. |
| 10 | Cost economics | **Model-tier routing as architecture.** Haiku for routing, Sonnet for agents, Opus for adversarial. Per-tier per-query budgets ($0.05 / $0.30 / $2.00). Caching is a margin lever (prompt cache, semantic cache, tool-result cache). | See §9 and [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md). |
| 11 | Activation moment in chat | **First-turn substrate write.** Address → AnalysisEvent + DecisionEvent. Profile context → ProfileEvent. Both → both. | Visible to user via verdict card or "got it — noted" agent ack. No form before value. |
| 12 | Frontend integration | **Toggle (chat ↔ wizard) on desktop, progressive disclosure on mobile.** Marketing homepage untouched. Wizard route stays at `/sfr-analysis`. | Strangler-fig honored. Existing wizard users keep their flow. New traffic defaults to chat. |

---

## 13. Migration path — week-by-week (aligned to thesis §6 sequencing)

### Track 1 — Architecture (main workstream)

#### Weeks 1–2 — Schema + scaffolding

- [ ] Events store: 8 collection schemas implemented (Mongoose + TypeScript)
- [ ] Repository layer: insert-only methods, `eventVersion` discipline, correlation ID propagation
- [ ] DB role: insert-only user provisioned for events collections
- [ ] Test fixtures: in-memory MongoDB for unit tests of events store
- [ ] Empty orchestrator skeleton with typed tool registry interface
- [ ] CI: lint + typecheck on PRs to `reanalyzr-2.0`

**Exit criterion:** Events can be written by hand to all 8 collections; reads return typed objects; insert-only role rejects update/delete.

#### Weeks 3–4 — Deal-scoring agent (lift)

- [ ] Tool wrappers: `enrich_property`, `compute_analysis`, `score_deal`, `apply_override`, `save_to_watchlist`
- [ ] Deal-scoring agent: Anthropic SDK + Sonnet 4.6 + tools
- [ ] AnalysisEvent + DecisionEvent emission on every invocation
- [ ] Calibration test harness: regression set of 500 deals, verdict match check
- [ ] Founder-historical backfill: 2 years of personal analyses run through new pipeline

**Exit criterion:** Deal-scoring agent produces verdicts within ±3 dealQuality of existing engine on the 500-deal regression set. Substrate has founder-historical events.

#### Weeks 5–6 — Q&A agent + chat surface skeleton

- [ ] Q&A agent: lift `aiEnhancedMessagingService`, migrate to Anthropic SDK + tool use, port legal-compliance post-processing
- [ ] ConversationEvent emission
- [ ] `/app` chat surface: open-input UI, simple thread rendering, agent response streaming
- [ ] First inline structured component: `<DealScoreCard>` rendered in chat thread
- [ ] Routing: `/app` available alongside existing `/sfr-analysis`; landing page link points to `/app`

**Exit criterion:** Founder can ask "should I buy [address]?" in `/app` and get a coherent verdict-card response that wrote AnalysisEvent + DecisionEvent + ConversationEvent.

#### Weeks 7–10 — Wave 1 polish

- [ ] Adversarial critic agent: optimistic flipper + skeptical CPA personas, Opus 4.7, BUY-band auto-trigger + manual invocation
- [ ] CritiqueEvent emission, kill-criterion instrumentation
- [ ] Inline structured components: `<AssumptionsPanel>`, `<OverrideSlider>`, `<SaveButton>`, `<ExportButton>`, `<AuditTrailPanel>`
- [ ] Override flow: inline + structured paths both writing OverrideEvent
- [ ] Profile extraction tool + ProfileEvent
- [ ] Voice input on mobile (STT integration, property-tour use case)

**Exit criterion:** Full wave-1 mesh shipping on `/app`. Adversarial critic running in BUY-band path.

#### Weeks 11–14 — Eval coverage + B2B surfaces

- [ ] Golden sets per agent (50–200 examples each)
- [ ] CI gating: PRs blocked on calibration / golden-set / cost regressions
- [ ] PDF export tool + AuditTrailEvent
- [ ] Audit-trail view: assumptions, decision history, override list, sign-off interface
- [ ] Multi-deal batch processing (B2B requirement)

**Exit criterion:** B2B prospect can complete a meaningful demo flow end-to-end, including PDF export and audit trail review.

#### Weeks 15–24 — Multi-user + integration polish + raise enablement

- [ ] Multi-user / team accounts (B2B requirement)
- [ ] Substrate observability dashboards (internal + Track 3 LinkedIn material)
- [ ] Wave 2 agents: market-data agent, pipeline agent, portfolio agent (per thesis §5.2)
- [ ] MCP server interface published
- [ ] A2A / Assistants adapters: stubbed if standards have settled, deferred otherwise

**Exit criterion:** Per thesis §6 week-20 checkpoint criteria.

---

## 14. Out of scope / explicitly deferred

These are NOT decisions to revisit during decomposition. Either explicitly deferred per thesis or out of architecture scope.

- **Pricing for first B2B pilot** — thesis §11/Appendix B; set by demo signal, not architecture
- **Specific first B2B target segment** (credit unions vs. hard-money lenders vs. consultancies) — thesis Appendix B
- **Raise timing / pre-seed vs. seed** — thesis Appendix B
- **Stripe gating in chat** — see §12 row 8
- **External agent partnerships (Zillow-agent, Plaid-agent, etc.)** — thesis §5.4; not chased in 2026
- **A2A / OpenAI Assistants adapters** — see §7
- **RAG / vector search / embeddings** — wave 2 or 3; reconsider Postgres+pgvector if/when this lands
- **Big-bang frontend replacement** — thesis kept-vs-released; strangler-fig only
- **On-device inference** — see [PRODUCT_2.0_FRONTEND.md](PRODUCT_2.0_FRONTEND.md) §6
- **Outcome capture pipeline** — schema ships, capture pipeline lights up post-pilot
- **Specific LinkedIn post topics** — thesis §6/Appendix B; emerge from the work

**Side note (genuinely out of architecture scope but worth a parallel cleanup PR):** [backend/src/controllers/](../backend/src/controllers/) contains 8 stale variants of `deals.ts` and similar (`deals.ts.bak`, `deals.ts.fix`, `deals.ts.new`, `deals.ts.old`, `deals.ts.tmp`, `dealController.ts.backup`, `censusController.ts.bak`, `index.ts.bak`). Recommend a separate `chore/` PR to clean these up; not blocking, but they're cluttering the repo.

---

## 15. Glossary (plain language)

- **Events store** — Technical name for the substrate. A typed, append-only event log. MongoDB collections per event type.
- **Substrate** — Strategic / external name for the events store. Used in pitches and the moat narrative. Internally we say "events store."
- **Agent** — A reasoning component that wraps tool calls and writes events. Has an LLM at its core.
- **Tool** — A deterministic function (no LLM) that an agent can call. Has typed input + output. May or may not write events depending on whether it changes state.
- **Orchestrator** — The component that receives chat input, classifies intent, routes to the right agent, and manages conversation memory.
- **MCP** — Model Context Protocol (Anthropic). The standard we expose tools through.
- **Calibration check** — Eval surface comparing the new deal-scoring agent against the existing `investmentDecisionEngine.ts` on a regression set. Drift on this is the highest-priority quality signal.
- **Activation moment** — The first interaction in chat. Required to produce a visible substrate write — otherwise the user has leaked through onboarding without seeding the moat.
- **Override-as-signal** — When a user disagrees with the engine's assumptions, that disagreement is the highest-fidelity training data. Captured via OverrideEvent.
- **Strangler-fig** — Migration pattern where the new system grows alongside the old one and gradually replaces it; the old one is never explicitly cut over in a big-bang.

---

## 16. Companion docs index

| Doc | Status | Owns |
|---|---|---|
| [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md) | Pending | Event taxonomy, schemas, repository discipline, indexing, query patterns |
| [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md) | Pending | Orchestrator implementation, agent specs, tool definitions, prompt structure, A2A / MCP edges |
| [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md) | Pending | Golden-set construction, calibration check methodology, CI gating, drift detection |
| [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md) | Pending | Per-tier per-query budgets, caching strategy, cost-cap enforcement, model-tier routing detail |
| [PRODUCT_2.0_FRONTEND.md](PRODUCT_2.0_FRONTEND.md) | Pending | Chat-native overlay UX, inline structured controls, mobile patterns (voice / streaming / offline+sync), strangler-fig integration |

---

## 17. Changelog

- **2026-05-10 (v1):** Initial draft. Backend decisions locked from architect-design conversation: MongoDB events store, custom orchestrator, enrichment as tool not agent, MCP first, hybrid conversation memory, open-input cold-start surface. Companion docs deferred to follow-up PRs.
- **2026-05-10 (v1.1):** Added §1.5 — Non-negotiable: AI never produces the scoring decision. Captures the deterministic-engine principle (auditability + calibration moat + user protection + compliance) and makes explicit that personas flow into the algorithmic core as deterministic configuration, not AI input. Paired with [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md) DecisionEvent shape correction.
- **2026-05-10 (v1.2):** Added §5.5 (Wave 2 preview: portfolio-agent + pipeline-agent + market-data agent) and §11.5 (Existing features strangler-fig coverage: untouched in wave 1, substrate-instrumented in wave 1.5, agent-wrapped in wave 2). Paired with new event types in [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md) §3.10 (PortfolioEvent) and §3.11 (PipelineEvent), and open question #6 in [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md) (B2B portfolio variant).
