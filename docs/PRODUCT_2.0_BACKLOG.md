# REanalyzr 2.0 — Backlog

**Document type:** Decomposition output per thesis §0/§14
**Authored:** 2026-05-11 (Marcus Chen with Architect framing)
**Status:** Draft 1
**Owns:** Workstreams → epics → stories, sizing, dependencies, critical path, scoping decisions

---

## 0. How to read this document

This is **the decomposition** — the bridge between architecture (decided, see [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md)) and execution (next artifact: [PRODUCT_2.0_FIRST_2_WEEKS.md](PRODUCT_2.0_FIRST_2_WEEKS.md)).

**Audience:**
- **Founder (Parth)** — read end-to-end for the full work landscape; review estimates; approve critical-path commitments
- **Engineer / QE / Architect personas** — read the relevant workstream(s); implement stories within them; surface judgment disagreements explicitly
- **Marcus Chen** — own this doc; update it as scope evolves

**What this doc does NOT do:**
- Re-debate architecture decisions (those live in the architecture docs)
- Promise calendar dates (founder throughput is variable per thesis §7)
- Lock specific personas to specific stories (personas float to where their expertise is most needed)
- Cover wave 2 stories in detail (sketch only — full decomposition at wave 1 exit)

---

## 1. Estimation conventions

Estimates are in **story-days of Claude-Code implementation time** + **founder review hours**. Not calendar time.

| Size | Claude-Code days | Founder review | Story signal |
|---|---|---|---|
| **XS** | 0.5 - 1 day | 0.5 hour | Clear spec; deterministic outcome; no architectural decisions |
| **S** | 1 - 2 days | 1 hour | Small surface; well-bounded; clear exit |
| **M** | 3 - 5 days | 2 - 3 hours | Multi-file change; some decisions surface; eval coverage needed |
| **L** | 5 - 10 days | 4 - 6 hours | Cross-cutting; multiple decisions; usually a candidate to split |
| **XL** | 10+ days | 8+ hours | Don't ship at this size — split. Listed only for visibility into a larger workstream. |

**Story-day = an uninterrupted day of Claude-Code working on a clearly-specified unit.** Real wall-clock time may be longer (specification iterations, blocked-on-decision waits, founder review cycles). Per thesis §7: *a well-specified 4-day Claude Code run is preferable to a vague 1-day run that needs 3 rework cycles.*

Founder review hours are the **specification + review bandwidth** the founder must provide. This is the actual scarce resource. ~10-15 founder hours/week sustainable per thesis §7.

**Calendar projection** (informational, not commitment):
- Wave 1 totals to ~80-110 story-days of Claude-Code work
- Founder review at sustained ~12 hours/week → ~14 weeks calendar (matches thesis §6 wave 1 sequencing)
- Wave 1.5 (~15-20 story-days parallel) + Wave 2 sketch — see §7-§8

---

## 2. Workstream map

Mapping from thesis §8 candidate epics to wave assignment:

| Workstream | Wave | Status |
|---|---|---|
| **W1 — Substrate (events store)** | Wave 1 | Decomposed below |
| **W2 — Orchestrator** | Wave 1 | Decomposed below |
| **W3 — Wave 1 agent mesh (deal-scoring + Q&A)** | Wave 1 | Decomposed below |
| **W4 — Tool registry + tool implementations** | Wave 1 | Decomposed below |
| **W5 — Adversarial critic agent** | Wave 1 | Decomposed below |
| **W6 — Chat-native frontend (/app + inline structured controls)** | Wave 1 | Decomposed below |
| **W7 — LandingPage hero chat embed + calculator-route deprecation** | Wave 1 | Decomposed below |
| **W8 — Eval scaffolding (calibration + golden sets + CI gating)** | Wave 1 | Decomposed below |
| **W9 — Cost economics (CostEvent + model-tier routing + caching + caps)** | Wave 1 | Decomposed below |
| **W10 — Founder-historical backfill (substrate seeding)** | Wave 1 | Decomposed below |
| **W11 — MCP-compatible edges (minimum surface)** | Wave 1 | Decomposed below |
| **W12 — Portfolio + Pipeline substrate instrumentation** | Wave 1.5 | Decomposed below |
| **W13 — Portfolio model B2B variant flag** | Wave 1.5 | Decomposed below |
| **W14 — SFR + MF wizard substrate instrumentation** | Wave 1.5 | Decomposed below |
| **W15 — portfolio-agent** | Wave 2 | Sketched (§7) |
| **W16 — pipeline-agent** | Wave 2 | Sketched (§7) |
| **W17 — market-data agent** | Wave 2 | Sketched (§7) |
| **W18 — B2B output surfaces (PDF, audit trail, multi-deal, multi-user)** | Wave 2 | Sketched (§7) |
| **W19 — OutcomeEvent capture pipeline** | Wave 2/3 | Deferred (schema-ready in wave 1) |
| **W20 — Data licensing review** | Admin (not engineering) | Founder + advisor; §9 |
| **W21 — Raise enablement** | Admin (not engineering) | Founder; §9 |
| **W22 — Substrate observability dashboards** | Wave 1 minimum + Wave 2 | Decomposed below (minimum) |
| **W23 — Track 3 content production support** | Wave 2 | Sketched (§7) |

---

## 3. Wave 1 — full decomposition

### W1 — Substrate (events store)

