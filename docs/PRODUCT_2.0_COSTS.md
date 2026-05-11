# REanalyzr 2.0 — Cost Economics

**Document type:** Companion doc to [PRODUCT_2.0_ARCHITECTURE.md](PRODUCT_2.0_ARCHITECTURE.md) §9
**Authored:** 2026-05-10
**Status:** Draft 1
**Owns:** Model-tier routing detail, per-tier token budgets, caching strategy, cost-cap enforcement, cost monitoring

---

## 0. Scope and non-scope

**This doc covers:**
- Model-tier routing — which model handles what, why
- Per-query token budget at each price point ($0 retail, $19.99 retail paid, $200 B2B small, $2K B2B mid-market)
- Caching strategy (prompt cache, semantic cache, tool-result cache) as a margin lever
- Cost-cap enforcement (per-user, per-query, per-org) with kill switches
- `CostEvent` operational collection (separate from substrate events)
- Cost monitoring and PR-gated cost regression
- Provider-fallback considerations

**Out of scope:**
- Substrate event taxonomy — see [PRODUCT_2.0_EVENTS_STORE.md](PRODUCT_2.0_EVENTS_STORE.md)
- Agent implementations — see [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md)
- Eval-gated cost regression — see [PRODUCT_2.0_EVALS.md §7](PRODUCT_2.0_EVALS.md)
- B2B pricing strategy / packaging — set by Parimal call + cold-demo signal per thesis Appendix B
- Marketing / acquisition economics
- Infrastructure cost (MongoDB Atlas, hosting, etc.) — covered in standard ops budget

**Cost figures here are estimates as of May 2026.** Anthropic pricing shifts roughly quarterly. Re-baseline this doc after each model release.

---

## 1. Cost model philosophy

**Token cost is observable, optimizable, and measurable per query.** A few principles:

1. **Cost is a first-class architectural concern, not a post-launch optimization.** Below-margin queries are unit-economics red flags, not "we'll fix it at scale" deferrals. Per the thesis non-negotiable on conservative engineering, we instrument from day one.

2. **Caching is a margin lever, not a perf optimization.** The prompt cache, semantic cache, and tool-result cache exist primarily to lower per-query cost. Latency improvement is a side effect.

3. **Model-tier routing is architecture.** Haiku 4.5 for cheap-fast paths, Sonnet 4.6 for default reasoning, Opus 4.7 for high-stakes critique. Tier choice per agent is documented and stable across deploys — not a knob to twiddle.

4. **Failure modes that blow up unit economics get rate-limited, not architected around.** Users who hit the LLM 20× for one analysis are a P0 bug to instrument, not a permanent class of users to budget for.

5. **Retail subsidizes the substrate; B2B pays for the platform.** Retail acquisition is top-of-funnel for substrate seeding, not the revenue source. B2B per-query budgets are higher because the per-query value is higher and the unit economics support it.

---

## 2. Anthropic pricing baseline (May 2026)

**Approximate per-million-token pricing.** Verify against current Anthropic pricing page; numbers below are working assumptions for this doc.

| Model | Input | Output | Cached input (5-min TTL) |
|---|---|---|---|
| Claude Haiku 4.5 | $1 / M | $5 / M | $0.10 / M |
| Claude Sonnet 4.6 | $3 / M | $15 / M | $0.30 / M |
| Claude Opus 4.7 | $15 / M | $75 / M | $1.50 / M |

**Prompt cache:** 5-minute TTL. Cached input tokens cost ~10% of base input price. This is the load-bearing cost lever for any system with cacheable persona / instructions / context.

**Cache discipline (recap from agent mesh doc §5.2):** boundaries placed for either <270s reuse (stays warm) or >1200s reuse (amortizes one miss for a long window). Never sit at 300s — worst-of-both-worlds.

---

## 3. Model-tier routing per agent and tool

Repeat from [PRODUCT_2.0_AGENT_MESH.md](PRODUCT_2.0_AGENT_MESH.md), with cost-justification per row:

| Component | Model | Estimated cost / call | Why this tier |
|---|---|---|---|
| Intent classifier (orchestrator) | Haiku 4.5 | $0.0003 - $0.0005 | Runs on every turn; needs to be cheap. Classification is a finite-set task; Haiku is more than capable. |
| Deal-scoring agent | Sonnet 4.6 | $0.010 - $0.020 | Multi-tool orchestration + reasoning. Opus is overkill (the score is deterministic; the agent just decides tool order). Haiku produces inferior reasoning quality for multi-step flows. |
| Q&A agent | Sonnet 4.6 | $0.005 - $0.015 | Explanation quality matters. Conversation coherence matters. Sonnet is the sweet spot for "smart enough, fast enough, cheap enough." |
| Adversarial critic | Opus 4.7 | $0.050 - $0.150 | High-stakes reasoning. Critic personas must be genuinely insightful or they don't earn their slot. Runs sparingly (BUY-band only + manual). The cost discipline comes from rarity, not tier. |
| Profile extraction tool | Haiku 4.5 | $0.0002 - $0.0005 | Structured extraction from unstructured input; Haiku excels at this. |
| Q&A LLM evaluator (eval CI) | Haiku 4.5 | $0.003 / scenario | Behavioral pass/fail evaluation; cheap is critical because we run this in CI on every PR. |
| Profile/text summarization (memory compaction) | Haiku 4.5 | $0.001 - $0.003 | Older conversation turns get summarized once context budget is hit. Haiku is sufficient. |

**Two tools call LLMs** (profile extraction; conversation summarization). **Every other tool is pure code** — `enrich_property`, `compute_analysis`, `score_deal`, `apply_override`, `save_to_watchlist`, `render_audit_trail`, `export_audit_pdf`. The scoring path costs $0 in LLM tokens.

---

## 4. Per-query budget breakdown

A "query" = one user-perceived chat interaction. May involve multiple agent + tool calls.

### 4.1 Typical query archetype: "analyze this property"

User: "Analyze 1837 Walnut Way, Anna TX. List price $425K."

Resulting orchestration:

| Step | Component | Tokens (cached/input/output) | Cost estimate |
|---|---|---|---|
| 1 | Intent classifier | (1500/300/40) Haiku | $0.0004 |
| 2 | Deal-scoring agent first call | (5000 cached / 1000 fresh / 200) Sonnet | $0.005 |
| 3 | `tool:enrich_property` | (deterministic; no LLM) | $0 (plus RentCast API cost) |
| 4 | `tool:compute_analysis` | (deterministic; no LLM) | $0 |
| 5 | `tool:score_deal` | (deterministic; no LLM) | $0 |
| 6 | Deal-scoring agent final response | (5500 cached / 800 fresh / 500) Sonnet | $0.011 |
| | **Total LLM cost per query** | | **~$0.016** |

External API cost (RentCast comp lookup, FRED lookup) is a separate budget line; ~$0.005 per query at current volume tiers, dropping toward $0 as cache hit rate increases.

**Total per-query operational cost:** ~$0.020 - $0.025 (LLM + APIs)

### 4.2 BUY-band query with adversarial critique

Same as above, plus auto-invoked adversarial critic when `dealQuality ≥ 80`:

| Additional step | Component | Tokens | Cost estimate |
|---|---|---|---|
| 7 | Adversarial critic (2 personas) | 2 × (3000/500/600) Opus | $0.110 |
| | **Total LLM cost (BUY-band)** | | **~$0.126** |

Critic cost is concentrated in BUY-band — rare. If 5% of analyses hit BUY band, average per-query LLM cost = `0.95 × $0.016 + 0.05 × $0.126 = ~$0.021`. Manageable.

### 4.3 Q&A follow-up query

User: "Why did this score 67?"

| Step | Component | Tokens | Cost estimate |
|---|---|---|---|
| 1 | Intent classifier | (1500/300/40) Haiku | $0.0004 |
| 2 | Q&A agent | (6000 cached / 600 fresh / 400) Sonnet | $0.007 |
| | **Total per-query** | | **~$0.008** |

Q&A is cheaper because no tool orchestration. Most Q&A turns are explanatory and stay within Sonnet's working budget.

### 4.4 Override flow

User: "Change vacancy to 8%."

| Step | Component | Tokens | Cost estimate |
|---|---|---|---|
| 1 | Intent classifier | (1500/300/40) Haiku | $0.0004 |
| 2 | `tool:apply_override` | (deterministic; re-runs scoring) | $0 LLM |
| 3 | Q&A agent explanation of new score | (6000/400/300) Sonnet | $0.006 |
| | **Total per-query** | | **~$0.007** |

Cheap. The override itself is deterministic; only the explanation costs LLM tokens.

