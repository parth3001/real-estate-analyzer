# LinkedIn Campaign — Builder's Journey on Agentic Architecture

**Started:** 2026-05-24 (Memorial Day weekend)
**Goal:** Personal tech chops + learn-in-public. NOT product marketing. Voice = builder-diary, first person, honest about struggle.

---

## Strategy at a glance

- **Three-post arc:** Pivot (Sat) → Reckoning (Sun) → Conviction (Tue).
- **Skip Memorial Day Monday** (US holiday, low engagement). Tuesday catches post-holiday catch-up scroll.
- **Voice:** Direct. Specific numbers. Honest about pivots and bugs. Anti-hype. Asks for input rather than declaring answers.
- **Don't name REanalyzr in the hook.** This is about the builder, not the product. Product is setting, not subject.

## Audience calibration

- **Real audience:** potential hiring managers. User is job-seeking. (Confirmed 2026-05-24.)
- **Implication:** voice = senior engineer thinking aloud, NOT "learning in public" performance. Lead with conviction; back it with concrete artifacts. Drop soft CTAs (they attract peers, not hiring leaders).
- **Don't over-segment** — just write a post that signals senior-engineering judgment generally; any hiring manager who's right for him will recognize it.

---

## Post 1 — The Pivot (Saturday)

**Status:** Draft v3 ready — user-authored content, lightly polished + enhanced.
**Format:** LinkedIn ARTICLE (long-form, ~1100 words) with subheadings per phase.
**Voice:** User's own. Builder-diary, honest about the journey, 80/20 thesis as the throughline.

### ✅ Draft v5 — FINAL (2026-05-24, user-finalized)

> User's own final pass on v4. Voice / structure preserved; minor word-level edits + selective unbold + removed one hyphen ("operating model") + tightened closing CTA + dropped `#BuildInPublic` from hashtags. This is the version to publish.

---

# Experience converting a standard form-based workflow to an agentic architecture

It has been about a year (well, will be by this fall :-) ) since I started building a real estate investment analysis tool. The goal I started with: learn Claude Code and its capabilities by building a tool that solves a real problem.

Looking back at my own experience analyzing RE properties for investment worthiness, I had a spreadsheet sprawl. It started as a simple spreadsheet with a bunch of cells and formulas that gave me basic data points like cap rate, IRR, yearly projections, and some other math. So I took this as a real-world problem I could solve through vibe coding.

The journey so far has been tremendous and eye-opening. I've learned a lot in the process and continue to. It has played out in three distinct phases. Three versions of the same product, each one shaped by a different generation of tools and my own evolving understanding of what works.

But the one principle I never compromised on

Before getting into the phases, the principle I set for myself at the start and never broke:  I would not have any numbers calculated by AI. We are talking about $$. Real investment decisions. LLMs producing deterministic answers is a stretch. They hallucinate, lose context, and (perhaps most dangerously for analytical products) they tend to lean optimistic.

So the rule was simple: AI should be overlaid on how results are INTERPRETED, not on how they are PRODUCED. I called it the 80/20 rule. 80% my own deterministic engine, 20% AI commentary on top.

That single decision has shaped every architectural choice across all three phases.

## Phase 1 / Version 0.1: Cursor + SPA (early 2025)

My first attempt vibe coding, building a real-life product. Started with Cursor: a Node.js single-page architecture and a bunch of form fields. The user fills out the forms, the deterministic engine produces results, and then I'd call OpenAI's APIs with carefully designed prompts to interpret those results.

Prompt design at this stage was mostly about getting the persona right. Making sure the interpretation reflected how I (or an experienced investor) would actually read the numbers. The result was an MVP I'd built from scratch using vibe coding.

Challenges, of course:

- Cursor rate limiting
- Hallucinations mid-build
- Limited context documentation. Every Cursor crash or computer restart meant rebuilding the project context from scratch.

But all in all, a great experience learning something new. By the end of it, I had a decent feel for how to use vibe coding to ship something meaningful.

## Phase 2 / Version 1.0: Claude Code + a real team in `claude.md` (Fall 2025)

Not satisfied with the MVP, and watching Claude Code mature over Fall 2025, I made the switch. This time I wanted a full application: separate frontend and backend, external API integrations (FRED, RentCast, Census), deal persistence in MongoDB Atlas, authentication, a polished UX, and most importantly, a guided workflow that adapts to the user's experience level and their inputs.

