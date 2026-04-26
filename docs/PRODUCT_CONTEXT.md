# REanalyzr — Product Context & Strategic Truth
**Last Updated: April 25, 2026**
**Owner: Parth (Solo Founder)**

---

## What REanalyzr Actually Is

NOT a calculator. A three-layer real estate investment platform:

### Layer 1 — Deal Analysis
Institutional-grade underwriting across three strategies:
- **BRRRR** — full, live
- **Buy & Hold** — full, live
- **Multi-Family** — basic, live

Honest verdicts with real numbers behind them. Conservative
underwriting is the moat — we tell people to PASS frequently.
That's a feature, not a bug. 80% of deals should be a PASS.

### Layer 2 — Deal Pipeline
Every analysis saved. Track deals from first look to close.
Nothing rebuilt from scratch, nothing lost in spreadsheets.

### Layer 3 — Portfolio Impact
See how any new deal affects the ENTIRE portfolio before buying.
Supports ALL property types including:
- Single-family rentals
- Multi-family (2-32 units)
- BRRRR properties
- Commercial properties (strip malls, office, mixed-use)
- Any existing property the user already owns

**This is the key differentiator nobody else has:**
Connect individual deal decisions to portfolio-level consequences
BEFORE buying. Not just "is this deal good" but "is this deal
good for ME given what I already own."

---

## Correct Positioning

**We are a complete platform — not just a calculator.**

### Headline Direction
```
Analyze Any Deal. Track Every Property.
See Your Full Portfolio — All In One Place.
```

### Sub-headline Direction
```
BRRRR, Buy & Hold, Multi-Family, Commercial.
One platform that connects deal analysis to portfolio
reality before you buy.
```

### What NOT to Say
- ❌ "Screen Deals Faster" — calculator pitch, generic
- ❌ "Less Guesswork" — every tool says this
- ❌ Lead with 87/100 BUY verdict — show PASS verdicts instead
- ❌ "Free Forever Beta" — attracts wrong users, signals impermanence

### Core Message That Resonates
"Passing is free. Buying wrong is expensive."
Show the bad deals. Show the honest math. That's the brand.

---

## Target User

**Primary:** Investors who ALREADY own properties — residential
AND commercial — who want one place to see everything and
evaluate new deals in portfolio context.

**Secondary:** Serious first-time investors who want honest
analysis, not optimistic rationalization.

**NOT:** Deal-seekers attracted by "free forever."

---

## What's Live in Production (April 25, 2026)

### Analysis Engine
- ✅ BRRRR analyzer — full
- ✅ Buy & Hold analyzer — full
- ✅ Multi-Family analyzer — basic, live
- ✅ AI insights (GPT-4o-mini)
- ✅ Real market data (FRED + RentCast + Census)
- ✅ Deal Quality Score (0-100)
- ✅ Walk-away price calculations
- ✅ 60+ financial metrics, multi-year projections

### Platform
- ✅ Deal Pipeline — live
- ✅ Portfolio tracker — supports ALL property types including commercial
- ✅ Magic link auth — live (April 25, 2026, replaced passwords)
- ✅ Blog SEO cluster — 6 posts, ranking
- ✅ Meta tags fixed on all blog posts — live
- ❌ Stripe/payments — NOT YET (target: June 1, 2026)
- ❌ MCP server — planned, not started

---

## Data & Conversion Reality (April 2026)

### Traffic
- 104 new users in 30 days
- 88% direct traffic, ~6 organic search sessions/month
- BRRRR 70% rule guide: position 3.88-5.08 in Google
- 1,225 impressions → 0 clicks (meta tag fixed, now live)

### Funnel
- 371 landing page views → 192 register views → 2 signups
- 99% registration abandonment (passwords — now fixed with magic link)
- 12 deals analyzed by logged-in users across 5 sessions
- 0 wizard completions in 30 days
- Zero week-1 retention across all cohorts

### Revenue
- $0 — Stripe not integrated yet
- Target: first paid user by June 1, 2026

---

## Immediate Priority Stack

1. ✅ Meta tags — done
2. ✅ Magic link auth — done
3. 🔄 Landing page redesign — next
4. 📋 Microsoft Clarity install — after landing page
5. 📋 Email onboarding sequence — retention hook
6. 📋 Stripe + monetization — June 1 target
7. 📋 MCP server build — B2B/agent distribution

---

## Competitors & Gaps

| Competitor | What They Have | What They Lack |
|---|---|---|
| DealCheck | Deal analysis | No pipeline, no portfolio |
| BiggerPockets | Calculators + community | No ecosystem, optimistic |
| PropStream | Data, off-market | No analysis engine |
| Josh Lupo's "Dexter" | Light calculator | No depth, no portfolio |

**Nobody connects deal → pipeline → portfolio impact.**
That's our moat.

---

## Distribution Channels

1. **Organic SEO** — blog cluster ranking, compounding slowly
2. **Magic link email** — every login = retention touchpoint + marketing channel
3. **MCP/Agent marketplace** — planned B2B wedge (Anthropic directory, Composio, etc.)
4. **LinkedIn content** — PASS verdict angle, real numbers, build in public
5. **Influencer** — paused; Coach Carson + Chandler David Smith are next targets
6. **Reddit** — r/realestateinvesting, r/financialindependence (not started)

---

## Monetization Plan

**Pricing strategy: Path A (freemium funnel) — LOCKED April 25, 2026.**

- **Free tier:** 3 analyses per month (gate ships with Stripe ~June 1, 2026)
- **Core tier:** $19.99/month — unlimited analyses + pipeline + portfolio + AI insights
- **Pro tier (future, not on public landing page):** ~$49.99/month — batch analysis, API access, streamlined workflows
- **B2B (future):** Small underwriters, banks, credit unions — needs B2C PMF first
- **MCP usage-based (future):** Pay-per-analysis at API layer (~$0.50-$2.00/call)

**Public copy rule:** Only Free tier and Core tier appear on landing/marketing pages. Pro/B2B/MCP are internal/future, kept off the public funnel.

**During beta** (now through Stripe launch): copy stays `Free during beta`. Post-Stripe: copy commits to `3 free analyses per month`.

Paths considered and rejected: Path B (free trial → paid) — trial conversion brutal for tools used 3-30x/year. Path C (paid platform with public sample only) — too steep an ask pre-launch. May revisit Path C post-launch if freemium conversion is weak.

---

## Non-Negotiables

- Honest analysis over deal rationalization — always
- PASS verdicts are the product, not a failure
- Conservative underwriting is the moat
- Peer positioning with all partners (not vendor-client)
- No fake user counts or inflated metrics ever
- Authentic founder story in all outreach

---

## Tech Stack
- **Frontend:** React 19, TypeScript, Material-UI v7
- **Backend:** Node.js, Express, MongoDB
- **APIs:** FRED, RentCast, Census, GPT-4o-mini, Resend
- **Hosting:** Render (backend: real-estate-analyzer-api.onrender.com)
- **Frontend:** reanalyzr.com
- **Dev:** Claude Code in VS Code

---

## Marcus Chen's Standing Guidance

*22-year proptech/product executive. Bain, Zillow, CoStar.*

- The magic link email IS the retention mechanism —
  every login is a guaranteed inbox touchpoint
- Show PASS verdicts above the fold, not BUY verdicts
- The portfolio layer (esp. commercial support) is the
  real differentiator — it's being undersold everywhere
- Fix the leaking funnel before buying more traffic
- June 1 is a hard date for first paid user — not a goal
- MCP/agent strategy routes around the consumer funnel
  problem entirely — run it in parallel, don't wait
