/**
 * Free-beta billing switch.
 *
 * Task: free-mode production launch of reanalyzr-2.0 (2026-08-30).
 *
 * WHY THIS EXISTS
 * ───────────────
 *
 *   Stripe is dark until the LLC's registered-agent paperwork clears the
 *   state and counsel signs off on the ToS. We still want 2.0 in front of
 *   users. Rather than bypassing the paywall — which would mean touching
 *   every enforcement point in routes/chat.ts, the license-status
 *   controller, and the workspace gate — we SATISFY it: while billing is
 *   off, every property a signed-in user analyzes gets a real DealLicense
 *   at pricePaidCents: 0, issued through the existing promo-credit path.
 *
 *   Consequences, all deliberate:
 *
 *     - Zero enforcement points change. Licensed users already bypass the
 *       Model #6 chat cap (routes/chat.ts computeChatCapAfterLastScore
 *       step 6) and pass assertLicenseAllowsMutation.
 *     - Zero frontend changes. GET /api/deals/:id/license returns a real
 *       active license, so the D2 unlock landing never renders.
 *     - Anonymous users still hit the SIGNUP wall. They have no userId,
 *       so no grant happens, so the cap fires and returns
 *       chat_cap_reached_signup — the auth modal, not a payment prompt.
 *       That's the intended acquisition mechanism, preserved for free.
 *     - Turning billing back on is a config flip. Grants stop; licenses
 *       already issued run out their window instead of dying at a cliff.
 *
 * DEFAULT IS ENABLED
 * ──────────────────
 *
 *   Defaults to true so dev, test, and CI exercise the real paid flow.
 *   Only production sets BILLING_ENABLED=false, and only until Stripe
 *   goes live.
 */

/**
 * True when the paid flow is live. False during the free beta.
 *
 * Read at CALL time, not module init. The value is fixed for the life of
 * the process in production (Render restarts on an env change), so this
 * costs nothing there — but it lets tests exercise both branches without
 * resetting the module registry, which would re-run Mongoose model
 * registration and blow up.
 */
export function isBillingEnabled(): boolean {
  return (process.env.BILLING_ENABLED ?? 'true').toLowerCase() === 'true';
}

/**
 * License window (days) applied to free-beta grants.
 *
 * Deliberately shorter than the paid 180-day window so free access
 * doesn't overhang six months past the day billing switches on. Passed
 * explicitly as `windowDays` — which wins over DEAL_LICENSE_WINDOW_DAYS
 * in LicenseRepository.purchaseLicense — so later paid licenses still
 * get the full 180.
 */
export const FREE_BETA_LICENSE_WINDOW_DAYS = 60;