**Goal:** A typed, append-only events store on MongoDB capturing the wave 1 event types per [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md). All wave 1 work depends on this — it's the foundation.

**Why this first:** every other wave 1 workstream writes to or reads from substrate. Cannot ship agents without it.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W1-S1 | Mongoose discriminator + base schema for events collection | S | `EventEnvelope` shape stable; base schema + pre-hooks rejecting update/delete |
| W1-S2 | Wave 1 event payload schemas (Zod + Mongoose discriminators) — Profile, Analysis, Decision, Override, Critique, Conversation, AuditTrail, Watchlist, Outcome, Portfolio, Pipeline | M | All 11 event payload Zod schemas + Mongoose discriminators; per-type Zod parse-on-write |
| W1-S3 | `EventsRepository` write API (insert-only methods per event type) | S | Repository tested; no update/delete methods exist; correlation ID propagation |
| W1-S4 | `EventsRepository` read API (named query methods per common pattern) | M | Recipes from events-store doc §8 implemented + tested |
| W1-S5 | MongoDB `eventsAppendOnly` role provisioning + startup verification | S | DB user with insert-only privileges; app exits if role wrong |
| W1-S6 | Index creation + verification (per events-store doc §7) | S | All wave 1 indexes present; explain plans use IXSCAN for hot queries |
| W1-S7 | In-memory MongoDB test harness + unit tests | S | Repository tests run in CI; append-only enforcement test passes |
| W1-S8 | Integration test against real Atlas cluster — DB role enforcement, index utilization | S | Integration suite runs against test cluster nightly |

**Total: ~16-22 story-days. 6-9 founder review hours.**

**Dependencies:** None. Foundational.

**Risks:** Schema versioning discipline drift — engineer adds `Schema.Types.Mixed` field as a shortcut; needs architect/QE review on every PR touching event schemas.

---

### W2 — Orchestrator

**Goal:** Intent classifier + agent routing + conversation memory management per [PRODUCT_2.0_AGENT_MESH.md §2](PRODUCT_2.0_AGENT_MESH.md).

**Why this in early wave 1:** every agent invocation goes through orchestrator. Cannot ship chat surface without it.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W2-S1 | Orchestrator class skeleton + traceId propagation | S | New `traceId` per turn; passed to every agent + tool call |
| W2-S2 | Intent classifier (Haiku 4.5 + prompt cache + structured output) | M | All 11 intents classified with ≥85% accuracy on a 50-scenario eval set |
| W2-S3 | Routing table (intent → agent or tool-only path) | S | Each intent routes deterministically; fallback to Q&A on low-confidence |
| W2-S4 | Conversation memory model — per-session ephemeral cache + per-user events-store-backed load | M | Session start loads ProfileEvent + recent decisions/overrides; per-turn memory trimming when context budget hit |
| W2-S5 | Conversation summarization (Haiku 4.5 compaction of older turns) | S | Older turns compressed; cache boundary 3 invalidates predictably |
| W2-S6 | Streaming response (SSE + content blocks) | M | Text + structured outputs stream to client; cancellation handled cleanly |
| W2-S7 | Error handling — typed errors, retry semantics, fallback responses | S | Three error categories implemented; no raw exceptions reach client |
| W2-S8 | ConversationEvent emission per turn | XS | Every turn writes ConversationEvent with full tokenUsage and traceability |

**Total: ~14-20 story-days. 6-8 founder review hours.**

**Dependencies:** W1 (events store for ConversationEvent + memory loads).

**Risks:** Conversation memory load latency at session start — if recall_user_context becomes slow under load, switch to async load with progressive context fill.

---

### W3 — Wave 1 agent mesh (deal-scoring + Q&A)

**Goal:** Two of the three wave-1 agents implemented per [PRODUCT_2.0_AGENT_MESH.md §4](PRODUCT_2.0_AGENT_MESH.md). Adversarial critic is W5 (separate epic).

**Why now:** the deal-scoring agent is THE wedge. Q&A is the second-most-used agent. Both ship before adversarial critic because adversarial critic depends on existing decisions to critique.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W3-S1 | Deal-scoring agent — Anthropic SDK + Sonnet 4.6 + tool wiring | M | Agent calls enrich → compute → score in correct order; passes userContext through |
| W3-S2 | Deal-scoring agent — system prompt + persona modifiers + cache-boundary structure | M | Cache hit rate ≥85% on golden set; persona-driven tone validated |
| W3-S3 | Deal-scoring agent — verdict card emission as structured output (replaces verdict-text framing) | S | DealScoreCard component data emitted; no verdict-language framing in agent text |
| W3-S4 | Q&A agent — lift `aiEnhancedMessagingService` content templates (reasoning, actionPlan, capitalStrategy, timeline, alternatives, goal-based reasoning) | L | All 6 content types port over; output sanitization (directive-language) preserved verbatim |
| W3-S5 | Q&A agent — replace OpenAI SDK with Anthropic SDK; migrate string-template prompts to typed tool definitions | L | All Q&A calls go through Anthropic; structured outputs validate against schemas; behavioral parity vs. existing |
| W3-S6 | Q&A agent — persona-aware tone modifiers (experienceLevel, investorType, primaryGoal) | M | Tone shifts validated on golden set across 4 persona variants |
| W3-S7 | Q&A agent — directive-language sanitization regex post-processing | XS | Existing regex patterns ported verbatim; zero-violation gate in CI |
| W3-S8 | Both agents — ConversationEvent emission via orchestrator | XS | Every agent invocation emits ConversationEvent with relatedEventIds populated |

