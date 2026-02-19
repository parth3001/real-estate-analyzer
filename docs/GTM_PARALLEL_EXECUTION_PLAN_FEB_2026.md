# Parallel GTM Execution Plan - February 2026

**Strategic Advisor:** Marcus Chen (Product & GTM Executive)
**Created:** February 3, 2026
**Last Updated:** February 16, 2026 (Major revision based on actual Week 1-2 results)
**Owner:** Parth Patel
**Timeline:** 12-week plan (Feb 3 - Apr 30, 2026) — extended from original 4-week sprint
**Strategy:** Four-track parallel execution (SEO Content, B2B Outreach, Link Earning, Product Support)

---

## ⚠️ ACTUAL RESULTS: Feb 3-16 (Weeks 1-2)

> **Marcus Chen:** "Before we plan forward, we document reality. Strategy built on assumptions is fiction. Strategy built on data is executable."

### What Happened

| Channel | Expected | Actual | Verdict |
|---------|----------|--------|---------|
| Product Hunt | Traffic driver | 2 upvotes, 0 sessions | Deprioritize permanently |
| Josh Lupo backlink | High-value dofollow | No response — now cold | Remove as dependency |
| Directory submissions | 9 backlinks (nofollow) | 9 nofollow, 1 dofollow DR76 | Nofollow = near-zero SEO value. Done. |
| Total sessions (2 weeks) | 100+ | 40 sessions, 37 users | Expected for DA 0.1 |
| Google organic | 0 | 1 visitor (3m14s, 100% engaged) | Content quality is good. Volume is the problem. |
| DA | 15-20 | 0.1 (actual Ahrefs) | Starting from near-zero |

### Key Lessons

1. **Directory submissions are done.** We submitted 20+ directories. 9 nofollow links. Google ignores nofollow for ranking. Stop submitting directories — time cost too high, SEO value too low.

2. **Product Hunt is not a traffic channel for B2B tools.** It's a one-day spike for consumer apps. Move on.

3. **Josh Lupo is cold.** Plan without him. If he re-engages, great — add it as a bonus. Don't block any activity on his response.

4. **The one engaged organic visitor proves the product works.** 3 minutes 14 seconds on site = they found value. The problem is not quality — it's that nobody can find us yet.

5. **DA 0.1 is the real starting point.** Previous docs estimated DA 15-20. That was wrong. We're starting from near-zero. This changes the timeline: Page 1 in 6-9 months (not 3). Page 3-5 by Month 3 is a realistic goal.

### What Carries Forward

- ✅ BRRRR calculator is live — keep and optimize
- ✅ Cap Rate calculator is live — keep
- ✅ Buy & Hold calculator is live — keep
- ✅ Sitemap submitted to GSC — keep monitoring
- ✅ B2B educator outreach framework — continue
- ✅ 1 dofollow DR76 backlink — document and build on this approach

---

## 🎯 Revised Strategic Overview

**The Real SEO Problem:**
- Directories give nofollow links (no SEO value)
- What ranks sites is **dofollow links from real websites with real audiences**
- The only way to earn those: create content worth linking to + ask the right people

**The Revised Approach:**
- Stop: Directory spray-and-pray
- Start: Content that earns links + targeted outreach to real blogs
- Continue: B2B educator outreach (revenue track, separate from SEO)

**Realistic Timeline:**
- Month 1 (Feb): Technical SEO fixed + Pillar content published + Outreach begins
- Month 2 (Mar): Content cluster built + First earned dofollow links + Position moves from Page 9 → Page 5-7
- Month 3 (Apr): Pre-fundraise traction — 100-250 organic sessions/week, MoM growth story

**Four Tracks:**

| Track | What | Why | Who Does It |
|-------|------|-----|------------|
| **Track A** | Technical SEO (schema, meta, internal links, email capture) | Foundation — without this, content doesn't rank | Claude Code |
| **Track E** | Content marketing (pillar article + blog cluster) | The actual ranking engine for long-term organic traffic | Parth writes |
| **Track D** | Dofollow link earning (resource pages, guest posts, HARO) | 40% of Google's algorithm — must earn real links | Parth outreach |
| **Track B** | B2B educator outreach (white-label deals) | Revenue in 90 days, independent of SEO | Parth outreach |
| **Track C** | Critical bugs + product support | Keep product stable during growth | Claude Code |

