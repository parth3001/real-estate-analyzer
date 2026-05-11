# REanalyzr 2.0 — Risk Register

**Document type:** Decomposition output per thesis §0/§14
**Authored:** 2026-05-11 (Marcus Chen with Architect framing on technical risks)
**Status:** Draft 1
**Owns:** What could falsify each piece of the thesis, observable signals if wrong, kill-switch criteria, mitigation playbooks

---

## 0. How to read this document

This doc takes each load-bearing thesis bet (per [thesis §3](REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md) "The Bet, in Plain English") plus architectural and operational risks, and for each one specifies:

- **What would falsify it** (the disconfirming reality)
- **Observable signals if wrong** (how we'd actually know — not vibes)
- **Severity** (high / medium / low)
- **Kill-switch criteria** (specific threshold + action when triggered)
- **Mitigation playbook** (how to soften the risk while in play)

Risks aren't evenly weighted. Some kill the company if they materialize (calibration drift, B2B segment doesn't pay). Others are operational annoyances (cache hit rate below target). This doc treats them differently.

**The bias of this register:** if you can't observe it, you can't act on it. Every risk needs at least one **concrete, measurable, time-bound signal** — not "we'll know it when we see it."

**Audience:**
- **Founder (Parth)** — owns kill-switch decisions; reviews monthly
- **Marcus Chen** — owns this doc; updates as risks materialize or new ones emerge
- **Architect** — owns technical risks (§4); reviews quarterly
- **QE Engineer** — owns calibration-drift monitoring (R-T1)

---

## 1. Reading conventions

| Severity | Definition | Cadence of review |
|---|---|---|
| **🔴 High** | If it materializes, the thesis cracks; company viability threatened | Weekly during waves 1-2; monthly thereafter |
| **🟡 Medium** | Material impact on a workstream or KPI; recoverable with effort | Bi-weekly |
| **🟢 Low** | Annoyance or known quantity; track for surprise | Monthly |

Each risk has a **risk ID**: `R-<category><number>` for stable referencing.

Categories:
- `R-T` Thesis bets
- `R-B` B2B segment risks
- `R-S` Substrate / moat risks
- `R-A` Architectural risks
- `R-E` Economics / unit-economics risks
- `R-O` Operating model risks
- `R-C` Competitive / market risks

---

## 2. Thesis bets — the 5 load-bearing assertions

Per [thesis §3](REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md):

### R-T1 🔴 — Conservative-by-design calibration drifts toward optimism

**Thesis assertion #5:** Conservative, honest underwriting is the right calibration. Optimistic engines train themselves into worse decisions because their substrate is contaminated by deal-promotion bias.

**What would falsify it:** The dealQuality score, the deterministic engine, or AI-assisted explanations drift toward optimism over time. Deals that the engine scores 75 today would score 80 in 6 months given the same inputs.

**Observable signals if wrong:**
- Calibration check CI gate (per [evals §3](PRODUCT_2.0_EVALS.md)) fails — agent-pipeline scores diverge from existing engine scores
- Override-event aggregation shifts: users overriding vacancy *downward* more than upward (indicates engine became too conservative on vacancy, OR — more concerning — users wishful-thinking the engine optimistic and the engine accommodating)
- Outcome events (when capture lights up) reveal BUY-band decisions performing systematically below projections
- B2B prospect feedback: "your engine is too conservative compared to my judgment"

**Severity:** 🔴 High. This is the moat. Drift here is the moat eroding.

**Kill-switch criteria:**
- Any calibration check failure in CI = block merge until fixed (already enforced — see evals §3.2)
- If >5% of monthly decisions diverge from pre-substrate baseline by ≥3 points on dealQuality, raise to architect review before next release
- If override-event aggregation shows >40% downward overrides on vacancy/rent assumptions for 3 consecutive months, full audit of engine calibration

**Mitigation playbook:**
- Calibration zero-tolerance CI gate (already designed)
- Engine version pinned per release; engine changes require explicit regenerate of regression set
- Quarterly engineering review of override events for systematic bias signals
- Founder personally reviews 10 BUY-band decisions per month for "would a real conservative underwriter call this BUY?"

---

### R-T2 🔴 — Retail does not pay durably

**Thesis assertion #2:** The market that pays for honest underwriting is regulated lenders and RE professionals — not retail investors.

**What would falsify it:** Retail subscription revenue at $19.99/month scales to meaningful MRR ($50K+/month) without B2B traction. Or, alternatively: retail churn rate is below SaaS norms (<3% monthly), indicating engaged retention from individual investors.