**Total: ~22-30 story-days. 10-14 founder review hours.**

**Dependencies:** W1 (events store), W2 (orchestrator), W4 (tools).

**Risks:** Q&A lift is the largest unknown — `aiEnhancedMessagingService` is 999 lines of prompt-template code with embedded calculations. Migration to typed tool-use is a real refactor, not a wrapper. Surface to Founder if scope exceeds 12 story-days.

---

### W4 — Tool registry + tool implementations

**Goal:** All 9 wave-1 tools per [PRODUCT_2.0_AGENT_MESH.md §3.2](PRODUCT_2.0_AGENT_MESH.md), each implementing the `Tool<TInput, TOutput>` contract.

**Why now:** agents cannot ship without tools. Most tools wrap existing services (cheap); two require new logic (profile_extraction, score_deal validation).

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W4-S1 | Tool contract interface + registry + Zod validation + MCP adapter glue | S | `Tool<T,U>` interface stable; toolRegistry exports all 9 |
| W4-S2 | `enrich_property` — wrap `MarketIntelligenceService` | S | Address-in → MarketDataResponse-out; existing cache discipline preserved |
| W4-S3 | `compute_analysis` — wrap `SFRAnalyzer` / `MultiFamilyAnalyzer` with propertyType routing | S | Single tool routes to correct analyzer; all 60+ metrics returned |
| W4-S4 | `score_deal` — wrap `BaseDecisionEngine` (SFR + MF subclasses) and emit AnalysisEvent + DecisionEvent with corrected payload shape | M | DecisionEvent has dealQuality + criticalFlags + userContext (no verdict field); score capping on critical flags implemented per events-store §3.3.1 |
| W4-S5 | `apply_override` — modify assumptions, re-run scoring, emit OverrideEvent + new Analysis/DecisionEvents | M | Override roundtrip works; substrate writes correct events with cross-references |
| W4-S6 | `profile_extraction` — Haiku 4.5 structured extraction of ProfilePayload from unstructured input | S | 5 profile fields extracted with ≥85% accuracy on 30-scenario golden set |
| W4-S7 | `recall_user_context` — query repository for profile + recent decisions + overrides | XS | Returns typed UserContext; <100ms latency target |
| W4-S8 | `save_to_watchlist` — emit WatchlistEvent | XS | Returns confirmation; substrate has WatchlistEvent |
| W4-S9 | `render_audit_trail` — events-store aggregation query per events-store §8.4 | S | Returns AuditTrailBundle; covers all required event types |
| W4-S10 | `export_audit_pdf` — render audit trail to PDF (lift existing `pdfService` if applicable, else fresh) | M | PDF generated with correct content; emits AuditTrailEvent |

**Total: ~16-22 story-days. 8-12 founder review hours.**

**Dependencies:** W1 (events store), existing engine + analyzer code (not modified).

**Risks:** `score_deal` is the load-bearing tool — calibration check (W8) gates this. Bug in W4-S4 = calibration drift in CI. Architect reviews mandatory.

---

### W5 — Adversarial critic agent

**Goal:** Optimistic flipper + skeptical CPA personas per [PRODUCT_2.0_AGENT_MESH.md §4.3](PRODUCT_2.0_AGENT_MESH.md). Opus 4.7. Sparse invocation.

**Why now (and not earlier):** depends on W3 + W4 (must have decisions to critique). Lower priority than chat surface — can ship after wave 1 wedge is functional.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W5-S1 | Adversarial critic agent class — Opus 4.7 + persona slot + tool wiring | M | Agent accepts persona name; calls render_audit_trail; produces typed CritiqueOutput |
| W5-S2 | Optimistic flipper persona prompt + few-shot examples | S | Persona-consistency validated on 15-scenario golden set; biases toward optimism on rent growth + appreciation + vacancy recovery |
| W5-S3 | Skeptical CPA persona prompt + few-shot examples | S | Persona-consistency validated; biases toward conservatism on hidden costs + tax + reserves |
| W5-S4 | Auto-invocation trigger on BUY-band decisions (dealQuality ≥ 80) | S | Triggers wired into orchestrator after score_deal returns BUY-band |
| W5-S5 | Manual invocation path (intent: `request_critique`) | XS | User-initiated critique runs via orchestrator routing |
| W5-S6 | CritiqueEvent emission with full payload (per events-store §3.5) | XS | Substrate has CritiqueEvent with severityScore + divergenceReasons + alternativeAssumptions |
| W5-S7 | 4-week kill criterion instrumentation — weekly aggregation report (per evals §5) | S | Weekly report generated; weeklyDisagreementRate + signalRatio computed per persona |

**Total: ~10-14 story-days. 4-6 founder review hours.**

**Dependencies:** W1, W2, W3, W4.

**Risks:** Persona quality is fuzzy. LLM-as-judge calibration on persona output (per evals §5.4) requires founder-validated sample reviews in weeks 7-10. Plan for that founder time.

---

### W6 — Chat-native frontend (/app + inline structured controls)

**Goal:** The `/app` route + 9 inline structured control components per [PRODUCT_2.0_FRONTEND.md](PRODUCT_2.0_FRONTEND.md).

