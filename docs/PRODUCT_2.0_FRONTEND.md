# REanalyzr 2.0 — Frontend

**Document type:** Companion doc to [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) §11
**Authored:** 2026-05-10
**Status:** Draft 1
**Owns:** Chat-native overlay UX, inline structured controls, mobile patterns, voice input, streaming UI, strangler-fig integration with existing wizard

---

## 0. Scope and non-scope

**This doc covers:**
- Routing — what surfaces exist at which paths
- Cold-start surface (the open-input chat at `/app`)
- Inline structured controls — the React components rendered in the chat thread
- Mobile patterns — property-tour use case, cellular streaming, voice input
- Streaming UI patterns — token-by-token rendering, partial structured outputs
- Offline + sync for the mobile-tour scenario
- Strangler-fig integration — coexistence with existing `/sfr-analysis` wizard
- State management for the chat thread
- Accessibility considerations

**Out of scope (lives elsewhere):**
- Backend agent specs — see [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md)
- Event schemas the frontend consumes — see [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md)
- Marketing homepage at `reanalyzr.com` — stays as-is per thesis non-negotiable; not touched
- Affiliate landing pages (e.g., `theficouple.reanalyzr.com`) — existing routing unchanged
- Login/auth surfaces — minor copy-only changes already landed (PR #1); no further changes in scope
- Frontend component library / design system — assumes Apple-design-system patterns already in place

---

## 1. Routing — what lives where

```
PUBLIC SURFACES (anonymous)
reanalyzr.com/                          ← LandingPage (positioning unchanged; hero
                                          embeds chat input — wave 1 change)
reanalyzr.com/brrrr-calculator          ← SEO wrapper around LandingPage
                                          (inherits hero-chat-embed automatically)
reanalyzr.com/cap-rate-calculator       ← SEO wrapper around LandingPage
                                          (inherits hero-chat-embed automatically)
reanalyzr.com/rental-property-calculator ← Separate landing with custom hero
                                          (gets chat embed too, for consistency)
reanalyzr.com/sample-analysis           ← Guided pre-baked walkthrough (UNCHANGED)
reanalyzr.com/pricing                   ← UNCHANGED
reanalyzr.com/blog, /blog/:slug         ← UNCHANGED
reanalyzr.com/login                     ← Magic-link auth (UNCHANGED post PR #1)

DEPRECATED IN WAVE 1 (no users, no SEO traffic):
reanalyzr.com/calculator                ← REMOVED in wave 1
reanalyzr.com/calculator/brrrr          ← REMOVED in wave 1
reanalyzr.com/calculator/buy-hold       ← REMOVED in wave 1

NEW IN WAVE 1:
reanalyzr.com/app                       ← Chat surface (full-screen, persistent)

LOGGED-IN SURFACES (auth required)
reanalyzr.com/dashboard                 ← UNCHANGED
reanalyzr.com/sfr-analysis              ← SFR wizard (UNCHANGED; instrumented in wave 1.5)
reanalyzr.com/mf-analysis               ← MF wizard (UNCHANGED; instrumented in wave 1.5)
reanalyzr.com/portfolio                 ← UNCHANGED (wave 2 gets agent overlay)
reanalyzr.com/pipeline                  ← UNCHANGED (wave 2 gets agent overlay)
reanalyzr.com/saved-properties          ← UNCHANGED
reanalyzr.com/analysis/:id              ← UNCHANGED
reanalyzr.com/profile, /settings        ← UNCHANGED

AFFILIATE SUBDOMAINS
theficouple.reanalyzr.com/              ← AffiliateLandingPage (UNCHANGED)
                                          Per-affiliate migration to /app is wave 2+
```

**Wave 1 routing changes are narrow:**
1. Add `/app` (new chat surface)
2. Modify `LandingPage` to embed chat in the hero where `<UniversalCalculator />` currently lives (single change point — line 450 of LandingPage.tsx cascades to `/`, `/brrrr-calculator`, `/cap-rate-calculator`)
3. Modify `RentalPropertyCalculatorPage` similarly (separate file; same chat-embed pattern)
4. Remove `/calculator`, `/calculator/brrrr`, `/calculator/buy-hold` routes (zero-impact: no users, SEO traffic lands on wrapper pages instead)

**Affiliate landing routing:** existing affiliate detection (in [affiliateDetector.ts](../frontend/src/utils/affiliateDetector.ts)) continues to work. CTAs that previously routed to `/sfr-analysis` continue routing there until per-affiliate migration to `/app` (wave 2 decision per affiliate).

**SFR and MF wizards both stay operational.** Strangler-fig applies symmetrically. Both backends are instrumented in wave 1.5 to emit the same substrate events (`AnalysisEvent` + `DecisionEvent`) that `tool:score_deal` produces from chat — cross-surface consistency.

---

## 2. Cold-start surface — open input chat

The cold-start surface has **two entry shapes**:

1. **Hero embed on LandingPage / wrapper pages** (`/`, `/brrrr-calculator`, `/cap-rate-calculator`, `/rental-property-calculator`) — chat input lives directly in the hero, replacing the embedded `<UniversalCalculator />`. On first submit, redirects to `/app` with the user's input pre-loaded and the agent's first turn already in flight.

2. **Standalone `/app` route** — full-screen chat surface for returning users, logged-in users, and anyone navigating directly. Same chat agent, same structured controls.

Both entry shapes use the same backend orchestrator and same agent stack. The hero embed is **just the first turn of a chat conversation** — the redirect to `/app` is seamless because the input is forwarded as the first ConversationEvent of that session.

Per [PRODUCT_2.0_ARCHITECTURE.md §11.2](PRODUCT_2.0_ARCHITECTURE.md): open input, no upfront form. The agent extracts intent from whatever the user types.

### 2.1 Initial render

When a first-time visitor lands on `/app`:

```
┌──────────────────────────────────────────────────────────┐
│ REanalyzr      [Watchlist]  [Portfolio]  [Account]       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│                                                           │
│  Hi — I'm REanalyzr's underwriting agent.                │
│  Tell me about a property you're considering, or         │
│  share a bit about yourself.                             │
│                                                           │
│  Examples:                                                │
│   "1837 Walnut Way, Anna TX — listed at $425K"           │
│   "I have 3 rentals in Phoenix, looking at #4"           │
│   "I'm a credit-union lender evaluating a deal"          │
│                                                           │
│  Prefer a form? Use the [classic wizard].                │
│                                                           │
│  ─────────────────────────────────────────               │
│                                                           │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ 💬 Type or paste a property...        🎤    [send →]     │
└──────────────────────────────────────────────────────────┘
```

The greeting + examples + classic-wizard link are static and persistent across sessions (no animation, no progressive reveal). The user types into the input at the bottom, sends, and the agent responds.

### 2.2 Activation moment

Per the architecture non-negotiable: **first turn must produce a visible substrate write.** The agent's first response signals to the user that the system received and acted on their input. Concretely:

- User types an address → enrichment runs → analysis emits → agent responds with `<DealScoreCard>` (visible substrate write: AnalysisEvent + DecisionEvent)
- User shares profile context → profile extraction emits → agent responds "Got it — 3 rentals in Phoenix, looking at #4. Noted. What property are you considering?" (visible substrate write: ProfileEvent)
- User shares both → both substrate writes; agent responds with `<DealScoreCard>` + profile acknowledgment

In all cases, the user sees that *something happened* on the first turn. No empty waiting state without progress.

### 2.3 Returning users

When a logged-in user returns to `/app`:

- Active session within last 24h → conversation thread restored from `ConversationEvent`s (`tool:get_conversation_history`)
- Older session → fresh chat; greeting changes from generic to "Welcome back. Want to keep working on [most-recent-property], or start fresh?"
- User context (profile, recent decisions, override patterns) is loaded silently into agent context via `tool:recall_user_context` at session start

Conversation thread restoration is bounded: load up to last 50 turns; older turns are accessible via "load earlier" affordance but not loaded by default (context window discipline).

### 2.4 B2B-routed users

Users arriving from B2B demo links (e.g., `/app?ref=demo` or `/app?lender=acme-cu`) get a slightly different greeting:

```
Welcome — REanalyzr's underwriting agent.
Set up for [Acme Credit Union evaluation].

Paste a deal or describe what you're analyzing. The audit trail
will be ready when you are.
```

Backend captures `ProfileEvent` with `investorType: 'lender'` + `institutionContext.name: 'Acme Credit Union'` from the URL parameter. Persona-aware tone kicks in immediately (audit-trail-prominent framing, regulatory-language calibration).

---

## 3. Inline structured controls

The architecturally important distinction between "chat with prose" and "chat-native with embedded controls": **agents emit React components rendered in the chat thread**, not just text and not just markdown blocks.

### 3.1 Why this matters

A verdict card rendered as markdown is just text. A verdict card rendered as `<DealScoreCard>` is:
- Interactive (tap to expand, swipe to override on mobile)
- Structurally tied to the underlying DecisionEvent
- Updatable in place (e.g., when user overrides an assumption, the same card re-renders with the new score)
- Mobile-optimized (collapses by default on small screens; touch targets sized correctly)
- Accessible (proper ARIA roles, keyboard navigation)
- Themable (matches the platform's design system)

Markdown can't do any of these things. The chat-native distinction is enforced at the rendering layer.

### 3.2 Component catalog

Wave 1 inline structured controls:

| Component | Triggered by | Purpose |
|---|---|---|
| `<DealScoreCard>` | Deal-scoring agent emits after `score_deal` returns | Shows dealQuality + label + color + key metrics + walk-away. Tappable to expand. |
| `<AssumptionsPanel>` | User taps "Show assumptions" on DealScoreCard | Lists every assumption used in scoring, organized by category. Each is over-rideable. |
| `<OverrideSlider>` | User taps an assumption to override | Inline slider or input for editing a specific value (rent, vacancy, rate). Submit triggers `apply_override` tool. |
| `<SaveButton>` | Deal-scoring agent suggests saving | "Save to watchlist" or "Save to portfolio" with portfolio picker if applicable |
| `<ExportButton>` | B2B users or audit-trail flow | Triggers PDF export; renders progress indicator |
| `<AuditTrailPanel>` | User asks "show me the assumptions" or audit-trail view | Full event-sourced view: decision + analysis + overrides + critiques + sign-offs |
| `<CritiquePanel>` | Adversarial critic emits CritiqueEvent | Shows persona name + disagreement points + alternative assumptions. Collapsed by default. |
| `<PropertyPreview>` | Deal-scoring agent emits during enrichment | Lightweight preview while full analysis runs — address, basic facts |
| `<ErrorBanner>` | Tool failure or transient error | User-recoverable: shows clarifying question. System: shows generic error + support contact |

### 3.3 Emission protocol

Backend agents emit structured outputs as content blocks within the streaming SSE response. Each block has a type discriminator:

```json
{
  "type": "structured_output",
  "componentType": "DealScoreCard",
  "props": {
    "dealQuality": 67,
    "qualityLabel": "Meets professional standards",
    "qualityColor": "yellow",
    "keyMetrics": { "cashFlow": -120, "capRate": 5.2, "dscr": 1.18 },
    "walkAwayPrice": 385000,
    "criticalFlags": [],
    "decisionId": "<ObjectId>",
    "dealId": "<ObjectId>"
  }
}
```

Frontend has a dispatcher that maps `componentType` → React component, validates `props` against the component's Zod schema, and renders. Unknown `componentType` falls back to text rendering with a logged warning (forward compatibility for wave 2 additions).

### 3.4 Streaming order

Within a single agent turn, content blocks stream in order:

```
[text]              "Pulled data on 1837 Walnut Way."
[structured_output] PropertyPreview { ... }   ← rendered while analysis runs
[text]              "Running the analysis..."
[structured_output] DealScoreCard { ... }      ← appears when score is ready
[text]              "Walk-away is $40K below asking — that's negotiation room.
                     Want to change an assumption, or see the full breakdown?"
```

User sees progress in real time. Partial-structured-output rendering (filling in DealScoreCard fields as they arrive) is deferred — wave 1 ships with all-or-nothing structured outputs. **Per [PRODUCT_2.0_AGENT_MESH.md §10 open question #3](PRODUCT_2.0_AGENT_MESH.md), partial structured outputs are a wave 1.5 / 2 enhancement.**

---

## 4. Mobile patterns

Anchored in Sterling apple's mobile-AI expertise (per CLAUDE.md persona). Critical user contexts:

1. **Property tour** (40%+ traffic): poor cellular, one-handed, time-pressure
2. **Office / desk** (50%): same chat surface, larger viewport, both hands
3. **B2B audit-trail consumption on mobile** (loan officer at closing site): may be offline, needs audit trail to load from cache

### 4.1 Responsive breakpoints

| Viewport | Layout |
|---|---|
| ≥1024px (desktop) | Two-pane optional: chat thread + persistent property preview on right |
| 768-1023px (tablet) | Single-column chat with full-width structured controls; mobile patterns apply with more breathing room |
| 375-767px (mobile) | Single column, full screen chat. Bottom nav. Voice button prominent. |
| 320-374px (smallest phones) | Single column, denser. DealScoreCard collapses to score + label only by default. |

### 4.2 Mobile chat thread

```
┌──────────────────────────────────────┐
│ ☰  REanalyzr            👤           │
├──────────────────────────────────────┤
│                                       │
│ [user] 1837 Walnut Way, Anna TX...   │
│                                       │
│ [agent] Pulled data on 1837 Walnut.  │
│                                       │
│ ┌──────────────────────────────┐    │
│ │  67/100                       │    │
│ │  Meets professional standards │    │
│ │  ─────────────                │    │
│ │  Cash flow:  -$120/mo         │    │
│ │  Cap rate:   5.2%             │    │
│ │  Walk-away:  $385K            │    │
│ │  [Tap for details]            │    │
│ └──────────────────────────────┘    │
│                                       │
│ [agent] Walk-away is $40K below      │
│ asking. Want to override an          │
│ assumption?                          │
│                                       │
├──────────────────────────────────────┤
│ 💬 Reply...               🎤  ↑     │
├──────────────────────────────────────┤
│ Chat  Watchlist  Portfolio  Account  │
└──────────────────────────────────────┘
```

Bottom navigation persistent on small viewports. DealScoreCard collapses to score + label + 2-3 metrics + tap-to-expand affordance on mobile.

### 4.3 Voice input on mobile

Property-tour use case: one-handed, walking through a property, dictating details.

**Voice flow:**
1. User taps mic icon next to input
2. Native STT (Apple Speech / Android SpeechRecognizer) for transcription — no cloud round-trip, no streaming latency, works offline
3. Transcribed text appears in input field, user can edit before send
4. On send, normal chat flow proceeds

**Why native STT, not cloud:**
- Latency: ~200ms native vs. ~800-1500ms for cloud round-trip on cellular
- Offline capability: works in basements, rural areas, weak cellular
- Cost: free (vs. $0.006/minute for Whisper)
- Privacy: speech doesn't leave device until user hits send

Cloud STT (Whisper / Anthropic / OpenAI) reserved for edge cases where native STT has too-low accuracy (heavy accents, technical real estate terminology). Defer that decision to wave 2 based on real user data.

### 4.4 Touch targets and gestures

Per Sterling apple's mobile-AI standards in CLAUDE.md:

- Minimum touch target 48px (Apple HIG / Material Guidelines)
- Spacing between targets ≥8px
- Long-press on a metric → "show me the assumption used here" → AssumptionsPanel surfaces
- Swipe-right on DealScoreCard → "Save to watchlist" action
- Swipe-left on DealScoreCard → quick override flow (most-overridden field first)
- Pull-to-refresh on chat thread → re-sync conversation from server

### 4.5 Cellular streaming patterns

Per Sterling apple's mobile-AI expertise:

- SSE connection on Wi-Fi or cellular, with auto-resume on cellular handoff
- Server-side stream checkpointing: every N tokens, server flushes a `checkpoint_id` in the stream; client stores it; on reconnect, resume from last checkpoint
- Cancellation: when user navigates away or backgrounds the app, client cancels the stream cleanly (no zombie generation accumulating cost)
- Heartbeat pings every 15s during long generations to keep cellular middleware from closing the connection prematurely

### 4.6 Token-cost awareness in mobile UX

Don't surface cost to users (it's confusing and creates choice fatigue), but architect for cost reality:

- DealScoreCard renders the score immediately on completion — don't wait for adversarial critique (which adds $0.11/critique). Critique surfaces as a separate `<CritiquePanel>` later in the thread if/when it runs.
- "Run full analysis" vs. "quick estimate" toggle on the property capture flow — quick estimate uses fewer agent turns, no critique, suitable for casual screening at scale during a property tour. Full analysis is for the deal you're actually considering.
- Progressive disclosure of expensive operations: PDF export, audit-trail-with-all-overrides view, multi-deal batch — these surface as explicit user actions, not auto-runs.

---

## 5. Streaming UI patterns

### 5.1 Token-by-token rendering

Agent text streams in token-by-token via SSE. Render as tokens arrive — don't buffer. Buffering >100ms feels "stuck" to users in chat.

Cursor animation (blinking pipe `|`) at the end of streaming text while generation continues. Disappears when the agent's turn ends.

### 5.2 Structured output rendering during stream

While the agent is in the middle of a turn:

- Text content blocks render incrementally
- Structured outputs render when fully arrived (all-or-nothing in wave 1; partial-fields rendering in wave 1.5+)
- Tool calls and tool results are NOT shown to the user — they're internal to the agent. User sees text and structured outputs only.

### 5.3 Cancellation

Cancel button visible during active generation:

```
[agent generating...]                          [⏹ Stop]
```

Tap to cancel. Server stops generation; partial content stays visible; turn marked cancelled in ConversationEvent.

No "are you sure?" prompt — single tap. Cancellation should be friction-free.

### 5.4 Error rendering

| Error type | UI surface |
|---|---|
| Transient (RentCast / FRED 5xx) | Inline `<ErrorBanner>` with retry button; doesn't disrupt conversation flow |
| LLM timeout | "Taking longer than usual..." then either resume or graceful fail message |
| System failure | Generic "Something went wrong. Try again or [contact support]." Conversation thread preserved. |
| User-recoverable (invalid address) | Agent surfaces in text: "I couldn't find that property. Can you confirm the address or share more detail?" |
| Cost cap hit | "Analysis exceeded cost limits — partial result shown. [Upgrade for full analysis]" with tier-appropriate framing |

---

## 6. Offline + sync for mobile

Property-tour use case: user walks into a basement or rural property with no cellular signal. The platform should degrade gracefully.

### 6.1 Offline capabilities

| Capability | Offline behavior |
|---|---|
| View prior analyses | ✅ Cached substrate events render the prior analyses; chat history available |
| Capture a new property | ✅ Queue the input locally; sync on reconnect; agent runs server-side analysis when sync completes |
| Voice input | ✅ Native STT works offline; transcription queues with the property input |
| Run a new analysis | ❌ Requires enrichment + LLM agent — both online-only. UI shows "Captured. Analysis will run when you're back online." |
| View audit trail | ✅ If audit trail was loaded earlier in the session, cached for offline review (B2B field-use requirement) |
| Override an assumption | ⚠️ Queues the override; warns "Override will apply when you're back online" |

### 6.2 Sync conflict resolution

If a user makes changes on two devices in close succession (e.g., overrides on phone while desktop chat has the same deal open):

- Last-write-wins is WRONG (the agent mesh doc captures this as a design principle)
- Both writes produce `OverrideEvent`s with the same `originalDecisionId` but different `traceId`s
- UI surfaces the conflict: "Two edits to the same field — keep [my phone's version] or [my desktop's version]?"
- Reconciliation goes through a deliberate UI choice; resolution writes a third OverrideEvent that supersedes both
- Substrate retains all three events — no data loss

### 6.3 Sync queue UX

When offline:
- Captured properties show pending indicator in the watchlist / chat thread
- "3 items waiting to sync" badge in the bottom nav
- On reconnect, sync starts automatically; progress indicator briefly visible
- On sync failure, items stay queued with retry option

---

## 7. Strangler-fig integration

### 7.1 Wizard route stays operational

Existing `/sfr-analysis` wizard at [pages/SFRAnalysis.tsx](../frontend/src/pages/SFRAnalysis.tsx) **is not touched in wave 1.** Continues to serve users who prefer forms. The cold-start at `/app` includes a small "Prefer a form? Use the [classic wizard]" link that single-clicks into the wizard.

### 7.2 Shared substrate

When the wizard completes an analysis, it emits the same substrate events as the chat surface — `AnalysisEvent` + `DecisionEvent`. This means:

- A user who runs an analysis via wizard, then later opens chat, sees the prior analysis in their context (`recall_user_context` pulls recent decisions regardless of source)
- Chat can answer "why did this score 67?" about a wizard-completed analysis seamlessly
- Override flows work cross-surface — override via chat, see updated value reflected in wizard's display

Implementation: wizard backend completion handler is instrumented to call `eventsRepo.writeAnalysisEvent` + `writeDecisionEvent` in the same shape the new `tool:score_deal` does. Existing wizard UI unchanged.

### 7.3 Promotion path (deferred)

Eventually the wizard may be deprecated when chat coverage is comprehensive and conversion data supports the migration. **This is a wave 3+ decision, not part of this rewrite.** The strangler-fig discipline: never delete the old until the new has fully replaced its capability AND traffic has migrated naturally AND data supports the deprecation.

For wave 1 + 2, the wizard is a feature, not technical debt.

### 7.4 Affiliate landing pages

Existing affiliate detection routes traffic to the appropriate landing page (e.g., `theficouple.reanalyzr.com`). Wave 1 changes nothing about this flow. Affiliate landing CTAs continue to route to `/sfr-analysis` until each affiliate's flow is explicitly migrated to `/app` (wave 2+).

**Migration trigger:** affiliate partners may request migration to chat when they see retention data improve for chat-onboarded users. Wave 2 work.

### 7.5 Hero embedded chat — single change point in LandingPage

The hero embed replaces the existing `<UniversalCalculator />` widget at line 450 of [LandingPage.tsx](../frontend/src/pages/LandingPage.tsx). Three routes inherit this change for free:

| Route | Mechanism |
|---|---|
| `/` (HomeRouteSelector → LandingPage) | Direct render |
| `/brrrr-calculator` | [BRRRRCalculatorPage](../frontend/src/pages/BRRRRCalculatorPage.tsx) imports and renders LandingPage with BRRRR-specific Helmet meta |
| `/cap-rate-calculator` | [CapRateCalculatorPage](../frontend/src/pages/CapRateCalculatorPage.tsx) — same pattern |

[RentalPropertyCalculatorPage.tsx](../frontend/src/pages/RentalPropertyCalculatorPage.tsx) is the outlier — uses its own custom hero rather than wrapping LandingPage. Same chat-embed pattern applies (replace `<UniversalCalculator />` in its hero too) but it's a separate code change. Single chat-embed React component, used in both LandingPage and RentalPropertyCalculatorPage.

**Standalone `/calculator`, `/calculator/brrrr`, `/calculator/buy-hold` routes are removed** in wave 1. Zero-impact: no users, no SEO traffic landing on these routes (SEO traffic lands on the wrapper pages above). Removing them simplifies the routing surface and eliminates a parallel calculator-only UX that no longer serves a purpose.

**Hero embed component behavior:**
- Accepts user input (text or voice)
- On submit, generates a session UUID, stores the first input + sessionId in sessionStorage, redirects to `/app?session=<id>`
- `/app` reads sessionStorage on mount, kicks off the chat agent's first turn using the stored input (no double-render, no second input prompt)
- If user backs out before submit, sessionStorage is cleared on page hide

**Cost discipline at first-touch:** see [PRODUCT_2.0_COSTS.md §5.1](PRODUCT_2.0_COSTS.md) for first-touch homepage chat cost considerations and rate-limiting recommendations. Hero embed requires at least 5 characters of input before "send" enables — anti-bot, anti-accidental-trigger.

---

## 8. State management

### 8.1 Architecture

| State | Location | Refresh trigger |
|---|---|---|
| Active chat thread (current session) | React state + IndexedDB persistence | New turn arrives; user input committed |
| User context (profile, recent decisions, overrides) | Loaded once per session into React Query cache | Session start; ProfileEvent emission |
| Cached substrate events (for offline viewing) | IndexedDB | Background sync; explicit refresh |
| UI state (component collapse/expand, scroll position) | React state, ephemeral | User interaction |
| Auth + session | Existing AuthContext, untouched | Login / logout |

### 8.2 Why not redux

Wave 1 frontend state can be handled with React Context + React Query without redux. Chat state is per-session and ephemeral; long-term data lives in the substrate (server-side); UI state is local. Redux's complexity isn't earned.

If wave 2 introduces complex multi-pane state (chat + open portfolio dashboard + open pipeline view simultaneously), revisit.

### 8.3 IndexedDB usage

For offline + mobile:

- Last 50 ConversationEvents per session cached locally for offline browsing
- Decision payloads for the user's watchlist + recent decisions cached for offline review
- Audit-trail bundles for B2B users cached for field consumption
- Queued offline writes (property captures, overrides) cached pending sync

Storage budget: ~10MB per user. Well under browser limits.

---

## 9. Accessibility

The chat surface must meet WCAG 2.1 AA at minimum. Specific concerns:

- Live regions (`aria-live`) on the chat thread for screen-reader announcement of incoming agent responses
- Structured output components have proper ARIA roles (`role="region"` with descriptive labels)
- Keyboard navigation through the chat thread (arrow keys to traverse turns)
- Tab order respects visual hierarchy
- Color is never the only indicator (DealScoreCard's red/yellow/green has parallel text labels)
- Voice input respects `prefers-reduced-motion` for any UI feedback animations
- Focus management: when an agent turn completes, focus does NOT move to the input automatically (disrupts screen readers); user explicitly tabs/clicks back

Specific structured outputs:

- `<DealScoreCard>`: announced as "Deal quality score 67 out of 100, meets professional standards. Tap to expand details." Score numeric value provided via `aria-label` redundancy.
- `<AssumptionsPanel>`: each row is a `role="listitem"` with field name and value as separate `aria-label`s
- `<OverrideSlider>`: standard slider semantics (min/max/step/aria-valuenow)

---

## 10. Testing

### 10.1 Component-level tests (existing patterns)

Standard React component tests with `@testing-library/react`. Each inline structured control gets:
- Renders with expected props
- Interactive behavior (taps, swipes, keyboard)
- Accessibility (axe-core integration)
- Mobile responsive variants

### 10.2 Chat thread integration

Integration tests with mock orchestrator backend:
- Send a message → expect text streaming → expect structured output rendering
- Cancel mid-stream → verify partial content stays + no zombie state
- Reload chat surface → verify thread restoration from cached / server data

### 10.3 E2E (Cypress)

Critical paths:
- Cold-start: open `/app`, type address, verify DealScoreCard appears with valid props
- Strangler-fig: complete analysis via wizard, then open chat, verify recent decision context loads
- Mobile viewport: voice input → property analysis → save to watchlist (full happy path)
- Offline: simulate offline state, queue an override, simulate reconnect, verify sync

### 10.4 Cross-browser + cross-device

- Safari (iOS) — primary mobile target
- Chrome (Android) — secondary mobile target
- Chrome / Safari / Firefox desktop
- Real-device testing for at least one Android model and one older iOS device (iPhone SE / 12 mini as proxy for "5-year-old phone with limited memory")

---

## 11. Open questions

1. **Two-pane desktop layout.** On large viewports (≥1280px), should the chat thread have a persistent right-side panel showing the active property preview (similar to ChatGPT's "canvas" mode)? Pro: less scrolling, more context visible. Con: more layout complexity, harder mobile-desktop consistency. Bias: defer — start with single-column on all viewports; revisit based on user feedback.

2. **Saved-chat history view.** Should there be a "/app/history" view listing all past sessions? Or is in-chat scroll-back sufficient? Implementation cost is moderate (existing ConversationEvent query is well-defined). Wave 2 decision based on real usage.

3. **Multi-property context per turn.** What if user types "Compare 1837 Walnut Way and 1838 Walnut Way"? Agent needs to handle multi-property reasoning. Wave 2 capability — not in wave 1 scope, but the structured output protocol supports it (an array of `<DealScoreCard>` components in one agent response).

4. **Markdown rendering in agent text.** When agent emits text blocks, do we render markdown (bold, lists, links) or treat as plain text? Bias: markdown supported via a safe-list of allowed tags (no raw HTML, no images, no scripts). Limited markdown gives readability without security surface.

5. **Animation defaults.** How animated should the experience be? DealScoreCard appearance, structured-output transitions, score-number counting up to final value. Animations add polish but cost frames on older devices. Default: subtle animations (50-200ms fades), respect `prefers-reduced-motion`. Avoid count-up animations on the score (the number IS the verdict; flashy animation undermines authority).

6. **Returning-user re-engagement.** When a user returns to `/app` after a week, should the agent proactively surface something ("You saved 3 properties last week — want to revisit them?")? Pro: re-engagement value. Con: surface gets noisier; some users will find it manipulative. Bias: deferred — start with reactive (user types first), revisit when retention data justifies proactive prompts.

---

## 12. Changelog

- **2026-05-10 (v1):** Initial draft. Routing (one new route `/app`, everything else unchanged), cold-start surface with open-input chat + activation moment + B2B-routed greeting variant, inline structured control catalog (9 components), mobile patterns anchored in Sterling apple persona expertise (cellular streaming, voice via native STT, touch gestures, token-cost-aware UX), streaming UI patterns (token-by-token, structured outputs, cancellation, error rendering), offline + sync with conflict resolution semantics, strangler-fig integration (existing wizard untouched, shared substrate, deferred promotion path), state management (React + React Query + IndexedDB, no redux for wave 1), accessibility (WCAG 2.1 AA target), testing across component / integration / E2E / cross-device, 6 open questions flagged.
- **2026-05-10 (v1.1):** §1 routing corrected after architect re-read of actual frontend code. The marketing homepage is `LandingPage.tsx` at `/`, which already embeds `<UniversalCalculator />` at line 450; `/brrrr-calculator` and `/cap-rate-calculator` are SEO wrappers around the same LandingPage component; `/rental-property-calculator` is a separate landing page with its own hero. Standalone `/calculator/*` routes deprecated (no users, no SEO traffic). MF wizard at `/mf-analysis` exists and stays operational; both wizard backends instrumented in wave 1.5. §2 (cold-start surface) extended with hero-embed entry shape. New §7.5 details hero embedded chat single change point with route inheritance map and chat-embed component behavior. Earlier "Stories 2.1-2.6 deprecatable" claim retracted.