---

## 5. Per-tier price-point analysis

Pricing context: **$19.99/month retail** per the locked memory (Apr 25, 2026). No other tiers mentioned publicly. B2B tiers are not yet priced — figures below are projections to inform architecture decisions, not pricing commitments.

### 5.1 Retail free tier ($0/month)

**Limits:** 3 analyses/month per the existing platform model (per CLAUDE.md).

**Cost per analysis:** ~$0.025 LLM+APIs average (includes 5% BUY-band uplift).

**Monthly LLM cost per free-tier user:** 3 × ~$0.025 = **~$0.075/month + supporting Q&A turns** ≈ ~$0.15-$0.30/month worst case (with Q&A follow-ups).

**Unit economics:** loss-leader. Substrate accumulation is the value, not revenue. Acceptable cost.

**Constraints to enforce:**
- Hard cap at 3 full analyses / month
- Q&A follow-up unlimited within reason (rate-limited per session, not per month)
- No adversarial critique on free tier (BUY-band auto-critique disabled; manual critique gated)

### 5.2 Retail paid tier ($19.99/month)

**Limits:** Unlimited analyses per the locked pricing path.

**Estimated query volume:** 30 analyses/month average per active paid user, 100 analyses/month for power users. Q&A follow-ups: ~3 turns per analysis average.

**Monthly LLM cost per paid user:**
- 30 analyses × $0.021 (average including 5% BUY-band) = $0.63
- 90 Q&A turns × $0.008 = $0.72
- ~30 overrides × $0.007 = $0.21
- **Total: ~$1.56/month per average paid user**
- Power user (100 analyses): ~$5.20/month

**Unit margin at $19.99:** ~$18.43 average / ~$14.79 power user. **Healthy.**

**Adversarial critique allowance:** auto-trigger on BUY-band enabled (rare); manual trigger limited (e.g., 5 critiques/month included; over-limit = "upgrade to B2B for unlimited critique").

### 5.3 B2B small (~$200/month projection)

**Higher per-query budgets to support:**
- Unlimited adversarial critique on every analysis
- B2B-specific tools (audit trail PDF, multi-deal batch processing)
- Higher Q&A volume (B2B users review more deals per session)

**Estimated query volume:** 200 analyses/month per active seat (lender / underwriter doing serious volume).

**Monthly LLM cost per B2B seat:**
- 200 analyses × $0.025 = $5.00
- 200 × 100% adversarial critique enabled × $0.110 = $22.00
- 400 Q&A turns × $0.010 = $4.00
- 50 overrides + audit-trail interactions × $0.008 = $0.40
- 20 PDF exports × $0 (deterministic) = $0
- **Total: ~$31.40/month per B2B seat**

**Unit margin at $200:** ~$169. **Healthy** with critique-on-every-deal enabled.

### 5.4 B2B mid-market (~$2K/month projection)

**Multi-seat institutional access.** Cost scales primarily with active seats.

**Estimated query volume:** 5-10 seats × 200 analyses/seat = 1000-2000 analyses/month per institution.

**Monthly LLM cost per institution:**
- 1500 analyses (mid-point) × $0.025 = $37.50
- 1500 × adversarial × $0.110 = $165
- 3000 Q&A turns × $0.010 = $30.00
- Batch processing of historical portfolios (one-time per pilot start, then quarterly refreshes) × variable

**Per-institution rough budget:** ~$250-400/month total LLM cost.

**Unit margin at $2K:** ~$1600-1750. **Strong margin.** Supports custom prompt tuning, dedicated calibration regression sets per institution, white-label exports.

### 5.5 Unit economics summary

| Tier | Price | Avg LLM cost | Margin headroom |
|---|---|---|---|
| Free | $0 | ~$0.30/mo | Loss-leader (acceptable; substrate value) |
| Retail paid | $19.99 | ~$1.56/mo | ~92% margin |
| B2B small (projected) | $200 | ~$31/mo | ~84% margin |
| B2B mid (projected) | $2,000 | ~$300/mo | ~85% margin |

**Where economics break (need to instrument before they happen):**
- A free-tier user discovers a way to issue 50 analyses/month via API loopholes → cap enforcement gap
- A retail paid user issues 1000+ Q&A turns/month (effectively talking to the LLM, not analyzing) → not anticipated; cap if observed
- A B2B institution requests adversarial critique on every metric override → cost balloons; design batch processing alternative