**Why now:** the user-facing surface for everything wave 1 produces. Ship in parallel with backend agents once W3 is shipping.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W6-S1 | `/app` route + basic chat thread layout (desktop + mobile responsive) | M | Open input renders; messages stream from agent backend; mobile single-column |
| W6-S2 | Streaming SSE client + content block dispatcher | M | Text streams token-by-token; structured_output blocks render via componentType dispatcher |
| W6-S3 | `<DealScoreCard>` component (most-used; SFR + MF metric variants) | M | Renders score + label + color + key metrics; collapses on mobile; conditional MF metrics |
| W6-S4 | `<AssumptionsPanel>` — collapsible, every assumption visible | S | Tappable; renders all scoring assumptions; cross-links to override flow |
| W6-S5 | `<OverrideSlider>` — inline slider/input for override | S | Slider triggers apply_override tool; new DealScoreCard renders post-override |
| W6-S6 | `<SaveButton>` / `<ExportButton>` / `<AuditTrailPanel>` / `<CritiquePanel>` / `<PropertyPreview>` / `<ErrorBanner>` | M | All 6 secondary components render correctly; props validated against Zod schemas |
| W6-S7 | Cold-start UX — greeting + 3 examples + "Prefer a form?" wizard link + returning-user thread restore | S | Anonymous greeting renders; returning user sees most-recent property prompt |
| W6-S8 | Voice input (native STT) — mic button + transcription → input field | M | Apple Speech / Android SpeechRecognizer wired; transcription editable before send |
| W6-S9 | Cancellation UX — stop button during generation | XS | Single-tap cancel; partial content preserved; server-side abort |
| W6-S10 | B2B-routed greeting variant (?ref=demo, ?lender=name) | XS | URL parameter sets investorType + institutionContext on first ProfileEvent |
| W6-S11 | Offline + sync — IndexedDB caching + queue for offline writes + conflict resolution UI | L | Offline browsing works; queued writes sync on reconnect; conflict UI surfaces dual overrides |
| W6-S12 | Accessibility audit + WCAG 2.1 AA compliance | M | axe-core passes; screen-reader tested; keyboard navigation verified |

**Total: ~25-35 story-days. 12-18 founder review hours.**

**Dependencies:** W1, W2, W3, W4 (backend must be at least partially shipping).

**Risks:** Offline + sync (W6-S11) is the largest single story — candidate to defer or simplify if wave 1 timeline tightens. Conflict resolution UI in particular could be cut to "warn + reload" if needed.

---

### W7 — LandingPage hero chat embed + calculator deprecation

**Goal:** Per [PRODUCT_2.0_FRONTEND.md §1, §7.5](PRODUCT_2.0_FRONTEND.md). Replace `<UniversalCalculator />` embed in LandingPage with hero chat input; remove standalone `/calculator/*` routes.

**Why now:** front-of-funnel conversion lever. Ships once `/app` route is operational so the hero redirect works.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W7-S1 | `<HeroChatEmbed>` component — input + voice button + minimum-5-char gate | S | Component renders; 5-char gate enforced; voice optional |
| W7-S2 | Replace `<UniversalCalculator />` in LandingPage.tsx (line 450) with `<HeroChatEmbed>` | XS | Single-file change; positioning copy unchanged; cascades to /, /brrrr-calculator, /cap-rate-calculator |
| W7-S3 | Replace `<UniversalCalculator />` in RentalPropertyCalculatorPage.tsx with `<HeroChatEmbed>` | XS | Same pattern; surface consistency across all SEO landing pages |
| W7-S4 | sessionStorage handoff — hero submits → store input + sessionId → redirect to /app?session=<id> | S | /app reads sessionStorage on mount; kicks off chat agent's first turn without double-render |
| W7-S5 | Remove `/calculator`, `/calculator/brrrr`, `/calculator/buy-hold` routes from App.tsx | XS | Routes removed; 404 on direct navigation; no regression on /brrrr-calculator |
| W7-S6 | First-touch cost discipline — per-IP rate limit + anonymous session cap ($0.10) | S | Anti-abuse measures wired; CostEvent records anonymous-session attribution |

**Total: ~3-5 story-days. 2-3 founder review hours.**

**Dependencies:** W1 (CostEvent), W2 (orchestrator), W6 (`/app` route shipping).

**Risks:** Marketing copy preservation discipline — Architect reviews any PR touching LandingPage.tsx for inadvertent copy changes.

---

### W8 — Eval scaffolding

**Goal:** Calibration check + golden sets per agent + CI gating per [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md).

