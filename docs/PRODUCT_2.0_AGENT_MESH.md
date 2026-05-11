# REanalyzr 2.0 — Agent Mesh

**Document type:** Companion doc to [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) §4–§5
**Authored:** 2026-05-10
**Status:** Draft 1
**Owns:** Orchestrator, agent specs, tool registry, prompt structure, MCP server interface, conversation memory, streaming

---

## 0. Scope and non-scope

**This doc covers:**
- Orchestrator implementation (intent routing, conversation memory, streaming)
- Wave 1 agent specifications (deal-scoring, Q&A, adversarial critic)
- Tool registry pattern and the wave 1 tool catalog
- Prompt structure (persona / instructions / schema separation, versioning)
- MCP server interface (how tools are exposed to external MCP-aware clients)
- Streaming, cancellation, error handling

**Out of scope (lives elsewhere):**
- Event schemas — see [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md)
- Eval coverage per agent — see [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md)
- Cost economics and model-tier routing detail — see [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md)
- Frontend chat surface and inline structured controls — see [PRODUCT_2.0_FRONTEND.md](PRODUCT_2.0_FRONTEND.md)

**Load-bearing constraint:** AI never produces the `dealQuality` score. See [PRODUCT_2.0_ARCHITECTURE.md §1.5](PRODUCT_2.0_ARCHITECTURE.md). This shapes every agent boundary in this doc.

---

## 1. Architecture recap

```
                  User input (chat)
                        │
                        ▼
              ┌─────────────────────┐
              │   ORCHESTRATOR      │
              │                     │
              │ 1. Intent classify  │ ← Haiku 4.5 (cheap, fast, cached)
              │ 2. Route to agent   │
              │ 3. Manage memory    │
              │ 4. Stream response  │
              └──────┬──────────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        ▼            ▼            ▼             ▼
   ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Deal-   │ │ Q&A /    │ │ Adversarl│ │ Tool-only│
   │ scoring │ │ Education│ │ Critic   │ │ direct   │
   │ agent   │ │ agent    │ │ agent    │ │ (no agent│
   │(Sonnet) │ │(Sonnet)  │ │(Opus)    │ │ needed)  │
   └────┬────┘ └─────┬────┘ └─────┬────┘ └────┬─────┘
        │            │            │           │
        └────────────┴────────────┴───────────┘
                     │
              ┌──────▼──────────┐
              │  TOOL REGISTRY  │
              │                 │
              │ Typed tools     │
              │ (some pure code,│
              │ some wrap       │
              │ existing svcs)  │
              └──────┬──────────┘
                     │
              ┌──────▼──────────┐
              │  EVENTS STORE   │
              │  (every state-  │
              │  changing tool  │
              │  writes here)   │
              └─────────────────┘
```

The orchestrator never executes tools directly. Agents request tools; the orchestrator's job is intent routing, memory management, and streaming. Tools are the only place state changes happen.

---

## 2. Orchestrator

### 2.1 Responsibilities

1. **Intent classification** — Map user input to one of a finite set of intents (Haiku 4.5, prompt-cached)
2. **Routing** — Dispatch to the appropriate agent or run a tool directly if no reasoning is needed
3. **Conversation memory management** — Load relevant context at session start; trim active context as turns accumulate; query events store for cross-session memory
4. **Streaming response** — Pipe agent-produced tokens to the client surface; render inline structured outputs (verdict cards, sliders) as agent emits them; handle cancellation cleanly
5. **Error handling** — Catch typed errors from agents/tools; produce user-facing error responses without crashing the session; emit `ConversationEvent` with failure metadata

### 2.2 Intent classification

A small classifier call decides which agent (or tool path) handles the turn. Run on every turn that isn't a continuation of a streaming response.

**Model:** Claude Haiku 4.5. Cheap, fast, accurate enough for finite intent set.

**Prompt structure (cached):**

```
System: You are an intent classifier for a real estate investment platform.
        Map the user input to exactly one intent label.

Cached context: <intent label definitions, sample inputs per intent>

User input: <runtime input>
```

The cached portion is the same for every classifier call (definitions, examples, output schema). The runtime portion is just the user input. Prompt-cache hit rate should approach 100% after warm-up.

**Output schema (tool-use forced):**