---

## 📅 WEEK 3 (Feb 17-23): Content Foundation

**This Week's Single Priority: Publish the BRRRR Pillar Article**

Everything else is secondary. One great long-form article indexed by Google is worth more than 50 more directory submissions.

---

### Track A: Technical SEO Fixes (Claude Code executes)

**BRRRR Calculator Page Optimization:**
- [ ] Fix title tag → `BRRRR Calculator: Calculate Capital Recovery & Infinite Returns | REanalyzr`
- [ ] Fix meta description → 155 characters, includes "BRRRR calculator", "free", "instant results"
- [ ] Fix H1 → `BRRRR Calculator — Analyze Any Deal in 5 Minutes`
- [ ] Add H2s: "What is BRRRR?", "How the BRRRR Calculator Works", "BRRRR 70% Rule", "Common BRRRR Mistakes"
- [ ] Add FAQ schema (JSON-LD) with 8 BRRRR questions targeting long-tail searches
- [ ] Add HowTo schema explaining the BRRRR analysis steps
- [ ] Expand on-page content to 800 words below the calculator (Google needs text to understand context)

**Email Capture (Critical — Start Building List Now):**
- [ ] Add email capture form on /brrrr-calculator page
- [ ] Trigger: After user clicks "Analyze" — show "Get your full PDF report" before results display
- [ ] Lead magnet: "BRRRR Deal Checklist (PDF)" — Claude Code generates from existing content
- [ ] Store emails: Connect to existing auth system or simple MongoDB collection

**Blog Infrastructure:**
- [ ] Create `/blog` route in React Router
- [ ] Create blog post template component (title, date, author, body, CTA)
- [ ] Set up `/blog/brrrr-calculator-guide` as first post URL
- [ ] Add blog to sitemap.xml

**Internal Linking:**
- [ ] Landing page → /brrrr-calculator → /blog/brrrr-calculator-guide → back to /brrrr-calculator
- [ ] All three calculators linked from landing page navigation

**GSC:**
- [ ] Submit all new URLs to Google Search Console immediately after publish

---

### Track E: Content Writing (Parth writes — no shortcuts)

**BRRRR Pillar Article — 2,500 words**

File location: `/blog/brrrr-calculator-guide`
Target keyword: "BRRRR calculator" (6,600 searches/month, currently Page 9)
Secondary keywords: "BRRRR strategy", "BRRRR real estate", "BRRRR method calculator"

**Structure:**
```
H1: BRRRR Calculator: The Complete Investor's Guide (2026)

Introduction (150 words)
- Hook: "Most BRRRR investors lose money on deals that looked good on paper"
- Promise: "This guide shows you exactly how to calculate every BRRRR metric,
  with a real $150K property worked example"

H2: What is the BRRRR Strategy? (200 words)
- Buy, Rehab, Rent, Refinance, Repeat — plain English explanation
- Why institutional investors use it
- Who it's right for

H2: How to Use the BRRRR Calculator (300 words)
- Walk through every input field (explain WHY each matters, not just what it is)
- Real example: $150K purchase, $30K rehab, $220K ARV, $1,400/month rent
- Show what the calculator outputs and how to read each metric

H2: BRRRR Metrics Explained (500 words)
- Capital Recovery % — what does 85% mean vs 110%?
- Cash-on-Cash Return — institutional benchmark is 8-12%
- Infinite Return — when does this happen and what does it mean?
- DSCR — why lenders care about this number
- 70% Rule — when to use it and when to ignore it

H2: 3 Real BRRRR Deal Examples (400 words)
- Deal 1: Strong BRRRR (85% capital recovery, 11% CoC)
- Deal 2: Marginal BRRRR (60% capital recovery, 6% CoC — why this is borderline)
- Deal 3: Failed BRRRR (ARV overestimated, negative cash flow — common mistake)

H2: Common BRRRR Mistakes (300 words)
- Overestimating ARV (most common error)
- Underestimating rehab costs (rule of thumb adjustments)
- Ignoring seasoning requirements (6-12 months before refinance)
- Not accounting for vacancy in cash flow projections

H2: BRRRR vs Buy and Hold: Which is Right for You? (200 words)
- Brief comparison, link to future article

FAQ Section (350 words — 8 questions)
- "What is a good BRRRR capital recovery percentage?"
- "How is BRRRR different from house flipping?"
- "What ARV percentage should I target for refinancing?"
- "How do I find the ARV of a property?"
- "What does infinite return mean in BRRRR?"
- "Is BRRRR strategy risky?"
- "What credit score do I need for a BRRRR refinance?"
- "How long does the BRRRR cycle take?"

CTA (100 words)
- "Run your own BRRRR analysis → [Link to calculator]"
- Email capture: "Download the BRRRR Deal Checklist"
```