The economics worked too. A Claude Max subscription was meaningfully cheaper than Cursor's token economy.

But the bigger unlock was something I didn't see coming: **the way you structure `claude.md` is the way you structure your team.**

I started defining personas in `claude.md` and invoking them by name during analysis sessions:

- A Product Expert
- A Business Expert (a real-estate investor persona)
- An Architect
- A Senior Full-Stack Engineer
- A QA Engineer
- A UX Designer
- A Mobile Developer
- A CPA (to validate the tax math the engine was producing)

Basically, my own product team, codified. When I had a UX decision to be made, I called the designer. Architectural question? I called the architect. The CPA persona validated tax-related calculations against industry standards. This changed everything: the app's output accuracy, the user experience, and the speed at which I could ship. A production-grade app with real users, built at a tiny fraction of what an actual team would have cost.

Of course, challenges continued:

- Hallucinations didn't go away. They just got subtler.
- `claude.md` management got harder as personas multiplied
- Keeping each persona aware of the latest decisions and documentation required deliberate, repeated effort

But getting `claude.md` right was the highest-leverage thing I did. Specific instructions per persona, with explicit expertise boundaries. It was like having a real startup team.

The product evolved accordingly. By the end of Phase 2, AI was firmly in its layer: interpreting investor experience level into useful commentary, explaining the impact of FRED rate changes, providing portfolio-level analysis, and translating complex terms for new investors. **The deterministic engine ran the math; the AI told the story.**

I also embedded years of engineering principles into ADRs (architecture decision records) that get pulled into context for every new feature or bug. So now I had a real operating model: an entire product-and-engineering team coded into Claude Code, an extensive decision log used as context, a test agent, and business-user personas validating outcomes.

## Phase 3 / Version 2.0: Agentic, chat-first, multi-agent (now)

With recent developments on the agentic front (A2A architectures, the explosion of MCP-style tooling), I felt it was time to reinvent again.

I took this phase with a specific question: *how would I transform a form-based workflow app, with multiple external integrations, into a chat-based interface where users can analyze any number of scenarios, unbounded by a fixed form's data model, using a multi-agent backend whose tools produce deterministic results from the existing engine?*

The principles carried over and got sharper:

- Keep the 80/20 rule
- Keep LLM outputs from leaning optimistic. Every recommendation must be grounded in fact, because we are talking about $$.
- Make the chat experience unbounded by form fields or the application's data model

All achieved with a multi-agent architecture. The user's input flows through four layers (and yes, token cost is part of the design):

- **Layer 1.** Intent classifier
- **Layer 2.** Structured input extraction, Zod-validated
- **Layer 3.** The deterministic engine and other tool calls (this is where math happens, never the LLM)
- **Layer 4.** LLM-bounded narrative around the verified results

I'm currently testing this architecture in the wild to see where the boundaries and capabilities really land. There are lessons I'm picking up faster than I can publish them.

## What's next here

I'll continue publishing this experiment in pieces. The business value of transforming form-based workflow apps into agentic ones, the practical realities of A2A architecture, token-cost control, and the failure modes that don't show up in tutorials but absolutely do show up in production.

If any of the below would be useful to you, drop a comment or DM and I'll share:

→ **The app itself.** Currently live with real users analyzing deals. Happy to share access if you're a fellow RE investor and want to kick the tires.
→ **Code samples + architecture diagrams.** The 4-layer agentic flow, the deterministic engine seam, the Zod-validated extraction layer that keeps the LLM out of the math path.
→ **My `claude.md` persona setup.** The operating model template that turned solo work into a real team. The biggest single leverage point of Phase 2.
→ **The 80/20 framework as a checklist.** For your own AI / non-AI architectural decisions, especially in any product that produces numbers users will actually act on.

Happy to compare notes with builders making the same leap from form-based to agentic or developing new apps from scratch.

#AgenticAI #ClaudeCode #VibeCoding #PropTech

---

### FINAL — ready to publish

**Title:** *From Forms to Agents: What I Learned Rebuilding a Product with Claude Code*

**Hashtags:** `#AgenticAI #ClaudeCode #VibeCoding #PropTech`

**Publish window:** any evening this week, 6:30–7:30pm Eastern (Tuesday/Wednesday catches the post-holiday catch-up scroll best)

