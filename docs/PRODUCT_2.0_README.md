# REanalyzr 2.0 — Planning Surface Index

**Document type:** Entry point / navigation hub for the 2.0 planning suite
**Authored:** 2026-05-11
**Status:** Wave 1 planning complete; execution-ready
**Owns:** Cross-doc navigation, status tracking, reading paths, operating model recap

---

## 0. What this doc is

**Read this first** when entering the 2.0 planning suite. It points you to the right document for what you need.

The 2.0 planning surface is 10 documents totaling ~5,700 lines on `reanalyzr-2.0`. Without this index, the suite is a maze. With it, you can get to the relevant doc in 30 seconds.

---

## 1. The thesis at a glance

REanalyzr 2.0 is **a re-shape, not a rewrite.** Existing engine + decision logic + walk-away pricing + pipeline + portfolio code are **kept.** Frontend stays mostly intact (strangler-fig pattern). What changes:

1. **Chat-native overlay** at `/app` (open input, no upfront form), plus hero embedded chat on LandingPage that redirects there on submit
2. **Backend rebuild** from calculator-architecture to agent-mesh-and-events-store architecture
3. **Typed, append-only events store** on MongoDB (no second datastore)
4. **MCP-compatible edges** from day one (A2A / Assistants deferred until standards converge)

**The moat:** conservative-by-design calibration + accumulated override and outcome data. The deterministic scoring engine is non-negotiable architecture; AI never produces the `dealQuality` score.

**Three parallel tracks:**
- **Track 1 — Architecture (main workstream).** Claude-Code-driven implementation under founder direction. This doc suite covers it.
- **Track 2 — B2B validation (slow-burn).** Founder-led outreach, demos, pilot conversations. Realistic first paying B2B customer is 6-12 months out per thesis.
- **Track 3 — LinkedIn (learner posture, dual-purpose).** Technical content; voice rules strict (engineer working through problems, not founder building a startup).

For full thesis: read [REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md](REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md) end-to-end.

---

## 2. Document map

### Strategic input (authored externally, anchors everything)

| Doc | Author | Purpose | Lines |
|---|---|---|---|
| [REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md](REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md) | Parth + Marcus Chen v2 (external) | Strategic thesis — why, what, kept-vs-released, non-negotiables, kill criteria | 528 |

### Architecture (architect-authored)

| Doc | Owns | Lines |
|---|---|---|
| [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) | Master doc — overview + decision table + cross-links | ~670 |
| [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md) | 11 event types, append-only discipline, MongoDB schemas, indexing | ~960 |
| [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md) | Orchestrator, 3 wave-1 agents, 9 tools, MCP edges | ~800 |
| [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md) | Calibration check, golden sets, CI gating, drift detection | ~590 |
| [PRODUCT_2.0_COSTS.md](PRODUCT_2.0_COSTS.md) | Model-tier routing, per-tier budgets, caching, hybrid pricing, marketplace strategy | ~625 |
| [PRODUCT_2.0_FRONTEND.md](PRODUCT_2.0_FRONTEND.md) | Chat overlay, inline structured controls, mobile, hero embed, strangler-fig | ~585 |

### Decomposition (Marcus Chen-authored)

| Doc | Owns | Lines |
|---|---|---|
| [PRODUCT_2.0_BACKLOG.md](PRODUCT_2.0_BACKLOG.md) | Workstreams → epics → stories, sizing, dependencies, critical path | ~620 |
| [PRODUCT_2.0_FIRST_2_WEEKS.md](PRODUCT_2.0_FIRST_2_WEEKS.md) | Concrete weeks 1-2 execution plan, branches, exit criteria | ~400 |
| [PRODUCT_2.0_RISK_REGISTER.md](PRODUCT_2.0_RISK_REGISTER.md) | 25 risks, falsification criteria, kill-switches, mitigations | ~720 |

### Navigation (you are here)

