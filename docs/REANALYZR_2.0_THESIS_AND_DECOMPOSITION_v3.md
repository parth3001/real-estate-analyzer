# REanalyzr — Product 2.0 Thesis & Decomposition Brief (v3)

**Document type:** Strategic handoff — thesis in, work decomposition out
**Authored:** May 8, 2026 (supersedes v1 and v2 of same date)
**Authors:** Parth (Founder) + Marcus Chen v2 (Strategic Advisor)
**Audience:** Marcus Chen persona running inside Claude Code (engineering decomposition)
**Status:** Active. Source of truth for Product 2.0 work breakdown.

---

## 0. How to use this document

This is the **strategic input** to engineering decomposition. It establishes:

- *Why* we're doing what we're doing (the thesis, refined)
- *What* the target shape is (substrate + agent mesh + orchestrated surface)
- *What's kept vs. released vs. reframed*
- *How* the next 6 months sequence as parallel tracks
- *What angles* we explicitly considered and where the open questions land

This is **NOT** a product spec, schema design, or sprint plan. Those are decomposition output.

**When Marcus runs in Claude Code with this doc, the expected output artifacts are:**
1. `/docs/PRODUCT_2.0_BACKLOG.md` — workstreams → epics → stories with estimates and dependencies
2. `/docs/PRODUCT_2.0_ARCHITECTURE.md` — substrate schema sketch, orchestrator design, agent boundary heuristic, A2A adapter pattern, evals strategy, cost model
3. `/docs/PRODUCT_2.0_RISK_REGISTER.md` — what could falsify each piece of the thesis, observable signals if we're wrong, kill-switch criteria
4. `/docs/PRODUCT_2.0_FIRST_2_WEEKS.md` — concrete shippable units for weeks 1-2

---

## 1. TL;DR

REanalyzr is re-shaping from "honest RE calculator" to **operating system for real estate investors and the institutions that lend to them, built on an agent-orchestrated architecture with a compounding underwriting substrate as the long-term moat.**

OS positioning has been on the home page since April. **The change in 2.0 is not positioning — it's (a) a chat-native surface that makes the OS positioning actually convert, and (b) a backend rebuild from calculator-architecture to agent-mesh-and-substrate architecture.**

This is a **re-shape, not a rewrite.** Engine, decision logic, walk-away pricing, pipeline, portfolio code are kept. Frontend stays mostly intact during the rebuild (classic strangler-fig pattern). Chat-native ships as evolution of existing UI.

**Customer truth:** Retail RE investors will likely not pay durably for analysis tools. We launched, did outreach, got signups, and have **zero paying users**. AI substitution risk compresses retail willingness-to-pay toward zero on a 24-36 month horizon. The buyer who *will* pay is B2B: small-to-mid lenders (credit unions, community banks, hard-money shops), small underwriting consultancies, and RE professionals who make money per deal (wholesalers, syndicators).

**Operating model — three parallel tracks:**
- **Track 1 — Architecture rebuild (main):** substrate + agent mesh + chat-native overlay. Driven through Claude Code with founder as senior architect/reviewer.
- **Track 2 — B2B validation (slow-burn):** founder-led outreach, demos, relationship-building. Realistic first paying B2B customer is 6-12 months out. B2B's job in months 1-6 is to **shape architecture decisions**, not produce revenue.
- **Track 3 — LinkedIn (learner posture, dual-purpose):** Public technical documentation of the work. Builds the company's surface area for inbound while simultaneously serving as skills repositioning for the founder's job search. Voice is "engineer working through interesting problems," not "founder building a startup."

**OS is the destination, B2B is the buyer, the substrate is the moat.** All three statements have to be true together for the thesis to hold.

---

## 2. Strategic Thesis

### 2.1 What we're building

An **operating system for real estate investors and the institutions that lend to them.** Daily presence, not occasional use. Orchestrates external data (RentCast, FRED, Census, MLS, county records, eventual lender data) and presents one coherent surface. Accumulates context that compounds across sessions.

**B2B-led, B2C-supported:** small lenders and RE professionals are the paying customers. Retail surface remains free (or low-priced for high-intent self-identifying users) — its job is top-of-funnel acquisition and substrate seeding, not revenue.

### 2.2 Why now (the timing argument)

