# Architecture Principles — reanalyzr

**Authoritative checklist for the Architect persona (and the QE / BE reviews) during any `fix-issue` pipeline run.**

Every principle here is CHECKABLE — a yes/no or does/doesn't-hold question. Aspirational statements ("write clean code") are not principles. If a design cannot answer every applicable principle with a concrete yes or an explicit non-goal, the design is incomplete.

Applies to: all issues under Task #50 arch sprint, all P0 launch-blockers, and any future issue tagged architectural. Not required for docs / typo / cosmetic PRs.

---

## I. Data Integrity

### P1. Single Source of Truth
- **Rule**: Every metric, default, or user-facing value has exactly ONE canonical computation site. Every consumer reads from that site — never recomputes.
- **Why**: Parallel computations drift silently (see #94 → #242, #58 → #102 → #239).
- **Violation example**: `annual_cash_flow` formula tool independently recomputes CF from raw inputs while DecisionEvent already has the value.
- **Enforcement**: Projector pattern (FinancialsView, AssumptionResolver). ESLint rule blocking direct reads of drift-prone substrate paths outside the projector.

### P2. Financial Precision — round only for display
- **Rule**: `Math.round`, `toFixed`, `Math.floor`, `Math.ceil` are FORBIDDEN inside `backend/src/analysis/`, `backend/src/services/investment/`, and any formula in `backend/src/services/dealMetrics/formulas/`. Full floating-point precision must survive to the display formatter.
- **Why**: Sub-cent errors compound across 10-year projections into reconciliation bugs ("annual is $12 off from monthly × 12").
- **Violation example**: `SFRAnalyzer.getExpenseBreakdown` lines 346-349 use `Math.round(x * 100) / 100`.
- **Enforcement**: ESLint rule + code-review gate.

### P3. Substrate is the sole write path
- **Rule**: Every business fact (analysis, decision, conversation, critique) is written to the event-sourced substrate BEFORE any consumer reads it. No consumer-cached "shadow copies" of business facts.
- **Why**: Substrate is append-only, immutable, auditable. Shadow copies drift and can't be reconstructed.
- **Violation example**: A component storing `monthlyAnalysis.cashFlow` in Redux state and later re-rendering from Redux instead of re-reading the DecisionEvent.
- **Enforcement**: All writes go through `EventsRepository.write*`. Grep audit.

### P4. Materialized views never recompute source facts
- **Rule**: The materialized Deal record projects from substrate. It does NOT invent, calculate, or derive facts that aren't in the source events.
- **Why**: Materialization is a read-time optimization. It must be reproducible from events alone.
- **Violation example**: Materializer adjusting NOI upward "because inflation" without a source event carrying that adjustment.
- **Enforcement**: Materializer contract tests replay events → assert materialized Deal is byte-identical.

---

## II. Trust & Determinism

### P5. Deterministic Numbers Rule
- **Rule**: Every dollar / percent / ratio / dollar range in an LLM-generated user-facing message must originate from a tool call return value. LLMs are FORBIDDEN from computing numbers themselves.
- **Why**: LLM arithmetic confabulates confidently (see #226 origin — $253K purchase price hallucinated on $185K deal).
- **Violation example**: LLM writes "the annual cash flow is roughly $1,900" without a tool call producing $1,900.
- **Enforcement**: `numericTraceability` validator scans every LLM message before send; untraceable numbers → warn → block once mature.

### P6. Language Hygiene — no directive verdicts
- **Rule**: The strings "BUY", "PASS", "SELL" as investment recommendations are BANNED in any user-facing surface. Also banned: "deal killer", "the core issue", "flips positive", "worth negotiating", "how you lose deals" — see full list in `backend/src/agents/dealScoring/dealScoringAgent.ts:124-140`.
- **Why**: Legal position: no advice, no directives. Reputation position: honest analytical framing is the moat.
- **Violation example**: Adversarial critic writes "this is a BUY, not a walk-away candidate" (#228 / #97).
- **Enforcement**: QA agent prompt gate + banned-phrase check on every LLM output.

### P7. Honest analysis is the moat
- **Rule**: The engine must be willing to score frequent-low. Fixes that raise scores across the board without a legitimate math reason are FORBIDDEN. Silver-lining narrative on load-bearing failures (e.g., praising capital recovery on a sub-1.0 DSCR deal that won't refinance) is a design bug, not a copy issue.
- **Why**: Cold-traffic paying users are Business Experts. If a deal that's actually bad shows a good score, we get one shot at trust and lose it.
- **Violation example**: LLM narrative calls a deal "structurally sound" while its DSCR is 0.51 (#235 / #216).
- **Enforcement**: Business Expert veto in `fix-issue` pipeline. Adversarial critic + skeptical CPA persona in production.

### P8. Score number + color + contextual label ONLY
- **Rule**: On any user-facing surface where the Deal Quality Score appears, the ONLY permitted elements are: the 0-100 number, its color band (green/blue/orange/red), and its contextual label ("Above/Meets/Requires/Below professional standards"). No verdict badges. No directive next-step CTAs derived from the score.
- **Why**: Legal + brand. Locked in memory 2026-05-15.
- **Violation example**: A workspace element showing "PASS · 62/100 · consider negotiating."
- **Enforcement**: UX Designer persona + code review.

---

## III. Wire Contracts

### P9. Zod at every boundary
- **Rule**: Every crossing between two layers (API, LLM tool, event write, event read, MongoDB round-trip, HTTP response, cross-service call) validates the payload with a Zod schema. No implicit trust of shape.
- **Why**: Wire drift is silent. Field renames don't fail — they just render as blanks.
- **Violation example**: A React component reads `analysis.monthlyCashFlow` with optional chaining. If backend renames to `analysis.monthlyCF`, the component renders empty with no error.
- **Enforcement**: `frontend/src/services/api.ts` wraps all fetches. Backend routes parse `req.body` through Zod. Tools declare Zod input + output.

### P10. Single canonical strategy vocabulary
- **Rule**: The canonical strategy enum is `'buy_hold' | 'brrrr' | 'house_hack'` (snake_case). Every kebab / uppercase / philosophy variant is normalized at the boundary via a single `normalizeStrategy(raw): CanonicalStrategy` helper. Zero raw string comparisons in application code.
- **Why**: Currently three vocabularies exist (#243). The DecisionEvent schema uses PHILOSOPHY names (cashflow / appreciation / balanced) that don't match the type names anywhere else — writes may be garbage.
- **Violation example**: A component does `if (deal.strategy === 'brrrr')` without going through the normalizer.
- **Enforcement**: ESLint rule + Zod schema on all substrate writes.

### P11. Single canonical identity resolver per identity type
- **Rule**: There is exactly one function to derive user identity (`useIdentity`), one to derive deal identity (`resolveDealIdentity`), one to derive session identity. Every consumer branches on the derived state, not on raw signals.
- **Why**: Multi-signal identity drifts across state transitions (#240, #241, #218, #217).
- **Violation example**: A Save handler that checks only `useAuth().user` and misses the case where auth is present but chat session is still ghost.
- **Enforcement**: ESLint rule blocking direct reads of primitive identity signals outside the resolver.

### P12. Field-name aliases must have a canonical projector
- **Rule**: When the same value exists under two names (`newMonthlyPayment` vs `postRefiMonthlyDebtService`), one is canonical and the other is a projected alias. The projection is ONE-directional.
- **Why**: Bi-directional aliases invite two consumers to drift (#253).
- **Violation example**: Two adapters, one converting each way, no test asserting they round-trip.

---

## IV. Read-Path Discipline

### P13. Consumers read through projectors, not raw substrate
- **Rule**: The set of allowed substrate reads is: (a) the projector layer (FinancialsView, DealView, IdentityView), (b) tests, (c) admin scripts. Application code MUST go through the projector.
- **Why**: Direct reads reproduce every consumer's own projection = drift class (#94, #212, #242).
- **Enforcement**: ESLint rule blocks direct reads of e.g. `analysisEvent.payload.monthlyAnalysis.cashFlow` from outside the projector directory.

### P14. Strategy-awareness lives at reads, not writes
- **Rule**: Writes are strategy-agnostic (analyzer writes both pre- and post-refi values). Reads are strategy-aware (projector picks the right slice per phase). No consumer needs a strategy switch.
- **Why**: Distributed strategy switches (e.g., every consumer doing `if (strategy === 'brrrr') read A else read B`) drift as new strategies are added.
- **Violation example**: `ScenarioDetails.tsx` currently has a strategy switch — that logic belongs in FinancialsView.

### P15. Single AssumptionResolver for all input defaults
- **Rule**: When a user doesn't supply an input, the default value comes from `AssumptionResolver.get(inputName, context)`. NO code path (frontend constants, backend defaults, analyzer fallbacks) supplies its own default outside the resolver.
- **Why**: #244–#249 — same input, three or four different defaults per code path, screenshots don't match.
- **Enforcement**: ESLint rule blocking hardcoded defaults in analyzer / component / constants files outside the resolver.

---

## V. Failure Modes

### P16. Silent drops are unacceptable
- **Rule**: Any read that discovers a missing / truncated / malformed field MUST log at WARN level with a counter. A counter exceeding a threshold in prod is a paging event. Frontend consumers must fail visibly (error boundary), not silently blank.
- **Why**: #252 documented a silent drop in the codebase FOR MONTHS. Only surfaced when an engineer read the code.
- **Violation example**: Materializer's `safeParseShape` swallows a missing field and returns undefined without incrementing a counter.

### P17. Fail fast at boundaries, degrade gracefully in narrative
- **Rule**: Zod validation failures at layer boundaries THROW. LLM narrative failures (tool timeout, retry exhaustion) MUST return a coherent user-facing message ("this metric isn't available right now") — never a stack trace, never a null value that renders as blank.
- **Why**: Boundary crashes are catchable and testable. Narrative crashes reach the user.

### P18. Idempotent by design at every claim/merge/sync point
- **Rule**: Ghost-user merges, session claims, LLM tool retries, webhook processing — every operation that could be invoked twice for the same input MUST produce the same result the second time. No double-merge, no double-charge, no duplicate substrate events.
- **Why**: Network retries, browser refreshes, and user impatience mean everything gets called at least once.
- **Enforcement**: Explicit idempotency tests. Session merge idempotence audit is documented as ✓ in #251.

---

## VI. Process

### P19. No ad-hoc fixes for Task #50 issues
- **Rule**: Issues #243–#256 and any future issue tagged under Task #50 MUST go through the `fix-issue` workflow. Ad-hoc edits are FORBIDDEN even for one-line fixes.
- **Why**: Tonight's session shipped patches that turned into #94→#242, #58→#102→#239 regressions. Pipeline enforces persona discipline.
- **Enforcement**: CLAUDE.md rule (2026-07-08 section).

### P20. Every persona validates its domain
- **Rule**: Architect owns design, Engineer owns implementation, QE owns adversarial validation, Business Expert owns real-user outcome. No persona substitutes for another. Business Expert has hard veto.
- **Why**: Skipping personas is how "technically correct but business-wrong" fixes ship.

### P21. Every finding is filed before it's forgotten
- **Rule**: Any bug / drift / concern discovered during any activity MUST be filed in `docs/ISSUE_TRACKER.md` with the required schema (Status / Priority / Component / Description / Business Impact / Proposed Solution). Filing is not optional and is not deferred to "later."
- **Why**: Undocumented findings evaporate. Every regression tonight was found in code that had no test defending against it.

---

## VII. Development Discipline

### P22. Never auto-start dev servers
- **Rule**: Claude and its agents NEVER run `npm run dev`, `npm start`, or otherwise spawn long-running server processes. If a server needs to be running, tell the user to start it.
- **Why**: Multiple background instances, orphan processes, port conflicts.
- **Enforcement**: CLAUDE.md rule. Explicit in the agent-spawning prompts.

### P23. No `git add -A`
- **Rule**: Every commit stages specific files by path. Bulk staging is FORBIDDEN.
- **Why**: Accidental inclusion of secrets / logs / build artifacts / .env / node_modules.

### P24. Frontend API standards
- **Rule**: All frontend API calls use the shared axios instance from `frontend/src/services/api.ts`. `fetch()` is FORBIDDEN. Parallel HTTP-client files are FORBIDDEN. `VITE_API_URL` is the base domain only (no `/api` suffix).
- **Why**: One place for auth headers, retry policy, error handling.
- **Enforcement**: `/docs/FRONTEND_API_STANDARDS.md` + ESLint rule.

### P25. Data validation before persona action
- **Rule**: Personas MUST NOT invent data. When search volumes, traffic numbers, or benchmarks are needed, the persona asks the user for the data or points at a specific tool that will produce it. Presenting made-up numbers as if real is a hard fault.
- **Why**: CLAUDE.md section "CRITICAL RULE FOR ALL PERSONAS: DATA VALIDATION REQUIRED" — landed after a real incident where marketing personas invented search volumes and wasted the user's time.

---

## How the fix-issue pipeline uses this file

**Architect prompt (Phase 1):** *"Verify your design against every applicable principle in `/docs/ARCHITECTURE_PRINCIPLES.md`. For any principle you consciously chose NOT to apply, list it as a non-goal with reasoning."*

**QE prompt (Phase 3):** *"For each principle in `/docs/ARCHITECTURE_PRINCIPLES.md`, check whether the implementation upholds it. Any principle violated without being called out as a non-goal = FAIL."*

**Business Expert prompt (Phase 4):** *"Principles P5, P6, P7, P8 are your domain. Verify the fix doesn't drift on trust guardrails or brand/language rules. Principles P1-P4, P15 affect what an investor sees on screen — verify against a real-user scenario."*

This file is the contract. Principles get added or refined over time — every change to this file is a load-bearing decision and should reference the incident that justified it.

---

**Last updated**: 2026-07-08 — initial extraction from CLAUDE.md + drift audit findings.