---

## 6. Caching strategy

Three caches, all margin levers.

### 6.1 Anthropic prompt cache (5-min TTL)

**Cacheable content (per agent mesh doc §5.2):**
- Agent persona / instructions (boundary 1) — same for every call within an agent
- User profile + recent decisions (boundary 2) — same across multi-turn sessions
- Active conversation thread (boundary 3) — same within active dialogue

**Target cache hit rate:** ≥85% of total input tokens cached across the platform.

**Cost savings:** at 85% hit rate, effective input cost = `0.85 × $0.30/M + 0.15 × $3/M = $0.71/M` — a ~76% reduction vs. uncached.

**Validation:** instrumented from day one via `ConversationEvent.tokenUsage.cachedTokens`. Cache hit rate is a dashboard metric reviewed weekly.

**Cache invalidation discipline:**
- New prompt version → boundary 1 invalidates (one-time pay; bad if frequent)
- Profile update → boundary 2 invalidates for that user
- Conversation gets summarized (older turns compressed) → boundary 3 partial invalidation

**Cost-aware prompt-versioning rule:** don't bump `promptVersion` unless you have to. Cache miss is a cost; it's also a regression-risk surface (any new prompt = re-run evals).

### 6.2 Semantic cache for Q&A

For Q&A queries especially, repeat questions are common ("what does cap rate mean", "how is DSCR calculated", "why does my deal show negative cash flow"). Semantic-similarity cache:

1. User asks question
2. Compute embedding of normalized question
3. Look up nearest-neighbor cached answer (similarity threshold ≥0.92)
4. If hit: return cached answer (with optional minor personalization re-pass via Haiku, ~$0.001)
5. If miss: full Q&A agent call, store answer + embedding

**Estimated impact:** ~30-50% Q&A turn cost reduction once cache warms. Higher for educational queries (high repeat rate), lower for decision-specific queries (low repeat rate).