- **Calculator category half-life is 24 months at most.** Foundation models with tool-calling + API integrations replace generic deal-analysis calculators at $0 marginal cost to the user. The category collapses, not just incumbents in it.
- **Retail willingness-to-pay for analysis tools is heading to zero.** Validated by our own zero-paying-users baseline despite a working product, public launch, outreach, and content. Better engines produce *more invisible* value (avoidance of bad outcomes the user never experiences). Unwinnable B2C at scale.
- **Regulated lenders are required to underwrite conservatively.** The conservative bias that makes us weird in retail is exactly what regulated B2B buyers need.
- **AI compresses build timelines.** What was a 10-year Bloomberg-style build is now 2-3 years.
- **Vertical AI agent thesis is the dominant 2026 VC narrative** with documented proof points.
- **Incumbents can't pivot.** DealCheck, BiggerPockets, PropStream, RentalCalc are architecturally locked into the calculator paradigm. They built tools, not substrates. They won't pivot.

### 2.3 The moat

**A dataset that ships a tool, not a tool that logs data.**

Every surface — analysis, pipeline, portfolio, override, walk-away — writes to one typed substrate capturing:
- Verdicts and conservative underwriting assumptions behind them
- Walk-away prices and reasoning trails
- User overrides (when underwriters disagree with the engine — highest-signal data)
- Outcomes (closed deals, pass-throughs, post-purchase performance — eventually)
- Adversarial agent critiques and how the engine handled them
- Audit trail data that B2B compliance teams use

The substrate IS the company. Tools are the acquisition mechanism. Incumbents cannot copy this without years of investor/underwriter behavior data.

**Substrate weight threshold:** ~5,000-10,000 analyses across 200-500 distinct active users with at least some outcome signal.

**B2B is the substrate accelerant, not just the long-term destination.** One credit union running 200 deals/quarter generates more substrate than 100 retail users.

### 2.4 Why this is defensible (vs. a wrapper)

Durable AI products earn the right to charge by owning either proprietary data, distribution, or workflow lock-in.

REanalyzr 2.0 has a real shot at:
- **#1 (proprietary data)** — through the underwriting substrate
- **Partial #3 (workflow lock-in)** — through deal → pipeline → portfolio orchestration on the B2B side, where switching cost is high (compliance docs, audit trails, LOS integration)

---

## 3. The Bet, in Plain English

We are betting that:

1. By Q3 2027, "calculator" as a category is a feature inside chat-native AI platforms, not a destination product.
2. The market that pays for honest underwriting is regulated lenders and RE professionals — not retail investors.
3. Underwriters and lending institutions will pay for an *agent that knows their portfolio + their underwriting standards + their market* more than for a calculator they configure each time.
4. The first vertical AI agent in RE that gets to substrate weight will compound — overrides and outcomes make the next analysis better.
5. Conservative, honest underwriting is the right calibration. Optimistic engines train themselves into worse decisions because their substrate is contaminated by deal-promotion bias.

If any of these is wrong, the thesis cracks. The risk register (decomposition output) needs falsifying observations for each.

---

## 4. Asset Inventory — Kept vs. Released vs. Reframed

### 4.1 Kept

| Asset | Status | Role in 2.0 |
|---|---|---|
| Investment Decision Engine v2.1/v3.0 (BaseDecisionEngine + SFR/MF) | Production | Core scoring agent — lifted into agent mesh |
| Walk-away pricing logic | Production | Highest-signal differentiator; surfaced via agent and exported in PDF/audit views |
| Conservative underwriting calibration | Production | The substrate's calibration target — preserved exactly |
| BRRRR + Buy & Hold + Multi-Family analyzers | Production | Tools called by agents, not destinations |
| Deal Pipeline | Production | Pipeline-agent surface |
| Portfolio (incl. commercial support) | Production | Portfolio-agent surface |
| RentCast / FRED / Census integrations | Production | Wrapped as enrichment-agent |
| AI-enhanced messaging (GPT-4o-mini) | Production | Lifted into Q&A agent |
| MongoDB + caching layer | Production | Substrate persistence (with schema evolution) |
| 60+ financial metrics, multi-year projections | Production | Computed on demand by agents |
| **Existing frontend (wizard + dashboard)** | Production | **Stays as-is during rebuild. Strangler-fig pattern. Chat-native evolves alongside, doesn't replace.** |
| **reanalyzr.com positioning and copy** | Production | **Stays as-is. No watering down. Hiring managers who read "shipped a real product" as a flight risk are filtering themselves out — that's a feature, not a bug.** |

