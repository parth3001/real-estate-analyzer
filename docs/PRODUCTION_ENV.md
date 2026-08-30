# Production Environment — source of truth

**Last verified: 2026-08-30** (free-beta launch, Issue #260)

Render services are configured in the **dashboard**, not from `render.yaml`
(see that file's header for why). This document is therefore the only
version-controlled record of what production should look like. When something
behaves strangely in production, diff the dashboard against this page first.

## How values get set — and how they can change underneath you

Only three things change a Render env var:

1. **Someone edits it in the dashboard.** The normal path.
2. **A linked Environment Group.** Render can inject vars from a shared group.
   Check under Environment → Environment Groups. As of 2026-08-30 no group
   appeared to be linked; if one gets added later, its values win and this
   document needs a note saying which vars it owns.
3. **A Blueprint sync.** If `render.yaml` is ever connected as a Blueprint, it
   takes ownership of the keys it declares — today `NODE_ENV`, `PORT`,
   `CORS_ORIGIN`, `OPENAI_API_KEY`, `MONGODB_URI`, `CENSUS_API_KEY`. Everything
   else in the tables below is dashboard-only and would survive a sync.

**Where the current values came from:** the cost-cap and dev-seed vars were
copied out of `docs/PRODUCT_2.0_IMPLEMENTATION_LOG.md` §6 during the 2.0
backend setup — which is why they matched the code defaults exactly rather than
being tuned. That table documents *defaults*, not production values. Treat it
as reference; treat this page as configuration.

---

## Backend — `real-estate-analyzer-api`

Build: `cd backend && npm install && npm run build` · Start: `cd backend && npm start`
Root directory: *(empty)* · Auto-deploy: **Off** · Branch: `reanalyzr-2.0`

### Launch-critical

| Var | Production value | Breaks if wrong |
|---|---|---|
| `BILLING_ENABLED` | `false` | Defaults to `true` → the paywall ships and users hit a wall Stripe can't clear |
| `MONGODB_URI` | *(secret)* — **must contain `/real-estate-analyzer`** before the `?` | With no db path the guard is skipped and Mongoose connects to `test`; looks exactly like all user data vanishing |
| `FRONTEND_URL` | `https://reanalyzr.com/` | Defaults to localhost → every magic-link email is a dead link → nobody can sign up. Trailing slash is fine, it's stripped in `emailService.ts` |
| `JWT_SECRET` | *(secret)* | Every authenticated request throws. Also signs refresh tokens — there is no separate `JWT_REFRESH_SECRET` in production code |
| `CORS_ORIGIN` | `https://reanalyzr.com,https://www.reanalyzr.com,https://theficouple.reanalyzr.com,https://real-estate-analyzer-9ise.onrender.com` | **Enforced as of 2026-08-30** (was previously read but never applied). Any origin missing from the list is blocked. Unset → warns and falls back to permissive |
| `NODE_ENV` | `production` | Gates the db-name check, rate limiting, trust proxy, and health-payload redaction |
| `PORT` | `10000` | Render's expected port |

### Cost discipline

Tuned for the free beta — **not** the documented defaults. Under free mode
nobody pays, so a cap that fires is pure user-facing breakage with no recovery
path while Stripe is dark.

| Var | Production value | Default | Why it differs |
|---|---|---|---|
| `COST_CAP_LICENSE_CENTS` | `1000` | `200` | $2 was sized as the COGS budget on a $4.99 sale. On hit, the orchestrator flips the license `active → expired` — with no re-license path in free mode, that permanently locks the most engaged users out of their deal |
| `COST_CAP_DAILY_CENTS` | `5000` | `2000` | **Global pool across all users**, not per-user. At $20 roughly ten deep-dive users exhaust it and the product stops responding for everyone until reset |
| `COST_CAP_SESSION_CENTS` | `100` | `100` | Unchanged — this is the real per-user brake |
| `COST_GUARDS_ENABLED` | `true` | `true` | Master switch. Never `false` in production |

### Keys and integrations

`ANTHROPIC_API_KEY` · `OPENAI_API_KEY` · `RESEND_API_KEY` (magic-link delivery;
missing = silent no-send, warn only) · `RENTCAST_API_KEY` · `FRED_API_KEY` ·
`GOOGLE_MAPS_API_KEY` · `CENSUS_API_KEY`

### Operational

| Var | Production value | Note |
|---|---|---|
| `LOG_LEVEL` | `info` | Defaults to `error` — you would see almost nothing in Render logs |
| `TERMS_VERSION` | `2026-07-27` | Defaults to `'2026-01'`, a version absent from `TOS_VERSION_HISTORY`, so every signup gets stamped with a phantom version |
| `EVENTS_ROLE_CHECK_MODE` | *(unset → `warn`)* | Atlas M0 cannot run `provision-events-role.js` (needs M10+). Set to `strict` only after upgrading the cluster |
| `CHAT_PER_IP_LIMIT` / `_ENABLED` | `5` / `true` | Anonymous-only daily cap |
| `ANTHROPIC_PROMPT_CACHE_ENABLED` | `true` | |
| `CRITIQUE_ON_SAVE_ENABLED` | `true` | |
| `GOOGLE_MAPS_CACHE_TTL_DAYS` / `_MONTHLY_BUDGET` | `30` / `100` | |

### Must NOT be set

| Var | Why |
|---|---|
| `ENABLE_DEV_LICENSE_SEED` | Opens `POST /api/deals/:id/seed-license` — **any authenticated user can mint themselves unlimited free licenses**. Was set in production until 2026-08-30 |
| `RUN_SMOKE_TESTS` | Fires analysis requests at `http://localhost:3001` on every boot (`TEST_API_URL` default; Render runs on 10000). Logs errors for ~30s each restart, and would burn LLM tokens if it ever reached the right port. Was set to `true` until 2026-08-30 |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Free beta — no checkout can be created, so the webhook has nothing to verify |

---

## Frontend — `real-estate-analyzer-9ise` (static site)

Build: `cd frontend && npm install && npm run build && mkdir -p build && cp -r dist/* build/`
Publish directory: `frontend/build` · Auto-deploy: **Off** · Branch: `reanalyzr-2.0`

> The `cp` shim is load-bearing. Vite writes to `dist`; the publish directory is
> `build`. Do not "simplify" one without the other. The copy also carries
> `_redirects` and the seven prerendered `blog/*/index.html` directories.

| Var | Production value | Breaks if wrong |
|---|---|---|
| `VITE_API_URL` | `https://real-estate-analyzer-api.onrender.com/api` | **Must end in `/api`** — it is the axios `baseURL` and every caller passes bare paths. Without it, every request 404s |
| `VITE_CLARITY_PROJECT_ID` | `wi8te8zn65` | Build-time injection |

**Must NOT be set:** `VITE_ENABLE_DEV_LICENSE_SEED` (reveals the seed button;
was set until 2026-08-30) · `VITE_STRIPE_PAYMENT_LINK` (free beta) ·
`VITE_API_BASE_URL` (removed from the code 2026-08-30 — it was a localhost trap)

> `VITE_*` vars are inlined at build time. Changing one has no effect until you
> redeploy — there is no restart-to-pick-up as on the backend.

### Redirect and rewrite rules

Order matters; the blog rules must come **before** the catch-all or Googlebot
gets the SPA shell instead of the prerendered pages.

| Source | Destination | Action |
|---|---|---|
| `/blog` | `/blog/index.html` | Rewrite |
| `/blog/:slug` | `/blog/:slug/index.html` | Rewrite |
| `/*` | `/index.html` | Rewrite |

These mirror `frontend/public/_redirects`. Keep them in sync — or delete the
dashboard rules and let `_redirects` own routing, but do not let them diverge.

---

## When billing goes live

1. `BILLING_ENABLED` → `true` on the backend
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `VITE_STRIPE_PAYMENT_LINK`
3. Reconsider `COST_CAP_LICENSE_CENTS` — `200` was sized against $4.99 revenue
   and becomes defensible again once users are paying
4. Remove the free-beta banners on `PricingPage.tsx` and `LandingPage.tsx`
5. Free-beta licenses already issued keep their 60-day window; they are
   identifiable by `pricePaidCents: 0` plus a `redeemedFromCreditId` pointing at
   a `promo` credit

**Prerequisite, not optional:** before bumping `CURRENT_TOS_VERSION` for the
counsel-reviewed terms, make `requiresReconsent()` reachable. It is called only
from the password-login path, which the UI no longer routes to since magic link
became the sole signup route — so a version bump today would silently reach
nobody.