**Draft URL (private — only the author can access):**
https://www.linkedin.com/article/edit/7464739675774291968/

**Public URL (LIVE — published Tue night, 2026-05-26):**
https://www.linkedin.com/pulse/from-forms-agents-what-i-learned-rebuilding-product-claude-patel-va8oc/

**Engagement-tracking notes:** Check 12hr / 24hr / 72hr marks. Capture which lines get quoted in comments — that's Post 2 fuel.

**Body:** see "Final body" section below.

---

### Draft v4 (2026-05-24 — em-dashes removed per user request) — SUPERSEDED BY v5

> NOTE: compound-word hyphens like "form-based", "real-estate", "single-page" are kept (standard English usage). Only em-dashes (—) were stripped. If the user wants those hyphens gone too, that's a separate pass.

---

# Experience converting a standard form-based workflow to an agentic architecture

It has been about a year (well, will be by this fall :-) ) since I started building a real estate investment analysis tool. The goal I started with: learn Claude Code and its capabilities by building a tool that solves a real problem.

Looking back at my own experience analyzing RE properties for investment worthiness, I had a spreadsheet sprawl. It started as a simple spreadsheet with a bunch of cells and formulas that gave me basic data points like cap rate, IRR, yearly projections, some other math. So I took this as a real-world problem I could solve through vibe coding.

The journey so far has been tremendous and eye-opening. I've learned a lot in the process and continue to. It has played out in three distinct phases. Three versions of the same product, each one shaped by a different generation of tools and my own evolving understanding of what works.

## The one principle I never compromised on

Before getting into the phases, the principle I set for myself at the start and never broke: **I would not have any numbers calculated by AI. We are talking about $$. Real investment decisions.** LLMs producing deterministic answers is a stretch. They hallucinate, lose context, and (perhaps most dangerously for analytical products) they tend to lean optimistic.

So the rule was simple: **AI should be overlaid on how results are INTERPRETED, not on how they are PRODUCED.** Call it the 80/20 rule. 80% my own deterministic engine, 20% AI commentary on top.

That single decision has shaped every architectural choice across all three phases.

## Phase 1 / Version 0.1: Cursor + SPA (early 2025)

My first foray into vibe coding. Started with Cursor: a Node.js single-page architecture and a bunch of form fields. The user fills out the forms, the deterministic engine produces results, and then I'd call OpenAI's APIs with carefully designed prompts to interpret those results.

Prompt design at this stage was mostly about getting the persona right. Making sure the interpretation reflected how I (or an experienced investor) would actually read the numbers. The result was an MVP I'd built from scratch using vibe coding.

Challenges, of course:
- Cursor rate limiting
- Hallucinations mid-build
- Limited context documentation. Every Cursor crash or computer restart meant rebuilding the project context from scratch.

But all in all, a great experience learning something new. By the end of it, I had a decent feel for how to use vibe coding to ship something meaningful.

## Phase 2 / Version 1.0: Claude Code + a real team in `claude.md` (Fall 2025)

Not satisfied with the MVP, and watching Claude Code mature over Fall 2025, I made the switch. This time I wanted a full application: separate frontend and backend, external API integrations (FRED, RentCast, Census), deal persistence in MongoDB Atlas, authentication, a polished UX, and most importantly, a guided workflow that adapts to the user's experience level and their inputs.

The economics worked too. A Claude Max subscription was meaningfully cheaper than Cursor's token economy.

But the bigger unlock was something I didn't see coming: **the way you structure `claude.md` is the way you structure your team.**

I started defining personas in `claude.md` and invoking them by name during analysis sessions:
- A Product Expert
- A Business Expert (a real-estate investor persona)
- An Architect
- A Senior Full-Stack Engineer
- A QA Engineer
- A UX Designer
- A Mobile Developer
- A CPA (to validate the tax math the engine was producing)

Basically my own corporate-style team, codified. When I had a UX question, I called the designer. Architectural question? I called the architect. The CPA persona validated tax-related calculations against industry standards. This changed everything: the app's output accuracy, the user experience, and the speed at which I could ship. A production-grade app with real users, built at a tiny fraction of what an actual team would have cost.

Of course, challenges continued:
- Hallucinations didn't go away. They just got subtler.
- `claude.md` management got harder as personas multiplied
- Keeping each persona aware of the latest decisions and documentation required deliberate, repeated effort