### 4.2 Released

| Asset / Decision | Why released |
|---|---|
| **June 1 paid-user date** | Wrong milestone. Wrong customer. Released. |
| Subscription-first B2C monetization (~$19.99 / $49.99) | Retail willingness-to-pay is structurally near zero. Stripe stays available for high-intent retail, but is not the milestone. |
| "Honest RE calculator" as primary positioning | Subset of OS positioning, not the headline |
| Retail-first acquisition motion | Retail surface is free top-of-funnel, not paying market |
| 6-blog SEO cluster as primary growth lever | Continues to compound passively but not the priority |
| Influencer outreach as priority workstream | Paused indefinitely. Resumes only if substrate has visible weight worth pointing at. |
| Big-bang frontend replacement | Released — incremental modernization wins |

### 4.3 Reframed

| Asset | Old role | New role |
|---|---|---|
| MCP/agent marketplace play | B2B distribution wedge | **Awareness channel only.** No revenue assumption. |
| Magic link email | Retention mechanism | Still retention — but feeds agent context |
| reanalyzr.com domain | Calculator landing | OS surface — dual mode (existing UI + chat-native overlay) |
| API / `/api/deals/analyze` endpoint | B2B-facing API | Agent-callable tool surface (internal mesh + future A2A adapter) |
| **B2B (small lenders, underwriting consultancies, RE pros)** | **Long-term destination** | **Lead paying market. Drives architecture decisions in real-time. Substrate accelerant.** |

---

## 5. Target Architecture

### 5.1 The two-layer stack

```
┌─────────────────────────────────────────────────────┐
│  Surface: existing UI (kept) + chat-native overlay │
│  with embedded structured controls (tables,        │
│  charts, override sliders, audit trail views).     │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│  Orchestrator: routes intent → agent(s) → tools.   │
│  Maintains conversation + investor/underwriter      │
│  context. A2A-compatible at the edges.             │
└─────────┬─────────┬──────────┬──────────┬──────────┘
          │         │          │          │
     ┌────▼──┐ ┌────▼───┐ ┌────▼────┐ ┌──▼──────┐ ...
     │ Deal  │ │Enrich- │ │ Q&A /   │ │Portfolio│
     │ Score │ │ ment   │ │ Edu     │ │ Agent   │
     │ Agent │ │ Agent  │ │ Agent   │ │         │
     └───┬───┘ └────┬───┘ └────┬────┘ └────┬────┘
         │          │          │           │
         └──────────┴──────────┴───────────┘
                    │
            ┌───────▼────────┐
            │   SUBSTRATE    │
            │  (typed event  │
            │   store + KV)  │
            └────────────────┘
```

### 5.2 Internal agent mesh — wave 1

**3 agents in wave 1:**

1. **Deal-scoring agent** — wraps BaseDecisionEngine + SFR/MF engines. Returns verdict + walk-away + reasoning trail. **The wedge.**
2. **Enrichment agent** — wraps RentCast, FRED, Census. Pulls comps, market data, demographics on demand.
3. **Q&A / education agent** — wraps GPT-4o-mini messaging. Answers "what does cap rate mean," "why did this PASS," "what would change to make it BUY."

**Wave 2:** market-data agent, pipeline agent, portfolio agent.

Each agent writes to substrate on every invocation. Substrate writes are non-optional.

### 5.3 The substrate

A typed event store + KV layer capturing:

- **Investor/underwriter profile events** — preferences, risk tolerance, market focus, override patterns, institutional standards (B2B)
- **Analysis events** — every deal scored, with full input + output + assumptions
- **Decision events** — verdict, walk-away, override (if any), reasoning
- **Outcome events** (eventually) — closed/passed/walked, post-purchase performance, default signal (B2B)
- **Critique events** — adversarial agent runs, discrepancies, calibration signals
- **Conversation events** — what was asked, routed, returned
- **Audit trail events** (B2B-specific) — who underwrote, what assumptions, when, what was overridden, who approved

Constraint: substrate must be **queryable, append-only, structured well enough to train future agent behaviors on**. No JSON blobs in opaque columns. Schema design is decomposition output.

