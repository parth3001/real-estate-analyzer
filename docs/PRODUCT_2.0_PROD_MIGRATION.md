# REanalyzr 2.0 — Production Migration

**Document type:** Phased deploy plan for moving from current production to wave 1 production
**Authored:** 2026-05-11 (after architect surfaced shared-DB risk to events store)
**Status:** Active plan; supersedes earlier informal deploy framing
**Owns:** Atlas cluster separation, phased deploy sequence, pre-production checklists, rollback procedures, founder-backfill migration script

---

## 0. Why this doc exists

The events store / substrate is the moat (per [thesis §2.3](REANALYZR_2.0_THESIS_AND_DECOMPOSITION_v3.md)). It's append-only — you cannot delete polluted events without breaking the architectural invariant the moat depends on.

The current production setup uses one shared MongoDB Atlas cluster for both dev and production. **That's manageable for existing Deal/Portfolio/User collections (mutable; can clean up).** **That's dangerous for the events store (immutable once written).**

This doc documents:
1. **Atlas cluster separation** — split dev from prod before any application code writes events
2. **Phased deploy plan** — substrate-seeding deploy (Phase 2) ships earlier than the full chat-surface deploy (Phase 4); strangler-fig discipline maintained throughout
3. **Per-phase checklists** — pre-deploy verification, post-deploy monitoring, rollback procedures
4. **Founder-historical backfill migration** — one-time script (Phase 5) for seeding production substrate from dev cluster fixtures

**Audience:**
- **Founder (Parth)** — owns deploy approval per phase; executes Atlas dashboard operations
- **Engineer persona** — implements env-aware connection (W1-S5a); writes migration script
- **Architect persona** — reviews each phase deploy; signs off on cutover decisions

---

## 1. The phased plan at a glance

```
PHASE 0 — NOW (30 min Atlas dashboard work)
  Atlas M0 dev cluster spun up. Env-aware connection logic in code.
  Production cluster untouched.

PHASE 1 — Wave 1 development (weeks 1-8 of wave 1)
  All wave 1 work on reanalyzr-2.0 branch, against dev cluster.
  Production runs existing code on production cluster, unchanged.

PHASE 2 — Substrate-seeding deploy to production (week 8-10)
  ── FIRST production deploy of wave 1 code. NO UI change to users. ──
  Substrate schemas + repository + wave 1.5 instrumentation deploy.
  Production cluster now has `events` collection + append-only role.
  Existing wizard / portfolio / pipeline usage starts producing events.

PHASE 3 — Continue building (weeks 10-14)
  Agents, chat surface, MCP, observability on reanalyzr-2.0 + dev cluster.
  Production substrate accumulating from Phase 2.

PHASE 4 — Chat-surface deploy to production (week 14)
  ── BIG deploy: UI + agents + tools + chat surface all together. ──
  /app route goes live. Hero embed replaces UniversalCalculator on
  LandingPage. Existing wizards remain operational (strangler-fig).

PHASE 5 — Founder-historical backfill migration (optional, week 14-16)
  One-time script: copy ~200 fixture events from dev → prod cluster.
  Seeds production substrate with calibration anchor.

PHASE 6 — Wave 2 development continues
  Same pattern: dev on reanalyzr-2.0/dev cluster, periodic prod ships.
```

---

## 2. Phase 0 — Atlas separation setup (NOW)

**Decision (revised 2026-05-11):** Use **separate database on existing cluster**, not a separate cluster. Founder is on M0 free tier; Atlas free tier allows only one M0 per organization. Creating a second cluster would cost money (cheapest is M2 ~$9/month). Database-level separation addresses the substrate-pollution threat model fully — different DB users + different connection strings make accidental cross-contamination impossible. Cluster-level separation is a future concern (storage/CPU triggers documented in §11).

### 2.1 Founder action — Atlas dashboard (5 minutes)