**Why now:** ships in parallel with W3 + W4. Calibration check is THE gate that catches engine-wrapper bugs in `score_deal`. Cannot ship `score_deal` to production without it.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W8-S1 | Eval harness — TypeScript runner + JSON fixture loader + report formatter | S | `npm run eval:*` commands work locally |
| W8-S2 | Calibration check fixture set — synthesize ~50 initial fixtures across scoring tiers + critical flags + persona variants | M | 50 fixtures cover all bands + edge cases; runtime <60s |
| W8-S3 | Calibration check runner — run fixture inputs through existing engine direct + new agent pipeline; compare dealQuality + factor scores | S | Zero-tolerance comparison; failure report includes likely-cause heuristic |
| W8-S4 | Founder-historical backfill conversion to fixture set — pipe ~200-500 personal analyses into calibration set (depends on W10) | M | Backfill set merged with synthetic edge cases; CI runtime <5min |
| W8-S5 | Golden set scaffolding — 50 deal-scoring + 100 Q&A + 30 critic scenarios with behavioral rubrics | L | All 180 scenarios stored as fixtures; LLM-as-judge evaluator wired |
| W8-S6 | Schema validation eval — strict deterministic check for all structured outputs | XS | All wave 1 output schemas validated; runtime <10s |
| W8-S7 | Substrate write verification — per-tool + per-agent flow tests | S | Every tool that writes events tested; mock-LLM agent flow tests pass |
| W8-S8 | Directive-language sanitization eval — regex over Q&A golden set, zero-tolerance | XS | Existing patterns ported; CI gates on any violation |
| W8-S9 | Cost / latency regression check — aggregated from ConversationEvent | S | Per-PR cost report posted; thresholds at ≤5% warning-free, 5-15% requires acknowledgment, >15% blocks |
| W8-S10 | CI workflow — GitHub Actions YAML with conditional jobs (per evals §9.1) | M | All eval surfaces gated; composite PR comment template implemented |
| W8-S11 | Adversarial critic meta-eval — weekly aggregation report per evals §5.4 | S | Per-persona signal ratio + meaningful-disagreement-rate + sample-critique selection |

**Total: ~20-28 story-days. 10-14 founder review hours.**

**Dependencies:** W1, W3, W4, W10 (for backfill-driven fixture set).

**Risks:** Calibration zero-tolerance is the load-bearing gate. If we accidentally allow tolerance to slip (because real fixtures show drift), we've lost the deterministic-scoring non-negotiable. Architect reviews W8-S3 and the threshold config every change.

---

### W9 — Cost economics (CostEvent + model-tier routing + caching + caps)

**Goal:** Cost tracking, model-tier discipline, caching, cost-cap enforcement per [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md).

**Why now:** ship in parallel with agents. Once any LLM call is in production, we need cost tracking and caps. Critical to ship before public traffic from hero embed (W7).

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W9-S1 | `CostEvent` collection schema + repository methods (separate from substrate per cost doc §7.4) | S | CostEvent insert-only; per-trace correlation |
| W9-S2 | Token usage tracking per Anthropic SDK call — emit CostEvent at orchestrator level | S | Every LLM call produces CostEvent with model + tokens + cents |
| W9-S3 | External API cost tracking (RentCast) — emit CostEvent for enrichment calls | XS | RentCast calls recorded with provider + service + cents |
| W9-S4 | Model-tier routing — per-agent model selection per cost doc §3 | XS | Constants for each agent's model; centralized config |
| W9-S5 | Prompt cache boundary discipline — cache boundary definition per agent per agent-mesh §5.2 | S | Cache hit rate ≥85% target on golden set after warm-up |
| W9-S6 | Semantic cache for Q&A — embedding + similarity lookup + cached-answer reuse with optional Haiku personalization pass | M | Cache hit rate ≥30% on Q&A golden set after warm-up |
| W9-S7 | Tool-result cache — RentCast/FRED TTL extension (24h / 7d respectively) | XS | TTL config updated; existing cache discipline unchanged |
| W9-S8 | Per-query absolute cost cap ($1.00) with stream cancellation on cap hit | S | Mid-stream cancellation works; capHit emitted on CostEvent |
| W9-S9 | Per-user monthly cost cap (tier-dependent) | S | Free tier blocks at cap; paid tier warns; ops alert on B2B |
| W9-S10 | Anonymous-session cost cap for hero-embed first-touch ($0.10) | XS | Anonymous traffic capped; warning surfaces with signup CTA |
| W9-S11 | Cost monitoring dashboards — per-user, per-org, per-agent, per-model | S | Dashboards refresh every 5min; anomaly alerts wired |

**Total: ~12-18 story-days. 6-9 founder review hours.**

**Dependencies:** W1, W2.

**Risks:** Semantic cache (W9-S6) requires choosing an embedding provider. Default Voyage AI; revisit if Anthropic embeddings ship by then. Decision is deferred to implementation; not blocking.

---

### W10 — Founder-historical backfill (substrate seeding)

**Goal:** Founder runs ~2 years of personal analyses through the new pipeline per thesis §5.5. Produces both calibration anchor and initial substrate weight.

**Why now:** unblocks W8-S4 (calibration regression set) and gives the substrate real content before any external traffic. Run in parallel with W1-W4 once tools work.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W10-S1 | Backfill harness — batch runner for property data → tool:score_deal → events store | S | Harness ingests historical data and produces AnalysisEvents + DecisionEvents |
| W10-S2 | Historical property data export — extract from existing Deal collection where applicable; supplement with founder manual input | S | ~200-500 properties in input format; verified |
| W10-S3 | Execute backfill run + verification | S | Substrate has 200+ AnalysisEvents and DecisionEvents from real historical data; verdict distribution looks healthy |
| W10-S4 | Compare backfill outputs to original engine outputs — flag any divergence (this IS the seed of calibration check) | S | Zero divergence on basic cases; divergences investigated and labeled (bug vs. intentional engine change) |

**Total: ~5-8 story-days. 3-5 founder review hours.**

**Dependencies:** W1, W4 (score_deal must work).

**Risks:** Founder time investment in property data preparation. Per thesis §7, hours are variable; W10-S2 may slip.

---

### W11 — MCP-compatible edges (minimum surface)