### 5.4 External agent partnerships — later

When substrate has weight, external agents (Zillow-agent, Plaid-agent, county-records-agent, lender-data-agents) become worth integrating with. Not chased in 2026.

What we *do* in 2026: A2A-compatible interfaces at the edges so when the protocol standard settles (Google A2A / Anthropic MCP / OpenAI Assistants converge), we swap **adapters, not architecture**.

### 5.5 The substrate seeding plan

Two seeding strategies in parallel during weeks 1-12:

1. **Founder-historical backfill** — Parth runs ~2 years of personal analyses through the new agent pipeline.
2. **Adversarial agent personas (2 minimum-viable: optimistic flipper + skeptical CPA).** Synthetic agents critique the engine. Disagreements become substrate events. Kill criterion: if 2 personas don't produce useful signal in 4 weeks, scope down further or pause.

**B2B substrate seeding (the accelerant):** as soon as one B2B pilot is live, that customer's deal flow seeds the substrate at 10-50x retail rate.

---

## 6. The 6-Month Sequencing — Three Parallel Tracks

### Track 1 — Architecture (main workstream, Claude-Code-driven)

#### Weeks 1-6 — Substrate + Agent Mesh POC (private)

**Goal:** Working internal agent mesh that the founder uses daily, with substrate accumulating real (founder-historical) and synthetic (adversarial) events.

- Substrate schema v0 + persistence
- Orchestrator skeleton (intent → agent routing)
- Deal-scoring agent (lift from existing engine)
- Enrichment agent (RentCast/FRED/Census wrap)
- Q&A agent (lift from GPT-4o-mini messaging)
- Eval scaffolding for all 3 agents (golden sets, regression suite, calibration check vs. existing engine)
- Cost model for agent mesh (token economics per query)
- Founder-historical backfill executed
- 2 adversarial personas implemented and run

**Exit criteria:** Founder can ask "should I buy [address]?" and get a coherent, substrate-aware answer. Each agent has eval coverage. Cost-per-interaction is modeled.

#### Weeks 7-14 — Wedge polish + chat-native surface + wave 2 agents

- Chat-native UI as overlay on existing frontend (NOT replacement)
- Activation moment specified and shipped: first interaction produces a visible substrate write
- Pipeline + Portfolio agents added (wave 2)
- Audit trail / "show me the assumptions" view (B2B requirement)
- PDF/exportable analysis output (B2B requirement)
- Multi-deal batch processing (B2B requirement)
- A2A-compatible edge interfaces sketched

**Exit criteria:** B2B prospect can complete a meaningful demo flow end-to-end. Activation moment works for first-time visitors.

#### Weeks 15-24 — Multi-user, integration polish, raise enablement

- Multi-user / team accounts (B2B requirement)
- White-label or "for [Lender Name]" branding (B2B nice-to-have)
- Substrate observability dashboards (also feeds Track 3 content)
- Raise narrative codified with 5 pillars (§10)
- Demo flow polished for VC and B2B audiences

### Track 2 — B2B validation (slow-burn)

**Realistic timeline:** First paying B2B customer is 6-12 months from today, not 90 days. Track 2's primary value in months 1-6 is **shaping Track 1 architecture decisions** via real underwriter feedback, not producing revenue.

#### Weeks 1-4 — Warm contact validation
- **Parimal demo (email sent May 8)** — first call. Goal: demo + capture verbatim feedback + ask "who else underwrites like us — would they pay for this?"
- 2-3 additional warm contacts identified and reached
- Capture every "can it also do X?" verbatim — feeds Track 1

#### Weeks 5-12 — Cold outbound
- 30 cold outbound emails to small lenders, credit union loan officers, hard-money shops, underwriting consultancies
- Target: 5 demo calls
- Demo iteration based on what each call teaches

#### Weeks 13-24 — Pilot conversations
- If demo signal is strong: convert 1-2 calls into paid pilot conversations
- Pilot scope: 30-60 days, paid, single seat or small team, ~$500-$2K/month
- Founder rides along on real deals during pilot
- Customer success is the founder, manually

**Failure criteria:** if 12 weeks of outreach (10+ cold demos completed) yields zero serious pilot conversations, the B2B segment thesis itself needs to be revisited.

