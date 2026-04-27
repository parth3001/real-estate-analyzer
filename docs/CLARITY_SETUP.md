# Microsoft Clarity Setup

**Project ID:** `wi8te8zn65`
**Dashboard:** https://clarity.microsoft.com/projects/view/wi8te8zn65
**Installed:** April 27, 2026 (`apple-design-system-v1`)

## How it's wired

The Clarity tracking snippet is injected at build time by [`frontend/vite.config.ts`](../frontend/vite.config.ts) via a `transformIndexHtml` plugin. The plugin reads `VITE_CLARITY_PROJECT_ID` from the environment — when set, the snippet is inserted into `<head>`; when unset, no script is loaded.

This means:

- **Local dev** (no env var) → no Clarity tracking, no dev sessions polluting prod data
- **Render production** (env var set to `wi8te8zn65`) → Clarity tracking active

## Required dashboard setup (do once)

1. Sign in at https://clarity.microsoft.com
2. Open project `wi8te8zn65` → **Settings** → **Masking**
3. Set masking mode to **Strict**
4. Save

Strict mode masks all text and form inputs by default. Marketing pages (`/`, `/blog`, `/blog/*`, `/sample-analysis`) opt out via `data-clarity-unmask="True"` on their root containers, so heatmaps and session replay show the actual content there.

Financial / analysis pages (`/sfr-analysis`, `/mf-analysis`, etc.) stay fully masked. You'll see scroll behavior, click locations, dead clicks, and rage clicks — but not the actual numbers or addresses users typed in. That's deliberate; addresses and prices are PII for a financial app.

## Render env var

Set `VITE_CLARITY_PROJECT_ID=wi8te8zn65` in the Render dashboard for the production frontend service before the next build. Vite resolves env vars at build time, not runtime, so you must redeploy after setting it.

For staging or preview deploys, leave the var unset — those builds will skip Clarity injection automatically.

## What to look at first

Once production traffic starts flowing into the dashboard:

1. **Recordings → filter by Page = `/`** — watch ~10 sessions of the new homepage. Look for: scroll depth, where users stop, whether the sample 34/100 score card gets attention, whether anyone clicks "Or try the free calculator first ↓".
2. **Heatmaps → `/`** — click heatmap shows what visitors actually engage with vs. what we expected.
3. **Insights → Dead clicks** — visitors clicking on things that aren't links/buttons. UX bug detector.
4. **Insights → Rage clicks** — repeated rapid clicks indicate frustration with non-responsive UI.
5. **Recordings → filter by Page = `/sfr-analysis`** — watch where users abandon the wizard. (Form values are masked; behavior isn't.)

## Phase 2 — custom events (later)

The current install captures Clarity defaults only. Phase 2 will add custom events to `analytics.ts` (e.g., `window.clarity('event', 'calculator_completed')`) so you can segment session recordings by user behavior. Don't do this until you've watched ~50 default-captured sessions and know what gaps remain.

## Privacy

The Privacy Policy at `/privacy` discloses Clarity tracking and the Strict masking config. Don't enable Clarity on a deploy that doesn't include the privacy policy — both shipped together in the install commit.

## Troubleshooting

**Clarity dashboard shows no traffic after deploy:**

1. Visit `https://reanalyzr.com/`
2. Open browser DevTools → Network tab → search for `clarity.ms`
3. If no request: env var isn't set on Render, or build cache is stale (redeploy with cache cleared)
4. If request present but dashboard empty: wait 5–10 minutes; first events take a moment to register

**Session recordings show form field contents:**

Strict masking isn't enabled in the dashboard. See "Required dashboard setup" above.

**Marketing page content is masked in recordings:**

The page is missing the `data-clarity-unmask="True"` attribute on its root container. Currently applied to `LandingPage`, `BlogListPage`, `BlogPostPage`, `SampleAnalysisPage`. Add it to any other page that should be visible.