**Goal:** MCP server exposing the toolRegistry per [PRODUCT_2.0_AGENT_MESH.md §6](PRODUCT_2.0_AGENT_MESH.md). Wave 1 minimum: own-platform users only; no marketplace listing yet.

**Why now:** the architecture commits to MCP-first edges. Ship the minimum surface in wave 1 so the architecture isn't theoretical. Marketplace listings + external clients are wave 2+.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W11-S1 | MCP server setup — Anthropic MCP SDK + wrap toolRegistry | M | All 9 tools exposed as MCP tools; schemas auto-derived from Zod |
| W11-S2 | API key authentication — link MCP API keys to user accounts | S | API key auth flow works; userId + institutionId derived from key |
| W11-S3 | MCP server cost-cap integration — per-API-key cost caps tied to user tier | S | API key calls respect tier caps; CostEvent emitted with API-key attribution |
| W11-S4 | Internal documentation for MCP integration — for B2B prospects in pilot conversations | XS | Internal-only doc; not public marketing yet |

**Total: ~5-8 story-days. 2-4 founder review hours.**

**Dependencies:** W4 (toolRegistry), W9 (cost-cap enforcement).

**Risks:** MCP SDK maturity in May 2026. If Anthropic's MCP server SDK has rough edges, may need workarounds. Architect reviews to set expectations.

---

### W22 — Substrate observability dashboards (wave 1 minimum)

**Goal:** Internal dashboards over substrate event data — substrate weight, persona distribution, override frequency, cache hit rates, cost per tier. Per thesis §8 and Track 3 dual-purpose dashboard goals.

**Why now:** founder needs to see the substrate accumulating from week 1. Cheap to build the minimum surface; high signal for ops + Track 3 content.

**Stories (wave 1 minimum only — wave 2 adds depth):**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W22-S1 | Admin route `/admin/observability` + access control | XS | Admin-only; basic page renders |
| W22-S2 | Substrate weight chart — total analyses, total overrides, total decisions over time | S | Time-series charts render; updates daily |
| W22-S3 | Override frequency by field — which fields users override most | S | Top-N chart by `payload.fieldPath` aggregation; informs calibration decisions |
| W22-S4 | Cost per tier rollup — daily/monthly cost per free / paid / B2B | S | Tier breakdown chart; alerts on tier crossings |
| W22-S5 | Adversarial critic signal dashboard — per-persona signal ratio over time | S | Feeds the 4-week kill criterion review |

**Total: ~5-7 story-days. 3-4 founder review hours.**

**Dependencies:** W1, W8 (CostEvent), W5 (CritiqueEvent).

**Risks:** Scope creep — dashboards are infinitely expandable. Architect reviews to keep wave 1 to the minimum useful set.

---

## 4. Wave 1 totals

| Workstream | Story-days | Review hours |
|---|---|---|
| W1 — Substrate | 16-22 | 6-9 |
| W2 — Orchestrator | 14-20 | 6-8 |
| W3 — Wave 1 agent mesh (deal-scoring + Q&A) | 22-30 | 10-14 |
| W4 — Tool registry + tools | 16-22 | 8-12 |
| W5 — Adversarial critic agent | 10-14 | 4-6 |
| W6 — Chat-native frontend | 25-35 | 12-18 |
| W7 — Hero embed + calculator deprecation | 3-5 | 2-3 |
| W8 — Eval scaffolding | 20-28 | 10-14 |
| W9 — Cost economics | 12-18 | 6-9 |
| W10 — Founder-historical backfill | 5-8 | 3-5 |
| W11 — MCP edges (minimum) | 5-8 | 2-4 |
| W22 — Observability (minimum) | 5-7 | 3-4 |
| **Wave 1 total** | **~155-220 story-days** | **~70-105 founder review hours** |

**Calendar projection (informational):**
- At 12-15 founder review hours/week sustained (per thesis §7), ~6-9 weeks of pure review bandwidth
- At parallel Claude-Code execution across workstreams, 14-18 calendar weeks for wave 1 is realistic
- Matches thesis §6 wave 1 sequencing (weeks 1-14)
- Inflation factor: 20-30% for re-spec / rework cycles, especially on W3 (Q&A lift) and W6 (frontend)

---

## 5. Wave 1.5 — full decomposition

### W12 — Portfolio + Pipeline substrate instrumentation

**Goal:** Per [PRODUCT_2.0_ARCHITECTURE.md §11.5.1](PRODUCT_2.0_ARCHITECTURE.md). Existing services emit PortfolioEvent + PipelineEvent without changing their behavior.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W12-S1 | PortfolioEvent emission from portfolioService (create / property_added / property_removed / goal_updated / analytics_recalculated / ai_insight_generated / recommendation_viewed) | S | All 7 subtypes emitted at correct points; no behavior change |
| W12-S2 | PipelineEvent emission from pipelineController + services (deal_added / stage_changed / next_action_set / pipeline_deal_closed / pipeline_note_added) | S | All 5 subtypes emitted; substrate has cross-deal pipeline data |
| W12-S3 | Verification — backfill scan of last 30 days portfolio + pipeline activity (where possible from existing logs/data) | XS | Backfill produces realistic event distribution; verified against current production |

**Total: ~3-5 story-days. 1-2 founder review hours.**

---

### W13 — Portfolio model B2B variant flag