### Track 3 — LinkedIn (learner posture, dual-purpose)

**Two jobs, one workstream:**
1. **Company-building:** attract inbound — investors, B2B prospects, partners, hires
2. **Personal repositioning:** demonstrate AI-native engineering capability for the founder's job search

**Posture: "engineer working through interesting problems publicly," NOT "founder building a startup."**

This isn't dilution of the work — the technical content is identical. It's voicing. Hiring managers worth working for in 2026 will read "ships real things on their own time" as capability. Hiring managers who read it as flight risk are filtering themselves out — that's a feature.

**Voice rules:**
- **First-person singular about the problem.** "I've been working on a vertical AI agent for real estate underwriting" not "we're building REanalyzr"
- **Curiosity over conviction.** "Here's what I learned about [substrate design / agent orchestration / cost economics / evals]" not "here's our roadmap"
- **Technical content over startup vocabulary.** No traction metrics, no MRR aspirations, no growth signals, no pivot narratives, no segment-shift announcements
- **Concrete decisions, not abstractions.** "I picked [X] over [Y] because [tradeoff]" lands. "We're rethinking our architecture" doesn't.

**Content priority — what hits hardest for both jobs simultaneously:**
- Substrate design choices and tradeoffs
- Agent orchestration patterns
- Eval framework decisions
- Cost economics of agent meshes (token budgets, model-tier choice, caching)
- A2A / MCP / Assistants protocol observations
- "What didn't work" posts — these land harder than wins

**Content priority — what to avoid:**
- Anything that reads as pitch
- Customer/segment strategy narratives
- Pivot announcements
- Growth metrics or aspirations
- Industry analysis dressed as marketing