**Observable signals if wrong:**
- Path A subscription conversion >10% of free-tier signups (rare for analytical tools, would indicate strong retail product-market fit)
- Retail churn rate <5% monthly after 6 months of paid usage
- Retail user behavior includes >30 analyses/month average (engaged power users)

**Severity:** 🔴 High. If retail does pay, B2B is still the bigger market but resource allocation shifts.

**Kill-switch criteria (positive):**
- If retail signals 8 weeks of >10% conversion + <5% churn, **reduce Track 2 (B2B validation) priority by 50%** and re-invest in retail growth/SEO. Thesis pivot.
- If retail signals 8 weeks of <2% conversion + >15% churn, **stay on B2B course; raise free-tier limits** (substrate seeding value) and minimize retail subscription-conversion engineering.

**Mitigation playbook:**
- Per cost doc §5, retail subscription pricing locked at $19.99 — easy to maintain at minimal cost
- Free tier is loss-leader for substrate; conversion is secondary
- Don't optimize architecture for retail-payment scenarios (per thesis §9)

---

### R-T3 🔴 — Calculator category collapse timeline is wrong

**Thesis assertion #1:** By Q3 2027, "calculator" as a category is a feature inside chat-native AI platforms, not a destination product.

**What would falsify it:** Calculator-category SaaS retains pricing power and category coherence through 2027. Foundation models don't ship convincing real-estate-calculator capabilities. Existing calculator companies (DealCheck, BiggerPockets, etc.) retain or grow their user base.

**Observable signals if wrong:**
- Anthropic / OpenAI / Google fail to ship vertical RE features through 2026 (we have time)
- DealCheck or BiggerPockets retain >70% of their user base year-over-year through 2027
- SEO traffic for "BRRRR calculator", "rental property calculator" stays flat or grows (currently ~50K monthly searches collectively)
- Foundation model + tool use accuracy on free-form RE queries plateaus below "good enough"

**Severity:** 🔴 High but window-limited. If we're early on the timing, we have runway. If we're late, the substrate moat needs to compound faster.

**Kill-switch criteria:**
- If by Q4 2026, foundation models can run a representative RE analysis to 80%+ accuracy of our engine via tool calling **and** the user experience is "good enough," accelerate substrate accumulation aggressively
- If by Q4 2026, calculator-SaaS revenue trends remain flat (incumbents healthy), revisit thesis timing assumption

**Mitigation playbook:**
- Substrate accumulation is the only durable defense — execute thesis §5.5 plan
- Track AI agent capability quarterly; benchmark against our calibrated outputs
- Be ready to publish substrate-driven differentiators (override patterns, calibration data) when foundation models commoditize the math

---

### R-T4 🔴 — Substrate weight threshold isn't met in time

**Thesis assertion #4:** The first vertical AI agent in RE that gets to substrate weight will compound — overrides and outcomes make the next analysis better.

**Thesis target:** 5,000-10,000 analyses across 200-500 distinct active users with at least some outcome signal.

**What would falsify it:** By month 12, substrate has <2,000 analyses or <100 distinct active users. Or, more concerning: substrate accumulates volume but produces NO measurable engine-calibration improvements (override aggregation doesn't reveal patterns; outcome capture doesn't validate or correct scoring).

**Observable signals if wrong:**
- Substrate analysis count: 1K by week 14, 5K by month 6, 10K by month 12
- Active user count: 100 by week 14, 300 by month 6, 500 by month 12
- Override event production: >10% of analyses produce at least one override
- Engine calibration improvements: at least 2 deterministic-config adjustments per quarter informed by override aggregation

**Severity:** 🔴 High. Substrate-as-moat is the central strategic bet.

**Kill-switch criteria:**
- Week 14 (wave 1 exit): substrate <500 analyses → re-examine acquisition strategy; consider increasing free-tier analysis cap; accelerate Track 2 B2B for substrate accelerant
- Month 6: substrate <2,000 → strategic review with Marcus Chen v2 (external advisor); thesis may need refinement
- Month 12: substrate <5,000 and no engine improvements from overrides → moat-as-pitched isn't working; pivot to different durable moat (workflow lock-in via B2B integration?)

**Mitigation playbook:**
- Wave 1.5 substrate instrumentation (W12-W14 in backlog) — earns 14+ weeks of substrate weight from existing wizard/portfolio/pipeline usage
- Founder-historical backfill (W10) — initial 200-500 analyses without external traffic
- B2B pilot deal flow generates 10-50x retail rate per thesis §2.3
- Adversarial critic agents seed CritiqueEvents (synthetic but useful) per thesis §5.5