**Writing guidelines:**
- Use real numbers, not "X%" — say "$30,000 rehab budget" not "your rehab amount"
- Write for a first-time BRRRR investor — explain every term the first time you use it
- DO NOT use AI-generated filler. Google's Helpful Content Update penalizes thin AI content.
- Minimum 2,500 words. 3,000-3,500 is better for this keyword.

---

### Track D: Prospect Research (No Outreach Yet — Research Only This Week)

**Goal: Build a list of 20 real estate blogs with resource/tools pages**

How to find them:
```
Google searches:
- "real estate investing resources" + "calculators"
- "rental property tools" + "resources"
- "BRRRR investing" + "recommended tools"
- inurl:resources "rental property calculator"
- "best real estate investing tools" 2024 OR 2025
```

**Qualification criteria (all must be true):**
- ✅ Real blog with real content (not just a directory)
- ✅ Has a "Resources" or "Tools" page that links to calculators
- ✅ Published content in last 90 days (active site)
- ✅ DA 15+ (check with Ahrefs — sign up for free trial this week)
- ✅ Contact email or contact form available

**Create spreadsheet with:**
```
| # | Blog Name | URL | DA | Has Resources Page? | Contact | Last Post | Notes |
|---|-----------|-----|----|--------------------|---------|-----------|-------|
```

**Target: 20 qualified prospects by end of Week 3**

Do NOT email anyone this week. Research only. Send in Week 4.

---

### Track B: B2B Educator Outreach — Continue

If you haven't sent 20 emails yet from the original plan, send them this week.
If already sent, follow up with non-responders (7-day follow-up rule).

**Follow-up template (use if Week 2 emails went unanswered):**
```
Subject: Re: White-label property analyzer for [Course Name] students

Hi [Name],

Following up from last week. Quick question: Are your students currently
using Excel or BiggerPockets to analyze rental properties?

I ask because I built something specifically for educators — your branded
subdomain with institutional-grade analysis your students can actually use.

The FI Couple is using it now: theficouple.reanalyzr.com

10-minute demo this week? I'll show you the setup in real time.

Best,
Parth
```

**Track B focus this week:** 3-5 follow-up emails, schedule any demo calls that come in

---

### Week 3 Deliverables Checklist

**By Sunday Feb 23:**
- [ ] BRRRR pillar article published at /blog/brrrr-calculator-guide (2,500+ words)
- [ ] Article submitted to Google Search Console
- [ ] Email capture live on /brrrr-calculator page
- [ ] BRRRR calculator page technical SEO fixed (title, meta, schema)
- [ ] 20 blogger prospects identified and documented in spreadsheet
- [ ] B2B follow-up emails sent to non-responders

---

## 📅 WEEK 4 (Feb 24 - Mar 2): Outreach Begins

**This Week's Priority: Send real outreach to real blogs. Write supporting article #1.**

---

### Track A: Claude Code Tasks

- [ ] Create PDF version of "BRRRR Deal Checklist" from pillar article content
- [ ] Optimize pillar article based on any early GSC data (if indexed)
- [ ] Add internal links from all 3 calculator pages to pillar article
- [ ] Begin technical SEO on Cap Rate calculator page (same pattern as BRRRR)

---

### Track E: Supporting Article #1

**"BRRRR vs Buy and Hold Calculator: Which Strategy Wins With Real Numbers?"**
- Length: 1,500-2,000 words
- Target keyword: "BRRRR vs buy and hold" (lower competition, builds topical authority)
- Structure: Head-to-head comparison with a worked example, conclusion with CTA to both calculators
- Internal links to: pillar article, /brrrr-calculator, /buy-hold-calculator