1. Sign into MongoDB Atlas
2. Existing cluster (`cluster0.djv91js.mongodb.net`) stays as-is — no new cluster needed
3. Create new database user:
   - **User:** `reanalyzr_dev_user` (or similar — must be unambiguously different from prod user)
   - **Password:** strong, store in 1Password / equivalent
   - **Roles:** `readWrite` ONLY on database `real-estate-analyzer-dev` (NOT on production `real-estate-analyzer` database). This is the load-bearing isolation — the dev user literally cannot write to the production database.
4. Network access: existing rules apply
5. Construct connection string. Use existing cluster URL, change the database name in the path from `real-estate-analyzer` to `real-estate-analyzer-dev`:
   ```
   mongodb+srv://reanalyzr_dev_user:<pwd>@cluster0.djv91js.mongodb.net/real-estate-analyzer-dev?retryWrites=true&w=majority
   ```

**Note:** MongoDB auto-creates the database on first write. No explicit "create database" step required in Atlas dashboard.

### 2.2 Founder action — local environment

In `backend/.env` (or whatever `.env*` your local dev reads):
- Update or add `MONGODB_URI=<dev connection string from step 5>` (note `-dev` suffix on database path)

**Verify:**
```bash
cd backend && npm run dev
# Backend should log which DATABASE it connected to
# Confirm it ends in '-dev' (e.g., 'real-estate-analyzer-dev')
# NOT the production database name
```

### 2.3 Engineer action — env-aware connection logic

**Story: W1-S5a — Environment-aware DB connection** (new story, S, ~1 story-day).

Add `backend/src/config/db.ts`:
- Reads `MONGODB_URI` env var
- Detects `NODE_ENV` (`test` → mongodb-memory-server; `development` / `production` → Atlas)
- **Production-safety guard (database-name check, not cluster):** if `NODE_ENV=development` but `MONGODB_URI` connects to the production database (`real-estate-analyzer` without `-dev` suffix), refuse to start and log an error. Belt-and-suspenders against connection-string misconfiguration.
- Logs database name (never password) on successful connection — visible sanity check. Example log: `Connected to MongoDB: cluster0.djv91js.mongodb.net / real-estate-analyzer-dev (NODE_ENV=development)`

### 2.4 Phase 0 exit criteria

- [ ] Dev DB user `reanalyzr_dev_user` provisioned in Atlas with `readWrite` on `real-estate-analyzer-dev` only (NOT on `real-estate-analyzer` prod database)
- [ ] Local `.env` MONGODB_URI points at `real-estate-analyzer-dev` database
- [ ] `backend/src/config/db.ts` shipped on reanalyzr-2.0
- [ ] `npm run dev` connects to dev database (verified via log message showing `-dev` suffix)
- [ ] Production database (`real-estate-analyzer`) verified untouched (no schema or role changes)
- [ ] Dev DB user verified unable to write to production database (attempted write returns auth error)

---

## 3. Phase 1 — Wave 1 development on dev cluster (weeks 1-8)

**Standard wave 1 work** per [PRODUCT_2.0_FIRST_2_WEEKS.md](PRODUCT_2.0_FIRST_2_WEEKS.md) and [PRODUCT_2.0_BACKLOG.md](PRODUCT_2.0_BACKLOG.md), with one constraint:

**All Atlas-touching code points at dev cluster only.** Never at prod cluster during Phase 1.

This includes:
- Repository write methods (W1-S3 onward)
- Integration tests (W1-S8) — run against dev cluster
- Tool implementations that write events (W4)
- Founder-historical backfill (W10) — writes ~200 fixture events to dev cluster
- Smoke testing — any manual scripts hit dev cluster

**Production cluster invariants during Phase 1:**
- No `events` collection
- No append-only DB role
- Existing wizard / portfolio / pipeline keep working exactly as today
- Production users see ZERO change

### 3.1 Phase 1 exit criteria

- [ ] Wave 1 backend complete on reanalyzr-2.0: W1, W4, W12, W13, W14, and W1-S5 (DB role provisioning script) are all done and tested against dev cluster
- [ ] Calibration regression check passing on dev cluster with founder-historical backfill events as anchor
- [ ] Smoke test: a fresh checkout of reanalyzr-2.0 can write an AnalysisEvent + DecisionEvent to dev cluster via existing wizard code path (W14 instrumentation works)
- [ ] Production cluster verified still untouched