| Doc | Owns |
|---|---|
| [PRODUCT_2.0_README.md](PRODUCT_2.0_README.md) | This doc — entry point, status, reading paths |

**Total planning surface: ~6,500 lines across 11 documents.**

---

## 3. Reading paths by purpose

Pick the path that matches what you need to do right now.

### "I'm new to this project. Where do I start?"

1. This doc (`PRODUCT_2.0_README.md`) — 5 minutes
2. [REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md](REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md) — 30 minutes; read end-to-end
3. [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) — 20 minutes; §1, §1.5, §2, §12 are load-bearing
4. [PRODUCT_2.0_BACKLOG.md](PRODUCT_2.0_BACKLOG.md) §1-§4 — 10 minutes; understand the work landscape
5. Skim the rest as needed by topic

**Total bootstrap: ~75 minutes.**

### "I need to write code for wave 1"

1. [PRODUCT_2.0_FIRST_2_WEEKS.md](PRODUCT_2.0_FIRST_2_WEEKS.md) — find your sprint
2. [PRODUCT_2.0_BACKLOG.md](PRODUCT_2.0_BACKLOG.md) — find your story with exit criteria
3. Relevant companion doc(s) for technical detail — e.g., events store, agent mesh
4. [PRODUCT_2.0_ARCHITECTURE.md §1.5](PRODUCT_2.0_ARCHITECTURE.md) — re-read deterministic-scoring non-negotiable before any agent / scoring work
5. [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md) — understand the CI gates your PR must pass

### "I need to make an architectural decision"

1. [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) §1.5 — non-negotiables first
2. [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) §12 — has the decision already been made?
3. Relevant companion doc — depth on the specific surface
4. [PRODUCT_2.0_RISK_REGISTER.md](PRODUCT_2.0_RISK_REGISTER.md) — does this surface a known risk?
5. If your decision differs from documented choices, flag explicitly with reasoning per thesis §14 constraint

### "I'm reviewing a PR"

1. Identify which workstream — [PRODUCT_2.0_BACKLOG.md §2](PRODUCT_2.0_BACKLOG.md)
2. Identify story exit criteria — [PRODUCT_2.0_FIRST_2_WEEKS.md](PRODUCT_2.0_FIRST_2_WEEKS.md) or [PRODUCT_2.0_BACKLOG.md §3](PRODUCT_2.0_BACKLOG.md)
3. Skim relevant architecture companion for any rules the PR touches
4. CI eval results — [PRODUCT_2.0_EVALS.md](PRODUCT_2.0_EVALS.md) defines what each result means

### "I need to update strategy / thesis"

This isn't a Claude Code task — it's a Founder + Marcus Chen v2 (external advisor) decision. Don't touch the thesis from inside the suite.

### "I'm evaluating risk / kill-switch decisions"