---

### Track D: Resource Page Outreach — 15 Emails

Use the prospect list from Week 3. Send 15 personalized emails.

**Template:**
```
Subject: Free BRRRR calculator your readers might find useful

Hi [First Name],

I came across [Blog Name] while researching BRRRR investing resources —
your article on [specific article title] was genuinely helpful.

I noticed your resources page links to [competitor tool or general tools section].
I built a free BRRRR calculator at reanalyzr.com that your readers might find
more useful — it calculates 28 metrics including capital recovery %, infinite return
potential, and DSCR (most free calculators only do 5-8 metrics).

No login required, completely free.

Would you consider adding it to your resources page?

Direct link: https://reanalyzr.com/brrrr-calculator

Happy to answer any questions about how it works.

Best,
Parth Patel
REanalyzr.com
```

**Personalization rules (non-negotiable):**
- Reference a specific article they wrote (5 min to read one article per email)
- If they have a resources page, link to it: "I noticed your resources page at [URL]..."
- If no resources page, reference their most recent BRRRR or rental property article

**Tracking:**
- Use `/docs/BACKLINK_TRACKING_TEMPLATE.md` spreadsheet
- Log: Email sent date, response, backlink live date, DA, dofollow/nofollow

**Expected results:**
- 15 emails → 15-20% response rate → 2-3 responses → 1-2 dofollow backlinks
- These links are worth 10x any directory submission

---

### Track D: HARO Setup

**Sign up at connectively.us (formerly HARO) — Free**
- Monitor 3x daily email alerts (6am, 12pm, 6pm)
- Filter for: real estate, personal finance, investment, rental property
- When relevant query appears: Respond within 2 hours (speed matters)
- Response format: "I'm Parth Patel, real estate investor and founder of REanalyzr, a platform used by [X] investors to analyze rental properties. [Answer to their question with specific data/numbers]. You can see our calculator methodology at reanalyzr.com/brrrr-calculator."
- Expected: 1-2 relevant queries per week, 1 placement per month (DA 40-80 link from news/media)

---

### Track B: Demo Calls

Run any demo calls scheduled from Week 2-3 outreach.
Close 1-2 educators at $99/month founding price.

---

### Week 4 Deliverables Checklist

**By Sunday Mar 2:**
- [ ] 15 resource page outreach emails sent
- [ ] HARO account active and monitoring started
- [ ] Supporting article #1 published (/blog/brrrr-vs-buy-and-hold)
- [ ] GSC check: Is pillar article indexed? Any impressions?
- [ ] B2B: 1-2 demo calls completed

---

## 📅 MONTH 2 (Mar 3-31): Content Cluster + Earned Links

**Goal: Move from Page 9 to Page 5-7 for "BRRRR calculator". Build 8-12 real dofollow links.**

### The Content Cluster Strategy

Google rewards **topical authority** — sites that go deep on one topic. You need 8-10 articles about BRRRR/rental property investing. Each article:
- Targets a related keyword
- Links to the pillar article and the calculator
- Earns links on its own from people searching that specific topic

**Month 2 Content Calendar:**

| Week | Article | Target Keyword | Words |
|------|---------|----------------|-------|
| Week 5 (Mar 3-9) | "ARV Calculator: How to Estimate After-Repair Value Like an Appraiser" | "how to calculate ARV" | 1,800 |
| Week 5 (Mar 3-9) | "BRRRR 70% Rule: When It Works and When It Destroys Your Deal" | "BRRRR 70% rule" | 1,500 |
| Week 6 (Mar 10-16) | "Hard Money Loan Calculator: True Cost of BRRRR Financing" | "hard money loan calculator" | 1,800 |
| Week 7 (Mar 17-23) | "Rental Property Cash Flow Calculator: Month-by-Month Projections" | "rental property cash flow calculator" | 2,000 |
| Week 8 (Mar 24-31) | "Rental Property ROI Calculator: Institutional Formula vs What Most Sites Get Wrong" | "rental property ROI calculator" | 2,000 |

**Writing guidelines (same as Week 3):**
- Real worked examples with real numbers
- No AI filler — Google's Helpful Content algorithm penalizes it
- Each article ends with CTA to relevant calculator
- Each article links to the pillar article