But getting `claude.md` right was the highest-leverage thing I did. Specific instructions per persona, with explicit expertise boundaries. It was like having a real startup team.

The product evolved accordingly. By the end of Phase 2, AI was firmly in its layer: interpreting investor experience level into useful commentary, explaining the impact of FRED rate changes, providing portfolio-level analysis, translating complex terms for new investors. **The deterministic engine ran the math; the AI told the story.**

I also embedded years of engineering principles into ADRs (architecture decision records) that get pulled into context for every new feature or bug. So now I had a real operating model: an entire product-and-engineering team coded into Claude Code, an extensive decision log used as context, a test agent, and business-user personas validating outcomes.

## Phase 3 / Version 2.0: Agentic, chat-first, multi-agent (now)

With recent developments on the agentic front (A2A architectures, the explosion of MCP-style tooling), I felt it was time to reinvent again.

I took this phase with a specific question: *how would I transform a form-based workflow app, with multiple external integrations, into a chat-based interface where users can analyze any number of scenarios, unbounded by a fixed form's data model, using a multi-agent backend whose tools produce deterministic results from the existing engine?*

The principles carried over and got sharper:
- Keep the 80/20 rule
- Keep LLM outputs from leaning optimistic. Every recommendation must be grounded in fact, because we are talking about $$.
- Make the chat experience unbounded by form fields or the application's data model

All achieved with a multi-agent architecture. The user's input flows through four layers (and yes, token cost is part of the design):

- **Layer 1.** Intent classifier
- **Layer 2.** Structured input extraction, Zod-validated
- **Layer 3.** The deterministic engine and other tool calls (this is where math happens, never the LLM)
- **Layer 4.** LLM-bounded narrative around the verified results

I'm currently testing this architecture in the wild to see where the boundaries and capabilities really land. There are lessons I'm picking up faster than I can publish them.

## What's next here

I'll continue publishing this experiment in pieces. The business value of transforming form-based workflow apps into agentic ones, the practical realities of A2A architecture, token-cost control, and the failure modes that don't show up in tutorials but absolutely do show up in production.

If any of the below would be useful to you, drop a comment or DM and I'll share:

→ **The app itself.** Currently live with real users analyzing deals. Happy to share access if you're a fellow RE investor and want to kick the tires.
→ **Code samples + architecture diagrams.** The 4-layer agentic flow, the deterministic engine seam, the Zod-validated extraction layer that keeps the LLM out of the math path.
→ **My `claude.md` persona setup.** The operating-model template that turned solo work into a real team. The biggest single leverage point of Phase 2.
→ **The 80/20 framework as a checklist.** For your own AI / non-AI architectural decisions, especially in any product that produces numbers users will actually act on.

Happy to compare notes with builders making the same leap from form-based to agentic. And if you're building or hiring around this kind of work, DMs open.

#BuildInPublic #AgenticAI #ClaudeCode #VibeCoding #PropTech

---

### What I changed vs the original draft

**Kept (the ethos):**
- 80/20 rule as the throughline
- 3-phase structure (V0.1 → V1.0 → V2.0)
- First-person builder-diary voice
- The "we are talking $$" framing
- "Vibe coding" terminology
- The smiley :-)
- Full persona list with the operating-model framing
- The "happy to collaborate" close
- The "publish more posts" forward-pointing thread

**Polished:**
- Spelling/typo cleanup (challanges → challenges, detereministic → deterministic, leanred → learned, intrsuctions → instructions, etc.)
- Run-on sentences broken for LinkedIn readability
- Added subheadings per phase (LinkedIn Article format)
- Bolded the two principle statements (80/20 rule, deterministic engine + AI story)

**Lightly enhanced based on product knowledge:**
- Phase 2: named the three external APIs (FRED, RentCast, Census) you actually integrated
- Phase 2: clarified the CPA persona was validating *tax math* specifically (not just generic "results")
- Phase 2: tightened the AI-use-cases list (experience-level commentary, FRED rate impact, portfolio analysis, term translation) — these match what the product actually does
- Phase 3: added MCP-style tooling as part of "what's new" context
- Phase 3: kept the 4-layer architecture but kept it intentionally compact — depth lives in future posts

### Length / format notes

- ~1,100 words → LinkedIn Article sweet spot
- 5 H2 subheadings — scannable in the LinkedIn article reader
- 3 bullet lists strategically placed (challenges, personas, principles)
- No emojis except your :-) preserved at the top
- No hashtags — your original didn't have any, kept it that way