**Cadence:** 2 posts/week minimum, 3 if doable. Mix of formats (1 substantive technical, 1 shorter "what I shipped/learned this week," occasional reply-engagement on others' content). Visibility consistency matters as much as quality.

**About reanalyzr.com itself:** stays as-is. Pitch-style copy, OS positioning, all of it. If a hiring manager digs into the site after seeing LinkedIn posts and reads it as flight risk — they're self-selecting out of a relationship that wouldn't have worked. No site rewrites, no inconsistency management, no founder-hours wasted on softening marketing copy.

**If asked directly in interviews:** "Yes, I've been exploring whether this can become something, but I'm primarily looking for a senior role where I can apply these skills at scale." Honest, short, doesn't apologize.

---

## 7. Founder Throughput Model

**The constraint isn't typing speed. It's specification quality and review bandwidth.**

Implementation runs through Claude Code under founder direction. This shifts the throughput math meaningfully:

- **Founder hours = direction, decisions, review, integration** — not raw typing
- **Claude Code = implementation under direction** — effectively unlimited capacity within review bandwidth
- **Bottleneck = how well work can be specified, reviewed, and integrated**

This is exactly the constraint the four output docs (§0) are designed to optimize. Clean thesis + clean architecture doc + clean backlog = Claude Code runs implementation, founder stays at the directing layer.

**Founder hour budget is variable, not fixed.** Some weeks (interviews, day-job, conferences, family) lower throughput; some weeks higher. The 6-month timeline holds in expectation; specific weeks may slow.

**Decomposition implication for Claude Code:** size work units for Claude-Code-driven implementation with **clear specs, well-bounded scope, explicit exit criteria**. Optimize for review bandwidth, not for typing minimization. A well-specified 4-day Claude Code run is preferable to a vague 1-day run that needs 3 rework cycles.

---

## 8. Workstreams to Decompose

Candidate epics. Decomposition output should include stories + tasks + estimates per workstream, sized for Claude-Code-driven implementation.

1. **Substrate** — schema, persistence, query layer, append-only event log, KV state
2. **Orchestrator** — intent recognition, agent routing, conversation memory, investor/underwriter context
3. **Agent mesh — wave 1** — deal-scoring, enrichment, Q&A
4. **Agent mesh — wave 2** — market-data, pipeline, portfolio
5. **Adversarial agents** — 2 minimum-viable personas + critique loop + 4-week kill criterion
6. **Founder-historical backfill** — data pipeline + execution
7. **Chat-native surface (overlay, not replacement)** — embedded structured controls, activation moment, integration with existing UI
8. **A2A-compatible edges** — protocol-agnostic adapter layer
9. **Substrate observability** — internal dashboards (also feeds Track 3 content)
10. **Evals & trust signals** — golden sets, regression suite, calibration check per agent
11. **Cost economics model** — token cost per agent invocation, per query, per user; caching strategy; model-tier choice (Haiku/Sonnet/Opus/4o-mini)
12. **B2B-ready output surfaces** — PDF export, audit trail view, multi-deal batch, multi-user accounts
13. **Data licensing review** — RentCast/FRED/Census ToS audit for substrate storage and re-display rights
14. **Raise enablement** — narrative artifacts, demo flow, founder-to-investor materials
15. **Track 3 content production support** — substrate observability dashboards designed dual-purpose (internal monitoring + LinkedIn-shareable findings)

---

## 9. Constraints & Non-Negotiables

These don't get re-debated in decomposition.

- **Honest analysis over deal rationalization** — substrate's calibration is conservative by design. PASS verdicts are the product.
- **Re-shape, not rewrite** — existing engine is the unfair advantage. Lifting code into agents is the default; rewriting requires explicit justification.
- **Frontend stays during rebuild** — strangler-fig pattern. Chat-native is overlay/evolution, not clean-room replacement.
- **reanalyzr.com stays as-is** — no marketing copy rewrites for hiring-manager optics. Inconsistency between the site and LinkedIn voice is acceptable and intentional.
- **Substrate writes on every interaction** — non-optional. Tools that don't write to substrate don't ship.
- **Append-only, structured substrate** — no opaque blobs.
- **Protocol-agnostic edges** — no architectural commitment to MCP-only or A2A-only. Adapters at the edges.
- **Claude-Code-driven implementation** — work units sized for clear specification + review, not for minimum typing
- **B2B first as paying market** — retail surface stays free or low-priced. Don't optimize architecture for retail-payment scenarios.
- **LinkedIn voice = learner, not founder** — Track 3 protects the founder's job-search optionality without watering down the work itself
- **No fake metrics, no inflated claims, no false traction** — applies to LinkedIn, raise materials, B2B pitches.
- **Peer positioning with all partners and investors** — never vendor-client framing.

---

## 10. Open Architecture Questions

These need engineering judgment during decomposition. Priority order.

1. **Substrate primitives.** Event store choice (MongoDB extended? Postgres + jsonb? Dedicated event-log DB?). Append-only vs. soft-delete. Schema migration strategy.
2. **Orchestrator implementation.** Build vs. framework (LangGraph, CrewAI, custom). Lean: custom for orchestrator, framework only for individual agent scaffolding.
3. **Agent boundaries.** What's a separate agent vs. a tool inside another agent? Heuristic candidate: "if its substrate writes are categorically different, it's an agent."
4. **A2A edge contract.** What does "A2A-compatible" mean concretely in May 2026 given the standard hasn't converged? Adapter pattern with known unknowns flagged.
5. **Conversation memory model.** Per-session, per-user, or hybrid? How does it interact with substrate?
6. **Override-as-signal.** When a user disagrees with the engine, how do we capture it? Inline correction in chat? Structured override modal? Both?
7. **Cold-start surface.** First-time visitor sees what? Chat with no context, or guided "tell me about your portfolio/institution" onboarding that seeds substrate immediately?
8. **Stripe gating.** Where does the value-capture gate live in a chat-native flow for high-intent retail users?
9. **Eval infrastructure.** How do we know each agent is good? Golden sets sourced how? Regression suite cadence? Calibration check vs. existing engine — what's the threshold for agent-divergence-as-bug vs. agent-improvement?
10. **Cost economics.** What's the token budget per query at $19.99/mo, $200/mo, $2K/mo price points? When does the unit economics break?
11. **Activation moment in chat.** First interaction must produce a visible substrate write. What's the most natural one — watchlist add? Profile capture? Practice analysis?
12. **Frontend integration.** How does chat-native overlay coexist with existing wizard UI? Side-by-side? Toggle? Progressive disclosure?

---

## 11. Raise Narrative — 5 Pillars

(For raise enablement workstream. Listed here so decomposition surfaces what proof we need to build for each.)

1. **Category timing.** Calculator dead in 24 months. Vertical AI agent thesis is dominant 2026 narrative.
2. **AI compression.** 10-year Bloomberg-style build is now 2-3 years.
3. **Substrate moat.** Proprietary underwriting calibration + behavior data. Replicable only by a founder spending years on conservative-by-default underwriting at the substrate level.
4. **Architectural unfair advantage.** 18 months of engine, walk-away math, decision logic shipped. New entrants start at zero.
5. **Founder-market fit.** 10 years of personal RE investing including 100+ multifamily passes that proved prescient. Substrate calibration is the founder's calibration.

**Investor question prep — "Why won't OpenAI/Anthropic ship this as a vertical inside ChatGPT/Claude?"**
- Foundation labs won't because: (a) training data leans optimistic, not conservative — they cannot easily ship a tool that's required to be honest in regulated lending contexts; (b) they don't have proprietary underwriter override data; (c) B2B trust in regulated lending is built through narrow vertical relationships, not general-purpose chatbots; (d) workflow lock-in via audit trails, compliance integration, LOS connectors is invisible from above.
- Deliverable in 90 seconds, cold.

**Investor target list (build before week 7):**
- AI-native partners at vertical-AI-thesis funds (Conviction, Coatue's seed, Greylock's AI track, OpenAI fund, specific a16z partners)
- NOT generalist seeds or post-W25 YC partners who have tightened to "show me revenue"

---

## 12. Failure Criteria & Kill Switches

What does "this isn't working" look like at observable milestones? Decomposition's risk register expands these.

**Week 6 checkpoint:**
- Wave 1 agents all functional? If not, scope wave 1 down further.
- Substrate accumulating real events from founder-historical backfill? If not, schema is wrong shape.
- Cost-per-query within 10x of target? If not, model-tier strategy needs rework.
- Track 3: 12+ posts shipped? If not, cadence isn't holding.

**Week 12 checkpoint:**
- 5+ B2B demo calls completed? If not, segment thesis itself is shaky.
- Verbatim "would pay" signal from at least 1 demo? If zero across 5+, B2B fit hypothesis needs revisiting.
- Substrate has ≥500 real analyses (founder + adversarial + any pilot)? If not, weight trajectory is too slow.
- Chat-native overlay exists end-to-end? If not, surface workstream is bottlenecked.
- Track 3: inbound DMs / connection requests from technical audience? If zero, learner-posture content isn't landing — voice needs adjustment.

**Week 20 checkpoint:**
- 1 paid B2B pilot in motion? If not, raise narrative loses its strongest pillar.
- Substrate has ≥2,000 real analyses? If not, substrate weight unreachable in calculator-fade window.
- Inbound from at least one of {seed VC, AI-native angel, qualified hire opportunity for founder}? If not, neither company-building nor personal-repositioning track is producing.

**Hit two of three at each checkpoint = push forward. Miss two of three = stop and reassess.**

---

## 13. Founder Optionality

**Two simultaneous optimization functions, both honored:**

1. **Build optionality** — REanalyzr 2.0 succeeds, founder runs the company through raise and beyond
2. **Career optionality** — REanalyzr 2.0 doesn't reach escape velocity, but the founder emerges from this period significantly more employable in a market that pays for AI engineering + RE domain depth

These are not in tension. The work that builds the company is the same work that demonstrates the capability. Track 3's learner posture is what makes both tracks visible without forcing one to compromise the other.

Decisions are made for company upside. Career outcome rides for free.

---

## 14. Handoff Instructions for Marcus-in-Claude-Code

When Marcus-in-Claude-Code reads this doc, produce the following artifacts in the project repo:

1. **`/docs/PRODUCT_2.0_BACKLOG.md`** — workstreams from §8 decomposed into epics → stories. Include rough estimates and dependencies. Size for Claude-Code-driven implementation (clear specs, well-bounded scope, explicit exit criteria).
2. **`/docs/PRODUCT_2.0_ARCHITECTURE.md`** — answers (or explicit "deferred" rationale) for the open questions in §10. Include substrate schema sketch, orchestrator design, agent boundary heuristic, A2A adapter pattern, evals strategy, cost model.
3. **`/docs/PRODUCT_2.0_RISK_REGISTER.md`** — what could falsify each piece of the thesis in §3. What we'd observe if wrong. Kill-switch criteria. Expand on §12.
4. **`/docs/PRODUCT_2.0_FIRST_2_WEEKS.md`** — concrete shippable units for weeks 1-2 of Track 1. Branches, PRs, exit criteria per unit.

**First action: read the existing repo (ARCHITECTURE.md, DATA_DICTIONARY.md, the engine code, the Investment Decision Engine) before producing any output. Decomposition is more honest grounded in what's actually shipped, not in summaries.**

Constraints on decomposition:

- Respect the kept-vs-released table (§4). Don't decompose work on released assets.
- Respect the non-negotiables (§9). They are not trade-offs.
- Where the thesis doc says "out of scope" or "decomposition output," produce the decomposition output — don't punt back to strategy.
- Where engineering judgment differs from this doc, flag the disagreement explicitly with reasoning. Don't silently override.
- Honor the three-track parallel model (§6). Track 1 is architecture (Claude-Code-driven). Track 2 is B2B validation (founder-led, slow-burn). Track 3 is LinkedIn (learner posture, dual-purpose).
- Honor the founder throughput model (§7). Variable hours, Claude-Code-driven implementation, work units sized for review bandwidth.

When in doubt, the heuristic is: **does this build substrate weight, or does it not?** Substrate-building work is privileged in week 1-6.

---

## Appendix A — What we explicitly debated and decided

**May 4 decisions (held):**
- Re-shape, not rewrite. Existing engine is the unfair advantage.
- Internal agent mesh first, external partnerships later.
- Marketplace strategy reframed as awareness, not distribution.
- Domain: reanalyzr.com stays primary.

**May 8 refinements:**
- **Customer reframe:** retail RE investors will not pay durably. B2B is the lead paying market, not the long-term destination.
- **Frontend strategy:** strangler-fig modernization. Existing UI stays. Chat-native ships as overlay.
- **Track structure:** three parallel tracks (architecture main + B2B validation slow-burn + LinkedIn learner-posture), not a single monolithic plan.
- **B2B realism:** first paying customer is 6-12 months out, not 90 days. Track 2's first-6-months value is shaping architecture decisions, not revenue.
- **Throughput model:** Claude-Code-driven implementation. Founder hours = direction/review, not typing. Hours are variable, not fixed at 25/week or 15/week.
- **LinkedIn workstream added:** dual-purpose (company building + personal repositioning). Voice is learner, not founder. 2-3 posts/week.
- **reanalyzr.com inconsistency accepted:** site stays as-is. Hiring managers who read "shipped real product" as flight risk are self-selecting out — feature, not bug.
- **Architecture additions:** evals workstream, cost economics workstream, B2B output surfaces workstream, data licensing review.
- **Raise narrative additions:** "why won't OpenAI/Anthropic build this" answer pre-built. Investor target list before week 7.
- **Failure criteria:** explicit checkpoints at weeks 6, 12, 20 with two-of-three thresholds. Track 3 metrics added at each checkpoint.

---

## Appendix B — What this doc deliberately does NOT decide

These remain open and Claude Code is NOT asked to decide them in decomposition:

- Specific pricing for first B2B pilot — set by Parimal-call signal and first cold-demo learnings
- Specific first B2B target segment (credit unions vs. hard-money lenders vs. underwriting consultancies) — set by which demo cohort responds
- Raise timing — set by traction signals, not calendar
- Whether to take pre-seed vs. seed — set by traction at raise time
- Whether founder accepts a job offer mid-build — depends on offer quality and Track 1/Track 2 trajectory at the time
- Specific LinkedIn post topics — Track 3 voice rules in §6 are guidance; specific posts emerge from architecture work itself

---

## Appendix C — Document changelog

- **2026-05-08 (v1):** Initial codification of May 4 strategy session.
- **2026-05-08 (v2):** Customer reframed (B2B-led). Strangler-fig frontend. Two-track parallel sequencing. Founder-hours reality (25/week budget). 10 angles incorporated.
- **2026-05-08 (v3, this doc):** Added Track 3 (LinkedIn, learner posture, dual-purpose for company-building + personal repositioning). Replaced fixed founder-hours budget with Claude-Code-driven throughput model (variable hours, review bandwidth as constraint). Locked reanalyzr.com as-is — no marketing rewrites. Wave 1 agents stay at 3 (Claude Code makes this realistic). Adversarial personas stay at 2. 6-month timeline holds. Supersedes v1 and v2.