**Goal:** Per [PRODUCT_2.0_ARCHITECTURE.md §5.5](PRODUCT_2.0_ARCHITECTURE.md). Add `portfolioType: 'retail' | 'b2b_loan' | 'b2b_advisory'` field to Portfolio model.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W13-S1 | Portfolio model field addition + default `'retail'` migration | XS | Field exists; all existing records get `'retail'` default; non-breaking |
| W13-S2 | TypeScript types + API endpoint pass-through (no UI change in wave 1.5) | XS | Type-safe field; APIs accept and persist it |

**Total: ~1 story-day. 0.5 founder review hours.**

---

### W14 — SFR + MF wizard substrate instrumentation

**Goal:** Per [PRODUCT_2.0_ARCHITECTURE.md §11.5.1](PRODUCT_2.0_ARCHITECTURE.md). Wizard completion handlers emit same AnalysisEvent + DecisionEvent shape as `tool:score_deal`.

**Stories:**

| ID | Story | Size | Exit criterion |
|---|---|---|---|
| W14-S1 | SFR wizard backend — emit AnalysisEvent + DecisionEvent on analysis completion | S | Cross-surface substrate consistency; wizard analyses queryable identically to chat analyses |
| W14-S2 | MF wizard backend — same pattern | S | MF wizard substrate writes verified |

**Total: ~2-3 story-days. 1 founder review hour.**

---

### Wave 1.5 totals

| Workstream | Story-days | Review hours |
|---|---|---|
| W12 — Portfolio + Pipeline instrumentation | 3-5 | 1-2 |
| W13 — portfolioType field migration | 1 | 0.5 |
| W14 — SFR + MF wizard instrumentation | 2-3 | 1 |
| **Wave 1.5 total** | **~6-9 story-days** | **~3-4 founder review hours** |

**Parallelism:** all of wave 1.5 runs in parallel with wave 1 tail-end. Slot into weeks 10-14 alongside wave 1 polish work.

---

## 6. Wave 2 — sketched (full decomposition deferred to wave 1 exit)

The following workstreams are real and committed (per architecture §5.5, §11.5.3) but **stories are deferred to a separate decomposition pass at wave 1 exit**. Reason: 4 months of wave 1 execution will produce learnings (substrate weight, user behavior, cost reality) that should inform wave 2 story-level decomposition.

| Workstream | Rough size | Notes |
|---|---|---|
| **W15 — portfolio-agent** | ~15-25 story-days | Wraps enhancedPortfolioAI + portfolioAnalyticsService. Cost-tier discipline added. New tools: query_portfolio, analyze_portfolio_fit. |
| **W16 — pipeline-agent** | ~10-15 story-days | Wraps pipeline services. New tools: list_pipeline_deals, update_pipeline_stage, query_pipeline_velocity. |
| **W17 — market-data agent** | ~15-25 story-days | Net-new — no existing lift. Cross-property + cross-market reasoning. New tools: query_market_trends, compare_markets. |
| **W18 — B2B output surfaces (PDF, audit trail UI, multi-deal batch, multi-user accounts)** | ~20-30 story-days | Audit trail UI shipped in wave 1 (W4-S9 + W6-S6); wave 2 deepens with batch processing + team-account scoping + white-label hooks. |
| **W23 — Track 3 content production support** | ~5-10 story-days | Extends W22 observability dashboards for LinkedIn-shareable findings. Designed dual-purpose. |
| **W11 extension — Marketplace listing decisions** | ~5-15 story-days | Per costs doc §12. Decisions deferred to when Anthropic MCP marketplace economics solidify. |
| **B2B portfolio variant UI** | ~10-15 story-days | Wave 2 portfolio-agent branches on portfolioType (field added in W13). UI shape designed when first B2B pilot solidifies. |

**Wave 2 estimated total: ~80-135 story-days.** Refined at wave 1 exit.

---

## 7. Dependency graph + critical path

```
W1 (Substrate)
  ↓
  ├──→ W2 (Orchestrator) ──→ W3 (Agents) ──→ W5 (Adversarial)
  │                                ↑
  │                                │
  ├──→ W4 (Tools) ─────────────────┤
  │      ↑                         │
  │      │                         │
  │      ├──→ W10 (Backfill) ──→ W8-S4 (Calibration anchor)
  │      │                         ↑
  │      │                         │
  │      └──→ W8 (Evals) ──────────┤
  │
  ├──→ W9 (Cost economics) ──→ W7 (Hero embed safe to ship)
  │      ↑
  │      └── W2 (Orchestrator)
  │
  ├──→ W11 (MCP edges) ──── (requires W4)
  │
  └──→ W22 (Observability minimum)
       ↑
       └── W1 + W8 + W5

W6 (Frontend) ── parallel with W3+W4; requires W2 partial; ships once /app routable
W7 (Hero embed) ── requires W6 (/app) + W9 (cost caps)
```

**Critical path (longest):**

1. **W1 (Substrate)** → must finish for everything else
2. **W4-S4 (`score_deal` tool)** → unblocks W3 agents, W10 backfill, W8 calibration check
3. **W3-S5 (Q&A SDK migration)** → largest single L story
4. **W6-S11 (Frontend offline + sync)** → second-largest single story; candidate to defer/simplify