---

### R-T5 🟡 — B2B vertical AI agent thesis is generic, not differentiated

**Thesis assertion #3:** Underwriters and lending institutions will pay for an agent that knows their portfolio + their underwriting standards + their market more than for a calculator they configure each time.

**What would falsify it:** B2B buyers (lenders, credit unions, consultancies) evaluate the platform and respond "this is just a faster calculator" — they don't perceive the agent / personalization / audit trail as differentiating from existing tooling.

**Observable signals if wrong:**
- B2B demo conversion: 0 of 5+ cold demos request a follow-up call or pilot conversation
- Verbatim feedback: B2B prospects don't independently articulate the agent / personalization / audit trail as the value
- B2B pilot pricing offers come in below $200/month — indicates buyer doesn't see institutional-grade value

**Severity:** 🟡 Medium. Doesn't kill the company, but requires GTM iteration.

**Kill-switch criteria (per thesis §6 Track 2):**
- 12 weeks of B2B outreach with 0 serious pilot conversations → revisit B2B segment thesis itself
- If 5+ cold demos produce 0 "would pay" signal, restructure demo to emphasize specific differentiators per buyer

**Mitigation playbook:**
- Per thesis §6 Track 2 week 5-12, iterate demo per call learnings
- Audit-trail-as-gate framing (cost doc §10) is the most B2B-aligned story
- Marcus Chen demo coaching for founder
- Lower-friction demo via per-deal pricing tier (cost doc §5.6.2) — let lender try one real deal before subscribing

---

## 3. B2B segment specifics

### R-B1 🟡 — First paying B2B customer takes >12 months

**Risk framing:** Thesis projects 6-12 month timeline. Reality could be longer if procurement cycles in regulated lending are slower than anticipated.

**What would falsify it:** First paying B2B customer signed in months 12-18 instead of 6-12.

**Observable signals:**
- Demo pipeline progression: by month 6, ≥5 cold demos completed; ≥1 pilot conversation underway
- Procurement objections: "we need to vendor-vet for 6+ months" appears in early demos
- Compliance objection: "we need SOC2 / specific certifications" surfaces before pilot conversation

**Severity:** 🟡 Medium. Adjusts runway, doesn't break thesis.

**Kill-switch criteria:** Month 12 with 0 pilot conversations — Marcus Chen v2 strategic review.

**Mitigation playbook:**
- Front-load compliance signaling (audit trail, append-only substrate, deterministic scoring) in demo materials
- Per-deal pricing tier (no annual contract) lowers commitment friction
- Founder-led custom MCP deployments (per cost doc §12.6 question 3) — first revenue from a single B2B client may be a custom integration, not a SaaS subscription

---

### R-B2 🟡 — B2B segment fragmentation requires multiple distinct products

**Risk framing:** Lenders, credit unions, hard-money shops, underwriting consultancies — these may have such different workflows that a single B2B product can't serve them all.

**What would falsify it:** First 3 B2B demo conversations reveal incompatible workflow needs (e.g., credit union wants LOS integration; hard-money shop wants speed; consultancy wants white-label).

**Observable signals:**
- Demo notes diverge significantly per segment
- Pricing tolerance varies 5x+ across segments
- Required integrations / outputs are non-overlapping

**Severity:** 🟡 Medium.

**Kill-switch criteria:** If first 3 demos reveal segment fragmentation, prioritize **single segment** for wave 2 (likely credit unions per most-regulated, most-conservative buyer match with thesis).

**Mitigation playbook:**
- portfolioType variant flag (W13 in wave 1.5) — architecture already accommodates retail / b2b_loan / b2b_advisory branching
- Wave 2 portfolio-agent / pipeline-agent designs branch on portfolioType from day one
- Demo iteration: keep notes on segment-specific feedback; cluster after 5 demos

---

## 4. Substrate / moat risks

### R-S1 🔴 — Substrate data quality drops over time

**Risk framing:** Substrate captures everything, but if event payloads are inconsistent (schema drift, missing fields, broken cross-references), the substrate becomes a log dump, not a moat.

**What would falsify it:** Substrate has high event volume but querying produces noisy / incomplete / inconsistent results for the calibration-loop analyses.