---

### Month 2 Backlink Strategy: Guest Posts

**Stop resource page outreach after Week 4. Pivot to guest posts.**

Guest posts are harder but yield higher-quality links (in-content, dofollow, DA 25-50).

**Target blogs for guest post pitches:**
- Coach Carson (coachcarson.com) — rental property investing, DA ~50
- REtipster (retipster.com) — real estate tools and strategies, DA ~55
- Rental Income Podcast blog — landlord audience, DA ~35
- BiggerPockets contributor program — hardest but highest DA (79)
- Afford Anything guest contribution — FI/real estate audience, DA ~60

**Guest post pitch template:**
```
Subject: Guest post idea for [Blog Name]: "How to Calculate BRRRR Returns
Like a Professional Investor"

Hi [Name],

I've been reading [Blog Name] for [X] months — your piece on [specific article]
changed how I think about [specific topic].

I'd love to contribute a guest post: "How to Calculate BRRRR Returns Like a
Professional Investor" (working title).

The angle: Most BRRRR guides explain the strategy conceptually but skip the
actual math. I'd walk through 3 real deals with actual numbers — capital recovery %,
DSCR, infinite return — and show readers exactly what separates a strong BRRRR
from a deal that looks good but destroys cash flow.

About me: Real estate investor, 20 years in enterprise software (Cognizant/Cprime),
founder of REanalyzr (free BRRRR calculator used by 500+ investors).

Roughly 1,500 words, no promotional content, free to use under your editorial standards.

Interested?

Best,
Parth
```

**Pitch 5 blogs in Month 2. Expect 1-2 acceptances.**
- Each accepted guest post = 1 dofollow DA 25-60 link
- Guest posts also bring referral traffic from the blog's audience

---

### Month 2 HARO: Be Consistent

- Check HARO alerts every day
- Respond to 2-3 relevant queries per week
- Quality of response matters: give specific data, cite your platform
- Expected: 1 media placement in Month 2 (DA 40-80 link)

---

### Month 2 Success Metrics

**By March 31:**
- 5 new blog articles published (8 total including pillar + supporting articles)
- BRRRR calculator position: Page 5-7 (moved from Page 9)
- GSC impressions for BRRRR keywords: 100-300/week
- Organic sessions/week: 15-50 (up from 1)
- Dofollow links from real sites: 5-10
- Email list: 50-150 subscribers
- B2B: 1-2 signed educators ($99-198 MRR)

---

## 📅 MONTH 3 (Apr 1-30): Pre-Fundraise Traction

**Goal: Build the numbers investors want to see. MoM growth is the story.**

### What Investors Look For in a Pre-Seed Fundraise

Investors don't expect big numbers at pre-seed. They expect:
1. **MoM growth rate** (30-50% is fundable)
2. **Evidence of organic demand** (people finding you without paid ads)
3. **Proof the product works** (engagement metrics, low churn)
4. **Clear path to scale** (if organic works at 250 sessions/week, what happens at $10K/month ad spend?)

**Month 3 is about creating that narrative with real data.**

---

### Track E: Tier 2 Keyword Content

**Shift from BRRRR to Tier 2 keywords once BRRRR cluster is complete:**

| Article | Target Keyword | Monthly Searches |
|---------|----------------|-----------------|
| "Investment Property Calculator: Cap Rate, NOI, DSCR Explained" | "investment property calculator" | 12,100 |
| "Rental Property Cash Flow: What Real Investors Actually Earn" | "rental property cash flow" | 8,100 |
| "Cap Rate Calculator: What Institutional Investors Use as Benchmark" | "cap rate calculator" | 4,400 |
| "DSCR Calculator: Will Your Lender Approve This Deal?" | "DSCR calculator" | 2,900 |

---

### Track D: Data-Driven PR Piece

**The highest-leverage backlink play available to you.**

**Article:** "BRRRR Strategy 2026: Analysis of 500+ Deals Run Through Our Calculator"
- Use anonymized data from your own calculator usage
- Headline findings: Average capital recovery %, what % of deals are "good" BRRRR candidates, most common mistakes
- Publish on your blog first, then pitch to industry media