1. [PRODUCT_2.0_RISK_REGISTER.md](PRODUCT_2.0_RISK_REGISTER.md) — full register
2. §9 (Week 6/12/20 checkpoints) — strategic checkpoint structure
3. §10 (Observable signal dashboard) — what to track
4. [Founder review cadence in this doc](#9-founder-review-cadence)

### "I'm thinking about pricing or B2B GTM"

1. [PRODUCT_2.0_COSTS.md §5](PRODUCT_2.0_COSTS.md) — per-tier price-point analysis + hybrid pricing model
2. [PRODUCT_2.0_COSTS.md §12](PRODUCT_2.0_COSTS.md) — marketplace pricing
3. [PRODUCT_2.0_RISK_REGISTER.md §3](PRODUCT_2.0_RISK_REGISTER.md) — B2B segment risks
4. [Thesis §6 Track 2](REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md) — B2B validation flow

---

## 4. Critical decisions — what's locked

These are the load-bearing decisions across all docs. **If you're about to revisit one of these, it's a strategic-level conversation, not a sprint-level one.**

### Architecture (locked)

1. **MongoDB for events store** (not Postgres+jsonb) — same datastore, insert-only DB role, strict Mongoose schemas, eventVersion field
2. **Custom orchestrator** (not LangGraph/CrewAI) for wave 1
3. **Enrichment as tool** (not separate agent) — deviation from thesis §5.2 flagged with rationale
4. **MCP first**; A2A / OpenAI Assistants adapters deferred
5. **Hybrid conversation memory** — per-session ephemeral + per-user events-store-backed
6. **AI never produces the dealQuality score** (architecture §1.5 non-negotiable)
7. **Open-input cold-start** — no upfront form; agent extracts profile + property + B2B context from one turn
8. **Inline structured controls as React components** (not markdown blocks) — chat-native distinction
9. **Strangler-fig** — `/sfr-analysis` + `/mf-analysis` wizards stay operational; new chat at `/app`
10. **LandingPage hero embeds chat** — replaces `<UniversalCalculator />` at line 450; cascades to 3 SEO wrapper routes; standalone `/calculator/*` routes deprecated
11. **Calibration zero-tolerance** in CI — the deterministic-scoring non-negotiable's enforcement mechanism

### Pricing (locked)

1. **Path A locked** — 3 free analyses/month, then $19.99/month unlimited
2. **Hybrid pricing layered as supplement (proposed, not locked)** — per-analysis pay-as-you-go, B2B per-deal API, B2B trial conversion — wave 2+, revisitable
3. **Marketplace as awareness channel + substrate-seeding** — not revenue assumption per thesis §4.3

### Operating model (locked)

1. **Three-tier model** — Founder direction + Claude Code personas implementation + external advisory
2. **Branch policy** — `main` frozen at production; all work on `reanalyzr-2.0` until Founder explicitly merges
3. **Founder review bandwidth** — ~12-15 hours/week sustainable per thesis §7; the actual scarce resource
4. **Persona-driven authorship** — Architect owns architecture docs; Marcus Chen owns decomposition + strategy; Engineer / QE / UX / Sterling apple own implementation per their domains

### What's NOT locked (revisitable)

- B2B pricing per tier — set by demo signal
- Wave 2 portfolio variant for B2B (`portfolioType` field will exist; the agent design lights up on first B2B pilot)
- Per-analysis price points ($5-10 retail, $2-5 B2B API) — validation pending
- Foundation lab fallback (OpenAI for Q&A) — defer until reliability data forces it
- Specific calibration tolerance — bias zero-tolerance; relaxable with explicit founder approval per architect review
- Wave 1 exit criteria — proposed in [First 2 Weeks §2](PRODUCT_2.0_FIRST_2_WEEKS.md); confirm before sprint kickoff

---

## 5. Status board

### Wave 1 Planning (complete — 2026-05-11)

- ✅ Thesis decomposition (3 of 3 expected artifacts shipped: Architecture, Backlog, First 2 Weeks, Risk Register)
- ✅ All architectural decisions locked
- ✅ Critical path identified (W1 → W4-S4 → W3-S5 + W6-S11)
- ✅ Persona roles defined per workstream
- ✅ Risk register with kill-switch checkpoints

### Pre-Sprint 1 Open Items

These must resolve before Sprint 1 (W1-S1) kicks off:

- ⚠️ **Day 0 pre-work** — clear uncommitted edits in main checkout (App.tsx, AppleNavigation.tsx route cleanup, untracked admin script)
- ⚠️ **6 open backlog questions** — see [PRODUCT_2.0_BACKLOG.md §10](PRODUCT_2.0_BACKLOG.md); biases applied in First 2 Weeks but founder should explicitly confirm
- ⚠️ **6 open risk-register questions** — see [PRODUCT_2.0_RISK_REGISTER.md §11](PRODUCT_2.0_RISK_REGISTER.md)
- ⚠️ **Founder time commitment** — confirm ~17-20 hours over 2 weeks for sprint review (per First 2 Weeks §9)

### Wave 1 Implementation (not started)

12 workstreams totaling ~155-220 story-days with ~70-105 founder review hours. See [PRODUCT_2.0_BACKLOG.md §3-§4](PRODUCT_2.0_BACKLOG.md).

### Wave 1.5 (parallel, starts ~weeks 10-14)

3 workstreams totaling ~6-9 story-days. See [PRODUCT_2.0_BACKLOG.md §5](PRODUCT_2.0_BACKLOG.md).

### Wave 2 (sketched only)

7 workstreams totaling ~80-135 story-days. Full decomposition deferred to wave 1 exit when learnings inform stories. See [PRODUCT_2.0_BACKLOG.md §6](PRODUCT_2.0_BACKLOG.md).

---

## 6. Operating model recap (3-tier)

| Tier | Who | Owns | Cadence |
|---|---|---|---|
| **Tier 1** | Founder (Parth) | Direction, decisions, review, integration, business strategy (B2B / Track 3) | Continuous; ~12-15 hours/week |
| **Tier 2** | Claude Code Personas | Specification, implementation, testing, documentation per domain | Per-sprint and per-PR |
| **Tier 3** | External | Strategic input (Marcus Chen v2), B2B prospect feedback, future advisors/hires | As surfaced |

**Persona scope boundaries (Tier 2):**

| Persona | Owns |
|---|---|
| Architect | Architectural decisions, cross-doc consistency, non-negotiables (especially deterministic-scoring), system boundaries, technical risk |
| Marcus Chen | Product strategy, GTM, pricing, positioning, decomposition into work units, raise narrative, marketplace strategy |
| Engineer | Implementation, code quality, refactoring, libraries, day-to-day shipping |
| QE Engineer | Evals (deterministic + LLM-as-judge), calibration check, CI gating, regression detection |
| UX Designer | Frontend UX decisions, accessibility, design-system consistency |
| Sterling apple | Mobile-specific concerns (cellular, voice, offline, touch UX) |
| Business Expert | RE-investor perspective, scenario validation, what real underwriters think |
| Tax Expert | Tax-domain accuracy, B2B compliance content where tax surfaces |
| Marketing Expert | Growth signals, SEO, conversion copy, channel strategy |

When a question touches multiple domains → **Architect coordinates**, pulls in domain experts.

When personas disagree → **escalate to Founder**, don't lock in technical decision without explicit founder approval.

---

## 7. Consolidated open questions

All open questions across the planning suite, grouped:

### Strategic / pricing

- Hybrid pricing layer activation timing (cost doc §5.6.3)
- B2B per-deal API price points (cost doc §5.6.3)
- Marketplace listing timing (cost doc §12.6)
- Path A → hybrid transition trigger (cost doc §5.6.3)

### Architectural / technical

- Per-session memory store: Redis or events-store reads each turn (events store §12)
- PII pre-processing pipeline location (events store §12)
- Cross-event-store-and-relational joins (events store §12)
- Event-correlation graph viz tooling (events store §12)
- Streaming structured outputs partial-rendering (agent mesh §10)
- Prompt cache empirical validation (agent mesh §10)
- B2B portfolio variant UI shape (agent mesh §10)
- Calibration tolerance strict-zero vs practical ±1 (risk register §11)

### Operational / process

- Founder hour tracking method (risk register §11)
- Retail-pays signal threshold (risk register §11)
- Foundation lab monitoring cadence (risk register §11)
- B2B "would pay" verbatim definition (risk register §11)
- Risk-register review cadence post wave 1 (risk register §11)
- Smoke test as part of W4-S4 vs separate story (First 2 Weeks §11)
- MongoDB cluster for dev: Atlas vs local Docker (First 2 Weeks §11)
- Anthropic SDK version pinning (First 2 Weeks §11)
- CI cost cap from week 3 onward (First 2 Weeks §11)

### Backlog-specific (also documented in First 2 Weeks §1)

- Q&A migration scope: wrap first or re-architect
- Offline+sync tier: read-only / capture queue / full
- Golden set sizing: 100 in wave 1 or 180
- Founder-historical backfill volume
- Observability dashboards: React or low-code
- Wave 1 exit criteria

**Total: ~25 open questions across the suite.** Most have applied biases; Founder confirms at sprint kickoff.

---

## 8. How to update the planning suite

The suite is a living document. Updates happen in three forms:

### Type 1 — Fixup commit (small, no strategic shift)

Triggered by: typo, broken cross-link, new sub-section needed in an existing doc, clarification.

Process:
- Direct commit to `reanalyzr-2.0`
- Touch only the affected docs
- Update doc changelog with description
- No new doc needed

### Type 2 — Cross-doc fixup (medium, single decision change)

Triggered by: a decision changes that affects 2-3 docs (e.g., the landing-page strategy correction we did 2026-05-11).

Process:
- Branch off `reanalyzr-2.0` as `feat/<short-name>` (optional — direct commit also acceptable per branch policy)
- Edit the affected docs in coordination
- Update each doc's changelog with cross-references
- Commit as a single message with a clear "fixup: <area>" framing
- Marcus Chen voice if scope is strategic; Architect voice if scope is technical

### Type 3 — Major doc addition (large, new workstream or strategic shift)

Triggered by: thesis pivot, new wave 2 decomposition pass, B2B pilot inflection.

Process:
- Founder + Marcus Chen v2 (external) align on scope
- New doc authored per the document map
- Update this README/index with the new doc reference
- Update relevant existing docs with cross-links
- Single commit with thorough message

### Updating the changelog

Every doc has a §Changelog section. Convention:
```
- **YYYY-MM-DD (vX.Y):** Brief description of change. Cross-reference to related docs if applicable.
```

Version major bumps (v2.0) signal a strategic shift; minor (v1.2) signals additive content; patch (v1.1.1) signals fixup.

---

## 9. Founder review cadence

| Cadence | Activity | Time |
|---|---|---|
| **Daily (async)** | PR review queue | ~30-45 min |
| **Weekly** | Sprint progress, eval reports, observability dashboard scan | ~1 hour |
| **Bi-weekly** | Risk register medium-severity review | ~30 min |
| **Monthly** | Risk register full review; thesis assumptions check; Track 2/3 health | ~2 hours |
| **Wave 1 checkpoints (Week 6, 12, 20)** | Two-of-three threshold review per [risk register §9](PRODUCT_2.0_RISK_REGISTER.md) | ~2-3 hours each |
| **Wave 1 exit** | Comprehensive sprint retrospective + Wave 2 decomposition kickoff | ~4-6 hours |

**Total founder time budget for the doc surface:** ~3-4 hours/week sustained, plus checkpoint reviews. Plus per-PR review (~6 hours/week per sprint).

---

## 10. What's NOT in this suite (intentional)

To set expectations:

- **No marketing copy** — `reanalyzr.com` positioning stays as-is per thesis §9 non-negotiable
- **No customer-facing user manual** — focus is on implementation; user-facing docs come later
- **No security / compliance certification roadmap** — wave 1 prep; SOC2 etc. are wave 2+ concerns when B2B pilots require them
- **No infrastructure runbook** — operational details live separately
- **No hiring plan** — out of scope per thesis founder-throughput model
- **No specific financial projections** — pricing locked, costs documented, but revenue forecasts aren't engineering work

---

## 11. Changelog

- **2026-05-11 (v1):** Initial README/index. Wraps the 2.0 planning surface (~5,700 lines across 10 documents). Reading paths by purpose (6 paths), critical decisions locked (11 architectural + 3 pricing + 4 operating model), status board, operating model recap (3-tier with persona scope), consolidated open questions (~25 across the suite), update process (3 types), founder review cadence. Wave 1 planning is complete; execution-ready.