```ts
type IntentClassification = {
  intent: ChatIntent;
  confidence: number; // 0-100
  reasoning?: string; // optional; ~1 sentence for debug
};

type ChatIntent =
  | 'analyze_property'        // Address, listing link, "I'm looking at X"
  | 'share_profile'           // Profile context shared, no property
  | 'qa_metric'               // "what does cap rate mean"
  | 'qa_decision'             // "why did this score 67"
  | 'qa_general'              // Other educational questions
  | 'override_assumption'     // "change rent to 2600"
  | 'request_audit_trail'     // "show me the assumptions"
  | 'request_export'          // "export PDF" / "send to my underwriter"
  | 'request_critique'        // "have a critic look at this"
  | 'save_action'             // "save to watchlist"
  | 'fallback'                // Couldn't classify
```

### 2.3 Routing table

| Intent | Routes to | Notes |
|---|---|---|
| `analyze_property` | `agent:deal_scoring` | Deal-scoring agent orchestrates enrichment + analysis + scoring tools |
| `share_profile` | Tool-only: `profile_extraction`, then short ack response | No agent reasoning needed if user only shared context |
| `qa_metric`, `qa_decision`, `qa_general` | `agent:qa` | Q&A agent handles all educational/explanatory intents |
| `override_assumption` | Tool-only: `apply_override`, then Q&A agent for new explanation | Override is deterministic; explaining the new score uses Q&A |
| `request_audit_trail` | Tool-only: `render_audit_trail` | No LLM needed; query events store and render |
| `request_export` | Tool-only: `export_audit_pdf` | No LLM needed; generate PDF from events |
| `request_critique` | `agent:adversarial_critic` | Opus 4.7; runs the two critic personas |
| `save_action` | Tool-only: `save_to_watchlist` | Deterministic |
| `fallback` | `agent:qa` | Q&A is the catch-all |

**Confidence threshold:** if classifier confidence < 70, route to `agent:qa` as fallback (the Q&A agent can disambiguate via clarifying question).

### 2.4 Conversation memory

Two-tier model (per [PRODUCT_2.0_ARCHITECTURE.md §4.2](PRODUCT_2.0_ARCHITECTURE.md)):

**Per-session (ephemeral):**
- Active conversation thread in memory + Redis-or-equivalent
- Last N turns kept in full
- Older turns summarized via a Haiku 4.5 summarization pass (run once when context exceeds budget)
- Lifecycle: 24h TTL on Redis cache; falls back to events store reload on cache miss

**Per-user (events-store-backed):**
- Loaded at session start via `tool:recall_user_context`
- Includes: most recent `ProfileEvent` (current profile state), last 10 `DecisionEvent` (recent activity), last 20 `OverrideEvent` (calibration signal for this user)
- Loaded once per session start; refreshed mid-session only if a new ProfileEvent or significant override stream is detected

**Context window budget:** Wave 1 target — 40% system + persona, 30% memory (session + user), 30% room for current turn + agent reasoning. Configurable per agent.

### 2.5 Streaming

- Anthropic SDK streaming for agent responses
- Server emits SSE to the client surface
- Inline structured outputs (verdict cards, override sliders, etc.) are emitted as **content blocks** within the stream — the client renders the appropriate React component as soon as the structured output completes
- **Cancellation:** client closes the stream → server stops generation → no further token billing → `ConversationEvent` records partial state (turn marked `cancelled: true`, partial token usage recorded for cost accounting)

### 2.6 Error handling

Three error categories, three responses:

| Category | Example | Response |
|---|---|---|
| **User-recoverable** | Invalid address (no enrichment data) | Agent surfaces the issue, asks for clarification, no `ConversationEvent` failure flag |
| **Transient** | RentCast 5xx, FRED rate limit, LLM timeout | Tool retries (exponential backoff, max 3); if still fails, agent surfaces "I couldn't pull market data right now — try again, or proceed with limited analysis" |
| **System** | DB unreachable, schema validation throws, prompt-eval failure | Surface generic "something went wrong" to user; emit detailed `ConversationEvent` with error metadata + alert ops |

Tools throw typed errors; agents catch and translate; orchestrator never lets a raw exception reach the chat surface.

---

## 3. Tool registry

Tools are the **only** place state changes happen. Agents reason; tools act.

### 3.1 Tool definition contract

Every tool implements this interface:

```ts
interface Tool<TInput, TOutput> {
  name: string;                        // Globally unique, e.g., 'enrich_property'
  description: string;                 // Used by the LLM to decide when to call
  inputSchema: ZodSchema<TInput>;      // Runtime validation
  outputSchema: ZodSchema<TOutput>;    // Runtime validation
  invokeLLM: false | ModelTier;        // false = pure code; otherwise = model used internally
  sideEffects: SideEffect[];           // What events get written
  retrySemantics: RetryPolicy;         // Backoff, max attempts, when to give up
  execute(input: TInput, ctx: ToolContext): Promise<TOutput>;
}

interface ToolContext {
  traceId: string;
  userId: ObjectId;
  institutionId?: ObjectId;
  eventsRepo: EventsRepository;
  // tools that need other tools can call them via ctx.tools.<name>
}

type SideEffect =
  | { type: 'event'; eventType: EventType }
  | { type: 'external_api'; service: string }
  | { type: 'cache_write'; cache: string };
```

**Critical:** `invokeLLM: false` is the default. **Tools that compute the score (`compute_analysis`, `score_deal`) are pure code; they never call LLMs.** This is enforcement of the deterministic-scoring non-negotiable.

### 3.2 Wave 1 tool catalog

| Tool | LLM? | Input | Output | Events emitted |
|---|---|---|---|---|
| `enrich_property` | No | `{ address, propertyType }` | `{ comps, marketTrends, economic, propertyData }` | None (read-only) |
| `compute_analysis` | No | `{ propertyData, marketData, assumptions }` | `{ metrics, monthlyAnalysis, longTermAnalysis }` | None (compute) |
| `score_deal` | **No** | `{ analysisResult, propertyData, userContext }` | `{ dealQuality, professionalAssessment, marketPosition, criticalFlags, reasoningTrail }` | `AnalysisEvent` + `DecisionEvent` |
| `apply_override` | No | `{ decisionId, fieldPath, newValue }` | `{ newAnalysisEventId, newDecisionEventId, dealQualityDelta }` | `OverrideEvent` + new `AnalysisEvent` + new `DecisionEvent` (re-runs scoring) |
| `profile_extraction` | **Haiku 4.5** | `{ userInput, currentProfile }` | `{ extractedProfile, confidence }` | `ProfileEvent` if extraction yielded new fields |
| `recall_user_context` | No | `{ userId }` | `{ profile, recentDecisions, recentOverrides }` | None |
| `save_to_watchlist` | No | `{ decisionId, source, note? }` | `{ watchlistEventId }` | `WatchlistEvent` |
| `render_audit_trail` | No | `{ decisionId }` | `{ decision, analysis, overrides, critiques, auditEvents }` | None (read-only) |
| `export_audit_pdf` | No | `{ decisionId, format }` | `{ pdfUrl, pdfSizeBytes }` | `AuditTrailEvent` |

Only **two tools call an LLM**: `profile_extraction` (cheap Haiku call to parse unstructured chat into typed profile fields) and… that's it. The score-producing path (`compute_analysis` → `score_deal`) is 100% deterministic code, wrapping the existing engine.

### 3.3 Tool implementation patterns

**Wrapping existing services:** most wave 1 tools wrap existing backend services with the tool contract.

```ts
// Example: enrich_property wraps MarketIntelligenceService
const enrichProperty: Tool<EnrichInput, EnrichOutput> = {
  name: 'enrich_property',
  description: 'Fetches RentCast comps, FRED economic indicators, and Census demographics for a property address.',
  inputSchema: z.object({
    address: z.object({ street: z.string(), city: z.string(), state: z.string(), zipCode: z.string() }),
    propertyType: z.enum(['SFR', 'MF', /* ... */]),
  }),
  outputSchema: EnrichOutputSchema,
  invokeLLM: false,
  sideEffects: [{ type: 'external_api', service: 'rentcast' }, { type: 'external_api', service: 'fred' }],
  retrySemantics: { maxAttempts: 3, backoff: 'exponential', baseMs: 500 },
  async execute(input, ctx) {
    const result = await marketIntelligenceService.getComprehensiveMarketData({
      address: `${input.address.street}, ${input.address.city}, ${input.address.state}`,
      zipCode: input.address.zipCode,
      propertyType: input.propertyType,
    });
    return EnrichOutputSchema.parse(result); // Runtime validation
  },
};
```

**The point:** the existing service is unchanged. The tool is a thin typed wrapper that the agent can call via Anthropic SDK tool use.