---

## 4. Phase 2 — Substrate-seeding deploy to production (week 8-10)

**The first production deploy of wave 1 code. CRITICAL: no UI change to production users.**

### 4.1 What deploys

Code (from reanalyzr-2.0, deployed via Render):
- Substrate schemas (`backend/src/models/events/*`) — all 11 event types
- Repository layer (`backend/src/repositories/EventsRepository.ts`)
- Wave 1.5 instrumentation (W12, W13, W14):
  - Portfolio service emits PortfolioEvents
  - Pipeline service emits PipelineEvents
  - SFR wizard backend emits AnalysisEvent + DecisionEvent on completion
  - MF wizard backend emits AnalysisEvent + DecisionEvent on completion
  - `portfolioType` field added to Portfolio model (default `'retail'` for existing records)
- Env-aware DB connection (W1-S5a, already deployed via earlier reanalyzr-2.0 commits)

**NOT included in Phase 2:**
- Orchestrator
- Agents (deal_scoring, qa, adversarial_critic)
- Tools that write events from chat (score_deal, etc.)
- Chat surface (/app route)
- Hero embed on LandingPage
- MCP server
- Observability dashboards (W22)

### 4.2 Atlas pre-deploy steps (founder action)

1. **Provision events-writer DB role on production cluster:**
   - Run `backend/src/scripts/provisionEventsRole.ts` against prod cluster
   - Verify role exists with `find` + `insert` privileges only on `events` collection
   - Create new user `reanalyzr_events_writer` with this role
   - Add credentials to production env vars (Render dashboard): `MONGODB_EVENTS_URI` or use the same `MONGODB_URI` but with the new user

2. **Verify existing collections untouched:** Compass spot-check that Deal, Portfolio, User collections look identical to pre-deploy

3. **Snapshot production cluster** (Atlas backup) — point-in-time recovery anchor

### 4.3 Deploy steps

1. Merge `reanalyzr-2.0` to `main` (or deploy directly from `reanalyzr-2.0` if Render is configured for that)
2. Render deploys code; backend restarts
3. Backend logs which cluster it connected to — verify production
4. Backend startup script verifies events-writer DB role exists — startup fails if role wrong (sanity check, per W1-S5)
5. Existing wizard / portfolio / pipeline traffic continues — no perceptible user impact
6. First analysis run by any production user (via existing wizard) emits AnalysisEvent + DecisionEvent to production substrate

### 4.4 Post-deploy monitoring (first 24 hours)