**Observable signals:**
- Zod parse failure rate on writes >1% (should be ~0%)
- Cross-event reference integrity failures (e.g., DecisionEvent.analysisEventId doesn't resolve)
- Override events with `null` or missing `originalValue` / `newValue` / `fieldPath`
- Query patterns from §8 of events-store doc returning unexpected nulls

**Severity:** 🔴 High. Substrate quality IS the moat quality.

**Kill-switch criteria:**
- Zod parse failure rate >1% for 1 week → halt new feature work; integrity fix
- Cross-reference integrity failure >0.5% for 1 month → architect-led audit

**Mitigation playbook:**
- Strict Zod schemas per event type (per events-store §1)
- DB role enforces append-only (no in-place mutation can corrupt history)
- Substrate observability dashboards (W22) include data-quality metrics
- Per-write schema validation as design principle, not optional

---

### R-S2 🟡 — Substrate growth outpaces operational budget

**Risk framing:** At 50K active users (projection), substrate is ~320GB. Operational cost (queries, indexing, backup) outpaces what wave 1 architecture supports.

**What would falsify it:** Substrate query p95 latency exceeds 500ms for routine reads; archival pressure becomes urgent before user base justifies it.

**Observable signals:**
- p95 read latency creep over time
- Mongo storage cost as % of total infra cost
- Index size approaching working-set memory

**Severity:** 🟡 Medium. Architectural runway is 14+ months; not urgent in wave 1.

**Kill-switch criteria:** Active users >10K and substrate >50GB → archival strategy implementation begins.

**Mitigation playbook:**
- Per events-store §10.1, archival deferred until 10K active users
- Cold storage strategy: events >2 years old + non-active users → cold collection or S3
- Query patterns optimized for hot working set (recent decisions per user)

---

### R-S3 🟡 — Outcome capture never lights up

**Risk framing:** Substrate is designed for outcome capture but the actual mechanism (user self-report, B2B LOS integration, follow-up surveys) doesn't produce volume. Result: calibration validation has no ground truth.

**What would falsify it:** Month 18 with substrate at scale (5K+ analyses) but <50 OutcomeEvents.

**Observable signals:**
- B2B pilot LOS integration unviable (technical or contractual barriers)
- Follow-up survey response rate <5% even with $50 incentive
- Self-report friction too high; <1% of users voluntarily report outcomes

**Severity:** 🟡 Medium. Engine calibration still works without ground truth (uses override aggregation as proxy), but outcome data is the cleanest validation.

**Kill-switch criteria:** Month 18 with <50 OutcomeEvents → outcome-capture pipeline redesign (different incentive, different channel, different B2B integration).

**Mitigation playbook:**
- PipelineEvent.pipeline_deal_closed is the lowest-friction outcome precursor (per events-store §3.11) — relies on existing pipeline feature usage
- Founder personally reports outcomes for personal deals (sets the bar)
- B2B pilot terms include outcome-reporting as part of subscription value exchange

---

## 5. Architectural risks

### R-A1 🔴 — Calibration check fails persistently in CI

**Risk framing:** The zero-tolerance calibration gate (evals §3.2) blocks merges because the new agent pipeline can't reproduce existing engine outputs exactly.

**What would falsify it:** Wave 1 implementation reveals genuine engine wrapping difficulty (e.g., `BaseDecisionEngine` has implicit state, or `MarketIntelligenceService` returns different shapes than expected, or strategy-aware weights have hidden dependencies).

**Observable signals (during weeks 1-4):**
- W4-S4 score_deal PR fails calibration check on >1 fixture
- Engine wrapping requires more than thin Zod adapter — e.g., needs to reach into internal engine state

**Severity:** 🔴 High during weeks 1-4; downgrades to Medium after W4-S4 stabilizes.

**Kill-switch criteria:**
- Week 4: W4-S4 not stable (failing calibration on >1 fixture) → architect-led deep dive
- Week 6: still unstable → relax calibration tolerance to ±2 with explicit founder approval; document drift

**Mitigation playbook:**
- Architect mandatory review on W4-S4 PR (per First 2 Weeks §5 Day 9)
- Use deterministic fixtures (no randomness in inputs)
- Pin engine version; do not refactor engine during wave 1
- If divergence found, document in detail per evals §3.3

---

### R-A2 🟡 — Anthropic SDK has reliability issues at scale

**Risk framing:** Single-provider (Anthropic) strategy means SDK outages or rate limits directly affect platform availability.

**What would falsify it:** Anthropic experiences >0.5% downtime in any month, or rate limits become binding during normal operations.

**Observable signals:**
- ConversationEvent records >0.5% LLM-timeout errors per month
- Rate limit warnings during normal traffic days

**Severity:** 🟡 Medium. Mitigated by strangler-fig fallback (existing wizard at /sfr-analysis still works) per cost doc §10.

**Kill-switch criteria:** Month 3+ with >1% downtime → begin OpenAI fallback implementation for Q&A agent (per cost doc §10 and §12 open question 6).

**Mitigation playbook:**
- Wave 1 strangler-fig fallback ensures users have alternative path (/sfr-analysis wizard)
- CostEvent + observability monitor Anthropic call latency and error rate
- OpenAI fallback for Q&A is a deferred build; ready to ship if signals warrant

---

### R-A3 🟡 — Prompt cache hit rate is below 85% target

**Risk framing:** Cost economics in [PRODUCT_2.0_COSTS.md §6.1](PRODUCT_2.0_COSTS.md) assume ≥85% prompt cache hit rate. Below this, per-query cost increases significantly.

**What would falsify it:** Cache hit rate measured from `ConversationEvent.tokenUsage` is <70% after 4 weeks of production traffic.

**Observable signals:**
- Weekly cache hit rate metric on observability dashboard
- Per-query cost trends upward
- Cost regression PR comments fire frequently

**Severity:** 🟡 Medium. Doesn't break unit economics until much lower; affects margin.

**Kill-switch criteria:** 4 weeks with cache hit rate <70% → architect review of cache boundary design (per agent mesh §5.2).

**Mitigation playbook:**
- Cache boundary discipline per agent mesh §5.2 (4 explicit boundaries)
- Prompt versioning discipline (don't bump versions casually)
- Eval reports include cache hit rate per PR
- W9-S5 in backlog explicitly validates ≥85% target

---

### R-A4 🟡 — MCP server SDK is rough in May 2026

**Risk framing:** Anthropic's MCP server SDK is recent (May 2026). May have rough edges or undocumented behaviors that block W11.

**What would falsify it:** W11 implementation reveals SDK is too immature for production exposure.

**Observable signals (during W11):**
- SDK lacks documented production patterns
- Authentication / rate-limiting requires workarounds
- Type system mismatches with our Zod-first approach

**Severity:** 🟡 Medium. W11 is wave 1 minimum; can defer marketplace exposure.

**Kill-switch criteria:** W11 implementation exceeds 12 story-days → defer external MCP exposure; internal-only for wave 1.

**Mitigation playbook:**
- Architecture is already protocol-agnostic (agent mesh §7) — adapter pattern allows swap
- A2A / OpenAI Assistants adapters deferred anyway
- W11 scope is intentionally minimum (internal/own-platform users only)

---

## 6. Cost / unit-economics risks

### R-E1 🟡 — Per-query cost exceeds projections at scale

**Risk framing:** Cost doc §4 projects ~$0.021/analysis. Reality could be higher if cache hit rate is lower, or if Q&A turn count per analysis is higher than projected.

**What would falsify it:** Average per-query cost at month 3 of production >$0.05.

**Observable signals:**
- CostEvent aggregation shows average per-query cost trend
- Per-tier cost projections in cost doc §5 break
- Margin headroom on retail paid ($19.99) compresses below 85%

**Severity:** 🟡 Medium. Doesn't break free tier; affects paid retail margin.

**Kill-switch criteria:** Per-query cost >$0.05 for 4 weeks → cost reduction work prioritized (tighter caching, model-tier shift for marginal agents, prompt length audit).

**Mitigation playbook:**
- Cost regression CI gate (evals §7.1) catches per-PR drift
- Caching strategy (cost doc §6) — three caches with measurable impact
- Model-tier routing — Haiku for cheap paths is a budget lever

---

### R-E2 🟢 — Free-tier abuse drives per-user cost above cap

**Risk framing:** Free-tier cost cap is $1.00/month. Abusive patterns (e.g., users hitting Q&A 1000+ turns/month) could exceed this.

**What would falsify it:** Free-tier users routinely exceed $1.00/month before hitting the 3-analyses limit.

**Observable signals:**
- CostEvent aggregation per free-tier user
- Median cost per free-tier user trends upward
- Specific users cluster at the cap

**Severity:** 🟢 Low. Cap enforcement is straightforward.

**Kill-switch criteria:** N/A — caps work as designed.

**Mitigation playbook:**
- Per-user monthly cap enforcement (cost doc §7.2)
- Anonymous session cap on first-touch chat (cost doc §5.1)
- Rate limiting per session on Q&A
- Adversarial critique disabled on free tier (cost doc §5.1)

---

### R-E3 🟢 — B2B per-deal API API key sharing depresses unit economics

**Risk framing:** If/when B2B per-deal API ships (cost doc §5.6.2), shared API keys across an institution could mask per-user cost attribution.

**What would falsify it:** A B2B institution shares one API key across 10+ users; per-key usage exceeds projected per-user volume by 5-10x.

**Observable signals (wave 2+):**
- API key usage distribution
- Per-call cost vs. per-call price compresses below margin target

**Severity:** 🟢 Low (wave 2+ concern).

**Kill-switch criteria:** N/A wave 1.

**Mitigation playbook:**
- Per-API-key cost cap separately from per-user cap (wave 2 design)
- Pricing tiers can encourage individual keys (volume discount only with named-key audit)

---

## 7. Operating model risks

### R-O1 🔴 — Founder review bandwidth becomes the hard constraint

**Risk framing:** Per thesis §7, founder throughput model assumes ~12-15 sustained hours/week of review/decisions. If actual hours are <10/week for >4 weeks, wave 1 timeline slips significantly.

**What would falsify it:** Wave 1 completion at month 6+ instead of month 3-4.

**Observable signals:**
- Backlog of PRs awaiting review grows
- Calibration check / golden set failures sit unresolved
- Sprint velocity (story-days/week landed) drops

**Severity:** 🔴 High. Whole thesis depends on this throughput model.

**Kill-switch criteria:**
- 4 consecutive weeks with <8 hours/week of founder review → strategic prioritization conversation; non-critical workstreams paused
- 8 weeks of <10 hours/week → wave 1 timeline extended; reset expectations

**Mitigation playbook:**
- Spec quality as defense — well-specified stories reduce per-story review time
- PR templates that surface "what to look at first" sections
- Architect persona pre-reviews technical PRs to reduce founder load
- Track 2 (B2B) interruptions documented; not treated as failures
- Per First 2 Weeks §9, founder time estimate is explicit per artifact

---

### R-O2 🟡 — Track 2 (B2B) pulls founder hours from Track 1 (Architecture)

**Risk framing:** B2B outreach + demos + pilot conversations require founder time. Per thesis §6, this is intentional ("first 6 months value is shaping architecture, not revenue") but could over-rotate.

**What would falsify it:** Founder hours on Track 2 exceed Track 1 hours in any month before pilot revenue materializes.

**Observable signals:**
- Founder weekly time logging shows Track 2 dominant
- Track 1 sprint velocity drops while Track 2 demo count increases
- Track 1 sprint goals miss

**Severity:** 🟡 Medium. Counter-intuitively, this risk fires WORSE if Track 2 is going well (more demos = more demands).

**Kill-switch criteria:**
- Track 2 hours >60% of total in any month while wave 1 incomplete → re-balance via explicit weekly Track 1/Track 2 hour allocation
- Track 2 produces revenue before Track 1 substrate is functional → unique problem; revisit thesis

**Mitigation playbook:**
- Marcus Chen v2 weekly check-in on hour allocation
- Per thesis §6 Track 2 weeks 1-4 is "warm contact validation" only — 2-3 demos
- Demo automation (per cost doc §5.6.2 B2B trial conversion) reduces per-demo founder time
- Track 2 explicitly does not promise revenue in months 1-6

---

### R-O3 🟡 — Track 3 (LinkedIn) voice drifts from learner posture toward founder vocabulary

**Risk framing:** Thesis §6 Track 3 voice rules require "engineer working through interesting problems publicly," not "founder building a startup." Voice can drift toward more conventional founder-marketing as posts accumulate.

**What would falsify it:** Recent posts include traction metrics, MRR aspirations, growth signals, or pivot narratives — all explicitly avoided per thesis.

**Observable signals:**
- Self-review of last 10 posts: any include vocabulary from the "avoid" list per thesis §6 Track 3
- Founder gets investor inbound, not hiring inbound
- Track 3 audience grows but for wrong reasons (other founders following, not technical hiring managers / B2B prospects)

**Severity:** 🟡 Medium. Track 3 dual purpose (company building + career repositioning) only works if learner voice is preserved.

**Kill-switch criteria:**
- 4 consecutive weeks of voice drift → Marcus Chen v2 voice audit
- Track 3 audience composition skews >70% founder/investor (rather than technical hiring managers / B2B prospects) → re-evaluate content mix

**Mitigation playbook:**
- Per thesis §6 Track 3 voice rules — refer back on every post
- Track 3 content priority list from thesis (substrate design, agent orchestration, evals, cost economics, A2A/MCP observations, "what didn't work")
- Avoid: pitch language, growth metrics, pivot narratives, segment-shift announcements

---

### R-O4 🟢 — Reanalyzr.com positioning gets second-guessed

**Risk framing:** Thesis non-negotiable says reanalyzr.com stays as-is; any inconsistency between site and Track 3 voice is intentional. Pressure to "clean up" the site may surface.

**What would falsify it:** Founder considers rewriting marketing copy to match Track 3 voice (signs of caving to optics-driven concerns).

**Observable signals:** N/A — preventative.

**Severity:** 🟢 Low (as long as discipline holds).

**Kill-switch criteria:** N/A.

**Mitigation playbook:**
- Thesis §9 non-negotiable explicitly states this
- Hiring managers who read "shipped real product" as flight risk are self-selecting out — that's a feature
- No marketing copy rewrites in wave 1

---

## 8. Competitive / market risks

### R-C1 🔴 — Foundation labs ship vertical RE features

**Risk framing:** Anthropic, OpenAI, Google ship convincing RE agent capabilities in their general-purpose products. Differentiation collapses.

**What would falsify it:** Anthropic publishes "RE underwriting templates" or OpenAI ships "real estate agent" capability with calibrated outputs and audit trails.

**Observable signals:**
- Anthropic feature releases include real-estate-specific tool sets
- ChatGPT / Claude.ai produce credible deal analyses without prompting
- Foundation labs' B2B / enterprise products include vertical-RE capabilities

**Severity:** 🔴 High in long term; manageable in short term.

**Kill-switch criteria:**
- If foundation labs ship vertical RE agent before substrate weight (5K+ analyses) achieved → moat strategy needs reframing
- If foundation labs offer credible RE evals + calibration tools → competitive differentiation shifts to workflow lock-in (B2B integration, audit trail, LOS connections) faster

**Mitigation playbook:**
- Per thesis §11 raise narrative — "why won't OpenAI/Anthropic ship this" answer is prepared
- Substrate moat is the unique-data answer
- Workflow lock-in via B2B integration is the supplementary answer
- Foundation labs are conservative-calibration averse (training data leans optimistic) — that's our wedge

---

### R-C2 🟡 — Incumbents pivot to chat-native (DealCheck, BiggerPockets, etc.)

**Risk framing:** Thesis §2.2 asserts "incumbents can't pivot." If wrong, calculator-category competitors ship chat-native features.

**What would falsify it:** DealCheck or BiggerPockets ships chat-native analysis surface within 12 months.

**Observable signals:**
- Public feature announcements
- Incumbent valuations / fundraising signals
- User reviews mention chat features

**Severity:** 🟡 Medium. Calculator → chat-native conversion is harder than they think (architectural lock-in), but not impossible.

**Kill-switch criteria:**
- Incumbent ships chat-native at >50% feature parity → emphasize substrate moat (data they don't have) and audit trail (lock-in they don't have)

**Mitigation playbook:**
- Per thesis assertion #1, incumbents are architecturally locked
- Substrate weight + B2B lock-in are non-replicable short-term
- Track 3 thought leadership establishes us as the architecturally-native voice

---

### R-C3 🟢 — Generic AI agent platforms (LangChain, AutoGen, etc.) lower vertical-AI build barriers

**Risk framing:** General-purpose agent frameworks make it cheap for any team to ship a vertical AI agent.

**What would falsify it:** Multiple vertical-RE agent startups emerge in 2026-2027 funded by general-purpose tooling.

**Observable signals:**
- Vertical-AI startup tracking
- VC pitch decks similar to ours

**Severity:** 🟢 Low. Vertical AI agent thesis is broad; multiple players doesn't kill ours.

**Kill-switch criteria:** N/A.

**Mitigation playbook:**
- Substrate moat is non-replicable regardless of framework choice
- Per thesis §11.4, conservative calibration is the differentiator within vertical RE

---

## 9. Kill-switch checkpoints (expanding thesis §12)

Recap from thesis §12, with elaboration per architectural risks in this register.

### Week 6 checkpoint

Two-of-three required to push forward:

| Signal | Pass criterion | Tied to risk(s) |
|---|---|---|
| Wave 1 mesh functional | Wave 1 agents (W3-W5) all functional end-to-end via /app | R-A1, R-O1 |
| Substrate accumulating | Founder-historical backfill (W10) complete + ≥500 events in substrate | R-T4, R-S1 |
| Cost per query within target | Average per-query cost <$0.05; cache hit rate trending toward 85% | R-A3, R-E1 |
| Track 3 cadence holding | 12+ posts shipped in 6 weeks | R-O3 |

**Miss 2 of 4 = stop and reassess.** If miss is on "Wave 1 mesh functional," that's R-A1 (calibration check) and requires architect deep dive before continuing.

### Week 12 checkpoint

| Signal | Pass criterion | Tied to risk(s) |
|---|---|---|
| B2B demo signal | 5+ cold demos completed; verbatim "would pay" from at least 1 | R-T2, R-T5, R-B1 |
| Substrate weight | ≥500 real analyses (founder + adversarial + any pilot); ≥200 override events | R-T4, R-S1 |
| Chat-native overlay | End-to-end /app surface functional; ≥100 organic-traffic chat sessions | R-T1, R-A1 |
| Track 3 inbound | DMs / connection requests from technical audience | R-O3 |

**Miss 2 of 4 = stop and reassess.** Most common failure here: substrate weight (R-T4) — addressable via B2B pilot acceleration.

### Week 20 checkpoint

| Signal | Pass criterion | Tied to risk(s) |
|---|---|---|
| Paid B2B pilot in motion | 1+ paid B2B pilot active | R-T2, R-T5, R-B1 |
| Substrate at 2K | ≥2,000 real analyses | R-T4 |
| Investor / hire inbound | At least one of: seed VC interest, AI-native angel inbound, qualified hire opportunity for founder | R-T2, R-O3 |

**Miss 2 of 3 = neither company-building nor personal-repositioning track is producing.** Strategic review required.

---

## 10. Observable signal dashboard — what we track

Consolidated from per-risk signals. Founder-facing operational dashboard should include:

### Daily (automated)
- Calibration check pass rate (R-T1, R-A1)
- Zod parse failure rate on event writes (R-S1)
- LLM error rate (R-A2)
- CostEvent volume

### Weekly (manual review)
- Substrate event volume + per-type distribution (R-T4, R-S1)
- Cache hit rate (R-A3)
- Average per-query cost (R-E1)
- Override-event aggregation by field (R-T1)
- Founder time logged per track (R-O1, R-O2)
- Track 3 cadence + audience composition (R-O3)
- Adversarial critic signal ratio per persona (R-T1)

### Monthly (founder + Marcus Chen review)
- B2B demo pipeline progression (R-T2, R-T5, R-B1)
- Per-tier unit economics (R-E1)
- Retail conversion / churn (R-T2)
- Competitive landscape scan (R-C1, R-C2)
- Risk register review — any signal trends toward kill-switch?

---

## 11. Open risk-register questions

1. **R-T1 calibration tolerance.** Zero-tolerance is intent. If practical wave 1 implementation reveals a small unavoidable tolerance (±1 dealQuality due to floating point or rounding) for ≤5% of fixtures, do we accept that as deterministic or treat it as drift? Architect to decide before W4-S4 lands.

2. **R-O1 founder hour tracking.** Track manually (weekly log) or automate (calendar / git activity)? Bias: manual log; founder ownership prevents gaming.

3. **R-T2 retail signal interpretation.** What's the minimum data point to call retail a "yes pays durably"? Bias: 200+ paying users with <5% monthly churn over 90 days.

4. **R-C1 foundation labs monitoring.** Quarterly review enough, or set up automated tracking of Anthropic/OpenAI feature releases? Bias: quarterly is enough — earlier signals are noisy.

5. **R-T5 B2B segment "would pay" definition.** Verbatim "we would pay $X for this" vs. "this looks useful" vs. "tell us about pricing." Bias: verbatim "we would pay" or "send us the pilot agreement" — anything less is interest, not commitment.

6. **Risk-register review cadence.** Weekly during wave 1; monthly after? Bias: monthly with weekly spot-checks on R-T1, R-S1, R-O1.

---

## 12. Changelog

- **2026-05-11 (v1):** Initial risk register. 5 thesis bets + 3 B2B-specific + 3 substrate/moat + 4 architectural + 3 cost/economics + 4 operating-model + 3 competitive risks = 25 risks across 7 categories. Each with: framing, falsification criteria, observable signals, severity (🔴/🟡/🟢), kill-switch thresholds, mitigation playbook. Week 6/12/20 checkpoints expanded with two-of-three thresholds tied to specific risk IDs. Observable signal dashboard consolidated (daily / weekly / monthly cadences). 6 open risk-register questions flagged for founder decision.

  Completes the third and final thesis decomposition artifact per thesis §0/§14. All three Marcus-decomposition outputs (BACKLOG, FIRST_2_WEEKS, RISK_REGISTER) now exist on reanalyzr-2.0 alongside the architect-authored architecture suite. Wave 1 planning surface is complete.
