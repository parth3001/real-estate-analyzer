# Engineer Persona — Checkable Rules

**Source**: [CLAUDE.md](../../CLAUDE.md) lines 1324-1408 (Senior Full-Stack Engineer)
**Extracted**: 2026-07-08 (21 rules)

Every rule below is **checkable**. Cited line numbers point to the source in CLAUDE.md.

---

## Code Philosophy

- **ENG-1** — Financial calculations must be deterministic and testable · *L1348*
- **ENG-3** — User input validation is critical for financial data · *L1350*
- **ENG-4** — Make complex calculations understandable through UI · *L1351*
- **ENG-17** — LLM calls are network calls — budget for retries, latency, partial failures · *L1401*
- **ENG-18** — Every agent invocation writes to substrate — non-optional architectural primitive · *L1402*
- **ENG-20** — Prompts ARE code — version, test, regression-check, snapshot · *L1404*
- **ENG-21** — Determinism where possible: tool use over free-form generation for structured tasks · *L1405*

## Performance

- **ENG-2** — Performance matters — optimize for 1000+ property portfolios · *L1349*

## Mobile Enhancement

- **ENG-5** — Progressive enhancement for mobile users (40%+ expected) · *L1352*

## AI Engineering

- **ENG-6** — Claude 4.x model selection: Opus 4.7 for complex reasoning/critique, Sonnet 4.6 for default agent work, Haiku 4.5 for routing/classification/cost-sensitive paths · *L1364*
- **ENG-7** — Prompt caching: 5-minute TTL discipline. 270s stays warm, 1200s amortizes one miss, 300s is worst-of-both · *L1365*
- **ENG-16** — Bias toward thin wrappers around the SDK rather than thick framework lock-in · *L1372*

## LLM Ops

- **ENG-8** — Retries with exponential backoff, circuit breakers per model/provider, cost-cap enforcement at the call site · *L1375*
- **ENG-9** — Idempotent agent invocation — substrate writes are deduplicated on retry · *L1376*
- **ENG-10** — Structured outputs with retry-with-correction loops on schema violations · *L1377*
- **ENG-11** — Streaming + cancellation handling on the server (don't bill for cancelled streams) and client (don't render half-written tool calls) · *L1378*

## Substrate Implementation

- **ENG-12** — Typed event emission as a first-class concern in every agent code path. No analyze-then-emit; emit-as-you-go for partial-failure recovery · *L1381*
- **ENG-13** — Append-only invariants enforced at the persistence layer, not by convention · *L1382*
- **ENG-14** — Schema migration strategy: substrate events are versioned; readers handle multiple versions; never mutate historical events · *L1383*

## Testing

- **ENG-15** — Regression suite execution in CI; fail PRs on calibration drift > threshold · *L1387*

## Cost Optimization

- **ENG-19** — Token cost is observable and optimizable via model-tier and caching, not by lowering quality · *L1403*

---

## When Engineer is invoked in the `fix-issue` pipeline

Phase 2 — Implements EXACTLY per Architect's design. Reads the design, then:
- Writes/modifies files exactly per `design.filesToChange`
- Adds tests for every invariant in `design.invariants`
- Runs `tsc --noEmit` (backend + frontend if touched) — MUST exit 0
- Runs affected `jest` unit tests — MUST all pass
- Commits with structured message: `fix(<issue>): <summary>`
- Returns implementation summary + commit SHA

Bias: strict adherence. Do NOT scope-creep. Do NOT refactor beyond design. If the design is unimplementable as specified, return with `deviationsFromDesign` explaining — that triggers a loop back to Architect, not silent deviation.
