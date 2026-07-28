/**
 * tosVersions — Task #78 (2026-06-18).
 *
 * Single source of truth for the current Terms of Service + Privacy
 * Policy versions, and which versions carry MATERIAL changes that
 * require affirmative re-consent from existing users on next login.
 *
 * Why this exists: when ToS gets updated to include arbitration,
 * class action waiver, pricing-model changes, or dispute resolution
 * shifts, browsewrap ("by continuing you agree") is increasingly
 * struck down by courts. Material changes need clickwrap — affirmative
 * acceptance — to bind users. The login endpoint compares User.
 * termsVersion against CURRENT_TOS_VERSION; if the user's version is
 * older and the diff includes a material change, return
 * `requiresReconsent: true` and the frontend forces a modal.
 *
 * Bump CURRENT_TOS_VERSION when actually updating the ToS document.
 * Add the new entry to MATERIAL_VERSION_HISTORY with material:true
 * only when the rewrite includes a "material" change as defined in
 * the ToS §7 ("dispute resolution, arbitration, pricing model, data
 * sharing, or liability").
 */

export const CURRENT_TOS_VERSION = '2026-07-27';

export const CURRENT_PRIVACY_VERSION = '2026-07-27';

/**
 * Material vs non-material flag per ToS version. Used by the login
 * endpoint: if the user's stored version is older than the latest
 * MATERIAL version, they need to re-accept before continuing.
 *
 * Non-material updates (typo fixes, formatting, contact info changes)
 * silently update via the next page-load — no re-consent prompt.
 *
 * Each entry should be added when the corresponding version ships.
 * Ordered chronologically.
 */
export const TOS_VERSION_HISTORY: Array<{
  version: string;
  material: boolean;
  summary: string;
}> = [
  {
    version: '2025-10-30',
    material: true,
    summary: 'Initial ToS for the 2.0 platform.',
  },
  {
    version: '2026-07-27',
    material: true,
    summary:
      'Full ToS + Privacy Policy rewrite to attorney redline. ToS ' +
      'architectural rebuild: 28 sections replacing 20 (removed old ' +
      'website-template §1-9, added SaaS contract structure). New ' +
      'provisions include binding individual arbitration (AAA Consumer ' +
      'Rules), class-action and jury-trial waiver, 30-day arbitration ' +
      'opt-out, small-claims carve-out, informal dispute-resolution ' +
      'notice period, $100/12-mo-fees liability cap, narrowed ' +
      'indemnification (third-party claims only, not first-party ' +
      'consumer losses), acceptable-use section (housing/lending/' +
      'fair-housing prohibitions), user-content license, feedback ' +
      'license, suspension and termination with pro-rata refund, ' +
      'consolidated Deal Quality Score / no-professional-advice / ' +
      'assumption-of-risk disclaimers. Pricing model already stated as ' +
      'pay-per-deal ($4.99/property, 180-day window, no subscription, ' +
      'no auto-renewal). Privacy Policy rewritten in same batch ' +
      '(categories restructured; 18+ age gate; DNT statement corrected; ' +
      'Stripe disclosure added; Clarity mask caveat softened; ' +
      'AI-processing section expanded). Visible amber TODOs remain for ' +
      'LLC legal name, mailing address, legal notice email, court ' +
      'venue county, cookie settings link, CCPA sale/share election — ' +
      'to be resolved with counsel before production deploy.',
  },
];

/**
 * Returns true when the user's termsVersion is older than any material
 * version in history. False if the user has accepted the most recent
 * material version (even if they predate non-material patches).
 */
export function requiresReconsent(userTermsVersion: string | undefined): boolean {
  if (!userTermsVersion) return true;
  // Find the latest material version.
  const latestMaterial = [...TOS_VERSION_HISTORY]
    .filter((v) => v.material)
    .sort((a, b) => (a.version > b.version ? -1 : 1))[0];
  if (!latestMaterial) return false;
  return userTermsVersion < latestMaterial.version;
}