### 3.4 Tool registry as the source of truth

A single registry exposes all tools:

```ts
export const toolRegistry = {
  enrich_property: enrichProperty,
  compute_analysis: computeAnalysis,
  score_deal: scoreDeal,
  apply_override: applyOverride,
  profile_extraction: profileExtraction,
  recall_user_context: recallUserContext,
  save_to_watchlist: saveToWatchlist,
  render_audit_trail: renderAuditTrail,
  export_audit_pdf: exportAuditPdf,
} as const;
```

This registry is the source of truth for:
- **Anthropic SDK tool definitions** for each agent (agent constructor takes a subset of tools)
- **MCP server interface** (each tool gets exposed as an MCP tool — see §6)
- **Eval harnesses** (golden sets and regression tests target tools by name)

---

## 4. Wave 1 agent specifications

Each agent has: purpose, model tier, allowed tools, prompt structure, event emission patterns, and error handling.

### 4.1 Deal-scoring agent

**Purpose:** Orchestrate the full analysis flow when a user wants a deal scored. Reason about which tools to call and in what order; format the verdict for chat presentation.

**Critical constraint:** This agent never produces the `dealQuality` score. It calls `tool:score_deal` which wraps the deterministic engine. The score is the engine's output. The agent's job is reasoning about the inputs, deciding to call tools, and explaining results — not scoring.

**Model:** Claude Sonnet 4.6 (default reasoning tier).

**Allowed tools:**
- `enrich_property`
- `compute_analysis`
- `score_deal`
- `apply_override` (for in-conversation override flows)
- `recall_user_context` (loads at session start, can re-call on profile update)

**Prompt structure:**

```
System (cached): You are the deal-scoring orchestrator for REanalyzr, a real estate
                 underwriting platform with conservative, calibrated scoring.

                 Your job is to:
                 1. Determine what property the user is asking about
                 2. Call enrich_property to pull market data
                 3. Call compute_analysis to get the 60+ metrics
                 4. Call score_deal to get the dealQuality score and breakdown
                 5. Present the score in chat using the structured output schema below

                 You DO NOT compute scores. The score is produced by score_deal,
                 which wraps a deterministic calibrated engine. Your job is
                 reasoning about inputs and presenting outputs.

                 [Output schema: structured verdict card emission]
                 [Tool definitions: enrich_property, compute_analysis, score_deal, ...]
                 [Behavioral examples]

User context (per-session): <recall_user_context output — profile, recent decisions, overrides>

User input (per turn): <runtime>
```

**Persona-driven behavior:** When the loaded user context has `riskTolerance`, `investorType`, `experienceLevel`, etc., those flow into `tool:score_deal` as `userContext`, which the engine consumes for deterministic weight selection. The agent doesn't itself reason about persona — it just passes it through.

**Output structure:** The agent emits text plus inline `<DealScoreCard>` component data once `score_deal` returns. Example output content block sequence:

```
[text]   "Pulled data on 1837 Walnut Way. Here's the analysis:"
[component] DealScoreCard {
  dealQuality: 67,
  qualityLabel: "Meets professional standards",
  qualityColor: 'yellow',
  keyMetrics: { cashFlow: -120, capRate: 5.2, dscr: 1.18 },
  walkAway: 385000,
  criticalFlags: [],
}
[text]   "Walk-away price is $40K below asking — that's the negotiation
          room. Want to change an assumption (rent, vacancy, rate), or
          see the full breakdown?"
```

**Events emitted:** Via tools — `AnalysisEvent` + `DecisionEvent` from `score_deal`; orchestrator emits `ConversationEvent` for the turn.

**Error handling:**
- Enrichment fails → agent surfaces "couldn't pull market data; proceed with what you've shared?" and asks user for assumptions
- Score capping due to critical flag → agent surfaces the flag in chat alongside the score; doesn't gloss over it
- Compute timeout → user-facing error, ops alert

### 4.2 Q&A / Education agent

**Purpose:** Answer educational and explanatory questions. "What does cap rate mean," "why did this score 67," "what would change to make this a 75."

**Model:** Claude Sonnet 4.6.

**Lift origin:** This agent lifts and migrates [aiEnhancedMessagingService](../backend/src/services/aiEnhancedMessaging.ts) — the existing service already produces five distinct content types (reasoning, actionPlan, capitalStrategy, timeline, alternatives) plus goal-based reasoning, with post-processing for legal compliance. Migration work:

1. Replace `getOpenAIClient()` with Anthropic SDK
2. Convert string-template prompts to typed tool definitions + persona-aware system prompts
3. Add `ConversationEvent` emission per turn
4. Keep the existing directive-language sanitization pipeline (legal compliance) — port verbatim

**Allowed tools:**
- `recall_user_context`
- `render_audit_trail` (when user asks "show me the assumptions")
- `apply_override` (the Q&A agent handles "what if vacancy were 8%" flow)

**Prompt structure:**

```
System (cached): You are REanalyzr's education and Q&A agent. You explain
                 deal analyses, metrics, and decisions to investors.

                 You NEVER produce a dealQuality score. Scores come from the
                 deterministic scoring engine via the deal-scoring agent.
                 You explain scores; you don't produce them.

                 Tone is calibrated to the user's experienceLevel:
                 - novice: plain language, education-forward, low jargon
                 - intermediate: assume basic concepts known, focus on
                   what they care about
                 - experienced/expert: domain-fluent, get to the point

                 Output is sanitized — no directive language (no "you
                 should buy", "I recommend", etc.). Use analytical framing.

                 [Content type templates: reasoning, actionPlan, etc.]
                 [Sanitization rules — match existing aiEnhancedMessaging.ts]

User context: <profile, recent decisions, recent overrides — drives tone and content>

User input: <runtime>
```

**Persona-driven behavior:**
- `experienceLevel` drives tone
- `investorType: 'lender'` shifts content to audit-trail framing, regulatory-aware
- `primaryGoal` shifts explanations to emphasize the relevant scoring factors (cash flow vs IRR vs cap rate)