- **Substrate growth rate:** events being written? Compass `db.events.countDocuments({})` periodically
- **Zod parse failure rate:** should be 0%; check repository logs
- **DB role enforcement:** any attempted update/delete operations being rejected in logs? (Shouldn't be, but verify)
- **Error rate on existing endpoints:** /api/deals/analyze etc. should have unchanged error rates
- **Render application logs:** any unexpected exceptions related to event writes

### 4.5 Reversibility

If issues surface:
- **Feature flag at instrumentation level:** wave 1.5 instrumentation has a `ENABLE_EVENT_WRITES` env var; flip to `false` and redeploy → existing services stop emitting events
- Events already written to production substrate stay — they're append-only. They're acceptable real events from real user behavior; no rollback of data needed.
- If schema-level bug discovered: stop the bleeding (flag off), fix the bug on reanalyzr-2.0, redeploy

### 4.6 Phase 2 exit criteria

- [ ] Wave 1.5 instrumentation code deployed to production successfully
- [ ] Events-writer DB role active on production cluster
- [ ] First 50+ AnalysisEvents written to production substrate from real users
- [ ] Zod parse failure rate < 0.1%
- [ ] No regression in existing endpoint error rates
- [ ] Production substrate Compass view confirms event diversity (AnalysisEvent, DecisionEvent, PortfolioEvent, PipelineEvent all present)

---

## 5. Phase 3 — Continue building (weeks 10-14)

Same pattern as Phase 1, but production substrate is now accumulating real data in parallel.

**Production cluster during Phase 3:**
- Events collection growing organically from existing wizard / portfolio / pipeline usage
- No agent code reading events yet (no observability dashboards to see this except direct Compass queries)
- Pre-launch state for the chat surface

**Engineer / Architect activity:**
- Build agents (W2, W3, W5)
- Build chat surface (W6, W7)
- Build MCP server (W11)
- Build observability dashboards (W22)
- Ship calibration check CI gate (W8 polish)
- All against dev cluster

---

## 6. Phase 4 — Chat-surface deploy to production (week 14)

**The big UI deploy. Wave 1 chat surface goes live.**

### 6.1 What deploys

Everything not already in production:
- Orchestrator + agents (deal_scoring, qa, adversarial_critic)
- Remaining tools (score_deal — which now exists both as the agent tool AND has been duplicating the wizard's AnalysisEvent emission since Phase 2; convergence test required)
- Chat surface at `/app` (W6)
- Hero embed on LandingPage replacing `<UniversalCalculator />` at line 450 (W7)
- SEO wrapper pages inherit hero-chat-embed change automatically
- MCP server interface (W11)
- Observability dashboards (W22 + W24a)

### 6.2 Pre-deploy verification

- **Calibration check on production substrate:** new agent pipeline (`tool:score_deal`) produces identical `dealQuality` scores to the wizard-emitted AnalysisEvents already in production substrate. Zero-tolerance.
- **Wave 1 exit criteria all met** (per [PRODUCT_2.0_BACKLOG.md §10 Q6](PRODUCT_2.0_BACKLOG.md))
- **B2B demo dress rehearsal:** at least one end-to-end demo of the new chat surface against production data
- **Founder time committed for monitoring** ~4 hours over first 24 hours post-deploy

### 6.3 Deploy steps

1. Merge `reanalyzr-2.0` (or specific wave 1 feature branch) → `main` (or direct deploy)
2. Render deploys
3. New routes go live:
   - `/app` chat surface
   - LandingPage hero embed change cascades to `/`, `/brrrr-calculator`, `/cap-rate-calculator`
   - `/rental-property-calculator` embed change (separate file)
4. Existing routes continue to work — strangler-fig
5. Cost-cap enforcement active (per [PRODUCT_2.0_COSTS.md §7](PRODUCT_2.0_COSTS.md))
6. Observability dashboards show real-time substrate growth + agent invocation cost

### 6.4 Soft-launch considerations

Three options for visibility:

| Option | Description | Risk profile |
|---|---|---|
| **Full launch** | Hero embed live for all visitors immediately | Highest first-touch volume; least cost discipline runway |
| **Founder-only feature flag** | `/app` and hero embed gated by IP or auth state for a 24-hour soak | Lowest risk; loses early signal |
| **A/B 10/90 split** | 10% of visitors see hero embed; 90% see UniversalCalculator | Best of both — real-traffic signal with limited blast radius |

**Recommendation: A/B 10/90 for first 48 hours, ramp to full** if signals look healthy. Configure via simple cookie-based split.

### 6.5 Post-deploy monitoring (first 48 hours)

- Substrate event volume (expect 5-10x prior baseline from chat-driven analyses)
- Per-user cost (vs. cost-cap thresholds)
- Cache hit rate (should approach 85% target within first day as cache warms)
- Adversarial critic invocation cost (should be rare per BUY-band gating)
- Chat surface conversion (analyses started per visitor)
- Error rate on /app route specifically
- Founder personally reviews 5-10 first-day decisions for calibration sanity

### 6.6 Reversibility

- `/app` route disable: feature flag → redirect /app to /sfr-analysis
- Hero embed disable: feature flag → restore `<UniversalCalculator />` rendering in LandingPage
- Specific agent disable: orchestrator routes to fallback (e.g., adversarial critic disabled if BUY-band cost balloons)

### 6.7 Phase 4 exit criteria

- [ ] All Wave 1 exit criteria met per [PRODUCT_2.0_BACKLOG.md §10 Q6](PRODUCT_2.0_BACKLOG.md)
- [ ] Chat surface stable for 48 hours
- [ ] Cost per query within projected $0.025 average
- [ ] No regression in existing wizard surface
- [ ] First end-to-end B2B demo completed on production chat surface

---

## 7. Phase 5 — Founder-historical backfill migration (optional)

### 7.1 Decision: migrate or not?

**Migrate if:**
- Calibration anchor in production substrate is valued
- Founder's 60 personal analyses + ~140 synthetic edge cases provide regression-set baseline against real production traffic
- B2B demos benefit from "the substrate has 200+ events from day one" framing

**Don't migrate if:**
- Real production traffic accumulates substrate fast enough (Phase 2 already started this)
- Production substrate purity ("only real user behavior") is desired

**Bias:** migrate. Founder backfill is high-signal seed data; production-only accumulation may take weeks to reach calibration-validation volume.

### 7.2 Migration script design

`backend/src/scripts/migrateBackfillEventsToProduction.ts`:

```ts
// Connects to BOTH clusters (dev as source, prod as target)
// Source: dev cluster, filter by traceId LIKE 'backfill-%' or 'founder-historical-%'
// Target: prod cluster, via the events-writer user
// Per-event: verify dest doesn't already have same _id (idempotency)
// Insert via repository (Zod parse on the way in)
// Report: read N from dev, wrote M to prod (M should equal N first run, 0 on re-run)
```

### 7.3 Run-once procedure

1. Founder approves migration (script doesn't run automatically)
2. Run from local laptop with both DEV_MONGODB_URI and PROD_MONGODB_URI set
3. Script prints dry-run summary first ("would write N events to prod")
4. Founder confirms; script runs for real
5. Verify counts in prod cluster post-migration

### 7.4 Phase 5 exit criteria

- [ ] All identified backfill events migrated (counts match)
- [ ] Sample event spot-check: traceId, payload, timestamp preserved correctly
- [ ] Calibration check on production substrate now anchored to the 200-event regression set

---

## 8. Phase 6 — Ongoing development pattern

After Phase 4 (and optional Phase 5):

- **Dev cluster** continues for ongoing development. Reanalyzr-2.0 branch (or successors) targets dev cluster.
- **Production cluster** is the moat datastore. Substrate accumulates from real user behavior + B2B pilot data + any future backfills.
- **Wave 2 work** (portfolio-agent, pipeline-agent, market-data agent) follows the same Phase 1 → Phase 2/4 pattern as wave 1.
- **CI** continues using `mongodb-memory-server` for unit + most integration tests; periodic CI runs hit dev cluster for Atlas-specific tests.

---

## 9. Cross-cutting concerns

### 9.1 CI and eval pipeline impact

- Unit tests: `mongodb-memory-server` only. Never touches any Atlas cluster. Unchanged.
- Integration tests: bias toward `mongodb-memory-server`; periodic CI runs hit dev cluster for Atlas-specific concerns (DB role enforcement, index utilization).
- Calibration check (W8-S3): operates in-memory using mocked events repository (per evals doc §3); never writes events to any cluster during CI.

### 9.2 Render configuration

- Local dev: `.env.development` with dev cluster `MONGODB_URI`
- Production Render service: env vars include prod cluster `MONGODB_URI` + `ENABLE_EVENT_WRITES=true` (after Phase 2) + `ENABLE_CHAT_SURFACE=true` (after Phase 4)
- Render preview deploys: point at dev cluster (or a separate Render-preview cluster if preview volume is high)

### 9.3 Secret management

- Connection strings in env vars only — never committed to git
- Backfill migration script reads `DEV_MONGODB_URI` and `PROD_MONGODB_URI` as separate env vars to make it impossible to accidentally use one for the other
- Atlas database user passwords stored in founder's password manager + Render env vars

### 9.4 Observability across clusters

- Dev cluster observability is via Compass + local logs (no dashboards needed)
- Production cluster observability is via W22 dashboards (deployed in Phase 4)
- Cross-cluster comparison (sanity check that production behaves like dev) happens monthly via spot-checks

---

## 10. Risks specific to this migration plan

### R-M1 🟡 — Phase 2 schema bug pollutes production substrate before catch

**Framing:** Phase 2 deploys event-writing code to production for the first time. A bug in the schema or write logic could pollute the production substrate with bad events that can't be deleted (append-only).

**Mitigation:**
- Heavy dev cluster testing before Phase 2 deploys
- Feature flag (`ENABLE_EVENT_WRITES`) at instrumentation level — can disable mid-incident
- Calibration check CI gate must pass before Phase 2 deploy (locks regression set against expected outputs)
- Schema versioning (`eventVersion: 1`) allows future schema fixes without invalidating older events

### R-M2 🟢 — Phase 4 deploy day issues

**Framing:** Big-bang UI + agents deploy. Many surfaces lighting up at once.

**Mitigation:**
- A/B 10/90 split first 48 hours per §6.4
- Founder availability for live monitoring
- Per-route feature flags allow precise rollback (e.g., `/app` off but agents still callable internally)

### R-M3 🟢 — Founder-backfill migration script bugs

**Framing:** One-time script that writes to production cluster. Bug = wrong events in prod or duplicates.

**Mitigation:**
- Dry-run mode first
- Idempotency check (refuse to insert if traceId already exists)
- Founder explicit approval to run

---

## 11. Open questions

1. **Cluster-level separation triggers (future).** Current plan uses same-cluster-different-database for cost reasons (M0 free tier; Atlas only allows one M0 per organization). Triggers to revisit and split to a separate cluster:
   - Production substrate reaches ~400MB (80% of M0's 512MB shared limit) — upgrade production cluster to paid tier, optionally create separate M0 in new Atlas project for dev
   - Production CPU/IOPS contention affects dev development (symptoms: slow `npm run dev` queries during prod traffic spikes)
   - Wave 2 B2B pilot requires HA on production (paid tier justified) — separation cost amortizes
   - These triggers are 6-12 months out at earliest; not blocking wave 1
2. **Snapshot prod → dev for realistic test data?** Currently dev database starts empty + accumulates from local testing. If wave 1.5 testing of strangler-fig integration needs realistic Deal data, one-time anonymized snapshot is the pattern.
3. **A/B split mechanism for Phase 4 soft launch.** Cookie-based or server-side fingerprint? Defer to implementation.
4. **Feature flag implementation.** Simple env-var (`ENABLE_EVENT_WRITES=true|false`) or use a feature-flag service (LaunchDarkly etc.)? Bias: env var — minimal infra.
5. **Backfill migration script needs Founder review** before running. Confirm review path.

---

## 12. Changelog

- **2026-05-11 (v1):** Initial migration plan. Surfaced when architect identified shared production/dev DB as a critical risk for the events store (append-only / substrate moat). Six phases mapped (0 — separation setup; 1 — wave 1 dev; 2 — substrate-seeding deploy; 3 — continued dev; 4 — chat-surface deploy; 5 — backfill migration; 6 — ongoing). Pre/post checklists per phase. 3 phase-specific risks (R-M1/M2/M3) with mitigations. 5 open questions flagged.
- **2026-05-11 (v1.1):** Revised Phase 0 from "separate Atlas cluster" to "separate database on existing cluster" after founder noted cost concern (M0 free tier allows only one cluster per org; second cluster would cost ~$9+/mo). Database-level separation (`real-estate-analyzer` vs `real-estate-analyzer-dev` databases on same cluster) fully addresses the substrate-pollution threat model via DB-user isolation. Atlas dashboard work shrinks from ~30 min (new cluster) to ~5 min (new DB user). Cluster-level separation triggers documented in §11 question 1 — revisit when storage/CPU/B2B-pilot signals warrant. Production-safety guard updated to check database name rather than cluster hostname.