**Pitch to:**
- Inman News (inman.com) — DA 80, real estate industry publication
- BiggerPockets blog — DA 79, will link if data is interesting
- RealPage blog — DA 65, apartment/rental industry
- Apartment List research blog — DA 68
- HousingWire — DA 78

**One good data story = 5-15 natural backlinks from industry sites**
This is how you get from DA 5 to DA 20+ fast.

**When to do this:** Mid-April, when you have enough usage data to make the analysis credible (at least 200-300 deals analyzed).

---

### Track D: Podcast Outreach

**Low bar to get on. High value per episode.**

- Target: Real estate investing podcasts with 100-5,000 listeners (not the big ones)
- Pitch: "I built a free institutional-grade BRRRR calculator — happy to walk through the methodology and do a live deal analysis on air"
- Each episode = link in show notes (dofollow, DA varies)
- Research 10 podcasts, pitch 10, expect 2-3 to respond

**Find podcasts:**
- Spotify search: "BRRRR investing podcast", "rental property investing podcast"
- Apple Podcasts: Same searches
- Look for shows with 50-500 reviews (active but not impossible to get on)

---

### Month 3 Success Metrics (Fundraise Readiness)

**By April 30:**

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Organic sessions/week | 100-250 | Proof of organic demand |
| MoM traffic growth | 30-50% | The investor narrative |
| BRRRR calculator position | Page 3-5 | Evidence of ranking momentum |
| Total long-form articles | 12-15 | Topical authority established |
| Dofollow backlinks | 15-25 | DA moving from 0.1 toward 10-15 |
| Email list | 200-500 | Captured audience to show investors |
| B2B MRR | $198-500 | Proof of willingness to pay |
| Conversion rate (organic → signup) | 2-5% | Product-market fit signal |

---

## 📊 Updated Resource Allocation

**No fake percentages. Here's how to think about time:**

| Track | Cadence | Owner | Estimated Time |
|-------|---------|-------|----------------|
| **Track A (Technical SEO)** | Do it once right in Week 3, then as-needed | Claude Code | 4-6 hours total (Week 3), 1 hour/week ongoing |
| **Track E (Content Writing)** | 1 article per week minimum | Parth | 3-4 hours/article (you write, Claude Code reviews/formats) |
| **Track D (Link Earning)** | 10-15 outreach emails per week, HARO daily | Parth | 2-3 hours/week outreach, 15 min/day HARO |
| **Track B (B2B Outreach)** | 5 follow-ups or new emails per week + demo calls | Parth | 1-2 hours/week |
| **Track C (Product Support)** | Critical bugs only | Claude Code | As-needed |

**The honest minimum to see results: 6-8 hours/week from Parth.**
- 3-4 hours: Writing one article
- 2 hours: 10-15 outreach emails (15 min each, personalized)
- 15 min/day: HARO monitoring

No time to write an article that week? No article that week. Do not publish AI-generated thin content. Google will penalize it and it hurts more than it helps.

---

## 🚫 What We Are Permanently Stopping

These activities had their shot. Results were below investment threshold. Done.

| Activity | Result | Decision |
|----------|--------|---------|
| Product Hunt launches | 2 upvotes, 0 traffic | Stop permanently |
| Directory submissions | 9 nofollow links, 0 SEO value | Done — submitted all major ones |
| Josh Lupo as backlink dependency | No response, cold | Remove from plan. Add back only if he re-engages. |
| Social media posting (Twitter, LinkedIn, Facebook groups) | Not measured but known low ROI for this audience | Don't start |

---

## 📈 The Fundraising Narrative (Month 3 Output)

**When you sit down with an investor in May 2026, here's the story:**

> "We launched with zero marketing budget in February 2026. By April, we had [X] organic visitors per week, growing [X]% month-over-month, with zero paid acquisition. We rank on Page [X] for 'BRRRR calculator' — a keyword searched 6,600 times per month — and we're on Page [X] for 'rental property ROI calculator' (18,100 searches/month). Our content drives qualified investors to the product, they get immediate value from the analysis, and [X]% convert to email subscribers. We have [X] paying B2B customers proving willingness to pay. We need capital to accelerate what's already working."