**Events emitted:** `ConversationEvent` per turn (via orchestrator). No DecisionEvents (Q&A doesn't produce scores).

### 4.3 Adversarial critic agent

**Purpose:** Stress-test deal-scoring decisions with two synthetic personas. Produces parallel signal that surfaces as critique chips in UI, calibration data in substrate, and counter-arguments in B2B audit trails.

**Critical constraint:** Does NOT modify the dealQuality score. The score is the engine's. The critic produces structured disagreement that surfaces alongside the score.

**Model:** Claude Opus 4.7 (high-stakes reasoning; runs sparingly).

**Personas:**

```
Persona 1 — Optimistic Flipper
"You are an aggressive real estate investor who believes in upside,
value-add scenarios, and seller motivation. You bias toward optimism
on rent growth, appreciation, vacancy recovery, and exit timing.
Critique the deal-scoring agent's verdict by surfacing where its
conservatism may be costing the investor an opportunity."

Persona 2 — Skeptical CPA
"You are a CPA with 25 years of real estate tax experience. You bias
toward hidden costs, tax-event triggering, deferred maintenance,
expense underestimation, and reserves. Critique the deal-scoring
agent's verdict by surfacing where its baseline assumptions may
underestimate downside risk."
```

**When invoked:**
- **Auto:** every BUY-band decision (`dealQuality ≥ 80`) — sanity check before user sees a strong recommendation
- **Manual:** user requests "critique this analysis"
- **Batched:** periodic offline pass over recent decisions for substrate seeding (cost-controlled)

**Allowed tools:**
- `render_audit_trail` (to inspect the decision being critiqued)

**Prompt structure:**

```
System (cached): You are a deliberate adversarial critic. You are not the
                 platform — you are a thinking exercise that stress-tests
                 the platform's verdicts.

                 You will be assigned one of two personas. Stay in persona.
                 Your output is a structured critique, not a categorical
                 verdict and not a score modification.

                 You do not have access to score_deal. The dealQuality
                 score is the engine's output and is not modifiable by you.
                 Your role is to produce structured disagreement signal
                 that surfaces alongside the score.

                 [Persona prompt — inserted at runtime]
                 [Critique output schema]

Persona: <optimistic_flipper | skeptical_cpa>

Decision to critique: <decision payload>
Audit trail: <render_audit_trail output>
```

**Output schema (tool-use forced):**

```ts
type CritiqueOutput = {
  agreementWithOriginal: boolean;
  severityScore: number; // 0-100, how strongly the persona disagrees
  divergenceReasons: string[]; // Specific points of disagreement
  alternativeAssumptions: {
    fieldPath: string;
    suggestedValue: number | string | boolean;
    reasoning: string;
  }[];
};
```

**Events emitted:** `CritiqueEvent` per invocation (via orchestrator).

**Cost discipline (cross-link to [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md)):**
- Opus 4.7 is expensive (~$0.05-0.15 per critique)
- Auto-invocation only on BUY-band (rare)
- Manual invocation gated by tier (free / retail = limited; B2B = generous)
- Batched runs run off-peak and respect per-org cost caps

**4-week kill criterion (per thesis §5.5):** if neither persona produces useful disagreement signal (operationalized as `severityScore > 40 AND agreementWithOriginal=false` on at least 20% of invocations) in the first 4 weeks of running, scope down to one persona or pause. Instrument from day one: aggregate `severityScore` distribution per persona; weekly review.

---

## 5. Prompt structure

Prompts are code. Versioned, testable, regression-checked.

### 5.1 Repository structure

```
backend/src/agents/
├── orchestrator/
│   ├── orchestrator.ts            // Main orchestrator class
│   ├── intentClassifier.ts        // Haiku-based intent routing
│   └── conversationMemory.ts      // Session + per-user memory
├── deal-scoring/
│   ├── agent.ts                   // Deal-scoring agent implementation
│   ├── prompts/
│   │   ├── system.ts              // System prompt (cached)
│   │   ├── personaModifiers.ts    // experienceLevel / investorType / etc. tone modifiers
│   │   └── examples.ts            // Few-shot examples
│   └── __tests__/                 // Golden set + unit tests
├── qa/
│   ├── agent.ts
│   ├── prompts/
│   │   ├── system.ts
│   │   ├── sanitization.ts        // Legal-compliance directive-language patterns
│   │   ├── contentTemplates.ts    // reasoning / actionPlan / capitalStrategy / etc.
│   │   └── personaModifiers.ts
│   └── __tests__/
├── adversarial-critic/
│   ├── agent.ts
│   ├── prompts/
│   │   ├── system.ts
│   │   ├── optimisticFlipper.ts
│   │   └── skepticalCpa.ts
│   └── __tests__/
└── shared/
    ├── promptCache.ts             // Cache-boundary helpers
    ├── streaming.ts               // SSE rendering for content blocks
    └── errorHandling.ts           // Typed errors, retry semantics

backend/src/tools/
├── registry.ts                    // The toolRegistry constant
├── enrichProperty.ts
├── computeAnalysis.ts             // Wraps SFRAnalyzer / MultiFamilyAnalyzer
├── scoreDeal.ts                   // Wraps BaseDecisionEngine — DETERMINISTIC
├── applyOverride.ts
├── profileExtraction.ts           // Uses Haiku 4.5 for parsing
├── recallUserContext.ts
├── saveToWatchlist.ts
├── renderAuditTrail.ts
├── exportAuditPdf.ts
└── __tests__/
```

### 5.2 Separation of concerns within a prompt

Every system prompt separates four parts at distinct cache boundaries:

```
┌─ Cache boundary 1: stable across all sessions ─────────────────┐
│  - Agent persona ("You are the deal-scoring orchestrator...")  │
│  - Output schema definitions                                    │
│  - Tool definitions (Anthropic SDK format)                      │
│  - Few-shot examples                                            │
│  - Sanitization rules / behavioral constraints                  │
└────────────────────────────────────────────────────────────────┘
┌─ Cache boundary 2: stable per user (refreshed on profile update) ┐
│  - User profile (most recent ProfileEvent)                       │
│  - Persona modifier ("This user is experienceLevel=novice...")   │
│  - Recent decision summaries (last 10)                           │
│  - Override patterns (last 20)                                   │
└─────────────────────────────────────────────────────────────────┘
┌─ Cache boundary 3: stable per session ──────────────────────────┐
│  - Active conversation thread (with older turns summarized)      │
└─────────────────────────────────────────────────────────────────┘
┌─ Not cached: per-turn ──────────────────────────────────────────┐
│  - Current user input                                            │
│  - Any tool outputs from this turn                               │
└─────────────────────────────────────────────────────────────────┘
```

This structure aligns with Anthropic's 5-minute prompt cache TTL:
- Boundary 1 is **always cached** between calls within a session — agent persona doesn't change
- Boundary 2 is cached for **multi-turn sessions** — refreshes on profile update or new ProfileEvent
- Boundary 3 is cached for **active dialogue** — invalidates when older turns get re-summarized
- Per-turn content is the only uncached portion

### 5.3 Versioning

Each agent's prompt has an explicit `promptVersion` number on its system module:

```ts
// backend/src/agents/deal-scoring/prompts/system.ts
export const SYSTEM_PROMPT_VERSION = 3;

export function buildSystemPrompt(): string {
  return `You are the deal-scoring orchestrator...`;
}
```

Prompts are tested in CI (golden sets — see [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md)). Version bumps require eval pass.

When a turn is logged in `ConversationEvent`, the `modelUsed` field includes the prompt version: `"claude-sonnet-4-6 / deal-scoring v3"`. This makes it possible to trace conversation quality back to specific prompt versions.

### 5.4 Persona modifiers

Persona-aware tone changes happen via **prompt modifiers**, not separate prompts. Single source of truth for the agent persona; small inserts for user-specific tone.

```ts
// backend/src/agents/qa/prompts/personaModifiers.ts
export function getToneModifier(profile?: ProfilePayload): string {
  if (!profile?.experienceLevel) return '';
  switch (profile.experienceLevel) {
    case 'novice':
      return `\n\nThis user is new to real estate investing. Use plain language. Define terms inline. Lead with education before specifics.`;
    case 'experienced':
    case 'expert':
      return `\n\nThis user is fluent in real estate investing terminology. Get to the point. Skip basic education.`;
    default:
      return ''; // intermediate uses default tone
  }
}
```

Same pattern for `investorType` (B2B vs retail tone), `primaryGoal` (which scoring factors to emphasize), etc.

---

## 6. MCP server interface

Per [PRODUCT_2.0_ARCHITECTURE.md §7](PRODUCT_2.0_ARCHITECTURE.md), MCP is the primary edge protocol. A2A and OpenAI Assistants adapters deferred.

### 6.1 What gets exposed

The same `toolRegistry` from §3.4 is the source of truth. The MCP server wraps each tool:

```ts
// backend/src/mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk';
import { toolRegistry } from '../tools/registry';

const mcpServer = new McpServer({ name: 'reanalyzr', version: '0.1.0' });

for (const [name, tool] of Object.entries(toolRegistry)) {
  mcpServer.registerTool({
    name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.inputSchema),
    handler: async (input, mcpContext) => {
      const ctx = adaptMcpContextToToolContext(mcpContext);
      return await tool.execute(input, ctx);
    },
  });
}
```

### 6.2 Authentication

MCP clients authenticate via API key tied to a user account. The tool context derives `userId` and `institutionId` from the API key's owning account.

Wave 1: own-platform users only. External MCP clients hitting the same endpoint with a user's API key get the same tool access the user has in the platform (with the same rate limits and cost budgets).

### 6.3 What's NOT exposed via MCP

- Adversarial critic agent (this is the platform's internal reasoning layer; clients get the resulting `CritiqueEvent` data via `render_audit_trail` if they want it)
- Q&A agent (this is the platform's chat reasoning layer; clients use their own LLMs)
- Orchestrator (no need for external clients to use our routing)

**The MCP edge exposes tools, not agents.** External clients bring their own reasoning; we provide the calibrated tools.

### 6.4 Future A2A and OpenAI Assistants adapters

Same pattern. The `toolRegistry` is the source of truth. Each protocol (MCP / A2A / Assistants) is an edge adapter layered on the registry. When a standard converges, we swap adapters, not architecture.

---

## 7. Streaming and cancellation

### 7.1 Streaming model

Agents stream responses via Anthropic SDK streaming API. The orchestrator forwards content blocks to the client surface via SSE.

**Content block types in the stream:**
- `text` — agent prose
- `tool_use` — tool invocation (transparent to client; orchestrator handles, sends results back to agent)
- `tool_result` — tool output back to agent (also transparent to client)
- `structured_output` — typed structured content (verdict card, override slider, etc.) — client renders as React component

The client doesn't see `tool_use` / `tool_result` blocks. It sees `text` and `structured_output`. Tool execution is server-side.

### 7.2 Cancellation

User closes the chat surface or presses cancel:

1. Client closes the SSE stream
2. Server detects close → aborts in-flight Anthropic SDK call (via AbortController)
3. Anthropic stops generation; final token count is captured up to the cancellation point
4. `ConversationEvent` is written with `cancelled: true`, partial token usage, partial response text
5. No more tokens billed; no half-rendered structured outputs persist client-side

Tool calls that were already in-flight at cancellation complete (we don't kill database writes mid-transaction). Their events still emit, with the same traceId so the cancelled turn's effects are traceable.

---

## 8. Observability

Cross-link to [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md) for cost tracking; cross-link to [PRODUCT_2.0_EVENTS_STORE.md §11.1](PRODUCT_2.0_EVENTS_STORE.md) for testing.

### 8.1 Per-trace correlation

Every chat turn gets a `traceId` (UUID v4) at orchestrator entry. The traceId propagates through:
- Intent classifier call
- Agent invocation
- All tool calls within that turn
- All event emissions

To debug a single turn: query events store by `traceId` → get the full graph of what happened.

### 8.2 Token usage tracking

Every Anthropic SDK call emits token usage. The orchestrator aggregates per turn and writes to `ConversationEvent.tokenUsage`:

```ts
tokenUsage: {
  inputTokens: 4521,
  outputTokens: 312,
  cachedTokens: 3890,
  estimatedCostCents: 4, // Computed at write time per model pricing
}
```

Aggregated views:
- Per-user monthly cost
- Per-agent cost distribution
- Cache hit rate (cachedTokens / inputTokens)
- Average per-query cost vs. per-tier budget

### 8.3 Latency

Per-turn latency tracked: orchestrator-entry → first-content-block → last-content-block. Aggregated as p50 / p95 / p99 dashboards.

Per-tool latency tracked similarly. RentCast / FRED / Census external API latencies surface as the dominant factor — known pain point.

### 8.4 Errors

Typed error counts per agent / per tool. Failure modes:
- Tool retry exhaustion (transient → permanent)
- LLM timeout
- Schema validation failure (tool input/output)
- Substrate write failure
- Cancellation rate (high cancellation rate may indicate slow generation or UX issue)

---

## 9. Testing strategy

Three layers, all cross-linked to [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md).

### 9.1 Tool unit tests

Standard backend unit tests for each tool. In-memory MongoDB for events; mock external APIs; verify input/output schema validation.

### 9.2 Agent integration tests

Mock the LLM (Anthropic SDK) with deterministic responses. Verify:
- Agent calls the right tools in the right order
- Agent handles tool failures gracefully
- Agent emits the expected events
- Agent's output structure is well-formed (renders correctly in mock client)

Important: **don't test agent reasoning quality here.** That's the eval doc's job. Integration tests verify wiring, not intelligence.

### 9.3 End-to-end golden sets

See [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md). Real LLM calls; small curated test set; gates PR merges on regression.

---

## 10. Open questions still to resolve

These don't block the agent mesh from shipping — they need answers before specific downstream features.

1. **Per-session memory store: Redis or just events-store reads on each turn?** Redis is faster but adds infra. Events-store reads are slower but no new dependency. Bias: start with events-store reads, profile, add Redis only if needed.

2. **Multi-agent flows across turns.** When a chat turn triggers deal-scoring → Q&A explanation → user override → adversarial critic, all in one user-perceived "conversation," how do we present this in the UI? Currently designed as one orchestrator-routed sequence per turn; multi-step flows may need a different UI affordance.

3. **Streaming structured outputs.** Anthropic's tool-use API doesn't natively stream structured outputs the way it streams text. We need to either (a) wait for the full structured output before rendering, or (b) render partial structured outputs as fields arrive. Option (b) is significantly better UX. Implementation complexity needs scoping.

4. **MCP authentication for external clients.** API key + rate limits is the wave 1 answer. For B2B clients in pilot, we may need scoped API keys (read-only vs. full access) and per-tool permission lists. Wave 2 consideration.

5. **Prompt cache cost / hit-rate validation.** The cache-boundary design in §5.2 assumes Anthropic's prompt cache delivers ~95% hit rate after warm-up. Validate empirically in first 2 weeks of running; tune boundaries if hit rate is lower.

---

## 11. Changelog

- **2026-05-10 (v1):** Initial draft. Orchestrator (intent classifier, routing, conversation memory, streaming, error handling), tool registry pattern with 9 wave-1 tools, three agent specifications (deal-scoring, Q&A, adversarial critic), prompt structure with explicit cache boundaries, MCP server interface, streaming and cancellation semantics, observability, testing strategy.
