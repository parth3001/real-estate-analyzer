# REanalyzr 2.0 — Events Store

**Document type:** Companion doc to [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) §3
**Authored:** 2026-05-10
**Status:** Draft 1
**Owns:** Event taxonomy, schemas, repository discipline, indexing, query patterns, schema evolution

---

## 0. Scope and non-scope

**This doc covers:**
- The 9 event types written by agents and tools in wave 1
- Mongoose schemas and TypeScript interfaces
- Repository layer enforcing append-only discipline
- MongoDB role configuration
- Indexing and query patterns
- Schema versioning and migration
- Testing strategy
- Storage growth and operational concerns

**Out of scope (lives elsewhere):**
- Cost / operational events (separate collection, see [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md) §4)
- Agent implementation that writes events (see [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md))
- Eval-related test events (see [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md))
- Long-term archival / cold storage strategy — deferred to when collection sizes warrant it

**Engine migration context this doc assumes:** The current production engine (`investmentDecisionEngine.ts`) is mid-migration from V2.1 verdict-based output to V3.0 Deal Quality scoring as the single source of truth. The legacy `verdict: 'BUY' | 'PASS' | 'NEGOTIATE' | 'CAUTION'` categorical output is treated as a deprecated artifact; only `dealQuality` (0-100) is persisted to substrate in 2.0. AI agents never produce or modify this score — see [PRODUCT_2.0_ARCHITECTURE.md §1.5](PRODUCT_2.0_ARCHITECTURE.md) for the deterministic-scoring non-negotiable. Persona context (riskTolerance, investorType, etc.) flows into the engine as deterministic configuration, not as AI input.

---

## 1. Design principles

These are the discipline that makes the events store a moat rather than a log dump. Each is enforceable at the schema, repository, or DB-role layer — not by convention alone.

1. **Append-only.** No `update` or `delete` operations on event collections. Application code never mutates a historical event. Enforced via (a) repository-layer methods that don't expose update/delete, (b) a dedicated MongoDB user with insert-only role on event collections.

2. **Typed payloads, no opaque blobs.** Every event type has a strict Mongoose schema. No `Schema.Types.Mixed`. No `data: { ...anything... }` fields. Adding a new field requires a new schema version, not a free-form addition.

3. **Versioned.** Every event has an `eventVersion` integer. Readers handle multiple versions. Schema evolution adds new versions; existing events are never mutated to match new shapes.

4. **Correlation IDs.** Every event has a `traceId` that links it to the user interaction or batch job that produced it. Debugging a single chat turn = filter by `traceId`. Auditing a decision = same.

5. **Actor identity captured.** Every event records `actorType` (`user` | `agent:<name>` | `tool:<name>` | `system`) and, for human actors, `userId` and (B2B) `institutionId`. "Who did this?" is always answerable.

6. **Self-contained snapshots for state-defining events.** AnalysisEvent and DecisionEvent embed the inputs and assumptions at the time of computation. We can replay any historical decision without joining against mutable user/portfolio data.

7. **References by ID, never by embed.** Events reference each other (e.g., DecisionEvent references AnalysisEvent) via stable IDs. No embedded copies that go stale.

8. **AI never produces the `dealQuality` score.** DecisionEvents are written by `tool:score_deal`, which wraps the deterministic engine. AI agents (Q&A, adversarial critic) write their own event types (ConversationEvent, CritiqueEvent) but never write DecisionEvents and never modify dealQuality. See [PRODUCT_2.0_ARCHITECTURE.md §1.5](PRODUCT_2.0_ARCHITECTURE.md) for the full rationale (auditability, calibration moat, user protection, compliance). This makes the score reproducible from inputs — a critical property for B2B audit trails and regulatory defensibility.

---

## 2. Common envelope (every event)

Every event in every collection has this base shape:

```ts
interface EventEnvelope {
  _id: ObjectId;            // MongoDB-generated, immutable
  traceId: string;          // UUID v4; correlates events from one interaction
  eventType: EventType;     // Discriminator (one of the 9 types in §3)
  eventVersion: number;     // Schema version (starts at 1 per event type)
  timestamp: Date;          // Server-side, immutable
  actorType: ActorType;     // 'user' | 'agent:<name>' | 'tool:<name>' | 'system'
  userId: ObjectId;         // The user this event is about
  institutionId?: ObjectId; // B2B: which lender / consultancy this user belongs to
  payload: TypedPayload;    // Per-event-type, strict schema
}

type EventType =
  | 'profile'
  | 'analysis'
  | 'decision'
  | 'override'
  | 'critique'
  | 'conversation'
  | 'audit_trail'
  | 'watchlist'
  | 'outcome';

type ActorType =
  | 'user'
  | `agent:${'deal_scoring' | 'qa' | 'adversarial_critic'}`
  | `tool:${string}`
  | 'system';
```