### Open questions before publish

- The original had several internal contradictions/redundancies (e.g., "80/20" mentioned three times in similar terms) — I consolidated to two clean callouts. Want it tighter still, or are those callouts the right amount of emphasis?
- Should the closing list of upcoming topics be more specific (e.g., "Next post: how an AI agent confidently gave me the wrong answer and what I changed") or stay general?
- The 4-layer architecture is mentioned but not unpacked. Save the unpack for Post 2/3, or summarize one of them here as a preview?

---

### Draft v2 (revised 2026-05-24 — hiring-manager calibration)

---

For the user I'm building for, the form is the wrong primitive. I spent two months building one anyway — a 60-field wizard and an 11-tab analysis dashboard — before I committed to that read and rebuilt the entry surface as a chat. Here's the reasoning.

I'm building tools for individual real estate investors who need institutional-grade analysis but don't know what fields they should be asking about. A 60-field form serves the user who already knows what cap rate vs cash-on-cash means. The actual user I'm building for opens that form and bounces. And the ones who push through want to stress-test deals in arbitrary permutations — "what if rent drops 10% AND rate goes to 8% AND I put 30% down" — which a form can't support cheaply. Building that combinatorial UX in form-land is months of design and engineering. In chat, it's a single engine API call away.

I also picked this pivot for a personal reason: I wanted to learn agentic architecture by shipping it in production, not by watching tutorials. That bet is two weeks old. Here are the four calls I've already had to make:

**1. The LLM is never in the math path.** My first agentic flow let the LLM construct inputs to the engine. It produced an 81/100 score on a deal that should have scored ~30 — confidently, with a plausible narrative. Root cause: the LLM passed 0.075 where the engine expected 7.5. Wrong units, no validator caught it. The architectural call: the LLM gets bounded to two jobs — translating user intent into a typed schema, and composing narrative around a verified result. The math happens in a deterministic orchestration layer that calls the engine with unit-explicit parameters. The LLM cannot invent numbers.

**2. A 4-layer agent architecture isn't more complex than a form.** Intent classifier → structured extraction → deterministic engine → narrative composition. A form has the same four layers — just hardcoded into UI components at build time. Chat defers them to runtime services. The trade-off isn't "simple vs complex" — it's where the complexity lives and what flexibility you buy with it.

**3. Honest analysis turns out to be a moat precisely because LLMs make it hard to ship.** Anyone can wrap an LLM around a calculator and put it on the internet. Almost nobody is willing to do the engineering work to guarantee the numbers it cites are correct. For analytical products, that gap is the brand.

**4. The strongest argument for chat-first I'd defend in any room is builder economics, not UX philosophy.** Chat externalizes combinatorial UX to natural language. I don't have to design 20 sliders, a scenario builder, a comparison view, and a saved-preset system to support every permutation a user wants to explore. The user composes scenarios in a sentence; the orchestration layer translates.

Each of these is a post on its own. The one I'll work through first is the bug that almost shipped — "LLM in the math path" is a failure mode I think most agentic products will hit and won't catch, and it has changed how I think about LLMs in production. Posts on the architecture and on the builder economics follow over the next two weeks.

---

### Notes

- **Length:** ~500 words. LinkedIn long-form sweet spot.
- **Voice:** Direct, conviction-led, specific numbers as anchors (60, 11, 81, 30, 0.075, 7.5). Senior-engineer-thinking-aloud, not learning-in-public performance.
- **No CTA / no soft ask.** Closing line is conviction + forward-pointing thread (Posts 2 and 3). Hiring managers respond to that more than "I'd love to chat."
- **Hashtags (optional):** `#buildinpublic` `#agentic` — pick 0-1. None is cleaner.
- **Image:** A before/after architecture sketch (form-based wizard vs chat-first 4-layer) would 2x engagement. Optional ~30min if you want the boost; the post stands without it.

---

## Post 2 — The Reckoning (Sunday)

**Status:** Outline only. Draft when Post 1 is settled.
**Theme:** The 81/100 confabulation in detail. The architectural change. What I'm taking forward.

### Outline