**What you need to make that story true:**
- Traffic growing MoM (even 30-50% from a small base)
- Ranking evidence (screenshots from GSC, position data)
- Email list (proof of captured audience)
- At least 1-2 B2B customers (proof of monetization)

All of the above is achievable by April 30 if you write one article per week and send outreach consistently.

---

## 📋 Weekly Check-In Protocol

**Every Sunday, answer these 5 questions:**

1. **Content:** Did you publish an article this week? Title + URL?
2. **Outreach:** How many emails sent? Any responses? Any links live?
3. **HARO:** How many queries did you respond to? Any placements?
4. **GSC:** What's the current position for "BRRRR calculator"? Impressions this week?
5. **B2B:** Any demo calls? Any closes?

If the answer to #1 is "no" three weeks in a row, the SEO plan is stalled. No amount of outreach fixes a lack of content.

---

## 📊 Progress Tracker

### Week 1 Progress (Feb 3-9) ✅
- **Track D:** 20 directory submissions completed, Josh Lupo email sent (no response)
- **Track A:** BRRRR calculator published, sitemap updated
- **Track B:** Educator target list started
- **Backlinks:** 1 dofollow DR76, 9 nofollow
- **Sessions:** ~20 sessions

### Week 2 Progress (Feb 10-16) ✅
- **Track D:** Product Hunt launched (2 upvotes, 0 traffic). Reddit post (1 visitor, 2s bounce).
- **Track A:** Cap Rate calculator, Buy & Hold calculator published
- **Track B:** B2B outreach in progress
- **Backlinks:** 10 total (1 dofollow, 9 nofollow)
- **Sessions:** 40 sessions, 37 users. 1 organic Google visitor (3m14s, engaged).

### Week 3 Progress (Feb 17-23) 🔄
- **Status:** In progress
- **Track A:** Technical SEO fixes, email capture, blog infrastructure
- **Track E:** BRRRR pillar article (2,500 words)
- **Track D:** 20 blogger prospects identified
- **Track B:** Follow-up emails to non-responders
- **Target:** Pillar article indexed, email capture live

### Week 4 Progress (Feb 24 - Mar 2) ⬜
- **Status:** Not started
- **Track E:** Supporting article #1
- **Track D:** 15 resource page outreach emails, HARO active
- **Track B:** Demo calls, closes
- **Target:** 15 emails sent, 1-2 dofollow responses

### Month 2 Progress (Mar 3-31) ⬜
- **Status:** Not started
- **Track E:** 5 articles published
- **Track D:** Guest post pitches (5 sent, 1-2 accepted)
- **Target:** Page 5-7 for BRRRR, 5-10 dofollow links

### Month 3 Progress (Apr 1-30) ⬜
- **Status:** Not started
- **Track E:** 4 Tier 2 keyword articles
- **Track D:** Data PR piece pitched, podcast outreach
- **Target:** 100-250 organic sessions/week, fundraise-ready metrics

---

## ⚠️ Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Articles take longer than 3-4 hours to write | High | Medium | Write one article per week minimum — don't skip weeks |
| Outreach response rate <10% | Medium | Medium | Increase volume — send 20/week instead of 10 |
| GSC impressions flat after 8 weeks | Low | High | Fix: audit content quality, check indexing, add more internal links |
| Google Helpful Content penalty on thin content | Low | High | Never publish AI-generated filler. Only publish articles you're proud of. |
| B2B closes 0 customers | Medium | Low | Revenue track, not survival track. SEO continues regardless. |
| DA stays at 0.1 after Month 2 | Low | High | Means zero dofollow links acquired — audit outreach templates, pivot to guest posts earlier |

---

**Document Version:** 3.0 (Major revision — Week 3+ rewrite, Month 2-3 extension)
**Last Updated:** February 16, 2026
**Previous Version:** 2.0 (Feb 12, 2026 — added Track D backlinks)
**Next Review:** February 23, 2026 (End of Week 3)

**Priority Hierarchy (when time conflicts arise):**
1. Track E (Content) — one article/week is non-negotiable
2. Track D (Outreach) — 10-15 emails/week + HARO daily
3. Track B (B2B) — 5 follow-ups/week, demo calls
4. Track A (Technical) — Claude Code handles, minimal Parth time
5. Track C (Support) — critical bugs only