**Critical-path optimization:**
- Land W1 fast (target weeks 1-3) to unblock everything
- W4-S4 next priority (week 3-4) — gates W3 and W8
- Parallel W3 + W6 + W9 + W8 from week 4 onward
- W5 + W7 + W10 + W11 land in the second half of wave 1
- W22 observability slots in continuously

---

## 8. Scoping decisions — what we explicitly did NOT include

Per thesis §9 non-negotiables and §4.2 released items, the following are explicitly NOT in this backlog:

| What | Why excluded |
|---|---|
| MF wizard frontend rebuild (Stories 2.1-2.6 from old backlog) | MF wizard at /mf-analysis exists; strangler-fig preserves it (W14 instruments backend only) |
| Big-bang frontend rewrite | Thesis §9 non-negotiable; W6 is overlay + W7 is single-component swap |
| Marketing homepage copy rewrite | Thesis §9 non-negotiable; W7 swaps interaction model only, copy untouched |
| Influencer outreach as workstream | Thesis §4.2 paused; not in 2026 unless substrate has weight worth pointing at |
| 6-blog SEO cluster as priority | Thesis §4.2 deprioritized; passive compounding only |
| Subscription billing infrastructure changes | Path A pricing already locked; Stripe integration target was June 1 2026 per memory but not a wave 1 backlog item |
| Per-analysis pricing implementation | Documented in cost doc §5.6 as wave 2 supplement; revisitable |
| External agent partnerships (Zillow-agent, etc.) | Thesis §5.4 not chased in 2026 |
| A2A / OpenAI Assistants edge adapters | Architecture §7; deferred until standards converge |
| RAG / vector search / embeddings (beyond semantic cache) | Wave 2/3 decision; cost doc §11 |
| Outcome capture pipeline activation | Wave 2+; events store §3.9 schema-ready |
| New marketing analytics / acquisition channels | Not in 2.0 scope |
| Mobile native app | PWA via W6 covers mobile; native deferred indefinitely |

If any of these resurface as priorities, that's a thesis-level conversation, not a backlog amendment.

---

## 9. Administrative workstreams (not engineering)

These are real wave 1 work but happen outside the Claude Code implementation flow.

| Workstream | Owner | Cadence | Status |
|---|---|---|---|
| **W20 — Data licensing review** (RentCast / FRED / Census ToS audit for substrate storage and re-display) | Founder + legal advisor | One-time, week 1-2 | Not started — needs founder action |
| **W21 — Raise enablement** (narrative artifacts, demo flow, founder-to-investor materials, investor target list per thesis §11) | Founder | Weeks 15-24 | Not started; not blocking wave 1 |
| **Track 2 — B2B validation** (Parimal demo, cold outreach, demo iteration, pilot conversations) | Founder | Continuous from week 1 | Per thesis §6 |
| **Track 3 — LinkedIn content** (technical posts on substrate, agents, evals, costs, what-didn't-work) | Founder | 2-3 posts/week | Per thesis §6 |

These workstreams **shape** the engineering backlog (B2B prospect feedback updates priorities; raise narrative may surface new technical demos) but are not engineering work.

---

## 10. Open backlog questions

Items needing decisions before specific stories can be sized firm.

1. **W3-S4/S5 Q&A migration scope.** The `aiEnhancedMessagingService` lift is L-sized. Worth a deep architect review of whether the existing service can be wrapped (smaller scope) vs. genuinely re-architected (longer but cleaner). Recommend: wrap first; refactor in wave 2 if behavioral parity is hard to maintain.

2. **W6-S11 offline + sync scope.** Largest single story in wave 1. Three sub-tiers possible:
   - Tier 1: Read-only offline (browse cached analyses); no offline writes. ~3 days.
   - Tier 2: Offline capture queue (write new properties); sync on reconnect without conflict resolution. ~7 days.
   - Tier 3: Full offline + sync + conflict resolution. ~12 days.
   Decision: which tier ships in wave 1? Bias toward tier 2.

3. **W8-S5 golden set sizing.** 180 scenarios is the doc target. Realistic to author all 180 with rubrics in wave 1, or ship with 100 and grow?

4. **W10 founder-historical backfill volume.** How many real analyses does founder have? Affects W8-S4 and W10-S2 sizing. If <50, supplement heavily with synthetic.

5. **W22 dashboards — engineering vs. low-code.** Build dashboards as React pages (W22 stories above) vs. wire substrate data into a low-code tool (Metabase, Retool). Bias: low-code for wave 1 minimum (faster); React when wave 2 needs designed-for-Track 3 polish.

6. **Wave 1 exit criteria.** What signals "wave 1 is done"? Bias: (a) all 12 wave 1 workstreams ship; (b) ≥80% calibration check pass rate; (c) ≥85% prompt cache hit rate; (d) substrate has ≥1000 real-or-backfilled events; (e) chat handles end-to-end flow on `/app` for a representative deal. Confirm with founder before locking.

---

## 11. Changelog

- **2026-05-11 (v1):** Initial decomposition. 12 wave 1 workstreams (~155-220 story-days, ~70-105 founder review hours), 3 wave 1.5 workstreams (~6-9 story-days), 7 wave 2 workstreams sketched. Critical path identified (W1 → W4-S4 → W3-S5). Scoping decisions enumerated (what's NOT included, with thesis-anchored rationale). 6 open backlog questions flagged for founder decision before specific stories solidify. Administrative workstreams (data licensing, raise enablement, Track 2/3) noted as non-engineering.