1. **Open with the moment:** "My AI agent told me a deal scored 81/100. The honest score was around 30. Here's how I caught it."
2. **The trace:** what the agent said, what the math actually was, the units mismatch (decimal vs percent on mortgage rate).
3. **The root cause walk:** LLM passes `interestRate: 0.075` → engine divides by 100 → uses 0.00075% rate → near-zero P&I → bogus score. Show the math.
4. **The deeper lesson:** the LLM doesn't know it's wrong. It confabulates a confident narrative around bogus numbers. This is the most dangerous LLM failure mode — confident, plausible, undetectable from output alone.
5. **What changed:** the architectural pivot. Layer separation. Engine called with typed, unit-explicit parameters. LLM is bounded to narrative composition.
6. **Closing reflection:** *trust* is the currency. Any tool that confidently lies once loses it permanently. For analytical products especially.
7. **CTA:** "What's your protocol for catching LLM math errors in production?"

### Source material from this week

- The actual screenshot of the 49 → 81 inversion at 7.5% rate.
- The `BasePropertyAnalyzer.ts:285` line: `interestRate / 100` — the units anchor.
- The conversation trail where I diagnosed bug #1 (schema) then bug #2 (intent classifier) then bug #3 (units) — the layers of root cause.

---

## Post 3 — The Conviction (Tuesday)

**Status:** Outline only.
**Theme:** Builder economics of chat-first. The argument that survives the smart-architect critique.

### Outline

1. **Open with the counter:** "A smart architect could say: you switched a simple form to an agentic chat with 4 layers of complexity. What did you gain?"
2. **Honest acknowledgment:** the question is fair. Forms ARE simpler in the obvious dimension.
3. **The reframe:** forms have the same 4 layers, just hidden in UI components. The cost isn't layer count — it's where the complexity lives (build-time vs runtime).
4. **The actual gain:** combinatorial UX. Show the form-based equivalent of "stress at 7% AND $1500 rent AND 30% down" — sliders, scenario builder, comparison view, dependency model, saved presets, history. Months of work.
5. **The Reddit evidence:** real investors describe stress-tests in arbitrary permutations a form would never anticipate. The vocabulary is unbounded.
6. **The non-obvious argument:** "chat-first wins for analytical products where the user can describe their question better than they can fill out a form."
7. **CTA:** "What's a product category where you'd push back on chat-first? Or one where you'd push harder for it?"

---

## Future post candidates (post-launch sequence)

Pulled from this week's build — each is a self-contained story:

| # | Topic | Source |
|---|---|---|
| 4 | The Zod / JSON schema collapse bug — `{}` is the empty truth | The objectIdHex fix |
| 5 | Registries > if-else chains: refactoring property-type routing | Task #20 |
| 6 | Ripping out a 11-tab legacy analysis screen — when more depth means less trust | Task #19 / workspace migration |
| 7 | Apple-clean UX in a financial product: deference to data | The WorkspaceSection extraction |
| 8 | Event-sourced substrate as the single source of truth for analytical data | The materializer architecture |
| 9 | "AI math hallucination" — the unsexy failure mode nobody covers | Spin-off of Post 2 |
| 10 | Why I'm not using LangChain (or: when a framework adds more accidental complexity than it removes) | (TBD — opinionated take post) |

---

## Decisions log

| Date | Decision | Context |
|---|---|---|
| 2026-05-24 | Three-post Sat/Sun/Tue cadence | Memorial Day Monday low-engagement; Tue catches catch-up scroll |
| 2026-05-24 | A+D hook blend for Post 1 | A's concrete artifact + D's tactical-and-personal "why" + listicle tease |
| 2026-05-24 | Don't name REanalyzr in the hook | Personal-brand campaign, not product marketing |
| 2026-05-24 | Skip emojis | Match user's conversational voice (no emoji use in chat) |
| 2026-05-24 | Include real bugs and challenges, not just wins | "I almost shipped it" reads more credible than "we built X and it works" |
| 2026-05-24 | CTA invites input/pushback, not "follow me" | Aligns with "learn-in-public" frame, not influencer voice |

---

## Open meta-questions

- After Post 1 lands, do we measure engagement to decide whether to lean more technical (Post 2) or more strategic (Post 3) for the rest of the sequence?
- Do you want a 4th post for the same week to maintain momentum, or hold to 3 and let each breathe?
- Cross-post to anywhere else? (X/Twitter has a different audience and would need different framing. Hashnode / personal blog could host the long-form version.)