**Why these envelope fields are universal:**
- `traceId`: enables single-query debug across all event types
- `eventVersion`: future-proofs schema evolution (see §6)
- `actorType` + `userId` + `institutionId`: complete provenance for audit trail
- `timestamp`: server-side (don't trust client clocks); used for every "recent" query
- `payload` discriminated by `eventType`: TypeScript narrows the payload type at read time

---

## 3. Event taxonomy — full schemas

Each event type below has: purpose, when written, payload schema, who writes it, who reads it.

### 3.1 ProfileEvent

**Purpose:** Captures investor/underwriter profile state. Multiple ProfileEvents per user — profile evolves over time.

**When written:**
- User shares profile info in chat (extracted by Profile extraction tool)
- B2B intake form during onboarding
- User edits profile in settings

**Payload:**
```ts
interface ProfilePayload {
  investorType?: 'retail' | 'pro' | 'lender' | 'consultancy';
  portfolioSize?: 'none' | '1-3' | '4-10' | '11-30' | '30+';
  primaryMarkets?: string[];          // City or metro names
  role?: 'principal' | 'loan_officer' | 'underwriter' | 'analyst' | 'other';
  institutionContext?: {
    name?: string;                    // B2B-only
    institutionType?: 'credit_union' | 'community_bank' | 'hard_money' | 'consultancy';
    typicalDealVolume?: 'low' | 'medium' | 'high';
  };
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  primaryGoal?: 'cash_flow' | 'wealth_building' | 'diversification' | 'tax_optimization';
  extractedFromInput?: string;        // Original chat input that produced this event (audit)
  extractionConfidence?: number;      // 0-100, populated when extracted by Profile tool
}
```

**Writer:** Profile extraction tool (`tool:profile_extraction`), settings save handler (`agent:qa` when user edits in chat), B2B intake handler (`system`).

**Reader pattern:** Most recent ProfileEvent per `userId` = current profile state. Composite over all ProfileEvents = full history (useful for "how did this user's stated risk tolerance evolve").

**Lift vs. net-new (current code vs. 2.0):**

| Field | In current engine? | Status |
|---|---|---|
| `riskTolerance` | Yes — drives `getStrategyAwareWeights()` in [investmentDecisionEngine.ts:207](../backend/src/services/investment/investmentDecisionEngine.ts) | Clean lift |
| `investmentStrategy` (cashflow / appreciation / balanced) | Yes — extracted by `extractInvestmentStrategy()` (line 454) | Clean lift |
| `experienceLevel` (novice / intermediate / experienced / expert) | Yes — feeds `assessExecutionDifficulty()` | Clean lift |
| `investorType` (retail / pro / lender / consultancy) | No | **2.0 extension** — drives institutional-threshold variations |
| `primaryGoal` | Partial — present in GoalContext but not threaded through weight selection | **2.0 extension** — drives weight refinement |
| `institutionContext` (B2B) | No | **2.0 extension** — drives compliance defaults |

The persona dimensions are not invented in 2.0 — three of the five primary fields already drive deterministic adjustments in the current production engine. 2.0 extends the persona model with B2B-specific dimensions (investorType, institutionContext) and threads persona context more completely through the scoring weight and threshold selection. **At no point does AI produce or modify the score.** Persona context selects from a finite set of deterministic configurations.

---

### 3.2 AnalysisEvent

**Purpose:** Records the inputs + outputs of running an analysis. Heaviest payload. The self-contained snapshot that makes replays reproducible.

**When written:** Deal-scoring agent invokes `compute_analysis` tool. One AnalysisEvent per analysis run.

**Payload:**
```ts
interface AnalysisPayload {
  // Inputs (snapshot)
  propertyData: SFRData | MultiFamilyData;  // Existing typed interfaces from backend/src/types/
  marketData: MarketDataResponse;            // Snapshot of enrichment output
  assumptions: AnnualAssumptions;            // Snapshot of assumptions used

  // Outputs
  metrics: SFRMetrics | MultiFamilyMetrics;  // 60+ fields, existing types
  monthlyAnalysis: MonthlyAnalysisBreakdown;
  longTermAnalysis: LongTermAnalysisBreakdown;
  walkAwayPrice: number;

  // Provenance
  enrichmentSource: 'rentcast' | 'fred' | 'census' | 'fallback' | 'composite';
  enrichmentCacheHit: boolean;
  engineVersion: string;                     // e.g., 'v3.0' or 'v3.1' — tracks engine evolution
  computeTimeMs: number;
}
```

**Writer:** `tool:compute_analysis`, called by `agent:deal_scoring`.

**Reader pattern:**
- By `userId` + recent (list of user's recent analyses)
- By `dealId` (all analyses for a property over time — re-analyses after overrides)
- By `traceId` (analysis that belongs to a specific chat turn)
- Bulk aggregation across users for substrate weight metrics

**Size note:** ~5–20 KB per event (depending on property metrics + market data + projection years). At 5K events/active user, that's ~50–100 MB per user — manageable in MongoDB without sharding at projected wave 1 volumes.

---

### 3.3 DecisionEvent

**Purpose:** The Deal Quality score and structured breakdown produced by the deal-scoring agent. One per analysis run.

**When written:** Deal-scoring agent calls `score_deal` tool after `compute_analysis`. Always paired with an AnalysisEvent.

**Engine migration context:** The current production engine ([investmentDecisionEngine.ts](../backend/src/services/investment/investmentDecisionEngine.ts)) is mid-migration from V2.1 verdict-based output toward V3.0 Deal Quality scoring as the single source of truth. Code comments confirm this (line 2946: `V2.1 walk-away price calculation removed - V3.0 uses Deal Quality scoring`; line 3024: `V3.0 CHANGE: Walk-away price override DISABLED - Professional weighted scoring is the single source of truth`). The legacy `score` and `confidence` fields on the engine's `InvestmentDecision` interface are already marked `// LEGACY - deprecated` (lines 90-91). The 2.0 architecture **aligns with and completes** this migration: only `dealQuality` is persisted to substrate. Legacy verdict logic may continue to run internally during the lift but is not exposed downstream.

**Payload:**
```ts
interface DecisionPayload {
  analysisEventId: ObjectId;                 // Reference to corresponding AnalysisEvent
  dealId?: ObjectId;                         // Reference to Deal (if saved)

  // PRIMARY OUTPUT — V3.0 Deal Quality score, deterministic from formula
  dealQuality: number;                       // 0-100; from calculateProfessionalAssessment()

  // Derived presentation labels (for UI / B2B PDF / audit-trail consistency)
  qualityLabel: string;                      // "Above professional standards" |
                                             // "Meets professional standards" |
                                             // "Requires optimization" |
                                             // "Below professional standards"
  qualityColor: 'green' | 'yellow' | 'orange' | 'red';

  // Full breakdown — lifts existing ProfessionalAssessment structure verbatim
  professionalAssessment: ProfessionalAssessment;  // 7 factor scores + insights +
                                                   // debtAnalysis + taxOptimization
  marketPosition: MarketPosition;            // Walk-away + pricing context

  reasoningTrail: {
    primaryInsight: string;
    strategicRecommendations: string[];
    riskMitigation: string[];
    opportunityMaximization: string[];
    keyRisks: string[];
  };

  confidence: number;                        // 0-100
  scoringWeightsUsed: ScoringWeights;        // Snapshot of weights at time of decision
                                             // (conservative / moderate / aggressive)
  engineVersion: string;                     // e.g., 'v3.0', 'v3.1'

  // Critical-failure flags — SCORE-AFFECTING, not verdict-overriding.
  // When any of these trigger, dealQuality is capped per §3.3.1 below.
  criticalFlags?: {
    rentToPriceTooLow?:        { ratio: number; threshold: number };
    capRateFarBelowMarket?:    { capRate: number; marketMedian: number; tier: 1 | 2 | 3 };
    noPositiveCashFlowNoLeverage?: boolean;
    cashFlowBufferCritical?:   { actualBuffer: number; minimumRequired: number };
    dscrBelowOne?:             { dscrValue: number };  // MF / commercial-financing relevant
  };

  // Persona / strategy context at time of decision — drives deterministic
  // weight selection (see PRODUCT_2.0_ARCHITECTURE.md §1.5)
  userContext?: {
    riskTolerance?:      'conservative' | 'moderate' | 'aggressive';
    investmentStrategy?: 'cashflow' | 'appreciation' | 'balanced';
    experienceLevel?:    'novice' | 'intermediate' | 'experienced' | 'expert';
    investorType?:       'retail' | 'pro' | 'lender' | 'consultancy';  // 2.0 extension
    primaryGoal?:        'cash_flow' | 'wealth_building' | 'diversification' | 'tax_optimization';
  };

  // NOTE: 'verdict' field is intentionally NOT persisted.
  // The V3.0 dealQuality score is the single source of truth per the engine's
  // own migration direction. Categorical verdict output (BUY/PASS/NEGOTIATE/CAUTION)
  // is treated as a legacy artifact and is not exposed via substrate.
  // See PRODUCT_2.0_ARCHITECTURE.md §1.5 for the deterministic-scoring non-negotiable.
}
```

**Writer:** `tool:score_deal`, called by `agent:deal_scoring`.

**Reader pattern:**
- Most recent DecisionEvent per `dealId` = current score state
- All DecisionEvents per `dealId` = score evolution (useful for "this user's deals all dropped in score this quarter")
- By `userId` + `dealQuality` range (e.g., "all this user's high-quality decisions in last 90 days")
- By `userContext.riskTolerance` aggregated — calibration analysis ("conservative investors' decisions cluster at dealQuality 50-65, is the engine correctly conservative for them?")

#### 3.3.1 Critical-flag score capping

When a `criticalFlag` is present, the engine caps `dealQuality` so the score reflects the structural failure rather than only the weighted factor sum. This replaces the legacy "force PASS verdict" override pattern in the existing engine — the score itself becomes honest standalone, no matter who reads it (chat agent, MCP-exposed tool, audit-trail PDF, regulator).

| Critical flag | Cap | Rationale |
|---|---|---|
| `dscrBelowOne` (DSCR < 1.0) | 25 | Property cannot cover debt service. Auto-failure regardless of other metrics. |
| `cashFlowBufferCritical` (buffer < required minimum) | 35 | High risk of financial stress under expected expense variability. |
| `noPositiveCashFlowNoLeverage` (no path to positive cash flow with any reasonable leverage) | 30 | Property requires ongoing capital injection. Not a viable investment. |
| `rentToPriceTooLow` (ratio < 0.35%) | 30 | Income relative to price is insufficient for sustainable returns. |
| `capRateFarBelowMarket` (capRate < tier passThreshold) | 35 | Significantly underperforming market returns. |

Caps are floors on the affected dimension — the score takes `min(weightedScore, cap)`. Multiple flags triggering = take the strictest cap.

The cap thresholds are starting values that match the spirit of the existing engine's `generateVerdict` auto-PASS scenarios. They are tunable and should be validated against the calibration regression set during the lift.

---

### 3.4 OverrideEvent

**Purpose:** Captures user disagreement with engine. **Highest-signal event type for the moat.**

**When written:**
- User overrides an assumption in chat ("change rent to $2,600") via `apply_override` tool
- User overrides via structured override modal (B2B audit-trail flow)

**Payload:**

> **Shape corrected 2026-05-12** (consistent with §1 design principle 8 and architecture §1.5 — deterministic-scoring non-negotiable, no verdict in substrate). Original spec referenced `priorVerdict` / `newVerdict` fields; replaced with `priorDealQuality` / `newDealQuality` / `dealQualityDelta` to align with the no-verdict architecture.

```ts
interface OverridePayload {
  originalDecisionId: ObjectId;              // The DecisionEvent being overridden
  fieldPath: string;                         // e.g., 'assumptions.vacancyRate', 'propertyData.monthlyRent'
  originalValue: number | string | boolean;
  newValue: number | string | boolean;
  justification?: string;                    // Optional in inline; required in structured modal
  inputMethod: 'inline_chat' | 'structured_modal';
  resultingAnalysisEventId?: ObjectId;       // The re-analysis triggered by this override (if any)
  resultingDecisionEventId?: ObjectId;       // The new decision after override (if any)
  priorDealQuality: number;                  // 0-100 — score BEFORE override
  newDealQuality?: number;                   // 0-100 — score AFTER re-analysis (optional; in flight)
  dealQualityDelta?: number;                 // newDealQuality - priorDealQuality (convenience for aggregation)
}
```

**Writer:** `tool:apply_override` (inline) or `tool:structured_override` (modal).

**Reader pattern:**
- By `userId` (all overrides this user has made — calibration signal for this individual)
- Aggregate across users (which assumptions get overridden most often = calibration drift signal for the engine)
- By `originalDecisionId` (full override chain for one deal)

**Why this is the highest-signal event:** the engine's calibration evolves by listening to overrides. If 30% of users override `vacancyRate` upward by an average of 2 points, that's a signal the engine's vacancy default is too optimistic.

---

### 3.5 CritiqueEvent

**Purpose:** Captures adversarial agent disagreement with the deal-scoring agent's decision.

**When written:**
- Auto-triggered: every BUY-band decision (dealQuality ≥ 80) gets an automatic critique pass
- Manual: user requests "critique this analysis"
- Batched: periodic offline pass over recent decisions for substrate seeding

**Payload:**

> **Shape corrected 2026-05-12** (consistent with §1 design principle 8 and architecture §1.5 — deterministic-scoring non-negotiable, no verdict in substrate). Original spec referenced `criticVerdict` field; the critic produces STRUCTURED disagreement (`agreementWithOriginal` + `severityScore` + `divergenceReasons` + `alternativeAssumptions`) — not a categorical verdict. Aligns with agent mesh §4.3 CritiqueOutput spec.

```ts
interface CritiquePayload {
  originalDecisionId: ObjectId;
  criticPersona: 'optimistic_flipper' | 'skeptical_cpa';
  agreementWithOriginal: boolean;            // Critic agrees on the high-level outcome?
  divergenceReasons: string[];               // Why critic disagrees (if applicable)
  severityScore: number;                     // 0-100; how strongly the critic disagrees
  alternativeAssumptions: {                  // What the critic would have used instead
    fieldPath: string;
    suggestedValue: number | string | boolean;
    reasoning: string;
  }[];
  triggerType: 'auto_buy_band' | 'manual_request' | 'batch_seeding';
  modelUsed: string;                         // e.g., 'claude-opus-4-7'
  tokenCost: number;                         // For cost tracking
}
```

**Writer:** `agent:adversarial_critic`.

**Reader pattern:**
- By `originalDecisionId` (does the engine have critic disagreement on this decision?)
- By `criticPersona` (are critiques producing signal? — feeds 4-week kill criterion)
- Aggregate: how often do critics produce useful disagreement (severityScore > N AND agreementWithOriginal=false)?

---

### 3.6 ConversationEvent

**Purpose:** One event per turn in chat. Captures what was asked, how it was routed, what was returned.

**When written:** Every turn of the chat surface. Single event captures both the user input and the agent response (paired, not split).

**Payload:**
```ts
interface ConversationPayload {
  sessionId: string;                         // UUID v4; groups events in one chat session
  turnNumber: number;                        // 1-indexed turn in this session
  userInput: {
    text: string;
    inputMethod: 'text' | 'voice' | 'paste';
    redactedPII?: boolean;                   // True if pre-processing stripped PII
  };
  intentClassification: {
    intent: ChatIntent;                      // See orchestrator routing table in master doc §4.3
    confidence: number;
    classifierModel: string;                 // e.g., 'claude-haiku-4-5'
  };
  routedTo: 'agent:deal_scoring' | 'agent:qa' | 'agent:adversarial_critic' | 'tool_only' | 'fallback';
  toolCalls: {
    toolName: string;
    inputHash: string;                       // Hash of input, not full payload (PII)
    success: boolean;
    durationMs: number;
  }[];
  agentResponse: {
    text: string;                            // Final rendered text
    structuredOutputs: string[];             // Component types emitted (e.g., ['DealScoreCard', 'AssumptionsPanel'])
    relatedEventIds: ObjectId[];             // Events this turn produced (AnalysisEvent, DecisionEvent, etc.)
  };
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    estimatedCostCents: number;
  };
  modelUsed: string;
  totalDurationMs: number;
}
```

**Writer:** `agent:orchestrator` (the orchestrator emits on turn completion).

**Reader pattern:**
- By `sessionId` (load conversation history when user returns)
- By `userId` + recent (cross-session context retrieval)
- Aggregate by intent (which intents are most common; which produce highest user satisfaction proxy = followups < threshold)

**Privacy:** `userInput.text` is stored in full for substrate value. PII redaction happens at extraction time (see [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md) §6 for pre-processing pipeline). If user requests deletion, redact `userInput.text` and `agentResponse.text` to `[REDACTED]` while preserving event shape for analytics.

---

### 3.7 AuditTrailEvent

**Purpose:** B2B compliance event. Captures audit-relevant actions: PDF exports, audit-trail view renders, sign-offs.

**When written:**
- PDF export of analysis (`tool:export_audit_pdf`)
- "Show me the assumptions" view rendered (`tool:render_audit_trail`)
- Underwriter sign-off in B2B workflows

**Payload:**
```ts
interface AuditTrailPayload {
  decisionId: ObjectId;                      // The decision being audited
  action: 'export_pdf' | 'view_assumptions' | 'sign_off' | 'submit_to_committee';
  exportFormat?: 'pdf' | 'csv' | 'json';
  viewedAssumptions?: string[];              // FieldPaths of assumptions surfaced
  approvedBy?: ObjectId;                     // For sign_off: which user approved
  approvalNote?: string;
  recipient?: string;                        // For exports sent externally (email / portal upload)
  ipAddress?: string;                        // For compliance audit
}
```

**Writer:** Audit-related tools (`tool:export_audit_pdf`, `tool:render_audit_trail`, `tool:sign_off`).

**Reader pattern:**
- By `decisionId` (full audit history for a decision)
- By `userId` (user's audit activity)
- By `institutionId` + date range (compliance reports for B2B customers)

---

### 3.8 WatchlistEvent

**Purpose:** User saves a property to watchlist. Lightweight; mainly activation-signal.

**When written:** User taps "Save to watchlist" in chat or wizard.

**Payload:**
```ts
interface WatchlistPayload {
  dealId: ObjectId;                          // The property being saved
  source: 'chat' | 'wizard' | 'import' | 'shared_link';
  decisionIdAtSave?: ObjectId;               // Snapshot of decision state when saved
  note?: string;                             // Optional user note
}
```

**Writer:** `tool:save_to_watchlist`.

**Reader pattern:**
- By `userId` (user's watchlist)
- Aggregate: watchlist add rate per session = activation moment metric

---

### 3.9 OutcomeEvent

**Status:** **Schema ships from day one; capture pipeline lights up later.**

**Purpose:** Captures what actually happened to a deal — closed, passed, walked, defaulted (B2B). The eventual source of ground truth for engine calibration.

**When written (eventually):**
- User reports a deal outcome (chat-based or settings-based capture)
- B2B pilot integrates LOS data → outcome events from real closings
- Post-purchase performance survey (6 / 12 / 24 months out)

**Payload:**
```ts
interface OutcomePayload {
  dealId: ObjectId;
  originalDecisionId: ObjectId;              // The verdict at time of decision
  outcome: 'closed' | 'passed' | 'walked' | 'fell_through' | 'defaulted';
  outcomeDate: Date;
  reportedBy: 'self' | 'b2b_los_integration' | 'survey_followup';
  financialDelta?: {                         // Post-purchase performance, if available
    actualVsProjectedNOI?: number;           // Delta in dollars
    actualVsProjectedCashFlow?: number;
    holdingPeriodMonths?: number;
    salePrice?: number;
    exitIRR?: number;
  };
  notes?: string;
}
```

**Writer:** `tool:report_outcome` (when implemented), `system` (for B2B LOS integration).

**Reader pattern:**
- By `originalDecisionId` (was this decision correct in hindsight?)
- Aggregate: engine calibration validation. BUY decisions that closed and performed near projection = engine working. BUY decisions that defaulted = engine miscalibrated. This is the long-horizon training signal.

**Why schema-first even though capture is deferred:** Adding the schema costs near-zero today. When B2B pilots light up or retail follow-up surveys catch on, the data shape is already locked. Avoids future migration pain.

---

### 3.10 PortfolioEvent

**Status:** **Schema ships in wave 1; capture lights up in wave 1.5** (instrumentation pass on existing portfolio services without changing their behavior).

**Purpose:** Captures changes to user portfolios — additions, removals, goal updates, analytics recalculations, AI insight generation. Feeds the substrate's portfolio dimension and prepares for the wave 2 portfolio-agent. See [PRODUCT_2.0_ARCHITECTURE.md §11.5](PRODUCT_2.0_ARCHITECTURE.md) for the strangler-fig coverage strategy.

**When written (wave 1.5):**
- Single-line `eventsRepo.writePortfolioEvent(...)` calls inserted into existing services at write points
- Existing services ([portfolioService](../backend/src/services/portfolioService.ts), [portfolioAnalyticsService](../backend/src/services/portfolio/), [enhancedPortfolioAI](../backend/src/services/portfolio/enhancedPortfolioAI.ts)) otherwise unchanged

**Payload (discriminated by `subType`):**

```ts
type PortfolioPayload =
  | { subType: 'portfolio_created';      portfolioId: ObjectId; goals: PortfolioGoals; }
  | { subType: 'property_added';         portfolioId: ObjectId; dealId: ObjectId; ownershipPct: number; }
  | { subType: 'property_removed';       portfolioId: ObjectId; dealId: ObjectId; }
  | { subType: 'goal_updated';           portfolioId: ObjectId; oldGoals: PortfolioGoals; newGoals: PortfolioGoals; }
  | { subType: 'analytics_recalculated'; portfolioId: ObjectId; trigger: 'property_change' | 'manual' | 'scheduled'; durationMs: number; }
  | { subType: 'ai_insight_generated';   portfolioId: ObjectId; insightType: 'health_check' | 'peer_comparison' | 'goal_path'; tokenCost: number; }
  | { subType: 'recommendation_viewed';  portfolioId: ObjectId; recommendationId: ObjectId; };
```

**Writer (wave 1.5):** Existing portfolio services (instrumented). **Writer (wave 2):** Also `agent:portfolio` for chat-driven portfolio actions.

**Reader pattern:**
- By `portfolioId` (full history of a portfolio)
- By `userId` + recent (portfolio activity timeline)
- Aggregate `analytics_recalculated.durationMs` (performance drift detection)
- Aggregate `ai_insight_generated.tokenCost` per portfolio (cost monitoring)

---

### 3.11 PipelineEvent

**Status:** **Schema ships in wave 1; capture lights up in wave 1.5.**

**Purpose:** Captures deal-pipeline state transitions. The single highest-leverage event for outcome capture — `pipeline_deal_closed` is the lowest-friction precursor to `OutcomeEvent` (§3.9). When outcome capture lights up in wave 2 or 3, a one-time backfill converts historical `pipeline_deal_closed` events with `finalOutcome: 'closed'` into `OutcomeEvent`s.

**When written (wave 1.5):**
- Instrumentation inserted into existing pipeline services and controllers
- Existing pipeline UI and REST endpoints unchanged

**Payload:**

```ts
type PipelinePayload =
  | { subType: 'deal_added_to_pipeline';   pipelineDealId: ObjectId; dealId: ObjectId; stage: string; }
  | { subType: 'pipeline_stage_changed';   pipelineDealId: ObjectId; oldStage: string; newStage: string; reason?: string; }
  | { subType: 'next_action_set';          pipelineDealId: ObjectId; action: string; dueDate: Date; }
  | { subType: 'pipeline_deal_closed';     pipelineDealId: ObjectId; finalOutcome: 'closed' | 'walked' | 'fell_through' | 'expired'; }
  | { subType: 'pipeline_note_added';      pipelineDealId: ObjectId; noteId: ObjectId; };
```

**Writer (wave 1.5):** Existing pipeline services (instrumented). **Writer (wave 2):** Also `agent:pipeline`.

**Reader pattern:**
- By `pipelineDealId` (deal's pipeline history)
- By `userId` + `subType: 'pipeline_deal_closed'` (close rate, outcome distribution — feeds calibration analysis)
- Aggregate stage-transition timings (pipeline velocity insights for B2B underwriting workflows)
- **Outcome backfill source** when outcome capture lights up — schema alignment between `pipeline_deal_closed.finalOutcome` and `OutcomeEvent.outcome` is intentional.

---

## 4. Mongoose schema implementation

### 4.1 Discriminator pattern

We use Mongoose's discriminator pattern so all events live in collections per type (better indexing, no large multi-type collections), but share the common envelope.

```ts
// backend/src/models/events/BaseEvent.ts
import { Schema, model } from 'mongoose';

const baseEventOptions = {
  discriminatorKey: 'eventType',
  timestamps: { createdAt: 'timestamp', updatedAt: false },  // No updatedAt — append-only
  strict: 'throw' as const,                                  // Reject unknown fields
};

const baseEventSchema = new Schema({
  traceId:        { type: String, required: true, index: true },
  eventVersion:   { type: Number, required: true, min: 1 },
  actorType:      { type: String, required: true },
  userId:         { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
  institutionId:  { type: Schema.Types.ObjectId, ref: 'Institution' },
  timestamp:      { type: Date, required: true, default: Date.now, index: true },
}, baseEventOptions);

// Disallow any update operations at the schema level
baseEventSchema.pre('updateOne', function() { throw new Error('Events are append-only'); });
baseEventSchema.pre('findOneAndUpdate', function() { throw new Error('Events are append-only'); });
baseEventSchema.pre('updateMany', function() { throw new Error('Events are append-only'); });
baseEventSchema.pre('deleteOne', function() { throw new Error('Events are append-only'); });
baseEventSchema.pre('deleteMany', function() { throw new Error('Events are append-only'); });

export const BaseEventModel = model('Event', baseEventSchema, 'events');
```

### 4.2 Per-event-type discriminator schemas

Each event type adds its `payload` schema as a discriminator:

```ts
// backend/src/models/events/AnalysisEvent.ts
import { BaseEventModel } from './BaseEvent';
import { Schema } from 'mongoose';

const analysisPayloadSchema = new Schema({
  propertyData:        { type: Schema.Types.Mixed, required: true },  // Typed at app layer via TS
  marketData:          { type: Schema.Types.Mixed, required: true },
  assumptions:         { type: Schema.Types.Mixed, required: true },
  metrics:             { type: Schema.Types.Mixed, required: true },
  monthlyAnalysis:     { type: Schema.Types.Mixed, required: true },
  longTermAnalysis:    { type: Schema.Types.Mixed, required: true },
  walkAwayPrice:       { type: Number, required: true },
  enrichmentSource:    { type: String, required: true, enum: ['rentcast', 'fred', 'census', 'fallback', 'composite'] },
  enrichmentCacheHit:  { type: Boolean, required: true },
  engineVersion:       { type: String, required: true },
  computeTimeMs:       { type: Number, required: true },
}, { _id: false });

const analysisEventSchema = new Schema({
  payload: { type: analysisPayloadSchema, required: true },
});

export const AnalysisEventModel = BaseEventModel.discriminator('analysis', analysisEventSchema);
```

**Note on `Schema.Types.Mixed`:** The §1 principle says "no opaque blobs." The schema declares `Mixed` because the nested types are large and exist as TypeScript types already (`SFRMetrics`, `MarketDataResponse`, etc.). Runtime validation happens at the repository layer using Zod or io-ts (see §5.3). The discipline holds: there is a strict typed schema; it just lives in TS, not in Mongoose. Mongoose still rejects unknown top-level fields via `strict: 'throw'`.

If we want belt-and-suspenders enforcement, we can hand-write nested schemas matching the TS types (high effort, low marginal benefit). Default position: TS + repository-layer validation is enough.

### 4.3 Repeat for the other 8 types

Same pattern as 4.2 for `ProfileEvent`, `DecisionEvent`, `OverrideEvent`, `CritiqueEvent`, `ConversationEvent`, `AuditTrailEvent`, `WatchlistEvent`, `OutcomeEvent`. Each has its own `<type>Payload` schema as the discriminator.

---

## 5. Repository layer

The repository layer is the only code that talks to the events store. It exposes write methods (insert only) and read methods (aggregation pipelines). No update/delete methods exist.

### 5.1 Write API

```ts
// backend/src/repositories/EventsRepository.ts

export class EventsRepository {
  async writeAnalysisEvent(input: WriteAnalysisInput): Promise<ObjectId> {
    const validated = AnalysisPayloadSchema.parse(input.payload);  // Zod runtime validation
    const event = await AnalysisEventModel.create({
      traceId:       input.traceId,
      eventVersion:  ANALYSIS_EVENT_VERSION,           // Constant per type
      actorType:     input.actorType,
      userId:        input.userId,
      institutionId: input.institutionId,
      payload:       validated,
    });
    return event._id;
  }

  async writeDecisionEvent(input: WriteDecisionInput): Promise<ObjectId> { /* ... */ }
  async writeOverrideEvent(input: WriteOverrideInput): Promise<ObjectId> { /* ... */ }
  // ... one writer per event type

  // NO updateEvent, NO deleteEvent. These methods do not exist.
}
```

**Critical:** No update methods on the repository. If you need to "fix" an event, you write a new event that supersedes it (e.g., a corrective ProfileEvent). The historical event stays.

### 5.2 Read API

Reads are aggregation pipelines, exposed as named methods:

```ts
async getRecentEventsForUser(userId: ObjectId, limit = 50): Promise<Event[]> { /* ... */ }
async getEventsByTraceId(traceId: string): Promise<Event[]> { /* ... */ }
async getDecisionHistoryForDeal(dealId: ObjectId): Promise<DecisionEvent[]> { /* ... */ }
async getCurrentProfile(userId: ObjectId): Promise<ProfilePayload | null> { /* ... */ }
async getOverrideFrequencyByField(timeWindow: Duration): Promise<Map<string, number>> { /* ... */ }
async getConversationHistory(sessionId: string): Promise<ConversationEvent[]> { /* ... */ }
async getCritiquesForDecision(decisionId: ObjectId): Promise<CritiqueEvent[]> { /* ... */ }
```

Adding a new query = adding a new repository method. No raw query access from controllers / agents.

### 5.3 Runtime validation with Zod

Payload validation at write time catches bugs that Mongoose's `Mixed` type lets through:

```ts
// backend/src/repositories/schemas/ProfilePayloadSchema.ts
import { z } from 'zod';

export const ProfilePayloadSchema = z.object({
  investorType:        z.enum(['retail', 'pro', 'lender', 'consultancy']).optional(),
  portfolioSize:       z.enum(['none', '1-3', '4-10', '11-30', '30+']).optional(),
  primaryMarkets:      z.array(z.string()).optional(),
  role:                z.enum(['principal', 'loan_officer', 'underwriter', 'analyst', 'other']).optional(),
  institutionContext:  z.object({
    name:               z.string().optional(),
    institutionType:    z.enum(['credit_union', 'community_bank', 'hard_money', 'consultancy']).optional(),
    typicalDealVolume:  z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
  riskTolerance:       z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  primaryGoal:         z.enum(['cash_flow', 'wealth_building', 'diversification', 'tax_optimization']).optional(),
  extractedFromInput:  z.string().optional(),
  extractionConfidence: z.number().min(0).max(100).optional(),
});

export type ProfilePayload = z.infer<typeof ProfilePayloadSchema>;
```

The TypeScript type and the runtime validator are the same source of truth.

---

## 6. MongoDB role configuration

Append-only at the DB level is the suspenders to the repository's belt. If application code ever tries to update an event (a bug, or a future regression), the DB rejects the operation.

### 6.1 Application user

```js
// MongoDB role creation (run once during provisioning)
use admin
db.createRole({
  role: 'eventsAppendOnly',
  privileges: [
    {
      resource: { db: 'reanalyzr', collection: 'events' },
      actions: ['find', 'insert']
      // Explicitly no 'update', no 'remove', no 'drop'
    }
  ],
  roles: []
});

db.createUser({
  user: 'reanalyzr_events_writer',
  pwd: '...',
  roles: [{ role: 'eventsAppendOnly', db: 'admin' }]
});
```

### 6.2 Admin user (for migrations and ops)

A separate admin user retains full privileges for explicit schema migrations or operational interventions. Connection strings in app code use the append-only user; admin user is gated behind ops procedures.

### 6.3 Sanity check on startup

The app verifies on startup that the events-writer user has the expected role and exits if not. Prevents accidental connection-string misconfiguration that would silently give update privileges.

---

## 7. Indexing strategy

| Index | Use case |
|---|---|
| `{ userId: 1, timestamp: -1 }` | "Show recent events for this user" — most common read |
| `{ userId: 1, eventType: 1, timestamp: -1 }` | "Show all this user's analyses / overrides" — calibration and history queries |
| `{ traceId: 1 }` | "Show all events for this interaction" — debug, audit |
| `{ 'payload.dealId': 1, timestamp: -1 }` | All events for a property over time (sparse — only events with `dealId` field) |
| `{ 'payload.sessionId': 1, eventType: 1 }` | Conversation event reload by session (ConversationEvent only) |
| `{ institutionId: 1, eventType: 1, timestamp: -1 }` | B2B compliance reports (sparse — only institution-scoped events) |
| `{ 'payload.criticPersona': 1, timestamp: -1 }` | CritiqueEvent: track per-persona output (4-week kill criterion) |

**Sparse indexes** for fields that only exist on some event types (`dealId`, `sessionId`, `criticPersona`, `institutionId`). Mongoose handles this automatically when the field is optional in the schema.

**No TTL on event collections.** Events are kept indefinitely. Archival strategy (cold storage) is deferred until collection size warrants it — see §10.

---

## 8. Common query patterns

Concrete recipes for the queries the application makes most often.

### 8.1 Load conversation history for a returning user

```ts
async getConversationHistory(sessionId: string): Promise<ConversationEvent[]> {
  return ConversationEventModel
    .find({ 'payload.sessionId': sessionId })
    .sort({ 'payload.turnNumber': 1 })
    .lean();
}
```

### 8.2 Seed agent context at session start

```ts
async getUserContextForSession(userId: ObjectId): Promise<UserContext> {
  const [profile, recentDecisions, recentOverrides] = await Promise.all([
    this.getCurrentProfile(userId),                    // Most recent ProfileEvent payload
    this.getRecentDecisionsForUser(userId, 10),        // Last 10 DecisionEvents
    this.getRecentOverridesForUser(userId, 20),        // Last 20 OverrideEvents
  ]);
  return { profile, recentDecisions, recentOverrides };
}
```

### 8.3 Calibration drift signal: which fields are overridden most often

```ts
async getOverrideFrequencyByField(daysBack: number): Promise<Map<string, number>> {
  const since = new Date(Date.now() - daysBack * 86400_000);
  const results = await OverrideEventModel.aggregate([
    { $match: { timestamp: { $gte: since } } },
    { $group: { _id: '$payload.fieldPath', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return new Map(results.map(r => [r._id, r.count]));
}
```

### 8.4 Audit trail for a single decision

```ts
async getAuditTrail(decisionId: ObjectId): Promise<AuditTrailBundle> {
  const decision = await DecisionEventModel.findById(decisionId).lean();
  if (!decision) throw new Error('Decision not found');

  const [analysis, overrides, critiques, auditEvents] = await Promise.all([
    AnalysisEventModel.findById(decision.payload.analysisEventId).lean(),
    OverrideEventModel.find({ 'payload.originalDecisionId': decisionId }).sort({ timestamp: 1 }).lean(),
    CritiqueEventModel.find({ 'payload.originalDecisionId': decisionId }).lean(),
    AuditTrailEventModel.find({ 'payload.decisionId': decisionId }).sort({ timestamp: 1 }).lean(),
  ]);

  return { decision, analysis, overrides, critiques, auditEvents };
}
```

This is the query that powers the "show me the assumptions" view, the PDF export, and the B2B audit trail UI. **One query shape, three surfaces.**

---

## 9. Schema evolution

### 9.1 The rule

Once an event is written, its shape is frozen forever. Schema evolution adds new versions; existing events are never mutated.

### 9.2 Adding a new field

1. Bump `eventVersion` constant for that event type (e.g., `ANALYSIS_EVENT_VERSION = 2`)
2. Add the new field to the payload Zod schema as **optional** (so old payloads still validate)
3. Update the writer to populate the new field
4. Update readers to handle both versions:
   ```ts
   function getEnrichmentSourceFromEvent(event: AnalysisEvent): string {
     if (event.eventVersion >= 2) return event.payload.enrichmentSource;
     return 'unknown_legacy';  // V1 didn't have this field
   }
   ```

### 9.3 Renaming a field

Don't. Add the new field (per §9.2), keep the old field optional, deprecate the old field in TypeScript with `@deprecated`, never delete it from existing events. New writes use only the new field.

### 9.4 Changing field semantics

If the meaning of a field changes (e.g., `dealQuality` was 0–100 before, now you want 0–1000), don't. Add a new field (`dealQualityScaled`), version-bump, ignore the old field in new writes, leave it on historical events.

### 9.5 Migration playbook for breaking changes

If a breaking schema change is truly required (rare):
1. Document the migration in `/docs/migrations/EVT-NNN-<description>.md`
2. Mark all events with the old version as `eventVersion: -1` (deprecated) via a one-time write of *new* corrective events that supersede them — **don't mutate in place**
3. Write a reader that knows to skip events with `eventVersion: -1`
4. Update the running engine to treat the deprecated events as if they didn't exist for query purposes
5. Historical events remain readable for audit / debug

This procedure is heavy on purpose. The right answer is almost always "add a new field, don't break the old one."

---

## 10. Storage growth and operational concerns

### 10.1 Projected volumes (wave 1)

Per active user, rough event counts after 6 months of use:

| Event type | Events / user | Avg size | Subtotal / user |
|---|---|---|---|
| Profile | 5 (slow-changing) | 1 KB | 5 KB |
| Analysis | 200 (~30/mo) | 12 KB | 2.4 MB |
| Decision | 200 (paired with Analysis) | 3 KB | 600 KB |
| Override | 150 (~25/mo) | 1 KB | 150 KB |
| Critique | 50 (BUY-band only) | 4 KB | 200 KB |
| Conversation | 1500 (~250/mo) | 2 KB | 3 MB |
| AuditTrail | 30 | 1 KB | 30 KB |
| Watchlist | 50 | 0.5 KB | 25 KB |
| Outcome | 5 (when capture lights up) | 1 KB | 5 KB |
| **Total** | **~2,190** | | **~6.4 MB / user** |

At 500 active users (thesis substrate-weight threshold): ~3.2 GB. Trivial for MongoDB.

At 5,000 active users (mid-2027 projection): ~32 GB. Still well within single-cluster comfort.

At 50,000: ~320 GB. Worth thinking about sharding / archival. Plenty of runway.

**Conclusion:** archival / sharding strategy can be deferred until at least 10K active users. The architecture doesn't depend on it.

### 10.2 Backup

Standard MongoDB Atlas backups apply. No special handling — append-only collections back up cleanly.

### 10.3 Disaster recovery

Events are the substrate. Loss = catastrophic. Atlas continuous backup with point-in-time recovery is required. Application-level DR runbook in [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) §13.

### 10.4 PII and right-to-deletion

GDPR / CCPA right-to-deletion: redact PII fields (`userInput.text`, `agentResponse.text`, profile free-text fields) to `[REDACTED]` while preserving the event envelope and structural payload. This is the **only** mutation operation that touches historical events, and it goes through the admin user with explicit audit logging — never the app's append-only user.

---

## 11. Testing strategy

### 11.1 In-memory MongoDB for unit tests

Use `mongodb-memory-server` for repository-layer unit tests. Each test gets a fresh in-memory instance; no shared state, no cleanup between tests.

```ts
// backend/src/repositories/__tests__/EventsRepository.test.ts
beforeEach(async () => { /* start in-memory mongo, connect, attach repository */ });
afterEach(async () => { /* disconnect, stop in-memory mongo */ });

test('writeAnalysisEvent rejects payload missing required fields', async () => {
  await expect(repo.writeAnalysisEvent({ /* missing walkAwayPrice */ })).rejects.toThrow();
});

test('events are append-only — update throws', async () => {
  const id = await repo.writeAnalysisEvent(validInput);
  await expect(AnalysisEventModel.updateOne({ _id: id }, { 'payload.walkAwayPrice': 999 }))
    .rejects.toThrow('Events are append-only');
});
```

### 11.2 Integration tests against Atlas-like cluster

A small set of integration tests run against a real (Atlas test cluster or local Docker Mongo) DB to validate:
- DB role enforcement (events-writer user actually rejects update/delete)
- Index utilization for hot queries (explain plans return `IXSCAN`, not `COLLSCAN`)
- Cross-collection queries via aggregation work correctly

### 11.3 Property-based testing for schema evolution

For each event type, a property test that writes events at every supported version and verifies readers handle all of them.

---

## 12. Open questions still to resolve

These aren't blocking the substrate ship — they need answers before specific downstream features go live.

1. **Per-session memory store: Redis vs. in-memory vs. just-read-from-substrate?** Conversation history can be read directly from `ConversationEvent` queries at session start; whether we cache the active session in Redis or just re-query on each turn is a perf/cost tradeoff to validate.
2. **PII pre-processing pipeline location.** Should redaction happen at the agent input layer (before substrate write) or as a post-write redaction job? Front-loading is safer; back-loading is more flexible. Current bias: front-load.
3. **Cross-event-store joins with relational portfolio data.** If we ever need to query "events for users in portfolios with goal=cash_flow," do we denormalize the goal onto the event, or do an application-layer join? Bias: denormalize the small reference fields (portfolioGoal, institutionId, etc.) onto events at write time.
4. **Event-correlation graph for complex multi-agent flows.** When a chat turn triggers analysis → decision → critique → override → re-analysis → new decision, the resulting event chain has 6+ events under one traceId. Worth shipping a visualization tool early (debug aid). Lightweight: a "trace viewer" page in the admin UI that renders events by `traceId` as a timeline.

---

## 13. Changelog

- **2026-05-10 (v1):** Initial draft. 9 event types specified with full schemas. Repository pattern, Mongoose discriminators, DB-role enforcement, indexing, query recipes, schema evolution rules, storage projections.
- **2026-05-10 (v1.2):** Added §3.10 PortfolioEvent and §3.11 PipelineEvent — schema-ready, capture in wave 1.5 via instrumentation pass on existing portfolio/pipeline services. PipelineEvent.pipeline_deal_closed is intentional schema-alignment with OutcomeEvent for future backfill. See [PRODUCT_2.0_ARCHITECTURE.md §11.5](PRODUCT_2.0_ARCHITECTURE.md) for full strangler-fig coverage strategy.
- **2026-05-12 (v1.3):** Corrected §3.4 OverrideEvent and §3.5 CritiqueEvent payload specs to match implementation (no verdict fields anywhere in substrate per §1 principle 8 + architecture §1.5). OverrideEvent: `priorVerdict`/`newVerdict` replaced with `priorDealQuality`/`newDealQuality`/`dealQualityDelta`. CritiqueEvent: `criticVerdict` removed — critic produces structured disagreement (agreementWithOriginal + severityScore + divergenceReasons + alternativeAssumptions), not a categorical verdict. This brings the doc into alignment with the schema-layer enforcement that lives in the OverrideEvent.ts and CritiqueEvent.ts tests.
- **2026-05-10 (v1.1):** Corrections after architect review of [investmentDecisionEngine.ts](../backend/src/services/investment/investmentDecisionEngine.ts):
  - DecisionEvent payload corrected to drop legacy `verdict` field; `dealQuality` (0-100) is now the single source of truth, aligned with the engine's own V3.0 migration direction
  - Added §3.3.1 critical-flag score-capping rules (replaces legacy "force-PASS verdict" override pattern)
  - Added `userContext` to DecisionEvent (riskTolerance, investmentStrategy, experienceLevel, investorType, primaryGoal) — captures persona context driving deterministic weight selection
  - ProfileEvent (§3.1) — added lift-vs-net-new clarification table (3 of 5 primary persona fields already in current engine; investorType + institutionContext are 2.0 extensions)
  - Engine migration context note added to §0
  - Added §1 design principle 8: AI never produces dealQuality. Cross-links to [PRODUCT_2.0_ARCHITECTURE.md §1.5](PRODUCT_2.0_ARCHITECTURE.md) for the full rationale.