**Implementation:** embeddings via Voyage AI or Anthropic embeddings model (cheap, fast). Cache stored in MongoDB or Redis. TTL ~24h on cached answers (long enough to amortize; short enough that platform changes don't surface stale info).

**Personalization caveat:** semantic-cache hits skip persona-aware tone adjustments. For paid tiers where personalized tone matters, run the cached answer through a lightweight Haiku personalization pass on hit. Cost: ~$0.001 per hit. Still 5-10× cheaper than full Q&A.

### 6.3 Tool-result cache (existing MarketIntelligenceService cache)

Already implemented in current code ([marketIntelligenceService.ts](../backend/src/services/marketIntelligenceService.ts) lines 22-28). Configurable TTL via `CACHE_TTL_MINUTES` env (default 60 minutes).

Caches: RentCast property data, FRED economic indicators, market trends.

**Wave 1 work:** wrap as `tool:enrich_property`. Cache behavior ports through unchanged. Cache key generation is already handled.

**Cost impact:** RentCast charges per API call (varies by tier — assume ~$0.005-0.015 per comp lookup). At 60-min TTL and reasonable address overlap, cache hit rate is typically 30-60%. Tool-result cache directly reduces external-API spend, not LLM spend, but the dollars matter.

**Wave 2 opportunity:** consider semantic cache for "similar properties in same ZIP / metro" — comp data for one Phoenix Class B property is often useful for analyzing the next Phoenix Class B property. Deferred to wave 2; cache hit rates above need empirical baseline first.

---

## 7. Cost-cap enforcement

Belt + suspenders. Three caps, all enforced.

### 7.1 Per-query absolute cap

Kill switch. **No single query exceeds $1.00 in LLM cost.** Configurable.

If a query's running cost exceeds the cap mid-execution:
- Stream cancellation triggers
- Partial result returned with "Analysis exceeded cost limits; partial result shown" framing
- `CostEvent` written with `capHit: true`

In practice, this should never fire except in pathological cases (agent loops, runaway tool sequences). It's the safety net.

### 7.2 Per-user monthly cap (tier-dependent)

| Tier | Monthly LLM cost cap | Behavior on cap hit |
|---|---|---|
| Free | $1.00 | "You've used this month's analysis allotment. Resets next month or upgrade to paid." |
| Retail paid | $20.00 | "You've used 10× the average paid user's monthly cost. Contact support to discuss." (warning, not block) |
| B2B small | $100.00 | Warning to user + alert to ops |
| B2B mid | $500.00 | Alert to ops; no automatic block (account managers handle) |

Caps are configurable per user (B2B custom pricing may include higher caps).

### 7.3 Per-organization cap

For B2B with multiple seats, organizational cap is `seat_cap × seat_count × 1.2` (20% buffer). Cap hit at org level = alert to account manager + soft warning to seats.

### 7.4 CostEvent — operational, not substrate

CostEvent is **not** in the substrate event taxonomy (per [PRODUCT_2.0_EVENTS_STORE.md §0](PRODUCT_2.0_EVENTS_STORE.md) out-of-scope list). It's an operational metric collection:

```ts
interface CostEvent {
  _id: ObjectId;
  traceId: string;             // Same as the chat turn that incurred the cost
  userId: ObjectId;
  institutionId?: ObjectId;
  timestamp: Date;

  costType: 'llm' | 'external_api';
  provider: 'anthropic' | 'openai' | 'rentcast' | 'fred' | 'voyage';
  model?: string;              // For LLM costs
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  costCents: number;           // Always denominated in cents to avoid float drift
  capHit?: boolean;            // True if this call triggered a cap
}
```

Collection: `cost_events`. Insert-only (operational discipline, same as substrate; just not part of the substrate-as-moat).

**Why separate from substrate:** different lifecycle (cost data can be aggressively summarized and archived after 90 days; substrate is permanent), different access patterns (cost is ops-team query; substrate is product-team query), different retention (substrate never deletes; cost rolls up quarterly).

---

## 8. Cost monitoring and observability

### 8.1 Real-time dashboards

- Per-user: current month cost vs. cap, recent query distribution
- Per-org: aggregate cost across seats
- Per-agent: invocation count, average cost, cache hit rate
- Per-model: invocation count, total tokens, cost share
- Per-tier: aggregate cost across all users in tier

Built from `CostEvent` aggregation. Refreshed every 5 min.

### 8.2 Anomaly detection

Trigger alerts on:
- Single user crossing 80% of monthly cap (early warning)
- Per-query cost p99 jumps >20% week-over-week (drift)
- Cache hit rate drops below 70% (prompt invalidation regression)
- Cost per user per analysis trends upward >10% month-over-month (efficiency regression)

### 8.3 Weekly review

Founder + architect review weekly during first 12 weeks of wave 1:
- Are we on the unit-economics math?
- Where are queries running expensive? Outliers worth investigating?
- Cache effectiveness — is the boundary design working?
- Any tier crossing assumption? (e.g., free-tier users routinely hitting cap — pricing signal)

After 12 weeks of clean data, transition to monthly review.

---

## 9. Cost regression as eval gate

Cross-link to [PRODUCT_2.0_EVALS.md §7](PRODUCT_2.0_EVALS.md).

Every PR that touches agents or prompts runs the golden-set suite. Cost regression is reported alongside behavioral results:

```
Cost regression check:
  Per-query average cost: $0.022 (baseline: $0.020, change +10%)
  WARNING — cost per query increased by >5%. Investigate.
  - Top contributors: deal-scoring agent reasoning length up 15%
  - Cache hit rate: 87% (baseline 89%, no significant drift)
  - Recommended: review system prompt verbosity
```

**Thresholds (recap):**
- ≤5%: no flag
- 5-15%: warning, requires PR acknowledgment
- >15%: blocks merge unless overridden

Cost drift is a real signal — prompts get verbose over time as we add edge-case handling; a 15% jump per PR means we're regressing too quickly to ship sustainably.

---

## 10. Provider fallback considerations

**Wave 1: single-provider, Anthropic.** No fallback. Failure mode = degraded mode.

If Anthropic API is unavailable:
- Intent classifier fails → orchestrator falls back to a heuristic intent matcher (keyword-based; lower accuracy but functional)
- Deal-scoring agent fails → user gets "AI assistant temporarily unavailable; you can still run analyses via the wizard at /sfr-analysis." Existing wizard becomes the fallback surface (strangler-fig benefit — old surface still works)
- Q&A agent fails → "AI explanations temporarily unavailable. The deal-quality breakdown is displayed but without prose explanations."
- Adversarial critic fails → skip auto-invocation; manual critique disabled with "try again later" message

**Wave 2 consideration:** OpenAI fallback for Q&A only (lowest-stakes agent, no calibration-critical scoring path). Cost: ~3-day implementation effort + ongoing prompt portability concern. Defer unless Anthropic reliability becomes a real issue.

**Why not multi-provider by default:**
- Prompt portability across providers is a real cost (each provider has different tool-use APIs, different output schemas, different caching semantics)
- Calibration drift between providers is a real risk (Anthropic and OpenAI bias differently on edge cases)
- Operational complexity (which provider for which call, fallback triggering, observability separation) compounds

Single-provider until reliability data forces the decision.

---

## 11. Wave 1.5 and Wave 2 cost implications

Cross-link to [PRODUCT_2.0_ARCHITECTURE.md §11.5](PRODUCT_2.0_ARCHITECTURE.md).

### 11.1 Wave 1.5 — substrate instrumentation cost

PortfolioEvent + PipelineEvent emission from existing services. **Zero LLM cost** (deterministic; just writes to DB). DB write cost is negligible. No tier impact.

### 11.2 Wave 2 — portfolio-agent cost implications

When `enhancedPortfolioAI` becomes the portfolio-agent in wave 2, AI insight generation moves under tier discipline:

| Tier | Portfolio AI insight allowance |
|---|---|
| Free | Disabled or 1/month |
| Retail paid | Quarterly portfolio health check + on-demand insights (~5/month) |
| B2B small | Unlimited insights per portfolio, scheduled and on-demand |
| B2B mid | Plus white-label institutional dashboards (separate cost line) |

The existing `enhancedPortfolioAI` runs without per-user cost gating today. Wave 2's portfolio-agent migration adds gating; existing user behavior may change (current heavy users may see new caps). Communicate clearly.

### 11.3 Wave 2 — pipeline-agent cost

Mostly cheap. Pipeline state queries and aggregations are deterministic. AI portion is prioritization summaries ("you have 5 deals needing review this week"), which are cheap Sonnet calls. Within retail-paid budgets without additional gating.

---

## 12. Open questions

1. **Anthropic batch API for adversarial-critic batched seeding runs.** Anthropic's batch API offers ~50% cost reduction with 24h turnaround. For periodic offline adversarial passes (per agent mesh §4.3), batch is the right tier. Implementation deferred to when batched seeding work begins (weeks 10+).

2. **Embedding provider choice for semantic cache.** Voyage AI vs. Anthropic embeddings vs. OpenAI embeddings. Cost and quality trade-offs all small at this scale. Default: pick Anthropic embeddings if available at wave 1 time; otherwise Voyage. Defer concrete decision to implementation.

3. **Tool-result cache TTL tuning.** Current code defaults to 60 minutes. RentCast comp data is stable over days; FRED economic indicators stable over weeks; market trends stable over weeks. Could safely extend to 24-hour TTL on most tool results. **Recommend: extend default tool-result cache TTL to 24h for RentCast and 7d for FRED data during wave 1 lift.** Easy cost win.

4. **Cost-cap enforcement during streaming.** A streamed response that crosses the per-query cap mid-stream — do we abort gracefully (current design) or let it finish (better UX, breaks the cap)? Current bias: abort. Validate user impact in early traffic.

5. **B2B custom pricing signals.** First B2B pilot pricing (~$500-$2K/month per thesis §6 Track 2) is set by demo signal, not architecture. As soon as a pricing signal emerges, re-baseline the per-tier projections in §5.3 and §5.4.

6. **OpenAI fallback for Q&A — when to build.** Defer until Anthropic reliability hits a measurable threshold (e.g., >0.5% of Q&A turns failing due to provider outage in a month). If never hits that threshold, never build.

---

## 13. Changelog

- **2026-05-10 (v1):** Initial draft. Pricing baseline (Anthropic Haiku 4.5 / Sonnet 4.6 / Opus 4.7, May 2026), model-tier routing per agent and tool with cost justification, per-query archetypes (analyze property, BUY-band with critique, Q&A follow-up, override), per-tier price-point analysis ($0 / $19.99 / $200 projection / $2K projection) with unit economics calculations, caching strategy across three caches (prompt cache, semantic cache, tool-result cache), three-level cost-cap enforcement (per-query / per-user / per-org), `CostEvent` operational collection separate from substrate, monitoring + anomaly detection, cost regression as eval gate, single-provider position with degraded-mode fallback, wave 1.5 / wave 2 cost implications, 6 open questions flagged.
